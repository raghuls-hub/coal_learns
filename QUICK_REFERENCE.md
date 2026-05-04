# Quick Reference Card

Print this page for quick access to common commands and configurations.

---

## 🚀 Local Development Commands

```bash
# Backend
cd backend-pg
npm install          # Install dependencies
npm run dev         # Start development server (port 5001)
npm run db:init     # Initialize database
npm test            # Run tests (if available)

# Frontend
cd ../unified-portal
npm install         # Install dependencies
npm run dev         # Start dev server (port 3000)
npm run build       # Build for production
npm run preview     # Preview production build
npm run lint        # Lint code
```

---

## 📡 API Testing

```bash
# Health check
curl http://localhost:5001/api/health

# Register user
curl -X POST http://localhost:5001/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "Test@123",
    "firstName": "Test",
    "lastName": "User",
    "role": "candidate"
  }'

# Login
curl -X POST http://localhost:5001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "Test@123"
  }'
```

---

## 🔑 Environment Variables

### Backend (backend-pg/.env)

```bash
NODE_ENV=production
PORT=5000
PG_URI=postgresql://postgres:password@host:port/postgres
JWT_SECRET=your_generated_secret_here
JWT_REFRESH_SECRET=your_generated_secret_here
JWT_EXPIRY=15m
JWT_REFRESH_EXPIRY=7d
APP_URL=https://your-frontend.vercel.app
GEMINI_API_KEY=your_api_key
```

### Frontend (unified-portal/.env)

```bash
VITE_API_URL=https://backend-url.onrender.com/api
VITE_DEBUG_MODE=false
```

---

## 🔐 Generate Secrets

```bash
# Generate JWT secrets (32 random bytes, base64 encoded)
openssl rand -base64 32

# Output: Copy the generated string to your .env files
```

---

## 📦 Key Dependencies

### Backend

- **express**: Web framework
- **pg**: PostgreSQL driver
- **jsonwebtoken**: JWT authentication
- **bcryptjs**: Password hashing
- **multer**: File uploads
- **cors**: CORS handling

### Frontend

- **react**: UI library
- **react-router-dom**: Routing
- **axios**: HTTP client
- **recharts**: Charts & graphs
- **react-hot-toast**: Notifications

---

## 📁 File Structure

```
backend-pg/
├── src/
│   ├── config/          # Database, JWT, initialization
│   ├── controllers/    # Business logic
│   ├── routes/        # API endpoints
│   ├── middleware/    # Auth, validation, errors
│   ├── services/      # DB operations
│   ├── app.js         # Express setup
│   └── server.js      # Entry point
├── package.json
├── .env.example
└── render.yaml

unified-portal/
├── src/
│   ├── modules/       # Feature modules
│   ├── shared/        # Shared components & API
│   ├── pages/         # Page components
│   └── main.jsx
├── package.json
├── vite.config.js
├── .env.example
└── vercel.json
```

---

## 🌐 URLs

### Local Development

- Frontend: http://localhost:3000
- Backend API: http://localhost:5001/api
- Health: http://localhost:5001/api/health

### Production

- Frontend: https://your-project.vercel.app
- Backend: https://lms-backend-xxxx.onrender.com
- API: https://lms-backend-xxxx.onrender.com/api

---

## 📝 Common Routes

### Auth

```
POST   /api/auth/register      # Register new user
POST   /api/auth/login         # Login user
POST   /api/auth/refresh-token # Refresh JWT token
GET    /api/auth/logout        # Logout user (if exists)
```

### Courses

```
GET    /api/courses            # Get all courses
GET    /api/courses/:id        # Get course details
POST   /api/courses            # Create course (tutor)
PUT    /api/courses/:id        # Update course (tutor)
DELETE /api/courses/:id        # Delete course (tutor)
```

### Enrollments

```
POST   /api/enrollments/:courseId   # Enroll in course
GET    /api/enrollments            # Get my enrollments
DELETE /api/enrollments/:id        # Cancel enrollment
```

### Progress

```
GET    /api/progress           # Get my progress
PUT    /api/progress/:contentId # Update progress
```

### Upload

```
POST   /api/upload             # Upload file
GET    /api/upload/file/:filename # Download file
```

---

## 🔧 Database Commands

```bash
# Connect to Supabase
psql postgresql://user:password@host:port/postgres

# List tables
\dt

# Describe table
\d+ table_name

# Run SQL file
psql -U postgres -d database -f schema.sql

# Backup database
pg_dump postgresql://user:password@host:port/db > backup.sql

# Restore from backup
psql postgresql://user:password@host:port/db < backup.sql
```

---

## 🚢 Deployment Platforms

### Vercel (Frontend)

- URL: https://vercel.com
- Supports: React, Vite, Next.js
- Plan: Hobby (free), Pro ($20/month)
- Auto-deploy from GitHub ✓

### Render (Backend)

- URL: https://render.com
- Supports: Node.js, Python, Go, Rust
- Plan: Free, Standard ($12/month), Pro ($29/month)
- Auto-deploy from GitHub ✓

### Supabase (Database)

- URL: https://supabase.com
- Supports: PostgreSQL
- Plan: Free (10GB), Pro ($25/month)
- Automatic backups ✓

---

## 🆘 Troubleshooting

### Backend won't start

```bash
# Check PG_URI format
# postgresql://postgres:password@host:port/postgres?sslmode=require

# Check database initialized
# npm run db:init
```

### CORS error

```bash
# Update APP_URL in Render
# https://your-frontend-domain.com

# Restart backend (Manual Deploy)
```

### API returns 404

```bash
# Check API base URL
# Should end with /api

# Test endpoint: curl https://backend/api/health
```

### Database timeout

```bash
# Check connection string
# Test with: psql postgresql://...
# Verify IP is whitelisted in Supabase
```

---

## 📚 Documentation

- **[README.md](./README.md)** - Project overview
- **[DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md)** - Complete deployment guide
- **[DEPLOYMENT_CHECKLIST.md](./DEPLOYMENT_CHECKLIST.md)** - Pre-deployment checklist
- **[TROUBLESHOOTING.md](./TROUBLESHOOTING.md)** - Troubleshooting guide
- **[CODEBASE_ANALYSIS_REPORT.md](./CODEBASE_ANALYSIS_REPORT.md)** - Code structure

---

## 🔗 Useful Links

- Node.js: https://nodejs.org
- Express: https://expressjs.com
- React: https://react.dev
- Vite: https://vitejs.dev
- PostgreSQL: https://www.postgresql.org
- JWT: https://jwt.io
- Postman: https://www.postman.com (API testing)

---

**Print this and keep it handy!**  
Last Updated: May 2024
