# Report Builder Pro (Prototype)

A simplified prototype for the Report Builder Pro experience. This prototype demonstrates the core UI layout for login, dashboard, and template creation with MongoDB integration for authentication and template storage.

## Technologies
- **Vite + React 19 + TypeScript** for fast component-driven UI development
- **React Router** (HashRouter) for client-side navigation compatible with GitHub Pages
- **Bootstrap 3.4** for base typography & grid; custom CSS for grey/teal visual identity
- **@dnd-kit** for drag-and-drop template building
- **Custom assets** including the Report Builder Pro logo

## Project Structure
```
web/
├── src/
│   ├── assets/            # Logo and shared media
│   ├── components/        # Shared UI components (MainLayout)
│   ├── pages/             # Route views: Login, Home, Template Creator
│   ├── styles/            # Bootstrap overrides & design tokens
│   ├── App.tsx            # Router configuration
│   └── main.tsx           # App bootstrap
├── index.html             # Vite entry point
├── package.json           # Dependencies & scripts
└── vite.config.ts         # Vite configuration for GitHub Pages
```

## Local Development

1. **Install dependencies**
   ```bash
   cd web
   npm install
   ```

2. **Start dev server**
   ```bash
   npm run dev
   ```
   Opens at `http://localhost:5173`

3. **Build for production**
   ```bash
   npm run build
   ```

## Deployment

### Frontend (GitHub Pages) ✅

The frontend can still be hosted on GitHub Pages (static files only):

1. **Enable GitHub Pages** in your repository settings:
   - Go to your repository → **Settings** → **Pages**
   - Under "Source", select **"GitHub Actions"** (NOT "Deploy from a branch")
   - Save the settings

2. **Set API URL for production**:
   - In GitHub repository → **Settings** → **Secrets and variables** → **Actions**
   - Add a new secret: `VITE_API_URL` = your backend URL (e.g., `https://your-backend.vercel.app`)
   - This tells the frontend where to find your backend API

3. **Trigger the deployment**:
   - Push any changes to the `main` branch, OR
   - Go to **Actions** tab → Select "Deploy to GitHub Pages" workflow → Click "Run workflow"

4. **Access your site** at:
   ```
   https://[your-username].github.io/ReportBuilderPro/
   ```

### Backend (Separate Hosting Required)

GitHub Pages can't run Node.js servers. Deploy your backend separately:

**Option 1: Vercel (Recommended - Free & Easy)**
1. Go to https://vercel.com
2. Sign up with GitHub
3. Import your repo
4. Set root directory to `server`
5. Add environment variables (MONGO_URI, MONGO_DB, PORT)
6. Deploy - done!

**Option 2: Railway**
- Similar to Vercel, also free tier available

**Option 3: Other Options**
- Netlify Functions, Render, Heroku, etc.

Once your backend is deployed, update the `VITE_API_URL` secret in GitHub Actions (step 2 above).

## Setup

See `SETUP_INSTRUCTIONS.md` for detailed setup instructions.

**Quick Start:**
1. Set up MongoDB Atlas collections (Login and Templates)
2. Configure `server/.env` with your MongoDB connection string
3. Run backend: `cd server && npm start`
4. Run frontend: `cd web && npm run dev`

## Features

- ✅ Simplified codebase optimized for prototyping
- ✅ MongoDB integration for login and templates
- ✅ GitHub Pages compatible (HashRouter)
- ✅ Drag-and-drop template builder
- ✅ Responsive design
- ✅ Automated deployment via GitHub Actions

