# MongoDB NLP Rules Collection Setup

This collection stores the **classification rules** that define what makes something an issue. This is like the "training data" that Scikit-learn would use to classify text.

---

## Collection: `NLPRules`

**Purpose:** Defines which keywords indicate an issue and what category/severity they belong to.

**This is the "brain" of the NLP system** - it tells the system:
- What words to look for
- What category they belong to (Schedule, Compliance, Material)
- What severity level to assign

---

## Document Structure

Each document represents one category of issues with its keywords:

```json
{
  "id": 1,
  "category": "schedule",
  "categoryName": "Schedule",
  "keywords": [
    "delayed",
    "rescheduled",
    "postponed",
    "behind schedule",
    "overdue"
  ],
  "severity": "medium",
  "description": "Issues related to project timelines and scheduling"
}
```

**Fields:**
- `id` - Unique number
- `category` - Internal code (schedule, compliance, material)
- `categoryName` - Display name (Schedule, Compliance, Material)
- `keywords` - Array of words/phrases that trigger this category
- `severity` - Default severity level (high, medium, low)
- `description` - What this category means

---

## Quick Setup in MongoDB Compass

### Step 1: Create Collection

1. In MongoDB Compass, right-click `ReportBuilderPro` database
2. Click **"Create Collection"**
3. Name: `NLPRules`
4. Click **"Create Collection"**

### Step 2: Add Rule Documents

Click on `NLPRules` collection → **"Insert Document"** → Click **"{}"** (JSON view)

**Rule 1: Schedule Issues**
```json
{
  "id": 1,
  "category": "schedule",
  "categoryName": "Schedule",
  "keywords": [
    "delayed",
    "rescheduled",
    "postponed",
    "behind schedule",
    "overdue"
  ],
  "severity": "medium",
  "description": "Issues related to project timelines and scheduling"
}
```

Click **"Insert"**

**Rule 2: Compliance Issues**
```json
{
  "id": 2,
  "category": "compliance",
  "categoryName": "Compliance",
  "keywords": [
    "pending",
    "non-compliant",
    "violation",
    "missing",
    "expired",
    "incomplete"
  ],
  "severity": "high",
  "description": "Issues related to safety, regulations, and compliance requirements"
}
```

Click **"Insert"**

**Rule 3: Material Issues**
```json
{
  "id": 3,
  "category": "material",
  "categoryName": "Material",
  "keywords": [
    "shortage",
    "out of stock",
    "unavailable",
    "insufficient",
    "low supply"
  ],
  "severity": "low",
  "description": "Issues related to material and supply availability"
}
```

Click **"Insert"**

---

## How This Works

1. **NLP system reads** these rules from MongoDB
2. **Scans text** for any of these keywords
3. **Classifies sentences** based on which keywords are found
4. **Assigns category and severity** based on the rule

---

## Example Usage

If text contains: **"Delivery delayed by two days"**

The system:
1. Finds keyword: `"delayed"` in the Schedule rule
2. Classifies as: **Schedule** category
3. Assigns severity: **medium**
4. Creates an issue with these properties

---

## Adding More Keywords

To add more keywords to a category:

1. Find the rule document in MongoDB Compass
2. Click **"Edit Document"**
3. Add new keyword to the `keywords` array
4. Click **"Update"**

Example - adding "cancelled" to Schedule:
```json
"keywords": [
  "delayed",
  "rescheduled",
  "postponed",
  "behind schedule",
  "overdue",
  "cancelled"
]
```

---

## Summary

✅ **NLPRules** collection = The "brain" that defines what is an issue  
✅ **3 documents** = One for each category (Schedule, Compliance, Material)  
✅ **Keywords array** = Words/phrases that trigger issue detection  
✅ **Easily expandable** = Add more keywords anytime

This is the database that tells your NLP system **what counts as an issue**!


