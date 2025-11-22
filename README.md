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
   - Go to Settings → Pages
   - Source: GitHub Actions

2. **Push to main branch** - The GitHub Actions workflow will automatically:
   - Build the project
   - Deploy to GitHub Pages

3. **Access your site** at:
   ```
   https://[your-username].github.io/ReportBuilderPro/
   ```

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

