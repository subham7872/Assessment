# Real-Time Collaborative Project Management Platform

A production-grade, multi-user project and task management platform built with Node.js, Express, React, MongoDB Atlas, Socket.io, and Cloudinary.

---

## Table of Contents
- [Overview](#overview)
- [Features](#features)
- [System Architecture](#system-architecture)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Authentication & Session Strategy](#authentication--session-strategy)
- [Role-Based Access Control (RBAC)](#role-based-access-control-rbac)
- [Real-Time Socket Architecture](#real-time-socket-architecture)
- [API Documentation](#api-documentation)
- [File Upload System](#file-upload-system)
- [Environment Variables](#environment-variables)
- [Local Development Setup](#local-development-setup)
- [Testing](#testing)
- [Deployment Guide](#deployment-guide)
- [Live URLs](#live-urls)
- [Technical Trade-offs & Future Enhancements](#technical-trade-offs--future-enhancements)

---

## Overview

The **Real-Time Collaborative Project Management Platform** enables distributed teams to manage projects, create and assign tasks, upload media attachments, track detailed audit activity logs, and collaborate live with instant socket-driven updates and presence indicators.

---

## Features

- **Authentication & Security**: JWT Access Tokens (15-minute expiry in memory) + Refresh Tokens (7-day expiry in `httpOnly` cookies) with single-queue 401 refresh interceptor, bcrypt password hashing (12 rounds), rate limiting, Helmet, and CORS protection.
- **Project Management**: Multi-user workspaces, invite system with tokenized expiration, member role management, and project archiving.
- **Task Management & Kanban**: 4 status columns (`To Do`, `In Progress`, `In Review`, `Completed`), priority tags (`Low`, `Medium`, `High`, `Critical`), assignees, due dates, debounced title search, filtering, and sorting.
- **Bulk Task Operations**: Bulk status changes, bulk assignments, and bulk deletion with validation (max 50 tasks per bulk request).
- **Real-Time Collaboration**: Instant socket room sync for task CRUD, file uploads, member changes, and live presence indicators (*"John is viewing this task"*, *"Sarah is editing..."*).
- **File Uploads**: Cloudinary integration for task attachments (JPEG, PNG, WebP, PDF up to 5MB) with automatic Cloudinary cleanup fallback if database updates fail.
- **Activity Audit Log**: Detailed audit log capturing all project, task, member, and file mutations with pagination.

---

## System Architecture

```
Client (React + Vite + Zustand)
       │
       ├── HTTP / REST API (Axios + Cookies) ──► Node.js / Express Server ──► MongoDB Atlas
       │                                              │
       ├── Socket.io Client ◄── WebSockets ───────────┤ (Room Manager)
       │                                              │
       └── Direct Stream Upload ─────────────────────► Cloudinary CDN
```

### Layered Architecture
- **Controllers**: Handle HTTP request parsing, response formatting via `ApiResponse`, and error delegation to `asyncHandler`.
- **Services**: Contain business logic, authorization rules, socket event emissions, and database transactions.
- **Repositories**: Abstrate database operations using Mongoose query optimization (`.lean()`, lean populates).
- **Socket Manager**: Manages WebSocket lifecycle, JWT handshake verification, project room join/leave (`project:${projectId}`), and presence indicators.

---

## Tech Stack

### Backend
- **Runtime**: Node.js
- **Framework**: Express.js
- **Database**: MongoDB Atlas with Mongoose ORM
- **Real-Time Engine**: Socket.io
- **Authentication**: JSON Web Tokens (`jsonwebtoken`), `bcryptjs`, `cookie-parser`
- **File Storage**: Multer + Cloudinary SDK (`cloudinary`)
- **Security & Rate Limiting**: `helmet`, `cors`, `express-rate-limit`
- **Testing**: Jest + Supertest

### Frontend
- **Framework**: React 18 + Vite
- **State Management**: Zustand (In-memory token & app stores)
- **Routing**: React Router DOM v6
- **HTTP Client**: Axios (Response Interceptors for 401 token refresh queue)
- **Real-Time Client**: `socket.io-client`
- **Form Management**: React Hook Form
- **UI & Icons**: Tailwind CSS + Lucide React + React Hot Toast

---

## Project Structure

```text
/
├── client/
│   ├── public/
│   ├── src/
│   │   ├── api/
│   │   │   ├── axios.js
│   │   │   ├── authApi.js
│   │   │   ├── projectApi.js
│   │   │   ├── taskApi.js
│   │   │   ├── fileApi.js
│   │   │   └── activityApi.js
│   │   ├── components/
│   │   │   ├── activity/
│   │   │   ├── common/
│   │   │   ├── layout/
│   │   │   ├── members/
│   │   │   ├── projects/
│   │   │   └── tasks/
│   │   ├── hooks/
│   │   │   ├── useAuth.js
│   │   │   └── useProjectSocket.js
│   │   ├── pages/
│   │   │   ├── AcceptInvite.jsx
│   │   │   ├── ForgotPassword.jsx
│   │   │   ├── Login.jsx
│   │   │   ├── NotFound.jsx
│   │   │   ├── ProjectDetails.jsx
│   │   │   ├── Projects.jsx
│   │   │   ├── Register.jsx
│   │   │   └── ResetPassword.jsx
│   │   ├── routes/
│   │   │   ├── AppRoutes.jsx
│   │   │   └── ProtectedRoute.jsx
│   │   ├── socket/
│   │   │   └── socket.js
│   │   ├── store/
│   │   │   ├── authStore.js
│   │   │   ├── projectStore.js
│   │   │   ├── taskStore.js
│   │   │   └── uiStore.js
│   │   ├── utils/
│   │   │   ├── constants.js
│   │   │   └── formatters.js
│   │   ├── App.jsx
│   │   ├── index.css
│   │   └── main.jsx
│   ├── .env.example
│   ├── index.html
│   ├── package.json
│   ├── postcss.config.js
│   ├── tailwind.config.js
│   └── vite.config.js
├── server/
│   ├── src/
│   │   ├── config/
│   │   │   ├── cloudinary.js
│   │   │   ├── db.js
│   │   │   └── multer.js
│   │   ├── controllers/
│   │   │   ├── authController.js
│   │   │   ├── fileController.js
│   │   │   ├── projectController.js
│   │   │   └── taskController.js
│   │   ├── middleware/
│   │   │   ├── auth.js
│   │   │   ├── errorHandler.js
│   │   │   ├── projectAccess.js
│   │   │   ├── rateLimiter.js
│   │   │   ├── rbac.js
│   │   │   └── validate.js
│   │   ├── models/
│   │   │   ├── ActivityLog.js
│   │   │   ├── Project.js
│   │   │   ├── Task.js
│   │   │   └── User.js
│   │   ├── repositories/
│   │   │   ├── activityRepository.js
│   │   │   ├── projectRepository.js
│   │   │   ├── taskRepository.js
│   │   │   └── userRepository.js
│   │   ├── routes/
│   │   │   ├── authRoutes.js
│   │   │   ├── fileRoutes.js
│   │   │   ├── index.js
│   │   │   ├── projectRoutes.js
│   │   │   └── taskRoutes.js
│   │   ├── services/
│   │   │   ├── activityService.js
│   │   │   ├── authService.js
│   │   │   ├── fileService.js
│   │   │   ├── projectService.js
│   │   │   └── taskService.js
│   │   ├── socket/
│   │   │   ├── index.js
│   │   │   └── roomManager.js
│   │   └── utils/
│   │       ├── ApiResponse.js
│   │       ├── AppError.js
│   │       ├── asyncHandler.js
│   │       ├── cloudinaryUpload.js
│   │       ├── emailUtils.js
│   │       ├── logger.js
│   │       └── tokenUtils.js
│   ├── tests/
│   │   ├── auth.test.js
│   │   ├── files_socket.test.js
│   │   ├── health.test.js
│   │   ├── projects_tasks.test.js
│   │   └── socket.test.js
│   ├── .env.example
│   ├── package.json
│   └── server.js
├── .gitignore
├── README.md
└── SUBMISSION.md
```

---

## Authentication & Session Strategy

- **Access Token**: Short-lived (15 minutes), signed with `ACCESS_TOKEN_SECRET`. Stored exclusively in frontend memory (`authStore`). NEVER saved in `localStorage` or `sessionStorage`.
- **Refresh Token**: Long-lived (7 days), signed with `REFRESH_TOKEN_SECRET`. Stored in an `httpOnly`, `secure`, `sameSite` cookie.
- **Single Refresh Queue**: If an access token expires while multiple API calls fire concurrently, Axios intercepts the first 401, queues subsequent requests, calls `/auth/refresh-token`, updates the in-memory access token, and retries the failed requests seamlessly.

---

## Role-Based Access Control (RBAC)

Project membership grants one of three hierarchical roles:

| Action / Feature | Project Admin | Member | Viewer |
| :--- | :---: | :---: | :---: |
| Read Project, Tasks, Members & Activity | Yes | Yes | Yes |
| Create & Edit Tasks | Yes | Yes | No |
| Change Task Status | Yes | Yes | No |
| Delete Task | Yes | No | No |
| Bulk Task Status & Assignment | Yes | Yes | No |
| Bulk Task Deletion | Yes | No | No |
| Upload File Attachment | Yes | Yes | No |
| Delete Own Attachment | Yes | Yes | No |
| Delete Other Member's Attachment | Yes | No | No |
| Invite Members & Change Roles | Yes | No | No |
| Remove Members | Yes | Self Only | No |
| Archive Project | Owner Only | No | No |

---

## Real-Time Socket Architecture

### Connection Handshake
Clients connect to Socket.io sending the JWT access token in `socket.handshake.auth.token`.

### Project Room Scoping
- `project:join`: Verifies project membership before adding socket to room `project:${projectId}`.
- `project:leave`: Removes socket from `project:${projectId}`.

### Dispatched Socket Events
- **Tasks**: `task:created`, `task:updated`, `task:deleted`, `task:bulk_updated`, `task:bulk_deleted`.
- **Files**: `file:uploaded`, `file:deleted`.
- **Project**: `project:updated`, `project:archived`, `project:member_added`, `project:member_removed`, `project:member_role_changed`.
- **Presence**: `user:viewing`, `user:editing`, `user:stopped_editing`, `user:offline`.

---

## API Documentation

Base URL: `/api/v1`

### Authentication Routes (`/api/v1/auth`)
| Method | Endpoint | Auth | Description |
| :--- | :--- | :---: | :--- |
| `POST` | `/auth/register` | None | Registers a new user (`name`, `email`, `password`) |
| `POST` | `/auth/login` | None | Authenticates user and sets `httpOnly` refresh cookie |
| `POST` | `/auth/logout` | Bearer | Revokes refresh token and clears cookie |
| `POST` | `/auth/refresh-token` | Cookie | Exchanges valid refresh cookie for new access token |
| `GET` | `/auth/me` | Bearer | Returns current authenticated user |
| `POST` | `/auth/forgot-password` | None | Triggers password reset link |
| `POST` | `/auth/reset-password/:token` | None | Resets password and clears active refresh sessions |

### Project Routes (`/api/v1/projects`)
| Method | Endpoint | Auth | Description |
| :--- | :--- | :---: | :--- |
| `GET` | `/projects` | Bearer | Lists user's project workspaces |
| `POST` | `/projects` | Bearer | Creates new project (creator becomes owner & admin) |
| `GET` | `/projects/:projectId` | Member | Fetches project details and member list |
| `PATCH` | `/projects/:projectId` | Admin | Updates project name/description |
| `PATCH` | `/projects/:projectId/archive` | Owner | Archives project workspace |
| `POST` | `/projects/:projectId/invite` | Admin | Sends tokenized project invite |
| `POST` | `/projects/invite/:token/accept` | Bearer | Accepts invitation link |
| `DELETE` | `/projects/:projectId/members/:userId` | Admin/Self | Removes member from project |
| `PATCH` | `/projects/:projectId/members/:userId/role` | Admin | Updates member role |
| `GET` | `/projects/:projectId/activity` | Member | Returns paginated activity log |

### Task Routes (`/api/v1/projects/:projectId/tasks`)
| Method | Endpoint | Auth | Description |
| :--- | :--- | :---: | :--- |
| `GET` | `/projects/:projectId/tasks` | Member | Fetches tasks with filter, search, sort, pagination |
| `POST` | `/projects/:projectId/tasks` | Member | Creates a new task |
| `GET` | `/projects/:projectId/tasks/:taskId` | Member | Fetches single task details |
| `PATCH` | `/projects/:projectId/tasks/:taskId` | Member | Updates task details/status |
| `DELETE` | `/projects/:projectId/tasks/:taskId` | Admin | Deletes task |
| `POST` | `/projects/:projectId/tasks/bulk/status` | Member | Bulk updates task status (max 50) |
| `POST` | `/projects/:projectId/tasks/bulk/assign` | Member | Bulk assigns tasks (max 50) |
| `DELETE` | `/projects/:projectId/tasks/bulk` | Admin | Bulk deletes tasks (max 50) |

### Attachment Routes (`/api/v1/projects/:projectId/tasks/:taskId/attachments`)
| Method | Endpoint | Auth | Description |
| :--- | :--- | :---: | :--- |
| `POST` | `.../attachments` | Member | Uploads multipart file attachment to Cloudinary |
| `DELETE` | `.../attachments/:attachmentId` | Uploader/Admin | Deletes attachment and Cloudinary asset |

---

## File Upload System

- **Storage**: Cloudinary CDN (no local file storage on server disk).
- **Validation**: 5MB size limit; Whitelisted MIME types (`image/jpeg`, `image/png`, `image/webp`, `application/pdf`).
- **Cleanup Fallback**: If Cloudinary upload completes successfully but database update fails during `task.save()`, `deleteResource()` is automatically invoked to destroy orphaned Cloudinary assets.

---

## Environment Variables

### Backend (`server/.env.example`)
```env
NODE_ENV=development
PORT=5000
MONGODB_URI=mongodb+srv://<username>:<password>@cluster0.wsowexm.mongodb.net/?appName=Cluster0
ACCESS_TOKEN_SECRET=your_access_token_secret_here
REFRESH_TOKEN_SECRET=your_refresh_token_secret_here
CLOUDINARY_CLOUD_NAME=your_cloudinary_cloud_name
CLOUDINARY_API_KEY=your_cloudinary_api_key
CLOUDINARY_API_SECRET=your_cloudinary_api_secret
SMTP_HOST=smtp.example.com
SMTP_PORT=587
SMTP_USER=your_smtp_user
SMTP_PASS=your_smtp_password
CLIENT_URL=http://localhost:5173
```

### Frontend (`client/.env.example`)
```env
VITE_API_URL=http://localhost:5000
VITE_SOCKET_URL=http://localhost:5000
```

---

## Local Development Setup

### 1. Prerequisites
- Node.js v18+ installed
- MongoDB Atlas cluster connection string

### 2. Backend Setup
```bash
cd server
npm install
cp .env.example .env
# Fill in MONGODB_URI and JWT secrets in .env
npm run dev
```

### 3. Frontend Setup
```bash
cd client
npm install
cp .env.example .env
npm run dev
```
Open `http://localhost:5173` in your browser.

---

## Testing

The backend includes 5 automated test suites covering 63 assertions across health, authentication, RBAC, projects, tasks, file uploads, and Socket.io real-time events.

```bash
cd server
npm test
```

---

## Deployment Guide

### Backend Deployment (Railway)
1. Link your GitHub repository to Railway and select the `/server` directory root.
2. Configure environment variables in Railway settings (`NODE_ENV=production`, `MONGODB_URI`, `ACCESS_TOKEN_SECRET`, `REFRESH_TOKEN_SECRET`, `CLOUDINARY_*`, `CLIENT_URL`).
3. Deploy. Railway automatically runs `npm start` (`node server.js`).

### Frontend Deployment (Vercel)
1. Import your repository into Vercel and select the `/client` directory root.
2. Set Environment Variables:
   - `VITE_API_URL=https://your-backend.up.railway.app`
   - `VITE_SOCKET_URL=https://your-backend.up.railway.app`
3. Deploy.

---

## Live URLs

- **Frontend Application**: `<FRONTEND_URL>`
- **Backend API Server**: `<BACKEND_URL>`

---

## Technical Trade-offs & Future Enhancements

### Trade-offs Made
- **In-Memory Refresh Queue vs Interceptor Retry Loops**: Used a promise-queue interceptor pattern in Axios to avoid complex refresh loop deadlocks.
- **Repository / Service Pattern**: Chosen over raw query calls inside controllers to maintain clean separation of concerns and test isolation.

### Future Enhancements
- Redis Adapter for horizontal Socket.io room scaling across multiple node clusters.
- Task comment threads with `@mention` notifications.
- Drag-and-drop Kanban column reordering.
