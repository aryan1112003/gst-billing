# ERP Business Management - Backend API

A comprehensive RESTful API for the ERP Business Management System built with Node.js, Express, TypeScript, PostgreSQL, and Redis.

## Features

- **Authentication & Authorization**: JWT-based auth with role-based access control
- **Customer Management**: Complete customer lifecycle management
- **Inventory Management**: Stock tracking and management
- **Invoice Management**: Invoice creation, tracking, and payment status
- **Vendor Management**: Supplier relationship management
- **Purchase Management**: Purchase order tracking
- **Payment Management**: Payment recording and allocation
- **Expense Management**: Business expense tracking
- **Reporting**: Comprehensive business reports and analytics
- **Audit Logging**: Complete audit trail for all operations
- **Health Monitoring**: System health checks and monitoring

## Technology Stack

- **Node.js 18+** - Runtime environment
- **Express.js** - Web framework
- **TypeScript** - Type safety and better development experience
- **PostgreSQL** - Primary database
- **Redis** - Caching and session management
- **JWT** - Authentication tokens
- **bcryptjs** - Password hashing
- **Winston** - Logging
- **Helmet** - Security middleware
- **CORS** - Cross-origin resource sharing
- **Rate Limiting** - API rate limiting

## Getting Started

### Prerequisites

- Node.js 18+
- PostgreSQL 12+
- Redis 6+
- npm or yarn

### Installation

1. Install dependencies:
```bash
npm install
```

2. Set up environment variables:
```bash
cp .env.example .env
# Edit .env with your configuration
```

3. Set up the database (automated):
```bash
# This will create schema and insert seed data
npm run db:setup
```

Or manually:
```bash
# Create PostgreSQL database
createdb erp_business_db

# Run database schema
npm run db:schema

# Insert seed data (optional)
npm run db:seed
```

4. Start Redis server:
```bash
redis-server
```

5. Start the development server:
```bash
npm run dev
```

### Default Users

After running the database setup, you can login with these default users:

- **Admin**: admin@example.com / password
- **Accountant**: accountant@example.com / password  
- **Sales**: sales@example.com / password

## API Endpoints

### Authentication
- `POST /api/v1/auth/login` - User login
- `POST /api/v1/auth/refresh` - Refresh access token
- `POST /api/v1/auth/logout` - User logout
- `GET /api/v1/auth/me` - Get current user

### Customers
- `GET /api/v1/customers` - List customers
- `GET /api/v1/customers/:id` - Get customer by ID
- `POST /api/v1/customers` - Create customer
- `PUT /api/v1/customers/:id` - Update customer
- `DELETE /api/v1/customers/:id` - Delete customer

### Items/Inventory
- `GET /api/v1/items` - List items
- `GET /api/v1/items/:id` - Get item by ID
- `POST /api/v1/items` - Create item
- `PUT /api/v1/items/:id` - Update item
- `DELETE /api/v1/items/:id` - Delete item

### Invoices
- `GET /api/v1/invoices` - List invoices
- `GET /api/v1/invoices/:id` - Get invoice by ID
- `POST /api/v1/invoices` - Create invoice
- `PUT /api/v1/invoices/:id` - Update invoice
- `DELETE /api/v1/invoices/:id` - Delete invoice

### Vendors
- `GET /api/v1/vendors` - List vendors
- `GET /api/v1/vendors/:id` - Get vendor by ID
- `POST /api/v1/vendors` - Create vendor
- `PUT /api/v1/vendors/:id` - Update vendor
- `DELETE /api/v1/vendors/:id` - Delete vendor

### Purchases
- `GET /api/v1/purchases` - List purchases
- `GET /api/v1/purchases/:id` - Get purchase by ID
- `POST /api/v1/purchases` - Create purchase
- `PUT /api/v1/purchases/:id` - Update purchase
- `DELETE /api/v1/purchases/:id` - Delete purchase

### Payments
- `GET /api/v1/payments` - List payments
- `GET /api/v1/payments/:id` - Get payment by ID
- `POST /api/v1/payments` - Create payment
- `PUT /api/v1/payments/:id` - Update payment
- `DELETE /api/v1/payments/:id` - Delete payment

### Expenses
- `GET /api/v1/expenses` - List expenses
- `GET /api/v1/expenses/:id` - Get expense by ID
- `POST /api/v1/expenses` - Create expense
- `PUT /api/v1/expenses/:id` - Update expense
- `DELETE /api/v1/expenses/:id` - Delete expense

### Reports
- `GET /api/v1/reports/sales` - Sales reports
- `GET /api/v1/reports/receivables` - Receivables reports
- `GET /api/v1/reports/expenses` - Expense reports
- `GET /api/v1/reports/dashboard` - Dashboard metrics

### Health Check
- `GET /health` - System health check

## Project Structure

```
src/
├── config/              # Configuration files
│   ├── index.ts         # Main configuration
│   ├── database.ts      # Database configuration
│   └── logger.ts        # Logging configuration
├── controllers/         # Route controllers (to be implemented)
├── middleware/          # Express middleware
│   ├── auth.ts          # Authentication middleware
│   ├── errorHandler.ts  # Error handling middleware
│   └── notFoundHandler.ts # 404 handler
├── models/              # Data models (to be implemented)
├── routes/              # API routes
│   ├── auth.ts          # Authentication routes
│   ├── customers.ts     # Customer routes
│   ├── items.ts         # Item routes
│   ├── invoices.ts      # Invoice routes
│   ├── vendors.ts       # Vendor routes
│   ├── purchases.ts     # Purchase routes
│   ├── payments.ts      # Payment routes
│   ├── expenses.ts      # Expense routes
│   ├── reports.ts       # Report routes
│   └── health.ts        # Health check routes
├── services/            # Business logic services (to be implemented)
├── utils/               # Utility functions (to be implemented)
├── types/               # TypeScript type definitions (to be implemented)
├── database/            # Database related files
│   └── schema.sql       # Database schema
└── server.ts            # Main server file
```

## Environment Variables

See `.env.example` for all available environment variables.

## Security Features

- **Helmet**: Security headers
- **CORS**: Cross-origin resource sharing configuration
- **Rate Limiting**: API rate limiting to prevent abuse
- **JWT Authentication**: Secure token-based authentication
- **Password Hashing**: bcrypt for secure password storage
- **Input Validation**: Request validation and sanitization
- **Audit Logging**: Complete audit trail for all operations

## Development

### Scripts

- `npm run dev` - Start development server with hot reload
- `npm run build` - Build for production
- `npm start` - Start production server
- `npm test` - Run tests
- `npm run lint` - Run ESLint
- `npm run lint:fix` - Fix ESLint errors

### Database Management

The database schema is located in `src/database/schema.sql`. To apply schema changes:

```bash
psql -d erp_business_db -f src/database/schema.sql
```

### Logging

Logs are written to:
- Console (development)
- `logs/app.log` (all logs)
- `logs/error.log` (error logs only)

## Deployment

1. Build the application:
```bash
npm run build
```

2. Set production environment variables

3. Start the production server:
```bash
npm start
```

## Contributing

1. Follow TypeScript and ESLint configurations
2. Write tests for new features
3. Update documentation as needed
4. Follow the existing code structure and patterns

## License

MIT License