---
sidebar_position: 1
title: Common Issues
description: Troubleshooting common issues with OpenTalk deployments
---

# Troubleshooting Common Issues

This guide covers common issues you might encounter when deploying and operating OpenTalk, along with their solutions.

:::info Official Documentation
This guide complements the official [OpenTalk documentation](https://docs.opentalk.eu/). While the official docs cover detailed component behavior, this guide focuses on practical troubleshooting scenarios.
:::

## General Troubleshooting Approach

When troubleshooting OpenTalk issues, follow these general steps:

1. **Check container status**:
   ```bash
   docker compose ps
   ```

2. **View logs for specific services**:
   ```bash
   docker compose logs -f controller
   docker compose logs -f web-frontend
   docker compose logs -f keycloak
   ```

3. **Verify network connectivity** between services:
   ```bash
   docker network inspect opentalk_default
   ```

4. **Check configuration files** for syntax errors or misconfigurations

## Container Startup Issues

### Containers Exit Immediately

**Symptoms**:
- Containers show "Exited" status shortly after starting
- `docker compose up` appears to work but services aren't running

**Solutions**:
1. Check for configuration errors:
   ```bash
   docker compose logs [service-name]
   ```

2. Verify volume permissions:
   ```bash
   # Check permissions on mounted volumes
   ls -la ./data
   
   # Fix permissions if needed
   chmod -R 755 ./data
   ```

3. Ensure all required environment variables are set in your `.env` file

### Container Dependencies

**Symptoms**:
- Some containers start, others fail
- Logs show "Connection refused" errors

**Solutions**:
1. Check if dependency services are running:
   ```bash
   # Check if PostgreSQL is up before controller
   docker compose logs postgres
   ```

2. Try starting services in order:
   ```bash
   docker compose up -d postgres rabbit keycloak
   sleep 30  # Wait for initialization
   docker compose up -d
   ```

## Authentication Issues

### Keycloak Configuration

**Symptoms**:
- Unable to log in
- "Invalid credentials" errors
- Redirect loops when accessing the frontend

**Solutions**:
1. Verify Keycloak is running:
   ```bash
   docker compose ps keycloak
   ```

2. Check Keycloak logs:
   ```bash
   docker compose logs -f keycloak
   ```

3. Verify realm configuration:
   - Access Keycloak admin interface at `https://accounts.example.com/`
   - Check that the "opentalk" realm exists
   - Verify client configurations match controller settings

4. Reset Keycloak admin password if needed:
   ```bash
   # Stop Keycloak
   docker compose stop keycloak
   
   # Set a new admin password
   docker compose run --rm keycloak /opt/jboss/keycloak/bin/add-user.sh -u admin -p newpassword
   
   # Restart Keycloak
   docker compose start keycloak
   ```

### Client Secrets Mismatch

**Symptoms**:
- "Invalid client credentials" in logs
- Unable to authenticate between services

**Solutions**:
1. Ensure client secrets in `.env` file match Keycloak configuration:
   - Check `KEYCLOAK_CLIENT_SECRET_CONTROLLER` value
   - Verify the same value is set for the client in Keycloak

2. Update client secret in Keycloak:
   - Navigate to the client in Keycloak admin
   - Go to Credentials tab
   - Regenerate secret and update your `.env` file

## WebRTC Media Connection Issues

### Audio/Video Not Working

**Symptoms**:
- Users can connect to meetings but no audio/video
- Browser console shows WebRTC connection errors

**Solutions**:
1. Check LiveKit is running:
   ```bash
   docker compose ps livekit
   docker compose logs -f livekit
   ```

2. Verify UDP ports are open:
   ```bash
   # Test UDP ports
   nc -vuz your-server-ip 20000-40000
   ```

3. Check LiveKit configuration:
   - Verify `LIVEKIT_KEYS_API_SECRET` in `.env` matches controller configuration
   - Check that controller.toml has correct LiveKit URLs

4. Inspect browser network traffic:
   - Open browser developer tools
   - Check for failed network requests to livekit.example.com
   - Look for CORS or certificate errors

### STUN/TURN Server Issues

**Symptoms**:
- Media works on local network but fails across NATs
- "ICE connection failed" errors in browser console

**Solutions**:
1. Configure TURN servers in controller.toml:
   ```toml
   [turn]
   lifetime = 86400
   
   [[turn.servers]]
   uris = [
       "turn:turn.example.com:3478?transport=udp",
       "turn:turn.example.com:3478?transport=tcp",
       "turns:turn.example.com:5349?transport=tcp"
   ]
   pre_shared_key = "your-strong-secret"
   ```

2. Use a public TURN service provider if you don't have your own

## Database Connection Issues

### Controller Can't Connect to PostgreSQL

**Symptoms**:
- Controller logs show database connection errors
- "Connection refused" or "Authentication failed" in logs

**Solutions**:
1. Verify PostgreSQL is running:
   ```bash
   docker compose ps postgres
   ```

2. Check database credentials:
   - Ensure `POSTGRES_PASSWORD` in `.env` matches controller configuration
   - Verify database name and user are correct

3. Check database logs:
   ```bash
   docker compose logs -f postgres
   ```

4. Manually test the connection:
   ```bash
   docker compose exec postgres psql -U ot -d opentalk -c "SELECT 1"
   ```

5. Reset database if needed:
   ```bash
   # Backup existing data first!
   docker compose down postgres
   sudo rm -rf ./data/pg_data
   docker compose up -d postgres
   ```

## Storage Issues

### MinIO File Storage Problems

**Symptoms**:
- File uploads fail
- "Access denied" or "Bucket not found" errors

**Solutions**:
1. Check MinIO status:
   ```bash
   docker compose ps minio
   docker compose logs -f minio
   ```

2. Verify bucket exists:
   ```bash
   # Using mc client to check buckets
   docker run --rm --network opentalk_default \
     minio/mc alias set myminio http://minio:9000 minioadmin minioadmin
   docker run --rm --network opentalk_default \
     minio/mc ls myminio/
   ```

3. Create missing bucket if needed:
   ```bash
   docker run --rm --network opentalk_default \
     minio/mc mb myminio/opentalk
   ```

4. Check controller configuration:
   ```bash
   # Verify MinIO settings in controller.toml
   cat config/controller.toml | grep -A 5 minio
   ```

## Networking Issues

### Service Discovery Problems

**Symptoms**:
- Services can't find each other
- "Unknown host" or "Connection refused" errors

**Solutions**:
1. Check Docker networks:
   ```bash
   docker network ls
   docker network inspect opentalk_default
   ```

2. Verify service hostnames match configuration:
   - Container names should match service URLs in configuration
   - For example, "postgres" in database URL should match container name

3. Test network connectivity between containers:
   ```bash
   # Test if controller can reach postgres
   docker compose exec controller ping -c 3 postgres
   
   # Test if controller can reach rabbit
   docker compose exec controller ping -c 3 rabbit
   ```

### Port Conflicts

**Symptoms**:
- Services fail to start
- "Port is already in use" errors

**Solutions**:
1. Check for port conflicts:
   ```bash
   # Check if ports are already in use
   netstat -tuln | grep 8080
   netstat -tuln | grep 8090
   ```

2. Change ports in `.env` file:
   ```ini
   # Adjust port mappings
   OT_FRONTEND_EXP_PORT=8081
   OPENTALK_CONTROLLER_EXP_PORT=8091
   ```

3. Restart services:
   ```bash
   docker compose down
   docker compose up -d
   ```

## Whiteboard/Etherpad Integration Issues

### Collaborative Services Not Available

**Symptoms**:
- Whiteboard or Etherpad icons don't appear in meetings
- "Service unavailable" errors when accessing these features

**Solutions**:
1. Verify services are enabled in profiles:
   ```bash
   # Check current profiles
   grep COMPOSE_PROFILES .env
   
   # Update profiles if needed
   echo 'COMPOSE_PROFILES=core,whiteboard,pad' >> .env
   ```

2. Check feature flags:
   ```bash
   # Verify whiteboard is enabled
   grep FEATURE_WHITEBOARD .env
   
   # Enable if needed
   echo 'FEATURE_WHITEBOARD=true' >> .env
   ```

3. Verify API keys are correctly set:
   ```bash
   # Check Etherpad key
   grep ETHERPAD_API_KEY .env
   
   # Check Spacedeck key
   grep SPACEDECK_API_TOKEN .env
   ```

4. Restart services:
   ```bash
   docker compose down
   docker compose up -d
   ```

## Proxy/NGINX Issues

### SSL Certificate Problems

**Symptoms**:
- Browser shows certificate warnings
- Mixed content errors
- Secure WebSocket connections fail

**Solutions**:
1. Verify SSL certificates:
   ```bash
   # Check certificate validity
   openssl x509 -in /etc/letsencrypt/live/example.com/fullchain.pem -text -noout
   ```

2. Test NGINX configuration:
   ```bash
   nginx -t
   ```

3. Check CORS settings in NGINX:
   ```bash
   # Ensure proper CORS headers
   grep -r "add_header Access-Control-Allow" /etc/nginx/
   ```

4. Verify WebSocket proxy settings:
   ```bash
   # Check for proper WebSocket configuration
   grep -r "proxy_set_header Upgrade" /etc/nginx/
   ```

## Performance Issues

### Slow Meeting Connections

**Symptoms**:
- Long loading times when joining meetings
- Audio/video takes a long time to connect

**Solutions**:
1. Check server resources:
   ```bash
   # Monitor CPU and memory
   top
   
   # Check disk space
   df -h
   ```

2. Review database performance:
   ```bash
   # Check for slow queries
   docker compose exec postgres psql -U ot -d opentalk -c "SELECT * FROM pg_stat_activity"
   ```

3. Consider scaling resources:
   - Increase container memory limits
   - Add more CPU resources
   - Use external database services

### Memory Leaks

**Symptoms**:
- Increasing memory usage over time
- Services become unresponsive after running for a while

**Solutions**:
1. Monitor container memory usage:
   ```bash
   docker stats
   ```

2. Implement container restart policy:
   ```yaml
   # In docker-compose.yml
   services:
     web-frontend:
       restart: unless-stopped
       # Memory limits
       mem_limit: 1g
   ```

3. Schedule regular service restarts during off-hours

## Upgrading Issues

### Migration Problems

**Symptoms**:
- Database migration fails
- Errors about missing columns or tables

**Solutions**:
1. Backup before upgrading:
   ```bash
   # Backup PostgreSQL database
   docker compose exec postgres pg_dump -U ot opentalk > opentalk_backup.sql
   
   # Backup configuration
   cp -r config config.bak
   cp .env .env.bak
   ```

2. Check version compatibility:
   - Review release notes for breaking changes
   - Ensure all components are upgraded together

3. Follow a controlled upgrade process:
   ```bash
   # Pull new images
   git pull
   docker compose pull
   
   # Stop services
   docker compose down
   
   # Start with database first
   docker compose up -d postgres
   sleep 30
   
   # Start other services
   docker compose up -d
   ```

## Getting Help

If you're still experiencing issues:

1. **Check logs** for detailed error messages:
   ```bash
   docker compose logs --tail=100 > opentalk_logs.txt
   ```

2. **Collect system information**:
   ```bash
   # System info
   uname -a > system_info.txt
   
   # Docker info
   docker info >> system_info.txt
   docker compose version >> system_info.txt
   
   # Configuration (remove secrets)
   grep -v PASSWORD .env > env_cleaned.txt
   cat config/controller.toml | grep -v secret > controller_cleaned.txt
   ```

3. **Reach out to the community** with specific error messages and configuration details:
   - [OpenTalk GitLab Issues](https://gitlab.opencode.de/opentalk/ot-setup/-/issues)
   - Consider opening a new issue with your detailed troubleshooting information