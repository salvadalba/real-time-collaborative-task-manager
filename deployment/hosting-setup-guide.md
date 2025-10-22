# Hosting Setup Guide

This guide explains how to set up automated hosting for your real-time collaborative task manager using different platforms and GitHub Actions.

## Table of Contents

1. [GitHub Pages (Free Static Hosting)](#github-pages)
2. [Vercel (Recommended for Frontend)](#vercel)
3. [Netlify (Alternative Static Hosting)](#netlify)
4. [AWS ECS (Docker Containers)](#aws-ecs)
5. [Railway (Simple Backend Hosting)](#railway)
6. [Render (Modern PaaS)](#render)
7. [DigitalOcean App Platform](#digitalocean)
8. [Required GitHub Secrets](#github-secrets)

## GitHub Pages

### Setup
1. Go to your repository on GitHub
2. Click Settings → Pages
3. Source: Deploy from a branch
4. Branch: `main` and `/ (root)`
5. Click Save

### GitHub Actions Workflow
The `ci-cd.yml` workflow includes automatic deployment to GitHub Pages when pushing to the `main` branch.

### Limitations
- Only hosts static files (frontend only)
- No backend API support
- No server-side features

## Vercel

### Setup
1. Sign up at [vercel.com](https://vercel.com)
2. Connect your GitHub account
3. Import the repository
4. Configure build settings:
   - Framework: React
   - Build Command: `cd frontend && npm run build`
   - Output Directory: `frontend/build`
   - Install Command: `cd frontend && npm ci`

### Environment Variables
In Vercel dashboard → Settings → Environment Variables:
```
REACT_APP_API_URL=https://your-backend-url.com
REACT_APP_SOCKET_URL=https://your-backend-url.com
```

### GitHub Secrets
Add these to your repository → Settings → Secrets and variables → Actions:
```
VERCEL_TOKEN=your_vercel_token
VERCEL_ORG_ID=your_vercel_org_id
VERCEL_PROJECT_ID=your_vercel_project_id
```

### Automatic Deployments
- Push to `main` → Production deployment
- Pull requests → Preview deployments

## Netlify

### Setup
1. Sign up at [netlify.com](https://netlify.com)
2. Click "New site from Git"
3. Connect GitHub and select your repository
4. Build settings:
   - Build command: `cd frontend && npm run build`
   - Publish directory: `frontend/build`

### Environment Variables
In Netlify dashboard → Site settings → Build & deploy → Environment:
```
REACT_APP_API_URL=https://your-backend-url.com
REACT_APP_SOCKET_URL=https://your-backend-url.com
```

### GitHub Secrets
```
NETLIFY_AUTH_TOKEN=your_netlify_token
NETLIFY_SITE_ID=your_netlify_site_id
NETLIFY_SITE_DOMAIN=your-site.netlify.app
```

### Backend Integration
The workflow automatically deploys the backend to Render when pushing to main.

## AWS ECS (Docker Containers)

### Prerequisites
- AWS account
- AWS CLI configured
- ECS cluster created

### Setup Steps

1. **Create ECR Repository**
```bash
aws ecr create-repository --repository-name taskmanager-frontend
aws ecr create-repository --repository-name taskmanager-backend
```

2. **Create ECS Task Definitions**
Create task definition files in `deployment/ecs/`:
- `frontend-task-definition.json`
- `backend-task-definition.json`

3. **Create ECS Services**
```bash
aws ecs create-service \
  --cluster your-cluster \
  --service-name frontend-service \
  --task-definition frontend-task-definition

aws ecs create-service \
  --cluster your-cluster \
  --service-name backend-service \
  --task-definition backend-task-definition
```

### GitHub Secrets
```
AWS_ACCESS_KEY_ID=your_aws_access_key
AWS_SECRET_ACCESS_KEY=your_aws_secret_key
AWS_REGION=us-east-1
ECS_CLUSTER_NAME=your-cluster-name
ECS_FRONTEND_SERVICE_NAME=frontend-service
ECS_BACKEND_SERVICE_NAME=backend-service
```

### Load Balancer Setup
Create an Application Load Balancer to route traffic:
- Port 80/443 → Frontend service
- Path `/api/*` → Backend service
- Path `/socket.io/*` → Backend service

## Railway

### Setup
1. Sign up at [railway.app](https://railway.app)
2. Connect GitHub account
3. Import repository
4. Create two services:
   - Frontend: `frontend` directory
   - Backend: `backend` directory

### Service Configuration

**Frontend Service:**
- Build Command: `npm ci && npm run build`
- Start Command: Not needed (static files)
- Root Directory: `frontend`

**Backend Service:**
- Build Command: `npm ci && npm run build`
- Start Command: `npm start`
- Root Directory: `backend`

### Environment Variables
**Backend Service:**
```
DATABASE_URL=your_postgres_url
REDIS_URL=your_redis_url
JWT_SECRET=your_jwt_secret
JWT_REFRESH_SECRET=your_refresh_secret
NODE_ENV=production
```

### GitHub Secrets
```
RAILWAY_TOKEN=your_railway_token
RAILWAY_SERVICE_ID=your_backend_service_id
```

## Render

### Setup
1. Sign up at [render.com](https://render.com)
2. Connect GitHub account
3. Create two services:

**Web Service (Frontend):**
- Type: Static Site
- Build Command: `cd frontend && npm run build`
- Publish Directory: `frontend/build`
- Root Directory: `frontend`

**Web Service (Backend):**
- Type: Web Service
- Runtime: Node 18
- Build Command: `cd backend && npm ci && npm run build`
- Start Command: `cd backend && npm start`
- Root Directory: `backend`

### Environment Variables
**Backend Service:**
```
DATABASE_URL=your_postgres_url
REDIS_URL=your_redis_url
JWT_SECRET=your_jwt_secret
JWT_REFRESH_SECRET=your_refresh_secret
NODE_ENV=production
```

### GitHub Secrets
```
RENDER_API_KEY=your_render_api_key
RENDER_SERVICE_ID=your_backend_service_id
RENDER_SERVICE_URL=your_backend_service_url
```

## DigitalOcean App Platform

### Setup
1. Create DigitalOcean account
2. Install `doctl` CLI
3. Authenticate: `doctl auth init`

### Create App
```bash
doctl apps create --spec deployment/digitalocean/app-spec.yaml
```

### App Spec Example
```yaml
name: taskmanager
services:
- name: frontend
  source_dir: frontend
  github:
    repo: salvadalba/real-time-collaborative-task-manager
    branch: main
  build_command: npm ci && npm run build
  run_command: npm start
  output_dir: build
  instance_count: 1
  instance_size_slug: basic-xxs
  env:
  - key: REACT_APP_API_URL
    value: ${backend.URL}
  - key: REACT_APP_SOCKET_URL
    value: ${backend.URL}

- name: backend
  source_dir: backend
  github:
    repo: salvadalba/real-time-collaborative-task-manager
    branch: main
  build_command: npm ci && npm run build
  run_command: npm start
  instance_count: 1
  instance_size_slug: basic-xxs
  env:
  - key: DATABASE_URL
    value: ${database.DATABASE_URL}
  - key: REDIS_URL
    value: ${redis.REDIS_URL}
  - key: JWT_SECRET
    value: ${jwt.JWT_SECRET}
  - key: NODE_ENV
    value: production

databases:
- name: database
  engine: PG
  version: "14"
- name: redis
  engine: REDIS
  version: "7"
```

### GitHub Secrets
```
DIGITALOCEAN_TOKEN=your_do_token
DIGITALOCEAN_WEBHOOK_URL=your_webhook_url
```

## Required GitHub Secrets

Create these in your repository → Settings → Secrets and variables → Actions:

### Hosting Platform Secrets
```bash
# Vercel
VERCEL_TOKEN=your_vercel_token
VERCEL_ORG_ID=your_vercel_org_id
VERCEL_PROJECT_ID=your_vercel_project_id

# Netlify
NETLIFY_AUTH_TOKEN=your_netlify_token
NETLIFY_SITE_ID=your_netlify_site_id
NETLIFY_SITE_DOMAIN=your-site.netlify.app

# Railway
RAILWAY_TOKEN=your_railway_token
RAILWAY_SERVICE_ID=your_backend_service_id

# Render
RENDER_API_KEY=your_render_api_key
RENDER_SERVICE_ID=your_backend_service_id
RENDER_SERVICE_URL=your_backend_service_url

# AWS
AWS_ACCESS_KEY_ID=your_aws_access_key
AWS_SECRET_ACCESS_KEY=your_aws_secret_key
AWS_REGION=us-east-1
ECS_CLUSTER_NAME=your-cluster-name
ECS_FRONTEND_SERVICE_NAME=frontend-service
ECS_BACKEND_SERVICE_NAME=backend-service
S3_BUCKET_NAME=your-s3-bucket
CLOUDFRONT_DISTRIBUTION_ID=your-cloudfront-id

# DigitalOcean
DIGITALOCEAN_TOKEN=your_do_token
DIGITALOCEAN_WEBHOOK_URL=your_webhook_url

# Docker Hub
DOCKER_USERNAME=your_docker_username
DOCKER_PASSWORD=your_docker_password
```

### Application Secrets
```bash
# Backend Configuration
DATABASE_URL=your_production_database_url
REDIS_URL=your_production_redis_url
JWT_SECRET=your_production_jwt_secret
JWT_REFRESH_SECRET=your_production_refresh_secret

# External Services
TOGGL_API_KEY=your_toggl_api_key
HARVEST_ACCESS_TOKEN=your_harvest_token

# AWS S3
AWS_ACCESS_KEY_ID=your_aws_access_key
AWS_SECRET_ACCESS_KEY=your_aws_secret_key
AWS_S3_BUCKET=your_s3_bucket
AWS_REGION=us-east-1

# Monitoring
SENTRY_DSN=your_sentry_dsn
SLACK_WEBHOOK_URL=your_slack_webhook
LHCI_GITHUB_APP_TOKEN=your_lhci_token
```

## Testing Your Setup

1. **Test Locally**
```bash
# Frontend
cd frontend && npm start

# Backend
cd backend && npm run dev
```

2. **Test GitHub Actions**
- Push a change to a feature branch
- Check Actions tab for workflow runs
- Verify all tests pass

3. **Test Deployment**
- Merge to `main` branch
- Monitor deployment progress
- Test the live application

## Monitoring and Maintenance

### Health Checks
- Frontend: `/health` endpoint
- Backend: `/api/health` endpoint

### Monitoring Tools
- GitHub Actions workflow logs
- Platform-specific monitoring (Vercel Analytics, Netlify Analytics, etc.)
- Error tracking (Sentry integration)

### Backup Strategy
- Database backups (automated by most platforms)
- Code repository (GitHub)
- Configuration backups (export platform settings)

## Troubleshooting

### Common Issues
1. **Build Failures**: Check logs in GitHub Actions
2. **Environment Variables**: Verify all secrets are correctly set
3. **CORS Issues**: Ensure backend allows frontend domain
4. **Database Connection**: Verify database URL and credentials
5. **WebSocket Issues**: Check Socket.io configuration

### Debug Commands
```bash
# Check GitHub Actions logs
gh run list --repo salvadalba/real-time-collaborative-task-manager
gh run view <run-id> --repo salvadalba/real-time-collaborative-task-manager

# Test deployment locally
docker-compose -f deployment/docker-compose.yml up
```

## Security Considerations

1. **Secrets Management**: Never commit secrets to repository
2. **HTTPS**: Always use HTTPS in production
3. **CORS**: Configure CORS properly
4. **Rate Limiting**: Implement rate limiting on API endpoints
5. **Authentication**: Use secure JWT practices
6. **Input Validation**: Validate all user inputs

## Performance Optimization

1. **Frontend**: Code splitting, lazy loading, caching
2. **Backend**: Database optimization, caching, CDN
3. **Infrastructure**: Load balancing, auto-scaling
4. **Monitoring**: Performance metrics, alerting

This comprehensive hosting setup guide provides multiple options for deploying your real-time collaborative task manager, from simple static hosting to full containerized deployments with automated CI/CD pipelines.