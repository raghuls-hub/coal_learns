# LMS 2.0 — Deployment Guide

Complete guide to deploy the LMS application on **Vercel** (Frontend), **Render** (Backend), and **Supabase** (Database).

---

## 📋 Pre-Deployment Checklist

- [ ] GitHub repository is public or you have deployment permissions
- [ ] Generate JWT secrets: `openssl rand -base64 32`
- [ ] Supabase project is created
- [ ] Environment variables are prepared
- [ ] Database migrations are ready

---

## 1️⃣ Database Setup (Supabase PostgreSQL)

### Create Supabase Project

1. Go to [supabase.com](https://supabase.com)
2. Click **New Project**
3. Fill in:
   - **Name**: `lms-production` (or your choice)
   - **Database Password**: Store securely
   - **Region**: Choose closest to your users
4. Wait for project to be ready (~2 minutes)

### Get Connection String

1. Navigate to **Settings** → **Database**
2. Copy the **Connection String** (URI)
3. It will look like:
   ```
   postgresql://postgres:[PASSWORD]@[HOST]:[PORT]/postgres?sslmode=require
   ```

### Initialize Database Schema

1. In your local terminal, from `backend-pg/` directory:

   ```bash
   # Update .env with your Supabase connection string
   PG_URI=postgresql://postgres:[PASSWORD]@[HOST]:[PORT]/postgres?sslmode=require

   # Run migrations
   npm run db:init
   ```

2. Verify tables were created in Supabase:
   - Go to **SQL Editor** in Supabase dashboard
   - Run: `SELECT tablename FROM pg_tables WHERE schemaname = 'public';`

---

## 2️⃣ Backend Deployment (Render)

### Prerequisites

- GitHub account with repository access
- Render account at [render.com](https://render.com)

### Step 1: Prepare Backend for Deployment

1. **Verify environment variables** in `backend-pg/.env.example`:

   ```bash
   NODE_ENV=production
   PORT=5000
   PG_URI=your_supabase_connection_string
   JWT_SECRET=generated_secret_1
   JWT_REFRESH_SECRET=generated_secret_2
   APP_URL=https://your-frontend-domain.com
   ```

2. **Commit and push** to GitHub:
   ```bash
   cd backend-pg
   git add .
   git commit -m "chore: prepare for deployment"
   git push origin main
   ```

### Step 2: Deploy on Render

1. Go to [render.com](https://render.com) and sign in
2. Click **New +** → **Web Service**
3. Select your GitHub repository
4. Configure:
   - **Name**: `lms-backend`
   - **Environment**: `Node`
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
   - **Plan**: Standard ($12/month)

5. Click **Advanced** and add environment variables:

   ```
   NODE_ENV = production
   PORT = 5000
   PG_URI = postgresql://postgres:[PASSWORD]@[HOST]:[PORT]/postgres?sslmode=require
   JWT_SECRET = your_generated_secret_1
   JWT_REFRESH_SECRET = your_generated_secret_2
   APP_URL = https://your-vercel-frontend-url.vercel.app
   GEMINI_API_KEY = your_gemini_api_key
   BCRYPT_ROUNDS = 12
   ```

6. Click **Create Web Service**
7. Wait for deployment (5-10 minutes)
8. Get your backend URL: `https://lms-backend-xxxx.onrender.com`

### Step 3: Verify Backend

```bash
# Test health endpoint
curl https://lms-backend-xxxx.onrender.com/api/health
```

Expected response:

```json
{
  "success": true,
  "message": "Server is running",
  "timestamp": "2024-05-04T10:30:00.000Z"
}
```

---

## 3️⃣ Frontend Deployment (Vercel)

### Prerequisites

- Vercel account at [vercel.com](https://vercel.com)

### Step 1: Prepare Frontend

1. **Update environment variables** in `unified-portal/.env.example`:

   ```bash
   VITE_API_URL=https://lms-backend-xxxx.onrender.com/api
   VITE_DEBUG_MODE=false
   ```

2. **Verify `vite.config.js`** (should be already configured):

   ```javascript
   export default defineConfig({
     plugins: [react()],
     // ... rest of config
   });
   ```

3. **Commit and push**:
   ```bash
   cd unified-portal
   git add .
   git commit -m "chore: prepare frontend for deployment"
   git push origin main
   ```

### Step 2: Deploy on Vercel

1. Go to [vercel.com](https://vercel.com) and sign in
2. Click **Add New** → **Project**
3. Select your GitHub repository
4. Configure:
   - **Framework**: Vite
   - **Root Directory**: `unified-portal`
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`

5. Add **Environment Variables**:

   ```
   VITE_API_URL = https://lms-backend-xxxx.onrender.com/api
   VITE_DEBUG_MODE = false
   ```

6. Click **Deploy**
7. Wait for deployment (2-5 minutes)
8. Get your frontend URL: `https://your-project.vercel.app`

### Step 3: Update Backend CORS

Now that you have your Vercel frontend URL, update Render environment variables:

1. Go to Render dashboard
2. Select `lms-backend` service
3. Click **Environment**
4. Update `APP_URL`:
   ```
   APP_URL = https://your-project.vercel.app
   ```
5. Click **Save Changes** (backend will redeploy)

---

## 4️⃣ Post-Deployment Verification

### Test API Endpoints

```bash
BACKEND_URL="https://lms-backend-xxxx.onrender.com/api"

# Health check
curl $BACKEND_URL/health

# Try authentication
curl -X POST $BACKEND_URL/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "SecurePassword123!",
    "firstName": "Test",
    "lastName": "User",
    "role": "candidate"
  }'
```

### Test Frontend

1. Open `https://your-project.vercel.app`
2. Verify:
   - Page loads without errors
   - Can register/login
   - API calls reach backend
   - No CORS errors in console

### Monitor Logs

**Backend (Render)**:

- Dashboard → `lms-backend` → **Logs**

**Frontend (Vercel)**:

- Dashboard → Project → **Deployments** → **Details**

---

## 🔧 Environment Variables Summary

### Backend (Render)

| Variable             | Example                       | Notes                                   |
| -------------------- | ----------------------------- | --------------------------------------- |
| `NODE_ENV`           | `production`                  | Server environment                      |
| `PORT`               | `5000`                        | Port (Render assigns automatically)     |
| `PG_URI`             | `postgresql://...`            | Supabase connection string              |
| `JWT_SECRET`         | `random_base64_string`        | Generate with `openssl rand -base64 32` |
| `JWT_REFRESH_SECRET` | `random_base64_string`        | Different from JWT_SECRET               |
| `APP_URL`            | `https://your-app.vercel.app` | Frontend URL for CORS                   |
| `GEMINI_API_KEY`     | `your_key`                    | AI feature (optional)                   |

### Frontend (Vercel)

| Variable          | Example                                     | Notes                                |
| ----------------- | ------------------------------------------- | ------------------------------------ |
| `VITE_API_URL`    | `https://lms-backend-xxxx.onrender.com/api` | Backend API endpoint                 |
| `VITE_DEBUG_MODE` | `false`                                     | Debug logging (false for production) |

### Database (Supabase)

| Item              | Where to Get                                  |
| ----------------- | --------------------------------------------- |
| Connection String | Settings → Database → Connection String (URI) |
| Password          | Created during project setup                  |
| Host              | Connection string parameter                   |

---

## 🔐 Security Best Practices

1. **Never commit `.env` files** - Only commit `.env.example`
2. **Rotate secrets regularly** - Change JWT secrets quarterly
3. **Use HTTPS everywhere** - All endpoints should use SSL
4. **Enable database backups** - Supabase has automatic backups
5. **Monitor usage** - Set up alerts in Render and Supabase
6. **Restrict database access** - Only allow connections from Render
7. **Set strong passwords** - For Supabase database user

---

## 📊 Monitoring & Maintenance

### Render Backend

- **CPU/Memory**: Dashboard → Metrics
- **Error Logs**: Dashboard → Logs
- **Auto-deploys**: Connect GitHub branch for auto-deployment

### Vercel Frontend

- **Analytics**: Dashboard → Analytics
- **Performance**: Dashboard → Performance
- **Deploy previews**: Every PR gets preview URL

### Supabase Database

- **Query Performance**: SQL Editor → Performance
- **Database logs**: View slow queries
- **Backups**: Automatic daily backups

---

## 🚨 Troubleshooting

### Backend Won't Start

```bash
# Check logs in Render dashboard
# Common issues:
# 1. PG_URI is invalid → verify format
# 2. Database not initialized → run npm run db:init
# 3. Port 5000 in use → change PORT in env vars
```

### CORS Errors

```javascript
// Error: "Access to XMLHttpRequest blocked by CORS"
// Solution: Update APP_URL in Render environment variables

// Must restart backend after changing APP_URL
```

### Database Connection Timeout

```bash
# Issue: "FATAL: remaining connection slots reserved for non-replication superuser connections"
# Solution: Supabase free tier has connection limits
# Upgrade plan or reduce connection pool size in database.js
```

### Frontend Shows Blank Page

```bash
# Check browser console (F12) for errors
# Verify VITE_API_URL is set correctly
# Check that backend is running: curl <BACKEND_URL>/health
```

---

## 🆙 Updating Deployments

### Update Backend

```bash
# 1. Make changes locally
cd backend-pg
git add .
git commit -m "feat: add new feature"
git push origin main

# 2. Render auto-deploys from main branch
# 3. Monitor logs: Dashboard → lms-backend → Logs
```

### Update Frontend

```bash
# 1. Make changes locally
cd unified-portal
npm run build  # Test build locally
git add .
git commit -m "feat: add new feature"
git push origin main

# 2. Vercel auto-deploys
# 3. Check: Dashboard → Deployments
```

### Update Database

```bash
# If schema changes are needed:
# 1. Create new migration in backend-pg/src/config/schema.sql
# 2. Connect to Supabase and apply migration
# 3. Or use: npm run db:init (caution: only for initialization)

# Connect to database directly:
# psql postgresql://postgres:PASSWORD@HOST:PORT/postgres
```

---

## 📞 Support Resources

- **Render Docs**: https://render.com/docs
- **Vercel Docs**: https://vercel.com/docs
- **Supabase Docs**: https://supabase.com/docs
- **Node.js Best Practices**: https://nodejs.org/en/docs/guides/

---

**Last Updated**: May 2024
**Project**: LMS 2.0 (PostgreSQL Edition)
