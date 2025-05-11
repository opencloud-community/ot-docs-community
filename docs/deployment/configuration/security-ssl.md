---
sidebar_position: 2
title: Security & SSL Configuration
description: Security best practices and SSL/TLS configuration for OpenTalk
---

# Security & SSL Configuration

This guide covers security best practices, secrets management, and SSL/TLS configuration for your OpenTalk deployment.

:::info Official Documentation
This guide complements the official [OpenTalk Setup Repository](https://gitlab.opencode.de/opentalk/ot-setup) documentation. While the official docs cover all configuration options, this guide focuses on practical security aspects.
:::

## Managing Secrets Securely

OpenTalk requires several secure secrets for various components. This section explains how to generate and manage these secrets securely.

### Using the Secrets Generation Script

The `ot-setup` repository includes a script to generate secure random secrets:

```bash
# Make the script executable
chmod +x extras/gen-secrets.sh

# Generate secrets and save to .env file
./extras/gen-secrets.sh > .env

# Add your domain settings to the .env file
nano .env
```

The script generates the following secrets:

1. `POSTGRES_PASSWORD` - PostgreSQL database password
2. `KEYCLOAK_ADMIN_PASSWORD` - Keycloak admin password
3. `KEYCLOAK_CLIENT_SECRET_CONTROLLER` - Controller OAuth client secret
4. `KEYCLOAK_CLIENT_SECRET_OBELISK` - Obelisk OAuth client secret 
5. `KEYCLOAK_CLIENT_SECRET_RECORDER` - Recorder OAuth client secret
6. `SPACEDECK_API_TOKEN` - Whiteboard service API token
7. `SPACEDECK_INVITE_CODE` - Whiteboard invite code
8. `ETHERPAD_API_KEY` - Etherpad API key
9. `LIVEKIT_KEYS_API_SECRET` - LiveKit WebRTC server secret

### Manual Secret Generation

If you prefer to generate secrets manually, you can use these commands:

```bash
# Generate a random 32-character password
openssl rand -base64 24

# Alternative method
head -c 24 /dev/urandom | base64
```

### Secrets Management Best Practices

1. **Never commit secrets to version control**
   - The `.env` file should be in `.gitignore`
   - Use `env.sample` as a template only

2. **Use environment variables for secrets**
   - Docker Compose loads them from the `.env` file
   - Service configurations can reference them with `${VARIABLE_NAME}` syntax

3. **Restrict access to secret files**
   - Set proper file permissions: `chmod 600 .env`
   - Limit server access to authorized personnel only

4. **Implement secret rotation**
   - Periodically generate new secrets
   - Update all services to use the new secrets

5. **Consider a secrets manager for production**
   - HashiCorp Vault
   - Docker Swarm secrets
   - Cloud provider secret management services

## SSL/TLS Configuration

For production deployments, SSL/TLS encryption is essential. This section covers how to configure HTTPS for your OpenTalk services.

### Using Let's Encrypt with Certbot

Let's Encrypt provides free SSL certificates that can be automatically renewed. Here's how to set it up:

```bash
# Install certbot
apt-get update
apt-get install certbot python3-certbot-nginx

# Obtain certificates for all domains
certbot --nginx -d example.com -d accounts.example.com -d controller.example.com -d livekit.example.com -d whiteboard.example.com -d pad.example.com
```

### Manual SSL Certificate Installation

If you have certificates from another provider:

1. Place your certificates in a secure location (e.g., `/etc/ssl/private/`)
2. Configure your NGINX server to use them

### NGINX SSL Configuration

Sample secure SSL configuration for NGINX:

```nginx
# SSL configuration for OpenTalk services
ssl_certificate /etc/letsencrypt/live/example.com/fullchain.pem;
ssl_certificate_key /etc/letsencrypt/live/example.com/privkey.pem;
ssl_session_timeout 1d;
ssl_session_cache shared:SSL:50m;
ssl_session_tickets off;

# Modern SSL configuration
ssl_protocols TLSv1.2 TLSv1.3;
ssl_ciphers ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES128-GCM-SHA256:ECDHE-ECDSA-AES256-GCM-SHA384:ECDHE-RSA-AES256-GCM-SHA384:ECDHE-ECDSA-CHACHA20-POLY1305:ECDHE-RSA-CHACHA20-POLY1305:DHE-RSA-AES128-GCM-SHA256:DHE-RSA-AES256-GCM-SHA384;
ssl_prefer_server_ciphers off;

# HSTS (comment out if not needed)
add_header Strict-Transport-Security "max-age=63072000" always;

# OCSP Stapling
ssl_stapling on;
ssl_stapling_verify on;
```

A sample NGINX configuration file (`sslsettings.conf.sample`) is provided in the `extras/nginx-samples/` directory that you can include in your service configurations.

## Securing Individual Services

### Frontend (Web UI)

```nginx
server {
    listen 443 ssl http2;
    server_name example.com;
    
    include /etc/nginx/sslsettings.conf;
    
    location / {
        proxy_pass http://localhost:8080;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

### Keycloak

```nginx
server {
    listen 443 ssl http2;
    server_name accounts.example.com;
    
    include /etc/nginx/sslsettings.conf;
    
    location / {
        proxy_pass http://localhost:8087;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

### Controller API

```nginx
server {
    listen 443 ssl http2;
    server_name controller.example.com;
    
    include /etc/nginx/sslsettings.conf;
    
    location / {
        proxy_pass http://localhost:8090;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

### LiveKit WebRTC

```nginx
server {
    listen 443 ssl http2;
    server_name livekit.example.com;
    
    include /etc/nginx/sslsettings.conf;
    
    location / {
        proxy_pass http://localhost:7880;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        
        # WebSocket support
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
    }
}
```

## Firewalls and Network Security

### Required Open Ports

For OpenTalk to function properly, these ports should be open:

1. **TCP Ports**:
   - 80/443: HTTP/HTTPS (Web UI, API, authentication)
   - 5432: PostgreSQL (internal only)
   - 5672: RabbitMQ (internal only)
   - 7880: LiveKit HTTP API (internal only)
   - 7881: LiveKit TCP signaling (if needed)

2. **UDP Ports**:
   - 20000-40000: WebRTC media (required for audio/video)

### Firewall Configuration

Example UFW (Uncomplicated Firewall) configuration:

```bash
# Allow SSH
ufw allow 22/tcp

# Allow HTTP/HTTPS
ufw allow 80/tcp
ufw allow 443/tcp

# Allow WebRTC UDP ports
ufw allow 20000:40000/udp

# Enable the firewall
ufw enable
```

### Network Isolation

For production deployments, consider:

1. Using internal Docker networks for service-to-service communication
2. Implementing network segmentation to isolate components
3. Using a reverse proxy (like NGINX) to expose only necessary services

## Security Monitoring and Hardening

### Monitoring for Security Issues

1. **Enable logging**:
   ```toml
   [logging]
   default_directives = [
     "pinky_swear=OFF",
     "rustls=WARN",
     "mio=ERROR",
     "lapin=WARN",
   ]
   ```

2. **Monitor authentication attempts** in Keycloak logs

3. **Check container health** regularly:
   ```bash
   docker compose ps
   docker compose logs -f
   ```

### Container Security

1. **Keep images updated**:
   ```bash
   docker compose pull
   docker compose up -d
   ```

2. **Limit container capabilities** in production environments

3. **Use non-root users** where possible

## Regular Security Maintenance

1. **Update software regularly**:
   ```bash
   git pull
   docker compose pull
   docker compose up -d
   ```

2. **Rotate secrets periodically**:
   - Generate new secrets with `./extras/gen-secrets.sh`
   - Update the `.env` file
   - Restart services: `docker compose down && docker compose up -d`

3. **Check for security advisories** for OpenTalk components

4. **Test backups** to ensure you can recover from incidents