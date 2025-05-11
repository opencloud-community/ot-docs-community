---
sidebar_position: 3
title: NGINX Reverse Proxy Setup
description: Setting up NGINX as a reverse proxy for OpenTalk services
---

# NGINX Reverse Proxy Setup

This guide explains how to configure NGINX as a reverse proxy for your OpenTalk deployment, which is essential for production environments.

:::info Official Documentation
This guide complements the official [OpenTalk Setup Repository](https://gitlab.opencode.de/opentalk/ot-setup) documentation. Sample NGINX configurations are available in the `extras/nginx-samples/` directory of that repository.
:::

## Why Use NGINX with OpenTalk?

Using NGINX as a reverse proxy provides several benefits:

1. **SSL/TLS termination** - NGINX handles HTTPS encryption
2. **Load balancing** - Distribute traffic across multiple instances
3. **Security** - Additional layer of protection for backend services
4. **Performance** - Caching and compression improve speed
5. **Single entry point** - Unified access to multiple services

## Prerequisites

Before configuring NGINX:

1. Install NGINX on your server:
   ```bash
   # For Ubuntu/Debian
   apt-get update
   apt-get install nginx
   
   # For CentOS/RHEL
   dnf install nginx
   ```

2. Obtain SSL certificates (e.g., using Let's Encrypt):
   ```bash
   apt-get install certbot python3-certbot-nginx
   certbot --nginx -d example.com -d accounts.example.com -d controller.example.com -d livekit.example.com
   ```

3. Start your OpenTalk services via Docker Compose

## Basic NGINX Configuration Structure

NGINX configuration for OpenTalk consists of:

1. **Server blocks** - One for each service/subdomain
2. **SSL configuration** - Shared settings for HTTPS
3. **Proxy settings** - Forwarding requests to Docker services

Create configuration files in `/etc/nginx/sites-available/` and link them to `/etc/nginx/sites-enabled/`.

## Shared SSL Configuration

Create a shared SSL settings file for consistent security:

```bash
# Create a directory for shared configuration snippets
mkdir -p /etc/nginx/snippets

# Create the SSL settings file
nano /etc/nginx/snippets/ssl-settings.conf
```

Add the following content:

```nginx
# SSL configuration
ssl_session_timeout 1d;
ssl_session_cache shared:SSL:50m;
ssl_session_tickets off;

# Modern SSL configuration
ssl_protocols TLSv1.2 TLSv1.3;
ssl_ciphers ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES128-GCM-SHA256:ECDHE-ECDSA-AES256-GCM-SHA384:ECDHE-RSA-AES256-GCM-SHA384:ECDHE-ECDSA-CHACHA20-POLY1305:ECDHE-RSA-CHACHA20-POLY1305:DHE-RSA-AES128-GCM-SHA256:DHE-RSA-AES256-GCM-SHA384;
ssl_prefer_server_ciphers off;

# HSTS (Strict Transport Security)
add_header Strict-Transport-Security "max-age=63072000" always;

# OCSP Stapling
ssl_stapling on;
ssl_stapling_verify on;
```

## Web Frontend Configuration

Create a configuration file for the main web interface:

```bash
nano /etc/nginx/sites-available/opentalk-frontend.conf
```

Add the following content:

```nginx
server {
    listen 80;
    server_name example.com;
    
    # Redirect HTTP to HTTPS
    location / {
        return 301 https://$host$request_uri;
    }
    
    # Let's Encrypt verification
    location /.well-known/acme-challenge/ {
        root /var/www/letsencrypt;
    }
}

server {
    listen 443 ssl http2;
    server_name example.com;
    
    # SSL certificate configuration
    ssl_certificate /etc/letsencrypt/live/example.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/example.com/privkey.pem;
    
    # Include shared SSL settings
    include /etc/nginx/snippets/ssl-settings.conf;
    
    # Logging
    access_log /var/log/nginx/opentalk-frontend-access.log;
    error_log /var/log/nginx/opentalk-frontend-error.log;
    
    # Proxy settings
    location / {
        proxy_pass http://localhost:8080;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        
        # WebSocket support
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        
        # Proxy buffer settings
        proxy_buffer_size 8k;
        proxy_buffers 8 8k;
        proxy_busy_buffers_size 16k;
    }
}
```

## Controller API Configuration

Create a configuration file for the Controller API:

```bash
nano /etc/nginx/sites-available/opentalk-controller.conf
```

Add the following content:

```nginx
server {
    listen 80;
    server_name controller.example.com;
    
    # Redirect HTTP to HTTPS
    location / {
        return 301 https://$host$request_uri;
    }
    
    # Let's Encrypt verification
    location /.well-known/acme-challenge/ {
        root /var/www/letsencrypt;
    }
}

server {
    listen 443 ssl http2;
    server_name controller.example.com;
    
    # SSL certificate configuration
    ssl_certificate /etc/letsencrypt/live/controller.example.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/controller.example.com/privkey.pem;
    
    # Include shared SSL settings
    include /etc/nginx/snippets/ssl-settings.conf;
    
    # Logging
    access_log /var/log/nginx/opentalk-controller-access.log;
    error_log /var/log/nginx/opentalk-controller-error.log;
    
    # Large upload size for file sharing
    client_max_body_size 1G;
    
    # Proxy settings
    location / {
        proxy_pass http://localhost:8090;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        
        # WebSocket support
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        
        # Proxy buffer settings
        proxy_buffer_size 8k;
        proxy_buffers 8 8k;
        proxy_busy_buffers_size 16k;
    }
}
```

## Keycloak Authentication Configuration

Create a configuration file for Keycloak:

```bash
nano /etc/nginx/sites-available/opentalk-keycloak.conf
```

Add the following content:

```nginx
server {
    listen 80;
    server_name accounts.example.com;
    
    # Redirect HTTP to HTTPS
    location / {
        return 301 https://$host$request_uri;
    }
    
    # Let's Encrypt verification
    location /.well-known/acme-challenge/ {
        root /var/www/letsencrypt;
    }
}

server {
    listen 443 ssl http2;
    server_name accounts.example.com;
    
    # SSL certificate configuration
    ssl_certificate /etc/letsencrypt/live/accounts.example.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/accounts.example.com/privkey.pem;
    
    # Include shared SSL settings
    include /etc/nginx/snippets/ssl-settings.conf;
    
    # Logging
    access_log /var/log/nginx/opentalk-keycloak-access.log;
    error_log /var/log/nginx/opentalk-keycloak-error.log;
    
    # Proxy settings
    location / {
        proxy_pass http://localhost:8087;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        
        # Proxy buffer settings
        proxy_buffer_size 8k;
        proxy_buffers 8 8k;
        proxy_busy_buffers_size 16k;
    }
}
```

## LiveKit WebRTC Configuration

Create a configuration file for LiveKit:

```bash
nano /etc/nginx/sites-available/opentalk-livekit.conf
```

Add the following content:

```nginx
server {
    listen 80;
    server_name livekit.example.com;
    
    # Redirect HTTP to HTTPS
    location / {
        return 301 https://$host$request_uri;
    }
    
    # Let's Encrypt verification
    location /.well-known/acme-challenge/ {
        root /var/www/letsencrypt;
    }
}

server {
    listen 443 ssl http2;
    server_name livekit.example.com;
    
    # SSL certificate configuration
    ssl_certificate /etc/letsencrypt/live/livekit.example.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/livekit.example.com/privkey.pem;
    
    # Include shared SSL settings
    include /etc/nginx/snippets/ssl-settings.conf;
    
    # Logging
    access_log /var/log/nginx/opentalk-livekit-access.log;
    error_log /var/log/nginx/opentalk-livekit-error.log;
    
    # Media file size
    client_max_body_size 100M;
    
    # Proxy settings
    location / {
        proxy_pass http://localhost:7880;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        
        # WebSocket support (critical for WebRTC)
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        
        # Extended timeout for long-running WebRTC sessions
        proxy_read_timeout 300s;
        proxy_send_timeout 300s;
        
        # Proxy buffer settings
        proxy_buffer_size 8k;
        proxy_buffers 8 8k;
        proxy_busy_buffers_size 16k;
    }
}
```

## Optional Services

### Whiteboard (Spacedeck)

If you've enabled the whiteboard service:

```bash
nano /etc/nginx/sites-available/opentalk-whiteboard.conf
```

Add the following content:

```nginx
server {
    listen 80;
    server_name whiteboard.example.com;
    
    # Redirect HTTP to HTTPS
    location / {
        return 301 https://$host$request_uri;
    }
    
    # Let's Encrypt verification
    location /.well-known/acme-challenge/ {
        root /var/www/letsencrypt;
    }
}

server {
    listen 443 ssl http2;
    server_name whiteboard.example.com;
    
    # SSL certificate configuration
    ssl_certificate /etc/letsencrypt/live/whiteboard.example.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/whiteboard.example.com/privkey.pem;
    
    # Include shared SSL settings
    include /etc/nginx/snippets/ssl-settings.conf;
    
    # Logging
    access_log /var/log/nginx/opentalk-whiteboard-access.log;
    error_log /var/log/nginx/opentalk-whiteboard-error.log;
    
    # Proxy settings
    location / {
        proxy_pass http://localhost:9666;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        
        # WebSocket support
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        
        # Proxy buffer settings
        proxy_buffer_size 8k;
        proxy_buffers 8 8k;
        proxy_busy_buffers_size 16k;
    }
}
```

### Collaborative Editor (Etherpad)

If you've enabled the collaborative editor:

```bash
nano /etc/nginx/sites-available/opentalk-pad.conf
```

Add the following content:

```nginx
server {
    listen 80;
    server_name pad.example.com;
    
    # Redirect HTTP to HTTPS
    location / {
        return 301 https://$host$request_uri;
    }
    
    # Let's Encrypt verification
    location /.well-known/acme-challenge/ {
        root /var/www/letsencrypt;
    }
}

server {
    listen 443 ssl http2;
    server_name pad.example.com;
    
    # SSL certificate configuration
    ssl_certificate /etc/letsencrypt/live/pad.example.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/pad.example.com/privkey.pem;
    
    # Include shared SSL settings
    include /etc/nginx/snippets/ssl-settings.conf;
    
    # Logging
    access_log /var/log/nginx/opentalk-pad-access.log;
    error_log /var/log/nginx/opentalk-pad-error.log;
    
    # Proxy settings
    location / {
        proxy_pass http://localhost:9001;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        
        # WebSocket support
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        
        # Proxy buffer settings
        proxy_buffer_size 8k;
        proxy_buffers 8 8k;
        proxy_busy_buffers_size 16k;
    }
}
```

## Activate the Configurations

Enable the configurations by creating symbolic links and testing NGINX:

```bash
# Create the directory for Let's Encrypt verification
mkdir -p /var/www/letsencrypt

# Create links for each configuration
ln -s /etc/nginx/sites-available/opentalk-frontend.conf /etc/nginx/sites-enabled/
ln -s /etc/nginx/sites-available/opentalk-controller.conf /etc/nginx/sites-enabled/
ln -s /etc/nginx/sites-available/opentalk-keycloak.conf /etc/nginx/sites-enabled/
ln -s /etc/nginx/sites-available/opentalk-livekit.conf /etc/nginx/sites-enabled/

# Add optional services if needed
ln -s /etc/nginx/sites-available/opentalk-whiteboard.conf /etc/nginx/sites-enabled/
ln -s /etc/nginx/sites-available/opentalk-pad.conf /etc/nginx/sites-enabled/

# Test the configuration
nginx -t

# Reload NGINX if test is successful
systemctl reload nginx
```

## Performance Optimization

For production deployments, consider these additional optimizations:

### Enable Compression

Add this to your `/etc/nginx/nginx.conf` file:

```nginx
http {
    # Existing configuration...
    
    # Enable compression
    gzip on;
    gzip_comp_level 5;
    gzip_min_length 256;
    gzip_proxied any;
    gzip_types
        application/javascript
        application/json
        application/x-javascript
        application/xml
        application/xml+rss
        text/css
        text/javascript
        text/plain
        text/xml;
}
```

### Add Browser Caching

Add this to each server block:

```nginx
# Static file caching
location ~* \.(jpg|jpeg|png|gif|ico|css|js)$ {
    proxy_pass http://localhost:8080;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
    
    # Cache settings
    expires 7d;
    add_header Cache-Control "public";
}
```

## Security Considerations

For enhanced security:

### Adding Security Headers

Add these headers to each server block:

```nginx
# Security headers
add_header X-Content-Type-Options nosniff;
add_header X-Frame-Options SAMEORIGIN;
add_header X-XSS-Protection "1; mode=block";
add_header Content-Security-Policy "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; connect-src 'self' wss://$host https://*.example.com; font-src 'self'; frame-src 'self'; frame-ancestors 'self'; media-src 'self' blob:;";
```

### IP-Based Rate Limiting

Add this to your `/etc/nginx/nginx.conf` file:

```nginx
http {
    # Existing configuration...
    
    # Rate limiting
    limit_req_zone $binary_remote_addr zone=api:10m rate=10r/s;
    
    # Other settings...
}
```

Then add this to your controller location block:

```nginx
location / {
    # Existing proxy settings...
    
    # Rate limiting
    limit_req zone=api burst=20 nodelay;
}
```

## Troubleshooting

If you encounter issues with your NGINX configuration:

1. **Check NGINX logs**:
   ```bash
   tail -f /var/log/nginx/error.log
   ```

2. **Verify ports are accessible**:
   ```bash
   curl -I http://localhost:8080
   curl -I http://localhost:8090
   ```

3. **Check SSL certificate validity**:
   ```bash
   certbot certificates
   ```

4. **Test SSL configuration**:
   ```bash
   openssl s_client -connect example.com:443 -servername example.com
   ```

5. **Common issues**:
   - Ensure Docker containers are running
   - Check that all necessary ports are published
   - Verify DNS records are correctly set up
   - Ensure firewall allows traffic on ports 80 and 443