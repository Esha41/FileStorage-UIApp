# File Storage Client

A modern Angular 17 web application for managing file storage operations including upload, download, preview, and deletion. The application features a clean UI with toast notifications, authentication, and role-based access control.

## Table of Contents

- [Features](#features)
- [Prerequisites](#prerequisites)
- [Setup Steps](#setup-steps)
- [Running the Application](#running-the-application)
- [Architecture Overview](#architecture-overview)
- [Design Decisions](#design-decisions)
- [Known Limitations](#known-limitations)
- [Future Enhancements](#future-enhancements)

## Features

- Upload files with drag-and-drop support 
- Download files
- Preview files 
- Soft delete 
- Hard delete (permanent deletion - admin only)
- File listing (pagination and filteration)
- Toast notifications for all operations
- JWT-based authentication (Mock)
 - Role-based access control (admin/user)

## Prerequisites

- **Node.js** 18.x or higher
- **npm** 9.x or higher (or equivalent package manager)
- **Docker** and **Docker Compose** (for containerized deployment)
- **Backend API** running and accessible (default: `https://localhost:44356/api`)

## Setup Steps

### 1. Clone the Repository

```bash
git clone <https://github.com/Esha41/FileStorage-UIApp>
cd file-storage-client
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Configure Environment

The application uses environment files for configuration:

- **Development**: `src/environments/environment.ts`
- **Production**: `src/environments/environment.prod.ts`

Update the API URL in these files to match your backend:

```typescript
export const environment = {
  production: false,
  apiUrl: 'https://localhost:44356/api' // Development API URL
};
```

For production:
```typescript
export const environment = {
  production: true,
  apiUrl: 'http://localhost:8080/api' // Production/Docker API URL
};
```

## Running the Application

### Local Development

1. **Start the development server:**
   ```bash
   ng serve
   ```

2. **Access the application locally:**
   - Open your browser and navigate to `http://localhost:4200`


### Docker Deployment

#### Build and Run with Docker Compose

1. **Build and start the container:**
   ```bash
   docker-compose up --build
   ```

3. **Access the application:**
   - Open your browser and navigate to `http://localhost:4300`

4. **Stop the container:**
   ```bash
   docker-compose down
   ```

5. **View logs:**
   ```bash
   docker-compose logs -f filestorageuiapp
   ```


## Architecture Overview


### Application Structure

```
src/app/
├── core/                    # Core functionality
│   ├── auth.service.ts      # Authentication service
│   ├── config/              # Configuration
│   │   └── api.config.ts    # API endpoints configuration
│   ├── guards/              # Route guards
│   │   ├── auth.guard.ts    # Authentication guard
│   │   └── admin.guard.ts   # Admin role guard
│   ├── interceptors/        # HTTP interceptors
│   │   └── auth.interceptor.ts  # JWT token injection
│   └── login/               # Login component
├── shared/                   # Shared components and services
│   ├── components/
│   │   └── toast/           # Toast notification component
│   └── services/
│       └── toast.service.ts  # Toast notification service
└── storage/                  # File storage feature module
    ├── file-list/            # File list component
    ├── file-upload/          # File upload component
    ├── file-preview/         # File preview component
    ├── file.service.ts       # File service
    └── models/               # TypeScript interfaces
        └── file.model.ts     # File data models
```

### Key Architectural Patterns

1. **Standalone Components**: All components are standalone (Angular 17 feature), reducing bundle size and improving tree-shaking.

2. **Service-Based Architecture**: Business logic is encapsulated in services (FileService, AuthService, ToastService).

3. **Dependency Injection**: Leverages Angular's DI system for testability and maintainability.


### Authentication Flow

1. User logs in via `LoginComponent`
2. Admin and User credentials are mentioned in login screen for testing purpose


## Design Decisions

### 1. Environment-Based Configuration

**Decision**: Separate environment files for development and production.

**Rationale**:
- Allows different API endpoints for dev/prod
- Enables feature flags and environment-specific settings
- Follows Angular best practices

### 2. Toast Notification System

**Decision**: Custom toast notification service instead of third-party library.

**Rationale**:
- Lightweight and no external dependencies
- Easy to customize for project needs
- Reduces bundle size

### 3. Soft Delete vs Hard Delete

**Decision**: Implement both soft delete and hard delete (permanent, admin-only).

**Rationale**:
- Soft delete provides safety net for accidental deletions
- Hard delete allows permanent delete (admin privilege)

### 4. Pagination on Frontend

**Decision**: Implement pagination with backend support.

**Rationale**:
- Improves performance for large file lists
- Better user experience
- Scalable approach

## Known Limitations

- File size limit: client-side maximum is 200 MB per file.

- Large file uploads may timeout depending on network or server configuration.

- Token storage using localStorage or sessionStorage may be vulnerable to XSS.

- Pagination is fixed at 10 items per page.


## Future Enhancements

- Support more file types for file preview.

- Generate thumbnails for files.

- Add dark mode support.

- Introduce file versioning.

- Add token refresh mechanism for authentication.

- Allow file comments and annotations.

- Support collaborative editing of files.

- Integrate with third-party storage providers like S3 or Azure Blobs

