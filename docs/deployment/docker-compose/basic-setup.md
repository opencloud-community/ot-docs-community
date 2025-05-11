---
sidebar_position: 1
title: Basic Docker Compose Setup
description: Step-by-step guide to set up OpenTalk using Docker Compose
---

# Basic Docker Compose Setup

This guide provides a step-by-step approach to setting up OpenTalk using Docker Compose for a basic deployment.

:::info Official Documentation
This guide complements the official [OpenTalk Setup Repository](https://gitlab.opencode.de/opentalk/ot-setup) and [Controller Configuration](https://docs.opentalk.eu/admin/controller/configuration/) documentation. While the official documentation covers all configuration options, this guide focuses on practical deployment steps and common scenarios.
:::

## Prerequisites

Before you begin, ensure you have the following:

- A server with at least:
  - 2+ CPU cores
  - 4+ GB RAM
  - 20+ GB storage
- Docker Engine and Docker Compose V2 installed
- A domain name with DNS records pointing to your server
- Ports 80/443 (TCP) and 20000-40000 (UDP) open in your firewall

### DNS Records

You'll need to configure the following DNS records:

- `example.com` - Main domain for web frontend
- `accounts.example.com` - Keycloak authentication service
- `controller.example.com` - Controller API
- `livekit.example.com` - LiveKit WebRTC server

### Required Software

```bash
# Install Docker Engine on Ubuntu
sudo apt-get update
sudo apt-get install docker.io docker-compose-plugin

# Verify Docker installation
docker --version
docker compose version
```

## Step 1: Clone the Setup Repository

```bash
git clone https://gitlab.opencode.de/opentalk/ot-setup.git
cd ot-setup
```

## Step 2: Generate Secure Secrets

OpenTalk requires several secure secrets for different components. You can use the provided script to generate them:

```bash
# Make the script executable if needed
chmod +x extras/gen-secrets.sh

# Generate secrets
./extras/gen-secrets.sh > .env
```

This will create a `.env` file with randomly generated secure passwords for:
- PostgreSQL database
- Keycloak administration
- Client secrets for various components
- API tokens for services

## Step 3: Configure Environment Variables

Edit the `.env` file to set your domain and any other custom settings:

```bash
# Edit the .env file
nano .env
```

Key parameters to modify:

```ini
# Domain settings - Replace with your actual domain
OT_DOMAIN=example.com
KC_HOSTNAME=accounts.${OT_DOMAIN}
OT_CONTROLLER=controller.${OT_DOMAIN}
OT_LIVEKIT=livekit.${OT_DOMAIN}

# Feature flags - Enable/disable components as needed
FEATURE_USER_SEARCH=true
FEATURE_TIMER=true
FEATURE_WHITEBOARD=true
FEATURE_PROTOCOL=true
FEATURE_RECORDING=false
FEATURE_SHARED_FOLDER=false
WAITING_ROOM_DEFAULT_VALUE=false

# Branding (optional)
OT_FRONTEND_BRANDING_HELPDESK_URL=https://example.com/support
OT_FRONTEND_BRANDING_IMPRINT_URL=https://example.com/imprint
OT_FRONTEND_BRANDING_DATA_PROTECTION_URL=https://example.com/privacy
```

## Step 4: Customize Component Configuration

OpenTalk uses TOML configuration files for its components. Sample configurations are provided in the `extras/opentalk-samples/` directory.

### Basic Controller Configuration

```bash
# Create config directory if it doesn't exist
mkdir -p config

# Copy the sample controller configuration
cp extras/opentalk-samples/controller.toml.sample config/controller.toml

# Edit the controller configuration
nano config/controller.toml
```

The controller configuration includes settings for database connections, Keycloak integration, and various service endpoints. Most values are populated from environment variables, but you might need to adjust some settings.

### Understanding Container Communication

In a Docker Compose setup, it's critical to understand how services communicate with each other. Services must use container names rather than `localhost` or IP addresses when referencing other services:

```toml
# In controller.toml - CORRECT references to other services
[database]
url = "postgres://ot:your_password@postgres:5432/opentalk"  # Uses container name 'postgres'

[minio]
uri = "http://minio:9000"  # Uses container name 'minio'

[livekit]
service_url = "http://livekit:7880"  # Uses container name 'livekit' 

[rabbit_mq]
url = "amqp://rabbit:5672/%2F"  # Uses container name 'rabbit'

# Services for optional features
[etherpad]
url = "http://pad:9001"  # Uses container name 'pad'

[spacedeck]
url = "http://whiteboard:9666"  # Uses container name 'whiteboard'
```

:::caution Container Name Resolution
When services run in the same Docker Compose network, they can reach each other using the service name as hostname. Using `localhost` or `127.0.0.1` inside a container refers to the container itself, not the host machine or other containers.
:::

The included sample configuration should already use the correct container names, but keep this in mind if you modify the configuration or use external services.

## Step 5: Start the Core Services

Before starting the services, it's important to ensure proper initialization of data directories, especially for the PostgreSQL database:

```bash
# Make sure data directories exist and are clean for first installation
mkdir -p data/pg_data data/kc_data data/minio

# If you're reinstalling and need a fresh database:
# sudo rm -rf ./data/pg_data/*
```

Now start the core services:

```bash
# Start the core services
docker compose up -d
```

This command starts the following core services:

- **web-frontend**: The OpenTalk web user interface
- **controller**: Main backend service
- **keycloak**: Identity and access management
- **postgres**: Database for persistence (will be initialized on first run)
- **rabbit**: Message broker for service communication
- **minio**: S3-compatible object storage
- **livekit**: WebRTC infrastructure
- **terdoc**: Document viewer
- **autoheal**: Automatic container healing

:::caution Database Initialization
During first startup, the PostgreSQL database will be automatically initialized with the credentials from your `.env` file. If you encounter database connection issues after modification or redeployment, you might need to reset the database directory as shown above.
:::

### Checking Service Startup Progress

Monitor the startup process to make sure all services are starting correctly:

```bash
# Watch the logs as services start
docker compose logs -f

# Check container status
docker compose ps
```

Ensure all services show as "Up" or "Up (healthy)" in the status output. If you see "Restarting", check the service logs for errors:

```bash
# Example: Check controller logs if it's restarting
docker compose logs controller
```

## Step 6: Configure Keycloak

The OpenTalk setup includes an example Keycloak realm configuration that can be automatically imported during startup.

### Automatic Realm Import

The setup includes a sample Keycloak realm configuration in `data/kc_data/import/08-17-23-example-export.json`. During the first startup, Keycloak will attempt to import this realm configuration automatically.

You can verify if the import was successful by checking the Keycloak logs:

```bash
docker compose logs keycloak | grep "import"
```

You should see a message like:
```
INFO  [org.keycloak.services] (main) KC-SERVICES0003: Not importing realm opentalk from file /opt/keycloak/bin/../data/import/08-17-23-example-export.json.  It already exists.
```

### Manual Keycloak Configuration

If the automatic import fails or if you want to configure Keycloak manually:

1. Access Keycloak at `https://accounts.example.com/`
2. Log in with the admin credentials from your `.env` file:
   - Username: `admin`
   - Password: Value of `KEYCLOAK_ADMIN_PASSWORD` in your `.env` file
3. Create a new realm named "opentalk" (or match the value of `KC_REALM_NAME` in your `.env` file)
4. Create required clients:
   - Create client `OtBackend` for the controller with secret matching `KEYCLOAK_CLIENT_SECRET_CONTROLLER`
   - Create client `OtFrontend` for the web frontend (public client)
5. Configure user federation if needed (LDAP or other identity providers)
6. Create test users or configure SSO

### Verifying Keycloak Configuration

To ensure Keycloak is configured correctly:

```bash
# Check if Keycloak is running properly
docker compose ps keycloak

# If you encounter issues, check the logs
docker compose logs keycloak
```

Common Keycloak issues include:
- Hostname configuration problems (see Troubleshooting section)
- Missing or incorrect realm configuration
- Client configuration issues

## Step 7: Test Your Installation

Visit your main domain (e.g., `https://example.com`) in your browser. You should be redirected to Keycloak for authentication. After logging in, you'll be able to use the OpenTalk platform.

### Verifying Services

You can check the status of your services with:

```bash
# Check running containers
docker compose ps

# View logs for a specific service
docker compose logs -f controller
```

## Customizing Your Deployment

### Changing Service Ports

You can customize the exposed ports by modifying these variables in your `.env` file:

```ini
OT_FRONTEND_EXP_PORT=8080
OPENTALK_CONTROLLER_EXP_PORT=8090
KEYCLOAK_EXP_PORT=8087
```

### Using External Databases

For production environments, you might want to use existing database servers instead of the bundled PostgreSQL:

1. Modify the `POSTGRES_*` environment variables in `.env`
2. Update the database connection in `config/controller.toml`

## Next Steps

- [Enable additional services](./additional-services.md) like Etherpad or Whiteboard
- [Configure advanced options](../configuration/controller-config.md) for the controller
- [Set up NGINX for production](../configuration/nginx-setup.md)
- [Configure security and SSL](../configuration/security-ssl.md)
- [Set up backup procedures](../../operation/backup-restore/backup-procedures.md)

## Troubleshooting

If you encounter issues during setup, check:

1. Docker container logs: `docker compose logs -f [service-name]`
2. Network connectivity between containers
3. Correct environment variable configuration
4. The [troubleshooting guide](../../operation/troubleshooting/common-issues.md) for common problems

### Common Issues and Solutions

#### Database Connection Errors

If the controller cannot connect to the database:

```bash
# Check database logs
docker compose logs postgres

# If needed, recreate the database
docker compose down
sudo rm -rf ./data/pg_data/*
docker compose up -d
```

#### Controller Service Continuously Restarting

This often indicates configuration issues:

```bash
# Check controller logs
docker compose logs controller

# Common causes:
# 1. Incorrect database connection string
# 2. MinIO connectivity issues
# 3. Keycloak connection problems
```

When the controller shows "Failed to initialize OIDC Context" or "Cannot list buckets for configured MinIO storage", check:
- That all hostnames in the controller.toml file correctly reference container names (not localhost)
- That the MinIO bucket exists and has correct permissions

#### Container Communication Issues

Services need to communicate with each other by their container names, not localhost:

```toml
# Correct: Using container names
url = "postgres://ot:password@postgres:5432/opentalk"  # Database
uri = "http://minio:9000"  # MinIO
service_url = "http://livekit:7880"  # LiveKit

# Incorrect: Using localhost (will fail in container context)
url = "postgres://ot:password@localhost:5432/opentalk"
```

#### Keycloak Initialization Issues

If Keycloak fails to start properly:

```bash
# Check keycloak logs
docker compose logs keycloak

# Ensure correct hostname setting
# Edit docker-compose.yaml or use environment variables to ensure
# Keycloak has a proper hostname configuration
```

For hostname errors, make sure to provide the `--hostname` parameter:
```yaml
command:
  - /bin/sh
  - -c
  - |
      /opt/keycloak/bin/kc.sh build --health-enabled=true
      /opt/keycloak/bin/kc.sh start --import-realm --optimized --hostname=accounts.example.com
```

#### MinIO Issues

If MinIO connection fails:

```bash
# Check MinIO logs
docker compose logs minio

# Verify that the S3 bucket exists
ls -la ./data/minio/

# Create the bucket if missing
mkdir -p ./data/minio/s3_bucket
```

#### General Debugging Tips

- Use `docker compose ps` to check the status of all containers
- Services marked as "Restarting" indicate configuration or connectivity issues
- For advanced debugging, you can attach to a container with:
  ```bash
  docker compose exec -it [service-name] bash
  ```
- Check DNS resolution between containers:
  ```bash
  docker compose exec controller ping postgres
  docker compose exec controller ping minio
  ```