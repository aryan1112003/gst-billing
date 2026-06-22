# ERP Business Management - Frontend

A comprehensive ERP (Enterprise Resource Planning) business management system built with React Native, supporting iOS, Android, and Web platforms.

## Features

- **Dashboard**: Real-time business metrics and quick actions
- **Customer Management**: Complete customer lifecycle management
- **Inventory Management**: Stock tracking and low stock alerts
- **Invoice Management**: Create, track, and manage invoices
- **Vendor Management**: Supplier relationship management
- **Purchase Management**: Purchase order tracking
- **Payment Management**: Payment recording and allocation
- **Expense Management**: Business expense tracking and categorization
- **Reports**: Comprehensive business reporting
- **Settings**: User management and system configuration

## Technology Stack

- **React Native 0.72+** - Cross-platform mobile development
- **Expo** - Development platform and tools
- **TypeScript** - Type safety and better development experience
- **React Navigation 6** - Navigation and routing
- **Redux Toolkit** - State management
- **React Query** - Server state management
- **React Native Paper** - Material Design components
- **React Hook Form** - Form handling and validation

## Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn
- Expo CLI

### Installation

1. Install dependencies:
```bash
npm install
```

2. Start the development server:
```bash
npm start
```

3. Run on specific platforms:
```bash
# iOS
npm run ios

# Android
npm run android

# Web
npm run web
```

## Project Structure

```
src/
├── components/          # Reusable UI components
├── navigation/          # Navigation configuration
├── screens/            # Screen components
│   ├── Auth/           # Authentication screens
│   ├── Dashboard/      # Dashboard screens
│   ├── Customers/      # Customer management
│   ├── Inventory/      # Inventory management
│   ├── Invoices/       # Invoice management
│   ├── Vendors/        # Vendor management
│   ├── Purchases/      # Purchase management
│   ├── Payments/       # Payment management
│   ├── Expenses/       # Expense management
│   ├── Reports/        # Reporting screens
│   └── Settings/       # Settings screens
├── store/              # Redux store and slices
├── types/              # TypeScript type definitions
├── theme/              # Theme configuration
└── utils/              # Utility functions
```

## Responsive Design

The application is fully responsive and adapts to different screen sizes:

- **Mobile (< 480px)**: Single column layout, touch-optimized
- **Tablet (480px - 768px)**: Two-column layout where appropriate
- **Desktop (> 768px)**: Multi-column layout, optimized for larger screens

## Features Implementation Status

- ✅ Authentication (Login/Logout)
- ✅ Dashboard with metrics
- ✅ Customer Management (List, Detail, Form)
- ✅ Inventory Management (List, Detail, Form)
- ✅ Invoice Management (List, Detail, Form)
- ✅ Vendor Management (List, Detail, Form)
- ✅ Purchase Management (List, Detail, Form)
- ✅ Payment Management (List, Detail, Form)
- ✅ Expense Management (List, Detail, Form)
- ✅ Reports Screen
- ✅ Settings Screen
- ✅ Responsive Design
- ✅ Navigation Structure
- ✅ State Management

## Development

### Code Style

The project uses ESLint and Prettier for code formatting. Run:

```bash
npm run lint
```

### Testing

Run tests with:

```bash
npm test
```

## Building for Production

### Web
```bash
npm run build:web
```

### Mobile Apps
Use Expo Application Services (EAS) for building production apps:

```bash
# Install EAS CLI
npm install -g @expo/eas-cli

# Build for iOS
eas build --platform ios

# Build for Android
eas build --platform android
```

## Contributing

1. Follow the existing code structure and naming conventions
2. Ensure all components are responsive
3. Add proper TypeScript types
4. Test on multiple screen sizes
5. Update documentation as needed