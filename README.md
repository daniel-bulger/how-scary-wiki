# How Scary Wiki

The ultimate collaborative guide to rating how scary things are across multiple dimensions. This app allows users to discover, rate, and explore scary content from movies, books, games, and more.

## Features

- **Google Knowledge Graph Integration**: Only verified entities from Google's Knowledge Graph can have wiki pages
- **AI-Powered Analysis**: Automatic scary analysis generation using Google's Vertex AI
- **Multi-dimensional Ratings**: Rate content across 5 scary dimensions:
  - Jump Scares
  - Gore/Violence  
  - Psychological Terror
  - Suspense/Tension
  - Disturbing Content
- **Firebase Authentication**: Secure user authentication with bot protection
- **Community Reviews**: Users can write and read reviews
- **Real-time Search**: Search for scary content with instant results

## Tech Stack

- **Frontend**: Next.js 14 with TypeScript and Tailwind CSS
- **Database**: PostgreSQL with Prisma ORM
- **Authentication**: Firebase Auth
- **AI**: Google Vertex AI (Gemini)
- **APIs**: Google Knowledge Graph Search API
- **Hosting**: Google Cloud Run
- **Storage**: Google Cloud SQL

## Setup

### Prerequisites

1. Google Cloud Project with enabled APIs:
   - Vertex AI API
   - Knowledge Graph Search API
   - Cloud SQL Admin API
   - Cloud Run API

2. Firebase project for authentication

3. PostgreSQL database (Cloud SQL recommended)

### Environment Variables

Create a `.env.local` file with the following variables:

```env
# Database
DATABASE_URL="postgresql://username:password@localhost:5432/howscary"

# Firebase Configuration
NEXT_PUBLIC_FIREBASE_API_KEY=""
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=""
NEXT_PUBLIC_FIREBASE_PROJECT_ID=""
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=""
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=""
NEXT_PUBLIC_FIREBASE_APP_ID=""

# Firebase Admin (Server-side)
FIREBASE_ADMIN_PROJECT_ID=""
FIREBASE_ADMIN_CLIENT_EMAIL=""
FIREBASE_ADMIN_PRIVATE_KEY=""

# Google APIs
GOOGLE_KNOWLEDGE_GRAPH_API_KEY=""

# Google Cloud AI
GOOGLE_CLOUD_PROJECT_ID=""
GOOGLE_CLOUD_LOCATION="us-central1"

# Next.js
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-secret-key-here"
```

### Installation

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```
3. Set up environment (choose development or production):
   ```bash
   # For development
   npm run setup:dev
   
   # For production
   npm run setup:prod
   ```
4. Update `.env.local` with your actual Firebase credentials
5. Set up the database:
   ```bash
   npm run db:generate
   npm run db:push
   npm run db:seed
   ```
6. Run the development server:
   ```bash
   npm run dev
   ```

### Environment Configuration

The app supports separate Firebase projects for development and production:

- **Development**: Uses `.env.development` template
- **Production**: Uses `.env.production` template

Use the setup scripts to quickly configure your environment:
```bash
npm run setup:dev    # Setup development environment
npm run setup:prod   # Setup production environment
```

### Deployment to Google Cloud Run

1. Build and deploy using Cloud Build:
   ```bash
   gcloud builds submit --config cloudbuild.yaml
   ```

2. Or manually build and deploy:
   ```bash
   docker build -t gcr.io/PROJECT_ID/how-scary-wiki .
   docker push gcr.io/PROJECT_ID/how-scary-wiki
   
   gcloud run deploy how-scary-wiki \
     --image gcr.io/PROJECT_ID/how-scary-wiki \
     --platform managed \
     --region us-central1 \
     --allow-unauthenticated
   ```

## API Endpoints

- `GET /api/knowledge-graph/search?query=QUERY` - Search Knowledge Graph
- `GET /api/knowledge-graph/entity?id=ID` - Get specific entity
- `POST /api/ai/analyze` - Generate AI scary analysis
- `GET /api/ratings?entityId=ID` - Get entity ratings
- `POST /api/ratings` - Submit user ratings
- `GET /api/reviews?entityId=ID` - Get entity reviews
- `POST /api/reviews` - Submit user review

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## License

This project is licensed under the Apache License 2.0 - see the LICENSE file for details.
