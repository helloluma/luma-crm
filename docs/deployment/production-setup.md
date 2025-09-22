# Production Environment Setup Guide

## Overview

This guide covers the complete setup of the production environment for the Real Estate CRM application, including Supabase configuration, environment variables, domain setup, and monitoring systems.

## 1. Supabase Production Project Setup

### Create Production Project

1. **Create New Supabase Project**
   ```bash
   # Login to Supabase CLI
   npx supabase login
   
   # Create new project (or use Supabase Dashboard)
   npx supabase projects create real-estate-crm-prod
   ```

2. **Configure Project Settings**
   - Enable Row Level Security (RLS) on all tables
   - Configure Auth providers (Google OAuth, etc.)
   - Set up custom SMTP for email notifications
   - Configure storage buckets with proper policies

### Database Migration

```bash
# Link to production project
npx supabase link --project-ref YOUR_PROJECT_REF

# Push migrations to production
npx supabase db push

# Verify migrations
npx supabase db diff
```

### Storage Configuration

```sql
-- Create storage buckets
INSERT INTO storage.buckets (id, name, public) VALUES 
  ('documents', 'documents', false),
  ('avatars', 'avatars', true);

-- Set up storage policies
CREATE POLICY "Users can upload their own documents" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'documents' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can view their own documents" ON storage.objects
  FOR SELECT USING (bucket_id = 'documents' AND auth.uid()::text = (storage.foldername(name))[1]);
```

## 2. Environment Variables Configuration

### Production Environment Variables

Create `.env.production` file:

```bash
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://your-project-ref.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Database
DATABASE_URL=postgresql://postgres:[password]@db.your-project-ref.supabase.co:5432/postgres

# Authentication
NEXTAUTH_URL=https://your-domain.com
NEXTAUTH_SECRET=your-nextauth-secret

# Email Service (Resend)
RESEND_API_KEY=your-resend-api-key
RESEND_FROM_EMAIL=noreply@your-domain.com

# SMS Service (AWS SNS)
AWS_ACCESS_KEY_ID=your-aws-access-key
AWS_SECRET_ACCESS_KEY=your-aws-secret-key
AWS_REGION=us-east-1
AWS_SNS_TOPIC_ARN=arn:aws:sns:us-east-1:account:topic

# Google Calendar Integration
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret

# Monitoring and Analytics
SENTRY_DSN=your-sentry-dsn
VERCEL_ANALYTICS_ID=your-vercel-analytics-id

# Security
ENCRYPTION_KEY=your-32-character-encryption-key
RATE_LIMIT_MAX=100
RATE_LIMIT_WINDOW=900000

# Performance
NEXT_PUBLIC_APP_ENV=production
ENABLE_PERFORMANCE_MONITORING=true
```

### Vercel Environment Variables Setup

```bash
# Install Vercel CLI
npm i -g vercel

# Set environment variables
vercel env add NEXT_PUBLIC_SUPABASE_URL production
vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY production
vercel env add SUPABASE_SERVICE_ROLE_KEY production
vercel env add NEXTAUTH_SECRET production
vercel env add RESEND_API_KEY production
vercel env add AWS_ACCESS_KEY_ID production
vercel env add AWS_SECRET_ACCESS_KEY production
vercel env add GOOGLE_CLIENT_ID production
vercel env add GOOGLE_CLIENT_SECRET production
vercel env add SENTRY_DSN production
vercel env add ENCRYPTION_KEY production
```

## 3. Domain and SSL Configuration

### Custom Domain Setup

1. **Add Domain to Vercel**
   ```bash
   vercel domains add your-domain.com
   vercel domains add www.your-domain.com
   ```

2. **DNS Configuration**
   ```
   # A Record
   @ -> 76.76.19.61
   
   # CNAME Record
   www -> cname.vercel-dns.com
   ```

3. **SSL Certificate**
   - Vercel automatically provisions SSL certificates
   - Verify HTTPS redirect is enabled
   - Configure HSTS headers

### Security Headers Configuration

Create `vercel.json`:

```json
{
  "headers": [
    {
      "source": "/(.*)",
      "headers": [
        {
          "key": "X-Frame-Options",
          "value": "DENY"
        },
        {
          "key": "X-Content-Type-Options",
          "value": "nosniff"
        },
        {
          "key": "Referrer-Policy",
          "value": "strict-origin-when-cross-origin"
        },
        {
          "key": "Strict-Transport-Security",
          "value": "max-age=31536000; includeSubDomains"
        }
      ]
    }
  ]
}
```

## 4. Monitoring and Alerting Systems

### Application Performance Monitoring (APM)

1. **Sentry Setup**
   ```bash
   npm install @sentry/nextjs
   ```

2. **Vercel Analytics**
   ```bash
   npm install @vercel/analytics
   ```

3. **Custom Performance Monitoring**
   - Core Web Vitals tracking
   - API response time monitoring
   - Database query performance

### Health Check Endpoints

Create monitoring endpoints:

```typescript
// pages/api/health.ts
export default function handler(req: NextApiRequest, res: NextApiResponse) {
  res.status(200).json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    version: process.env.npm_package_version
  });
}

// pages/api/health/database.ts
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const { data, error } = await supabase.from('profiles').select('count').limit(1);
    if (error) throw error;
    
    res.status(200).json({
      status: 'healthy',
      database: 'connected',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      status: 'unhealthy',
      database: 'disconnected',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
}
```

### Uptime Monitoring

Configure external monitoring services:

1. **UptimeRobot Configuration**
   - Monitor main application URL
   - Monitor API health endpoints
   - Set up email/SMS alerts

2. **Supabase Monitoring**
   - Database connection monitoring
   - Storage availability monitoring
   - Auth service monitoring

## 5. Backup and Recovery

### Database Backups

```bash
# Automated daily backups (configured in Supabase Dashboard)
# Point-in-time recovery enabled
# Cross-region backup replication
```

### File Storage Backups

```bash
# Configure S3 backup for Supabase Storage
# Automated backup scripts for critical documents
```

## 6. Security Configuration

### Rate Limiting

```typescript
// middleware.ts - Production rate limiting
import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

const ratelimit = new Ratelimit({
  redis: Redis.fromEnv(),
  limiter: Ratelimit.slidingWindow(100, "15 m"),
});

export async function middleware(request: NextRequest) {
  const ip = request.ip ?? "127.0.0.1";
  const { success } = await ratelimit.limit(ip);

  if (!success) {
    return new Response("Rate limit exceeded", { status: 429 });
  }

  return NextResponse.next();
}
```

### Content Security Policy

```typescript
// next.config.js
const securityHeaders = [
  {
    key: 'Content-Security-Policy',
    value: `
      default-src 'self';
      script-src 'self' 'unsafe-eval' 'unsafe-inline' *.vercel-analytics.com;
      style-src 'self' 'unsafe-inline';
      img-src 'self' blob: data: *.supabase.co;
      font-src 'self';
      object-src 'none';
      base-uri 'self';
      form-action 'self';
      frame-ancestors 'none';
      upgrade-insecure-requests;
    `.replace(/\s{2,}/g, ' ').trim()
  }
];
```

## 7. Performance Optimization

### CDN Configuration

```json
// vercel.json
{
  "functions": {
    "pages/api/**/*.js": {
      "maxDuration": 30
    }
  },
  "regions": ["iad1", "sfo1"],
  "crons": [
    {
      "path": "/api/cron/cleanup",
      "schedule": "0 2 * * *"
    }
  ]
}
```

### Caching Strategy

```typescript
// API routes caching
export const config = {
  runtime: 'edge',
  regions: ['iad1', 'sfo1'],
};

// Static generation for public pages
export async function generateStaticParams() {
  return [
    { slug: 'privacy' },
    { slug: 'terms' },
  ];
}
```

## 8. Deployment Checklist

- [ ] Supabase production project created and configured
- [ ] All environment variables set in Vercel
- [ ] Database migrations applied
- [ ] Storage buckets and policies configured
- [ ] Custom domain added and SSL configured
- [ ] Security headers implemented
- [ ] Monitoring and alerting configured
- [ ] Health check endpoints created
- [ ] Backup systems configured
- [ ] Rate limiting implemented
- [ ] Performance monitoring enabled
- [ ] Error tracking configured
- [ ] Documentation updated

## 9. Post-Deployment Verification

### Functional Testing

```bash
# Run production smoke tests
npm run test:production

# Verify API endpoints
curl https://your-domain.com/api/health
curl https://your-domain.com/api/health/database

# Test authentication flow
# Test file upload functionality
# Verify email notifications
# Test SMS alerts
```

### Performance Testing

```bash
# Lighthouse CI
npm run lighthouse:ci

# Load testing
npm run test:load

# Database performance
npm run test:db-performance
```

### Security Testing

```bash
# Security audit
npm run security:audit

# SSL/TLS verification
npm run security:ssl-check

# Headers verification
npm run security:headers-check
```

This production setup ensures a secure, scalable, and monitored deployment of the Real Estate CRM application.