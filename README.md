# Coal Learns (Unified LMS)

A modern, high-performance Learning Management System (LMS) designed for a seamless, unified experience between students (Candidates) and teachers (Mentors).

## 🚀 Overview

Coal Learns is a unified platform featuring a premium "Midnight Obsidian" design system. It allows mentors to create and manage professional courses while providing candidates with a structured learning path, progress tracking, and verified certificates.

### Key Features
- **Unified Entry**: A single landing page directing users to specialized Candidate or Tutor portals.
- **Namespaced Authentication**: Secure, independent login systems for different roles using JWT.
- **Role-Based Login Security**: Backend validation to prevent cross-portal unauthorized access.
- **Professional Dashboards**: Interactive charts and analytics powered by Recharts.
- **Certificate Engine**: Automated PDF generation with integrated QR code verification.
- **Learning Interface**: Module-locked progress tracking to ensure structured learning.

## 🛠️ Tech Stack

### Frontend (`/unified-portal`)
- **Framework**: React 19 & Vite 6
- **Routing**: React Router 7 (Namespaced)
- **Data Visualization**: Recharts
- **Notifications**: React Hot Toast
- **Theming**: Custom "Midnight Obsidian" CSS (Atomic Design)
- **Networking**: Axios with global interceptors

### Backend (`/backend`)
- **Runtime**: Node.js & Express
- **Database**: MongoDB & Mongoose
- **Security**: JWT (Authentication), bcryptjs (Hashing), Helmet & Rate Limiting
- **Mailing**: Nodemailer
- **Media**: Multer & PDFKit
- **Integration**: Stripe (Payments), Redis (Caching), Google Generative AI

## 📂 Project Structure

```bash
LMS.2.0/
├── backend/               # Express API & Business Logic
│   ├── src/
│   │   ├── controllers/   # Route handlers
│   │   ├── models/        # Database schemas
│   │   ├── routes/        # API endpoints
│   │   └── services/      # Core business services
├── unified-portal/        # Unified React Frontend
│   ├── src/
│   │   ├── modules/
│   │   │   ├── candidate/ # Student portal
│   │   │   └── tutor/     # Teacher portal
│   │   └── shared/        # Common components & API config
└── README.md              # This file
```

## ⚙️ Getting Started

### 1. Prerequisites
- Node.js (v18+)
- MongoDB (Running locally or via Atlas)

### 2. Backend Setup
```bash
cd backend
npm install
# Create a .env file based on .env.example
npm run dev
```

### 3. Frontend Setup
```bash
cd unified-portal
npm install
npm run dev
```

The application will be available at `http://localhost:3000`.

## 🔒 Security Measures
- **Cross-Portal Isolation**: Mentors cannot access candidate routes and vice-versa.
- **CSRF Protection**: Standard HTTP security headers via Helmet.
- **Session Management**: Namespaced LocalStorage keys (`CANDIDATE_AUTH_TOKEN` vs `TUTOR_AUTH_TOKEN`).

---
Developed with focus on performance, security, and premium aesthetics.
