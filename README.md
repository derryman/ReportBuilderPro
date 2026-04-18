# Report Builder Pro

A full-stack web application for creating and managing construction site reports. Built with React, Node.js, Express, and MongoDB.

## Quick start

### Prerequisites

- Node.js 20.x (or current LTS supported by Vite)
- MongoDB (local or Azure Cosmos DB with MongoDB API)

### Local development

```bash
npm run install:all
npm run dev
```

Or start separately:

```bash
npm run dev:server   # Backend http://localhost:4000
npm run dev:web      # Frontend http://localhost:5173
```

## Project layout

```
ReportBuilderPro/
├── server/       # Express API, JWT, MongoDB, NLP proxy
├── web/          # React + TypeScript (Vite)
├── nlp-service/  # FastAPI NLP classifier (see nlp-service/README.md)
├── risk_dataset_construction_megapack/  # Optional extra training source data
└── .github/      # CI workflows
```

## Environment

Copy `server/.env.example` → `server/.env` and `web/.env.example` → `web/.env`, then set `MONGO_URI`, `JWT_SECRET`, optional `NLP_SERVICE_URL`, etc.

## Features

- User authentication
- Template creation and management
- Mobile-friendly report capture
- PDF generation
- Offline support
- NLP issue hints (optional Python service)
- Optional writing review integration

## Tech stack

- **Frontend:** React, TypeScript, Vite, Bootstrap
- **Backend:** Node.js, Express, MongoDB
- **NLP:** Python, FastAPI, spaCy, scikit-learn
