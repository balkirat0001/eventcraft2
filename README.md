# EventCraft

EventCraft is an event management platform with role-based access for attendees, organizers, and admins.

## Features

- **Authentication**: Auth0 integration with JWT tokens for secure user management
- **Events**: Create, discover, manage, and register for events
- **Tickets**: Purchase and manage tickets with multiple types and pricing
- **Role-Based Access**: Different capabilities for attendees, organizers, and admins
- **Admin Controls**: Event approval workflow, user management, analytics

## Tech Stack

**Frontend**: React, Redux Toolkit, Tailwind CSS, Auth0 SDK  
**Backend**: Node.js, Express, JWT  
**Database**: MongoDB with Mongoose

## Architecture

```
[Frontend (React)] <--> [Backend API (Express)] <--> [MongoDB]
        |                        |
        v                        v
     [Auth0]             [External Services]
```

## How It Works

### Authentication Flow
1. User logs in via Auth0
2. Auth0 returns JWT tokens
3. Backend validates tokens and checks user in database
4. Role-based access enforced via middleware

### API Structure
- **/api/auth**: User authentication and profile management
- **/api/events**: Event CRUD operations and discovery
- **/api/tickets**: Ticket purchasing and management
- **/api/admin**: Admin-specific operations

### Database Models
- **User**: Profile, authentication, and role information
- **Event**: Event details, attendees, and approval status
- **Ticket**: Purchase records and check-in status

## Getting Started

1. Clone repository
2. Install dependencies (`npm install` in backend and frontend)
3. Configure Auth0 (see AUTH0_SETUP.md)
4. Set environment variables
5. Start servers:
   ```
   # Backend
   cd backend && npm run dev
   
   # Frontend
   cd frontend && npm run dev
   ```
6. Access at http://localhost:5173 