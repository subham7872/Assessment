# Assignment Submission Summary

## Live Demo & Endpoints

- **Frontend Live Application**: `<FRONTEND_URL>`
- **Backend API Base URL**: `<BACKEND_URL>/api/v1`
- **Backend Health Check**: `<BACKEND_URL>/api/v1/health`

---

## Evaluation Test Credentials

To evaluate multi-role RBAC and live collaboration features, you may register new accounts or use the test credentials below (generated during initial seed/test runs):

- **Project Admin**: `admin_eval@example.com` / `Password123`
- **Member**: `member_eval@example.com` / `Password123`
- **Viewer**: `viewer_eval@example.com` / `Password123`

---

## Completed Features Summary

### 1. Authentication & Security
- Short-lived JWT Access Tokens (15m in memory via Zustand) + Long-lived Refresh Tokens (7d in `httpOnly`, `secure` cookies).
- Axios 401 response interceptor with single-promise queued token refresh.
- Password hashing with `bcryptjs` (12 salt rounds) and default schema exclusion (`select: false`).
- Password reset flow with SHA-256 tokens and refresh token invalidation.
- Rate limiting (`authLimiter`, `apiLimiter`), Helmet security headers, CORS origin locking.

### 2. Project Management & RBAC
- Multi-user workspace creation, where creator becomes owner and `project_admin`.
- Tokenized project invite flow with 48-hour expiration.
- Hierarchical role permissions (`project_admin`, `member`, `viewer`).
- Membership protection rules (owner cannot be removed, owner role cannot be modified, only owner can archive).

### 3. Task Management & Kanban Board
- 4 Status columns (`To Do`, `In Progress`, `In Review`, `Completed`), Priority levels (`Low`, `Medium`, `High`, `Critical`), Assignees, Due Dates.
- Debounced text search, multi-field filtering (status, priority, assignee), sorting, and pagination (capped at 100).
- Bulk operations: Bulk status update, bulk assignment, bulk deletion (validated max 50 items per bulk call).

### 4. Real-Time Collaboration & Presence (Socket.io)
- JWT-authenticated socket connection handshake.
- Scoped project rooms (`project:${projectId}`).
- Instant real-time dispatch for task creation, status updates, deletions, bulk operations, file uploads, and project member updates.
- Real-time collaboration presence indicators (*"User is viewing this task"*, *"User is editing..."*, `user:offline` cleanup).

### 5. Media & Attachment Management
- Cloudinary CDN integration for media attachments.
- Whitelisted MIME types (JPEG, PNG, WebP, PDF) with 5MB size limit.
- Uploader & Admin deletion authorization checks.
- Automatic Cloudinary asset cleanup fallback if Mongoose `task.save()` fails.

### 6. Activity Audit Log
- Audit logging for project, task, member, and file mutations with paginated retrieval.

---

## Testing & Quality Assurance Metrics

- **Test Suite Result**: 5 passed, 5 total (100% pass rate across 63 test cases).
- **Coverage Areas**:
  - `health.test.js`
  - `auth.test.js`
  - `projects_tasks.test.js`
  - `files_socket.test.js`
  - `socket.test.js`
- **Frontend Production Build**: **Passed** (0 errors, Vite production bundle generated).

---

## Architecture Summary

```text
Client (React + Vite + Zustand)
  ├── REST API (Axios + Cookies) ──► Node.js / Express ──► MongoDB Atlas
  ├── WebSockets ◄─────────────────► Socket.io Server (Project Rooms)
  └── Upload ──────────────────────► Cloudinary CDN
```

---

## Known Limitations

- Email delivery in test environments uses logged fallback simulations if real SMTP credentials (`SMTP_HOST`/`SMTP_PASS`) are unconfigured in `.env`.
- Socket presence indicators use memory tracking per server instance; horizontal scaling across multiple Node instances requires a Redis Socket.io adapter.

---

## Production Deployment Target

- **Backend**: Railway (`Node.js`, `npm start`)
- **Frontend**: Vercel (`Vite React SPA`)
- **Database**: MongoDB Atlas Cluster
- **File Storage**: Cloudinary CDN
