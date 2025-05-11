---
sidebar_position: 1
title: Backup Procedures
description: How to back up your OpenTalk instance
---

# Backup Procedures

This guide explains how to properly back up an OpenTalk deployment to ensure data safety and enable disaster recovery.

:::info Official Documentation
This guide complements the official [OpenTalk documentation](https://docs.opentalk.eu/). While the official docs cover various aspects of OpenTalk, this guide focuses specifically on backup and restore procedures.
:::

## What to Back Up

A complete OpenTalk backup should include:

1. **PostgreSQL database** - Contains user data, room configurations, and system settings
2. **Keycloak data** - Authentication and user identity information
3. **MinIO storage** - Files, recordings, and assets
4. **Configuration files** - Your customized settings
5. **Environment variables** - Secrets and deployment-specific settings

## Backup Strategy

We recommend implementing two types of backups:

1. **Regular automated backups** - Daily or weekly backups of all data
2. **Pre-upgrade snapshots** - One-time backups before system upgrades or major changes

## Database Backup

The PostgreSQL database stores most of OpenTalk's critical data.

### Manual Backup

```bash
# Basic PostgreSQL dump
docker compose exec postgres pg_dump -U ot opentalk > opentalk_db_backup.sql

# With timestamp in filename
docker compose exec postgres pg_dump -U ot opentalk > opentalk_db_$(date +%Y%m%d_%H%M%S).sql

# Compressed backup
docker compose exec postgres pg_dump -U ot opentalk | gzip > opentalk_db_$(date +%Y%m%d_%H%M%S).sql.gz
```

### Automated Daily Backup Script

Create a script called `backup_opentalk_db.sh`:

```bash
#!/bin/bash
# OpenTalk PostgreSQL Backup Script

# Configuration
BACKUP_DIR="/path/to/backups/database"
DAYS_TO_KEEP=14
COMPOSE_DIR="/path/to/opentalk/setup"

# Ensure backup directory exists
mkdir -p $BACKUP_DIR

# Create backup filename with timestamp
BACKUP_FILE="$BACKUP_DIR/opentalk_db_$(date +%Y%m%d_%H%M%S).sql.gz"

# Navigate to docker-compose directory
cd $COMPOSE_DIR

# Create backup
docker compose exec -T postgres pg_dump -U ot opentalk | gzip > $BACKUP_FILE

# Set permissions
chmod 600 $BACKUP_FILE

# Delete old backups
find $BACKUP_DIR -name "opentalk_db_*.sql.gz" -type f -mtime +$DAYS_TO_KEEP -delete

# Log completion
echo "Database backup completed: $BACKUP_FILE"
```

Make the script executable and add it to your crontab:

```bash
chmod +x backup_opentalk_db.sh

# Add to crontab to run daily at 2 AM
crontab -e
# Add this line:
0 2 * * * /path/to/backup_opentalk_db.sh >> /var/log/opentalk-backup.log 2>&1
```

## Configuration Backup

Back up your configuration files and environment variables to ensure you can restore your specific settings.

### Manual Backup

```bash
# Create a backup of configuration files
cp -r config config.bak
cp .env .env.bak

# Create a timestamped backup
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
mkdir -p backups/$TIMESTAMP
cp -r config backups/$TIMESTAMP/
cp .env backups/$TIMESTAMP/
```

### Automated Configuration Backup Script

Create a script called `backup_opentalk_config.sh`:

```bash
#!/bin/bash
# OpenTalk Configuration Backup Script

# Configuration
BACKUP_DIR="/path/to/backups/config"
DAYS_TO_KEEP=30
OPENTALK_DIR="/path/to/opentalk/setup"

# Ensure backup directory exists
mkdir -p $BACKUP_DIR

# Create timestamped directory
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_PATH="$BACKUP_DIR/$TIMESTAMP"
mkdir -p $BACKUP_PATH

# Navigate to OpenTalk directory
cd $OPENTALK_DIR

# Backup configuration files
cp -r config $BACKUP_PATH/
cp .env $BACKUP_PATH/
cp docker-compose.yml $BACKUP_PATH/

# Archive the backup
tar -czf $BACKUP_DIR/opentalk_config_$TIMESTAMP.tar.gz -C $BACKUP_DIR $TIMESTAMP

# Remove the uncompressed directory
rm -rf $BACKUP_PATH

# Delete old backups
find $BACKUP_DIR -name "opentalk_config_*.tar.gz" -type f -mtime +$DAYS_TO_KEEP -delete

# Log completion
echo "Configuration backup completed: $BACKUP_DIR/opentalk_config_$TIMESTAMP.tar.gz"
```

## MinIO Data Backup

MinIO stores uploaded files and recordings.

### Manual Backup Using MC Client

```bash
# Install the MinIO client (if not already installed)
wget https://dl.min.io/client/mc/release/linux-amd64/mc
chmod +x mc
sudo mv mc /usr/local/bin/

# Configure MinIO client
mc alias set opentalk-minio http://localhost:9000 minioadmin minioadmin

# Create a backup
mc mirror opentalk-minio/opentalk /path/to/minio-backup/
```

### Automated MinIO Backup Script

Create a script called `backup_opentalk_minio.sh`:

```bash
#!/bin/bash
# OpenTalk MinIO Backup Script

# Configuration
BACKUP_DIR="/path/to/backups/minio"
DAYS_TO_KEEP=14
MINIO_ENDPOINT="http://localhost:9000"
MINIO_ACCESS_KEY="minioadmin"  # Replace with your actual access key
MINIO_SECRET_KEY="minioadmin"  # Replace with your actual secret key
MINIO_BUCKET="opentalk"

# Ensure backup directory exists
mkdir -p $BACKUP_DIR

# Create timestamped directory
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_PATH="$BACKUP_DIR/$TIMESTAMP"
mkdir -p $BACKUP_PATH

# Use MinIO client to backup data
mc alias set opentalk-minio $MINIO_ENDPOINT $MINIO_ACCESS_KEY $MINIO_SECRET_KEY
mc mirror opentalk-minio/$MINIO_BUCKET $BACKUP_PATH/

# Archive the backup
tar -czf $BACKUP_DIR/opentalk_minio_$TIMESTAMP.tar.gz -C $BACKUP_DIR $TIMESTAMP

# Remove the uncompressed directory
rm -rf $BACKUP_PATH

# Delete old backups
find $BACKUP_DIR -name "opentalk_minio_*.tar.gz" -type f -mtime +$DAYS_TO_KEEP -delete

# Log completion
echo "MinIO backup completed: $BACKUP_DIR/opentalk_minio_$TIMESTAMP.tar.gz"
```

## Keycloak Data Backup

Keycloak contains authentication configurations and user accounts.

### Manual Backup

```bash
# Create a backup of Keycloak data directory
tar -czf keycloak_data_$(date +%Y%m%d_%H%M%S).tar.gz ./data/kc_data ./data/kc_provider
```

### Automated Keycloak Backup Script

Create a script called `backup_opentalk_keycloak.sh`:

```bash
#!/bin/bash
# OpenTalk Keycloak Backup Script

# Configuration
BACKUP_DIR="/path/to/backups/keycloak"
DAYS_TO_KEEP=14
KEYCLOAK_DATA_DIR="/path/to/opentalk/setup/data"

# Ensure backup directory exists
mkdir -p $BACKUP_DIR

# Create backup filename with timestamp
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="$BACKUP_DIR/keycloak_data_$TIMESTAMP.tar.gz"

# Create backup
tar -czf $BACKUP_FILE -C $KEYCLOAK_DATA_DIR kc_data kc_provider

# Set permissions
chmod 600 $BACKUP_FILE

# Delete old backups
find $BACKUP_DIR -name "keycloak_data_*.tar.gz" -type f -mtime +$DAYS_TO_KEEP -delete

# Log completion
echo "Keycloak backup completed: $BACKUP_FILE"
```

## Complete System Backup

For a complete backup, you can create a master script that runs all individual backup scripts:

```bash
#!/bin/bash
# OpenTalk Complete Backup Script

# Run individual backup scripts
/path/to/backup_opentalk_db.sh
/path/to/backup_opentalk_config.sh
/path/to/backup_opentalk_minio.sh
/path/to/backup_opentalk_keycloak.sh

# Log completion
echo "Complete OpenTalk backup completed at $(date)"
```

## Backup Verification

Regularly verify your backups to ensure they can be used for restoration:

```bash
# Test PostgreSQL backup restoration
gunzip -c opentalk_db_backup.sql.gz | psql -U postgres -d opentalk_test

# Check MinIO backup integrity
tar -tzf opentalk_minio_backup.tar.gz
```

## Offsite Backup Storage

Always store copies of your backups in a separate location:

```bash
# Example: Copy backups to a remote server
rsync -avz /path/to/backups/ user@remote-server:/path/to/offsite-backups/

# Example: Copy to AWS S3
aws s3 sync /path/to/backups/ s3://your-bucket/opentalk-backups/
```

## Restoring from Backup

### Database Restoration

```bash
# Stop OpenTalk services
docker compose down

# Start only PostgreSQL
docker compose up -d postgres

# Restore database
gunzip -c opentalk_db_backup.sql.gz | docker compose exec -T postgres psql -U ot -d opentalk

# Restart all services
docker compose down
docker compose up -d
```

### Configuration Restoration

```bash
# Extract configuration backup
tar -xzf opentalk_config_backup.tar.gz

# Copy files to OpenTalk directory
cp -r extracted_backup/config /path/to/opentalk/setup/
cp extracted_backup/.env /path/to/opentalk/setup/
```

### MinIO Data Restoration

```bash
# Extract MinIO backup
tar -xzf opentalk_minio_backup.tar.gz

# Use MinIO client to restore
mc alias set opentalk-minio http://localhost:9000 minioadmin minioadmin
mc mirror extracted_backup/ opentalk-minio/opentalk
```

### Keycloak Data Restoration

```bash
# Stop OpenTalk services
docker compose down

# Extract Keycloak backup
tar -xzf keycloak_data_backup.tar.gz

# Replace existing data
rm -rf /path/to/opentalk/setup/data/kc_data
rm -rf /path/to/opentalk/setup/data/kc_provider
mv extracted_backup/kc_data /path/to/opentalk/setup/data/
mv extracted_backup/kc_provider /path/to/opentalk/setup/data/

# Restart services
docker compose up -d
```

## Backup Monitoring

Set up monitoring to ensure your backups are running successfully:

```bash
# Example: Check if backup files were created in the last 24 hours
find /path/to/backups -type f -name "opentalk_*" -mtime -1 | wc -l
```

If you're using a monitoring system like Prometheus or Nagios, create checks to alert you if backups are failing.

## Disaster Recovery Testing

Periodically test your disaster recovery procedure:

1. Set up a test environment
2. Restore backups to the test environment
3. Verify that all services work correctly
4. Document any issues encountered and improve your backup/restore procedures

A good practice is to schedule disaster recovery testing quarterly to ensure your backup strategy remains effective.