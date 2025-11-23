# Simple Setup Instructions

## Goals:
1. ✅ Login reads from MongoDB
2. ✅ Templates stored in MongoDB (not files)
3. ✅ Keep code simple

## Step 1: Set up MongoDB Collections

**Recommended: Use MongoDB Compass** (easier to show the working database during demos)

### MongoDB Compass (Recommended)
1. Download MongoDB Compass: https://www.mongodb.com/products/compass
2. Connect using your connection string: `mongodb+srv://derrymahon_db_user:M00nahaw@reportbuilderpro.n1k4pi0.mongodb.net/`
3. Select database `ReportBuilderPro`
4. Create collections and add documents (see below)

**Why Compass?** Great for demonstrations - you can visually show the database structure and data in real-time.

### Alternative: Atlas Web Interface
If you prefer the web interface:
1. Go to https://cloud.mongodb.com
2. Click on your cluster → **"Browse Collections"**
3. Create database `ReportBuilderPro` if it doesn't exist
4. Create collections and add documents (see below)

---

### Collection 1: `Login`
Create a collection named `Login` and add this document:
```json
{
  "email": "derrymahon@icloud.com",
  "password": "prototype",
  "name": "Derry Mahon"
}
```

**In Compass:**
1. Right-click on the `ReportBuilderPro` database → **"Create Collection"**
2. Name it `Login` → Click **"Create Collection"**
3. Click **"Insert Document"** → Paste the JSON above → Click **"Insert"**

**In Atlas:** Click "Create Collection" → Name it "Login" → Click "Insert Document" → Paste JSON

### Collection 2: `Templates`
Create a collection named `Templates` and add documents like this:
```json
{
  "title": "Cover Page",
  "description": "Report cover page template",
  "pdfData": "data:application/pdf;base64,JVBERi0xLjQKJeLjz9MKMy..."
}
```

**In Compass:**
1. Right-click on the `ReportBuilderPro` database → **"Create Collection"**
2. Name it `Templates` → Click **"Create Collection"**
3. Click **"Insert Document"** → Paste the JSON (with your base64 PDF data) → Click **"Insert"**
4. Repeat for each template you want to add

**Note:** You'll need to convert your PDFs to base64 first (see helper script below).

**To convert PDF to base64:**
- Use an online tool like https://base64.guru/converter/encode/pdf
- Or use this Node.js script (see below)

## Step 2: Set Environment Variables

Create `server/.env`:
```
MONGO_URI=mongodb+srv://derrymahon_db_user:M00nahaw@reportbuilderpro.n1k4pi0.mongodb.net/
MONGO_DB=ReportBuilderPro
PORT=4000
```

## Step 3: Run Backend

```bash
cd server
npm install
npm start
```

## Step 4: Run Frontend

```bash
cd web
npm install
npm run dev
```

## Step 5: Deploy Backend

GitHub Pages can only host static files, so you need to deploy your backend separately:

### Option 1: Vercel (Recommended - Free & Easy)
1. Go to https://vercel.com
2. Sign up with GitHub
3. Import your `ReportBuilderPro` repository
4. Set **Root Directory** to `server`
5. Add environment variables:
   - `MONGO_URI` = your MongoDB connection string
   - `MONGO_DB` = `ReportBuilderPro`
   - `PORT` = `4000` (or leave default)
6. Click **Deploy**
7. Copy your deployment URL (e.g., `https://your-app.vercel.app`)

### Option 2: Railway
1. Go to https://railway.app
2. Sign up with GitHub
3. New Project → Deploy from GitHub
4. Select your repo, set root to `server`
5. Add environment variables (same as above)
6. Deploy

## Step 6: Deploy Frontend to GitHub Pages

1. **Set API URL secret in GitHub**:
   - Go to your repository → **Settings** → **Secrets and variables** → **Actions**
   - Click **"New repository secret"**
   - Name: `VITE_API_URL`
   - Value: Your backend URL (e.g., `https://your-app.vercel.app`)
   - Click **"Add secret"**

2. **Enable GitHub Pages**:
   - Go to **Settings** → **Pages**
   - Under "Source", select **"GitHub Actions"**
   - Save

3. **Deploy**:
   - Push to `main` branch, OR
   - Go to **Actions** tab → Run "Deploy to GitHub Pages" workflow

Your frontend will be at: `https://[your-username].github.io/ReportBuilderPro/`

---

## Helper Script: Convert PDFs to Base64

Create `server/scripts/convert-pdf.js`:
```javascript
const fs = require('fs');
const path = require('path');

const pdfPath = path.join(__dirname, '../../web/public/reports/report1.pdf');
const pdfBuffer = fs.readFileSync(pdfPath);
const base64 = pdfBuffer.toString('base64');
const dataUrl = `data:application/pdf;base64,${base64}`;

console.log('Base64 PDF data:');
console.log(dataUrl.substring(0, 100) + '...');
console.log('\nCopy this into MongoDB Templates collection as pdfData field');
```

Run: `node server/scripts/convert-pdf.js`

