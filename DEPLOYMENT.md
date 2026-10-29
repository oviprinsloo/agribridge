# AGRIBridge Production Deployment & Operations Guide 🚀🌾

This document details the production deployment, hosting architecture, environment configuration, database management, and maintenance workflows for the **AGRIBridge** platform.

---

## 1. Target Production Architecture

| Component | Platform | Role / Purpose | Free / Managed Tier Capabilities |
| :--- | :--- | :--- | :--- |
| **Frontend** | **Vercel** | React 18 + Vite SPA, Tailwind CSS, Leaflet Maps | Global Edge CDN, automated HTTPS, SPA routing rewrites |
| **Backend** | **Render Web Service** | Node.js 20+ Express REST API, Prisma Client, TSP Routing | Containerized Linux environment, custom domain support, health checks |
| **Database** | **Neon** | Serverless PostgreSQL 16 (PgBouncer connection pooler) | Autoscaling compute, automated point-in-time recovery, connection pooling |
| **ORM & Migrations** | **Prisma 5.22** | Type-safe query engine & schema migrations | `prisma migrate deploy` for zero-data-loss DDL deployments |
| **Source Control** | **GitHub** | CI/CD Git provider for Vercel & Render triggers | Continuous deployment on push to `main` branch |
| **Maps & AI** | **Leaflet / OSM & Gemini** | Route visualization & contextual agricultural assistant | OpenStreetMap tiles; optional Google Gemini API |

---

## 2. Environment Variables Specification

### A. Frontend Environment Variables (Vercel)

Configure these in the **Vercel Project Settings > Environment Variables**:

| Variable | Required | Description | Example |
| :--- | :--- | :--- | :--- |
| `VITE_API_BASE_URL` | **Yes** | Deployed Render backend API URL (with or without `/api`) | `https://agribridge-backend.onrender.com/api` |

> [!CAUTION]
> **No Frontend Secrets**: Never set `JWT_SECRET`, database passwords, or payment API private keys in Vite environment variables. Only variables prefixed with `VITE_` are bundled into the client build.

---

### B. Backend Environment Variables (Render)

Configure these in the **Render Web Service Settings > Environment**:

| Variable | Required | Default / Format | Description |
| :--- | :--- | :--- | :--- |
| `NODE_ENV` | **Yes** | `production` | Enforces production security, structured error responses |
| `PORT` | **Yes** | Auto-assigned by Render | Port for Express HTTP listener (server binds to `0.0.0.0`) |
| `DATABASE_URL` | **Yes** | `postgresql://...-pooler.neon.tech/neondb?sslmode=require` | Neon pooled connection string (PgBouncer, port 6543) |
| `DIRECT_URL` | **Yes** | `postgresql://...neon.tech/neondb?sslmode=require` | Neon direct connection string (port 5432) for migrations |
| `JWT_SECRET` | **Yes** | 32+ character random secret | Cryptographic key used to sign and verify user auth tokens |
| `JWT_EXPIRES_IN` | No | `7d` | Token lifetime |
| `FRONTEND_URL` | **Yes** | `https://agribridge.vercel.app` | Allowed CORS origins (comma-separated if multiple) |
| `PAYMENT_PROVIDER` | No | `MOCK` | `MOCK` for simulated escrow; `RAZORPAY` when gateway credentials provided |
| `RAZORPAY_KEY_ID` | No | — | Optional payment gateway ID |
| `RAZORPAY_KEY_SECRET` | No | — | Optional payment gateway secret |
| `GEMINI_API_KEY` | No | — | Optional Google Gemini API key (defaults to deterministic grounded engine) |
| `SEED_DEMO_DATA` | No | `false` | Set to `false` in production to prevent seeding demo users/orders |
| `BOOTSTRAP_ADMIN_EMAIL` | No | `admin@yourdomain.com` | Optional initial admin email for secure one-time bootstrap |
| `BOOTSTRAP_ADMIN_PASSWORD` | No | `YourStrongAdminPassword123!` | Optional initial admin password for one-time bootstrap |

---

## 3. Step-by-Step Production Deployment

### Step 1: Set Up Neon PostgreSQL

1. Log in to [Neon Console](https://console.neon.tech/).
2. Create a new project:
   * **Project Name**: `agribridge-db`
   * **Postgres Version**: `16`
   * **Region**: Select the region closest to your Render service (e.g., `AWS us-east-2` or `Oregon`).
3. In the Neon Dashboard, locate your **Connection Details**:
   * Check the **"Pooled connection"** checkbox to copy the connection string for `DATABASE_URL`.
   * Uncheck the checkbox (or select direct connection) to copy the non-pooled connection string for `DIRECT_URL`.
4. Note down both connection strings securely.

---

### Step 2: Push Repository to GitHub

Ensure your code is committed to your GitHub repository:

```bash
git add .
git commit -m "feat: production-ready configuration for Vercel, Render, and Neon"
git remote add origin https://github.com/YOUR_USERNAME/agribridge.git
git branch -M main
git push -u origin main
```

---

### Step 3: Deploy Backend on Render

#### Option A: Using Render Blueprint (Recommended)
1. In the [Render Dashboard](https://dashboard.render.com/), click **New > Blueprint**.
2. Connect your GitHub repository.
3. Render reads `render.yaml` automatically and configures:
   * Service Name: `agribridge-backend`
   * Root Directory: `backend`
   * Runtime: `Node`
   * Build Command: `npm install && npm run build:prod`
   * Start Command: `npm run prisma:deploy && npm run start`
   * Health Check: `/api/health`
4. Enter your Neon `DATABASE_URL` and `DIRECT_URL` when prompted.
5. Click **Apply**.

#### Option B: Manual Web Service Setup
1. In Render Dashboard, click **New > Web Service**.
2. Connect your GitHub repository.
3. Configure the settings:
   * **Name**: `agribridge-backend`
   * **Root Directory**: `backend`
   * **Environment**: `Node`
   * **Build Command**: `npm install && npm run build:prod`
   * **Start Command**: `npm run prisma:deploy && npm run start`
   * **Health Check Path**: `/api/health`
4. In **Environment Variables**, add:
   * `NODE_ENV` = `production`
   * `DATABASE_URL` = *(Neon pooled URL)*
   * `DIRECT_URL` = *(Neon direct URL)*
   * `JWT_SECRET` = *(Generate a 32+ character random string)*
   * `FRONTEND_URL` = `https://YOUR-APP.vercel.app` *(update once frontend is deployed)*
   * `PAYMENT_PROVIDER` = `MOCK`
   * `SEED_DEMO_DATA` = `false`
5. Click **Deploy Web Service**.
6. When deployment finishes, copy your live backend URL (e.g. `https://agribridge-backend.onrender.com`).

---

### Step 4: Deploy Frontend on Vercel

1. Log in to [Vercel](https://vercel.com/) and click **Add New > Project**.
2. Import your GitHub repository.
3. In **Project Configuration**:
   * **Root Directory**: Select `frontend` (click "Edit" and choose `frontend`).
   * **Framework Preset**: `Vite`
   * **Build Command**: `npm run build` (or leave default `vite build`)
   * **Output Directory**: `dist`
4. In **Environment Variables**:
   * Add `VITE_API_BASE_URL` with value: `https://YOUR-RENDER-BACKEND.onrender.com/api`
5. Click **Deploy**.
6. Vercel will build the frontend and provide your production URL (e.g., `https://agribridge.vercel.app`).
7. Update `FRONTEND_URL` on Render with this Vercel domain if not already done.

---

## 4. Production Database Migration & Seeding

### Migrations
Production migrations are stored in `backend/prisma/migrations/20261028_init/migration.sql`.
Render automatically runs migrations during deployment via the start command:
```bash
npm run prisma:deploy
```
To run migrations manually against the remote database:
```bash
cd backend
DATABASE_URL="your-neon-pooled-url" DIRECT_URL="your-neon-direct-url" npx prisma migrate deploy
```

### Seeding Reference Data
To safely seed the 12 primary crops and 5 official government schemes without overwriting or deleting user records:
```bash
cd backend
NODE_ENV=production DATABASE_URL="..." npx tsx prisma/seed.ts
```

### Admin Account Bootstrapping
To create or update the system administrator account safely:
```bash
cd backend
NODE_ENV=production BOOTSTRAP_ADMIN_EMAIL="admin@yourdomain.com" BOOTSTRAP_ADMIN_PASSWORD="StrongSecurePassword123!" DATABASE_URL="..." npx tsx prisma/seed.ts
```

---

## 5. Live System Verification Checklist

After deploying both services, run these verification tests:

| Check | Action / Endpoint | Expected Result |
| :--- | :--- | :--- |
| **Backend Health** | `GET https://your-backend.onrender.com/api/health` | HTTP 200 with `{"success": true, "status": "UP"}` |
| **DB Readiness** | `GET https://your-backend.onrender.com/api/health/ready` | HTTP 200 with `{"database": "CONNECTED"}` |
| **Public Catalog** | `GET https://your-backend.onrender.com/api/crops` | HTTP 200 returning list of crops |
| **Frontend Homepage** | Navigate to `https://your-frontend.vercel.app/` | Landing page renders with navigation |
| **Deep Route Refresh**| Open `https://your-frontend.vercel.app/market` and refresh | Route renders cleanly without 404 (handled by `vercel.json`) |
| **Farmer Registration**| Register a new test farmer on `/register` | Account created, redirected to Farmer Dashboard |
| **Produce Listing** | Add produce item (crop, quantity, price) | Item listed and visible under `/farmer/produce` |
| **Buyer Registration** | Register a new test buyer on `/register` | Account created, redirected to Buyer Dashboard |
| **Mock Checkout** | Complete payment on an order | Escrow transaction recorded; duplicate payment rejected |
| **Admin Protection** | Attempt to call `/api/admin/metrics` as non-admin | HTTP 403 Forbidden |

---

## 6. Monitoring, Troubleshooting & Known Limitations

### Free Tier Hosting Behaviors
* **Render Free Web Service**: Spins down after 15 minutes of inactivity. The next incoming HTTP request experiences a ~30–50 second cold start. The health check at `/api/health` will wake the instance.
* **Neon Free Tier**: Neon suspends compute endpoints after 5 minutes of inactivity. When a query is initiated, Neon resumes compute in under 2 seconds.
* **OpenStreetMap Tiles**: Free tile server has usage policies; in high-volume enterprise production, a dedicated tile provider or Mapbox token can be used.

### Troubleshooting
1. **CORS Error in Browser Console**:
   * Verify that the Vercel domain matches the `FRONTEND_URL` variable in Render. Note that `app.ts` also automatically allows all `https://*.vercel.app` domains.
2. **Frontend calls `http://localhost:5000` or fails with 404 on API calls**:
   * Verify that `VITE_API_BASE_URL` is configured in Vercel project settings and trigger a redeployment so Vite bakes the URL into the client bundle.
3. **Prisma Connection Timeout**:
   * Verify that `DATABASE_URL` includes `?sslmode=require` and points to the Neon `-pooler` host.

---

## 7. Backup and Recovery Procedures

* **Neon Automated Point-in-Time Recovery**: Neon provides automated continuous backups with branching capabilities. To restore state, create a branch from a specific timestamp in the Neon console.
* **Manual Snapshot**:
  ```bash
  pg_dump "postgresql://user:password@ep-sample.region.neon.tech/neondb?sslmode=require" -f backup_$(date +%Y%m%d).sql
  ```
* **Restore from Snapshot**:
  ```bash
  psql "postgresql://user:password@ep-sample.region.neon.tech/neondb?sslmode=require" < backup_20261028.sql
  ```
