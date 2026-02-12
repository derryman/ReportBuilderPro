# Azure Setup - Next Steps Checklist

You've created the resources. Now configure them:

---

## ✅ Step 1: Configure Backend (App Service)

### A. Add Environment Variables

1. Go to Azure Portal → Your **App Service** (backend)
2. Left menu → **"Configuration"** → **"Application settings"**
3. Click **"+ New application setting"** and add:

   **Setting 1:**
   - Name: `MONGO_URI`
   - Value: Your Cosmos DB connection string (from Cosmos DB → Connection string → Primary connection string)
   - Click **OK**

   **Setting 2:**
   - Name: `MONGO_DB`
   - Value: `ReportBuilderPro`
   - Click **OK**

   **Setting 3:**
   - Name: `PORT`
   - Value: `4000`
   - Click **OK**

4. Click **"Save"** at the top (important!)
5. Wait for it to save

### B. Connect GitHub Deployment

1. Left menu → **"Deployment Center"**
2. Under **"Source"**, select **"GitHub"**
3. Click **"Authorize"** → Sign in to GitHub
4. Select:
   - **Organization:** Your GitHub username
   - **Repository:** `ReportBuilderPro`
   - **Branch:** `main`
5. Click **"Save"**
6. Under **"Build"**, click **"Settings"**
7. Set:
   - **Application source:** Repository
   - **Branch:** `main`
   - **Application location:** `server` ⚠️ **Important!**
8. Click **"Save"**
9. Wait 2-3 minutes for first deployment

### C. Get Backend URL

1. Left menu → **"Overview"**
2. Copy the **"Default domain"** (e.g. `https://reportbuilderpro-api.azurewebsites.net`)
3. **Save this URL** - you need it for Step 2

---

## ✅ Step 2: Configure Frontend (Static Web App)

### A. Add Environment Variable

1. Go to Azure Portal → Your **Static Web App**
2. Left menu → **"Configuration"** → **"Application settings"**
3. Click **"+ Add"**
4. Add:
   - **Name:** `VITE_API_URL`
   - **Value:** Your backend URL from Step 1C (e.g. `https://reportbuilderpro-api.azurewebsites.net`)
5. Click **"OK"** → **"Save"**
6. Wait for it to save

### B. Trigger New Build

1. Left menu → **"Deployment history"**
2. Click **"..."** (three dots) on latest deployment → **"Redeploy"**
   - OR make a small change to your code and push to GitHub (it will auto-deploy)

### C. Get Frontend URL

1. Left menu → **"Overview"**
2. Copy the **"URL"** (e.g. `https://reportbuilderpro-web.azurestaticapps.net`)
3. **This is your app URL!**

---

## ✅ Step 3: Fix CORS (Allow Frontend → Backend)

1. Go back to your **App Service** (backend)
2. Left menu → **"CORS"**
3. Under **"Allowed Origins"**, click **"+ Add"**
4. Add your frontend URL: `https://reportbuilderpro-web.azurestaticapps.net`
5. Click **"Save"**

---

## ✅ Step 4: Test Your App

1. Open your frontend URL: `https://reportbuilderpro-web.azurestaticapps.net`
2. Try logging in or creating a report
3. If it works → **You're done!** 🎉

---

## 🔧 Troubleshooting

### Backend not deploying?
- Check **Deployment Center** → **Logs** tab for errors
- Make sure **Application location** is set to `server` (not root)

### Frontend shows errors?
- Check browser console (F12) for errors
- Make sure `VITE_API_URL` is set correctly in Static Web App settings
- Wait a few minutes after setting env vars - sometimes takes time

### Database connection failed?
- Double-check `MONGO_URI` in App Service settings
- Make sure you copied the **full** connection string from Cosmos DB
- Check Cosmos DB → **Connection string** → **Primary connection string**

### CORS errors?
- Make sure you added the frontend URL to CORS settings in App Service
- Check that URLs match exactly (no trailing slashes)

---

## 📝 Quick Reference

**Backend URL:** `https://your-app-api.azurewebsites.net`  
**Frontend URL:** `https://your-app-web.azurestaticapps.net`  
**Database:** Cosmos DB (MongoDB API)

**Environment Variables:**
- **App Service:** `MONGO_URI`, `MONGO_DB`, `PORT`
- **Static Web App:** `VITE_API_URL`
