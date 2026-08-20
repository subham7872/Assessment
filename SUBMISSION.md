# Assignment Submission Summary

## Live Deployment Links

- **Frontend Live Application (Vercel)**: `<FRONTEND_URL>`
- **Backend API Base URL (Render)**: `<BACKEND_URL>/api/v1`
- **Backend Health Check**: `<BACKEND_URL>/api/v1/health`

---

## Evaluation Test Credentials

You may register new accounts or use these test credentials:

- **Project Admin**: `admin_eval@example.com` / `Password123`
- **Member**: `member_eval@example.com` / `Password123`
- **Viewer**: `viewer_eval@example.com` / `Password123`

---

## Production Deployment Specifications

- **Backend Host**: Render (`Node.js`, Start Command: `node server.js`)
- **Frontend Host**: Vercel (`React 18 + Vite SPA`, `vercel.json` rewrites enabled)
- **Database**: MongoDB Atlas Cluster
- **File Storage**: Cloudinary CDN
- **Email Service**: Brevo SMTP Relay (`smtp-relay.brevo.com:587`)

---

## Quality Metrics & Test Results

- **Automated Test Suites**: 5 passed, 5 total (**100% pass rate** across 63 test cases).
- **Frontend Production Build**: **Passed** (`npm run build` in `/client` completed with zero errors).
