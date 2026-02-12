# How to View Your Database in Browser

View your templates, reports, and users directly in Azure Cosmos DB.

---

## Method 1: Azure Portal Data Explorer (Browser)

**Note:** Data Explorer may not be available for all MongoDB API accounts. If you don't see it, use MongoDB Compass (Method 2) instead.

1. Go to [portal.azure.com](https://portal.azure.com)
2. Navigate to your **Cosmos DB** resource (`reportbuilderprodb`)
3. Look for **"Data Explorer"** in:
   - Left menu (scroll down if needed)
   - Top action bar
   - Under "Features" section
4. If found, expand your database: `ReportBuilderPro`
5. Click on the collection you want to view:
   - **`Templates`** - Your report templates
   - **`Reports`** - Saved reports
   - **`Login`** - User accounts
   - **`Issues`** - Issue tracking (if you have this collection)
6. Click on any document to view/edit it

**If Data Explorer is not available:** Use MongoDB Compass (Method 2) - it's better for MongoDB API anyway!

---

## Method 2: MongoDB Compass (Desktop App) ⭐ RECOMMENDED

**Best for:** MongoDB API accounts, advanced features, better UI

**Why use this:** Azure Portal Data Explorer may not be available for MongoDB API accounts. MongoDB Compass is the official MongoDB tool and works perfectly with Azure Cosmos DB MongoDB API.

### Setup:

1. **Download MongoDB Compass:**
   - Go to [mongodb.com/try/download/compass](https://www.mongodb.com/try/download/compass)
   - Download and install (free)

2. **Get Connection String:**
   - Azure Portal → Your **Cosmos DB** → **"Connection string"**
   - Copy the **"Primary connection string"**
   - Looks like: `mongodb://accountname:KEY@accountname.mongocluster.cosmos.azure.com:10255/?ssl=true`

3. **Connect:**
   - Open MongoDB Compass
   - Click **"New Connection"**
   - Paste your connection string
   - Click **"Connect"**

4. **Browse:**
   - Expand `ReportBuilderPro` database
   - Click on `Templates` collection
   - View/edit documents

**Features:**
- ✅ Better UI than Azure Portal
- ✅ Advanced filtering and querying
- ✅ Export/import data
- ✅ Schema analysis
- ✅ Performance insights

---

## What You'll See

### Templates Collection
Each document contains:
```json
{
  "_id": "ObjectId(...)",
  "title": "Daily Site Report",
  "description": "Template for daily reports",
  "components": [
    {
      "id": "comp-123",
      "type": "image",
      "data": { "title": "Site Photo" }
    },
    {
      "id": "comp-124",
      "type": "text",
      "data": { "title": "Notes", "text": "" }
    }
  ],
  "createdAt": "2024-01-01T00:00:00Z",
  "updatedAt": "2024-01-01T00:00:00Z"
}
```

### Reports Collection
```json
{
  "_id": "ObjectId(...)",
  "templateId": "...",
  "jobId": "2024-001",
  "capturedData": { ... },
  "timestamp": "2024-01-01T00:00:00Z",
  "createdAt": "2024-01-01T00:00:00Z"
}
```

### Login Collection
```json
{
  "_id": "ObjectId(...)",
  "email": "user@example.com",
  "password": "plaintextpassword",
  "name": "User Name",
  "createdAt": "2024-01-01T00:00:00Z"
}
```

---

## Quick Tips

### Filter Documents
- **Azure Portal:** Use the filter bar at the top
- **MongoDB Compass:** Use the filter box (e.g., `{ "title": "Daily" }`)

### Edit Documents
- Click on any document to edit
- Make changes and click **"Update"** or **"Save"**

### Add New Document
- **Azure Portal:** Right-click collection → **"New Document"**
- **MongoDB Compass:** Click **"Insert Document"**

### Delete Document
- **Azure Portal:** Click document → **"Delete"** button
- **MongoDB Compass:** Click document → **"Delete"** button

---

## Troubleshooting

### Can't connect in Compass?
- Double-check the connection string (copy it again from Azure)
- Make sure you're using the **Primary connection string**
- Try adding `&retryWrites=false` at the end if it fails

### Can't see collections?
- Make sure you're looking in the right database: `ReportBuilderPro`
- Collections are created automatically when you first save data
- If empty, create a template in the app first

### Documents look weird?
- That's normal - MongoDB stores data in JSON format
- The `_id` field is MongoDB's unique identifier
- Your app converts this to a string `id` field

---

## Security Note ⚠️

**Never share your connection string publicly!** It gives full access to your database.

- Keep it private
- Don't commit it to GitHub
- Use environment variables in your app
- Rotate keys if exposed

---

## Quick Reference

**Azure Portal:** `portal.azure.com` → Cosmos DB → Data Explorer  
**MongoDB Compass:** Download from mongodb.com → Connect with connection string  
**Database:** `ReportBuilderPro`  
**Collections:** `Templates`, `Reports`, `Login`, `Issues`
