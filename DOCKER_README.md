# Docker Setup Guide - RSA-AES Encrypted Chat Application

This guide walks you through running the complete encrypted chat application using Docker and Docker Compose. The application uses containerization for easy deployment and scalability.

## 🐳 Prerequisites

### Required Software
- **Docker** (v20.10+) - [Download](https://docker.com/get-started)
- **Docker Compose** (v2.0+) - [Download](https://docs.docker.com/compose/install/)

### Verify Installation
```bash
# Check Docker version
docker --version
docker compose version

# Check if Docker daemon is running
docker info
```

### Hardware Requirements
- **RAM**: 4GB minimum, 8GB recommended
- **CPU**: 2 cores minimum, 4 cores recommended
- **Storage**: 5GB free space

---

## 🚀 Quick Start with Docker

```bash
# 1. Clone the repository
git clone https://github.com/CHINMAYBHT/IS-PROJECT.git
cd IS-PROJECT

# 2. Create environment file
cp Backend/.env.example Backend/.env

# 3. Edit the .env file with your API keys
# IMPORTANT: Replace the JWT secret and add OpenRouter API key
nano Backend/.env

# 4. Run the application
docker compose up --build

# 5. Access the application
# Frontend: http://localhost:5173
# Backend API: http://localhost:3001
# Encryption Service: http://localhost:5001
# Database: localhost:3306
```

**That's it!** 🎉 The entire stack will be running in containers.

---

## 📁 Docker Architecture

```
Docker Compose Stack:
├── mysql               # MySQL 8.0 database
├── backend             # Node.js API server
├── encryption-service  # Python Flask microservice
└── frontend            # React app with nginx
```

### Services Overview

1. **MySQL (Database)**
   - **Image**: `mysql:8.0`
   - **Port**: `3306`
   - **Auto-initializes**: Tables created from `init-db.sql`
   - **Persistent**: Data survives container restarts

2. **Backend (Node.js)**
   - **Port**: `3001`
   - **Environment**: Production optimized
   - **Health Checks**: Automatic service monitoring

3. **Encryption Service (Python)**
   - **Port**: `5001`
   - **Dependencies**: PyCryptoDome, Flask, MySQL
   - **Health Checks**: Automatic monitoring

4. **Frontend (React)**
   - **Port**: `5173` (HTTP), `5174` (HTTPS optional)
   - **Reverse Proxy**: nginx with gzip + security headers
   - **API Proxying**: Routes `/api/*` to backend, `/encryption/*` to Python service

---

## 🔧 Configuration

### Environment Variables

Create/edit `Backend/.env`:
```env
# Database (Docker internal networking)
DB_HOST=mysql
DB_USER=chat_user
DB_PASS=chat_password
DB_NAME=secure_chat_db

# Server
PORT=3001
JWT_SECRET=your-super-secret-jwt-key-change-in-production-32-chars-minimum

# AI API (REQUIRED)
OPENROUTER_API_KEY=sk-or-v1-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
OPENROUTER_API_URL=https://openrouter.ai/api/v1/chat/completions
```

### Getting OpenRouter API Key
1. Visit [openrouter.ai](https://openrouter.ai)
2. Sign up for an account
3. Go to API Keys section
4. Create a new API key
5. Copy the key to your `.env` file

---

## 🚀 Running the Application

### Method 1: Development Mode (Auto-restart)

```bash
# Start all services
docker compose up --build

# Run in background
docker compose up --build -d

# View logs
docker compose logs -f

# View specific service logs
docker compose logs -f backend
```

### Method 2: Production Mode

```bash
# Build and start
docker compose -f docker-compose.yml up --build -d

# Scale services if needed
docker compose up -d --scale backend=3
```

### Service Status Check

```bash
# Check if all containers are running
docker compose ps

# Check container health
docker compose exec backend curl -f http://localhost:3001/health || echo "Backend unhealthy"
docker compose exec encryption-service curl -f http://localhost:5001/health || echo "Encryption unhealthy"

# View resource usage
docker stats
```

---

## 🔧 Docker Commands Cheat Sheet

### Basic Commands
```bash
# Start services
docker compose up -d

# Stop services
docker compose down

# Rebuild and restart
docker compose up --build -d

# View logs
docker compose logs -f [service-name]

# Restart specific service
docker compose restart backend
```

### Maintenance Commands
```bash
# Clean up unused images/containers
docker system prune -f

# Stop and remove volumes (CAUTION: DELETES DATA)
docker compose down -v

# Rebuild specific service
docker compose build --no-cache backend

# Shell into running container
docker compose exec backend sh
docker compose exec mysql mysql -u root -p secure_chat_db
```

### Database Operations
```bash
# Connect to MySQL container
docker compose exec mysql mysql -u chat_user -p secure_chat_db
# Password: chat_password

# Backup database
docker compose exec mysql mysqldump -u chat_user -p secure_chat_db > backup.sql

# Restore database
docker compose exec -T mysql mysql -u chat_user -p secure_chat_db < backup.sql
```

---

## 🔍 Troubleshooting Docker Issues

### Common Issues

**Issue: Port already in use**
```
Error: Port 3001 is already in use
```
**Solution:**
```bash
# Find what's using the port
netstat -an | find "3001"

# Stop conflicting service or change ports in docker-compose.yml
nano docker-compose.yml  # Change port mappings
```

**Issue: MySQL connection failed**
```
ERROR 1045 (28000): Access denied for user 'chat_user'
```
**Solution:**
```bash
# Restart MySQL container to recreate user
docker compose down
docker compose up mysql -d
docker compose up backend encryption-service
```

**Issue: Out of memory**
```
ERROR: Pool overlaps with other one
```
**Solution:**
```bash
# Increase Docker memory limit or free up RAM
docker system prune -f
docker compose down
docker compose up -d
```

**Issue: Slow startup**
**Solution:**
```bash
# Wait for healthchecks - MySQL needs time to initialize
docker compose logs mysql
docker compose ps  # Check STATUS column
```

### Debugging Commands

```bash
# View detailed container logs
docker compose logs --tail=100 backend

# Inspect container network
docker network ls
docker network inspect is-project-secure-chat-network

# Check container resource usage
docker stats $(docker compose ps -q)

# Execute commands in running containers
docker compose exec backend npm test
docker compose exec mysql mysqladmin ping -h localhost
```

### Service-Specific Debugging

**Backend Issues:**
```bash
docker compose logs backend
docker compose exec backend cat logs/app.log
docker compose exec backend curl http://localhost:3001/health
```

**Encryption Service Issues:**
```bash
docker compose logs encryption-service
docker compose exec encryption-service python -c "import Crypto; print('OK')"
docker compose exec encryption-service curl http://localhost:5001/health
```

**Database Issues:**
```bash
docker compose logs mysql
docker compose exec mysql mysql -u root -p -e "SHOW DATABASES;"
docker compose exec mysql mysql -u root -p -e "USE secure_chat_db; SHOW TABLES;"
```

---

## 🔐 Security Best Practices

### Environment Security
```bash
# Use .env files (never commit secrets)
echo ".env*" >> .gitignore

# Generate strong JWT secret (32+ chars)
openssl rand -base64 32
```

### Production Deployment
```bash
# Use external secrets management
# Add SSL/TLS certificates
# Configure firewall rules
# Enable log aggregation
# Set up monitoring/alerting
```

### Container Security
```bash
# Run containers as non-root users
# Update base images regularly
# Use specific image tags (not :latest)
# Implement container scanning
```

---

## 📊 Monitoring & Logs

### Application Logs
```bash
# All services
docker compose logs -f

# Specific time window
docker compose logs --since 1h backend

# Export logs for analysis
docker compose logs backend > backend_logs.txt
```

### Health Checks
```bash
# Check all services health
curl http://localhost:5173/health     # Frontend health
curl http://localhost:3001/health     # Backend health
curl http://localhost:5001/health     # Encryption health

# Database connectivity
docker compose exec backend mysqladmin ping -h mysql
```

### Resource Monitoring
```bash
# Monitor resource usage
docker stats $(docker compose ps --format json | jq -r '.Name')

# Check disk usage
docker system df

# View container metrics
docker inspect $(docker compose ps -q) | jq '.[].Name, .[].State.Health.Status'
```

---

## 🚀 Deployment Scenarios

### Local Development
```bash
# Quick local setup
docker compose up --build

# Access: http://localhost:5173
```

### Production Server
```bash
# Production docker-compose.yml (external reverse proxy)
docker compose -f docker-compose.prod.yml up -d

# With SSL certificate
docker compose -f docker-compose.ssl.yml up -d
```

### CI/CD Pipeline
```yaml
# GitHub Actions example
- name: Build and push
  run: |
    docker build -t myapp/backend ./Backend
    docker push myapp/backend
```

---

## 🔄 Updates & Maintenance

### Updating the Application
```bash
# Pull latest changes
git pull origin main

# Rebuild and restart
docker compose down
docker compose pull
docker compose up --build -d

# Zero-downtime updates (advanced)
docker compose up --build -d --scale backend=0
docker compose up --build -d --scale backend=2
```

### Backup & Restore
```bash
# Backup database
docker compose exec mysql mysqldump -u chat_user -p secure_chat_db > backup_$(date +%Y%m%d).sql

# Backup volumes
docker run --rm -v is-project_mysql_data:/data -v $(pwd):/backup alpine tar czf /backup/mysql_backup.tar.gz -C /data .

# Restore from backup
docker compose exec -T mysql mysql -u chat_user -p secure_chat_db < backup.sql
```

---

## 🆘 Support & Getting Help

### Common Docker Commands
- `docker compose ps` - List running containers
- `docker compose logs -f` - Follow all logs
- `docker compose down` - Stop all services
- `docker compose restart web` - Restart specific service

### Debug Checklist
- [ ] Docker daemon running: `docker info`
- [ ] Ports not in use: `netstat -an | find "3001"`
- [ ] Sufficient resources: `docker system df`
- [ ] Environment file exists: `ls -la Backend/.env`
- [ ] API keys configured: `grep OPENROUTER Backend/.env`

### Getting Assistance
1. Check container logs: `docker compose logs [service]`
2. Verify configurations match this guide
3. Test individual services: `curl http://localhost:3001/health`
4. Check GitHub issues for similar problems
5. Provide complete error logs when asking for help

---

## 📋 Success Checklist

- ✅ **Docker installed**: `docker --version` works
- ✅ **docker-compose installed**: `docker compose version` works
- ✅ **Environment configured**: `Backend/.env` exists with API keys
- ✅ **Services started**: `docker compose ps` shows 4 containers
- ✅ **Frontend accessible**: http://localhost:5173 works
- ✅ **API responding**: http://localhost:3001/health returns healthy
- ✅ **Encryption works**: http://localhost:5001/health returns healthy
- ✅ **Database connected**: Can access MySQL on localhost:3306
- ✅ **User can chat**: Send messages and receive AI responses
- ✅ **Encryption verified**: Messages stored encryped in database

**Congratulations!** 🎉 Your secure, encrypted chat application is running in Docker containers.
