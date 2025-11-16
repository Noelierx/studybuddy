# 📚 StudyBuddy - Study Management Application

Modern web application to organize your studies with Google Calendar integration. Manage your exams, schedule study sessions, and automatically sync everything with your Google Calendar.

## ✨ Features

- 🔐 **Secure authentication** with Google OAuth
- 📅 **Bidirectional Google Calendar** integration
- 📝 **Exam management** (create, edit, delete)
- 🎯 **Intelligent study session** scheduling
- 📊 **Study progress** tracking
- 📱 **Responsive interface** and intuitive design
- 🌙 **Modern design** with Tailwind CSS

## 🚀 Installation and Configuration Guide

### Prerequisites

- Node.js 18+ installed
- Google account (for OAuth)
- Supabase account (free)

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

## 💾 Supabase Configuration (Database)

### 1. Create Supabase Project

1. Go to [supabase.com](https://supabase.com)
2. Create a free account
3. Create a new project
4. Choose your region (Europe West recommended)
5. Wait for creation (2-3 minutes)

### 2. Retrieve Supabase Keys

1. In your project: "Settings" → "API"
2. Note:
   - **URL**: `https://xxx.supabase.co`
   - **anon public key**: Starts with `eyJ...`
   - **service_role key**: Keep secret

### 3. Configure OAuth in Supabase

1. In your Supabase project: "Authentication" → "Providers"
2. Enable "Google" and configure:
   - **Client ID**: Copy from Google Cloud Console
   - **Client Secret**: Copy from Google Cloud Console
   - **Redirect URLs**:
     - `http://localhost:3000/auth/callback` (dev)
     - `https://your-domain.com/auth/callback` (prod)
3. Save

### 4. Create Database

In Supabase: "SQL Editor", execute:

```sql
-- Create exams table
CREATE TABLE exams (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  exam_date TIMESTAMP WITH TIME ZONE NOT NULL,
  subject TEXT,
  score DECIMAL,
  passing_score DECIMAL,
  study_hours_needed INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create study_sessions table
CREATE TABLE study_sessions (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID NOT NULL,
  exam_id BIGINT REFERENCES exams(id),
  title TEXT NOT NULL,
  scheduled_start TIMESTAMP WITH TIME ZONE NOT NULL,
  scheduled_end TIMESTAMP WITH TIME ZONE NOT NULL,
  actual_start TIMESTAMP WITH TIME ZONE,
  actual_end TIMESTAMP WITH TIME ZONE,
  completed BOOLEAN DEFAULT FALSE,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE exams ENABLE ROW LEVEL SECURITY;
ALTER TABLE study_sessions ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view own exams" ON exams
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own exams" ON exams
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own exams" ON exams
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own exams" ON exams
  FOR DELETE USING (auth.uid() = user_id);

-- Same for study_sessions
CREATE POLICY "Users can view own sessions" ON study_sessions
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own sessions" ON study_sessions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own sessions" ON study_sessions
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own sessions" ON study_sessions
  FOR DELETE USING (auth.uid() = user_id);
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
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-public-key

# Google OAuth (optional - handled by Supabase OAuth)
GOOGLE_CLIENT_ID=your-google-client-id
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

### Supabase Database

**Issue**: Tables not created
**Solution**:
- Execute provided SQL above in "SQL Editor"
- Check RLS is enabled

### Port 3000 Already in Use

**Other port**: `npm run dev -- -p 3001`

---

## 📁 Project Structure

```
studybuddy/
├── app/                 # Next.js 14 App Router
│   ├── api/            # API Routes
│   ├── auth/           # Authentication pages
│   ├── dashboard/      # User dashboard
│   └── layout.tsx      # Global layout
├── components/         # React components
│   ├── ui/            # shadcn/ui components
│   └── big-calendar/  # Integrated calendar
├── lib/               # Utilities
├── utils/             # Helper functions
└── middleware.ts      # Authentication middleware
```

---

## 🚀 Production Deployment

### Preparation

1. **Deploy Supabase**: Keep configuration (databases already created)
2. **Build application**: `npm run build`
3. **Environment variables**: Configure on hosting platform

### Recommended Platforms

**Vercel (Recommended)**
```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel --prod
```

**Netlify**
1. Connect your Git repo
2. Add environment variables
3. Deploy

**Railway**
1. Connect GitHub
2. Environment variables
3. Auto-deployment

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
- Official docs: [Next.js](https://nextjs.org/), [Supabase](https://supabase.com/docs)

---

**🎉 Happy studying with StudyBuddy!**
