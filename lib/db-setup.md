# Neon Database Setup Instructions

## 1. Create Neon Database

1. Go to [neon.tech](https://neon.tech) and sign up/login
2. Create a new project
3. Choose a region close to your users
4. Note down the connection string provided

## 2. Environment Variables

Add these to your `.env.local` file:

```env
# Neon Database
DATABASE_URL="postgresql://username:password@host/database?sslmode=require"

# For quiz generation system
CRON_SECRET="your-secure-random-string-here"
```

## 3. Database Schema Setup

Run the schema file to set up tables:

```bash
# Connect to your Neon database and run:
psql "postgresql://username:password@host/database?sslmode=require" -f database/schema.sql
```

Or use Neon's SQL Editor in their dashboard to run the schema.sql content.

## 4. Verify Connection

Test the database connection by running:

```bash
npm run dev
```

Then visit: `http://localhost:3000/api/test-db` (we'll create this endpoint)

## 5. Database Tables Created

- `quiz_jobs` - Tracks quiz generation pipeline (4 steps)
- `uploaded_videos` - Tracks successfully uploaded YouTube videos
- Indexes for performance optimization
- Triggers for automatic timestamp updates

## 6. Connection Pool

The app uses PostgreSQL connection pooling for optimal performance:
- Pool reuse for multiple requests
- SSL configuration for production
- Automatic connection management