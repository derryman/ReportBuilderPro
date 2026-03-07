# Report Builder Pro

A full-stack web application for creating and managing construction site reports. Built with React, Node.js, Express, and MongoDB.

## 🚀 Quick Start

### Prerequisites
- Node.js 20.x
- MongoDB (or Azure Cosmos DB)

### Local Development

```bash
# Install all dependencies
npm run install:all

# Start both frontend and backend
npm run dev

# Or start individually
npm run dev:server  # Backend on http://localhost:4000
npm run dev:web     # Frontend on http://localhost:5173
```

## 📁 Project Structure

```
ReportBuilderPro/
├── server/          # Node.js/Express backend API
├── web/            # React frontend (Vite)
└── .github/        # GitHub Actions workflows
```

## 🌐 Deployment

The app is deployed on Azure:
- **Frontend:** Azure Static Web Apps
- **Backend:** Azure App Service
- **Database:** Azure Cosmos DB (MongoDB API)

See `AZURE_HOSTING.md` for detailed deployment instructions.

## 📚 Documentation

- `AZURE_HOSTING.md` - Complete Azure deployment guide
- `MIGRATE_TO_AZURE.md` - Migrating data from local MongoDB to Azure

## 🔧 Environment Variables

### Backend (`server/.env`)
```
MONGO_URI=mongodb://...
MONGO_DB=ReportBuilderPro
PORT=4000
NLP_SERVICE_URL=http://localhost:8000
WRITING_REVIEW_ENABLED=1
WRITING_REVIEW_URL=https://api.languagetool.org/v2/check
WRITING_REVIEW_LANGUAGE=en-GB
```

### Frontend (`web/.env`)
```
VITE_API_URL=http://localhost:4000
```

## 📝 Features

- ✅ User authentication
- ✅ Template creation and management
- ✅ Mobile-friendly report capture
- ✅ PDF generation
- ✅ Offline support
- ✅ Issue detection (NLP)
- ✅ Browser spellcheck + pre-PDF writing review

## 🛠️ Tech Stack

- **Frontend:** React, TypeScript, Vite, Bootstrap
- **Backend:** Node.js, Express, MongoDB
- **Hosting:** Azure (Static Web Apps, App Service, Cosmos DB)
