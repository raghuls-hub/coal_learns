# Deployment Checklist

Use this checklist to ensure everything is properly configured before deployment.

---

## ✅ Pre-Deployment Checklist

### Code Quality

- [ ] All tests pass locally (`npm test` or `npm run lint`)
- [ ] No console errors or warnings in development
- [ ] No hardcoded URLs or credentials in code
- [ ] Environment variables are properly documented
- [ ] Git repository is clean and up-to-date

### Backend (Node.js/Express)

- [ ] `render.yaml` is configured and committed
- [ ] `backend-pg/.env.example` is up-to-date
- [ ] All environment variables documented
- [ ] Package.json has correct start command: `node src/server.js`
- [ ] Build command is `npm install`
- [ ] Database migrations tested locally
- [ ] Logging configured for production
- [ ] Error handling implemented
- [ ] CORS is configured with correct origins
- [ ] Rate limiting enabled in production

### Frontend (React/Vite)

- [ ] `vercel.json` is configured
- [ ] `unified-portal/.env.example` is up-to-date
- [ ] Vite build works: `npm run build`
- [ ] Build output directory is `dist`
- [ ] API endpoint configured via environment variable
- [ ] No console errors in production build
- [ ] SPA routing configured (Vercel handles this with vercel.json)

### Database (Supabase PostgreSQL)

- [ ] Supabase project created
- [ ] Database region selected (close to users)
- [ ] Connection string obtained (URI format)
- [ ] Database user and password secured
- [ ] Schema initialized successfully
- [ ] All tables created and verified
- [ ] Backups are enabled (automatic in Supabase)

---

## 🚀 Deployment Steps

### 1. Database Setup

- [ ] Go to supabase.com and create project
- [ ] Wait for database initialization (2-5 minutes)
- [ ] Copy PostgreSQL connection string
- [ ] Test connection locally with: `npm run db:init`
- [ ] Verify all tables created in Supabase dashboard

**Connection String Format**:

```
postgresql://postgres:[PASSWORD]@[HOST]:[PORT]/postgres?sslmode=require
```

### 2. Backend Deployment (Render)

- [ ] Generate JWT secrets:
  ```bash
  openssl rand -base64 32  # JWT_SECRET
  openssl rand -base64 32  # JWT_REFRESH_SECRET
  ```
- [ ] Go to render.com
- [ ] Create new Web Service
- [ ] Connect GitHub repository
- [ ] Set build command: `npm install`
- [ ] Set start command: `npm start`
- [ ] Add all environment variables:
  - [ ] `NODE_ENV` = `production`
  - [ ] `PORT` = `5000`
  - [ ] `PG_URI` = (Supabase connection string)
  - [ ] `JWT_SECRET` = (generated secret)
  - [ ] `JWT_REFRESH_SECRET` = (generated secret)
  - [ ] `APP_URL` = (will update after frontend deployed)
  - [ ] `GEMINI_API_KEY` = (if using AI features)
  - [ ] `BCRYPT_ROUNDS` = `12`
- [ ] Deploy backend
- [ ] Wait for deployment to complete (5-10 minutes)
- [ ] Get backend URL: `https://lms-backend-xxxx.onrender.com`
- [ ] Test health endpoint:
  ```bash
  curl https://lms-backend-xxxx.onrender.com/api/health
  ```
- [ ] Verify response includes `"success": true`

### 3. Frontend Deployment (Vercel)

- [ ] Go to vercel.com
- [ ] Create new project from GitHub
- [ ] Select `unified-portal` as root directory
- [ ] Build command: `npm run build`
- [ ] Output directory: `dist`
- [ ] Add environment variable:
  - [ ] `VITE_API_URL` = `https://lms-backend-xxxx.onrender.com/api`
- [ ] Deploy frontend
- [ ] Wait for deployment (2-5 minutes)
- [ ] Get frontend URL: `https://your-project.vercel.app`
- [ ] Test frontend loads without errors
- [ ] Check browser console (F12) for CORS errors

### 4. Update CORS Configuration

- [ ] Go back to Render dashboard
- [ ] Select `lms-backend` service
- [ ] Update environment variable:
  - [ ] `APP_URL` = `https://your-project.vercel.app`
- [ ] Save changes (backend redeploys)
- [ ] Wait for redeploy to complete
- [ ] Test API calls from frontend again

---

## 🧪 Post-Deployment Testing

### API Endpoints

```bash
BACKEND="https://lms-backend-xxxx.onrender.com/api"

# Test health
curl $BACKEND/health

# Test database connection
curl $BACKEND/courses

# Test authentication
curl -X POST $BACKEND/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "Test@123456",
    "firstName": "Test",
    "lastName": "User",
    "role": "candidate"
  }'
```

### Frontend Testing

- [ ] Open frontend URL in browser
- [ ] Check browser console (F12) for errors
- [ ] Test login functionality
- [ ] Test course browsing
- [ ] Test file upload (if applicable)
- [ ] Test navigation between pages
- [ ] Check responsive design on mobile

### Database Testing

- [ ] Connect to Supabase from SQL Editor
- [ ] Run basic query: `SELECT COUNT(*) FROM users;`
- [ ] Verify user was created during API test
- [ ] Check that courses are accessible

---

## 🔒 Security Verification

- [ ] No .env files committed to Git
- [ ] Secrets are stored in deployment platforms (not in code)
- [ ] HTTPS is enabled on all URLs
- [ ] CORS is configured with specific origins (not `*`)
- [ ] Database is accessible only from backend
- [ ] Rate limiting is enabled
- [ ] Error messages don't expose sensitive info

---

## 📊 Monitoring Setup

### Render (Backend)

- [ ] Enable auto-deploys from main branch
- [ ] Set up email notifications for failures
- [ ] Monitor CPU/Memory usage
- [ ] Check logs daily for errors

### Vercel (Frontend)

- [ ] Enable analytics
- [ ] Set up performance alerts
- [ ] Review deployment logs

### Supabase (Database)

- [ ] Enable backups (automatic daily)
- [ ] Monitor connection pool usage
- [ ] Set up slow query logs

---

## 📈 Performance Checklist

- [ ] Frontend build size < 1MB (check with `npm run build`)
- [ ] Lighthouse score > 90 (test with DevTools)
- [ ] Backend response time < 500ms
- [ ] Database queries optimized with indexes
- [ ] Images compressed and optimized
- [ ] No memory leaks in backend

---

## 🆘 Emergency Contacts/Resources

- [ ] Render Status: https://status.render.com
- [ ] Vercel Status: https://www.vercel-status.com
- [ ] Supabase Status: https://status.supabase.com
- [ ] GitHub Issues: Your repository issues page
- [ ] Documentation: See DEPLOYMENT_GUIDE.md

---

## 📝 Deployment Notes

**Date**: ******\_\_\_\_******  
**Deployed By**: ******\_\_\_\_******  
**Backend URL**: ******\_\_\_\_******  
**Frontend URL**: ******\_\_\_\_******  
**Database Host**: ******\_\_\_\_******  
**Notes**: ******************************\_\_\_\_******************************

---

---

## ✨ Post-Deployment Tasks (First Week)

- [ ] Monitor logs for 24 hours
- [ ] Test all critical user flows
- [ ] Gather user feedback
- [ ] Performance monitoring
- [ ] Security audit
- [ ] Set up uptime monitoring
- [ ] Document any issues encountered
- [ ] Plan for scale testing

---

**Remember**: Always test in a staging environment before production deployment!
