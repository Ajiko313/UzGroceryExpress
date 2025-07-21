# Grocery Delivery Platform

## Overview

This is a comprehensive grocery delivery platform built for Telegram Mini Apps with a separate admin web application. The system includes customer ordering, delivery agent management, real-time tracking, payment integration (Payme.uz, Click.uz), and a complete admin dashboard for store management.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React with TypeScript
- **Styling**: Tailwind CSS with shadcn/ui component library
- **Routing**: Wouter for lightweight client-side routing
- **State Management**: TanStack Query for server state management
- **Build Tool**: Vite for development and bundling

### Backend Architecture
- **Runtime**: Node.js with Express.js
- **Database ORM**: Drizzle ORM with PostgreSQL
- **Database Provider**: Neon Database (serverless PostgreSQL)
- **API Design**: RESTful API with Express routes
- **Session Management**: PostgreSQL-backed sessions using connect-pg-simple

### Mobile Integration
- **Platform**: Telegram Mini App integration
- **Features**: Haptic feedback, native UI components, WebApp API integration
- **Responsive Design**: Mobile-first approach optimized for Telegram's WebView

## Key Components

### Database Schema
The application uses a multi-table PostgreSQL schema:
- **Users**: Customer and delivery agent profiles with Telegram integration
- **Categories & Products**: Hierarchical product catalog with multilingual support (Uzbek, Russian, English)
- **Orders & Order Items**: Complete order management with status tracking
- **Addresses**: Customer delivery addresses with geolocation support
- **Cart Items**: Shopping cart persistence
- **Delivery Assignments**: Driver assignment and tracking system

### Frontend Components
- **Product Catalog**: Category-based browsing with search functionality
- **Shopping Cart**: Real-time cart management with quantity controls
- **Order Tracking**: Live order status updates with delivery progress
- **Delivery Dashboard**: Dedicated interface for delivery agents
- **Payment Integration**: Support for multiple payment methods (cash, Telegram Pay, PayMe, Click)

### Authentication & Authorization
- **Telegram Integration**: Uses Telegram WebApp user data for authentication
- **Role-based Access**: Customer and delivery agent role separation
- **Session Management**: Secure session handling with PostgreSQL storage

## Data Flow

### Customer Journey
1. **Product Discovery**: Browse categories → view products → search functionality
2. **Cart Management**: Add items → adjust quantities → view totals
3. **Checkout Process**: Enter delivery address → select payment method → confirm order
4. **Order Tracking**: Real-time status updates → delivery agent contact → completion

### Delivery Agent Workflow
1. **Authentication**: Login via dedicated delivery portal
2. **Order Assignment**: View assigned orders → accept/reject assignments
3. **Delivery Management**: Update order status → navigate to customer → complete delivery
4. **Earnings Tracking**: View daily/weekly/monthly earnings and statistics

### Real-time Updates
- Order status changes trigger UI updates
- Delivery progress tracking
- Cart synchronization across sessions

## External Dependencies

### Core Dependencies
- **@neondatabase/serverless**: Serverless PostgreSQL database connection
- **drizzle-orm**: Type-safe database ORM
- **@tanstack/react-query**: Server state management and caching
- **@radix-ui/***: Accessible UI component primitives
- **react-hook-form**: Form state management and validation
- **zod**: Runtime type validation and schema definition

### Telegram Integration
- **Telegram WebApp API**: Native mobile app integration
- **Haptic Feedback**: Enhanced user experience
- **Theme Integration**: Automatic light/dark mode based on Telegram settings

### Development Tools
- **TypeScript**: Type safety and developer experience
- **Vite**: Fast development server and build tool
- **ESBuild**: Production bundling for server code
- **Tailwind CSS**: Utility-first styling approach

## Deployment Strategy

### Development Environment
- **Server**: Node.js development server with hot reloading
- **Client**: Vite development server with HMR
- **Database**: Neon serverless PostgreSQL with migration support

### Production Build
- **Client**: Static build output served from Express
- **Server**: Bundled Node.js application using ESBuild
- **Database**: Production Neon database with connection pooling
- **Asset Serving**: Express static file serving for client assets

### Environment Configuration
- **DATABASE_URL**: PostgreSQL connection string
- **NODE_ENV**: Environment-specific configuration
- **Session Management**: Secure session configuration for production

## Recent Changes

### January 21, 2025 - Complete Migration & Bot Integration
- **Database Migration**: ✅ Successfully migrated to user's custom Supabase PostgreSQL database (postgresql://postgres.yzfhiubqqkhrbqbhcjps@aws-0-eu-north-1.pooler.supabase.com:6543/postgres)
- **Telegram Bot Integration**: ✅ Complete Telegram Mini App bot setup with token 8040655774:AAHIVroG9bAmyKjv4P48IOqZRfJIzaVytXs
  - Mini App commands: /start (opens marketplace), /admin (admin panel), /orders (order tracking)
  - Webhook endpoint configured for real-time message handling
  - Automatic user registration and authentication through Telegram
- **Admin Access**: ✅ User granted full admin privileges (Telegram ID: 5155574276)
  - Complete CRUD operations for categories, products, orders, users
  - Special offers management and notification broadcasting
  - Admin login endpoint functional with successful authentication
- **API Enhancement**: Added comprehensive admin routes for full system control
  - User management (create, update, deactivate)
  - Order status management and delivery assignments
  - Special offers and notifications CRUD operations
- **TypeScript Fixes**: Resolved all LSP diagnostics and compilation errors
- **Environment Configuration**: Complete .env setup with database and bot credentials

### User Preferences  
- Prefers 2-column product grid layout for main page
- Categories should be horizontal scrollable tabs with minimized pictures (40px x 40px)
- Categories should always be visible and under admin control
- Category images should persist during filtering and sorting operations

### Architecture Updates
- Added `server/telegram.ts` for Telegram bot functionality
- Created `useTelegramAuth` hook for automatic authentication
- Enhanced database schema with proper notification and special offer tables
- Implemented real-time notification broadcasting to Telegram users

The application is designed to be deployed as a unified Express.js application serving both the API and static frontend assets, optimized for platforms like Replit, Heroku, or similar Node.js hosting providers.