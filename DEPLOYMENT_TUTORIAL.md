# 🚀 Complete Deployment Tutorial

This comprehensive guide will walk you through deploying your real-time collaborative task manager to multiple hosting platforms, with detailed step-by-step instructions, configuration details, troubleshooting tips, and best practices.

## 📋 Table of Contents

1. [Prerequisites](#prerequisites)
2. [GitHub Pages (Free Frontend Hosting)](#github-pages)
3. [Vercel (Recommended Full-Stack Solution)](#vercel)
4. [Netlify (Alternative Frontend + Backend)](#netlify)
5. [AWS ECS (Enterprise-Grade Container Deployment)](#aws-ecs)
6. [Railway (Simple Full-Stack Hosting)](#railway)
7. [Domain Management & SSL](#domain-management)
8. [Environment Variables Best Practices](#environment-variables)
9. [Troubleshooting Guide](#troubleshooting)
10. [Performance Optimization](#performance-optimization)

## 🎯 Prerequisites

### Required Accounts
- [GitHub](https://github.com) (already have)
- [Node.js 18+](https://nodejs.org) installed locally
- [Git](https://git-scm.com) configured

### Optional Platform Accounts
- [Vercel](https://vercel.com) (free account)
- [Netlify](https://netlify.com) (free account)
- [AWS](https://aws.amazon.com) (free tier)
- [Railway](https://railway.app) (free tier)

### Local Testing
Before deploying, test locally:
```bash
# Test Frontend
cd frontend
npm install
npm start

# Test Backend (in separate terminal)
cd backend
npm install
npm run dev
```

---

## 🌐 GitHub Pages (Free Frontend Hosting)

### Overview
- **Cost**: Free
- **Best for**: Frontend only (static site)
- **Limitations**: No backend API, no server-side features

### Step 1: Configure Repository Settings

1. Go to your repository: https://github.com/salvadalba/real-time-collaborative-task-manager
2. Click **Settings** tab
3. Scroll down to **Pages** section
4. Configure as follows:
   - **Source**: Deploy from a branch
   - **Branch**: `main`
   - **Folder**: `/ (root)`
5. Click **Save**

### Step 2: Create GitHub Pages Build Script

Create a build script for GitHub Pages:

```bash
mkdir -p frontend/scripts
```

Create `frontend/scripts/build-gh-pages.js`:
```javascript
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Build the app
console.log('Building React app...');
execSync('npm run build', { stdio: 'inherit' });

// Create .nojekyll file
console.log('Creating .nojekyll file...');
fs.writeFileSync(path.join(__dirname, '../build/.nojekyll'), '');

// Update index.html to work with GitHub Pages
const indexPath = path.join(__dirname, '../build/index.html');
let indexContent = fs.readFileSync(indexPath, 'utf8');

// Add base URL for GitHub Pages
const repoName = 'real-time-collaborative-task-manager';
const baseUrl = `/${repoName}`;

indexContent = indexContent.replace(
  '<base href="%PUBLIC_URL%/">',
  `<base href="${baseUrl}/">`
);

fs.writeFileSync(indexPath, indexContent);
console.log('Build completed for GitHub Pages!');
```

### Step 3: Update Package.json

Add GitHub Pages scripts to `frontend/package.json`:
```json
{
  "scripts": {
    "predeploy": "node scripts/build-gh-pages.js",
    "deploy": "gh-pages -d build",
    "build:gh-pages": "node scripts/build-gh-pages.js"
  }
}
```

Install required packages:
```bash
cd frontend
npm install --save-dev gh-pages
```

### Step 4: Deploy to GitHub Pages

```bash
cd frontend
npm run build:gh-pages
npm run deploy
```

### Step 5: Verify Deployment

Your site will be available at: https://salvadalba.github.io/real-time-collaborative-task-manager/

### Limitations & Workarounds

Since GitHub Pages only hosts static files, you'll need:
- **Backend API**: Use a separate service (Railway, Render, Heroku)
- **Real-time Features**: Use a WebSocket service (Pusher, Ably)
- **Database**: Use a cloud database (Supabase, PlanetScale)

---

## ⚡ Vercel (Recommended Full-Stack Solution)

### Overview
- **Cost**: Free tier available
- **Best for**: Full-stack applications
- **Features**: Automatic deployments, preview environments, serverless functions

### Step 1: Sign Up for Vercel

1. Go to [vercel.com](https://vercel.com)
2. Click **Sign Up**
3. Choose **Continue with GitHub**
4. Authorize Vercel access to your repositories

### Step 2: Import Repository

1. Click **New Project**
2. Find `real-time-collaborative-task-manager` in the list
3. Click **Import**

### Step 3: Configure Frontend

**Framework Preset:**
- **Framework**: React
- **Project Name**: `task-manager-frontend`
- **Root Directory**: `frontend`

**Build Settings:**
- **Build Command**: `npm run build`
- **Output Directory**: `build`
- **Install Command**: `npm ci`

**Environment Variables:**
```
REACT_APP_API_URL=https://task-manager-backend.vercel.app/api
REACT_APP_SOCKET_URL=https://task-manager-backend.vercel.app
```

### Step 4: Deploy Backend Separately

1. Go back to Vercel dashboard
2. Click **Add New...** → **Project**
3. Select the same repository
4. Configure as follows:
   - **Framework**: Other
   - **Project Name**: `task-manager-backend`
   - **Root Directory**: `backend`
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
   - **Install Command**: `npm ci`

**Backend Environment Variables:**
```
NODE_ENV=production
DATABASE_URL=${your_database_url}
REDIS_URL=${your_redis_url}
JWT_SECRET=${your_jwt_secret}
JWT_REFRESH_SECRET=${your_refresh_secret}
PORT=3000
```

### Step 5: Set Up Database

Vercel provides a Postgres database add-on:

1. Go to your backend project in Vercel
2. Click **Storage** → **Create Database**
3. Choose **Postgres**
4. Follow the setup wizard
5. Copy the `DATABASE_URL` to your environment variables

### Step 6: Set Up Redis

1. Go to [Redis Cloud](https://redis.com/try-free)
2. Sign up for a free account
3. Create a new database
4. Get the connection string
5. Add to environment variables as `REDIS_URL`

### Step 7: Update Frontend API Calls

Update `frontend/src/utils/api.ts`:
```typescript
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';
const SOCKET_URL = process.env.REACT_APP_SOCKET_URL || 'http://localhost:5000';
```

### Step 8: Test Deployments

1. Push changes to GitHub:
```bash
git add .
git commit -m "Configure for Vercel deployment"
git push origin main
```

2. Check deployment status in Vercel dashboard
3. Test both frontend and backend URLs

### Step 9: Custom Domain (Optional)

1. Go to project settings in Vercel
2. Click **Domains**
3. Add your custom domain
4. Configure DNS records as instructed
5. Vercel will automatically provision SSL

### Advanced Vercel Features

**Serverless Functions:**
Create `api/` directory in your project for serverless functions:
```javascript
// api/hello.js
export default function handler(req, res) {
  res.status(200).json({ message: 'Hello from Vercel!' });
}
```

**Edge Functions:**
For better performance, create edge functions:
```javascript
// api/edge-function.js
export const config = {
  runtime: 'edge',
};

export default function handler(req) {
  return new Response('Hello from Edge!');
}
```

---

## 🌿 Netlify (Alternative Frontend + Backend)

### Overview
- **Cost**: Free tier available
- **Best for**: Static frontend with serverless functions
- **Features**: Form handling, edge functions, split testing

### Step 1: Sign Up for Netlify

1. Go to [netlify.com](https://netlify.com)
2. Click **Sign up**
3. Choose **GitHub** for authentication
4. Authorize Netlify access

### Step 2: Deploy Frontend

1. Click **New site from Git**
2. Select GitHub
3. Choose `real-time-collaborative-task-manager`
4. Configure build settings:
   - **Build command**: `cd frontend && npm run build`
   - **Publish directory**: `frontend/build`
   - **Base directory**: `frontend`

### Step 3: Configure Environment Variables

In Netlify dashboard → Site settings → Build & deploy → Environment:
```
REACT_APP_API_URL=https://your-backend.netlify.app/.netlify/functions
REACT_APP_SOCKET_URL=wss://your-backend.netlify.app
```

### Step 4: Create Backend as Netlify Functions

Create `netlify/functions/` directory:

```bash
mkdir -p netlify/functions
```

Create `netlify/functions/api.js`:
```javascript
const express = require('express');
const serverless = require('serverless-http');
const { createServer } = require('../../backend/dist/app');

const app = express();
const server = createServer(app);

module.exports.handler = serverless(server);
```

Update `netlify.toml`:
```toml
[build]
  base = "backend/"
  command = "npm run build"
  functions = "netlify/functions"
  publish = "frontend/build"

[[redirects]]
  from = "/api/*"
  to = "/.netlify/functions/api/:splat"
  status = 200

[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 404
```

### Step 5: Deploy Backend Functions

1. Create `netlify/functions/package.json`:
```json
{
  "name": "taskmanager-functions",
  "version": "1.0.0",
  "dependencies": {
    "express": "^4.18.2",
    "serverless-http": "^3.2.0"
  }
}
```

2. Install dependencies:
```bash
cd netlify/functions
npm install
```

### Step 6: Set Up External Services

**Database (Supabase):**
1. Go to [supabase.com](https://supabase.com)
2. Create a new project
3. Get the connection URL
4. Add to Netlify environment variables

**Redis (Upstash):**
1. Go to [upstash.com](https://upstash.com)
2. Create a Redis database
3. Get the connection URL
4. Add to Netlify environment variables

### Step 7: Test Deployment

1. Push changes to GitHub
2. Netlify will automatically deploy
3. Check the Functions tab for backend status

### Step 8: Custom Domain

1. Go to Domain settings in Netlify
2. Add your custom domain
3. Configure DNS records
4. Netlify provides automatic SSL

---

## 🐳 AWS ECS (Enterprise-Grade Container Deployment)

### Overview
- **Cost**: AWS Free Tier available
- **Best for**: Production workloads, high scalability
- **Features**: Load balancing, auto-scaling, container orchestration

### Prerequisites

1. **AWS Account**: Create at [aws.amazon.com](https://aws.amazon.com)
2. **AWS CLI**: Install and configure
```bash
pip install awscli
aws configure
```

3. **Docker**: Install locally
```bash
# Ubuntu/Debian
sudo apt-get update
sudo apt-get install docker.io

# macOS
brew install --cask docker

# Windows
# Download Docker Desktop from docker.com
```

### Step 1: Create ECR Repositories

```bash
# Frontend repository
aws ecr create-repository \
  --repository-name taskmanager-frontend \
  --region us-east-1

# Backend repository
aws ecr create-repository \
  --repository-name taskmanager-backend \
  --region us-east-1
```

### Step 2: Build and Push Docker Images

```bash
# Login to ECR
aws ecr get-login-password --region us-east-1 | docker login --username AWS --password-stdin $(aws sts get-caller-identity --query Account --output text).dkr.ecr.us-east-1.amazonaws.com

# Get repository URIs
FRONTEND_REPO=$(aws sts get-caller-identity --query Account --output text).dkr.ecr.us-east-1.amazonaws.com/taskmanager-frontend
BACKEND_REPO=$(aws sts get-caller-identity --query Account --output text).dkr.ecr.us-east-1.amazonaws.com/taskmanager-backend

# Build and push frontend
docker build -f deployment/docker/Dockerfile.frontend -t $FRONTEND_REPO:latest .
docker push $FRONTEND_REPO:latest

# Build and push backend
docker build -f deployment/docker/Dockerfile.backend -t $BACKEND_REPO:latest .
docker push $BACKEND_REPO:latest
```

### Step 3: Create ECS Cluster

```bash
aws ecs create-cluster \
  --cluster-name taskmanager-cluster \
  --region us-east-1
```

### Step 4: Create Task Definitions

Create `deployment/ecs/frontend-task-definition.json`:
```json
{
  "family": "taskmanager-frontend",
  "networkMode": "awsvpc",
  "requiresCompatibilities": ["FARGATE"],
  "cpu": "256",
  "memory": "512",
  "executionRoleArn": "arn:aws:iam::ACCOUNT:role/ecsTaskExecutionRole",
  "containerDefinitions": [
    {
      "name": "frontend",
      "image": "ACCOUNT.dkr.ecr.us-east-1.amazonaws.com/taskmanager-frontend:latest",
      "portMappings": [
        {
          "containerPort": 80,
          "protocol": "tcp"
        }
      ],
      "essential": true,
      "logConfiguration": {
        "logDriver": "awslogs",
        "options": {
          "awslogs-group": "/ecs/taskmanager-frontend",
          "awslogs-region": "us-east-1",
          "awslogs-stream-prefix": "ecs"
        }
      }
    }
  ]
}
```

Create `deployment/ecs/backend-task-definition.json`:
```json
{
  "family": "taskmanager-backend",
  "networkMode": "awsvpc",
  "requiresCompatibilities": ["FARGATE"],
  "cpu": "512",
  "memory": "1024",
  "executionRoleArn": "arn:aws:iam::ACCOUNT:role/ecsTaskExecutionRole",
  "taskRoleArn": "arn:aws:iam::ACCOUNT:role/ecsTaskRole",
  "containerDefinitions": [
    {
      "name": "backend",
      "image": "ACCOUNT.dkr.ecr.us-east-1.amazonaws.com/taskmanager-backend:latest",
      "portMappings": [
        {
          "containerPort": 5000,
          "protocol": "tcp"
        }
      ],
      "environment": [
        {
          "name": "NODE_ENV",
          "value": "production"
        }
      ],
      "secrets": [
        {
          "name": "DATABASE_URL",
          "valueFrom": "arn:aws:secretsmanager:us-east-1:ACCOUNT:secret:taskmanager/database-url"
        },
        {
          "name": "REDIS_URL",
          "valueFrom": "arn:aws:secretsmanager:us-east-1:ACCOUNT:secret:taskmanager/redis-url"
        },
        {
          "name": "JWT_SECRET",
          "valueFrom": "arn:aws:secretsmanager:us-east-1:ACCOUNT:secret:taskmanager/jwt-secret"
        }
      ],
      "essential": true,
      "logConfiguration": {
        "logDriver": "awslogs",
        "options": {
          "awslogs-group": "/ecs/taskmanager-backend",
          "awslogs-region": "us-east-1",
          "awslogs-stream-prefix": "ecs"
        }
      },
      "healthCheck": {
        "command": ["CMD-SHELL", "curl -f http://localhost:5000/health || exit 1"],
        "interval": 30,
        "timeout": 5,
        "retries": 3
      }
    }
  ]
}
```

### Step 5: Register Task Definitions

```bash
# Frontend
aws ecs register-task-definition \
  --cli-input-json file://deployment/ecs/frontend-task-definition.json

# Backend
aws ecs register-task-definition \
  --cli-input-json file://deployment/ecs/backend-task-definition.json
```

### Step 6: Create Security Groups

```bash
# Create security group for ALB
aws ec2 create-security-group \
  --group-name taskmanager-alb-sg \
  --description "Security group for ALB" \
  --vpc-id $(aws ec2 describe-vpcs --query "Vpcs[0].VpcId" --output text)

# Allow HTTP/HTTPS traffic
aws ec2 authorize-security-group-ingress \
  --group-name taskmanager-alb-sg \
  --protocol tcp \
  --port 80 \
  --cidr 0.0.0.0/0

aws ec2 authorize-security-group-ingress \
  --group-name taskmanager-alb-sg \
  --protocol tcp \
  --port 443 \
  --cidr 0.0.0.0/0

# Create security group for ECS
aws ec2 create-security-group \
  --group-name taskmanager-ecs-sg \
  --description "Security group for ECS tasks" \
  --vpc-id $(aws ec2 describe-vpcs --query "Vpcs[0].VpcId" --output text)
```

### Step 7: Create Application Load Balancer

```bash
aws elbv2 create-load-balancer \
  --name taskmanager-alb \
  --subnets $(aws ec2 describe-subnets --query "Subnets[0].SubnetId" --output text) $(aws ec2 describe-subnets --query "Subnets[1].SubnetId" --output text) \
  --security-groups $(aws ec2 describe-security-groups --group-names taskmanager-alb-sg --query "SecurityGroups[0].GroupId" --output text) \
  --type application \
  --ip-address-type ipv4
```

### Step 8: Create Target Groups

```bash
# Frontend target group
aws elbv2 create-target-group \
  --name taskmanager-frontend-tg \
  --protocol HTTP \
  --port 80 \
  --target-type ip \
  --vpc-id $(aws ec2 describe-vpcs --query "Vpcs[0].VpcId" --output text)

# Backend target group
aws elbv2 create-target-group \
  --name taskmanager-backend-tg \
  --protocol HTTP \
  --port 5000 \
  --target-type ip \
  --vpc-id $(aws ec2 describe-vpcs --query "Vpcs[0].VpcId" --output text)
```

### Step 9: Create ECS Services

```bash
# Frontend service
aws ecs create-service \
  --cluster taskmanager-cluster \
  --service-name frontend-service \
  --task-definition taskmanager-frontend \
  --desired-count 1 \
  --launch-type FARGATE \
  --network-configuration "awsvpcConfiguration={subnets=[$(aws ec2 describe-subnets --query "Subnets[0].SubnetId" --output text)],securityGroups=[$(aws ec2 describe-security-groups --group-names taskmanager-ecs-sg --query "SecurityGroups[0].GroupId" --output text)],assignPublicIp=ENABLED}"

# Backend service
aws ecs create-service \
  --cluster taskmanager-cluster \
  --service-name backend-service \
  --task-definition taskmanager-backend \
  --desired-count 1 \
  --launch-type FARGATE \
  --network-configuration "awsvpcConfiguration={subnets=[$(aws ec2 describe-subnets --query "Subnets[0].SubnetId" --output text)],securityGroups=[$(aws ec2 describe-security-groups --group-names taskmanager-ecs-sg --query "SecurityGroups[0].GroupId" --output text)],assignPublicIp=ENABLED}"
```

### Step 10: Configure Load Balancer Listener

```bash
# Get ALB ARN
ALB_ARN=$(aws elbv2 describe-load-balancers --names taskmanager-alb --query "LoadBalancers[0].LoadBalancerArn" --output text)

# Create listener
aws elbv2 create-listener \
  --load-balancer-arn $ALB_ARN \
  --protocol HTTP \
  --port 80 \
  --default-actions Type=forward,TargetGroupArn=$(aws elbv2 describe-target-groups --names taskmanager-frontend-tg --query "TargetGroups[0].TargetGroupArn" --output text)
```

### Step 11: Set Up AWS Secrets Manager

```bash
# Database URL
aws secretsmanager create-secret \
  --name taskmanager/database-url \
  --secret-string "your_production_database_url"

# Redis URL
aws secretsmanager create-secret \
  --name taskmanager/redis-url \
  --secret-string "your_production_redis_url"

# JWT Secret
aws secretsmanager create-secret \
  --name taskmanager/jwt-secret \
  --secret-string "your_production_jwt_secret"
```

### Step 12: Set Up Auto Scaling

```bash
# Create scalable target
aws application-autoscaling register-scalable-target \
  --service-namespace ecs \
  --resource-id service/taskmanager-cluster/backend-service \
  --scalable-dimension ecs:service:DesiredCount \
  --min-capacity 1 \
  --max-capacity 10 \
  --target-cpu-utilization 70
```

---

## 🚂 Railway (Simple Full-Stack Hosting)

### Overview
- **Cost**: Free tier ($5/month credit)
- **Best for**: Quick deployment, full-stack apps
- **Features**: Automatic deployments, built-in database

### Step 1: Sign Up for Railway

1. Go to [railway.app](https://railway.app)
2. Click **Login**
3. Choose **Continue with GitHub**
4. Authorize Railway access

### Step 2: Create Frontend Service

1. Click **New Project**
2. Select **Deploy from GitHub repo**
3. Choose `real-time-collaborative-task-manager`
4. Configure:
   - **Service Name**: `frontend`
   - **Root Directory**: `frontend`
   - **Build Command**: `npm install && npm run build`
   - **Start Command**: Not needed for static site
   - **Environment**: `Node 18`

### Step 3: Create Backend Service

1. Click **+ New Service**
2. Choose **GitHub Repo**
3. Select the same repository
4. Configure:
   - **Service Name**: `backend`
   - **Root Directory**: `backend`
   - **Build Command**: `npm install && npm run build`
   - **Start Command**: `npm start`
   - **Environment**: `Node 18`

### Step 4: Add Database

1. Click **+ New Service**
2. Choose **Add PostgreSQL**
3. Configure:
   - **Service Name**: `database`
   - **Region**: Choose nearest region
4. Click **Create PostgreSQL**

### Step 5: Add Redis

1. Click **+ New Service**
2. Choose **Add Redis**
3. Configure:
   - **Service Name**: `redis`
   - **Region**: Same as database
4. Click **Create Redis**

### Step 6: Configure Environment Variables

**Backend Service Variables:**
```
DATABASE_URL=${database.DATABASE_URL}
REDIS_URL=${redis.REDIS_URL}
JWT_SECRET=${jwt.JWT_SECRET}
JWT_REFRESH_SECRET=${jwt_refresh.JWT_REFRESH_SECRET}
NODE_ENV=production
PORT=5000
```

**Frontend Service Variables:**
```
REACT_APP_API_URL=${backend.URL}/api
REACT_APP_SOCKET_URL=${backend.URL}
```

### Step 7: Generate JWT Secrets

1. Go to backend service settings
2. Click **Variables**
3. Add new variables:
   - `JWT_SECRET`: Generate with `openssl rand -base64 32`
   - `JWT_REFRESH_SECRET`: Generate with `openssl rand -base64 32`

### Step 8: Configure Custom Domain

1. Go to project settings
2. Click **Domains**
3. Add your custom domain
4. Configure DNS records as instructed
5. Railway provides automatic SSL

### Step 9: Test Deployment

1. Push changes to GitHub
2. Railway will automatically deploy
3. Check service logs for any issues
4. Test both frontend and backend URLs

---

## 🌐 Domain Management & SSL

### Custom Domain Setup

#### Vercel
1. Go to project settings → Domains
2. Add your domain
3. Configure DNS:
   ```
   A     @     76.76.19.61
   CNAME www     cname.vercel-dns.com
   ```
4. Vercel provides automatic SSL

#### Netlify
1. Go to Site settings → Domain management
2. Add custom domain
3. Configure DNS:
   ```
   A     @     75.2.60.5
   CNAME www     your-site.netlify.app
   ```
4. Netlify provides automatic SSL

#### AWS Route 53
1. Create hosted zone
2. Add A records pointing to ALB
3. Request SSL certificate via ACM
4. Update ALB listener with SSL certificate

### SSL Certificate Management

#### Let's Encrypt (Free)
```bash
# Install Certbot
sudo apt-get install certbot python3-certbot-nginx

# Get certificate
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com

# Auto-renewal
sudo crontab -e
# Add: 0 12 * * * /usr/bin/certbot renew --quiet
```

#### Cloudflare (Free CDN + SSL)
1. Sign up at [cloudflare.com](https://cloudflare.com)
2. Add your domain
3. Update nameservers to Cloudflare
4. Configure SSL/TLS to **Full (Strict)**
5. Set up page rules for caching

---

## 🔐 Environment Variables Best Practices

### Security Principles

1. **Never commit secrets to repository**
2. **Use different secrets for each environment**
3. **Rotate secrets regularly**
4. **Use strong, randomly generated values**

### Required Variables

#### Frontend
```bash
# API Configuration
REACT_APP_API_URL=https://your-backend.com/api
REACT_APP_SOCKET_URL=https://your-backend.com

# Feature Flags
REACT_APP_ENABLE_ANALYTICS=true
REACT_APP_ENABLE_DEBUG=false

# Third-party Services
REACT_APP_SENTRY_DSN=your_sentry_dsn
REACT_APP_GOOGLE_ANALYTICS_ID=GA_MEASUREMENT_ID
```

#### Backend
```bash
# Server Configuration
NODE_ENV=production
PORT=5000

# Database
DATABASE_URL=postgresql://user:password@host:5432/database
REDIS_URL=redis://host:6379

# Authentication
JWT_SECRET=your_strong_jwt_secret
JWT_REFRESH_SECRET=your_strong_refresh_secret
JWT_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d

# External Services
AWS_ACCESS_KEY_ID=your_aws_key
AWS_SECRET_ACCESS_KEY=your_aws_secret
AWS_S3_BUCKET=your_s3_bucket
AWS_REGION=us-east-1

# Email Service
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_email@gmail.com
SMTP_PASS=your_app_password

# Monitoring
SENTRY_DSN=your_sentry_dsn
LOG_LEVEL=info
```

### Environment-Specific Configuration

#### Development
```bash
NODE_ENV=development
DATABASE_URL=postgresql://localhost:5432/taskmanager_dev
REDIS_URL=redis://localhost:6379
JWT_SECRET=dev_secret_not_for_production
LOG_LEVEL=debug
```

#### Staging
```bash
NODE_ENV=staging
DATABASE_URL=postgresql://staging-db-host:5432/taskmanager_staging
REDIS_URL=redis://staging-redis-host:6379
JWT_SECRET=staging_jwt_secret
LOG_LEVEL=info
```

#### Production
```bash
NODE_ENV=production
DATABASE_URL=postgresql://prod-db-host:5432/taskmanager_prod
REDIS_URL=redis://prod-redis-host:6379
JWT_SECRET=prod_jwt_secret_very_strong
LOG_LEVEL=warn
```

---

## 🛠 Troubleshooting Guide

### Common Issues & Solutions

#### Build Failures

**Issue: Frontend build fails**
```bash
# Clear cache
cd frontend
rm -rf node_modules package-lock.json
npm install

# Check for TypeScript errors
npm run type-check

# Check for linting errors
npm run lint
```

**Issue: Backend build fails**
```bash
# Clear cache
cd backend
rm -rf node_modules package-lock.json dist
npm install

# Check TypeScript compilation
npx tsc --noEmit

# Check for missing dependencies
npm ls --depth=0
```

#### Deployment Failures

**Issue: Vercel deployment fails**
1. Check deployment logs in Vercel dashboard
2. Verify environment variables
3. Ensure build command works locally
4. Check for missing dependencies

**Issue: Netlify deployment fails**
1. Check build logs in Netlify dashboard
2. Verify `netlify.toml` configuration
3. Check function logs for backend issues
4. Ensure build command works locally

**Issue: Railway deployment fails**
1. Check service logs in Railway dashboard
2. Verify environment variables
3. Check database connections
4. Ensure start command is correct

#### Runtime Errors

**Issue: API calls failing**
```bash
# Check network tab in browser dev tools
# Verify CORS configuration
# Check backend logs
# Test API endpoints directly with curl

curl -X GET https://your-backend.com/api/health
```

**Issue: WebSocket connections failing**
```bash
# Check Socket.io configuration
# Verify WebSocket URL
# Check network firewall settings
# Test WebSocket connection manually

const socket = io('https://your-backend.com', {
  transports: ['websocket', 'polling']
});
```

**Issue: Database connection errors**
```bash
# Test database connection
psql $DATABASE_URL -c "SELECT 1;";

# Check connection pool settings
# Verify database is running
# Check network connectivity
```

---

## ⚡ Performance Optimization

### Frontend Optimization

#### Code Splitting
```typescript
// Lazy load components
const TaskBoard = lazy(() => import('./components/TaskBoard'));
const Analytics = lazy(() => import('./components/Analytics'));

// Route-based splitting
const routes = [
  {
    path: '/dashboard',
    component: lazy(() => import('./pages/Dashboard'))
  },
  {
    path: '/tasks',
    component: lazy(() => import('./pages/Tasks'))
  }
];
```

#### Bundle Optimization
```javascript
// webpack.config.js
module.exports = {
  optimization: {
    splitChunks: {
      chunks: 'all',
      cacheGroups: {
        vendor: {
          test: /[\\/]node_modules[\\/]/,
          name: 'vendors',
          chunks: 'all',
        },
      },
    },
  },
};
```

### Backend Optimization

#### Database Optimization
```sql
-- Add indexes for frequently queried columns
CREATE INDEX idx_tasks_project_id ON tasks(project_id);
CREATE INDEX idx_tasks_assignee_id ON tasks(assignee_id);
CREATE INDEX idx_tasks_status ON tasks(status);

-- Composite indexes for complex queries
CREATE INDEX idx_tasks_project_status ON tasks(project_id, status);
```

#### Caching Strategy
```typescript
// Redis caching
import Redis from 'ioredis';

const redis = new Redis(process.env.REDIS_URL);

// Cache API responses
export const cacheMiddleware = async (req, res, next) => {
  const key = `cache:${req.method}:${req.originalUrl}`;
  const cached = await redis.get(key);
  
  if (cached) {
    return res.json(JSON.parse(cached));
  }
  
  res.locals.cacheKey = key;
  next();
};
```

This comprehensive deployment tutorial provides everything you need to successfully deploy your real-time collaborative task manager to multiple hosting platforms, with detailed troubleshooting guides and performance optimization tips for production-ready applications.