#!/bin/bash
#
# OpenTalk DNS Check Script
# =========================
# This script verifies that all required DNS records for an OpenTalk installation
# are correctly configured and resolving to the expected IP address.
#
# Usage: ./check-dns.sh example.com [server_ip]
#
# If server_ip is not provided, the script will use the resolved IP of the main domain
# as the expected IP for all other records.

set -e

# Text formatting
BOLD="\033[1m"
RED="\033[0;31m"
GREEN="\033[0;32m"
YELLOW="\033[0;33m"
BLUE="\033[0;34m"
RESET="\033[0m"

# Function to print status messages
print_status() {
    local status=$1
    local message=$2
    
    if [ "$status" = "OK" ]; then
        echo -e "[ ${GREEN}OK${RESET} ] $message"
    elif [ "$status" = "WARNING" ]; then
        echo -e "[ ${YELLOW}WARNING${RESET} ] $message"
    elif [ "$status" = "ERROR" ]; then
        echo -e "[ ${RED}ERROR${RESET} ] $message"
    elif [ "$status" = "INFO" ]; then
        echo -e "[ ${BLUE}INFO${RESET} ] $message"
    else
        echo -e "[ $status ] $message"
    fi
}

# Function to check if a command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Check required dependencies
check_dependencies() {
    local missing_deps=false
    
    if ! command_exists dig; then
        print_status "ERROR" "dig command not found. Please install bind-utils or dnsutils package."
        missing_deps=true
    fi
    
    if ! command_exists host; then
        print_status "ERROR" "host command not found. Please install bind-utils or dnsutils package."
        missing_deps=true
    fi
    
    if [ "$missing_deps" = true ]; then
        echo ""
        print_status "INFO" "On Ubuntu/Debian: sudo apt-get install dnsutils"
        print_status "INFO" "On CentOS/RHEL: sudo yum install bind-utils"
        print_status "INFO" "On macOS with Homebrew: brew install bind"
        exit 1
    fi
}

# Function to check if a domain resolves to an IP
check_domain_resolution() {
    local domain=$1
    local expected_ip=$2
    local record_type=$3
    
    # Get the actual IP address the domain resolves to
    local resolved_ip
    
    if [ "$record_type" = "A" ]; then
        resolved_ip=$(dig +short A "$domain" 2>/dev/null)
    elif [ "$record_type" = "CNAME" ]; then
        # For CNAME, we need to first get the canonical name and then resolve it
        local canonical=$(dig +short CNAME "$domain" 2>/dev/null)
        if [ -n "$canonical" ]; then
            resolved_ip=$(dig +short A "$canonical" 2>/dev/null)
            if [ -z "$resolved_ip" ]; then
                # Try resolving the CNAME directly
                resolved_ip=$(dig +short A "$domain" 2>/dev/null)
            fi
        else
            # If there's no CNAME record, try to resolve the A record directly
            resolved_ip=$(dig +short A "$domain" 2>/dev/null)
        fi
    fi
    
    if [ -z "$resolved_ip" ]; then
        print_status "ERROR" "$domain does not resolve to any IP address"
        return 1
    elif [ "$resolved_ip" = "$expected_ip" ]; then
        print_status "OK" "$domain resolves to $resolved_ip"
        return 0
    else
        print_status "ERROR" "$domain resolves to $resolved_ip, but expected $expected_ip"
        return 1
    fi
}

# Function to check SRV record
check_srv_record() {
    local domain=$1
    local service=$2
    local protocol=$3
    
    local srv_record=$(dig +short SRV "_${service}._${protocol}.${domain}" 2>/dev/null)
    
    if [ -n "$srv_record" ]; then
        print_status "OK" "SRV record _${service}._${protocol}.${domain} exists: $srv_record"
        return 0
    else
        print_status "WARNING" "No SRV record found for _${service}._${protocol}.${domain}"
        return 1
    fi
}

# Main function
main() {
    # Check if we have the required commands
    check_dependencies
    
    # Check if domain argument is provided
    if [ $# -lt 1 ]; then
        echo "Usage: $0 example.com [server_ip]"
        exit 1
    fi
    
    # Get the domain and optional server IP
    local domain=$1
    local server_ip=$2
    
    echo -e "${BOLD}OpenTalk DNS Check for ${domain}${RESET}\n"
    
    # If server IP is not provided, try to get it from the main domain
    if [ -z "$server_ip" ]; then
        print_status "INFO" "No server IP provided, resolving from main domain"
        server_ip=$(dig +short A "$domain" 2>/dev/null)
        
        if [ -z "$server_ip" ]; then
            print_status "ERROR" "Could not resolve IP for $domain. Please provide the server IP as the second argument."
            exit 1
        fi
        
        print_status "INFO" "Using resolved IP: $server_ip"
    fi
    
    echo -e "\n${BOLD}Checking Core DNS Records:${RESET}"
    
    # Check main domain (A record)
    check_domain_resolution "$domain" "$server_ip" "A"
    
    # Required subdomains for core services
    local core_subdomains=("accounts" "api" "livekit")
    for subdomain in "${core_subdomains[@]}"; do
        check_domain_resolution "${subdomain}.${domain}" "$server_ip" "CNAME"
    done
    
    echo -e "\n${BOLD}Checking Optional Service DNS Records:${RESET}"
    
    # Optional subdomains for additional services
    local optional_subdomains=("minio" "whiteboard" "pad" "recordings" "terdoc" "traefik" "rabbitmq" "sip")
    for subdomain in "${optional_subdomains[@]}"; do
        check_domain_resolution "${subdomain}.${domain}" "$server_ip" "CNAME"
    done
    
    echo -e "\n${BOLD}Checking SIP SRV Records:${RESET}"
    
    # Check SIP SRV record (optional but recommended for phone integration)
    check_srv_record "$domain" "sip" "udp"
    
    echo -e "\n${BOLD}DNS Propagation Check:${RESET}"
    
    # Check if DNS records have propagated to public DNS servers
    local public_dns=("8.8.8.8" "1.1.1.1" "9.9.9.9")
    for dns in "${public_dns[@]}"; do
        local resolved=$(dig @"$dns" +short A "$domain" 2>/dev/null)
        if [ "$resolved" = "$server_ip" ]; then
            print_status "OK" "Domain $domain has propagated to $dns (resolved to $resolved)"
        else
            print_status "WARNING" "Domain $domain has not fully propagated to $dns (resolved to $resolved)"
        fi
    done
    
    echo -e "\n${BOLD}Summary:${RESET}"
    print_status "INFO" "Checked domain: $domain"
    print_status "INFO" "Expected server IP: $server_ip"
    print_status "INFO" "All DNS records should point to this IP for proper OpenTalk functionality"
    
    echo ""
    print_status "INFO" "If you see any errors or warnings, please correct your DNS settings and run this script again"
    print_status "INFO" "For more information, refer to the OpenTalk Community Documentation:"
    print_status "INFO" "https://opencloud-community.github.io/ot-docs-community/"
}

# Run the main function
main "$@"