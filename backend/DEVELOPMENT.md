# Development Setup Guide

## Prerequisites

Before running the backend server, ensure you have the following installed and running:

### 1. PostgreSQL Database

**Windows:**
```bash
# Install PostgreSQL (if not already installed)
# Download from: https://www.postgresql.org/download/windows/

# Create database
createdb erp_business_db

# Or using psql
psql -U postgres
CREATE DATABASE erp_business_db;
\q
```

**macOS:**
```bash
# Install PostgreSQL using Homebrew
brew install postgresql
brew services start postgresql

# Create database
createdb erp_business_db
```

**Linux (Ubuntu/Debian):**
```bash
# Install PostgreSQL
sudo apt update
sudo apt install postgresql postgresql-contrib

# Start PostgreSQL service
sudo systemctl start postgresql
sudo systemctl enable postgresql

# Create database
sudo -u postgres createdb erp_business_db
```

### 2. Redis Server

**Windows:**
```bash
# Install Redis using WSL or download Redis for Windows
# Or use Docker: docker run -d -p 6379:6379 redis:alpine
```

**macOS:**
```bash
# Install Redis using Homebrew
brew install redis
brew services start redis
```

**Linux (Ubuntu/Debian):**
```bash
# Install Redis
sudo apt update
sudo apt install redis-server

# Start Redis service
sudo systemctl start redis-server
sudo systemctl enable redis-server
```

### 3. Environment Configuration

1. Copy the environment file:
```bash
cp .env.example .env
```

2. Update the `.env` file with your database credentials:
```env
# Database Configuration
DB_HOST=localhost
DB_PORT=5432
DB_NAME=erp_business_db
DB_USER=postgres
DB_PASSWORD=your_password_here
DB_SSL=false

# Redis Configuration
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=
REDIS_DB=0

# JWT Configuration
JWT_SECRET=your_super_secret_jwt_key_here
JWT_REFRESH_SECRET=your_super_secret_refresh_key_here
JWT_EXPIRES_IN=1h
JWT_REFRESH_EXPIRES_IN=7d

# Server Configuration
PORT=3001
NODE_ENV=development

# CORS Configuration
CORS_ORIGIN=http://localhost:3000
```

## Quick Start

1. **Install dependencies:**
```bash
npm install
```

2. **Set up the database:**
```bash
npm run db:setup
```

3. **Start the development server:**
```bash
npm run dev
```

The server will start on `http://localhost:3001`

## Available Scripts

- `npm run dev` - Start development server with hot reload
- `npm run build` - Build for production
- `npm start` - Start production server
- `npm run db:setup` - Set up database schema and seed data
- `npm run db:schema` - Run database schema only
- `npm run db:seed` - Insert seed data only
- `npm test` - Run tests
- `npm run lint` - Run ESLint
- `npm run lint:fix` - Fix ESLint errors

## API Testing

Once the server is running, you can test the API:

1. **Health Check:**
```bash
curl http://localhost:3001/health
```

2. **Login (using seed data):**
```bash
curl -X POST http://localhost:3001/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@example.com","password":"password"}'
```

3. **Get Customers (with auth token):**
```bash
curl http://localhost:3001/api/v1/customers \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

## Database Management

### Reset Database
```bash
# Drop and recreate database
dropdb erp_business_db
createdb erp_business_db
npm run db:setup
```

### Manual Database Operations
```bash
# Connect to database
psql -d erp_business_db

# View tables
\dt

# View users
SELECT * FROM users;

# Exit
\q
```

## Troubleshooting

### Common Issues

1. **Database Connection Error:**
   - Ensure PostgreSQL is running
   - Check database credentials in `.env`
   - Verify database exists: `psql -l`

2. **Redis Connection Error:**
   - Ensure Redis is running: `redis-cli ping`
   - Check Redis configuration in `.env`

3. **Port Already in Use:**
   - Change PORT in `.env` file
   - Or kill process using the port: `lsof -ti:3001 | xargs kill`

4. **Permission Denied (PostgreSQL):**
   - Check PostgreSQL user permissions
   - Update DB_USER and DB_PASSWORD in `.env`

### Logs

Application logs are written to:
- Console (development)
- `logs/app.log` (all logs)
- `logs/error.log` (error logs only)

## Docker Development (Optional)

If you prefer using Docker:

```bash
# Start PostgreSQL and Redis
docker-compose up -d postgres redis

# Run the application
npm run dev
```

Create a `docker-compose.yml` file:
```yaml
version: '3.8'
services:
  postgres:
    image: postgres:13
    environment:
      POSTGRES_DB: erp_business_db
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: password
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data

  redis:
    image: redis:alpine
    ports:
      - "6379:6379"

volumes:
  postgres_data:
```