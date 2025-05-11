---
sidebar_position: 2
title: DNS Configuration
description: Setting up DNS records for your OpenTalk deployment
---

# DNS Configuration

Proper DNS configuration is crucial for a successful OpenTalk deployment. This guide explains the required DNS records and provides a tool to verify your configuration.

## Required DNS Records

For a complete OpenTalk installation, you should configure the following DNS records:

| Type  | Name                 | Value/Target        | Required?  | Purpose                    |
|-------|----------------------|--------------------|------------|----------------------------|
| A     | example.com          | Your server's IP   | Yes        | Main domain                |
| CNAME | accounts.example.com | example.com        | Yes        | Keycloak authentication    |
| CNAME | api.example.com      | example.com        | Yes        | Controller API             |
| CNAME | livekit.example.com  | example.com        | Yes        | WebRTC media server        |
| CNAME | minio.example.com    | example.com        | Optional   | Object storage             |
| CNAME | pad.example.com      | example.com        | Optional   | Etherpad (collaborative editor) |
| CNAME | whiteboard.example.com | example.com      | Optional   | Spacedeck (whiteboard)     |
| CNAME | recordings.example.com | example.com      | Optional   | Recordings access          |
| CNAME | terdoc.example.com   | example.com        | Optional   | Document viewer            |
| CNAME | rabbitmq.example.com | example.com        | Optional   | RabbitMQ management        |
| CNAME | sip.example.com      | example.com        | Optional   | SIP service                |
| SRV   | _sip._udp.example.com | 10 10 5060 sip.example.com | Optional | SIP service configuration |

Replace `example.com` with your actual domain name and "Your server's IP" with the public IP address of your OpenTalk server.

## DNS Record Types Explained

### A Record
The A record maps your main domain directly to your server's IP address. This is the primary record that clients will use to connect to your OpenTalk instance.

### CNAME Records
CNAME (Canonical Name) records are aliases that point to another domain name. In this case, all subdomains (accounts, api, livekit, etc.) point to your main domain, which in turn points to your server's IP address.

### SRV Record
The SRV (Service) record is used specifically for the SIP telephony integration. It helps SIP clients discover the correct server and port for SIP communication.

## DNS Checker Script

We provide a script that can help you verify your DNS configuration. The script checks whether all required and optional DNS records are properly configured and resolving to the expected IP address.

### Usage

```bash
# Download the script
wget https://raw.githubusercontent.com/opencloud-community/ot-docs-community/main/scripts/check-dns.sh
chmod +x check-dns.sh

# Run the script with your domain
./check-dns.sh example.com

# Alternatively, specify your server's IP explicitly
./check-dns.sh example.com 192.0.2.123
```

### Sample Output

```
OpenTalk DNS Check for example.com

[ INFO ] No server IP provided, resolving from main domain
[ INFO ] Using resolved IP: 192.0.2.123

Checking Core DNS Records:
[ OK ] example.com resolves to 192.0.2.123
[ OK ] accounts.example.com resolves to 192.0.2.123
[ OK ] api.example.com resolves to 192.0.2.123
[ OK ] livekit.example.com resolves to 192.0.2.123

Checking Optional Service DNS Records:
[ OK ] minio.example.com resolves to 192.0.2.123
[ OK ] whiteboard.example.com resolves to 192.0.2.123
[ OK ] pad.example.com resolves to 192.0.2.123
[ WARNING ] recordings.example.com does not resolve to any IP address
[ WARNING ] terdoc.example.com does not resolve to any IP address
[ OK ] traefik.example.com resolves to 192.0.2.123
[ OK ] rabbitmq.example.com resolves to 192.0.2.123
[ OK ] sip.example.com resolves to 192.0.2.123

Checking SIP SRV Records:
[ OK ] SRV record _sip._udp.example.com exists: 10 10 5060 sip.example.com.

DNS Propagation Check:
[ OK ] Domain example.com has propagated to 8.8.8.8 (resolved to 192.0.2.123)
[ OK ] Domain example.com has propagated to 1.1.1.1 (resolved to 192.0.2.123)
[ OK ] Domain example.com has propagated to 9.9.9.9 (resolved to 192.0.2.123)

Summary:
[ INFO ] Checked domain: example.com
[ INFO ] Expected server IP: 192.0.2.123
[ INFO ] All DNS records should point to this IP for proper OpenTalk functionality

[ INFO ] If you see any errors or warnings, please correct your DNS settings and run this script again
[ INFO ] For more information, refer to the OpenTalk Community Documentation:
[ INFO ] https://opencloud-community.github.io/ot-docs-community/
```

## Common DNS Issues and Solutions

### DNS Propagation Delays

DNS changes can take time to propagate across the internet. Propagation time can range from a few minutes to 48 hours, depending on the DNS provider and TTL (Time To Live) settings.

**Solution**: Wait for DNS propagation to complete. You can use our checker script to verify when records have propagated to major DNS servers.

### Missing Required Records

If you're missing any of the required records (main domain, accounts, api, livekit), OpenTalk will not function properly.

**Solution**: Ensure all required DNS records are properly configured according to the table above.

### Incorrect IP Address

If your DNS records point to an incorrect IP address, clients won't be able to connect to your OpenTalk server.

**Solution**: Verify the IP address in your A record matches your server's public IP address.

### SRV Record Configuration

The SRV record for SIP functionality follows this format:
```
_sip._udp.example.com. IN SRV 10 10 5060 sip.example.com.
```

Where:
- `10` is the priority (lower values are tried first)
- `10` is the weight (used to balance load between servers with the same priority)
- `5060` is the port number for SIP
- `sip.example.com` is the target hostname

**Solution**: Ensure your SRV record follows this format and that the target hostname (`sip.example.com`) is also properly configured as a CNAME record.

## DNS Provider-Specific Instructions

### Cloudflare

1. Log in to your Cloudflare account
2. Select your domain
3. Go to the DNS tab
4. Click "Add record" for each required record
5. For Cloudflare, it's recommended to set the proxy status to "DNS only" for LiveKit and SIP records to ensure WebRTC and SIP work correctly

### AWS Route 53

1. Log in to the AWS Management Console
2. Navigate to Route 53
3. Select your hosted zone
4. Click "Create record"
5. Enter the record details according to the table above

### GoDaddy

1. Log in to your GoDaddy account
2. Go to My Products > DNS
3. Find your domain and click "DNS Management"
4. Add records according to the table above

## Next Steps

Once your DNS is correctly configured and propagated, you can proceed with:

1. [Setting up SSL certificates](./configuration/security-ssl.md)
2. [Configuring the OpenTalk controller](./configuration/controller-config.md)
3. [Setting up NGINX as a reverse proxy](./configuration/nginx-setup.md)