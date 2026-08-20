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

- **Authentication & Security**: JWT Access Tokens (15-minute expiry in memory) + Refresh Tokens (7-day expiry in `httpOnly`, `sameSite: none` cookies for cross-origin production compatibility), bcrypt password hashing (12 rounds), rate limiting, Helmet, and CORS protection.
- **Project Management**: Multi-user workspaces, invite system with tokenized expiration, member role management, and project archiving.
- **Task Management & Kanban**: 4 status columns (`To Do`, `In Progress`, `In Review`, `Completed`), priority tags (`Low`, `Medium`, `High`, `Critical`), assignees, due dates, debounced title search, filtering, and sorting.
- **Bulk Task Operations**: Bulk status changes, bulk assignments, and bulk deletion with validation (max 50 tasks per bulk request).
- **Real-Time Collaboration**: Instant socket room sync for task CRUD, file uploads, member changes, and live presence indicators (*"John is viewing this task"*, *"Sarah is editing..."*).
- **File Uploads**: Cloudinary integration for task attachments (JPEG, PNG, WebP, PDF up to 5MB) with automatic Cloudinary cleanup fallback if database updates fail.
- **Activity Audit Log**: Detailed audit log capturing all project, task, member, and file mutations with pagination.

---

## System Architecture

```
Client (React + Vite + Zustand) [Vercel]
       │
       ├── HTTP / REST API (Axios + Cookies) ──► Node.js / Express Server [Render] ──► MongoDB Atlas
       │                                                 │
       ├── Socket.io Client ◄── WebSockets ──────────────┤ (Room Manager)
       │                                                 │
       └── Direct Stream Upload ────────────────────────► Cloudinary CDN
```

---

## Tech Stack

### Backend
- **Runtime**: Node.js (Hosted on Render)
- **Framework**: Express.js
- **Database**: MongoDB Atlas with Mongoose ORM
- **Real-Time Engine**: Socket.io
- **Authentication**: JSON Web Tokens (`jsonwebtoken`), `bcryptjs`, `cookie-parser`
- **File Storage**: Multer + Cloudinary SDK (`cloudinary`)
- **Security & Rate Limiting**: `helmet`, `cors`, `express-rate-limit`
- **Testing**: Jest + Supertest

### Frontend
- **Framework**: React 18 + Vite (Hosted on Vercel)
- **State Management**: Zustand (In-memory token & app stores)
- **Routing**: React Router DOM v6 (`vercel.json` SPA rewrites enabled)
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
│   │   ├── components/
│   │   ├── hooks/
│   │   ├── pages/
│   │   ├── routes/
│   │   ├── socket/
│   │   ├── store/
│   │   └── utils/
│   ├── .env.example
│   ├── index.html
│   ├── package.json
│   ├── vercel.json
│   └── vite.config.js
├── server/
│   ├── src/
│   │   ├── config/
│   │   ├── controllers/
│   │   ├── middleware/
│   │   ├── models/
│   │   ├── repositories/
│   │   ├── routes/
│   │   ├── services/
│   │   ├── socket/
│   │   └── utils/
│   ├── tests/
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
- **Refresh Token**: Long-lived (7 days), signed with `REFRESH_TOKEN_SECRET`. Stored in an `httpOnly`, `secure: true`, `sameSite: 'none'` cookie to enable cross-domain cookie transmission between Render (backend) and Vercel (frontend).

---

## Role-Based Access Control (RBAC)

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

## Environment Variables

### Backend (`server/.env`) — Set in Render Dashboard
```env
NODE_ENV=production
PORT=5000
MONGODB_URI=mongodb+srv://<username>:<password>@cluster0.wsowexm.mongodb.net/?appName=Cluster0
ACCESS_TOKEN_SECRET=your_access_token_secret_here
REFRESH_TOKEN_SECRET=your_refresh_token_secret_here
CLOUDINARY_CLOUD_NAME=your_cloudinary_cloud_name
CLOUDINARY_API_KEY=your_cloudinary_api_key
CLOUDINARY_API_SECRET=your_cloudinary_api_secret
SMTP_HOST=smtp-relay.brevo.com
SMTP_PORT=587
SMTP_USER=8589a5002@smtp-brevo.com
SMTP_PASS=your_brevo_smtp_password
SMTP_FROM=your_email@domain.com
CLIENT_URL=https://your-frontend.vercel.app
```

### Frontend (`client/.env`) — Set in Vercel Dashboard
```env
VITE_API_URL=https://your-backend.onrender.com
VITE_SOCKET_URL=https://your-backend.onrender.com
```

---

## Deployment Instructions

### 1. Deploying Backend to Render
1. Create a **New Web Service** on [Render](https://render.com).
2. Connect your repository and set Root Directory to `server`.
3. Set Build Command: `npm install`
4. Set Start Command: `node server.js`
5. Add all Environment Variables listed above (`NODE_ENV=production`, `MONGODB_URI`, `CLIENT_URL=https://your-app.vercel.app`, etc.).
6. Deploy. Copy your assigned Render service URL (e.g. `https://your-backend.onrender.com`).

### 2. Deploying Frontend to Vercel
1. Import your repository on [Vercel](https://vercel.com).
2. Set Framework Preset to **Vite** and Root Directory to `client`.
3. Add Environment Variables:
   - `VITE_API_URL=https://your-backend.onrender.com`
   - `VITE_SOCKET_URL=https://your-backend.onrender.com`
4. Deploy. Copy your Vercel URL and update `CLIENT_URL` in your Render environment variables.

---

## Live URLs

- **Frontend Application (Vercel)**: `<FRONTEND_URL>`
- **Backend API Server (Render)**: `<BACKEND_URL>`
- **Health Check**: `https://your-backend.onrender.com/api/v1/health`
