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

## Step 5: Start the Core Services

```bash
# Start the core services
docker compose up -d
```

This command starts the following core services:

- **web-frontend**: The OpenTalk web user interface
- **controller**: Main backend service
- **keycloak**: Identity and access management
- **postgres**: Database for persistence
- **rabbit**: Message broker for service communication
- **minio**: S3-compatible object storage
- **livekit**: WebRTC infrastructure
- **terdoc**: Document viewer
- **autoheal**: Automatic container healing

## Step 6: Configure Keycloak

After starting the services, you need to configure Keycloak:

1. Access Keycloak at `https://accounts.example.com/`
2. Log in with the admin credentials from your `.env` file:
   - Username: `admin`
   - Password: Value of `KEYCLOAK_ADMIN_PASSWORD` in your `.env` file
3. Create a new realm named "opentalk" (or match the value of `KC_REALM_NAME` in your `.env` file)
4. Configure user federation if needed (LDAP or other identity providers)
5. Create test users or configure SSO

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

### Common Issues

- **Web interface shows a connection error**: Check if the controller service is running and accessible
- **Authentication fails**: Verify Keycloak configuration and client secrets
- **Media connection fails**: Check if LiveKit service is running and UDP ports are open
- **File upload fails**: Verify that MinIO is running and properly configured