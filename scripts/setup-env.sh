#!/bin/bash

# Setup Environment Script for How Scary Wiki

ENV=${1:-development}

echo "Setting up environment: $ENV"

if [ "$ENV" = "development" ]; then
    echo "Copying .env.development to .env.local"
    cp .env.development .env.local
    echo "✅ Development environment configured"
    echo "📝 Please update the values in .env.local with your actual development Firebase credentials"
elif [ "$ENV" = "production" ]; then
    echo "Copying .env.production to .env.local"
    cp .env.production .env.local
    echo "✅ Production environment configured"
    echo "📝 Please update the values in .env.local with your actual production Firebase credentials"
else
    echo "❌ Invalid environment. Use 'development' or 'production'"
    echo "Usage: ./scripts/setup-env.sh [development|production]"
    exit 1
fi

echo ""
echo "🔧 Next steps:"
echo "1. Update .env.local with your actual credentials"
echo "2. Run 'npm run db:generate' to generate Prisma client"
echo "3. Run 'npm run db:push' to sync database schema"
echo "4. Run 'npm run db:seed' to seed initial data"
echo "5. Run 'npm run dev' to start development server"