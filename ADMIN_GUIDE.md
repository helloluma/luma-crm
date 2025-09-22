# Luma CRM Administrator Guide

This guide is for system administrators responsible for managing, maintaining, and configuring Luma CRM.

## Table of Contents

1. [System Overview](#system-overview)
2. [User Management](#user-management)
3. [System Configuration](#system-configuration)
4. [Database Management](#database-management)
5. [Security Administration](#security-administration)
6. [Monitoring & Maintenance](#monitoring--maintenance)
7. [Backup & Recovery](#backup--recovery)
8. [Troubleshooting](#troubleshooting)
9. [Performance Optimization](#performance-optimization)
10. [Integration Management](#integration-management)

## System Overview

### Architecture Components

- **Frontend**: Next.js 15 with React and TypeScript
- **Backend**: Next.js API routes with Supabase
- **Database**: PostgreSQL via Supabase
- **Authentication**: Supabase Auth with role-based access
- **File Storage**: Supabase Storage
- **Email**: Resend service
- **SMS**: AWS SNS
- **Process Management**: PM2
- **Web Server**: Nginx (reverse proxy)

### System Requirements

- **Server**: 2+ CPU cores, 4GB+ RAM, 20GB+ SSD
- **Node.js**: Version 18 or higher
- **Database**: PostgreSQL 13+
- **SSL**: Let's Encrypt or custom certificates

## User Management

### User Roles

#### SuperAdmin
- Complete system access
- User management capabilities
- System configuration
- All financial data access

#### Admin  
- Full client and calendar access
- Financial data access
- Cannot manage users or system settings

#### Assistant
- Client management (view/edit)
- Calendar access
- No financial data access
- No administrative functions

### Adding Users

1. **Via Supabase Dashboard**:
   - Access your Supabase project
   - Go to Authentication → Users
   - Click "Add User"
   - Set email, password, and role metadata

2. **Via Application** (SuperAdmin only):
   - Navigate to System → User Management
   - Click "Add User"
   - Fill in user details and assign role
   - Send invitation email

### Managing User Roles

Update user roles in the database:

```sql
-- Update user role
UPDATE auth.users 
SET raw_user_meta_data = jsonb_set(
  COALESCE(raw_user_meta_data, '{}'), 
  '{role}', 
  '"Admin"'
) 
WHERE email = 'user@example.com';
```

### Deactivating Users

```sql
-- Disable user account
UPDATE auth.users 
SET banned_until = '2099-12-31'::timestamp 
WHERE email = 'user@example.com';
```

## System Configuration

### Environment Variables

Critical environment variables for production:

```bash
# Application
NODE_ENV=production
NEXTAUTH_URL=https://yourdomain.com
NEXTAUTH_SECRET=your_secure_secret_32_chars_minimum

# Database
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

# External Services
RESEND_API_KEY=your_resend_api_key
AWS_ACCESS_KEY_ID=your_aws_access_key
AWS_SECRET_ACCESS_KEY=your_aws_secret_access_key
AWS_REGION=us-east-1
LUMA_SMS_TO=your_notification_phone_number

# Security
RATE_LIMIT_ENABLED=true
RATE_LIMIT_MAX_REQUESTS=100
RATE_LIMIT_WINDOW_MS=900000
FORCE_HTTPS=true
```

### Application Settings

Configure application behavior via environment variables:

- **Logging Level**: `LOG_LEVEL=info`
- **Cache TTL**: `CACHE_TTL=3600`
- **File Upload Limits**: `MAX_FILE_SIZE=10485760`
- **Allowed File Types**: `ALLOWED_FILE_TYPES=pdf,doc,docx,jpg,jpeg,png`

### Notification Configuration

Configure notification behavior:

```bash
# Notification Settings
NOTIFICATION_QUIET_HOURS_START=22
NOTIFICATION_QUIET_HOURS_END=8
NOTIFICATION_DIGEST_TIME=09:00
HIGH_PRIORITY_SMS_ENABLED=true
MEDIUM_PRIORITY_EMAIL_ENABLED=true
```

## Database Management

### Schema Overview

Key database tables:
- `users`: User accounts and roles
- `clients`: Client information and status
- `client_stage_history`: Stage transition tracking
- `stage_alert_configs`: Stage notification configurations
- `transactions`: Financial transaction data
- `calendar_events`: Calendar and scheduling
- `notifications`: In-app notifications
- `audit_logs`: System change tracking

### Database Maintenance

#### Regular Maintenance Tasks

```sql
-- Analyze table statistics
ANALYZE;

-- Vacuum to reclaim space
VACUUM;

-- Reindex for performance
REINDEX DATABASE your_database_name;
```

#### Data Cleanup

```sql
-- Clean old audit logs (older than 1 year)
DELETE FROM audit_logs 
WHERE created_at < NOW() - INTERVAL '1 year';

-- Clean old notifications (older than 90 days)
DELETE FROM notifications 
WHERE created_at < NOW() - INTERVAL '90 days' 
AND read = true;
```

### Database Monitoring

Monitor database performance:

```sql
-- Check active connections
SELECT count(*) FROM pg_stat_activity;

-- Check slow queries
SELECT query, mean_exec_time, calls 
FROM pg_stat_statements 
ORDER BY mean_exec_time DESC 
LIMIT 10;

-- Check table sizes
SELECT 
  schemaname,
  tablename,
  pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) as size
FROM pg_tables 
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;
```

## Security Administration

### SSL Certificate Management

#### Let's Encrypt Certificates

```bash
# Check certificate status
sudo certbot certificates

# Renew certificates
sudo certbot renew

# Test renewal process
sudo certbot renew --dry-run
```

#### Custom Certificates

For custom SSL certificates:

1. Copy certificate files to `/etc/ssl/certs/`
2. Update Nginx configuration
3. Test configuration: `sudo nginx -t`
4. Reload Nginx: `sudo systemctl reload nginx`

### Security Monitoring

#### Fail2ban Management

```bash
# Check fail2ban status
sudo fail2ban-client status

# Check specific jail
sudo fail2ban-client status luma-crm-auth

# Unban IP address
sudo fail2ban-client set luma-crm-auth unbanip 192.168.1.100

# View banned IPs
sudo fail2ban-client status luma-crm-auth
```

#### Security Logs

Monitor security events:

```bash
# View security log
tail -f /var/log/luma-crm-security.log

# Check authentication failures
grep "Failed password" /var/log/auth.log

# Monitor Nginx access logs
tail -f /var/log/nginx/access.log | grep -E "(40[0-9]|50[0-9])"
```

### Access Control

#### API Rate Limiting

Configure rate limiting in Nginx:

```nginx
# Rate limiting zones
limit_req_zone $binary_remote_addr zone=api:10m rate=10r/s;
limit_req_zone $binary_remote_addr zone=login:10m rate=1r/s;

# Apply to locations
location /api/ {
    limit_req zone=api burst=20 nodelay;
    # ... other config
}
```

#### IP Whitelisting

For additional security, whitelist specific IP addresses:

```nginx
# Allow specific IPs
allow 192.168.1.0/24;
allow 10.0.0.0/8;
deny all;
```

## Monitoring & Maintenance

### Application Monitoring

#### PM2 Monitoring

```bash
# Check application status
pm2 status

# View real-time monitoring
pm2 monit

# View logs
pm2 logs luma-crm

# Restart application
pm2 restart luma-crm

# Reload application (zero-downtime)
pm2 reload luma-crm
```

#### Health Checks

```bash
# Manual health check
curl http://localhost:3000/api/health

# Automated health check script
./scripts/health-check.sh

# Check application metrics
curl http://localhost:3000/api/metrics
```

### System Monitoring

#### Resource Usage

```bash
# Check memory usage
free -h

# Check disk usage
df -h

# Check CPU usage
htop

# Check network connections
netstat -tulpn
```

#### Log Monitoring

```bash
# Application logs
pm2 logs luma-crm --lines 100

# System logs
journalctl -u luma-crm -f

# Nginx logs
tail -f /var/log/nginx/access.log
tail -f /var/log/nginx/error.log
```

### Performance Monitoring

#### Database Performance

```sql
-- Check slow queries
SELECT query, mean_exec_time, calls, total_exec_time
FROM pg_stat_statements 
ORDER BY mean_exec_time DESC 
LIMIT 10;

-- Check index usage
SELECT schemaname, tablename, attname, n_distinct, correlation 
FROM pg_stats 
WHERE schemaname = 'public';
```

#### Application Performance

Monitor application metrics:
- Response times
- Memory usage
- CPU utilization
- Database connection pool
- Cache hit rates

## Backup & Recovery

### Automated Backups

Backups are automatically created:
- Daily application backups at 2 AM
- Before each deployment
- Before rollbacks

#### Backup Locations

- Application backups: `/var/backups/luma-crm/`
- Database backups: Supabase automatic backups
- Configuration backups: Included in application backups

### Manual Backup

```bash
# Create application backup
./scripts/backup.sh

# Create database backup (if using custom PostgreSQL)
pg_dump $DATABASE_URL > backup_$(date +%Y%m%d_%H%M%S).sql
```

### Recovery Procedures

#### Application Recovery

```bash
# List available backups
./scripts/rollback.sh --list

# Rollback to specific backup
./scripts/rollback.sh --backup backup-20240101_120000.tar.gz

# Rollback to latest backup
./scripts/rollback.sh
```

#### Database Recovery

For Supabase:
1. Access Supabase dashboard
2. Navigate to Settings → Database
3. Use point-in-time recovery feature

For custom PostgreSQL:
```bash
# Restore from backup
psql $DATABASE_URL < backup_file.sql
```

### Disaster Recovery

#### Complete System Recovery

1. **Provision new server**
2. **Run setup scripts**:
   ```bash
   ./scripts/production-setup.sh
   ./scripts/security-hardening.sh
   ```
3. **Restore application**:
   ```bash
   ./scripts/rollback.sh --backup latest_backup.tar.gz
   ```
4. **Update DNS records**
5. **Verify SSL certificates**
6. **Test all functionality**

## Troubleshooting

### Common Issues

#### Application Won't Start

1. **Check PM2 status**:
   ```bash
   pm2 status
   pm2 logs luma-crm
   ```

2. **Check environment variables**:
   ```bash
   pm2 env 0
   ```

3. **Check port availability**:
   ```bash
   netstat -tulpn | grep :3000
   ```

#### Database Connection Issues

1. **Test connection**:
   ```bash
   psql $DATABASE_URL -c "SELECT 1;"
   ```

2. **Check environment variables**:
   ```bash
   echo $DATABASE_URL
   ```

3. **Check Supabase status**:
   - Visit Supabase status page
   - Check project dashboard

#### SSL Certificate Issues

1. **Check certificate status**:
   ```bash
   sudo certbot certificates
   openssl x509 -in /etc/letsencrypt/live/domain/cert.pem -text -noout
   ```

2. **Test renewal**:
   ```bash
   sudo certbot renew --dry-run
   ```

#### Performance Issues

1. **Check system resources**:
   ```bash
   htop
   iotop
   ```

2. **Check application performance**:
   ```bash
   pm2 monit
   ```

3. **Check database performance**:
   ```sql
   SELECT * FROM pg_stat_activity WHERE state = 'active';
   ```

### Log Analysis

#### Application Errors

```bash
# Search for errors in PM2 logs
pm2 logs luma-crm | grep -i error

# Search for specific error patterns
grep -r "Error:" /var/www/luma-crm/logs/
```

#### System Errors

```bash
# Check system logs
journalctl -xe

# Check Nginx errors
tail -f /var/log/nginx/error.log

# Check authentication failures
grep "authentication failure" /var/log/auth.log
```

## Performance Optimization

### Application Optimization

#### PM2 Configuration

Optimize PM2 settings in `ecosystem.config.js`:

```javascript
{
  instances: 'max',  // Use all CPU cores
  exec_mode: 'cluster',
  max_memory_restart: '1G',
  node_args: '--max-old-space-size=1024'
}
```

#### Caching

Enable caching for better performance:

```bash
# Enable Redis caching (if available)
ENABLE_CACHING=true
CACHE_TTL=3600
REDIS_URL=redis://localhost:6379
```

### Database Optimization

#### Index Optimization

```sql
-- Create indexes for frequently queried columns
CREATE INDEX CONCURRENTLY idx_clients_status ON clients(status);
CREATE INDEX CONCURRENTLY idx_clients_created_at ON clients(created_at);
CREATE INDEX CONCURRENTLY idx_transactions_client_id ON transactions(client_id);
```

#### Query Optimization

```sql
-- Analyze query performance
EXPLAIN ANALYZE SELECT * FROM clients WHERE status = 'Active';

-- Update table statistics
ANALYZE clients;
```

### Server Optimization

#### Nginx Optimization

```nginx
# Enable gzip compression
gzip on;
gzip_vary on;
gzip_min_length 1024;
gzip_types text/plain text/css application/json application/javascript;

# Enable caching
location /_next/static/ {
    expires 1y;
    add_header Cache-Control "public, immutable";
}
```

#### System Optimization

```bash
# Increase file descriptor limits
echo "* soft nofile 65536" >> /etc/security/limits.conf
echo "* hard nofile 65536" >> /etc/security/limits.conf

# Optimize kernel parameters
echo "net.core.somaxconn = 65536" >> /etc/sysctl.conf
sysctl -p
```

## Integration Management

### Email Service (Resend)

#### Configuration

```bash
RESEND_API_KEY=your_resend_api_key
```

#### Monitoring

```bash
# Test email sending
curl -X POST "https://api.resend.com/emails" \
  -H "Authorization: Bearer $RESEND_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"from":"test@yourdomain.com","to":"admin@yourdomain.com","subject":"Test","html":"Test email"}'
```

### SMS Service (AWS SNS)

#### Configuration

```bash
AWS_ACCESS_KEY_ID=your_access_key
AWS_SECRET_ACCESS_KEY=your_secret_key
AWS_REGION=us-east-1
LUMA_SMS_TO=+1234567890
```

#### Monitoring

```bash
# Test SMS sending
aws sns publish \
  --topic-arn arn:aws:sns:us-east-1:123456789012:luma-notifications \
  --message "Test SMS from Luma CRM"
```

### Supabase Integration

#### Monitoring

- Check Supabase dashboard for usage metrics
- Monitor API usage and rate limits
- Review database performance metrics
- Check storage usage

#### Maintenance

- Review and optimize RLS policies
- Monitor authentication metrics
- Update Supabase client libraries
- Review security settings

---

*This guide should be updated regularly as the system evolves. For technical support, contact the development team or refer to the system documentation.*