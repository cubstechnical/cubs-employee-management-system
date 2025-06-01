# CUBS Employee Management System - Web Deployment Guide

## 🚀 Production Deployment Instructions

### Prerequisites
- Node.js 18+ installed
- Yarn package manager
- Environment variables configured
- Supabase database setup

### 1. Environment Setup

#### Required Environment Variables
Create a `.env` file with the following variables:
```env
# Database
EXPO_PUBLIC_SUPABASE_URL=your_supabase_url
EXPO_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
DATABASE_URL=your_postgresql_connection_string

# Email Service
EXPO_PUBLIC_SENDGRID_API_KEY=your_sendgrid_api_key
EXPO_PUBLIC_SENDGRID_FROM_EMAIL=your_from_email

# File Storage (Backblaze B2)
EXPO_PUBLIC_B2_API_URL=your_b2_api_url
EXPO_PUBLIC_B2_BUCKET_NAME=your_bucket_name
EXPO_PUBLIC_B2_ENDPOINT=your_b2_endpoint
EXPO_PUBLIC_B2_KEY_ID=your_b2_key_id
EXPO_PUBLIC_B2_APPLICATION_KEY=your_b2_app_key

# App Configuration
EXPO_PUBLIC_ENV=production
EXPO_PUBLIC_APP_NAME=CUBS Employee Management System
EXPO_PUBLIC_APP_VERSION=1.0.0
EXPO_PUBLIC_API_URL=https://your-domain.com/api
EXPO_PUBLIC_ENABLE_NOTIFICATIONS=true
EXPO_PUBLIC_ENABLE_DOCUMENT_UPLOAD=true
EXPO_PUBLIC_ENABLE_EMAIL_NOTIFICATIONS=true
```

### 2. Pre-Deployment Checks

#### Install Dependencies
```bash
yarn install
```

#### Type Check
```bash
yarn type-check
```

#### Lint Code
```bash
yarn lint
```

#### Test Build
```bash
yarn web
```

### 3. Production Build

#### Option A: Standard Build
```bash
yarn build:web
```

#### Option B: Optimized Build with Source Maps
```bash
yarn build:production
```

#### Option C: Full Optimization Pipeline
```bash
yarn optimize
```

The build output will be generated in the `dist/` folder.

### 4. Deployment Options

#### Option 1: Static Hosting (Recommended)

**Netlify:**
1. Connect your GitHub repository to Netlify
2. Set build command: `yarn build:production`
3. Set publish directory: `dist`
4. Add environment variables in Netlify dashboard
5. Deploy

**Vercel:**
1. Install Vercel CLI: `npm i -g vercel`
2. Run `vercel` in project root
3. Follow prompts to deploy

**AWS S3 + CloudFront:**
1. Create S3 bucket
2. Upload `dist/` contents to bucket
3. Configure CloudFront distribution
4. Set up custom domain

#### Option 2: Docker Deployment

Create `Dockerfile`:
```dockerfile
FROM nginx:alpine
COPY dist/ /usr/share/nginx/html/
COPY nginx.conf /etc/nginx/nginx.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

Create `nginx.conf`:
```nginx
events {
    worker_connections 1024;
}

http {
    include       /etc/nginx/mime.types;
    default_type  application/octet-stream;
    
    gzip on;
    gzip_vary on;
    gzip_min_length 1000;
    gzip_types text/css application/javascript application/json;
    
    server {
        listen 80;
        server_name localhost;
        root /usr/share/nginx/html;
        index index.html;
        
        # Handle client-side routing
        location / {
            try_files $uri $uri/ /index.html;
        }
        
        # Cache static assets
        location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg)$ {
            expires 1y;
            add_header Cache-Control "public, immutable";
        }
        
        # Security headers
        add_header X-Frame-Options "DENY";
        add_header X-Content-Type-Options "nosniff";
        add_header X-XSS-Protection "1; mode=block";
    }
}
```

Build and run:
```bash
docker build -t cubs-ems .
docker run -p 80:80 cubs-ems
```

### 5. Performance Optimization

#### Bundle Analysis
```bash
yarn analyze
```

#### Performance Checklist
- ✅ Code splitting enabled
- ✅ Asset optimization (images, fonts)
- ✅ Gzip compression
- ✅ Caching headers
- ✅ Minification
- ✅ Tree shaking
- ✅ Lazy loading for routes

### 6. Security Configuration

#### Content Security Policy (CSP)
Add to your hosting provider or reverse proxy:
```
Content-Security-Policy: default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self' data:; connect-src 'self' https://your-api-domain.com;
```

#### HTTPS Configuration
- Always use HTTPS in production
- Set up SSL certificates
- Configure HSTS headers

### 7. Monitoring & Analytics

#### Error Tracking
Consider integrating:
- Sentry for error tracking
- LogRocket for session replay
- Google Analytics for usage metrics

#### Health Checks
Set up monitoring for:
- Application availability
- API response times
- Database connectivity
- Email service status

### 8. Database Migration

#### Supabase Setup
1. Create production database
2. Run migrations
3. Set up Row Level Security (RLS)
4. Configure authentication

#### Sample Migration Script
```sql
-- Enable RLS
ALTER TABLE employees ENABLE ROW LEVEL SECURITY;

-- Create policy for authenticated users
CREATE POLICY "Users can view employees" ON employees
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Admins can manage employees" ON employees
  FOR ALL TO authenticated 
  USING (auth.jwt() ->> 'role' = 'admin');
```

### 9. Post-Deployment Verification

#### Checklist
- [ ] Application loads successfully
- [ ] Authentication works
- [ ] Database connectivity confirmed
- [ ] Email notifications functional
- [ ] File uploads working
- [ ] All pages accessible
- [ ] Mobile responsiveness verified
- [ ] Performance metrics acceptable
- [ ] Error tracking active

#### Load Testing
```bash
# Install Artillery
npm install -g artillery

# Create load test
artillery quick --count 100 --num 10 https://your-domain.com
```

### 10. Backup & Recovery

#### Database Backups
- Set up automated Supabase backups
- Test restore procedures
- Document recovery processes

#### Asset Backups
- Backup uploaded documents
- Version control for code
- Environment configuration backup

### 11. Maintenance

#### Regular Tasks
- Monitor application logs
- Update dependencies monthly
- Security patch updates
- Performance optimization reviews
- User feedback incorporation

#### Update Process
1. Test updates in staging environment
2. Schedule maintenance window
3. Deploy with rollback plan
4. Monitor post-deployment metrics
5. Document changes

---

## 🔧 Troubleshooting

### Common Issues

**Build Fails:**
- Check Node.js version (18+)
- Clear cache: `yarn cache clean`
- Delete node_modules and reinstall

**Environment Variables Not Working:**
- Ensure EXPO_PUBLIC_ prefix for client-side variables
- Check .env file formatting
- Verify deployment platform environment setup

**Charts Not Displaying:**
- Verify react-native-svg web compatibility
- Check console for SVG-related errors
- Ensure chart data is properly formatted

**Authentication Issues:**
- Verify Supabase configuration
- Check JWT token expiration
- Confirm RLS policies

### Support
For technical support, contact the development team or refer to the project documentation.

---

**Last Updated:** January 2025
**Version:** 1.0.0
**Maintainer:** CUBS Technical Team 