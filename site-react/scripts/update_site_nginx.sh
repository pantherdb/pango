#!/bin/bash

# Strict error handling
set -euo pipefail
IFS=$'\n\t'

# Configuration
SITE_ROOT="/var/www/pango"
PROJECT_ROOT="/home/ubuntu/projects/pango"
DIST_DIR="${PROJECT_ROOT}/site-react/dist"
BACKUP_DIR="${SITE_ROOT}/old"
LOG_FILE="/var/log/pango-deploy.log"
NGINX_CONF="/etc/nginx/sites-available/pango"
DATE_SUFFIX=$(date +'%Y-%m-%d-%H%M')

# Logging function
log() {
    echo "[$(date +'%Y-%m-%d %H:%M:%S')] $1" | tee -a "$LOG_FILE"
}

# Check if running as root
if [[ $EUID -ne 0 ]]; then
    log "Error: This script must be run as root"
    exit 1
fi

# Verify source directory exists and is not empty
if [[ ! -d "$DIST_DIR" ]] || [[ -z "$(ls -A $DIST_DIR)" ]]; then
    log "Error: Build directory $DIST_DIR is missing or empty"
    exit 1
fi

# Create backup
BACKUP_PATH="${BACKUP_DIR}/site-${DATE_SUFFIX}"
log "Creating backup at ${BACKUP_PATH}"
if [[ -d "${SITE_ROOT}/site" ]]; then
    mkdir -p "$BACKUP_DIR"
    cp -r "${SITE_ROOT}/site" "$BACKUP_PATH"
fi

# Deploy new version
log "Deploying new version from ${DIST_DIR}"
rm -rf "${SITE_ROOT}/site"
mv "$DIST_DIR" "${SITE_ROOT}/site"

# Set correct permissions
log "Setting permissions"
chown -R www-data:www-data "${SITE_ROOT}/site"
chmod -R 755 "${SITE_ROOT}/site"

# Test nginx configuration
log "Testing nginx configuration"
if ! nginx -t; then
    log "Error: Invalid nginx configuration"
    # Restore from backup
    log "Rolling back to previous version"
    rm -rf "${SITE_ROOT}/site"
    cp -r "$BACKUP_PATH" "${SITE_ROOT}/site"
    exit 1
fi

# Reload nginx
log "Reloading nginx"
systemctl reload nginx

log "Deployment completed successfully"

# Verify site is accessible
if curl -s --head http://localhost | grep "200 OK" > /dev/null; then
    log "Site verification successful"
else
    log "Warning: Site verification failed"
fi
