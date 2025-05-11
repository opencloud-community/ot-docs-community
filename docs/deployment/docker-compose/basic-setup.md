---
sidebar_position: 1
title: Basic Docker Compose Setup
description: Step-by-step guide to set up OpenTalk using Docker Compose
---

# Basic Docker Compose Setup

This guide provides a step-by-step approach to setting up OpenTalk using Docker Compose for a basic deployment.

## Prerequisites

Before you begin, ensure you have the following:

- A server with at least:
  - 2+ CPU cores
  - 4+ GB RAM
  - 20+ GB storage
- Docker Engine and Docker Compose installed
- A domain name with DNS records pointing to your server
- Ports 80/443 (TCP) and 20000-40000 (UDP) open in your firewall

## Step 1: Clone the Setup Repository

```bash
git clone https://gitlab.opencode.de/opentalk/ot-setup.git
cd ot-setup
```

## Step 2: Configure Environment Variables

Create a `.env` file based on the provided example:

```bash
cp example.env .env
```

Edit the `.env` file and set the following key parameters:

```
# Domain settings
DOMAIN=your-domain.example.com

# Security
KEYCLOAK_ADMIN_PASSWORD=your-secure-password

# Generated secrets (replace with your own secure values)
CONTROLLER__API_TOKEN_SECRET=random-string-at-least-32-chars
CONTROLLER__SESSION_TOKEN_SECRET=another-random-string-32-chars
RABBITMQ_PASSWORD=secure-rabbit-password
POSTGRES_PASSWORD=secure-postgres-password
```

## Step 3: Start the Services

```bash
docker compose up -d
```

This command starts the following core services:

- Web-Frontend: The OpenTalk web user interface
- Controller: Main backend service
- Keycloak: Identity and access management
- Postgres: Database for persistence
- RabbitMQ: Message broker for service communication
- Minio: S3-compatible object storage
- LiveKit: WebRTC infrastructure

## Step 4: Configure Keycloak

1. Access Keycloak at `https://your-domain.example.com/auth/`
2. Log in with the admin credentials you set in the `.env` file
3. Follow the [OpenTalk Admin Guide](https://opentalk.eu/docs/admin/controller/auth/) for detailed Keycloak configuration

## Step 5: Test Your Installation

Visit `https://your-domain.example.com` in your browser. You should be able to sign in using the Keycloak authentication.

## Next Steps

- [Enable additional services](./additional-services.md) like Etherpad or Whiteboard
- [Configure advanced options](../configuration/controller-config.md) for the controller
- [Set up backup procedures](../../operation/backup-restore/backup-procedures.md)

## Troubleshooting

If you encounter issues during setup, check:

1. Docker container logs: `docker compose logs -f [service-name]`
2. Network connectivity between containers
3. Correct environment variable configuration
4. The [troubleshooting guide](../../operation/troubleshooting/common-issues.md) for common problems