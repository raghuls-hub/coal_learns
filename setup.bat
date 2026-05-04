@echo off
REM LMS 2.0 - Quick Setup Script for Windows
REM This script helps set up the project locally

echo.
echo 🚀 LMS 2.0 Setup Script
echo ========================
echo.

REM Check prerequisites
echo 📋 Checking prerequisites...

node --version >nul 2>&1
if errorlevel 1 (
    echo ❌ Node.js is not installed. Please install Node.js 16+ first.
    pause
    exit /b 1
)
for /f "tokens=*" %%i in ('node --version') do set NODE_VERSION=%%i
echo ✅ Node.js %NODE_VERSION% found

npm --version >nul 2>&1
if errorlevel 1 (
    echo ❌ npm is not installed.
    pause
    exit /b 1
)
for /f "tokens=*" %%i in ('npm --version') do set NPM_VERSION=%%i
echo ✅ npm %NPM_VERSION% found

REM Setup Backend
echo.
echo 🔧 Setting up Backend...
cd backend-pg

if not exist ".env" (
    echo 📄 Creating .env from .env.example...
    copy .env.example .env
    echo ⚠️  Please update backend-pg\.env with your database credentials
) else (
    echo ✅ Backend .env already exists
)

if not exist "node_modules" (
    echo 📦 Installing backend dependencies...
    call npm install
) else (
    echo ✅ Backend dependencies already installed
)

echo ✅ Backend setup complete

REM Setup Frontend
echo.
echo 🎨 Setting up Frontend...
cd ..\unified-portal

if not exist ".env" (
    echo 📄 Creating .env from .env.example...
    copy .env.example .env
    echo ⚠️  Update unified-portal\.env if needed ^(for API URL^)
) else (
    echo ✅ Frontend .env already exists
)

if not exist "node_modules" (
    echo 📦 Installing frontend dependencies...
    call npm install
) else (
    echo ✅ Frontend dependencies already installed
)

echo ✅ Frontend setup complete

REM Summary
echo.
echo ================================
echo ✅ Setup complete!
echo ================================
echo.
echo 📝 Next steps:
echo.
echo 1. Backend setup:
echo    cd backend-pg
echo    REM Update .env with your database credentials
echo    npm run db:init  REM Initialize database
echo    npm run dev      REM Start backend server
echo.
echo 2. Frontend setup ^(in new terminal^):
echo    cd unified-portal
echo    npm run dev      REM Start frontend
echo.
echo 3. Open http://localhost:3000 in your browser
echo.
echo 📚 For deployment instructions, see DEPLOYMENT_GUIDE.md
echo.
pause
