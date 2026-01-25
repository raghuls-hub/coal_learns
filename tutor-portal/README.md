# 🎓 Tutor Portal - LMS Platform

Complete frontend for course handlers to create and manage their courses.

## ✨ Features

- **Dashboard** - Revenue stats, enrollment metrics, course overview
- **My Courses** - View and manage all your courses
- **Create Course** - Easy course creation with pricing calculator
- **Course Management** - Edit, publish/unpublish, delete courses
- **Real-time Stats** - Track students, revenue, and engagement

## 🚀 Quick Start

### Install Dependencies

```bash
cd tutor-portal
npm install
```

### Run Development Server

```bash
npm run dev
```

Opens on **http://localhost:3002**

## 🔑 Login Credentials

Create a course handler user first:

```bash
# Create tutor/course handler via backend API
$body = @{
  email = "tutor@lms.com"
  password = "Tutor123!"
  role = "course_handler"
  profile = @{
    firstName = "John"
    lastName  = "Tutor"
  }
} | ConvertTo-Json -Depth 5

Invoke-RestMethod -Uri "http://localhost:5000/api/auth/register" -Method POST -ContentType "application/json" -Body $body
```

Then login at http://localhost:3002 with:
- Email: `tutor@lms.com`
- Password: `Tutor123!`

## 📱 Pages

### 1. Dashboard (`/dashboard`)
- Course statistics
- Revenue overview
- Quick actions
- Tips for success

### 2. My Courses (`/my-courses`)
- List all your courses
- View stats (students, revenue, modules)
- Edit, publish, delete actions
- Empty state with call-to-action

### 3. Create Course (`/create-course`)
- Course title & description
- Category & level selection
- Pricing with commission calculator
- Real-time earnings preview

## 🎨 Design

- **Color Theme:** Green gradient (#48bb78 to #38a169)
- **Style:** Clean, modern cards with shadows
- **Responsive:** Works on all screen sizes
- **Icons:** Emojis for quick visual understanding

## 📊 API Integration

Connects to backend API at `http://localhost:5000`:
- `GET /api/courses` - Fetch tutor's courses
- `POST /api/courses` - Create new course
- `PUT /api/courses/:id/publish` - Toggle publish status
- `DELETE /api/courses/:id` - Delete course

## 🔒 Permissions

- Only `course_handler` and `tutor` roles can access
- Automatic token refresh on expiry
- Protected routes with redirects

## 🛠️ Tech Stack

- **React 18** with hooks
- **React Router** for navigation
- **Axios** for API calls
- **Vite** for fast development
- **Inline CSS** for simplicity

## 📝 Next Steps

After creating a course:
1. Add modules to structure content
2. Upload videos and PDFs
3. Create assessments
4. Publish course
5. Share with students!

---

**Built for Course Handlers** 💚
