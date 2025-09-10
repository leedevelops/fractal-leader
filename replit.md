# Fractal Leader - Leadership Development SaaS Platform

## Overview

Fractal Leader is a spiritual-tech leadership development SaaS application that translates the Pattern Manifesto—a fractal matrix rooted in the six days of creation from Genesis—into a comprehensive platform for modern leaders. The application maps users to Biblical archetypes and generations, providing personalized development paths through sacred frequency meditations, team formation tools, and progress tracking aligned with divine patterns.

The platform serves as a bridge between ancient wisdom and contemporary leadership challenges, offering a unique approach to personal and organizational development through the lens of fractal patterns found throughout creation.

## Recent Changes

### January 2025 - Refined 25 Fractal Tiers Framework  
- **Updated Messaging**: Refined from "25 Fractal Levels + The Pattern (Jesus) + The Reproduction (Paul)" to "25 Fractal Tiers: The Pattern (Christ) & The Ripple (Paul)"
- **Chaos Detection**: Each tier represents decision-making complexity with mathematical chaos alerts (branching factor <2.5)
- **Pattern Alignment**: The Pattern (Christ) scores team alignment against optimal fractal dimension (2.8)
- **Ripple Analysis**: The Ripple (Paul) measures how leadership decisions cascade through organizational networks
- **Backend Integration**: Flask endpoints for `/fractal_scan`, `/pattern`, and `/tiers` with real-time team analysis

### January 2025 - Claude AI Integration
- **AI Biblical Coach**: Integrated Claude Sonnet 4 for personalized biblical leadership guidance
- **Chat Interface**: Real-time messaging with archetype-aware responses and conversation history
- **Reflection Questions**: Dynamic generation of archetype-specific reflection questions
- **Navigation Enhancement**: Added AI Coach to user menu for easy access
- **Backend API**: New `/api/chat` and `/api/reflection-questions` endpoints with authentication

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
The client is built with **React** and **TypeScript**, utilizing modern component patterns and hooks for state management. The UI framework is **shadcn/ui** with **Radix UI** primitives, providing a consistent design system with dark theme support and Hebrew typography integration.

**Key Frontend Components:**
- **AI Biblical Coach Interface**: Real-time chat with Claude AI for personalized biblical leadership guidance
- **Fractal Visualization Engine**: Uses D3.js to generate dynamic fractal patterns based on Hebrew name conversion and Gematria calculations
- **Assessment System**: Multi-stage questionnaires that map users to Biblical archetypes (Pioneer, Organizer, Builder, Guardian)
- **Frequency Meditation Module**: Web Audio API integration for sacred frequency generation (260Hz, 396Hz, 528Hz, etc.)
- **Team Formation Interface**: Cross-generational team management with generational adaptation algorithms
- **Progress Tracking Dashboard**: Visual progress indicators through R1-R5 development stages plus "Hidden Track"

**Styling & Theming:**
- Tailwind CSS with custom cosmic color palette
- Hebrew font integration (David Libre) for authentic typography
- CSS custom properties for dynamic theming
- Responsive design with mobile-first approach

### Backend Architecture
The server is built with **Express.js** and **TypeScript**, following RESTful API patterns with comprehensive middleware for authentication, logging, and error handling.

**Authentication System:**
- **Replit Auth** integration using OpenID Connect
- Session management with PostgreSQL-backed storage
- Mandatory user operations for Replit compatibility

**API Structure:**
- User management endpoints (`/api/auth/*`)
- AI Chat and guidance endpoints (`/api/chat`, `/api/reflection-questions`)
- Organization and team management (`/api/organizations`, `/api/teams`)
- Assessment and progress tracking (`/api/assessments`, `/api/progress`)
- Subscription management with Stripe integration
- Daily practice logging and metrics

### Data Storage Architecture
**Primary Database**: PostgreSQL with **Drizzle ORM** for type-safe database operations and schema management.

**Database Schema Design:**
- **Users Table**: Core user data with Hebrew names, generational mapping, and archetype assignments
- **Organizations & Teams**: Hierarchical structure supporting church, remote team, and SMB contexts
- **Assessments**: Structured storage for multi-stage development evaluations
- **Daily Practices**: Time-series data for habit tracking and progress metrics
- **Sessions Table**: Required for Replit Auth session persistence

**Enums & Type Safety:**
- Generation types (Gen Z, Millennial, Gen X, Boomer)
- Organization types (Church, Remote Team, SMB)
- Development stages (R1-R5, Hidden Track)
- Subscription tiers (Seeker, Pioneer, Visionary)
- Biblical archetypes (Pioneer, Organizer, Builder, Guardian)

### External Dependencies

**AI & Machine Learning:**
- **Anthropic Claude API** (Sonnet 4) for biblical leadership coaching and guidance
- Archetype-aware conversation system with Pattern Manifesto integration
- Reflection question generation based on user archetypes

**Payment Processing:**
- **Stripe** integration for subscription management
- Multiple tier support (Seeker/Free, Pioneer/$45, Visionary/$99)
- Webhook handling for subscription lifecycle events

**Database Infrastructure:**
- **Neon Database** (PostgreSQL) for production data storage
- Connection pooling and serverless compatibility
- Automatic migrations via Drizzle Kit

**Development & Deployment:**
- **Replit** environment integration with development banner and cartographer
- **Vite** for fast development and optimized production builds
- **Vercel**-compatible deployment structure

**Audio & Visualization Libraries:**
- **Web Audio API** for frequency meditation generation
- **D3.js** for fractal pattern visualization
- **Hebrew transliteration** libraries for name conversion

**UI & Component Libraries:**
- **Radix UI** primitives for accessible components
- **React Hook Form** with Zod validation
- **TanStack Query** for server state management
- **Wouter** for lightweight routing

**Font & Typography:**
- Google Fonts integration (Inter, David Libre, Crimson Text)
- Hebrew typography support
- Mystical font styling for thematic consistency

The application is designed as a full-stack TypeScript solution with strong type safety, comprehensive error handling, and scalable architecture patterns supporting the unique requirements of spiritual leadership development in modern organizational contexts.