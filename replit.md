# PlantViz - Plant Visualizer

## Overview

PlantViz is a full-stack web application that serves as a comprehensive plant database and garden design tool. The application allows users to explore plants with detailed care information, filter by various criteria, and use an interactive garden designer to visualize plant arrangements.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React with TypeScript
- **Routing**: Wouter for client-side routing
- **State Management**: TanStack Query (React Query) for server state management
- **Styling**: Tailwind CSS with shadcn/ui component library
- **Build Tool**: Vite for development and build processes

### Backend Architecture
- **Runtime**: Node.js with Express.js
- **Language**: TypeScript with ES modules
- **API Style**: RESTful API endpoints
- **Development**: tsx for TypeScript execution in development

### Database Architecture
- **Database**: PostgreSQL (configured for Neon serverless)
- **ORM**: Drizzle ORM for type-safe database operations
- **Schema Management**: Drizzle Kit for migrations and schema management
- **Connection**: Neon serverless driver with WebSocket support

## Key Components

### Data Models
- **Plants**: Core entity with properties like name, scientific name, description, care requirements, and images
- **Grow Zones**: Separate table for plant hardiness zones (many-to-many relationship with plants)
- **Users**: Basic user authentication structure (currently unused in UI)

### Frontend Components
- **PlantGrid**: Main display component for plant listings with sorting and filtering
- **PlantCard**: Individual plant display cards with key information
- **PlantDetailModal**: Detailed view of individual plants with full care instructions
- **PlantSidebar**: Filter controls for light levels, water needs, difficulty, and grow zones
- **GardenDesignerPanel**: Interactive canvas for designing garden layouts with drag-and-drop plant placement

### API Endpoints
- `GET /api/plants` - Retrieve plants with optional filtering and sorting
- `GET /api/plants/:id` - Retrieve individual plant details
- `POST /api/plants` - Create new plants (admin functionality)

## Data Flow

1. **Plant Data Loading**: Application fetches plant data from the backend API using React Query
2. **Filtering**: User interactions with sidebar filters update query parameters and trigger new API requests
3. **Search**: Real-time search functionality filters plants by name, scientific name, or description
4. **Plant Selection**: Users can view detailed plant information in modals and add plants to their garden design
5. **Garden Design**: Selected plants can be placed and arranged on an interactive canvas with drag-and-drop functionality

## External Dependencies

### Backend Dependencies
- **@neondatabase/serverless**: Neon PostgreSQL serverless driver
- **drizzle-orm**: Type-safe ORM for database operations
- **express**: Web framework for API endpoints
- **connect-pg-simple**: PostgreSQL session store (for future session management)

### Frontend Dependencies
- **@radix-ui/***: Comprehensive UI component primitives
- **@tanstack/react-query**: Server state management and caching
- **tailwindcss**: Utility-first CSS framework
- **wouter**: Lightweight client-side routing
- **date-fns**: Date manipulation utilities
- **embla-carousel-react**: Carousel component functionality

### Development Dependencies
- **vite**: Build tool and development server
- **tsx**: TypeScript execution for Node.js
- **@replit/vite-plugin-***: Replit-specific development tools

## Deployment Strategy

### Development
- Uses Vite dev server for frontend hot reloading
- tsx for running TypeScript backend with hot reload
- Environment variable `DATABASE_URL` required for database connection

### Production Build
1. Frontend builds to `dist/public` directory using Vite
2. Backend compiles to `dist/index.js` using esbuild
3. Production server serves static files and API endpoints from single Node.js process

### Database Management
- Schema defined in `shared/schema.ts` for type sharing between frontend and backend
- Migrations managed through Drizzle Kit
- Database seeding with garden plant data from reputable sources (High Line, Proven Winners, Bluestone Perennials)

### Architecture Decisions

**Monorepo Structure**: Chose to keep frontend (`client/`), backend (`server/`), and shared code (`shared/`) in a single repository for easier development and type sharing.

**Drizzle ORM**: Selected over Prisma for lighter weight, better TypeScript integration, and more direct SQL control while maintaining type safety.

**Neon Serverless**: Chosen for PostgreSQL hosting due to serverless scaling, development-friendly features, and compatibility with edge deployment.

**shadcn/ui + Tailwind**: Provides a comprehensive, customizable component system with excellent developer experience and consistent design patterns.

**React Query**: Handles complex server state management, caching, and synchronization with minimal boilerplate compared to Redux or other state management solutions.