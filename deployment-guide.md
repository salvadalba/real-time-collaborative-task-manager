# Deployment and CI/CD Guide

## Overview

This guide provides comprehensive instructions for deploying the real-time collaborative task manager application to AWS, including CI/CD pipeline setup, monitoring, and maintenance procedures.

## AWS Infrastructure Architecture

### Infrastructure Components

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   CloudFront    │    │   Route 53      │    │   ACM (SSL)     │
│   (CDN)         │    │   (DNS)         │    │   (Certificates)│
└─────────┬───────┘    └─────────┬───────┘    └─────────┬───────┘
          │                      │                      │
          └──────────────────────┼──────────────────────┘
                                 │
                    ┌─────────────▼─────────────┐
                    │   Application Load        │
                    │   Balancer (ALB)          │
                    └─────────────┬─────────────┘
                                 │
          ┌──────────────────────┼──────────────────────┐
          │                      │                      │
┌─────────▼───────┐    ┌─────────▼───────┐    ┌─────────▼───────┐
│   ECS Service   │    │   ECS Service   │    │   ECS Service   │
│   (Frontend)    │    │   (Backend)     │    │   (Socket.io)   │
└─────────┬───────┘    └─────────┬───────┘    └─────────┬───────┘
          │                      │                      │
          └──────────────────────┼──────────────────────┘
                                 │
          ┌──────────────────────┼──────────────────────┐
          │                      │                      │
┌─────────▼───────┐    ┌─────────▼───────┐    ┌─────────▼───────┐
│     RDS         │    │   ElastiCache   │    │     S3          │
│  (PostgreSQL)   │    │    (Redis)      │    │  (File Storage) │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

## 1. Terraform Infrastructure Setup

### Main Terraform Configuration

```hcl
# deployment/terraform/main.tf
terraform {
  required_version = ">= 1.0"
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }
}

provider "aws" {
  region = var.aws_region
}

# VPC Configuration
module "vpc" {
  source = "terraform-aws-modules/vpc/aws"
  
  name = "${var.project_name}-vpc"
  cidr = "10.0.0.0/16"
  
  azs             = ["${var.aws_region}a", "${var.aws_region}b"]
  private_subnets = ["10.0.1.0/24", "10.0.2.0/24"]
  public_subnets  = ["10.0.101.0/24", "10.0.102.0/24"]
  
  enable_nat_gateway = true
  enable_vpn_gateway = false
  
  tags = {
    Name        = var.project_name
    Environment = var.environment
  }
}

# ECS Cluster
resource "aws_ecs_cluster" "main" {
  name = "${var.project_name}-cluster"
  
  setting {
    name  = "containerInsights"
    value = "enabled"
  }
}

# Application Load Balancer
resource "aws_lb" "main" {
  name               = "${var.project_name}-alb"
  internal           = false
  load_balancer_type = "application"
  security_groups    = [aws_security_group.alb.id]
  subnets            = module.vpc.public_subnets
  
  enable_deletion_protection = false
  
  tags = {
    Name = var.project_name
  }
}

# RDS PostgreSQL
resource "aws_db_instance" "postgres" {
  identifier = "${var.project_name}-db"
  
  engine         = "postgres"
  engine_version = "14.9"
  instance_class = "db.t3.micro"
  
  allocated_storage     = 20
  max_allocated_storage = 100
  storage_encrypted     = true
  
  db_name  = "taskmanager"
  username = var.db_username
  password = var.db_password
  
  vpc_security_group_ids = [aws_security_group.rds.id]
  db_subnet_group_name   = aws_db_subnet_group.main.name
  
  backup_retention_period = 7
  backup_window          = "03:00-04:00"
  maintenance_window     = "sun:04:00-sun:05:00"
  
  skip_final_snapshot = true
  
  tags = {
    Name = var.project_name
  }
}

# ElastiCache Redis
resource "aws_elasticache_subnet_group" "main" {
  name       = "${var.project_name}-cache-subnet"
  subnet_ids = module.vpc.private_subnets
}

resource "aws_elasticache_cluster" "redis" {
  cluster_id           = "${var.project_name}-redis"
  engine               = "redis"
  node_type            = "cache.t3.micro"
  num_cache_nodes      = 1
  parameter_group_name = "default.redis7"
  port                 = 6379
  subnet_group_name    = aws_elasticache_subnet_group.main.name
  security_group_ids   = [aws_security_group.redis.id]
}

# S3 Bucket
resource "aws_s3_bucket" "main" {
  bucket = "${var.project_name}-${var.environment}-files"
  
  tags = {
    Name = var.project_name
  }
}

resource "aws_s3_bucket_versioning" "main" {
  bucket = aws_s3_bucket.main.id
  versioning_configuration {
    status = "Enabled"
  }
}

resource "aws_s3_bucket_server_side_encryption_configuration" "main" {
  bucket = aws_s3_bucket.main.id
  
  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm = "AES256"
    }
  }
}

# CloudFront Distribution
resource "aws_cloudfront_distribution" "main" {
  origin {
    domain_name = aws_lb.main.dns_name
    origin_id   = "alb-origin"
    
    custom_origin_config {
      http_port              = 80
      https_port             = 443
      origin_protocol_policy = "https-only"
      origin_ssl_protocols   = ["TLSv1.2"]
    }
  }
  
  enabled             = true
  is_ipv6_enabled     = true
  default_root_object = "index.html"
  
  default_cache_behavior {
    allowed_methods        = ["DELETE", "GET", "HEAD", "OPTIONS", "PATCH", "POST", "PUT"]
    cached_methods         = ["GET", "HEAD"]
    target_origin_id       = "alb-origin"
    compress               = true
    viewer_protocol_policy = "redirect-to-https"
    
    forwarded_values {
      query_string = false
      cookies {
        forward = "none"
      }
    }
  }
  
  restrictions {
    geo_restriction {
      restriction_type = "none"
    }
  }
  
  viewer_certificate {
    cloudfront_default_certificate = true
  }
  
  tags = {
    Name = var.project_name
  }
}
```

### Variables Configuration

```hcl
# deployment/terraform/variables.tf
variable "project_name" {
  description = "Name of the project"
  type        = string
  default     = "taskmanager"
}

variable "environment" {
  description = "Environment (dev, staging, prod)"
  type        = string
  default     = "prod"
}

variable "aws_region" {
  description = "AWS region"
  type        = string
  default     = "us-east-1"
}

variable "db_username" {
  description = "Database username"
  type        = string
  sensitive   = true
}

variable "db_password" {
  description = "Database password"
  type        = string
  sensitive   = true
}
```

## 2. Docker Configuration

### Frontend Dockerfile

```dockerfile
# deployment/docker/Dockerfile.frontend
FROM node:18-alpine AS builder

WORKDIR /app

# Copy package files
COPY frontend/package*.json ./
RUN npm ci --only=production

# Copy source code
COPY frontend/ .

# Build application
RUN npm run build

# Production stage
FROM nginx:alpine

# Copy built application
COPY --from=builder /app/build /usr/share/nginx/html

# Copy nginx configuration
COPY deployment/docker/nginx.conf /etc/nginx/nginx.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
```

### Backend Dockerfile

```dockerfile
# deployment/docker/Dockerfile.backend
FROM node:18-alpine AS builder

WORKDIR /app

# Copy package files
COPY backend/package*.json ./
RUN npm ci --only=production

# Copy source code
COPY backend/ .

# Build TypeScript
RUN npm run build

# Production stage
FROM node:18-alpine

WORKDIR /app

# Copy built application and dependencies
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package*.json ./

# Create non-root user
RUN addgroup -g 1001 -S nodejs
RUN adduser -S nodejs -u 1001

USER nodejs

EXPOSE 5000

CMD ["node", "dist/app.js"]
```

### Nginx Configuration

```nginx
# deployment/docker/nginx.conf
events {
    worker_connections 1024;
}

http {
    include       /etc/nginx/mime.types;
    default_type  application/octet-stream;
    
    upstream backend {
        server backend:5000;
    }
    
    server {
        listen 80;
        server_name localhost;
        
        # Frontend static files
        location / {
            root /usr/share/nginx/html;
            index index.html index.htm;
            try_files $uri $uri/ /index.html;
        }
        
        # API proxy
        location /api/ {
            proxy_pass http://backend;
            proxy_http_version 1.1;
            proxy_set_header Upgrade $http_upgrade;
            proxy_set_header Connection 'upgrade';
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
            proxy_cache_bypass $http_upgrade;
        }
        
        # Socket.io proxy
        location /socket.io/ {
            proxy_pass http://backend;
            proxy_http_version 1.1;
            proxy_set_header Upgrade $http_upgrade;
            proxy_set_header Connection "upgrade";
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
        }
    }
}
```

## 3. ECS Task Definitions

### Frontend Task Definition

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
      "image": "ACCOUNT.dkr.ecr.REGION.amazonaws.com/taskmanager-frontend:latest",
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

### Backend Task Definition

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
      "image": "ACCOUNT.dkr.ecr.REGION.amazonaws.com/taskmanager-backend:latest",
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
        },
        {
          "name": "DATABASE_URL",
          "value": "postgresql://username:password@host:5432/taskmanager"
        },
        {
          "name": "REDIS_URL",
          "value": "redis://host:6379"
        },
        {
          "name": "AWS_S3_BUCKET",
          "value": "taskmanager-prod-files"
        }
      ],
      "secrets": [
        {
          "name": "JWT_SECRET",
          "valueFrom": "arn:aws:secretsmanager:REGION:ACCOUNT:secret:taskmanager/jwt-secret"
        },
        {
          "name": "AWS_ACCESS_KEY_ID",
          "valueFrom": "arn:aws:secretsmanager:REGION:ACCOUNT:secret:taskmanager/aws-access-key"
        },
        {
          "name": "AWS_SECRET_ACCESS_KEY",
          "valueFrom": "arn:aws:secretsmanager:REGION:ACCOUNT:secret:taskmanager/aws-secret-key"
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

## 4. GitHub Actions CI/CD Pipeline

### Main Workflow

```yaml
# .github/workflows/deploy.yml
name: Build and Deploy

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

env:
  AWS_REGION: us-east-1
  ECR_REGISTRY: ACCOUNT.dkr.ecr.us-east-1.amazonaws.com
  ECR_REPOSITORY_FRONTEND: taskmanager-frontend
  ECR_REPOSITORY_BACKEND: taskmanager-backend

jobs:
  test:
    runs-on: ubuntu-latest
    
    services:
      postgres:
        image: postgres:14
        env:
          POSTGRES_PASSWORD: postgres
          POSTGRES_DB: test_db
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
        ports:
          - 5432:5432
      
      redis:
        image: redis:7
        options: >-
          --health-cmd "redis-cli ping"
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
        ports:
          - 6379:6379

    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
          cache: 'npm'
          cache-dependency-path: |
            frontend/package-lock.json
            backend/package-lock.json
      
      - name: Install Frontend Dependencies
        run: |
          cd frontend
          npm ci
      
      - name: Run Frontend Tests
        run: |
          cd frontend
          npm run test:ci
        env:
          CI: true
      
      - name: Install Backend Dependencies
        run: |
          cd backend
          npm ci
      
      - name: Run Backend Tests
        run: |
          cd backend
          npm run test:ci
        env:
          DATABASE_URL: postgresql://postgres:postgres@localhost:5432/test_db
          REDIS_URL: redis://localhost:6379
          JWT_SECRET: test-secret
          JWT_REFRESH_SECRET: test-refresh-secret

  build-and-push:
    needs: test
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'
    
    permissions:
      contents: read
      packages: write
      
    steps:
      - uses: actions/checkout@v3
      
      - name: Configure AWS Credentials
        uses: aws-actions/configure-aws-credentials@v2
        with:
          aws-access-key-id: ${{ secrets.AWS_ACCESS_KEY_ID }}
          aws-secret-access-key: ${{ secrets.AWS_SECRET_ACCESS_KEY }}
          aws-region: ${{ env.AWS_REGION }}
      
      - name: Login to Amazon ECR
        id: login-ecr
        uses: aws-actions/amazon-ecr-login@v1
      
      - name: Build and Push Frontend Image
        env:
          ECR_REGISTRY: ${{ steps.login-ecr.outputs.registry }}
          IMAGE_TAG: ${{ github.sha }}
        run: |
          docker build -f deployment/docker/Dockerfile.frontend -t $ECR_REGISTRY/$ECR_REPOSITORY_FRONTEND:$IMAGE_TAG .
          docker push $ECR_REGISTRY/$ECR_REPOSITORY_FRONTEND:$IMAGE_TAG
          docker tag $ECR_REGISTRY/$ECR_REPOSITORY_FRONTEND:$IMAGE_TAG $ECR_REGISTRY/$ECR_REPOSITORY_FRONTEND:latest
          docker push $ECR_REGISTRY/$ECR_REPOSITORY_FRONTEND:latest
      
      - name: Build and Push Backend Image
        env:
          ECR_REGISTRY: ${{ steps.login-ecr.outputs.registry }}
          IMAGE_TAG: ${{ github.sha }}
        run: |
          docker build -f deployment/docker/Dockerfile.backend -t $ECR_REGISTRY/$ECR_REPOSITORY_BACKEND:$IMAGE_TAG .
          docker push $ECR_REGISTRY/$ECR_REPOSITORY_BACKEND:$IMAGE_TAG
          docker tag $ECR_REGISTRY/$ECR_REPOSITORY_BACKEND:$IMAGE_TAG $ECR_REGISTRY/$ECR_REPOSITORY_BACKEND:latest
          docker push $ECR_REGISTRY/$ECR_REPOSITORY_BACKEND:latest

  deploy:
    needs: build-and-push
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'
    
    steps:
      - uses: actions/checkout@v3
      
      - name: Configure AWS Credentials
        uses: aws-actions/configure-aws-credentials@v2
        with:
          aws-access-key-id: ${{ secrets.AWS_ACCESS_KEY_ID }}
          aws-secret-access-key: ${{ secrets.AWS_SECRET_ACCESS_KEY }}
          aws-region: ${{ env.AWS_REGION }}
      
      - name: Setup Terraform
        uses: hashicorp/setup-terraform@v2
        with:
          terraform_version: 1.4.6
      
      - name: Terraform Init
        run: |
          cd deployment/terraform
          terraform init
      
      - name: Terraform Plan
        run: |
          cd deployment/terraform
          terraform plan -var-file="terraform.tfvars"
      
      - name: Terraform Apply
        run: |
          cd deployment/terraform
          terraform apply -auto-approve -var-file="terraform.tfvars"
      
      - name: Update ECS Services
        run: |
          aws ecs update-service --cluster taskmanager-cluster --service taskmanager-frontend-service --force-new-deployment
          aws ecs update-service --cluster taskmanager-cluster --service taskmanager-backend-service --force-new-deployment
      
      - name: Wait for Deployment
        run: |
          aws ecs wait services-stable --cluster taskmanager-cluster --services taskmanager-frontend-service taskmanager-backend-service
```

## 5. Environment Configuration

### Production Environment Variables

```bash
# backend/.env.production
NODE_ENV=production
PORT=5000

# Database
DATABASE_URL=postgresql://username:password@host:5432/taskmanager

# Redis
REDIS_URL=redis://host:6379

# JWT
JWT_SECRET=your-production-jwt-secret
JWT_REFRESH_SECRET=your-production-refresh-secret
JWT_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d

# AWS
AWS_ACCESS_KEY_ID=your-aws-access-key
AWS_SECRET_ACCESS_KEY=your-aws-secret-key
AWS_REGION=us-east-1
AWS_S3_BUCKET=taskmanager-prod-files

# External APIs
TOGGL_API_KEY=your-toggl-api-key
HARVEST_ACCESS_TOKEN=your-harvest-access-token

# Monitoring
SENTRY_DSN=your-sentry-dsn
LOG_LEVEL=info
```

### Frontend Environment Variables

```bash
# frontend/.env.production
REACT_APP_API_URL=https://api.yourdomain.com
REACT_APP_SOCKET_URL=https://api.yourdomain.com
REACT_APP_AWS_REGION=us-east-1
REACT_APP_SENTRY_DSN=your-frontend-sentry-dsn
```

## 6. Monitoring and Logging

### CloudWatch Dashboard Configuration

```json
{
  "widgets": [
    {
      "type": "metric",
      "properties": {
        "metrics": [
          ["AWS/ECS", "CPUUtilization", "ServiceName", "taskmanager-backend-service"],
          [".", "CPUUtilization", "ServiceName", "taskmanager-frontend-service"]
        ],
        "period": 300,
        "stat": "Average",
        "region": "us-east-1",
        "title": "ECS CPU Utilization",
        "yAxis": {
          "left": {
            "min": 0,
            "max": 100
          }
        }
      }
    },
    {
      "type": "metric",
      "properties": {
        "metrics": [
          ["AWS/RDS", "CPUUtilization", "DBInstanceIdentifier", "taskmanager-db"],
          ["AWS/RDS", "DatabaseConnections", "DBInstanceIdentifier", "taskmanager-db"],
          ["AWS/ElastiCache", "CPUUtilization", "CacheClusterId", "taskmanager-redis"]
        ],
        "period": 300,
        "stat": "Average",
        "region": "us-east-1",
        "title": "Database Performance"
      }
    },
    {
      "type": "metric",
      "properties": {
        "metrics": [
          ["AWS/ApplicationELB", "RequestCount", "LoadBalancer", "app/taskmanager-alb"],
          [".", "TargetResponseTime", "LoadBalancer", "app/taskmanager-alb"],
          [".", "HTTPCode_Target_5XX_Count", "LoadBalancer", "app/taskmanager-alb"]
        ],
        "period": 300,
        "stat": "Sum",
        "region": "us-east-1",
        "title": "Load Balancer Metrics"
      }
    }
  ]
}
```

### Application Logging Configuration

```typescript
// backend/src/utils/logger.ts
import winston from 'winston';
import CloudWatchLogs from 'winston-cloudwatch';

const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  defaultMeta: { service: 'taskmanager-backend' },
  transports: [
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.simple()
      )
    })
  ],
});

// Add CloudWatch transport in production
if (process.env.NODE_ENV === 'production') {
  logger.add(new CloudWatchLogs({
    logGroupName: `/aws/ecs/taskmanager-backend`,
    logStreamName: () => {
      const date = new Date().toISOString().split('T')[0];
      return `${date}-${process.env.ECS_TASK_ID || 'local'}`;
    }
  }));
}

export default logger;
```

## 7. Backup and Disaster Recovery

### Database Backup Script

```bash
#!/bin/bash
# scripts/backup-database.sh

set -e

# Configuration
DB_INSTANCE_ID="taskmanager-db"
S3_BUCKET="taskmanager-prod-backups"
DATE=$(date +%Y%m%d-%H%M%S)
BACKUP_FILE="backup-${DATE}.sql"

# Create backup
aws rds create-db-snapshot \
    --db-instance-identifier ${DB_INSTANCE_ID} \
    --db-snapshot-identifier ${BACKUP_FILE}

# Wait for snapshot completion
aws rds wait db-snapshot-available \
    --db-snapshot-identifier ${BACKUP_FILE}

# Copy snapshot to S3
aws rds describe-db-snapshots \
    --db-snapshot-identifier ${BACKUP_FILE} \
    --query 'DBSnapshots[0].SnapshotCreateTime' \
    --output text

# Clean up old backups (keep last 30 days)
aws s3 ls s3://${S3_BUCKET}/ | while read -r line; do
    createDate=$(echo $line | awk '{print $1" "$2}')
    createDate=$(date -d "$createDate" +%s)
    olderThan=$(date -d "30 days ago" +%s)
    
    if [[ $createDate -lt $olderThan ]]; then
        fileName=$(echo $line | awk '{print $4}')
        if [[ $fileName != "" ]]; then
            aws s3 rm s3://${S3_BUCKET}/$fileName
        fi
    fi
done

echo "Backup completed: ${BACKUP_FILE}"
```

### Automated Backup via Lambda

```python
# deployment/lambda/backup_function.py
import boto3
import os
from datetime import datetime, timedelta

def lambda_handler(event, context):
    rds = boto3.client('rds')
    s3 = boto3.client('s3')
    
    db_instance_id = os.environ['DB_INSTANCE_ID']
    s3_bucket = os.environ['S3_BUCKET']
    
    # Create snapshot
    timestamp = datetime.now().strftime('%Y%m%d-%H%M%S')
    snapshot_id = f'automated-backup-{timestamp}'
    
    rds.create_db_snapshot(
        DBInstanceIdentifier=db_instance_id,
        DBSnapshotIdentifier=snapshot_id
    )
    
    # Wait for completion
    waiter = rds.get_waiter('db_snapshot_available')
    waiter.wait(DBSnapshotIdentifier=snapshot_id)
    
    # Export to S3
    rds.start_export_task(
        ExportTaskIdentifier=f'export-{timestamp}',
        SourceArn=f'arn:aws:rds:{os.environ["AWS_REGION"]}:{os.environ["ACCOUNT_ID"]}:snapshot:{snapshot_id}',
        S3BucketName=s3_bucket,
        IamRoleArn=os.environ['EXPORT_ROLE_ARN'],
        KmsKeyId=os.environ['KMS_KEY_ID']
    )
    
    return {
        'statusCode': 200,
        'body': f'Backup initiated: {snapshot_id}'
    }
```

## 8. Security Configuration

### Security Groups

```hcl
# Security Group for ALB
resource "aws_security_group" "alb" {
  name        = "${var.project_name}-alb-sg"
  description = "Security group for Application Load Balancer"
  vpc_id      = module.vpc.vpc_id

  ingress {
    description = "HTTP"
    from_port   = 80
    to_port     = 80
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  ingress {
    description = "HTTPS"
    from_port   = 443
    to_port     = 443
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = {
    Name = var.project_name
  }
}

# Security Group for ECS
resource "aws_security_group" "ecs" {
  name        = "${var.project_name}-ecs-sg"
  description = "Security group for ECS tasks"
  vpc_id      = module.vpc.vpc_id

  ingress {
    description     = "HTTP from ALB"
    from_port       = 5000
    to_port         = 5000
    protocol        = "tcp"
    security_groups = [aws_security_group.alb.id]
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = {
    Name = var.project_name
  }
}
```

## 9. Deployment Commands

### Manual Deployment

```bash
# Deploy infrastructure
cd deployment/terraform
terraform init
terraform plan -var-file="terraform.tfvars"
terraform apply -var-file="terraform.tfvars"

# Build and push images
docker build -f deployment/docker/Dockerfile.frontend -t $ECR_REGISTRY/$ECR_REPOSITORY_FRONTEND:latest .
docker push $ECR_REGISTRY/$ECR_REPOSITORY_FRONTEND:latest

docker build -f deployment/docker/Dockerfile.backend -t $ECR_REGISTRY/$ECR_REPOSITORY_BACKEND:latest .
docker push $ECR_REGISTRY/$ECR_REPOSITORY_BACKEND:latest

# Update ECS services
aws ecs update-service --cluster taskmanager-cluster --service taskmanager-frontend-service --force-new-deployment
aws ecs update-service --cluster taskmanager-cluster --service taskmanager-backend-service --force-new-deployment
```

### Rollback Procedure

```bash
# Get previous task definition
aws ecs describe-task-definition --task-definition taskmanager-backend --query 'taskDefinition.revision'

# Update service to previous revision
aws ecs update-service \
  --cluster taskmanager-cluster \
  --service taskmanager-backend-service \
  --task-definition taskmanager-backend:PREVIOUS_REVISION
```

This comprehensive deployment guide provides all the necessary components to successfully deploy the real-time collaborative task manager application to AWS with proper CI/CD pipelines, monitoring, and security configurations.