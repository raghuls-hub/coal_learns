#!/bin/bash
# LMS 2.0 - Quick Setup Script
# This script helps set up the project locally

set -e

echo "🚀 LMS 2.0 Setup Script"
echo "========================"
echo ""

# Check prerequisites
echo "📋 Checking prerequisites..."
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js 16+ first."
    exit 1
fi
echo "✅ Node.js $(node --version) found"

if ! command -v npm &> /dev/null; then
    echo "❌ npm is not installed."
    exit 1
fi
echo "✅ npm $(npm --version) found"

# Setup Backend
echo ""
echo "🔧 Setting up Backend..."
cd backend-pg

if [ ! -f ".env" ]; then
    echo "📄 Creating .env from .env.example..."
    cp .env.example .env
    echo "⚠️  Please update backend-pg/.env with your database credentials"
else
    echo "✅ Backend .env already exists"
fi

if [ ! -d "node_modules" ]; then
    echo "📦 Installing backend dependencies..."
    npm install
else
    echo "✅ Backend dependencies already installed"
fi

echo "✅ Backend setup complete"

# Setup Frontend
echo ""
echo "🎨 Setting up Frontend..."
cd ../unified-portal

if [ ! -f ".env" ]; then
    echo "📄 Creating .env from .env.example..."
    cp .env.example .env
    echo "⚠️  Update unified-portal/.env if needed (for API URL)"
else
    echo "✅ Frontend .env already exists"
fi

if [ ! -d "node_modules" ]; then
    echo "📦 Installing frontend dependencies..."
    npm install
else
    echo "✅ Frontend dependencies already installed"
fi

echo "✅ Frontend setup complete"

# Summary
echo ""
echo "================================"
echo "✅ Setup complete!"
echo "================================"
echo ""
echo "📝 Next steps:"
echo ""
echo "1. Backend setup:"
echo "   cd backend-pg"
echo "   # Update .env with your database credentials"
echo "   npm run db:init  # Initialize database"
echo "   npm run dev      # Start backend server"
echo ""
echo "2. Frontend setup (in new terminal):"
echo "   cd unified-portal"
echo "   npm run dev      # Start frontend"
echo ""
echo "3. Open http://localhost:3000 in your browser"
echo ""
echo "📚 For deployment instructions, see DEPLOYMENT_GUIDE.md"
echo ""
