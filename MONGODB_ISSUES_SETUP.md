# MongoDB Issues Collection Setup

## Document Structure

Each issue document should have this structure:

```json
{
  "id": 1,
  "jobId": "2024-001",
  "title": "Missing Safety Equipment",
  "description": "Hard hat inspection tag expired on site entrance",
  "severity": "high",
  "category": "Safety",
  "date": "2 hours ago"
}
```

## Field Descriptions

- **id** - Unique number for the issue
- **jobId** - Job reference number (format: YYYY-XXX)
- **title** - Short title describing the issue
- **description** - Full description of the issue
- **severity** - Risk level: "high", "medium", or "low"
- **category** - Issue category: "Safety", "Compliance", "Schedule", or "Material"
- **date** - When the issue was detected (e.g., "2 hours ago", "Just now")

---

## Quick Setup in MongoDB Compass

### Step 1: Connect to MongoDB
1. Open MongoDB Compass
2. Connect using: `mongodb+srv://derrymahon_db_user:M00nahaw@reportbuilderpro.n1k4pi0.mongodb.net/`
3. Select database: `ReportBuilderPro`

### Step 2: Create Collection
1. Right-click on `ReportBuilderPro` database
2. Click **"Create Collection"**
3. Name it: `Issues`
4. Click **"Create Collection"**

### Step 3: Add Documents (FASTEST METHOD)

**Option A: Copy-Paste JSON (Recommended - Fastest)**

1. Click on the `Issues` collection
2. Click **"Insert Document"** button (top right)
3. Click the **"{}"** icon (JSON view)
4. Copy and paste this JSON:

```json
{
  "id": 1,
  "jobId": "2024-001",
  "title": "Missing Safety Equipment",
  "description": "Hard hat inspection tag expired on site entrance",
  "severity": "high",
  "category": "Safety",
  "date": "2 hours ago"
}
```

5. Click **"Insert"**
6. Repeat for the second document:

```json
{
  "id": 2,
  "jobId": "2024-045",
  "title": "Documentation Incomplete",
  "description": "Progress report missing required signatures",
  "severity": "medium",
  "category": "Compliance",
  "date": "5 hours ago"
}
```

**Option B: Import JSON File**

1. In Compass, go to the `Issues` collection
2. Click **"Add Data"** → **"Import File"**
3. Select `mongodb_issues_example.json`
4. Click **"Import"**

---

## Example Documents (Copy-Paste Ready)

### Document 1:
```json
{
  "id": 1,
  "jobId": "2024-001",
  "title": "Missing Safety Equipment",
  "description": "Hard hat inspection tag expired on site entrance",
  "severity": "high",
  "category": "Safety",
  "date": "2 hours ago"
}
```

### Document 2:
```json
{
  "id": 2,
  "jobId": "2024-045",
  "title": "Documentation Incomplete",
  "description": "Progress report missing required signatures",
  "severity": "medium",
  "category": "Compliance",
  "date": "5 hours ago"
}
```

---

## Verification

After adding, you should see 2 documents in the `Issues` collection. Each document will have:
- ✅ All 7 fields (id, jobId, title, description, severity, category, date)
- ✅ Proper data types (numbers for id, strings for everything else)

---

## Notes

- MongoDB will automatically add an `_id` field (you can ignore this)
- The `id` field is separate and used by your application
- You can add more issues later using the same structure


