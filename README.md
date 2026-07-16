# Coal Learns — Learning Management System

**Coal Learns** is a modern, decoupled, and highly scalable Learning Management System (LMS) designed for performance, security, and exceptional user experiences. Built with a **React 19** frontend and an **Express.js / PostgreSQL** backend, it provides dedicated portals for both candidates and mentors.

---

## 🎯 Key Features

* **Dual Portals**: Custom environments for Candidates (students) and Tutors (mentors).


* **Progress Tracking**: Real-time course completion monitoring.


* **Certificate Generation**: Automatic PDF generation with secure, verifiable QR codes.


* **AI Learning Assistant**: Instant, context-aware student support powered by Gemini AI.



---

## 📁 Project Structure

```
Coal-Learns/
├── backend-pg/                    # Express.js REST API[cite: 1]
│   ├── src/
│   │   ├── config/               # Database pool, schemas & init scripts[cite: 1, 2]
│   │   ├── controllers/          # Business routing and input validation[cite: 1, 2]
│   │   ├── middleware/          # JWT, RBAC, Rate Limiting, and Error handlers[cite: 2]
│   │   ├── services/            # Pure database transaction queries[cite: 2]
│   │   └── server.js           # Express app entry point[cite: 1, 2]
│
└── unified-portal/               # React 19 + Vite Frontend SPA[cite: 1, 2]
    ├── src/
    │   ├── modules/            # Candidate & Tutor portal modules[cite: 2]
    │   ├── shared/             # Unified Axios client & global components[cite: 2]
    │   └── App.jsx             # React Router config[cite: 1, 2]

```

---

## 🛠️ Tech Stack Details

| Layer | Technologies Used | Key Technical Features |
| --- | --- | --- |
| **Frontend** | React 19, Vite, Context API, Axios

 | Concurrent rendering, localized session hooks, dynamic token-injection interceptors.

 |
| **Backend** | Node.js, Express.js, Helmet, Joi

 | Rate-limiting, validation schemas, global dynamic CORS, structured MVC workflow.

 |
| **Database** | PostgreSQL 12+, Connection Pool (`pg`)

 | Transaction blocks, GIN full-text search, composite index performance optimization.

 |

---

## 📊 Core Features Legend

Below is a quick-reference legend mapping our application's core capabilities to their primary access roles and underlying database tables:

| Icon | Core Feature | Authorized Roles | Affected Database Tables |
| --- | --- | --- | --- |
| 🔐 | **Authentication & RBAC** | Public, Candidate, Mentor, Admin | `users`<br> |
| 📚 | **Course & Module Builder** | Mentors, Admins | `courses`, `modules`, `content`, `course_tutors`<br> |
| 📁 | **Asset Storage** | Mentors, Admins | `uploaded_files`<br> |
| 📈 | **Enrollments & Progress** | Candidates | `enrollments`, `progress`<br> |
| 🏅 | **Certificates & Verifier** | Candidates, Public Verifiers | `certificates`, `users`, `courses`<br> |
| 🤖 | **AI Assistant** | Candidates | `content`, `courses`<br> |

---

## ⚙️ Core Feature Workflows & Technical Deep Dives

### 1. Secure Authentication & RBAC 🔐

* **Flow**: Register/Login Form ➔ Server-Side Joi Validation ➔ `bcryptjs` Hashing (12 rounds) ➔ PostgreSQL Save ➔ Signed JWT issued (scoped by role).


* **Technical Details**: Frontend stores tokens in `localStorage` (`CANDIDATE_AUTH_TOKEN` or `TUTOR_AUTH_TOKEN`). Custom `rbac.js` and `auth.js` middlewares enforce route-level access rules.



### 2. Course & Module Builder 📚

* **Flow**: Tutor populates details ➔ Save triggers transaction ➔ Rows written to parent and children tables ➔ Toggle publish status.


* **Technical Details**: Utilizes transaction blocks to maintain structural integrity across related tables. Optimizations include B-tree indexing on foreign keys and a GIN full-text index for fast title/description searches.



### 3. Asset Storage 📁

* **Flow**: User drags media ➔ Uploaded to `/api/upload` as `multipart/form-data` ➔ Server validates type/size ➔ File stored and metadata saved to DB.


* **Technical Details**: Prevents security issues by verifying file headers and standardizing filenames on save.



### 4. Enrollments & Progress Engine 📈

* **Flow**: Student enrolls ➔ Progress schema initialized ➔ Student completes lesson ➔ Click "Mark Complete" ➔ UI calls progress API and recalculates completion rate.


* **Technical Details**: Enforces a unique composite key constraint on `(user_id, course_id)` in the `enrollments` table to prevent duplicate enrollments.



### 5. Automated Certificates 🏅

* **Flow**: Progress reaches 100% ➔ Certificate service triggers ➔ Unique certificate verification payload created ➔ Dynamic PDF with QR code generated and saved.


* **Technical Details**: Certificates are linked directly to specific student enrollments and verified on a public route without requiring login access.



### 6. AI Assistant 🤖

* **Flow**: Student submits question ➔ API queries backend ➔ System retrieves course context from DB ➔ Payload secure-sent to Gemini API ➔ Response rendered in chat UI.


* **Technical Details**: Enhances chat relevance using prompt injection context, and keeps sensitive `GEMINI_API_KEY` environment variables isolated on the backend.



---

## 🚀 Getting Started

### Local Development Setup

#### 1. Configure the Backend

```bash
cd backend-pg
npm install
cp .env.example .env

```

Update your `.env` file with your credentials:

```env
PORT=5001
PG_URI=postgresql://<user>:<password>@localhost:5432/coal_learns_db
JWT_SECRET=your_secret_key
GEMINI_API_KEY=your_gemini_key

```

Initialize the PostgreSQL tables and start the API:

```bash
npm run db:init
npm run dev

```

#### 2. Configure the Frontend

```bash
cd ../unified-portal
npm install
cp .env.example .env

```

Ensure your `.env` connects directly to the local backend port:

```env
VITE_API_URL=http://localhost:5001/api

```

Start the local development server:

```bash
npm run dev

```

---

## 🚢 Production Deployment


* **Database**: Set up a managed database instance on **Supabase** (with `sslmode=require`).


* **Backend REST API**: Deploy to **Render** (set environment variables, `NODE_ENV=production`).


* **Frontend SPA**: Deploy to **Vercel** pointing towards your production API domain.
