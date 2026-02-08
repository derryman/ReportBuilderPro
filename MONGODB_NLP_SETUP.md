# MongoDB NLP Datasets Setup

This guide shows you how to set up MongoDB collections for the NLP demo functionality.

---

## Two Collections Needed

### 1. `ReportTexts` Collection
Stores sample construction report texts that can be analyzed by the NLP system.

### 2. `NLPIssues` Collection  
Stores issues detected by NLP analysis from those report texts.

---

## Collection 1: ReportTexts

**Purpose:** Store sample report texts for NLP analysis

**Document Structure:**
```json
{
  "id": 1,
  "reportText": "Delivery of steel delayed by two days.\nSafety inspection pending for next week.\nConcrete pour rescheduled due to weather.\nMaterial shortage reported for electrical supplies.\nNon-compliant scaffolding found on site.",
  "source": "Site Report - Week 1",
  "date": "2024-01-15"
}
```

**Fields:**
- `id` - Unique number
- `reportText` - The actual text to analyze (one sentence per line, separated by `\n`)
- `source` - Where the report came from
- `date` - Date of the report

---

## Collection 2: NLPIssues

**Purpose:** Store issues detected by NLP analysis

**Document Structure:**
```json
{
  "id": 1,
  "reportId": 1,
  "jobId": "2024-001",
  "title": "Delivery of steel delayed...",
  "description": "Delivery of steel delayed by two days.",
  "severity": "medium",
  "category": "Schedule",
  "detectedDate": "2024-01-15T10:30:00Z",
  "keywords": ["delayed"]
}
```

**Fields:**
- `id` - Unique number
- `reportId` - Links back to the ReportTexts document
- `jobId` - Job reference number
- `title` - Short title (first few words of sentence)
- `description` - Full sentence that was flagged
- `severity` - "high", "medium", or "low"
- `category` - "Schedule", "Compliance", or "Material"
- `detectedDate` - When NLP detected this issue
- `keywords` - Array of keywords that triggered the detection

---

## Quick Setup in MongoDB Compass

### Step 1: Create ReportTexts Collection

1. In MongoDB Compass, right-click `ReportBuilderPro` database
2. Click **"Create Collection"**
3. Name: `ReportTexts`
4. Click **"Create Collection"**

### Step 2: Add ReportText Documents

1. Click on `ReportTexts` collection
2. Click **"Insert Document"**
3. Click **"{}"** icon (JSON view)
4. Copy and paste:

**Document 1:**
```json
{
  "id": 1,
  "reportText": "Delivery of steel delayed by two days.\nSafety inspection pending for next week.\nConcrete pour rescheduled due to weather.\nMaterial shortage reported for electrical supplies.\nNon-compliant scaffolding found on site.",
  "source": "Site Report - Week 1",
  "date": "2024-01-15"
}
```

5. Click **"Insert"**

6. Add Document 2:
```json
{
  "id": 2,
  "reportText": "Equipment maintenance overdue by three weeks.\nPermit expiration date approaching.\nConcrete delivery behind schedule.\nSteel beams unavailable from supplier.\nMissing safety documentation for crane operation.",
  "source": "Site Report - Week 2",
  "date": "2024-01-22"
}
```

### Step 3: Create NLPIssues Collection

1. Right-click `ReportBuilderPro` database
2. Click **"Create Collection"**
3. Name: `NLPIssues`
4. Click **"Create Collection"**

### Step 4: Add NLP Issue Documents

1. Click on `NLPIssues` collection
2. Click **"Insert Document"**
3. Click **"{}"** icon
4. Copy and paste each issue (5 issues from first report):

**Issue 1:**
```json
{
  "id": 1,
  "reportId": 1,
  "jobId": "2024-001",
  "title": "Delivery of steel delayed...",
  "description": "Delivery of steel delayed by two days.",
  "severity": "medium",
  "category": "Schedule",
  "detectedDate": "2024-01-15T10:30:00Z",
  "keywords": ["delayed"]
}
```

**Issue 2:**
```json
{
  "id": 2,
  "reportId": 1,
  "jobId": "2024-002",
  "title": "Safety inspection pending...",
  "description": "Safety inspection pending for next week.",
  "severity": "high",
  "category": "Compliance",
  "detectedDate": "2024-01-15T10:30:00Z",
  "keywords": ["pending"]
}
```

**Issue 3:**
```json
{
  "id": 3,
  "reportId": 1,
  "jobId": "2024-003",
  "title": "Concrete pour rescheduled...",
  "description": "Concrete pour rescheduled due to weather.",
  "severity": "medium",
  "category": "Schedule",
  "detectedDate": "2024-01-15T10:30:00Z",
  "keywords": ["rescheduled"]
}
```

**Issue 4:**
```json
{
  "id": 4,
  "reportId": 1,
  "jobId": "2024-004",
  "title": "Material shortage reported...",
  "description": "Material shortage reported for electrical supplies.",
  "severity": "low",
  "category": "Material",
  "detectedDate": "2024-01-15T10:30:00Z",
  "keywords": ["shortage"]
}
```

**Issue 5:**
```json
{
  "id": 5,
  "reportId": 1,
  "jobId": "2024-005",
  "title": "Non-compliant scaffolding found...",
  "description": "Non-compliant scaffolding found on site.",
  "severity": "high",
  "category": "Compliance",
  "detectedDate": "2024-01-15T10:30:00Z",
  "keywords": ["non-compliant"]
}
```

---

## What This Gives You

✅ **ReportTexts** - Sample texts you can load into the NLP demo  
✅ **NLPIssues** - Examples of what the NLP system detects  
✅ **Complete dataset** - Shows the full NLP pipeline from input to output

---

## Quick Copy-Paste Summary

**Fastest method:** Use the JSON above and copy-paste directly into MongoDB Compass "Insert Document" with JSON view enabled.


