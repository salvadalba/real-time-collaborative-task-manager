# Real-Time Collaborative Task Manager

A comprehensive, full-stack web application for real-time collaborative task management with advanced features including operational transforms, user presence indicators, activity feeds, file attachments, time tracking, and analytics.

## 🚀 Features

### Core Functionality
- **Real-time Collaboration**: Multiple users can work on tasks simultaneously with operational transform algorithms
- **User Presence**: See who's currently viewing or editing tasks with color-coded avatars
- **Activity Feed**: Chronological feed of all project changes with filtering capabilities
- **File Attachments**: Drag-and-drop file uploads with preview capabilities and cloud storage
- **Time Tracking**: Log hours on tasks, generate reports, and integrate with external services
- **Comments & Mentions**: Rich commenting system with @mentions and notifications
- **Calendar Views**: Visual deadline management with calendar integration
- **Analytics Dashboard**: Comprehensive project and productivity analytics

### Technical Features
- **Authentication**: JWT-based authentication with refresh tokens
- **Role-based Access Control**: Granular permissions for users, managers, and admins
- **Real-time Updates**: Socket.io for instant synchronization
- **Operational Transform**: Conflict-free concurrent editing
- **Responsive Design**: Mobile-first design that works on all devices
- **API-first Design**: RESTful API with comprehensive documentation
- **Cloud Deployment**: AWS infrastructure with CI/CD pipeline

## 🛠 Technology Stack

### Frontend
- **React 18** with TypeScript
- **Redux Toolkit** for state management
- **Material-UI (MUI)** for components
- **Socket.io-client** for real-time communication
- **Monaco Editor** for rich text editing
- **Chart.js** for analytics visualizations

### Backend
- **Node.js 18+** with Express.js
- **TypeScript** for type safety
- **PostgreSQL** with Prisma ORM
- **Socket.io** for real-time features
- **Redis** for caching and sessions
- **JWT** for authentication

### Infrastructure
- **AWS** for cloud deployment
- **Docker** for containerization
- **GitHub Actions** for CI/CD
- **CloudFront** for CDN
- **RDS** for managed database
- **S3** for file storage

## 📋 Project Structure

```
1/
├── README.md                          # This file
├── architecture-plan.md               # Detailed system architecture
├── project-structure.md               # Project organization and setup
├── real-time-collaboration-guide.md   # Real-time features implementation
├── deployment-guide.md                # AWS deployment and CI/CD
├── api-documentation.md               # Complete API reference
├── testing-guide.md                   # Comprehensive testing strategy
├── frontend/                          # React TypeScript application
├── backend/                           # Node.js Express API
├── database/                          # Database scripts and migrations
├── deployment/                        # Docker and deployment configs
├── docs/                              # Additional documentation
└── tests/                             # E2E and performance tests
```

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- PostgreSQL 14+
- Redis 7+
- Docker & Docker Compose
- AWS CLI (for deployment)

### Local Development

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd 1
   ```

2. **Install dependencies**
   ```bash
   npm run install:all
   ```

3. **Set up environment variables**
   ```bash
   cp backend/.env.example backend/.env
   cp frontend/.env.example frontend/.env
   # Edit the .env files with your configuration
   ```

4. **Start development environment**
   ```bash
   npm run dev
   ```
   
   This will start:
   - Frontend development server (http://localhost:3000)
   - Backend API server (http://localhost:5000)
   - PostgreSQL database (via Docker)
   - Redis cache (via Docker)

5. **Run database migrations**
   ```bash
   npm run db:migrate
   ```

6. **Seed database with sample data**
   ```bash
   npm run db:seed
   ```

### Docker Development

```bash
# Start all services with Docker Compose
docker-compose up -d

# View logs
docker-compose logs -f

# Stop services
docker-compose down
```

## 📚 Documentation

### Architecture & Design
- [Architecture Plan](./architecture-plan.md) - System design and database schema
- [Project Structure](./project-structure.md) - Code organization and setup guide

### Implementation Guides
- [Real-time Collaboration](./real-time-collaboration-guide.md) - Operational transforms and presence system
- [API Documentation](./api-documentation.md) - Complete API reference with examples

### Deployment & Operations
- [Deployment Guide](./deployment-guide.md) - AWS deployment, CI/CD, and monitoring
- [Testing Guide](./testing-guide.md) - Comprehensive testing strategy

## 🧪 Testing

### Run All Tests
```bash
npm run test
```

### Frontend Tests
```bash
cd frontend
npm run test              # Unit tests
npm run test:e2e          # End-to-end tests
npm run test:coverage     # Coverage report
```

### Backend Tests
```bash
cd backend
npm run test              # Unit tests
npm run test:integration  # Integration tests
npm run test:coverage     # Coverage report
```

### Performance Tests
```bash
npm run test:performance  # Load testing with Artillery
```

## 🚀 Deployment

### Production Deployment

1. **Configure AWS credentials**
   ```bash
   aws configure
   ```

2. **Deploy infrastructure**
   ```bash
   cd deployment/terraform
   terraform init
   terraform apply -var-file="terraform.tfvars"
   ```

3. **Build and deploy application**
   ```bash
   npm run build:prod
   npm run deploy:prod
   ```

### Environment-Specific Deployment

```bash
# Staging
npm run deploy:staging

# Development
npm run deploy:dev
```

## 🔧 Configuration

### Environment Variables

#### Backend (.env)
```bash
# Database
DATABASE_URL=postgresql://user:password@localhost:5432/taskmanager
REDIS_URL=redis://localhost:6379

# Authentication
JWT_SECRET=your-jwt-secret
JWT_REFRESH_SECRET=your-refresh-secret

# AWS
AWS_ACCESS_KEY_ID=your-aws-access-key
AWS_SECRET_ACCESS_KEY=your-aws-secret-key
AWS_S3_BUCKET=your-s3-bucket
AWS_REGION=us-east-1

# External APIs
TOGGL_API_KEY=your-toggl-api-key
HARVEST_ACCESS_TOKEN=your-harvest-access-token
```

#### Frontend (.env)
```bash
REACT_APP_API_URL=http://localhost:5000/api
REACT_APP_SOCKET_URL=http://localhost:5000
REACT_APP_AWS_REGION=us-east-1
```

## 📊 Monitoring & Analytics

### Application Monitoring
- **CloudWatch** for infrastructure metrics
- **Sentry** for error tracking
- **Winston** for structured logging
- **Health Checks** for service monitoring

### Performance Monitoring
- **Lighthouse CI** for performance scores
- **Artillery** for load testing
- **New Relic** for APM (optional)

## 🔒 Security

### Authentication & Authorization
- JWT tokens with short expiration
- Refresh token rotation
- Role-based access control
- Input validation and sanitization

### Data Protection
- Encrypted database connections
- S3 bucket with IAM policies
- Rate limiting on API endpoints
- CORS configuration

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Code Style
- Use TypeScript for all new code
- Follow ESLint configuration
- Write tests for new features
- Update documentation

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

### Documentation
- Check the [API Documentation](./api-documentation.md) for integration guides
- Review the [Deployment Guide](./deployment-guide.md) for setup issues
- See the [Testing Guide](./testing-guide.md) for testing questions

### Common Issues

**Database Connection Issues**
```bash
# Check if PostgreSQL is running
docker ps | grep postgres

# Restart database service
docker-compose restart postgres
```

**Socket.io Connection Issues**
```bash
# Check backend logs
docker-compose logs backend

# Verify WebSocket configuration
curl -i -N -H "Connection: Upgrade" \
     -H "Upgrade: websocket" \
     -H "Sec-WebSocket-Key: test" \
     -H "Sec-WebSocket-Version: 13" \
     http://localhost:5000/socket.io/
```

**Performance Issues**
```bash
# Check resource usage
docker stats

# Run performance tests
npm run test:performance
```

## 🗺 Roadmap

### Version 1.0 (Current)
- ✅ Core task management
- ✅ Real-time collaboration
- ✅ File attachments
- ✅ Time tracking
- ✅ Basic analytics

### Version 1.1 (Planned)
- 🔄 Advanced reporting
- 🔄 Mobile apps (React Native)
- 🔄 Advanced permissions
- 🔄 Custom workflows

### Version 2.0 (Future)
- 📋 AI-powered task suggestions
- 📋 Advanced project templates
- 📋 Third-party integrations (Slack, Teams, etc.)
- 📋 Whiteboard collaboration

## 📈 Metrics & KPIs

### Development Metrics
- Code Coverage: >80%
- Test Success Rate: >95%
- Build Time: <5 minutes
- Deployment Time: <10 minutes

### Performance Metrics
- API Response Time: <200ms (95th percentile)
- Page Load Time: <2 seconds
- Uptime: >99.9%
- Concurrent Users: 1000+

### Business Metrics
- User Engagement: Daily active users
- Task Completion Rate: >80%
- Collaboration Rate: Tasks with multiple contributors
- User Satisfaction: NPS score

---

**Built with ❤️ by the Task Manager Team**