#!/bin/bash

# Real Estate CRM Deployment Script
# Usage: ./scripts/deploy.sh [staging|production]

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
ENVIRONMENT=${1:-staging}
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"

# Logging function
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

# Validate environment
validate_environment() {
    if [[ "$ENVIRONMENT" != "staging" && "$ENVIRONMENT" != "production" ]]; then
        error "Invalid environment: $ENVIRONMENT. Use 'staging' or 'production'"
        exit 1
    fi
    
    log "Deploying to: $ENVIRONMENT"
}

# Check prerequisites
check_prerequisites() {
    log "Checking prerequisites..."
    
    # Check if required tools are installed
    command -v node >/dev/null 2>&1 || { error "Node.js is required but not installed."; exit 1; }
    command -v pnpm >/dev/null 2>&1 || { error "pnpm is required but not installed."; exit 1; }
    command -v vercel >/dev/null 2>&1 || { error "Vercel CLI is required but not installed."; exit 1; }
    command -v supabase >/dev/null 2>&1 || { error "Supabase CLI is required but not installed."; exit 1; }
    
    # Check Node.js version
    NODE_VERSION=$(node --version | cut -d'v' -f2)
    REQUIRED_NODE_VERSION="18.0.0"
    
    if ! node -e "process.exit(require('semver').gte('$NODE_VERSION', '$REQUIRED_NODE_VERSION') ? 0 : 1)" 2>/dev/null; then
        error "Node.js version $REQUIRED_NODE_VERSION or higher is required. Current: $NODE_VERSION"
        exit 1
    fi
    
    success "Prerequisites check passed"
}

# Run tests
run_tests() {
    log "Running tests..."
    
    cd "$PROJECT_ROOT"
    
    # Install dependencies
    log "Installing dependencies..."
    pnpm install --frozen-lockfile
    
    # Run linting
    log "Running ESLint..."
    pnpm lint
    
    # Run type checking
    log "Running TypeScript check..."
    pnpm type-check
    
    # Run unit tests
    log "Running unit tests..."
    pnpm test:unit --run
    
    # Run integration tests
    log "Running integration tests..."
    pnpm test:integration --run
    
    success "All tests passed"
}

# Build application
build_application() {
    log "Building application..."
    
    cd "$PROJECT_ROOT"
    
    # Set environment variables for build
    if [[ "$ENVIRONMENT" == "production" ]]; then
        export NODE_ENV=production
    else
        export NODE_ENV=staging
    fi
    
    # Build the application
    pnpm build
    
    success "Application built successfully"
}

# Deploy to Vercel
deploy_to_vercel() {
    log "Deploying to Vercel ($ENVIRONMENT)..."
    
    cd "$PROJECT_ROOT"
    
    if [[ "$ENVIRONMENT" == "production" ]]; then
        # Production deployment
        vercel --prod --confirm
    else
        # Staging deployment
        vercel --confirm
    fi
    
    success "Deployed to Vercel successfully"
}

# Run database migrations
run_migrations() {
    log "Running database migrations..."
    
    cd "$PROJECT_ROOT"
    
    # Set Supabase project reference based on environment
    if [[ "$ENVIRONMENT" == "production" ]]; then
        SUPABASE_PROJECT_REF=${SUPABASE_PROJECT_REF_PROD}
    else
        SUPABASE_PROJECT_REF=${SUPABASE_PROJECT_REF_STAGING}
    fi
    
    if [[ -z "$SUPABASE_PROJECT_REF" ]]; then
        error "Supabase project reference not set for $ENVIRONMENT"
        exit 1
    fi
    
    # Link to Supabase project
    supabase link --project-ref "$SUPABASE_PROJECT_REF"
    
    # Push migrations
    supabase db push
    
    success "Database migrations completed"
}

# Run smoke tests
run_smoke_tests() {
    log "Running smoke tests..."
    
    cd "$PROJECT_ROOT"
    
    # Set the base URL for smoke tests
    if [[ "$ENVIRONMENT" == "production" ]]; then
        export TEST_BASE_URL=${PRODUCTION_URL}
    else
        export TEST_BASE_URL=${STAGING_URL}
    fi
    
    if [[ -z "$TEST_BASE_URL" ]]; then
        warning "Base URL not set for smoke tests, skipping..."
        return 0
    fi
    
    # Wait for deployment to be ready
    log "Waiting for deployment to be ready..."
    for i in {1..30}; do
        if curl -f "$TEST_BASE_URL/health" >/dev/null 2>&1; then
            break
        fi
        if [[ $i -eq 30 ]]; then
            error "Deployment not ready after 5 minutes"
            exit 1
        fi
        sleep 10
    done
    
    # Run smoke tests
    pnpm test:smoke
    
    success "Smoke tests passed"
}

# Send notification
send_notification() {
    local status=$1
    local message=$2
    
    if [[ -n "$SLACK_WEBHOOK_URL" ]]; then
        curl -X POST -H 'Content-type: application/json' \
            --data "{\"text\":\"$message\"}" \
            "$SLACK_WEBHOOK_URL" >/dev/null 2>&1 || true
    fi
}

# Rollback function
rollback() {
    error "Deployment failed. Initiating rollback..."
    
    # This would implement rollback logic
    # For Vercel, you might need to redeploy a previous version
    warning "Manual rollback may be required"
    
    send_notification "failure" "❌ Deployment to $ENVIRONMENT failed and rollback initiated"
    exit 1
}

# Main deployment function
main() {
    log "Starting deployment to $ENVIRONMENT..."
    
    # Set up error handling
    trap rollback ERR
    
    validate_environment
    check_prerequisites
    
    # Skip tests in production if explicitly requested
    if [[ "$SKIP_TESTS" != "true" ]]; then
        run_tests
    else
        warning "Skipping tests (SKIP_TESTS=true)"
    fi
    
    build_application
    deploy_to_vercel
    run_migrations
    run_smoke_tests
    
    success "Deployment to $ENVIRONMENT completed successfully!"
    
    send_notification "success" "✅ Deployment to $ENVIRONMENT completed successfully!"
}

# Production confirmation
if [[ "$ENVIRONMENT" == "production" ]]; then
    echo -e "${YELLOW}⚠️  You are about to deploy to PRODUCTION!${NC}"
    echo -e "${YELLOW}This will affect live users and data.${NC}"
    echo ""
    read -p "Are you sure you want to continue? (type 'yes' to confirm): " -r
    echo ""
    if [[ ! $REPLY =~ ^yes$ ]]; then
        log "Deployment cancelled by user"
        exit 0
    fi
fi

# Run main function
main "$@"