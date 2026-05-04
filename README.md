# LMS 2.0 — Learning Management System

A modern, scalable Learning Management System built with **React**, **Express.js**, and **PostgreSQL**.

## 🎯 Features

- **Student Portal**: Browse courses, enroll, learn, and earn certificates
- **Tutor Portal**: Create and manage courses with modules and content
- **AI Assistant**: Integrated AI-powered learning assistance
- **Certificate Generation**: Digital certificates with QR codes
- **Progress Tracking**: Real-time course progress monitoring
- **Role-Based Access Control**: Admin, Mentor, and Candidate roles
- **Responsive Design**: Works on desktop, tablet, and mobile

---

## 📁 Project Structure

```
LMS.2.0/
├── backend-pg/                    # Express.js API
│   ├── src/
│   │   ├── config/               # Database, JWT, initialization
│   │   ├── controllers/          # Business logic
│   │   ├── routes/              # API endpoints
│   │   ├── middleware/          # Auth, validation, error handling
│   │   ├── services/            # Database operations
│   │   ├── utils/               # Helper functions
│   │   ├── app.js              # Express app setup
│   │   └── server.js           # Server entry point
│   ├── package.json
│   ├── .env.example
│   └── render.yaml             # Render deployment config
│
├── unified-portal/               # React + Vite frontend
│   ├── src/
│   │   ├── modules/            # Candidate & Tutor modules
│   │   ├── shared/             # Shared API and components
│   │   ├── pages/              # Landing page, etc.
│   │   ├── App.jsx
│   │   └── main.jsx
│   ├── package.json
│   ├── vite.config.js
│   ├── .env.example
│   └── vercel.json             # Vercel deployment config
│
└── DEPLOYMENT_GUIDE.md         # Complete deployment instructions
```

---

## 🚀 Quick Start

### Prerequisites

- Node.js 16+ and npm/yarn
- PostgreSQL 12+ (or Supabase account for cloud database)
- Git

### Local Development

#### 1. Clone Repository

```bash
git clone https://github.com/your-repo/LMS.2.0.git
cd LMS.2.0
```

#### 2. Backend Setup

```bash
cd backend-pg

# Install dependencies
npm install

# Create .env file from example
cp .env.example .env

# Update .env with your database credentials
# PG_URI=postgresql://user:password@localhost:5432/lms_pg

# Initialize database
npm run db:init

# Start development server
npm run dev
# Backend runs on http://localhost:5001
```

#### 3. Frontend Setup

```bash
cd ../unified-portal

# Install dependencies
npm install

# Create .env file from example
cp .env.example .env

# Update .env with API URL
# VITE_API_URL=http://localhost:5001/api

# Start development server
npm run dev
# Frontend runs on http://localhost:3000
```

#### 4. Access Application

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:5001/api
- **Health Check**: http://localhost:5001/api/health

---

## 🔐 Environment Variables

### Backend (`.env`)

```bash
# Server
NODE_ENV=development
PORT=5001

# Database (PostgreSQL)
PG_URI=postgresql://user:password@localhost:5432/lms_pg

# JWT Authentication
JWT_SECRET=your_secret_key_here
JWT_REFRESH_SECRET=your_refresh_secret_here
JWT_EXPIRY=15m
JWT_REFRESH_EXPIRY=7d

# Application
APP_URL=http://localhost:3000

# Optional
GEMINI_API_KEY=your_gemini_api_key_here
BCRYPT_ROUNDS=12
```

### Frontend (`.env`)

```bash
# API Configuration
VITE_API_URL=http://localhost:5001/api
VITE_DEBUG_MODE=true
```

---

## 🗄️ Database Schema

### Key Tables

- **users**: User accounts and profiles
- **courses**: Course information
- **modules**: Course modules/sections
- **content**: Learning content (videos, PDFs, notes)
- **enrollments**: Student course enrollments
- **progress**: Student learning progress
- **certificates**: Generated certificates
- **uploaded_files**: User-uploaded content (stored in DB)

### Initialize Database

```bash
# From backend-pg directory
npm run db:init
```

This creates all tables and indexes defined in `src/config/schema.sql`.

---

## 📚 API Documentation

### Authentication Endpoints

```bash
# Register
POST /api/auth/register
{
  "email": "user@example.com",
  "password": "SecurePassword123!",
  "firstName": "John",
  "lastName": "Doe",
  "role": "candidate"
}

# Login
POST /api/auth/login
{
  "email": "user@example.com",
  "password": "SecurePassword123!"
}

# Refresh Token
POST /api/auth/refresh-token
```

### Courses Endpoints

```bash
# Get all courses
GET /api/courses

# Get course details
GET /api/courses/:courseId

# Create course (tutor only)
POST /api/courses
Authorization: Bearer <token>

# Enroll in course
POST /api/enrollments/:courseId
Authorization: Bearer <token>
```

### Progress Endpoints

```bash
# Get user progress
GET /api/progress
Authorization: Bearer <token>

# Update progress
PUT /api/progress/:contentId
Authorization: Bearer <token>
```

### Certificate Endpoints

```bash
# Get certificates
GET /api/certificates
Authorization: Bearer <token>

# Verify certificate
GET /api/certificates/verify/:certificateId
```

---

## 🛠️ Development

### Run Tests

```bash
# Backend
cd backend-pg
npm test

# Frontend
cd ../unified-portal
npm run lint
```

### Build for Production

```bash
# Frontend
cd unified-portal
npm run build

# Output in: unified-portal/dist/
```

---

## 🚢 Deployment

### Production Deployment

See **[DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md)** for complete instructions on deploying to:

- **Frontend**: Vercel
- **Backend**: Render
- **Database**: Supabase PostgreSQL

Quick summary:

1. **Database**: Set up Supabase PostgreSQL
2. **Backend**: Deploy to Render
3. **Frontend**: Deploy to Vercel

All platforms support automatic deployment from GitHub.

---

## 🔒 Security

- **JWT Authentication**: Secure token-based auth
- **Password Hashing**: bcryptjs with configurable rounds
- **CORS Protection**: Configured origins and credentials
- **Rate Limiting**: API rate limiting in production
- **SQL Injection Prevention**: Parameterized queries
- **File Upload Security**: Size limits and validation
- **Helmet.js**: Security headers configuration

---

## 📊 Monitoring

### Backend (Render)

- CPU/Memory usage
- Error logs and monitoring
- Automatic restart on crash
- Performance metrics

### Frontend (Vercel)

- Analytics and performance
- Error tracking
- Deployment history
- Auto-preview deployments

### Database (Supabase)

- Query performance metrics
- Connection pool monitoring
- Automatic backups
- Database logs

---

## 🐛 Troubleshooting

### "Cannot find module" errors

```bash
# Clear node_modules and reinstall
rm -rf node_modules package-lock.json
npm install
```

### Database connection fails

```bash
# Verify PG_URI format:
# postgresql://user:password@host:port/database

# For Supabase:
# postgresql://postgres:[password]@[host]:[port]/postgres?sslmode=require
```

### Frontend shows blank page

```bash
# Check browser console (F12) for errors
# Verify VITE_API_URL is set correctly
# Ensure backend is running and accessible
```

### CORS errors

```bash
# Update APP_URL in backend environment
# Format: https://your-frontend-domain.com
# Restart backend after changing
```

---

## 📝 API Response Format

All API endpoints follow this format:

```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "name": "Example"
  },
  "message": "Success message",
  "timestamp": "2024-05-04T10:30:00.000Z"
}
```

---

## 🤝 Contributing

1. Create a feature branch: `git checkout -b feature/amazing-feature`
2. Commit changes: `git commit -m 'Add amazing feature'`
3. Push to branch: `git push origin feature/amazing-feature`
4. Open a Pull Request

---

## 📄 License

This project is private and proprietary.

---

## 👨‍💼 Support

For issues or questions:

- Check [DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md)
- Review [CODEBASE_ANALYSIS_REPORT.md](./CODEBASE_ANALYSIS_REPORT.md)
- Open an issue in the repository

---

**Version**: 2.0.0  
**Last Updated**: May 2024  
**Tech Stack**: React 19 • Node.js • Express • PostgreSQL • Vite
