---
sidebar_position: 1
title: Hetzner Cloud Deployment
description: Step-by-step guide to deploy OpenTalk on Hetzner Cloud
---

# Deploying OpenTalk on Hetzner Cloud

This guide provides detailed instructions for deploying OpenTalk on Hetzner Cloud servers. Hetzner Cloud offers an excellent price-to-performance ratio for hosting OpenTalk instances.

:::info Official Documentation
This guide complements the official [OpenTalk Setup Repository](https://gitlab.opencode.de/opentalk/ot-setup) documentation, focusing specifically on Hetzner Cloud deployment scenarios.
:::

## Server Requirements

For a production OpenTalk deployment, we recommend the following minimum specifications:

| Component      | Minimum            | Recommended        | High-traffic         |
|----------------|--------------------|--------------------|----------------------|
| CPU            | 4 vCPUs (CX21)     | 8 vCPUs (CX31)     | 16+ vCPUs (CX41+)    |
| RAM            | 8 GB               | 16 GB              | 32+ GB               |
| Storage        | 80 GB              | 160 GB             | 240+ GB              |
| Network        | 20 TB included     | 20 TB included     | 20 TB included       |

For smaller deployments or testing, a CX21 (4 vCPUs, 8 GB RAM) can be sufficient. For production environments with more than 10 concurrent video sessions, consider CX31 or higher.

## Step 1: Create a Hetzner Cloud Server

1. Sign up or log in to your [Hetzner Cloud Console](https://console.hetzner.cloud/)
2. Click "Add Server" and select your preferred options:
   - **Location**: Choose a location close to your users (e.g., Nuremberg, Helsinki, Ashburn)
   - **Image**: Ubuntu 22.04 or 24.04
   - **Type**: Select based on your requirements (CX21, CX31, etc.)
   - **SSH Key**: Add your SSH key for secure access
   - **Name**: Choose a descriptive name for your server
3. Click "Create & Buy Now"

## Step 2: Set Up DNS Records

Before proceeding, set up the following DNS records for your domain. In this example, we'll use `example.com` as the domain name:

| Type  | Name                 | Value/Target        | Purpose                    |
|-------|----------------------|--------------------|----------------------------|
| A     | example.com          | Your server's IP   | Main domain                |
| CNAME | accounts.example.com | example.com        | Keycloak authentication    |
| CNAME | api.example.com      | example.com        | Controller API             |
| CNAME | livekit.example.com  | example.com        | WebRTC media server        |
| CNAME | minio.example.com    | example.com        | Object storage             |
| CNAME | pad.example.com      | example.com        | Etherpad (optional)        |
| CNAME | whiteboard.example.com | example.com      | Whiteboard (optional)      |
| CNAME | recordings.example.com | example.com      | Recordings (optional)      |
| CNAME | terdoc.example.com   | example.com        | Document viewer (optional) |
| SRV   | _sip._udp.example.com | 10 10 5060 sip.example.com | SIP service (if using phone integration) |

## Step 3: Initial Server Setup

Connect to your server via SSH:

```bash
ssh root@your_server_ip
```

Update the system and install required packages:

```bash
# Update system packages
apt update && apt upgrade -y

# Install essential tools
apt install -y apt-transport-https ca-certificates curl software-properties-common gnupg lsb-release git nano ufw
```

## Step 4: Set Up Firewall

Configure the firewall to allow necessary traffic:

```bash
# Set default policies
ufw default deny incoming
ufw default allow outgoing

# Allow SSH
ufw allow ssh

# Allow HTTP/HTTPS
ufw allow 80/tcp
ufw allow 443/tcp

# Allow WebRTC UDP ports
ufw allow 20000:40000/udp

# Enable the firewall
ufw enable
```

Confirm that you want to enable the firewall when prompted.

## Step 5: Install Docker and Docker Compose

```bash
# Add Docker's official GPG key
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | gpg --dearmor -o /usr/share/keyrings/docker-archive-keyring.gpg

# Add Docker repository
echo "deb [arch=$(dpkg --print-architecture) signed-by=/usr/share/keyrings/docker-archive-keyring.gpg] https://download.docker.com/linux/ubuntu $(lsb_release -cs) stable" | tee /etc/apt/sources.list.d/docker.list > /dev/null

# Update package database and install Docker
apt update
apt install -y docker-ce docker-ce-cli containerd.io docker-compose-plugin

# Verify installation
docker --version
docker compose version
```

## Step 6: Install Nginx and Certbot for SSL

```bash
# Install Nginx
apt install -y nginx

# Install Certbot
apt install -y certbot python3-certbot-nginx

# Start and enable Nginx
systemctl start nginx
systemctl enable nginx
```

## Step 7: Set Up SSL Certificates

```bash
# Obtain SSL certificates for all domains
certbot --nginx -d example.com -d accounts.example.com -d api.example.com -d livekit.example.com -d minio.example.com -d pad.example.com -d whiteboard.example.com -d recordings.example.com -d terdoc.example.com
```

Follow the prompts to complete the certificate issuance. When asked if you want to redirect HTTP traffic to HTTPS, select "2" to enable redirection.

## Step 8: Clone the OpenTalk Setup Repository

```bash
# Clone the repository
git clone https://gitlab.opencode.de/opentalk/ot-setup.git
cd ot-setup
```

## Step 9: Generate Secure Secrets

```bash
# Make the script executable
chmod +x extras/gen-secrets.sh

# Generate secrets and save to .env file
./extras/gen-secrets.sh > .env
```

## Step 10: Configure Environment Variables

Edit the `.env` file to set your domain and other configuration options:

```bash
# Open the .env file for editing
nano .env
```

Update the following key settings:

```ini
# Domain settings
OT_DOMAIN=example.com
KC_HOSTNAME=accounts.${OT_DOMAIN}
OT_CONTROLLER=api.${OT_DOMAIN}
OT_LIVEKIT=livekit.${OT_DOMAIN}
OT_WHITEBOARD=whiteboard.${OT_DOMAIN}
OT_PAD=pad.${OT_DOMAIN}

# Feature flags - Enable the features you need
FEATURE_USER_SEARCH=true
FEATURE_TIMER=true
FEATURE_WHITEBOARD=true
FEATURE_PROTOCOL=true
FEATURE_RECORDING=false
FEATURE_SHARED_FOLDER=false
WAITING_ROOM_DEFAULT_VALUE=false

# Service profiles - Add the services you want to enable
COMPOSE_PROFILES=core,whiteboard,pad
```

Save and exit (Ctrl+X, then Y, then Enter).

## Step 11: Configure OpenTalk Components

### Controller Configuration

```bash
# Create config directory if it doesn't exist
mkdir -p config

# Copy the sample controller configuration
cp extras/opentalk-samples/controller.toml.sample config/controller.toml

# Edit the controller configuration
nano config/controller.toml
```

Update these essential sections:

```toml
[http]
cors.allowed_origin = ["https://example.com"]

[keycloak]
base_url = "https://accounts.example.com/auth"
realm = "opentalk"
client_id = "OtBackend"
client_secret = "${KEYCLOAK_CLIENT_SECRET_CONTROLLER}"

[livekit]
public_url = "https://livekit.example.com"
service_url = "http://livekit:7880"
api_key = "controller"
api_secret = "${LIVEKIT_KEYS_API_SECRET}"

# Configure TURN servers for WebRTC
[turn]
lifetime = 86400

[[turn.servers]]
uris = [
    "turn:livekit.example.com:3478?transport=udp",
    "turn:livekit.example.com:3478?transport=tcp",
    "turns:livekit.example.com:5349?transport=tcp"
]
pre_shared_key = "${TURN_PRE_SHARED_KEY}"

[stun]
uris = ["stun:livekit.example.com:3478"]
```

If you're enabling additional services like Etherpad or Whiteboard, configure those sections as well:

```toml
[etherpad]
url = "http://pad:9001"
api_key = "${ETHERPAD_API_KEY}"

[spacedeck]
url = "http://whiteboard:9666"
api_key = "${SPACEDECK_API_TOKEN}"
```

Save and exit.

## Step 12: Configure Nginx as Reverse Proxy

### Create SSL Settings Snippet

```bash
# Create directory for snippets if it doesn't exist
mkdir -p /etc/nginx/snippets

# Create SSL settings file
nano /etc/nginx/snippets/ssl-settings.conf
```

Add the following content:

```nginx
ssl_session_timeout 1d;
ssl_session_cache shared:SSL:50m;
ssl_session_tickets off;

ssl_protocols TLSv1.2 TLSv1.3;
ssl_ciphers ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES128-GCM-SHA256:ECDHE-ECDSA-AES256-GCM-SHA384:ECDHE-RSA-AES256-GCM-SHA384:ECDHE-ECDSA-CHACHA20-POLY1305:ECDHE-RSA-CHACHA20-POLY1305;
ssl_prefer_server_ciphers off;

add_header Strict-Transport-Security "max-age=63072000" always;

ssl_stapling on;
ssl_stapling_verify on;
```

### Create Main Nginx Configuration

```bash
# Remove default configuration
rm /etc/nginx/sites-enabled/default

# Create configuration for OpenTalk
nano /etc/nginx/sites-available/opentalk.conf
```

Add the following content, replacing `example.com` with your actual domain:

```nginx
# Main Frontend
server {
    listen 443 ssl http2;
    server_name example.com;
    
    ssl_certificate /etc/letsencrypt/live/example.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/example.com/privkey.pem;
    include /etc/nginx/snippets/ssl-settings.conf;
    
    client_max_body_size 100M;
    
    location / {
        proxy_pass http://localhost:8080;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
    }
}

# Controller API
server {
    listen 443 ssl http2;
    server_name api.example.com;
    
    ssl_certificate /etc/letsencrypt/live/api.example.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/api.example.com/privkey.pem;
    include /etc/nginx/snippets/ssl-settings.conf;
    
    client_max_body_size 1G;
    
    location / {
        proxy_pass http://localhost:8090;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
    }
}

# Keycloak
server {
    listen 443 ssl http2;
    server_name accounts.example.com;
    
    ssl_certificate /etc/letsencrypt/live/accounts.example.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/accounts.example.com/privkey.pem;
    include /etc/nginx/snippets/ssl-settings.conf;
    
    location / {
        proxy_pass http://localhost:8087;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}

# LiveKit
server {
    listen 443 ssl http2;
    server_name livekit.example.com;
    
    ssl_certificate /etc/letsencrypt/live/livekit.example.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/livekit.example.com/privkey.pem;
    include /etc/nginx/snippets/ssl-settings.conf;
    
    location / {
        proxy_pass http://localhost:7880;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        
        proxy_read_timeout 300s;
        proxy_send_timeout 300s;
    }
}
```

If you've enabled optional services like Whiteboard or Etherpad, add configuration blocks for them as well:

```nginx
# Whiteboard
server {
    listen 443 ssl http2;
    server_name whiteboard.example.com;
    
    ssl_certificate /etc/letsencrypt/live/whiteboard.example.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/whiteboard.example.com/privkey.pem;
    include /etc/nginx/snippets/ssl-settings.conf;
    
    location / {
        proxy_pass http://localhost:9666;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
    }
}

# Etherpad
server {
    listen 443 ssl http2;
    server_name pad.example.com;
    
    ssl_certificate /etc/letsencrypt/live/pad.example.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/pad.example.com/privkey.pem;
    include /etc/nginx/snippets/ssl-settings.conf;
    
    location / {
        proxy_pass http://localhost:9001;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
    }
}
```

Enable the configuration and test Nginx:

```bash
# Enable the configuration
ln -s /etc/nginx/sites-available/opentalk.conf /etc/nginx/sites-enabled/

# Test Nginx configuration
nginx -t

# Reload Nginx if the test is successful
systemctl reload nginx
```

## Step 13: Start OpenTalk Services

```bash
# Navigate to the OpenTalk setup directory
cd ~/ot-setup

# Start the services
docker compose up -d
```

This will start all the core services and any additional services you've enabled in your COMPOSE_PROFILES setting.

## Step 14: Configure Keycloak

1. Access Keycloak at `https://accounts.example.com/`
2. Log in with the admin credentials from your `.env` file (look for `KEYCLOAK_ADMIN_PASSWORD`)
3. Create a new realm named "opentalk"
4. Create the necessary clients:
   - `OtBackend` for the controller
   - Additional clients if you've enabled services like obelisk or recorder

## Step 15: Create Test Users

In Keycloak:

1. Go to "Users" in your "opentalk" realm
2. Click "Add user"
3. Fill in the details and save
4. Go to the "Credentials" tab
5. Set a password for the user

## Step 16: Test Your Installation

Access your OpenTalk instance at `https://example.com`. You should be redirected to Keycloak for authentication. After logging in, you'll be able to create and join meetings.

## Hetzner-Specific Optimizations

### Volume Storage

For larger installations, consider using Hetzner Block Storage instead of local storage:

```bash
# Create a Block Storage volume in the Hetzner Cloud Console
# Attach it to your server
# Format and mount the volume

# Example: Format the volume
mkfs.ext4 /dev/disk/by-id/scsi-0HC_Volume_12345678

# Mount the volume
mkdir -p /mnt/data
mount /dev/disk/by-id/scsi-0HC_Volume_12345678 /mnt/data

# Add to fstab for persistence
echo "/dev/disk/by-id/scsi-0HC_Volume_12345678 /mnt/data ext4 defaults,nofail 0 0" >> /etc/fstab

# Move data directories to the volume
mv ~/ot-setup/data /mnt/data/opentalk
ln -s /mnt/data/opentalk ~/ot-setup/data
```

### Networking Performance

Hetzner Cloud servers come with excellent network connectivity. To optimize for WebRTC traffic:

1. Ensure you've opened UDP ports 20000-40000 in your firewall
2. Configure proper TURN servers in your controller.toml file
3. Consider setting up CloudFlare Argo Tunnel for additional security and performance

### Resource Monitoring

Set up basic monitoring to keep track of your server's resources:

```bash
# Install monitoring tools
apt install -y htop iotop

# Monitor system resources
htop

# Monitor disk I/O
iotop
```

For more comprehensive monitoring, consider setting up Prometheus and Grafana:

```bash
# Create a directory for Docker Compose monitoring
mkdir -p ~/monitoring
cd ~/monitoring

# Create a Docker Compose file for monitoring
nano docker-compose.yml
```

Add the following content:

```yaml
version: '3'

services:
  prometheus:
    image: prom/prometheus
    volumes:
      - ./prometheus.yml:/etc/prometheus/prometheus.yml
    ports:
      - "9090:9090"
    restart: unless-stopped

  grafana:
    image: grafana/grafana
    ports:
      - "3000:3000"
    volumes:
      - grafana-data:/var/lib/grafana
    restart: unless-stopped
    depends_on:
      - prometheus

  node-exporter:
    image: prom/node-exporter
    command:
      - '--path.procfs=/host/proc'
      - '--path.sysfs=/host/sys'
    volumes:
      - /proc:/host/proc:ro
      - /sys:/host/sys:ro
    ports:
      - "9100:9100"
    restart: unless-stopped

volumes:
  grafana-data:
```

Create a Prometheus configuration file:

```bash
nano prometheus.yml
```

Add the following content:

```yaml
global:
  scrape_interval: 15s

scrape_configs:
  - job_name: 'node-exporter'
    static_configs:
      - targets: ['node-exporter:9100']
```

Start the monitoring stack:

```bash
docker compose up -d
```

Access Grafana at `http://your-server-ip:3000` (default credentials: admin/admin).

## Maintenance and Backup

### Automated Backups

Set up a simple backup script for your OpenTalk data:

```bash
nano ~/backup.sh
```

Add the following content:

```bash
#!/bin/bash

# Configuration
BACKUP_DIR="/root/backups"
DAYS_TO_KEEP=7
OT_DIR="/root/ot-setup"

# Ensure backup directory exists
mkdir -p $BACKUP_DIR

# Timestamp for backup files
TIMESTAMP=$(date +%Y%m%d%H%M%S)

# Stop services
cd $OT_DIR
docker compose down

# Backup data directories
tar -czf $BACKUP_DIR/opentalk_data_$TIMESTAMP.tar.gz -C $OT_DIR data

# Backup PostgreSQL database
docker run --rm -v $OT_DIR/data/pg_data:/var/lib/postgresql/data \
  -v $BACKUP_DIR:/backups postgres:13-alpine \
  sh -c "pg_dump -U ot opentalk > /backups/opentalk_db_$TIMESTAMP.sql"

# Backup configuration
tar -czf $BACKUP_DIR/opentalk_config_$TIMESTAMP.tar.gz -C $OT_DIR config .env docker-compose.yml

# Restart services
docker compose up -d

# Delete old backups
find $BACKUP_DIR -name "opentalk_data_*.tar.gz" -type f -mtime +$DAYS_TO_KEEP -delete
find $BACKUP_DIR -name "opentalk_db_*.sql" -type f -mtime +$DAYS_TO_KEEP -delete
find $BACKUP_DIR -name "opentalk_config_*.tar.gz" -type f -mtime +$DAYS_TO_KEEP -delete

echo "Backup completed at $(date)"
```

Make the script executable and set up a cron job:

```bash
chmod +x ~/backup.sh

# Edit crontab to run daily at 2 AM
crontab -e
```

Add the following line:

```
0 2 * * * /root/backup.sh >> /var/log/opentalk-backup.log 2>&1
```

### Updating OpenTalk

To update OpenTalk to a newer version:

```bash
# Navigate to the OpenTalk setup directory
cd ~/ot-setup

# Back up your configuration
cp -r config config.bak
cp .env .env.bak

# Pull the latest changes
git pull

# Pull the latest images
docker compose pull

# Restart services
docker compose down
docker compose up -d
```

## Troubleshooting

### Check Service Status

```bash
# Check Docker container status
docker compose ps

# View logs for a specific service
docker compose logs -f controller
```

### Common Issues

1. **SSL Certificate Issues**:
   ```bash
   # Renew certificates
   certbot renew
   ```

2. **Database Connection Errors**:
   ```bash
   # Check PostgreSQL logs
   docker compose logs postgres
   
   # Verify database connection
   docker compose exec -it postgres psql -U ot -d opentalk -c "SELECT 1"
   ```

3. **WebRTC Connectivity Issues**:
   ```bash
   # Check LiveKit logs
   docker compose logs livekit
   
   # Verify UDP port connectivity
   nc -vuz livekit.example.com 3478
   ```

4. **Insufficient Resources**:
   ```bash
   # Check system resources
   htop
   
   # Check disk space
   df -h
   ```

## Scaling Up

As your OpenTalk installation grows, you might need to scale up your infrastructure:

1. **Upgrade to a larger server**: Hetzner Cloud makes it easy to upgrade to a server with more resources.
2. **Split components across multiple servers**: For very large deployments, consider running LiveKit, PostgreSQL, or Keycloak on separate servers.
3. **Use a dedicated TURN server**: For improved WebRTC connectivity.
4. **Implement load balancing**: For high-availability deployments.

## Conclusion

You now have a fully functional OpenTalk installation running on Hetzner Cloud. This setup is suitable for small to medium-sized organizations. For larger deployments, consider the scaling options mentioned above.

Remember to regularly:
- Monitor system resources
- Back up your data
- Keep your software updated
- Check the logs for any issues

For further assistance, refer to the [OpenTalk community documentation](https://opencloud-community.github.io/ot-docs-community/) or reach out to the OpenTalk community.