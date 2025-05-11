---
sidebar_position: 2
title: Additional Services
description: Enabling additional services like Etherpad, Whiteboard, and more
---

# Additional Services

OpenTalk supports various additional services that extend its functionality. This guide explains how to enable and configure these optional components.

:::info Official Documentation
This guide complements the official [OpenTalk Setup Repository](https://gitlab.opencode.de/opentalk/ot-setup) documentation. While the official docs cover all configuration options, this guide focuses on practical deployment steps and common scenarios.
:::

## Service Profiles Overview

OpenTalk uses Docker Compose profiles to allow selective service startup. The core services are enabled by default, but additional services need to be explicitly enabled.

## Enabling Additional Services

To enable additional services, modify the `COMPOSE_PROFILES` environment variable in your `.env` file:

```ini
# Default core services
COMPOSE_PROFILES=core

# To enable whiteboard and pad services
COMPOSE_PROFILES=core,whiteboard,pad

# To enable all services
COMPOSE_PROFILES=core,whiteboard,pad,obelisk,smtp-mailer,recorder,redis
```

## Whiteboard (Spacedeck)

The whiteboard service provides collaborative drawing functionality for meetings.

### DNS Configuration

Add a DNS record for your whiteboard subdomain:
- `whiteboard.example.com` pointing to your server's IP address

### Environment Configuration

Add these variables to your `.env` file:

```ini
# Enable whiteboard feature flag
FEATURE_WHITEBOARD=true

# Whiteboard configuration
OT_WHITEBOARD=whiteboard.${OT_DOMAIN}
SPACEDECK_API_TOKEN=your-secure-token  # Use gen-secrets.sh to generate this
SPACEDECK_INVITE_CODE=your-invite-code  # Use gen-secrets.sh to generate this
```

### Starting the Service

```bash
# Add whiteboard to profiles
export COMPOSE_PROFILES=core,whiteboard

# Restart containers
docker compose up -d
```

### Verifying Installation

1. Access the OpenTalk web interface
2. Start a meeting
3. Click on the whiteboard icon in the toolbar
4. You should see the whiteboard interface load

## Collaborative Editor (Etherpad)

The pad service provides collaborative text editing during meetings.

### DNS Configuration

Add a DNS record for your pad subdomain:
- `pad.example.com` pointing to your server's IP address

### Environment Configuration

Add these variables to your `.env` file:

```ini
# Etherpad configuration
OT_PAD=pad.${OT_DOMAIN}
ETHERPAD_API_KEY=your-secure-api-key  # Use gen-secrets.sh to generate this
```

### Starting the Service

```bash
# Add pad to profiles
export COMPOSE_PROFILES=core,pad

# Restart containers
docker compose up -d
```

### Verifying Installation

1. Access the OpenTalk web interface
2. Start a meeting
3. Click on the notes icon in the toolbar
4. You should see the Etherpad interface load

## SIP/Telephone Integration (Obelisk)

The Obelisk service allows participants to join meetings via telephone.

### Prerequisites

- A SIP provider with credentials
- Proper network configuration for SIP traffic

### Environment Configuration

```bash
# Create obelisk config directory
mkdir -p config

# Copy sample configuration
cp extras/opentalk-samples/obelisk.toml.sample config/obelisk.toml
```

Edit the configuration file:

```bash
nano config/obelisk.toml
```

Configure your SIP provider settings:

```toml
[controller]
base_url = "http://controller:8090"
key = "example_key"

[keycloak]
base_url = "http://keycloak:8080"
realm = "opentalk"
client_id = "opentalk-obelisk"
client_secret = "${KEYCLOAK_CLIENT_SECRET_OBELISK}"

[audio_bridge]
sip_external_ip = "AUTO"  # or your server's public IP
sip_local_ip = "AUTO"     # or your server's private IP
```

### Starting the Service

```bash
# Add obelisk to profiles
export COMPOSE_PROFILES=core,obelisk

# Restart containers
docker compose up -d
```

## Email Notifications (SMTP Mailer)

The SMTP mailer service sends email notifications to users.

### Prerequisites

- SMTP server with credentials

### Environment Configuration

```bash
# Create smtp-mailer config directory
mkdir -p config

# Copy sample configuration
cp extras/opentalk-samples/smtp-mailer.toml.sample config/smtp-mailer.toml
```

Edit the configuration file:

```bash
nano config/smtp-mailer.toml
```

Configure your SMTP settings:

```toml
[rabbit_mq]
connection_string = "amqp://rabbit:${RABBITMQ_PASSWORD}@rabbit:5672"
exchange_name = "opentalk"

[smtp]
relay = "smtp.example.com"
port = 587
username = "your-smtp-username"
password = "your-smtp-password"
encryption = "starttls"  # or "ssl" or "none"

[sender]
email = "opentalk@example.com"
name = "OpenTalk"
```

### Starting the Service

```bash
# Add smtp-mailer to profiles
export COMPOSE_PROFILES=core,smtp-mailer

# Restart containers
docker compose up -d
```

## Meeting Recording (Recorder)

The recorder service allows recording of meetings.

:::caution Privacy Considerations
Recording meetings may have legal implications regarding privacy and data protection. Ensure you have proper consent and policies in place before enabling this feature.
:::

### Prerequisites

- Additional storage space for recordings
- MinIO properly configured

### Environment Configuration

```bash
# Enable recording feature flag
FEATURE_RECORDING=true

# Create recorder config directory
mkdir -p config

# Copy sample configuration
cp extras/opentalk-samples/recorder.toml.sample config/recorder.toml
```

Edit the configuration file:

```bash
nano config/recorder.toml
```

Configure recording settings:

```toml
[controller]
base_url = "http://controller:8090"
key = "recorder-api-key"

[keycloak]
base_url = "http://keycloak:8080"
realm = "opentalk"
client_id = "opentalk-recorder"
client_secret = "${KEYCLOAK_CLIENT_SECRET_RECORDER}"

[rabbit_mq]
connection_string = "amqp://rabbit:${RABBITMQ_PASSWORD}@rabbit:5672"
exchange_name = "opentalk"

[minio]
endpoint = "minio:9000"
access_key = "minioadmin"
secret_key = "minioadmin"
bucket_name = "opentalk"
use_ssl = false
recordings_path = "recordings"
```

### Starting the Service

```bash
# Add recorder to profiles
export COMPOSE_PROFILES=core,recorder

# Restart containers
docker compose up -d
```

## Redis Cache

The Redis service provides caching capabilities for improved performance.

### Starting the Service

```bash
# Add redis to profiles
export COMPOSE_PROFILES=core,redis

# Restart containers
docker compose up -d
```

## Feature Compatibility Matrix

| Feature/Service | Required Profiles | Required ENV Flags | Additional Configuration |
|-----------------|-------------------|-------------------|--------------------------|
| Whiteboard      | whiteboard        | FEATURE_WHITEBOARD=true | OT_WHITEBOARD, NGINX config |
| Collaborative Editor | pad          | -                 | OT_PAD, NGINX config |
| Phone/SIP Integration | obelisk     | -                 | SIP provider config |
| Email Notifications | smtp-mailer   | -                 | SMTP server config |
| Meeting Recording | recorder        | FEATURE_RECORDING=true | Storage config |
| Performance Caching | redis         | -                 | - |
| Shared Folder    | core             | FEATURE_SHARED_FOLDER=true | MinIO config |
| Meeting Timer    | core             | FEATURE_TIMER=true | - |
| Meeting Protocol | core             | FEATURE_PROTOCOL=true | - |

## Production Considerations

### NGINX Configuration

For production deployments, configure NGINX as a reverse proxy. Sample NGINX configurations are provided in the `extras/nginx-samples/` directory:

- `frontend.conf.sample` - Web UI configuration
- `keycloak.conf.sample` - Authentication service
- `controller.conf.sample` - API service
- `livekit.conf.sample` - Media server
- `whiteboard.conf.sample` - Whiteboard service
- `pad.conf.sample` - Collaborative editor

Adapt these sample configurations to your environment.

### Resource Requirements

Enabling additional services increases the resource requirements:

| Service | Additional RAM | Additional CPU | Additional Storage |
|---------|---------------|---------------|-------------------|
| Whiteboard | ~500MB | 0.5 core | ~1GB |
| Pad | ~500MB | 0.5 core | ~1GB |
| Obelisk | ~200MB | 0.2 core | Minimal |
| SMTP Mailer | ~100MB | 0.1 core | Minimal |
| Recorder | ~300MB | 0.5 core | Depends on usage |
| Redis | ~200MB | 0.2 core | ~1GB |

### Scaling Considerations

For larger deployments, consider:

1. Using external database services
2. Implementing proper load balancing
3. Setting up monitoring and alerts

## Troubleshooting

For service-specific troubleshooting, check the logs:

```bash
# Check logs for a specific service
docker compose logs -f [service-name]
```

Common service-specific issues:

- **Whiteboard**: Check browser console for CORS errors
- **Pad**: Verify Etherpad API key configuration
- **Obelisk**: Check SIP provider connectivity
- **SMTP Mailer**: Verify SMTP server credentials and connectivity
- **Recorder**: Check storage access and permissions