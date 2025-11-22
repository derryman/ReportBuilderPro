# Report Builder Pro (Prototype)

A simplified static prototype for the Report Builder Pro experience. This prototype demonstrates the core UI layout for login, dashboard, and template creation with a client-side mock authentication system.

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

## GitHub Pages Deployment

This project is configured to deploy automatically to GitHub Pages:

1. **Enable GitHub Pages** in your repository settings:
   - Go to your repository → **Settings** → **Pages**
   - Under "Source", select **"GitHub Actions"** (NOT "Deploy from a branch")
   - Save the settings

2. **Trigger the deployment**:
   - Push any changes to the `main` branch, OR
   - Go to **Actions** tab → Select "Deploy to GitHub Pages" workflow → Click "Run workflow"

3. **Wait for deployment**:
   - Check the **Actions** tab to see the workflow running
   - Wait for the green checkmark (deployment usually takes 1-2 minutes)

4. **Access your site** at:
   ```
   https://[your-username].github.io/ReportBuilderPro/
   ```

**Troubleshooting:**
- If you see the README instead of the app, GitHub Pages is serving from the wrong source
- Make sure "Source" is set to **"GitHub Actions"** (not "Deploy from a branch" or "/docs")
- Check the Actions tab to ensure the workflow completed successfully
- The site URL might take a few minutes to update after deployment

## Prototype Login

For testing purposes, use these credentials:
- **Email:** `derrymahon@icloud.com`
- **Password:** `prototype`

The login uses simple client-side validation (no backend required).

## Features

- ✅ Simplified codebase optimized for prototyping
- ✅ GitHub Pages compatible (HashRouter)
- ✅ Client-side authentication (no backend needed)
- ✅ Drag-and-drop template builder
- ✅ Responsive design
- ✅ Automated deployment via GitHub Actions

