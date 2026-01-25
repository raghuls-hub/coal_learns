# MERN Learning Management System (LMS)

A comprehensive three-portal Learning Management System built with the MERN stack, featuring secure examination, AI-powered learning assistance with Gemini API, and blockchain-based certificate verification.

## 🎯 Features

### Three Portals
- **Admin Portal** - Complete system management
- **Tutor/Course Handler Portal** - Course creation and learner analytics
- **Candidate Portal** - Learning experience with AI assistance

### Core Capabilities
✅ **Course Management** - Modular courses with videos, PDFs, and assessments  
✅ **Secure Examinations** - Browser lockdown and AI proctoring  
✅ **AI Learning Assistant** - Gemini-powered context-aware doubt clarification  
✅ **Blockchain Certificates** - Polygon/Ethereum-verified certificates  
✅ **Payment Integration** - Stripe for enrollments and payouts  
✅ **Progress Tracking** - Detailed analytics and learning paths  
✅ **Anti-Malpractice** - Comprehensive proctoring and violation detection  

---

## 🏗️ Architecture

```
LMS.2.0/
├── backend/                 # Node.js + Express API
│   ├── src/
│   │   ├── config/         # Database, JWT, integrations
│   │   ├── models/         # Mongoose schemas
│   │   ├── controllers/    # Request handlers
│   │   ├── services/       # Business logic
│   │   ├── routes/         # API endpoints
│   │   ├── middleware/     # Auth, RBAC, validation
│   │   └── utils/          # Helper functions
│   ├── package.json
│   └── .env
├── admin-portal/            # React admin interface
├── tutor-portal/            # React tutor interface
├── candidate-portal/        # React learner interface
├── blockchain/              # Smart contracts
└── docker-compose.yml       # Multi-container setup
```

---

## 🚀 Quick Start

### Prerequisites
- **Node.js** 18+ and npm
- **MongoDB** 4.4+ (local or Atlas)
- **Redis** (optional, for caching)
- **Docker** (optional, for containerized deployment)

### 1. Clone and Install

```bash
# Navigate to project
cd d:\Antigravity\LMS.2.0

# Install backend dependencies
cd backend
npm install

# Install frontend dependencies (each portal)
cd ../admin-portal
npm install

cd ../tutor-portal
npm install

cd ../candidate-portal
npm install
```

### 2. Configure Environment

```bash
# Backend configuration
cd backend
# Edit .env file with your API keys and configuration
```

**Required Environment Variables:**
- `MONGO_URI` - MongoDB connection string
- `JWT_SECRET` and `JWT_REFRESH_SECRET` - JWT signing keys
- `GEMINI_API_KEY` - Google Gemini API key
- `STRIPE_SECRET_KEY` - Stripe payment key
- `AWS_ACCESS_KEY_ID` and `AWS_SECRET_ACCESS_KEY` - S3 storage
- `POLYGON_RPC_URL` and `BLOCKCHAIN_PRIVATE_KEY` - Blockchain cert

See `backend/.env.example` for all configuration options.

### 3. Start MongoDB

```bash
# Local MongoDB
mongod

# OR use MongoDB Atlas (cloud)
# Update MONGO_URI in .env with your Atlas connection string
```

### 4. Run the Application

**Development Mode:**

```bash
# Terminal 1: Backend API
cd backend
npm run dev
# Runs on http://localhost:5000

# Terminal 2: Admin Portal
cd admin-portal
npm run dev
# Runs on http://localhost:3001

# Terminal 3: Tutor Portal
cd tutor-portal
npm run dev
# Runs on http://localhost:3002

# Terminal 4: Candidate Portal
cd candidate-portal
npm run dev
# Runs on http://localhost:3003
```

**Docker (All Services):**

```bash
# From project root
docker-compose up --build

# Access:
#  - Backend API: http://localhost:5000
#  - Admin Portal: http://localhost:3001
#  - Tutor Portal: http://localhost:3002
#  - Candidate Portal: http://localhost:3003
```

---

## 📚 API Documentation

### Authentication Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/register` | Register new user |
| POST | `/api/auth/login` | User login |
| POST | `/api/auth/refresh` | Refresh access token |
| GET | `/api/auth/me` | Get current user |
| POST | `/api/auth/forgot-password` | Request password reset |
| POST | `/api/auth/reset-password` | Reset password |

### Course Management (Future endpoints)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/courses` | List all courses |
| POST | `/api/courses` | Create course (Course Handler) |
| GET | `/api/courses/:id` | Get course details |
| PUT | `/api/courses/:id` | Update course |
| DELETE | `/api/courses/:id` | Delete course |

_See [architecture.md](file:///C:/Users/M%20RAGHUL/.gemini/antigravity/brain/b6956ec5-cf92-4808-88e8-4b65c1e081c3/architecture.md) for complete API design._

---

## 🧪 Testing

```bash
# Backend unit tests
cd backend
npm test

# Backend integration tests
npm run test:integration
```

---

## 🔒 Security Features

- **JWT Authentication** - Access and refresh tokens
- **RBAC** - Role-based permissions (Admin, Course Handler, Tutor, Candidate)
- **Password Hashing** - bcrypt with 12 salt rounds
- **Rate Limiting** - 100 requests per 15 minutes
- **Input Validation** - Joi schemas for all endpoints
- **Helmet.js** - Security headers
- **CORS** - Configured for multi-portal access

---

## 🌐 Deployment

### Environment Setup
1. Set `NODE_ENV=production`
2. Configure production database (MongoDB Atlas recommended)
3. Update CORS origins to production URLs
4. Set strong JWT secrets
5. Configure AWS S3 bucket with proper IAM roles
6. Deploy smart contract to Polygon mainnet
7. Set up SSL certificates

### Recommended Platforms
- **Backend**: AWS EC2, Google Cloud Run, Heroku
- **Frontend**: Vercel, Netlify, AWS S3 + CloudFront
- **Database**: MongoDB Atlas
- **Storage**: AWS S3, Cloudinary
- **Blockchain**: Polygon (Matic) or Ethereum

---

## 📖 Documentation

- [System Architecture](file:///C:/Users/M%20RAGHUL/.gemini/antigravity/brain/b6956ec5-cf92-4808-88e8-4b65c1e081c3/architecture.md) - Complete system design
- [Implementation Plan](file:///C:/Users/M%20RAGHUL/.gemini/antigravity/brain/b6956ec5-cf92-4808-88e8-4b65c1e081c3/implementation_plan.md) - Development roadmap

---

## 🛠️ Technology Stack

**Backend:**
- Node.js + Express.js
- MongoDB + Mongoose
- JWT for authentication
- Google Gemini AI API
- Stripe API
- AWS SDK (S3)
- Ethers.js (Blockchain)

**Frontend:**
- React 18
- Vite (Build tool)
- React Router
- Axios
- React Query (Data fetching)

**DevOps:**
- Docker & Docker Compose
- MongoDB (Database)
- Redis (Caching)
- Nginx (Reverse proxy)

---

## 📝 Current Implementation Status

### ✅ Completed
- [x] Project structure and configuration
- [x] Backend core infrastructure
- [x] All database models (User, Course, Module, Content, Assessment, Enrollment, Progress, Exam, Certificate, Payment)
- [x] Authentication system (Register, Login, Password Reset)
- [x] Middleware (Auth, RBAC, Error Handling, Validation)
- [x] Express server setup
- [x] Environment configuration

### 🚧 In Progress / To be Implemented
- [ ] Course management API endpoints
- [ ] Content upload and storage (S3 integration)
- [ ] Assessment engine
- [ ] Progress tracking system
- [ ] Gemini AI integration
- [ ] Proctoring system
- [ ] Blockchain certificate service
- [ ] Stripe payment integration
- [ ] Frontend portals (Admin, Tutor, Candidate)
- [ ] Analytics and reporting

---

## 🤝 Contributing

This is a hackathon/portfolio project demonstrating full-stack MERN development with advanced integrations.

---

## 📄 License

MIT License - See LICENSE file for details

---

## 👨‍💻 Support

For questions or issues, please refer to the architecture and implementation plan documents, or create an issue in the repository.

---

**Built with ❤️ using the MERN stack**
