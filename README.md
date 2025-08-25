# Universal YouTube Uploader - Web App

A modern web application that allows users to upload multiple videos to their YouTube channels with intelligent playlists, smart descriptions, and automatic content detection.

## ✨ Features

- 🔐 **Google OAuth Authentication** - Users sign in with their own Google/YouTube accounts
- 📁 **Drag & Drop Upload** - Easy file selection with support for multiple video formats
- 🧠 **Smart Content Detection** - Automatically detects content type and generates appropriate descriptions
- 📋 **Automatic Playlists** - Creates organized playlists for video collections
- 🎯 **Batch Upload** - Upload multiple videos with session limits for quota management
- 📊 **Real-time Progress** - Live upload progress tracking with status updates
- 🏷️ **Smart Tags** - Automatic tag generation based on content analysis
- 🔒 **Privacy Controls** - Full control over video privacy settings (Private/Unlisted/Public)

## 🚀 Technology Stack

- **Frontend**: Next.js 14, React 18, TypeScript, Tailwind CSS
- **Authentication**: NextAuth.js with Google OAuth
- **Backend**: Next.js API routes
- **YouTube Integration**: Google APIs (YouTube Data API v3)
- **Deployment**: Vercel

## 🛠️ Setup & Installation

### 1. Clone the Repository

```bash
git clone <your-repo>
cd webapp
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Google Cloud Setup

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Enable the **YouTube Data API v3**
4. Go to **APIs & Services > Credentials**
5. Create **OAuth 2.0 Client ID** credentials
6. Add your domain to authorized origins:
   - For development: `http://localhost:3000`
   - For production: `https://your-app.vercel.app`
7. Add redirect URIs:
   - For development: `http://localhost:3000/api/auth/callback/google`
   - For production: `https://your-app.vercel.app/api/auth/callback/google`

### 4. Environment Variables

Create a `.env.local` file:

```env
# NextAuth.js Configuration
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-random-secret-string

# Google OAuth Configuration
GOOGLE_CLIENT_ID=your-client-id.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-client-secret
```

For production (Vercel), set these environment variables in your Vercel dashboard.

### 5. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## 🌐 Deployment to Vercel

### 1. Connect to Vercel

```bash
npm install -g vercel
vercel
```

### 2. Set Environment Variables

In your Vercel dashboard, add the following environment variables:

- `NEXTAUTH_URL`: `https://your-app.vercel.app`
- `NEXTAUTH_SECRET`: A random secret string
- `GOOGLE_CLIENT_ID`: Your Google OAuth client ID
- `GOOGLE_CLIENT_SECRET`: Your Google OAuth client secret

### 3. Update Google Cloud Console

Add your Vercel domain to:
- Authorized JavaScript origins: `https://your-app.vercel.app`
- Authorized redirect URIs: `https://your-app.vercel.app/api/auth/callback/google`

### 4. Deploy

```bash
vercel --prod
```

## 📖 How to Use

1. **Sign In**: Click "Sign In with Google" and authorize YouTube access
2. **Select Videos**: Drag and drop video files or click to select from folders
3. **Configure Settings**:
   - Set playlist name
   - Choose privacy level (Private/Unlisted/Public)
   - Select content type for smart descriptions
   - Set upload limit for quota management
4. **Upload**: Click "Start Upload" and watch real-time progress
5. **Access Videos**: Click the play icon next to completed uploads to view on YouTube

## 🔧 Configuration

### Content Types

The app automatically detects content types based on file names and generates appropriate descriptions:

- **Educational Course**: Learning-focused descriptions with educational tags
- **Business Content**: Professional content for career growth
- **Technical/Programming**: Developer-focused content with tech tags
- **Creative/Design**: Artistic content with creative tags
- **Health/Fitness**: Wellness-focused descriptions
- **Auto-Detect**: Automatically determines the best content type

### Upload Limits

- Default: 10 videos per session
- Maximum: 50 videos per session
- Helps manage YouTube API quota limits
- Users can run multiple sessions

## 🔒 Security & Privacy

- ✅ Users authenticate with their own Google accounts
- ✅ Videos upload directly to user's YouTube channel
- ✅ No video content stored on our servers
- ✅ Secure OAuth token handling with NextAuth.js
- ✅ Environment variable protection for secrets

## 🚨 YouTube API Quota

YouTube API has daily quota limits:
- **Default quota**: 10,000 units per day
- **Video upload**: ~1,600 units per video
- **Maximum uploads**: ~6 videos per day per user

The app helps users manage quotas with session limits and clear messaging.

## 🛠️ Development

### Project Structure

```
webapp/
├── app/
│   ├── api/                 # API routes
│   │   ├── auth/           # NextAuth configuration
│   │   └── youtube/        # YouTube API integration
│   ├── globals.css         # Global styles
│   ├── layout.tsx          # Root layout
│   ├── page.tsx           # Main page
│   └── providers.tsx       # Session provider
├── public/                 # Static assets
├── .env.example           # Environment variables example
├── next.config.js         # Next.js configuration
├── tailwind.config.js     # Tailwind CSS configuration
└── package.json          # Dependencies
```

### Key API Routes

- `POST /api/youtube/upload` - Upload video to YouTube
- `POST /api/youtube/playlist` - Create YouTube playlist
- `GET /api/youtube/playlist` - Get user's playlists
- `/api/auth/[...nextauth]` - NextAuth.js authentication

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📄 License

MIT License - see LICENSE file for details.

## 🆘 Support

For issues and questions:
1. Check the GitHub Issues page
2. Ensure Google Cloud setup is correct
3. Verify environment variables are set
4. Check browser console for errors

## 🎉 Acknowledgments

- YouTube Data API v3
- Next.js team for the amazing framework
- NextAuth.js for authentication
- Vercel for hosting platform