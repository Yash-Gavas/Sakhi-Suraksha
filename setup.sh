#!/bin/bash

# Sakhi Suraksha - Local Development Setup Script
echo "🚀 Setting up Sakhi Suraksha for local development..."

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js 18+ first."
    echo "   Visit: https://nodejs.org/en/download/"
    exit 1
fi

# Check Node.js version
NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 18 ]; then
    echo "❌ Node.js version 18+ required. Current version: $(node -v)"
    exit 1
fi

echo "✅ Node.js $(node -v) detected"

# Check if npm is installed
if ! command -v npm &> /dev/null; then
    echo "❌ npm is not installed"
    exit 1
fi

echo "✅ npm $(npm -v) detected"

# Install dependencies if node_modules doesn't exist
if [ ! -d "node_modules" ]; then
    echo "📦 Installing dependencies..."
    npm install
    if [ $? -ne 0 ]; then
        echo "❌ Failed to install dependencies"
        exit 1
    fi
    echo "✅ Dependencies installed successfully"
else
    echo "✅ Dependencies already installed"
fi

# Check if .env file exists
if [ ! -f ".env" ]; then
    echo "⚠️  .env file not found. Creating from .env.example..."
    if [ -f ".env.example" ]; then
        cp .env.example .env
        echo "✅ .env file created from .env.example"
        echo "📝 Please edit .env file with your actual API keys"
    else
        echo "❌ .env.example file not found"
        exit 1
    fi
else
    echo "✅ .env file exists"
fi

# Check if PostgreSQL is installed and running
if command -v psql &> /dev/null; then
    echo "✅ PostgreSQL is installed"
    
    # Try to connect to PostgreSQL
    if sudo -u postgres psql -c '\l' &> /dev/null; then
        echo "✅ PostgreSQL is running"
        
        # Check if database exists
        if sudo -u postgres psql -lqt | cut -d \| -f 1 | grep -qw sakhi_suraksha; then
            echo "✅ sakhi_suraksha database exists"
        else
            echo "📊 Creating sakhi_suraksha database..."
            sudo -u postgres createdb sakhi_suraksha
            if [ $? -eq 0 ]; then
                echo "✅ Database created successfully"
            else
                echo "❌ Failed to create database"
                exit 1
            fi
        fi
    else
        echo "⚠️  PostgreSQL is not running. Starting PostgreSQL..."
        sudo systemctl start postgresql
        if [ $? -eq 0 ]; then
            echo "✅ PostgreSQL started successfully"
        else
            echo "❌ Failed to start PostgreSQL"
            echo "   Please start PostgreSQL manually: sudo systemctl start postgresql"
            exit 1
        fi
    fi
else
    echo "⚠️  PostgreSQL is not installed"
    echo "   Install with: sudo apt update && sudo apt install postgresql postgresql-contrib"
    echo "   Or visit: https://www.postgresql.org/download/"
    
    # Ask if user wants to continue without PostgreSQL (using memory storage)
    read -p "Continue with in-memory storage? (y/n): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 1
    fi
    
    # Update .env to use memory storage
    if [ -f ".env" ]; then
        sed -i 's/USE_MEMORY_STORAGE=false/USE_MEMORY_STORAGE=true/' .env
        echo "✅ Configured to use in-memory storage"
    fi
fi

# Run database setup if PostgreSQL is available
if command -v psql &> /dev/null && sudo -u postgres psql -c '\l' &> /dev/null; then
    echo "🔧 Setting up database schema..."
    npm run db:generate
    npm run db:push
    
    if [ $? -eq 0 ]; then
        echo "✅ Database schema setup complete"
    else
        echo "⚠️  Database setup failed, but continuing..."
    fi
fi

# Create necessary directories
echo "📁 Creating necessary directories..."
mkdir -p logs
mkdir -p uploads
mkdir -p server/emergency-recordings
mkdir -p backups

echo "✅ Directories created"

# Set permissions
chmod +x setup.sh
chmod +x start.sh

echo ""
echo "🎉 Setup complete!"
echo ""
echo "📋 Next steps:"
echo "   1. Edit .env file with your API keys"
echo "   2. Run: npm run dev"
echo "   3. Open: http://localhost:5000"
echo ""
echo "🔧 Useful commands:"
echo "   npm run dev          - Start development server"
echo "   npm run dev:debug    - Start with debug logging"
echo "   npm run db:studio    - Open database GUI"
echo "   npm test             - Run tests"
echo ""
echo "📖 For detailed setup instructions, see: LOCAL_SETUP.md"
echo ""