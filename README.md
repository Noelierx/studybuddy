# 📚 StudyBuddy - Study Management Application

Modern web application to organize your studies with Google Calendar integration. Manage your exams, schedule study sessions, and automatically sync everything with your Google Calendar using Firebase Admin SDK.

## ✨ Features

- 🔐 **Secure authentication** with Google OAuth + Firebase
- 📅 **Full Google Calendar** bidirectional sync
- 🗃️ **Firestore database** for data persistence
- 📝 **Complete exam management** (CRUD operations)
- 🎯 **Intelligent study session** scheduling algorithm
- 📊 **Study progress** tracking with completion status
- 📱 **Responsive design** with modern UI components
- 🌙 **Dark/light theme** with Tailwind CSS

## 🚀 Installation and Configuration Guide

### Prerequisites

- Node.js 18+ installed
- Google Cloud account (for service account)
- Google account (for OAuth applications)

---

## 🔑 Google OAuth Configuration (REQUIRED)

The application requires Google OAuth configuration to access Google Calendar. Here's the step-by-step guide:

### 1. Create Google Cloud Console Project

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project ("Select a project" → "New Project")
3. Give it a name (e.g., "StudyBuddy App")
4. Wait for the project to be created

### 2. Enable Google Calendar API

1. In the search bar, type "Google Calendar API"
2. Click on it and press "Enable"
3. Verify it appears as "Enabled"

### 3. Create OAuth 2.0 Credentials

1. Go to left sidebar menu: "APIs & Services" → "Credentials"
2. Click "Create Credentials" → "OAuth client ID"
3. Configure:
   - **Application type**: `Web application`
   - **Name**: `StudyBuddy Web App`
   - **Authorized JavaScript origins**:
     - Add: `http://localhost:3000` (for development)
     - Add: `https://your-domain.com` (for production)
   - **Authorized redirect URIs**:
     - Add: `http://localhost:3000/auth/callback`
     - Add: `https://your-domain.com/auth/callback`

### 4. Retrieve API Keys

After creation, you'll see a popup with:
- **Client ID**: Note it (format: `xxx.apps.googleusercontent.com`)
- **Client Secret**: Note it too

⚠️ **Important**: Keep this information secure!

---

## 🔥 Firebase Configuration (Database + Auth)

StudyBuddy uses Firebase for authentication and Firestore for database storage. No Supabase needed!

### 1. Create Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click "Create a project" or "Add project"
3. Give it a name (e.g., "StudyBuddy Firebase")
4. Disable Google Analytics (optional)
5. Click "Create project"

### 2. Configure Authentication

1. In left sidebar: "Authentication" → "Get started"
2. Go to "Sign-in method" tab
3. Enable "Google" provider
4. Configure with your previously created OAuth client:
   - **Web client ID**: Your Google OAuth client ID
   - **Web client secret**: Your Google OAuth client secret
5. Save configuration

### 3. Setup Firestore Database

1. In left sidebar: "Firestore Database" → "Create database"
2. Choose "Start in test mode" (for development)
3. Select a location (europe-west for Europe)
4. Click "Done"

### 4. Firebase Admin SDK Configuration

#### Create Service Account Key
1. Go to "Project settings" (gear icon) → "Service accounts"
2. Click "Generate new private key"
3. Download the JSON file automatically
4. **Important**: Move this file to `studybuddy/lib/` and rename to `service-account.json`

#### ⚠️ Security Warning:
- The `service-account.json` file contains sensitive credentials
- **Never commit this file to Git**
- Keep it secure and don't share it

### 5. Firebase Client SDK Configuration

1. In Firebase Console: "Project settings" → "Your apps"
2. Click "Add app" → Web app icon (`</>`)
3. Register app: name "StudyBuddy Web"
4. Check "Also set up Firebase Hosting" (optional)
5. Click "Register app"

### 6. Get Firebase Configuration

In "Project settings" → "Your apps" → "Web app", you'll see:

```javascript
const firebaseConfig = {
  apiKey: "AIzaSy...",
  authDomain: "your-project.firebaseapp.com",
  projectId: "your-project-id",
  storageBucket: "your-project.appspot.com",
  messagingSenderId: "123...",
  appId: "1:123..."
};
```

---

## 🔧 Application Configuration

### 1. Clone and Install

```bash
# Clone the repo
git clone <your-repo-url>
cd studybuddy

# Install dependencies
npm install
```

### 2. Environment Variables

Create `.env.local` file in `studybuddy/` folder:

```bash
# Firebase Configuration
NEXT_PUBLIC_FIREBASE_API_KEY=your-api-key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your-project-id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=123...
NEXT_PUBLIC_FIREBASE_APP_ID=1:123...

# Google OAuth (REQUIRED - copy from Google Cloud Console)
GOOGLE_CLIENT_ID=your-google-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-google-client-secret
```

### 3. Launch Application

```bash
# Development mode
npm run dev

# Application will be available at http://localhost:3000
```

---

## 🎯 Application Usage

### 1. Getting Started

1. Open http://localhost:3000
2. Click "Sign in" and authenticate with Google
3. Accept Calendar permissions
4. You arrive at the dashboard!

### 2. Manage Exams

- **Add exam**: "New Exam" button
- **Fill in**: Title, subject, date, required study hours
- **Edit/Delete**: Buttons in the exam list

### 3. Schedule Study Sessions

- **Go to "Study Sessions"**
- **Auto-generate**: "Preview Suggestions" button
- **Add to calendar**: "Add Selected" button
- **Synchronization**: Sessions appear in Google Calendar

### 4. View Events

- **Dashboard**: Integrated calendar with all events
- **Auto-sync**: Google events appear in the app
- **Bidirectional editing**: Create in app OR in Google Calendar

---

## 🔄 Complete Workflow

```
1. Sign up/Login → Google OAuth ✅
   ↓
2. Create exam → Database ✅
   ↓
3. Generate study sessions → Smart algorithm ✅
   ↓
4. Add to calendar → Google Calendar API ✅
   ↓
5. See everything synced → Unified interface ✅
```

---

## 🔧 Troubleshooting

### OAuth Not Working

**Issue**: "invalid_client" error
**Solution**:
- Check Client ID is correctly copied
- Verify "Authorized origins" in Google Cloud Console
- Ensure domain matches exactly

### Calendar Not Syncing

**Issue**: "No Google access token found"
**Solution**:
- Re-login to the application
- Check Google Calendar permissions in OAuth
- Refresh the page

### Firebase Database

**Issue**: Can't connect to Firestore
**Solution**:
- Check `service-account.json` is properly placed in `lib/`
- Verify Firebase project ID in environment variables
- Ensure Firestore is initialized in test mode

### Port 3000 Already in Use

**Other port**: `npm run dev -- -p 3001`

---

## 📁 Project Structure

```
studybuddy/
├── app/                 # Next.js 14 App Router
│   ├── api/            # API Routes (Firestore operations)
│   ├── auth/           # Firebase Auth pages
│   ├── dashboard/      # User dashboard with calendar
│   └── layout.tsx      # Global layout
├── components/         # React components
│   ├── ui/            # shadcn/ui components
│   └── big-calendar/  # Google Calendar integration
├── lib/               # Core Firebase configurations
│   ├── firebase.ts           # Client SDK
│   ├── firebase-admin.ts     # Admin SDK
│   └── service-account.json  # 🔒 Firebase service account (NOT in Git)
├── utils/             # Helper functions
├── firestore.rules    # Firestore security rules
└── middleware.ts      # Firebase authentication middleware
```

---

## 🚀 Production Deployment

### Preparation

1. **Deploy Firebase**: Keep project and Firestore configuration
2. **Security**: Switch Firestore from "test mode" to production rules
3. **Build application**: `npm run build`
4. **Environment variables**: Configure all Firebase credentials
5. **Service Account**: Ensure hosting platform can read `service-account.json`

### Security Rules (Production)

⚠️ **IMPORTANT**: Before going live, update `firestore.rules`:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Allow authenticated users to read/write their own exams
    match /exams/{examId} {
      allow read, write: if request.auth != null && resource.data.userId == request.auth.uid;
    }

    // Allow authenticated users to read/write their own study sessions
    match /study-sessions/{sessionId} {
      allow read, write: if request.auth != null && resource.data.userId == request.auth.uid;
    }
  }
}
```

### Recommended Platforms

**Vercel (Recommended)**
```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel --prod
```
Note: Add `service-account.json` to Vercel's excluded files via UI

**Firebase Hosting (Recommended for Firebase)**
```bash
# Install Firebase CLI
npm install -g firebase-tools

# Deploy hosting and functions
firebase deploy
```

**Netlify**
1. Connect GitHub repo
2. Add all environment variables
3. Upload `service-account.json` as build environment file
4. Deploy

**Railway**
1. Connect GitHub repo
2. Environment variables + service account file
3. Auto-deployment with builds

---

## 🤝 Contributing

1. Fork the project
2. Create feature branch: `git checkout -b feature/amazing-feature`
3. Commit changes: `git commit -m 'Add amazing feature'`
4. Push to branch: `git push origin feature/amazing-feature`
5. Open Pull Request

---

## 📝 License

This project is licensed under MIT. See `LICENSE` for more information.

---

## 📞 Support

If you have questions:
- Open an issue on GitHub
- Official docs: [Next.js](https://nextjs.org/), [Firebase](https://firebase.google.com/docs)

---

**🎉 Happy studying with StudyBuddy!**
