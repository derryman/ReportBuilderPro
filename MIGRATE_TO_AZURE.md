# Migrate Data from Local MongoDB to Azure Cosmos DB

You have data in MongoDB Compass on your desktop. Here's how to move it to Azure Cosmos DB.

---

## Step 1: Export Data from Local MongoDB

### Option A: Using MongoDB Compass (Easiest)

1. Open **MongoDB Compass** on your desktop
2. Connect to your local MongoDB (usually `mongodb://localhost:27017`)
3. Select your database: `ReportBuilderPro`
4. For each collection you want to migrate:

   **For Login collection:**
   - Click on the **"Login"** collection
   - Click **"Export Collection"** button (top right)
   - Choose **"Export the full collection"**
   - Format: **JSON**
   - Click **"Export"** → Save as `login.json`

   **For Templates collection:**
   - Click on **"Templates"** collection
   - Click **"Export Collection"**
   - Format: **JSON**
   - Click **"Export"** → Save as `templates.json`

   **For Reports collection:**
   - Click on **"Reports"** collection
   - Click **"Export Collection"**
   - Format: **JSON**
   - Click **"Export"** → Save as `reports.json`

   **For Issues collection (if you have it):**
   - Click on **"Issues"** collection
   - Click **"Export Collection"**
   - Format: **JSON**
   - Click **"Export"** → Save as `issues.json`

### Option B: Using Command Line (mongoexport)

If you have MongoDB tools installed:

```bash
# Export Login collection
mongoexport --uri="mongodb://localhost:27017/ReportBuilderPro" --collection=Login --out=login.json --jsonArray

# Export Templates collection
mongoexport --uri="mongodb://localhost:27017/ReportBuilderPro" --collection=Templates --out=templates.json --jsonArray

# Export Reports collection
mongoexport --uri="mongodb://localhost:27017/ReportBuilderPro" --collection=Reports --out=reports.json --jsonArray

# Export Issues collection (if exists)
mongoexport --uri="mongodb://localhost:27017/ReportBuilderPro" --collection=Issues --out=issues.json --jsonArray
```

---

## Step 2: Get Your Azure Cosmos DB Connection String

1. Go to **Azure Portal** → Your **Cosmos DB** resource
2. Left menu → **"Connection string"** (under Settings)
3. Copy the **"Primary connection string"**
   - It looks like: `mongodb://accountname:KEY@accountname.mongocluster.cosmos.azure.com:10255/?ssl=true`
4. **Save this** - you'll need it in Step 3

---

## Step 3: Import Data into Azure Cosmos DB

### Option A: Using MongoDB Compass (Recommended)

1. Open **MongoDB Compass**
2. Click **"New Connection"**
3. Paste your **Azure Cosmos DB connection string** from Step 2
4. Click **"Connect"**
5. Select database: `ReportBuilderPro` (or create it if it doesn't exist)

   **For each collection:**

   **Import Login:**
   - Click on **"Login"** collection (create it if needed)
   - Click **"Add Data"** → **"Import File"**
   - Select `login.json` (the file you exported)
   - Click **"Import"**

   **Import Templates:**
   - Click on **"Templates"** collection (create it if needed)
   - Click **"Add Data"** → **"Import File"**
   - Select `templates.json`
   - Click **"Import"**

   **Import Reports:**
   - Click on **"Reports"** collection (create it if needed)
   - Click **"Add Data"** → **"Import File"**
   - Select `reports.json`
   - Click **"Import"**

   **Import Issues (if you have it):**
   - Click on **"Issues"** collection (create it if needed)
   - Click **"Add Data"** → **"Import File"**
   - Select `issues.json`
   - Click **"Import"**

### Option B: Using Azure Portal Data Explorer

1. Go to **Azure Portal** → Your **Cosmos DB** → **"Data Explorer"**
2. Expand your database → Right-click → **"New Collection"**
   - Name: `Login` → Create
   - Repeat for: `Templates`, `Reports`, `Issues` (if needed)
3. For each collection:
   - Click on the collection
   - Click **"New Document"**
   - Copy-paste each document from your exported JSON file
   - Click **"Save"**
   - Repeat for all documents

**Note:** This method is slower if you have many documents. Use Compass (Option A) if possible.

### Option C: Using Command Line (mongoimport)

If you have MongoDB tools installed:

```bash
# Import Login
mongoimport --uri="YOUR_AZURE_CONNECTION_STRING" --db=ReportBuilderPro --collection=Login --file=login.json --jsonArray

# Import Templates
mongoimport --uri="YOUR_AZURE_CONNECTION_STRING" --db=ReportBuilderPro --collection=Templates --file=templates.json --jsonArray

# Import Reports
mongoimport --uri="YOUR_AZURE_CONNECTION_STRING" --db=ReportBuilderPro --collection=Reports --file=reports.json --jsonArray

# Import Issues (if exists)
mongoimport --uri="YOUR_AZURE_CONNECTION_STRING" --db=ReportBuilderPro --collection=Issues --file=issues.json --jsonArray
```

**Replace `YOUR_AZURE_CONNECTION_STRING` with your actual connection string from Step 2.**

---

## Step 4: Verify Data Migration

1. In MongoDB Compass (connected to Azure):
   - Check each collection has the right number of documents
   - Open a few documents to verify data looks correct
2. Or in Azure Portal → Data Explorer:
   - Browse each collection
   - Verify documents are there

---

## Step 5: Update Your App Service Settings

1. Go to **Azure Portal** → Your **App Service** (backend)
2. Left menu → **"Configuration"** → **"Application settings"**
3. Verify:
   - `MONGO_URI` = Your Azure Cosmos DB connection string (from Step 2)
   - `MONGO_DB` = `ReportBuilderPro`
4. If not set, add them and click **"Save"**
5. Your backend will restart automatically

---

## Step 6: Test Your App

1. Open your frontend URL: `https://your-app.azurestaticapps.net`
2. Try logging in with a user from your migrated `Login` collection
3. Check if templates/reports load correctly

**If everything works → Migration complete!** 🎉

---

## Troubleshooting

### Can't connect to Azure Cosmos DB in Compass
- Double-check the connection string (copy it again from Azure Portal)
- Make sure you're using the **Primary connection string**
- Try adding `&retryWrites=false` at the end if connection fails

### Import fails in Compass
- Make sure JSON file format is correct (should be JSON array: `[{...}, {...}]`)
- If exported as single documents, wrap them in an array: `[{...}]`
- Check file size - very large files might need to be split

### Data looks wrong after import
- Check that `_id` fields are preserved (they should be)
- Verify all fields are present
- Compare a few documents side-by-side with local MongoDB

### App still shows old data
- Make sure `MONGO_URI` in App Service points to Azure Cosmos DB (not localhost)
- Restart the App Service: Overview → Restart
- Clear browser cache and try again

---

## Quick Checklist

- [ ] Exported all collections from local MongoDB (Login, Templates, Reports, Issues)
- [ ] Got Azure Cosmos DB connection string
- [ ] Created collections in Azure Cosmos DB (if they don't exist)
- [ ] Imported all JSON files into Azure Cosmos DB
- [ ] Verified data in Azure Cosmos DB
- [ ] Updated App Service `MONGO_URI` to point to Azure
- [ ] Tested login and app functionality

---

## Collections You Might Have

Based on your code, you likely have:
- **Login** - User accounts for login
- **Templates** - Report templates
- **Reports** - Saved reports
- **Issues** - Issue tracking (if you set this up)

Export and import all of them!
