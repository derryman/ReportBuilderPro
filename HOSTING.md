# Permanent Hosting Guide (Free Tier)

Host your app so you don’t need to run servers on your machine. This guide uses **free** services.

---

## Option A: One platform – Azure (all-in-one)

Use a **single Azure account** for frontend, backend, and database. One bill (free tier), one portal, one place to manage everything.

| Part      | Azure service              | Free tier / notes                    |
|-----------|----------------------------|--------------------------------------|
| Frontend  | **Azure Static Web Apps**  | Free (100GB bandwidth)               |
| Backend   | **Azure App Service** (Node)| Free F1 tier (60 min/day or always-on limits) |
| Database  | **Azure Cosmos DB** (MongoDB API) | Free tier: 1000 RU/s, 25GB storage |

### 1. Azure account and repo

- Sign up at [azure.microsoft.com](https://azure.microsoft.com) (free account; no credit card required for free-tier services in many regions).
- Push your code to **GitHub** (this repo).

### 2. Database – Cosmos DB (MongoDB-compatible)

1. In **Azure Portal** → **Create a resource** → **Azure Cosmos DB**.
2. Choose **Azure Cosmos DB for MongoDB** (not NoSQL/SQL).
3. Create a resource group, account name, region. Under **Capacity**, choose **Serverless** or **Provisioned** with **Free tier** (1000 RU/s, 25 GB).
4. Create the account. Go to the resource → **Connection string** (under Settings). Copy the **Primary connection string**.
5. It looks like:  
   `mongodb://accountname:PRIMARY_KEY@accountname.mongocluster.cosmos.azure.com:10255/?ssl=true`  
   Your Node app uses this as `MONGO_URI`. Use the same database name you use today (e.g. `ReportBuilderPro`) in your app; Cosmos will use it as the DB name.

So: **one database** = Cosmos DB with MongoDB API, same connection string style as MongoDB.

### 3. Backend – App Service (Node)

1. **Create a resource** → **Web App**.
2. Runtime: **Node** (e.g. Node 20 LTS). OS: Linux. Region: same as Cosmos DB.
3. **App Service plan:** create new, **Free F1** (or **Basic B1** if you want always-on and no daily limit).
4. After create, go to the Web App → **Configuration** → **Application settings** → **New application setting**:
   - `MONGO_URI` = your Cosmos DB connection string from step 2  
   - `MONGO_DB` = `ReportBuilderPro`  
   - (Optional) `PORT` – App Service sets this; your server already uses `process.env.PORT || 4000`.
5. **Deployment** → **Deployment Center**:
   - Source: **GitHub** → authorize and select this repo and branch (e.g. `main`).
   - Build: **App Service build service**.
   - **Configure:**  
     - **Application source:** Repository, branch `main`, **folder** = `server` (so only the Node app is built and run).
   - Save. App Service will run `npm install` and `npm start` from the `server` folder.
6. Copy the Web App URL (e.g. `https://reportbuilderpro-api.azurewebsites.net`). This is your **backend URL**.

Your backend is now **one Azure App Service**, always (or within free-tier limits) on.

### 4. Frontend – Static Web Apps

1. **Create a resource** → **Static Web App**.
2. Connect **GitHub**, select this repo and branch (e.g. `main`).
3. Build details:
   - **Build Presets:** Custom.
   - **App location:** `web` (root of your frontend).
   - **Output location:** `dist` (Vite’s default).
   - **Build command:** `npm run build` (run from `web`; Static Web Apps will `npm install` in `web` first).
4. **Environment variables** (in Static Web App → **Configuration** → **Application settings**):
   - `VITE_API_URL` = your backend URL from step 3 (e.g. `https://reportbuilderpro-api.azurewebsites.net`).
5. Save; Static Web Apps will build and deploy. Your app URL will be like `https://<name>.azurestaticapps.net`.

Frontend and API are both in Azure; frontend calls the App Service URL.

### 5. CORS (backend allows frontend)

In **App Service** → **CORS**: add `https://<your-static-app>.azurestaticapps.net` and (for local dev) `http://localhost:5173`. Or temporarily use `*` to test.

### Summary – one size fits all (Azure)

- **One account:** Microsoft Azure.
- **One place:** Azure Portal for app, API, DB, and settings.
- **Frontend:** Static Web Apps (built from `web/`, env `VITE_API_URL` = backend URL).
- **Backend:** App Service (run from `server/`, env `MONGO_URI` + `MONGO_DB` = Cosmos DB).
- **Database:** Cosmos DB for MongoDB API (same driver/connection as MongoDB).

No need to run servers on your machine; everything is hosted on Azure.

**Other “one platform” options:**  
- **AWS:** Amplify (frontend + optional API), Elastic Beanstalk or Lambda (backend), DocumentDB or MongoDB Atlas. Single AWS account.  
- **Google Cloud:** Cloud Run (backend), Firebase Hosting or Cloud Storage (frontend), Firestore or MongoDB Atlas. Single GCP account.  

Azure is often the simplest single-vendor option if you want one portal and one bill.

---

## Option B: Multi-service free stack (Render + Atlas + GitHub Pages)

| Part        | Service         | Free tier        |
|------------|------------------|------------------|
| Frontend   | GitHub Pages     | Free (you already have this) |
| Backend    | Render           | Free (750 hrs/month) |
| Database   | MongoDB Atlas    | Free (512MB cluster) |

After setup, the frontend will call the backend at a URL like `https://your-app.onrender.com`.

---

## Step 1: MongoDB Atlas (cloud database)

1. Go to [mongodb.com/cloud/atlas](https://www.mongodb.com/cloud/atlas) and sign up (free).
2. Create a **free M0 cluster** (e.g. AWS, region nearest you).
3. **Database Access** → Add user (username + password). Note the password.
4. **Network Access** → Add IP: `0.0.0.0/0` (allow from anywhere; required for Render).
5. **Connect** → “Drivers” → copy the connection string. It looks like:
   ```text
   mongodb+srv://USER:PASSWORD@cluster0.xxxxx.mongodb.net/?retryWrites=true&w=majority
   ```
6. Replace `USER` and `PASSWORD` with your DB user. Add the database name:
   ```text
   mongodb+srv://USER:PASSWORD@cluster0.xxxxx.mongodb.net/ReportBuilderPro?retryWrites=true&w=majority
   ```
7. Create collections as needed: `Login`, `Templates`, `Reports` (they can be created when the app first writes).

You’ll use this string as `MONGO_URI` on Render.

---

## Step 2: Deploy backend to Render

1. Push your code to **GitHub** (if not already).
2. Go to [render.com](https://render.com) and sign up (free). Connect your GitHub account.
3. **New** → **Web Service**.
4. Connect the repo that contains your `server/` folder (this repo).
5. Configure:
   - **Name:** e.g. `reportbuilderpro-api`
   - **Root Directory:** `server` (so Render runs from the `server` folder)
   - **Runtime:** Node
   - **Build command:** `npm install`
   - **Start command:** `npm start`
   - **Instance type:** Free
6. **Environment** (Environment Variables):
   - `PORT` = `4000` (Render sets PORT; 4000 is fine)
   - `MONGO_URI` = your Atlas connection string from Step 1
   - `MONGO_DB` = `ReportBuilderPro`
7. Click **Create Web Service**. Wait for the first deploy to finish.
8. Copy your service URL, e.g. `https://reportbuilderpro-api.onrender.com` (no trailing slash). This is your **backend URL**.

Note: On the free tier the service **spins down after ~15 minutes** of no traffic. The first request after that may take 30–60 seconds to wake it up.

---

## Step 3: Point frontend to the hosted backend

The frontend must call your **backend URL** instead of `localhost:4000`.

### If you deploy frontend with GitHub Pages (current workflow)

1. In your GitHub repo: **Settings** → **Secrets and variables** → **Actions**.
2. Add a secret:
   - Name: `VITE_API_URL`
   - Value: your backend URL, e.g. `https://reportbuilderpro-api.onrender.com`
3. Re-run the “Deploy to GitHub Pages” workflow (or push a commit to `main`). The workflow already uses `VITE_API_URL` when building, so the built app will use this URL.

### If you deploy frontend with Vercel

1. In the Vercel project: **Settings** → **Environment Variables**.
2. Add:
   - Name: `VITE_API_URL`
   - Value: your backend URL (e.g. `https://reportbuilderpro-api.onrender.com`)
3. Redeploy so the new variable is applied.

### Local development

- Keep using `web/.env` with `VITE_API_URL=http://localhost:4000` (or your local IP for mobile testing).
- Don’t commit real `.env` files; use `.env.example` as a template.

---

## Step 4: Use the hosted app

- **Frontend:**  
  - GitHub Pages: `https://<your-username>.github.io/ReportBuilderPro/` (or the URL GitHub shows).  
  - Vercel: the URL Vercel gives you (e.g. `https://reportbuilderpro.vercel.app`).
- **Backend:** All API calls go to your Render URL (e.g. `https://reportbuilderpro-api.onrender.com`).
- **Database:** MongoDB Atlas; no local MongoDB needed.

You no longer need to run `npm run dev` or the server on your machine for normal use.

---

## Optional: Deploy frontend with Vercel (instead of GitHub Pages)

1. Go to [vercel.com](https://vercel.com) and sign up with GitHub.
2. **Add New** → **Project** → import your repo.
3. Set:
   - **Root Directory:** `web`
   - **Build command:** `npm run build`
   - **Output directory:** `dist`
   - **Environment variable:** `VITE_API_URL` = your Render backend URL
4. Deploy. Vercel will give you a URL and auto-deploy on push.

---

## Checklist

- [ ] MongoDB Atlas cluster created and connection string copied
- [ ] Atlas user created and IP allowlist set (e.g. `0.0.0.0/0`)
- [ ] Render Web Service created from `server/` with `MONGO_URI` and `MONGO_DB` set
- [ ] Backend URL from Render copied (e.g. `https://....onrender.com`)
- [ ] Frontend build uses `VITE_API_URL` = backend URL (GitHub Actions secret or Vercel env)
- [ ] One full deploy of frontend after setting `VITE_API_URL`
- [ ] Test: open hosted frontend → login/capture/reports work without running anything locally

---

## Troubleshooting

- **CORS errors in browser:** Render allows all origins by default with your current `cors()` setup. If you change the backend URL, ensure the frontend is using that exact URL in `VITE_API_URL`.
- **“Database not ready”:** Check `MONGO_URI` and `MONGO_DB` on Render. Test the same URI in MongoDB Compass.
- **First request very slow:** Free tier spin-down; first request wakes the service. Subsequent requests are fast until idle again.
- **Frontend still calls localhost:** Rebuild/redeploy the frontend after setting `VITE_API_URL`; the value is baked in at build time.
