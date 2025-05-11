---
sidebar_position: 1
title: Controller Configuration
description: Advanced configuration options for the OpenTalk Controller
---

# Controller Configuration

The OpenTalk Controller is the core backend service that manages rooms, users, and communication between various components. This guide explains its configuration options in detail.

:::info Official Documentation
This guide complements the official [Controller Configuration](https://docs.opentalk.eu/admin/controller/configuration/) documentation. While the official documentation covers all configuration options, this guide focuses on practical deployment scenarios and common configurations.
:::

## Configuration File Overview

The Controller uses a TOML configuration file (`controller.toml`) to define its behavior. The configuration is divided into multiple sections, each controlling a specific aspect of the controller:

```bash
# Create the configuration directory if it doesn't exist
mkdir -p config

# Copy the sample configuration
cp extras/opentalk-samples/controller.toml.sample config/controller.toml

# Edit the configuration 
nano config/controller.toml
```

## Essential Configuration Sections

### Database Connection

Controls the PostgreSQL database connection:

```toml
[database]
# Database connection URL format: postgres://username:password@host:port/database
url = "postgres://ot:postgrespw@postgres:5432/opentalk"
# Maximum number of database connections
max_connections = 100
# Minimum number of idle connections to maintain
min_idle_connections = 10
```

**Recommendations:**
- Use a strong password in production
- For large deployments, increase max_connections to 150-200
- For small deployments, reduce to 50 to save resources

### HTTP Server

Configures the HTTP server and CORS settings:

```toml
[http]
# IP address to bind (::0 for all interfaces)
addr = "::0"
# Port to bind the HTTP server
port = 11311
# Cross-Origin Resource Sharing (CORS) settings
cors.allowed_origin = ["https://example.com"]
```

**Recommendations:**
- Use specific IP addresses in production environments
- Allow CORS only for your frontend domain(s)
- In development, use `localhost` addresses 

### Keycloak Integration

Configuration for the Keycloak identity provider:

```toml
[keycloak]
# Keycloak base URL
base_url = "https://accounts.example.com/auth"
# Realm name
realm = "opentalk"
# Client ID for controller
client_id = "OtBackend"
# Client secret (should match the secret in Keycloak)
client_secret = "${KEYCLOAK_CLIENT_SECRET_CONTROLLER}"
```

**Recommendations:**
- Use environment variables for sensitive values
- Ensure the client is properly configured in Keycloak
- Use SSL/TLS for all production connections

### LiveKit WebRTC

Configuration for the LiveKit media server:

```toml
[livekit]
# Public URL for client connections
public_url = "https://livekit.example.com"
# Internal service URL for controller-to-LiveKit communication
service_url = "http://livekit:7880"
# API credentials
api_key = "controller"
api_secret = "${LIVEKIT_KEYS_API_SECRET}"
```

**Recommendations:**
- Use different URLs for public and service access
- Generate strong API credentials
- Ensure UDP ports are properly configured for WebRTC

### RabbitMQ Messaging

Message queue configuration for service communication:

```toml
[rabbit_mq]
# RabbitMQ connection URL
url = "amqp://rabbit:${RABBITMQ_PASSWORD}@rabbit:5672/%2F"
# Queue for email notifications
mail_task_queue = "opentalk_mailer"
# Queue for recording tasks
recording_task_queue = "opentalk_recorder"
# Connection pool settings
min_connections = 10
max_channels_per_connection = 100
```

**Recommendations:**
- Use authentication for RabbitMQ
- Adjust connection pool settings based on load
- Monitor queue sizes in production

### MinIO Object Storage

Configuration for file storage:

```toml
[minio]
# MinIO service URL
uri = "http://minio:9000"
# S3 bucket name
bucket = "opentalk"
# Access credentials
access_key = "minioadmin"
secret_key = "minioadmin"
```

**Recommendations:**
- Use strong credentials in production
- Consider external S3-compatible storage for production
- Ensure proper backup of stored files

## Optional Configuration Sections

### TURN/STUN Servers

ICE server configuration for WebRTC connectivity:

```toml
[turn]
# Credential lifetime in seconds (24 hours)
lifetime = 86400

[[turn.servers]]
uris = [
    "turn:turn.example.com:3478?transport=udp",
    "turn:turn.example.com:3478?transport=tcp", 
    "turns:turn.example.com:5349?transport=tcp"
]
pre_shared_key = "your-strong-secret"

[stun]
uris = ["stun:stun.example.com:3478"]
```

**Recommendations:**
- Essential for reliable WebRTC connectivity
- Use dedicated TURN service in production
- Consider using a managed TURN service provider

### Call-in (SIP Integration)

Configuration for telephone call-in:

```toml
[call_in]
# Phone number for call-in
tel = "+4912345678"
# Allow mapping usernames to phone numbers
enable_phone_mapping = false
# Default country code (ISO 3166)
default_country_code = "DE"
```

**Recommendations:**
- Only enable if using the Obelisk service
- Properly format international phone numbers
- Consider legal/privacy implications of phone mapping

### Integration Services

Configuration for additional collaborative services:

```toml
[etherpad]
# Etherpad service URL
url = "http://pad:9001"
# API key for communication
api_key = "${ETHERPAD_API_KEY}"

[spacedeck]
# Spacedeck whiteboard URL
url = "http://whiteboard:9666"
# API token for communication
api_key = "${SPACEDECK_API_TOKEN}"
```

**Recommendations:**
- Only enable services you need
- Generate strong API keys
- Ensure services are properly secured

### Default Settings

Default values for user settings:

```toml
[defaults]
# Default language for users
user_language = "en-US"
# Whether participants have presenter role by default
participants_have_presenter_role = true
```

**Recommendations:**
- Set defaults according to your organization's needs
- Consider regulatory requirements for your region
- Document these settings for your users

### Monitoring and Metrics

Configuration for Prometheus metrics:

```toml
[metrics]
# IP address ranges allowed to access metrics
allowlist = ["10.0.0.0/8", "127.0.0.0/8"]
```

**Recommendations:**
- Restrict access to monitoring systems
- Use proper network segmentation
- Consider setting up alerts based on metrics

## Configuration Examples

### Development Environment

```toml
[database]
url = "postgres://ot:devpassword@postgres:5432/opentalk"
max_connections = 50

[http]
addr = "localhost"
port = 11311
cors.allowed_origin = ["http://localhost:8080"]

[keycloak]
base_url = "http://localhost:8087/auth"
realm = "opentalk"
client_id = "OtBackend"
client_secret = "dev-secret"

[livekit]
public_url = "http://localhost:7880"
service_url = "http://localhost:7880"
api_key = "devkey"
api_secret = "devsecret"

[rabbit_mq]
url = "amqp://guest:guest@localhost:5672/%2F"

[minio]
uri = "http://localhost:9000"
bucket = "opentalk"
access_key = "minioadmin"
secret_key = "minioadmin"
```

### Production Environment

```toml
[logging]
default_directives = [
  "pinky_swear=OFF",
  "rustls=WARN",
  "mio=ERROR",
  "lapin=WARN",
]
jaeger_agent_endpoint = "jaeger-agent:6831"
service_name = "opentalk-controller-prod"

[database]
url = "postgres://ot:${POSTGRES_PASSWORD}@postgres:5432/opentalk"
max_connections = 100
min_idle_connections = 10

[http]
port = 11311
cors.allowed_origin = ["https://meet.example.com"]

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

[rabbit_mq]
url = "amqp://rabbit:${RABBITMQ_PASSWORD}@rabbit:5672/%2F"
mail_task_queue = "opentalk_mailer"
recording_task_queue = "opentalk_recorder"
min_connections = 10
max_channels_per_connection = 100

[turn]
lifetime = 86400

[[turn.servers]]
uris = [
    "turn:turn.example.com:3478?transport=udp",
    "turn:turn.example.com:3478?transport=tcp",
    "turns:turn.example.com:5349?transport=tcp"
]
pre_shared_key = "${TURN_PRE_SHARED_KEY}"

[stun]
uris = ["stun:turn.example.com:3478"]

[call_in]
tel = "+4912345678"
default_country_code = "DE"

[minio]
uri = "http://minio:9000"
bucket = "opentalk"
access_key = "minioadmin"
secret_key = "minioadmin"

[etherpad]
url = "http://pad:9001"
api_key = "${ETHERPAD_API_KEY}"

[spacedeck]
url = "http://whiteboard:9666"
api_key = "${SPACEDECK_API_TOKEN}"

[defaults]
user_language = "en-US"
participants_have_presenter_role = false

[metrics]
allowlist = ["10.0.0.0/8", "127.0.0.0/8"]
```

## Environment Variables Integration

Many configuration values can be set through environment variables, making it easier to manage secrets and environment-specific settings:

```toml
# Using environment variables in the configuration
[database]
url = "postgres://ot:${POSTGRES_PASSWORD}@postgres:5432/opentalk"

[keycloak]
client_secret = "${KEYCLOAK_CLIENT_SECRET_CONTROLLER}"
```

## Configuration Best Practices

1. **Security**:
   - Use environment variables for secrets
   - Generate strong, unique passwords and keys
   - Restrict access to configuration files

2. **Performance**:
   - Adjust database and RabbitMQ connection pools based on load
   - Monitor resource usage and adjust accordingly
   - Consider using external services for high-load components

3. **Maintenance**:
   - Document all custom configuration settings
   - Keep a backup of working configurations
   - Test configuration changes in a non-production environment first

4. **Network Settings**:
   - Properly configure CORS settings to prevent security issues
   - Ensure all required ports are open in firewalls
   - Use TLS/SSL for all public-facing services

5. **Scalability**:
   - Configure external database and message queue services for high availability
   - Consider load balancing for larger deployments
   - Monitor connection limits and adjust as needed

## Troubleshooting

Common configuration issues and solutions:

1. **Database Connection Failed**:
   - Check database URL format and credentials
   - Verify PostgreSQL is running and accessible
   - Ensure database user has appropriate permissions

2. **Keycloak Authentication Issues**:
   - Verify base URL and realm settings
   - Check client ID and secret match Keycloak configuration
   - Ensure client has proper redirect URIs configured

3. **CORS Errors in Browser Console**:
   - Verify allowed_origin includes the frontend URL with correct protocol (http/https)
   - Check for exact match including subdomain and port if applicable
   - Consider temporarily enabling more permissive settings for debugging

4. **WebRTC Connection Failures**:
   - Check LiveKit configuration and connectivity
   - Verify TURN/STUN settings
   - Ensure UDP ports are open in firewalls

5. **Service Integration Problems**:
   - Verify internal service URLs are correct
   - Check API keys and secrets
   - Ensure services are running and accessible