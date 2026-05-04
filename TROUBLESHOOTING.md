# Deployment Troubleshooting Guide

Common issues and solutions for LMS 2.0 deployed on Vercel, Render, and Supabase.

---

## 🔴 Critical Issues

### Backend Won't Start on Render

**Symptoms**: Deployment fails or service keeps restarting

**Solutions**:

1. **Check for PG_URI error**

   ```bash
   # In Render logs, look for:
   # "FATAL: invalid connection c string"
   # "FATAL: no password supplied"

   # Verify connection string format:
   postgresql://postgres:PASSWORD@host:port/postgres?sslmode=require
   ```

2. **Check for database initialization issues**

   ```bash
   # Connection succeeded but tables missing?
   # Tables are created automatically on first run
   # Check Supabase dashboard: see all tables?
   ```

3. **Port configuration**

   ```bash
   # Render assigns PORT automatically
   # Must use: const PORT = process.env.PORT || 5000
   # Update in backend-pg/src/server.js
   ```

4. **View full logs**
   - Go to Render dashboard
   - Select `lms-backend` service
   - Click **Logs** tab
   - Scroll to see full error message

---

### CORS Errors in Frontend

**Symptoms**:

```
Access to XMLHttpRequest at 'https://backend.com/api'
from origin 'https://frontend.com' blocked by CORS policy
```

**Solutions**:

1. **Verify APP_URL is correct**

   ```bash
   # In Render environment variables
   APP_URL should be: https://your-project.vercel.app
   # Not: http://... or with /api suffix
   ```

2. **Verify VITE_API_URL is correct**

   ```bash
   # In Vercel environment variables
   VITE_API_URL should be: https://lms-backend-xxxx.onrender.com/api
   # With /api suffix
   ```

3. **Restart backend after APP_URL change**
   - Go to Render dashboard
   - Click **Manual Deploy** button
   - Wait for redeployment

4. **Check Vercel deployment URL**
   ```bash
   # Frontend might have deployed to subdomain
   # Go to Vercel > Deployments > see actual URL
   # Use that URL as APP_URL
   ```

---

### Database Connection Timeout

**Symptoms**:

```
Error: connect ETIMEDOUT
Error: remaining connection slots reserved for non-replication superuser
```

**Solutions**:

1. **For Supabase Free Tier**

   ```bash
   # Free tier has limited connections (max 10)
   # Connection pool set to: min: 4, max: 20

   # Update database.js:
   const pool = new Pool({
     min: 2,      // Reduce from 4
     max: 10,     // Reduce from 20
   })
   ```

2. **Verify database is running**

   ```bash
   # In Supabase dashboard:
   # Settings > Database > Status should be GREEN
   ```

3. **Check IP allowlist**

   ```bash
   # Supabase > Settings > Database > IP Whitelist
   # Render's IP is dynamic
   # Add 0.0.0.0/0 (allow all) or Render team IP
   ```

4. **Test connection locally**
   ```bash
   # Verify connection string works on your machine
   psql postgresql://user:password@host:port/database
   ```

---

## 🟡 Common Issues

### Frontend Shows Blank/Broken Page

**Symptoms**: All white or just header, no content

**Solutions**:

1. **Check browser console (F12)**
   - Look for red errors
   - Note the error message

2. **Verify API endpoint**

   ```bash
   # Open browser DevTools > Network tab
   # Try to make an API call (login, get courses, etc.)
   # See if API request goes out
   # Check Response status
   ```

3. **Check Vercel build output**

   ```bash
   # Vercel > Deployments > [Latest] > Details
   # Look for build errors
   # Check build logs
   ```

4. **Verify environment variable is set**

   ```bash
   # In frontend code, check:
   console.log(import.meta.env.VITE_API_URL)

   # Should show: https://backend-url/api
   # If undefined, env var not set in Vercel
   ```

5. **Test API directly**

   ```bash
   # In browser console:
   fetch('https://lms-backend-xxxx.onrender.com/api/health')
     .then(r => r.json())
     .then(d => console.log(d))

   # Should return: { success: true, message: "Server is running" }
   ```

---

### "404 Not Found" API Errors

**Symptoms**: Requests return 404 for valid endpoints

**Solutions**:

1. **Check API base URL construction**

   ```javascript
   // frontend: unified-portal/src/shared/api.js
   const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5001/api";
   // Should end with /api

   // Then endpoints are: /auth/login, /courses, etc.
   ```

2. **Verify backend routes**

   ```javascript
   // In backend: src/app.js
   // Should have:
   app.use("/api/auth", authRoutes);
   app.use("/api/courses", courseRoutes);
   // etc.
   ```

3. **Check full URL being called**
   ```bash
   # Browser DevTools > Network tab
   # Click API call
   # Copy "Request URL"
   # Should be: https://backend.com/api/auth/login
   ```

---

### Slow API Responses (>1s)

**Symptoms**: Pages load very slowly, API calls take forever

**Solutions**:

1. **Check Render instance type**

   ```bash
   # Render dashboard > lms-backend
   # Check Plan (Free tier = very slow)
   # Upgrade to Standard: $12/month
   ```

2. **Check database query performance**

   ```bash
   # In Supabase: SQL Editor
   # Run: EXPLAIN ANALYZE <your_query>
   # Look for sequential scans (slow)
   # Add indexes if needed
   ```

3. **Monitor Render CPU/Memory**

   ```bash
   # Render dashboard > Metrics
   # Check if CPU/Memory near 100%
   # Might need to upgrade plan
   ```

4. **Verify database is not in use**
   ```bash
   # Only one Render instance should connect
   # Check no local dev connections are active
   # Might be hogging connections
   ```

---

### Files Not Uploading / Large File Upload Fails

**Symptoms**: File uploads error, timeout, or fail silently

**Solutions**:

1. **Check file size limit**

   ```javascript
   // In uploadController.js:
   limits: { fileSize: 100 * 1024 * 1024 }, // 100MB

   // File must be < 100MB
   // Render/Vercel have their own limits
   ```

2. **Verify Supabase storage (if using)**

   ```bash
   # Files stored in: uploaded_files.file_data (BYTEA)
   # Size stored in: uploaded_files.size
   ```

3. **Check request timeout**

   ```bash
   # Large uploads need more time
   # Vercel: max 60s request timeout (Pro plan: 900s)
   # Render: default timeout OK for most uploads
   ```

4. **Test with smaller file first**
   ```bash
   # Try uploading 1MB file first
   # Then gradually increase size
   # Find exact size limit
   ```

---

### Authentication Token Issues

**Symptoms**: "Unauthorized", "Invalid token", logged out unexpectedly

**Solutions**:

1. **Check JWT_SECRET consistency**

   ```bash
   # Backend must use same JWT_SECRET for verify
   # If changed, all existing tokens become invalid
   # Users must re-login after change
   ```

2. **Verify token expiry settings**

   ```bash
   # JWT_EXPIRY=15m    (access token: 15 minutes)
   # JWT_REFRESH_EXPIRY=7d (refresh token: 7 days)
   # After 15m, user must use refresh token
   ```

3. **Check client token storage**

   ```javascript
   // Browser should store in localStorage:
   localStorage.getItem("accessToken");
   localStorage.getItem("refreshToken");

   // Should be present after login
   ```

4. **Check token sending in requests**
   ```javascript
   // All protected API calls need:
   Authorization: `Bearer ${token}`;
   ```

---

## 🟢 Performance Optimization

### Frontend Performance

```bash
# Check build size
cd unified-portal
npm run build
# Look at dist folder size
# Should be < 1MB total

# If too large:
# - Check for unused dependencies
# - Enable tree-shaking
# - Use code splitting
```

### Backend Performance

```bash
# Monitor Render metrics
# Render > lms-backend > Metrics

# If CPU high:
# - Check for inefficient queries
# - Add database indexes
# - Enable caching

# If memory high:
# - Check for memory leaks
# - Reduce connection pool size
```

### Database Performance

```sql
-- Supabase: SQL Editor

-- Check slow queries:
SELECT * FROM pg_stat_statements
ORDER BY mean_exec_time DESC LIMIT 10;

-- Create index if needed:
CREATE INDEX idx_name ON table_name(column_name);
```

---

## 🔍 Debugging Tips

### Enable Debug Logging

```bash
# Backend: Add to .env
NODE_ENV=production
# Keep as is, but check logs carefully

# Frontend: Add to .env
VITE_DEBUG_MODE=true
```

### Check Logs

```bash
# Render logs:
# Dashboard > lms-backend > Logs (scroll down for latest)

# Vercel logs:
# Dashboard > Project > Deployments > [Latest] > Logs

# Supabase logs:
# Dashboard > Logs (SQL Editor)
```

### Use Browser DevTools

```javascript
// Open console (F12) and run:

// Check frontend config
import.meta.env.VITE_API_URL;

// Test API endpoint
fetch("https://backend/api/health")
  .then((r) => r.json())
  .then(console.log);

// Check local storage
localStorage.getItem("accessToken");
```

---

## 📞 Getting Help

### Before Asking for Help

- [ ] Checked all logs (Render, Vercel, Supabase, Browser console)
- [ ] Verified all environment variables are set
- [ ] Tested API endpoint with curl or Postman
- [ ] Checked that problem exists in production (not just local)
- [ ] Tried redeploying

### Useful Information to Provide

When reporting issues, include:

1. **Error message** (exact text from logs)
2. **Browser console error** (F12 > Console)
3. **Request/Response** (F12 > Network tab)
4. **Steps to reproduce**
5. **Environment** (backend URL, frontend URL)
6. **Recent changes** (what was last deployed)

### Resources

- [Render Docs](https://render.com/docs)
- [Vercel Docs](https://vercel.com/docs)
- [Supabase Docs](https://supabase.com/docs)
- [Node.js Docs](https://nodejs.org/docs/)
- [Express Docs](https://expressjs.com)

---

**Last Updated**: May 2024  
**Version**: 1.0
