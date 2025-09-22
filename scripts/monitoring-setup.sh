#!/bin/bash

# Real Estate CRM Monitoring Setup Script
# This script sets up external monitoring services and tools

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

log() {
    echo -e "${BLUE}[$(date +'%Y-%m-%d %H:%M:%S')]${NC} $1"
}

error() {
    echo -e "${RED}[ERROR]${NC} $1" >&2
}

success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

# Check if required environment variables are set
check_env_vars() {
    log "Checking environment variables..."
    
    local required_vars=(
        "PRODUCTION_URL"
        "STAGING_URL"
        "SLACK_WEBHOOK_URL"
        "ADMIN_EMAIL"
    )
    
    local missing_vars=()
    
    for var in "${required_vars[@]}"; do
        if [[ -z "${!var}" ]]; then
            missing_vars+=("$var")
        fi
    done
    
    if [[ ${#missing_vars[@]} -gt 0 ]]; then
        error "Missing required environment variables:"
        for var in "${missing_vars[@]}"; do
            echo "  - $var"
        done
        exit 1
    fi
    
    success "All required environment variables are set"
}

# Setup UptimeRobot monitoring
setup_uptimerobot() {
    log "Setting up UptimeRobot monitoring..."
    
    if [[ -z "$UPTIMEROBOT_API_KEY" ]]; then
        warning "UPTIMEROBOT_API_KEY not set, skipping UptimeRobot setup"
        return 0
    fi
    
    # Create monitors for production and staging
    local monitors=(
        "Production Main:$PRODUCTION_URL"
        "Production API:$PRODUCTION_URL/api/health"
        "Production Database:$PRODUCTION_URL/api/health/database"
        "Staging Main:$STAGING_URL"
        "Staging API:$STAGING_URL/api/health"
    )
    
    for monitor in "${monitors[@]}"; do
        local name="${monitor%%:*}"
        local url="${monitor##*:}"
        
        log "Creating UptimeRobot monitor: $name"
        
        curl -X POST "https://api.uptimerobot.com/v2/newMonitor" \
            -H "Content-Type: application/x-www-form-urlencoded" \
            -d "api_key=$UPTIMEROBOT_API_KEY" \
            -d "format=json" \
            -d "type=1" \
            -d "url=$url" \
            -d "friendly_name=$name" \
            -d "interval=300" \
            -d "timeout=30" \
            -d "alert_contacts=$UPTIMEROBOT_ALERT_CONTACTS" \
            --silent > /dev/null
        
        if [[ $? -eq 0 ]]; then
            success "Created monitor: $name"
        else
            error "Failed to create monitor: $name"
        fi
    done
}

# Setup Pingdom monitoring
setup_pingdom() {
    log "Setting up Pingdom monitoring..."
    
    if [[ -z "$PINGDOM_API_KEY" ]]; then
        warning "PINGDOM_API_KEY not set, skipping Pingdom setup"
        return 0
    fi
    
    # Create Pingdom checks
    local checks=(
        "Real Estate CRM Production:$PRODUCTION_URL"
        "Real Estate CRM Staging:$STAGING_URL"
    )
    
    for check in "${checks[@]}"; do
        local name="${check%%:*}"
        local url="${check##*:}"
        
        log "Creating Pingdom check: $name"
        
        curl -X POST "https://api.pingdom.com/api/3.1/checks" \
            -H "Authorization: Bearer $PINGDOM_API_KEY" \
            -H "Content-Type: application/json" \
            -d "{
                \"name\": \"$name\",
                \"host\": \"$(echo $url | sed 's|https\?://||' | cut -d'/' -f1)\",
                \"type\": \"http\",
                \"url\": \"$url\",
                \"resolution\": 5,
                \"sendnotificationwhendown\": 2,
                \"notifyagainevery\": 0,
                \"notifywhenbackup\": true
            }" \
            --silent > /dev/null
        
        if [[ $? -eq 0 ]]; then
            success "Created Pingdom check: $name"
        else
            error "Failed to create Pingdom check: $name"
        fi
    done
}

# Setup Sentry error tracking
setup_sentry() {
    log "Setting up Sentry error tracking..."
    
    if [[ -z "$SENTRY_ORG" ]] || [[ -z "$SENTRY_PROJECT" ]] || [[ -z "$SENTRY_AUTH_TOKEN" ]]; then
        warning "Sentry configuration not complete, skipping Sentry setup"
        return 0
    fi
    
    # Install Sentry CLI if not present
    if ! command -v sentry-cli &> /dev/null; then
        log "Installing Sentry CLI..."
        curl -sL https://sentry.io/get-cli/ | bash
    fi
    
    # Configure Sentry
    cat > .sentryclirc << EOF
[defaults]
org=$SENTRY_ORG
project=$SENTRY_PROJECT

[auth]
token=$SENTRY_AUTH_TOKEN
EOF
    
    # Create release
    local release_version=$(date +%Y%m%d-%H%M%S)
    log "Creating Sentry release: $release_version"
    
    sentry-cli releases new "$release_version"
    sentry-cli releases set-commits "$release_version" --auto
    sentry-cli releases finalize "$release_version"
    
    success "Sentry setup completed"
}

# Setup Grafana dashboards
setup_grafana() {
    log "Setting up Grafana dashboards..."
    
    if [[ -z "$GRAFANA_URL" ]] || [[ -z "$GRAFANA_API_KEY" ]]; then
        warning "Grafana configuration not set, skipping Grafana setup"
        return 0
    fi
    
    # Create dashboard JSON
    cat > grafana-dashboard.json << 'EOF'
{
  "dashboard": {
    "id": null,
    "title": "Real Estate CRM Monitoring",
    "tags": ["real-estate", "crm", "monitoring"],
    "timezone": "browser",
    "panels": [
      {
        "id": 1,
        "title": "API Response Times",
        "type": "graph",
        "targets": [
          {
            "expr": "histogram_quantile(0.95, rate(http_request_duration_seconds_bucket[5m]))",
            "legendFormat": "95th percentile"
          }
        ],
        "gridPos": {"h": 8, "w": 12, "x": 0, "y": 0}
      },
      {
        "id": 2,
        "title": "Error Rate",
        "type": "graph",
        "targets": [
          {
            "expr": "rate(http_requests_total{status=~\"5..\"}[5m])",
            "legendFormat": "5xx errors"
          }
        ],
        "gridPos": {"h": 8, "w": 12, "x": 12, "y": 0}
      },
      {
        "id": 3,
        "title": "Database Performance",
        "type": "graph",
        "targets": [
          {
            "expr": "histogram_quantile(0.95, rate(database_query_duration_seconds_bucket[5m]))",
            "legendFormat": "95th percentile"
          }
        ],
        "gridPos": {"h": 8, "w": 12, "x": 0, "y": 8}
      },
      {
        "id": 4,
        "title": "Active Users",
        "type": "stat",
        "targets": [
          {
            "expr": "active_sessions_total",
            "legendFormat": "Active Sessions"
          }
        ],
        "gridPos": {"h": 8, "w": 12, "x": 12, "y": 8}
      }
    ],
    "time": {
      "from": "now-1h",
      "to": "now"
    },
    "refresh": "30s"
  },
  "overwrite": true
}
EOF
    
    # Upload dashboard to Grafana
    curl -X POST "$GRAFANA_URL/api/dashboards/db" \
        -H "Authorization: Bearer $GRAFANA_API_KEY" \
        -H "Content-Type: application/json" \
        -d @grafana-dashboard.json \
        --silent > /dev/null
    
    if [[ $? -eq 0 ]]; then
        success "Grafana dashboard created"
    else
        error "Failed to create Grafana dashboard"
    fi
    
    rm -f grafana-dashboard.json
}

# Setup log aggregation
setup_log_aggregation() {
    log "Setting up log aggregation..."
    
    # Create log configuration for production
    cat > logging-config.json << EOF
{
  "version": 1,
  "disable_existing_loggers": false,
  "formatters": {
    "standard": {
      "format": "%(asctime)s [%(levelname)s] %(name)s: %(message)s"
    },
    "json": {
      "format": "{\"timestamp\": \"%(asctime)s\", \"level\": \"%(levelname)s\", \"logger\": \"%(name)s\", \"message\": \"%(message)s\"}"
    }
  },
  "handlers": {
    "console": {
      "class": "logging.StreamHandler",
      "level": "INFO",
      "formatter": "json",
      "stream": "ext://sys.stdout"
    },
    "file": {
      "class": "logging.handlers.RotatingFileHandler",
      "level": "INFO",
      "formatter": "json",
      "filename": "/var/log/real-estate-crm/app.log",
      "maxBytes": 10485760,
      "backupCount": 5
    }
  },
  "loggers": {
    "": {
      "level": "INFO",
      "handlers": ["console", "file"],
      "propagate": false
    }
  }
}
EOF
    
    success "Log aggregation configuration created"
}

# Test monitoring endpoints
test_monitoring() {
    log "Testing monitoring endpoints..."
    
    local endpoints=(
        "$PRODUCTION_URL/health"
        "$PRODUCTION_URL/api/health"
        "$PRODUCTION_URL/api/health/database"
        "$PRODUCTION_URL/api/monitoring/health"
    )
    
    for endpoint in "${endpoints[@]}"; do
        log "Testing endpoint: $endpoint"
        
        local status_code=$(curl -s -o /dev/null -w "%{http_code}" "$endpoint")
        
        if [[ "$status_code" == "200" ]]; then
            success "✓ $endpoint (HTTP $status_code)"
        else
            error "✗ $endpoint (HTTP $status_code)"
        fi
    done
}

# Send test alert
send_test_alert() {
    log "Sending test alert..."
    
    if [[ -n "$SLACK_WEBHOOK_URL" ]]; then
        curl -X POST "$SLACK_WEBHOOK_URL" \
            -H "Content-Type: application/json" \
            -d '{
                "text": "🧪 Test Alert: Real Estate CRM Monitoring Setup Complete",
                "attachments": [
                    {
                        "color": "good",
                        "fields": [
                            {
                                "title": "Status",
                                "value": "Monitoring system is now active",
                                "short": true
                            },
                            {
                                "title": "Timestamp",
                                "value": "'$(date -u +"%Y-%m-%dT%H:%M:%SZ")'",
                                "short": true
                            }
                        ]
                    }
                ]
            }' \
            --silent > /dev/null
        
        if [[ $? -eq 0 ]]; then
            success "Test alert sent to Slack"
        else
            error "Failed to send test alert to Slack"
        fi
    fi
}

# Main setup function
main() {
    log "Starting monitoring setup..."
    
    check_env_vars
    setup_uptimerobot
    setup_pingdom
    setup_sentry
    setup_grafana
    setup_log_aggregation
    test_monitoring
    send_test_alert
    
    success "Monitoring setup completed successfully!"
    
    log "Next steps:"
    echo "1. Verify all monitoring services are working correctly"
    echo "2. Set up alert notification channels (email, SMS, etc.)"
    echo "3. Configure alert thresholds based on your requirements"
    echo "4. Test failover and recovery procedures"
    echo "5. Document monitoring procedures for your team"
}

# Run main function
main "$@"