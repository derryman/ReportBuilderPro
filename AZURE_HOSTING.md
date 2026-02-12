# Simple Azure Hosting Guide

Host your app on Azure - one URL that works on web and mobile. Follow these steps in order.

---

## Before You Start

✅ Make sure your code is pushed to **GitHub**  
✅ You have a GitHub account  
✅ You're ready to spend about 15-20 minutes setting this up

---

## What You'll Create

1. **Database** → Azure Cosmos DB (MongoDB)
2. **Backend** → Azure App Service (Node.js server)
3. **Frontend** → Azure Static Web Apps (React app)

**End result:** One URL like `https://yourapp.azurestaticapps.net` that works everywhere.

---

## Step 1: Create Azure Account

1. Go to [portal.azure.com](https://portal.azure.com)
2. Sign up (free account is fine)
3. You'll get $200 free credit for 30 days, but we'll use free tier services

---

## Step 2: Create the Database (Cosmos DB)

1. In Azure Portal, click **"Create a resource"** (top left)
2. Search for **"Azure Cosmos DB"** and click it
3. Click **"Create"**
4. Fill in:
   - **Subscription:** Your subscription (usually just one)
   - **Resource Group:** Click "Create new" → name it `ReportBuilderPro` → OK
   - **Account Name:** `reportbuilderpro-db` (must be unique, try adding numbers if taken)
   - **API:** Select **"MongoDB"** (important!)
   - **Location:** Pick closest to you (e.g. East US)
   - **Capacity mode:** **Free Tier** (if available) or **Serverless**
5. Click **"Review + create"** → **"Create"**
6. Wait 2-3 minutes for it to finish
7. Click **"Go to resource"** when done
8. In the left menu, click **"Connection string"** (under Settings)
9. Copy the **"Primary connection string"** - it looks like:
   ```
   mongodb://reportbuilderpro-db:ABC123xyz@reportbuilderpro-db.mongocluster.cosmos.azure.com:10255/?ssl=true
   ```
10. **Save this somewhere safe** - you'll need it in Step 3

✅ **Database done!**

---

## Step 3: Create the Backend (App Service)

1. In Azure Portal, click **"Create a resource"** again
2. Search for **"Web App"** and click it
3. Click **"Create"**
4. Fill in:
   - **Resource Group:** Use same one: `ReportBuilderPro`
   - **Name:** `reportbuilderpro-api` (must be unique, add numbers if needed)
   - **Publish:** Code
   - **Runtime stack:** Node 20 LTS
   - **Operating System:** Linux
   - **Region:** Same as your database
   - **App Service Plan:** Click "Create new"
     - Name: `ReportBuilderPro-Plan`
     - Sku: **Free F1** (or Basic B1 if you want always-on)
     - Click OK
5. Click **"Review + create"** → **"Create"**
6. Wait 1-2 minutes, then click **"Go to resource"**

### Add Environment Variables

7. In the left menu, click **"Configuration"** → **"Application settings"**
8. Click **"+ New application setting"** and add these three:

   **Setting 1:**
   - Name: `MONGO_URI`
   - Value: Paste your connection string from Step 2
   - Click OK

   **Setting 2:**
   - Name: `MONGO_DB`
   - Value: `ReportBuilderPro`
   - Click OK

   **Setting 3:**
   - Name: `PORT`
   - Value: `4000`
   - Click OK

9. Click **"Save"** at the top (important!)
10. Wait for it to save

### Connect to GitHub

11. In the left menu, click **"Deployment Center"**
12. Under **"Source"**, select **"GitHub"**
13. Click **"Authorize"** and sign in to GitHub
14. Select:
    - **Organization:** Your GitHub username
    - **Repository:** `ReportBuilderPro` (or your repo name)
    - **Branch:** `main` (or `master`)
15. Click **"Save"**
16. Under **"Build"**, click **"Settings"**
17. Set:
    - **Application source:** Repository
    - **Branch:** `main`
    - **Application location:** `server` (this tells Azure where your backend code is)
18. Click **"Save"**
19. Azure will start deploying. Wait 2-3 minutes.

### Get Your Backend URL

20. In the left menu, click **"Overview"**
21. Copy the **"Default domain"** - it looks like:
    ```
    https://reportbuilderpro-api.azurewebsites.net
    ```
22. **Save this URL** - you'll need it in Step 4

✅ **Backend done!**

---

## Step 4: Create the Frontend (Static Web App)

1. In Azure Portal, click **"Create a resource"**
2. Search for **"Static Web App"** and click it
3. Click **"Create"**
4. Fill in:
   - **Subscription:** Your subscription
   - **Resource Group:** Same: `ReportBuilderPro`
   - **Name:** `reportbuilderpro-web` (must be unique)
   - **Plan type:** Free
   - **Region:** Same as others
   - **Source:** GitHub
5. Click **"Sign in with GitHub"** and authorize
6. Select:
   - **Organization:** Your GitHub username
   - **Repository:** `ReportBuilderPro`
   - **Branch:** `main`
7. Click **"Next: Build Details"**
8. Fill in:
   - **Build Presets:** Custom
   - **App location:** `web` (where your React code is)
   - **Output location:** `dist` (Vite builds to this folder)
   - **Build command:** `npm run build`
9. Click **"Review + create"** → **"Create"**
10. Wait 1-2 minutes, then click **"Go to resource"**

### Add Environment Variable

11. In the left menu, click **"Configuration"** → **"Application settings"**
12. Click **"+ Add"**
13. Add:
    - **Name:** `VITE_API_URL`
    - **Value:** Your backend URL from Step 3 (e.g. `https://reportbuilderpro-api.azurewebsites.net`)
14. Click **"OK"** → **"Save"**
15. Wait for it to save

### Trigger a New Build

16. In the left menu, click **"Deployment history"**
17. Click **"..."** (three dots) on the latest deployment → **"Redeploy"**
18. Or: Make a small change to your code and push to GitHub (it will auto-deploy)

### Get Your App URL

19. In the left menu, click **"Overview"**
20. Copy the **"URL"** - it looks like:
    ```
    https://reportbuilderpro-web.azurestaticapps.net
    ```
21. **This is your app URL!** Open it in a browser.

✅ **Frontend done!**

---

## Step 5: Fix CORS (Allow Frontend to Talk to Backend)

1. Go back to your **App Service** (backend) in Azure Portal
2. In the left menu, click **"CORS"**
3. Under **"Allowed Origins"**, click **"+ Add"**
4. Add your frontend URL: `https://reportbuilderpro-web.azurestaticapps.net`
5. Click **"Save"**
6. Also add `http://localhost:5173` if you want to test locally later

✅ **CORS done!**

---

## Step 6: Test Your App

1. Open your frontend URL: `https://reportbuilderpro-web.azurestaticapps.net`
2. Try logging in or creating a report
3. If it works, you're done! 🎉

---

## Troubleshooting

### "Cannot connect to backend"
- Check that `VITE_API_URL` in Static Web App settings matches your backend URL exactly
- Make sure CORS is set up (Step 5)
- Wait a few minutes after deployment - sometimes it takes time

### "Database connection failed"
- Check that `MONGO_URI` in App Service settings is correct (copy it again from Cosmos DB)
- Make sure `MONGO_DB` is set to `ReportBuilderPro`

### "Frontend shows old version"
- Go to Static Web App → Deployment history → Redeploy
- Or push a new commit to GitHub

### Backend not deploying
- Check Deployment Center → Logs to see errors
- Make sure "Application location" is set to `server` (not root)

---

## Summary

✅ **Database:** Azure Cosmos DB (MongoDB)  
✅ **Backend:** Azure App Service at `https://yourapp-api.azurewebsites.net`  
✅ **Frontend:** Azure Static Web Apps at `https://yourapp.azurestaticapps.net`  

**Your app is now live!** Share the frontend URL with anyone - it works on web and mobile.

---

## Free Tier Limits

- **Cosmos DB:** 1000 RU/s, 25GB storage (free forever)
- **App Service F1:** 60 minutes/day compute time (or spins down when idle)
- **Static Web Apps:** 100GB bandwidth/month (free forever)

If you need more, upgrade to Basic tier (about $13/month for always-on backend).
