/**
 * ReportBuilderPro — Express 5 REST API (Node.js middle tier)
 *
 * Role in the 3-tier architecture:
 * - Authenticates users via JWT and exposes a JSON API under /api.
 * - Persists templates, reports, and NLP analysis results in Azure Cosmos DB
 *   (MongoDB-compatible vCore cluster).
 * - Proxies NLP classification to the Python FastAPI service (NLP_SERVICE_URL)
 *   and optional grammar/style review to LanguageTool (WRITING_REVIEW_* env vars),
 *   keeping external service URLs and credentials server-side and off the browser.
 *
 * Collections: Login, Templates, Reports, ai_analysis
 *
 * Authentication:
 *   JSON Web Tokens (JWT, RFC 7519) are issued at /api/login and required on all
 *   subsequent /api/* requests via the requireAuth middleware.
 *   Reference: Jones, M. et al. (2015). JSON Web Token (RFC 7519). IETF.
 *
 * API design follows REST (Representational State Transfer) conventions:
 *   Reference: Fielding, R. T. (2000). Architectural styles and the design of
 *     network-based software architectures. Doctoral dissertation, UC Irvine.
 *
 * Persistence uses MongoDB document model via Azure Cosmos DB:
 *   Reference: Cattell, R. (2011). Scalable SQL and NoSQL data stores.
 *     ACM SIGMOD Record, 39(4), 12–27.
 *
 * Sections: config → middleware → MongoDB → auth → templates → reports →
 *           NLP helpers → analyze / writing-review / PDF → latest → shutdown.
 */
const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const jwt = require('jsonwebtoken');
const multer = require('multer');
const pdfParse = require('pdf-parse');
const { MongoClient, ObjectId } = require('mongodb');
const { getTextFromReport } = require('./lib/getTextFromReport');

// Load .env then .env.local (local overrides for local testing, e.g. MONGO_URI=mongodb://localhost:27017/)
dotenv.config({ path: '.env' });
dotenv.config({ path: '.env.local', override: true });

// Create Express app and set port
const app = express();
const PORT = process.env.PORT || 4000;

// Get MongoDB connection details from environment variables
const MONGO_URI = process.env.MONGO_URI || process.env.Mongo_URL || 'mongodb://localhost:27017/';
const DB_NAME = process.env.MONGO_DB || process.env.Mongo_DB || 'ReportBuilderPro';
const NLP_SERVICE_URL = process.env.NLP_SERVICE_URL || ''; // e.g. http://localhost:8000
// JWT signing secret — must be set in environment or the process exits immediately.
// Fail-fast on startup is safer than signing tokens with an undefined/weak secret.
const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
  console.error('FATAL: JWT_SECRET environment variable is not set. Exiting.');
  process.exit(1);
}
const WRITING_REVIEW_ENABLED = process.env.WRITING_REVIEW_ENABLED === '1';
const WRITING_REVIEW_URL = (process.env.WRITING_REVIEW_URL || '').trim();
const WRITING_REVIEW_LANGUAGE = (process.env.WRITING_REVIEW_LANGUAGE || 'en-GB').trim();
const WRITING_REVIEW_USERNAME = (process.env.WRITING_REVIEW_USERNAME || '').trim();
const WRITING_REVIEW_API_KEY = (process.env.WRITING_REVIEW_API_KEY || '').trim();
const WRITING_REVIEW_MAX_ISSUES = Math.max(
  1,
  Number.parseInt(process.env.WRITING_REVIEW_MAX_ISSUES || '12', 10) || 12
);

// Startup diagnostics (never log full connection strings)
console.log('[config]', {
  mongoUriFromEnv: Boolean(process.env.MONGO_URI || process.env.Mongo_URL),
  mongoUriPreview: MONGO_URI ? `${MONGO_URI.substring(0, 24)}…` : 'NOT SET',
  dbName: DB_NAME,
  nlpServiceSet: Boolean(NLP_SERVICE_URL),
  writingReviewEnabled: WRITING_REVIEW_ENABLED,
  writingReviewConfigured: Boolean(WRITING_REVIEW_URL),
});

// --- HTTP middleware ---
// SECURITY: open CORS allows any origin — restrict to frontend domain in production
app.use(cors());
// Allow large JSON payloads (needed for PDFs stored as base64)
app.use(express.json({ limit: '50mb' }));

// In-memory storage for PDF upload (single file, max 10MB)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (file.mimetype === 'application/pdf') return cb(null, true);
    cb(new Error('Only PDF files are allowed'));
  },
});

/** Return 400 early if id is not a valid MongoDB ObjectId (prevents unhandled cast errors). */
function validateObjectId(id, res) {
  if (!ObjectId.isValid(id)) {
    res.status(400).json({ message: 'Invalid ID format' });
    return false;
  }
  return true;
}

/** Require valid JWT for /api/* except login and health. Sets req.user = { email }. */
function requireAuth(req, res, next) {
  if (req.method === 'POST' && req.path === '/login') return next();
  if (req.method === 'GET' && req.path === '/health') return next();
  const auth = req.headers.authorization;
  const token = auth && auth.startsWith('Bearer ') ? auth.slice(7) : null;
  if (!token) {
    return res.status(401).json({ message: 'Authentication required' });
  }
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = { email: decoded.sub };
    next();
  } catch (err) {
    return res.status(401).json({ message: 'Invalid or expired token' });
  }
}
app.use('/api', requireAuth);

let mongoClient;
let db;

// --- MongoDB (retries help Azure Cosmos cold start / transient errors) ---
async function connectToMongo() {
  const maxRetries = 5;
  const retryDelayMs = 5000;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      console.log(`[${new Date().toISOString()}] MongoDB connection attempt ${attempt}/${maxRetries}...`);
      console.log('Connection string present:', !!MONGO_URI);
      console.log('Database name:', DB_NAME);

      // Cosmos DB: add options if using mongodb+srv (longer timeout, retryWrites off for compatibility)
      const uri = MONGO_URI.includes('?') ? `${MONGO_URI}&retryWrites=false` : `${MONGO_URI}?retryWrites=false`;
      const client = new MongoClient(uri, {
        serverSelectionTimeoutMS: 15000,
      });

      await client.connect();
      mongoClient = client;
      db = mongoClient.db(DB_NAME);
      console.log(`✅ Connected to MongoDB database "${DB_NAME}"`);
      return;
    } catch (error) {
      console.error(`❌ Attempt ${attempt}/${maxRetries} failed:`, error.message);
      if (attempt < maxRetries) {
        console.log(`Retrying in ${retryDelayMs / 1000}s...`);
        await new Promise((r) => setTimeout(r, retryDelayMs));
      } else {
        console.error('All connection attempts failed. API will return 503 until connection succeeds.');
      }
    }
  }
}

connectToMongo();

// --- Core routes ---
app.get('/api/health', (_req, res) => {
  console.log('Health check requested');
  res.json({ 
    status: 'ok', 
    hasDb: Boolean(db),
    timestamp: new Date().toISOString(),
  });
});

// Public: JWT issued here; all other /api/* require Bearer token (see requireAuth).
app.post('/api/login', async (req, res) => {
  // Get email and password from request
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ message: 'Email and password are required' });
  }

  // SECURITY: hardcoded credentials commented out — use DB users only
  // const hardcoded = [
  //   { email: 'admin', password: 'admin', name: 'Admin' },
  //   { email: 'test@hwhpm.ie', password: 'password', name: 'User Test' },
  // ];
  // const match = hardcoded.find((u) => u.email === email && u.password === password);
  // if (match) {
  //   const token = jwt.sign({ sub: match.email }, JWT_SECRET, { expiresIn: '7d' });
  //   return res.json({ email: match.email, name: match.name, token });
  // }

  // For other users, database must be connected
  if (!db) {
    return res.status(503).json({ message: 'Database not ready yet' });
  }

  try {
    const user = await db.collection('Login').findOne({ email });
    // SECURITY: plaintext password comparison — should use bcrypt.compare() in production
    if (!user || user.password !== password) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }
    const token = jwt.sign({ sub: user.email }, JWT_SECRET, { expiresIn: '7d' });
    return res.json({ email: user.email, name: user.name, token });
  } catch (error) {
    console.error('Login error:', error);
    return res.status(500).json({ message: 'Unexpected server error' });
  }
});

// --- Templates (scoped by createdBy = req.user.email) ---
app.get('/api/templates', async (req, res) => {
  if (!db) {
    return res.status(503).json({ message: 'Database not ready yet' });
  }

  try {
    const templates = await db.collection('Templates').find({ createdBy: req.user.email }).toArray();
    // Return only the metadata (id, title, description, components) - not the full PDF data
    // This keeps the response small and fast
    const templatesList = templates.map((t) => ({
      id: t._id.toString(),
      title: t.title,
      description: t.description,
      components: t.components || [], // Include template structure
    }));
    return res.json(templatesList);
  } catch (error) {
    console.error('Templates error:', error);
    return res.status(500).json({ message: 'Unexpected server error' });
  }
});

// Get full template data - only if created by current user
app.get('/api/templates/:id', async (req, res) => {
  if (!db) {
    return res.status(503).json({ message: 'Database not ready yet' });
  }

  if (!validateObjectId(req.params.id, res)) return;
  try {
    const template = await db.collection('Templates').findOne({
      _id: new ObjectId(req.params.id),
      createdBy: req.user.email,
    });
    if (!template) {
      return res.status(404).json({ message: 'Template not found' });
    }

    // Return the template data (including components structure and PDF if available)
    return res.json({
      id: template._id.toString(),
      title: template.title,
      description: template.description,
      components: template.components || [],
      pdfData: template.pdfData || null,
    });
  } catch (error) {
    console.error('Template error:', error);
    return res.status(500).json({ message: 'Unexpected server error' });
  }
});

// Create a new template (owned by current user)
app.post('/api/templates', async (req, res) => {
  if (!db) {
    return res.status(503).json({ message: 'Database not ready yet' });
  }

  try {
    const { title, description, components } = req.body;

    if (!title || !title.trim()) {
      return res.status(400).json({ message: 'Template title is required' });
    }

    const doc = {
      title: title.trim(),
      description: (description || '').trim(),
      components: Array.isArray(components) ? components : [],
      createdBy: req.user.email,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const result = await db.collection('Templates').insertOne(doc);
    return res.status(201).json({
      id: result.insertedId.toString(),
      message: 'Template saved successfully',
    });
  } catch (error) {
    console.error('Create template error:', error);
    return res.status(500).json({ message: 'Unexpected server error' });
  }
});

// Update an existing template (only if owned by current user)
app.put('/api/templates/:id', async (req, res) => {
  if (!db) {
    return res.status(503).json({ message: 'Database not ready yet' });
  }

  if (!validateObjectId(req.params.id, res)) return;
  try {
    const { title, description, components } = req.body;
    const id = req.params.id;

    if (!title || !title.trim()) {
      return res.status(400).json({ message: 'Template title is required' });
    }

    const update = {
      title: title.trim(),
      description: (description || '').trim(),
      components: Array.isArray(components) ? components : [],
      updatedAt: new Date(),
    };

    const result = await db.collection('Templates').updateOne(
      { _id: new ObjectId(id), createdBy: req.user.email },
      { $set: update }
    );

    if (result.matchedCount === 0) {
      return res.status(404).json({ message: 'Template not found' });
    }

    return res.json({
      id,
      message: 'Template updated successfully',
    });
  } catch (error) {
    console.error('Update template error:', error);
    return res.status(500).json({ message: 'Unexpected server error' });
  }
});

// Delete a template (only if owned by current user)
app.delete('/api/templates/:id', async (req, res) => {
  if (!db) {
    return res.status(503).json({ message: 'Database not ready yet' });
  }

  if (!validateObjectId(req.params.id, res)) return;
  try {
    const id = req.params.id;
    const result = await db.collection('Templates').deleteOne({ _id: new ObjectId(id), createdBy: req.user.email });

    if (result.deletedCount === 0) {
      return res.status(404).json({ message: 'Template not found' });
    }

    return res.json({
      id,
      message: 'Template deleted successfully',
    });
  } catch (error) {
    console.error('Delete template error:', error);
    return res.status(500).json({ message: 'Unexpected server error' });
  }
});

// --- Reports (captured field data from mobile or web) ---
app.post('/api/reports', async (req, res) => {
  if (!db) {
    console.error('Database not connected');
    return res.status(503).json({ message: 'Database not ready yet' });
  }

  try {
    const { templateId, jobId, capturedData, timestamp } = req.body;

    if (!templateId) {
      return res.status(400).json({ message: 'Template ID is required' });
    }

    if (!capturedData || Object.keys(capturedData).length === 0) {
      return res.status(400).json({ message: 'Captured data is required. Please fill in at least one field.' });
    }

    const reportDoc = {
      templateId,
      jobId: jobId || null,
      capturedData,
      timestamp: timestamp || new Date().toISOString(),
      createdBy: req.user.email,
      createdAt: new Date(),
    };

    const result = await db.collection('Reports').insertOne(reportDoc);

    return res.json({
      id: result.insertedId.toString(),
      message: 'Report saved successfully',
    });
  } catch (error) {
    console.error('Save report error:', error);
    return res.status(500).json({ 
      message: 'Unexpected server error',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Get all captured reports (only current user's).
// ?list=1 returns lightweight list without capturedData (faster for list/risk pages).
app.get('/api/reports', async (req, res) => {
  if (!db) {
    return res.status(503).json({ message: 'Database not ready yet' });
  }

  try {
    const reports = await db.collection('Reports')
      .find({ createdBy: req.user.email })
      .sort({ createdAt: -1 })
      .toArray();

    const listOnly = req.query.list === '1' || req.query.list === 'true';

    const reportsList = reports.map((r) => {
      const base = {
        id: r._id.toString(),
        templateId: r.templateId,
        jobId: r.jobId,
        timestamp: r.timestamp,
        createdAt: r.createdAt,
      };
      if (listOnly) return base;
      return { ...base, capturedData: r.capturedData };
    });

    return res.json(reportsList);
  } catch (error) {
    console.error('Get reports error:', error);
    return res.status(500).json({ message: 'Unexpected server error' });
  }
});

// Get a specific report (only if owned by current user)
app.get('/api/reports/:id', async (req, res) => {
  if (!db) {
    return res.status(503).json({ message: 'Database not ready yet' });
  }

  if (!validateObjectId(req.params.id, res)) return;
  try {
    const report = await db.collection('Reports').findOne({
      _id: new ObjectId(req.params.id),
      createdBy: req.user.email,
    });
    if (!report) {
      return res.status(404).json({ message: 'Report not found' });
    }

    return res.json({
      id: report._id.toString(),
      templateId: report.templateId,
      jobId: report.jobId,
      capturedData: report.capturedData,
      timestamp: report.timestamp,
      createdAt: report.createdAt,
    });
  } catch (error) {
    console.error('Get report error:', error);
    return res.status(500).json({ message: 'Unexpected server error' });
  }
});

// Update an existing report
app.put('/api/reports/:id', async (req, res) => {
  if (!db) {
    return res.status(503).json({ message: 'Database not ready yet' });
  }

  if (!validateObjectId(req.params.id, res)) return;
  try {
    const { jobId, capturedData, timestamp } = req.body;
    const id = req.params.id;

    if (!capturedData || Object.keys(capturedData).length === 0) {
      return res.status(400).json({ message: 'Captured data is required' });
    }

    const update = {
      ...(jobId !== undefined && { jobId: jobId || null }),
      capturedData,
      ...(timestamp && { timestamp }),
      updatedAt: new Date(),
    };

    const result = await db.collection('Reports').updateOne(
      { _id: new ObjectId(id), createdBy: req.user.email },
      { $set: update }
    );

    if (result.matchedCount === 0) {
      return res.status(404).json({ message: 'Report not found' });
    }

    return res.json({
      id,
      message: 'Report updated successfully',
    });
  } catch (error) {
    console.error('Update report error:', error);
    return res.status(500).json({ message: 'Unexpected server error' });
  }
});

// Delete a report
app.delete('/api/reports/:id', async (req, res) => {
  if (!db) {
    return res.status(503).json({ message: 'Database not ready yet' });
  }

  if (!validateObjectId(req.params.id, res)) return;
  try {
    const id = req.params.id;
    const result = await db.collection('Reports').deleteOne({ _id: new ObjectId(id), createdBy: req.user.email });

    if (result.deletedCount === 0) {
      return res.status(404).json({ message: 'Report not found' });
    }

    return res.json({
      id,
      message: 'Report deleted successfully',
    });
  } catch (error) {
    console.error('Delete report error:', error);
    return res.status(500).json({ message: 'Unexpected server error' });
  }
});

// --- NLP / writing review helpers (used by routes below) ---

/** Build a single review document plus per-field segments so LanguageTool offsets map back to report fields. */
function getWritingReviewSegmentsFromReport(report) {
  const capturedData = report && report.capturedData;
  if (!capturedData || typeof capturedData !== 'object') {
    return { text: '', segments: [] };
  }

  const rawSegments = [];
  for (const [fieldKey, value] of Object.entries(capturedData)) {
    if (!value || typeof value !== 'object') continue;

    const fieldLabel =
      typeof value.title === 'string' && value.title.trim()
        ? value.title.trim()
        : 'Report text';

    const candidates = [
      ['text', value.text],
      ['progress', value.progress],
      ['issues', value.issues],
    ];

    for (const [fieldType, candidate] of candidates) {
      if (typeof candidate === 'string' && candidate.trim()) {
        rawSegments.push({
          fieldKey,
          fieldType,
          fieldLabel,
          text: candidate.trim(),
        });
      }
    }
  }

  let cursor = 0;
  const segments = rawSegments.map((segment, index) => {
    const start = cursor;
    const end = start + segment.text.length;
    cursor = end;
    if (index < rawSegments.length - 1) cursor += 2;
    return { ...segment, start, end };
  });

  return {
    text: rawSegments.map((segment) => segment.text).join('\n\n'),
    segments,
  };
}

/** True when LanguageTool (or compatible) URL is set and the feature flag is on. */
function isWritingReviewConfigured() {
  return WRITING_REVIEW_ENABLED && Boolean(WRITING_REVIEW_URL);
}

/** Map a character offset in the concatenated review text back to a field segment. */
function findSegmentForOffset(segments, offset) {
  if (!Array.isArray(segments) || segments.length === 0) return null;
  return (
    segments.find((segment) => offset >= segment.start && offset <= segment.end) ||
    segments.find((segment) => offset < segment.start) ||
    segments[segments.length - 1]
  );
}

/** POST form body to LanguageTool-compatible /check endpoint. */
async function callWritingReviewService(text) {
  const params = new URLSearchParams({
    text: text || '',
    language: WRITING_REVIEW_LANGUAGE,
  });

  if (WRITING_REVIEW_USERNAME) params.set('username', WRITING_REVIEW_USERNAME);
  if (WRITING_REVIEW_API_KEY) params.set('apiKey', WRITING_REVIEW_API_KEY);

  const res = await fetch(WRITING_REVIEW_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: params.toString(),
    signal: AbortSignal.timeout(15000), // prevent hung requests if LanguageTool is slow
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(errText || `Writing review service returned ${res.status}`);
  }

  return res.json();
}

/** Turn provider "matches" into stable issue objects with fieldKey for the UI. */
function normaliseWritingReviewIssues(matches, segments) {
  if (!Array.isArray(matches)) return [];

  return matches
    .slice(0, WRITING_REVIEW_MAX_ISSUES)
    .map((match) => {
      const offset = Number(match.offset) || 0;
      const length = Number(match.length) || 0;
      const segment = findSegmentForOffset(segments, offset);
      const relativeOffset = segment ? Math.max(0, offset - segment.start) : 0;
      const issueText = segment
        ? segment.text.slice(relativeOffset, relativeOffset + length).trim()
        : '';
      const context =
        match &&
        match.context &&
        typeof match.context.text === 'string' &&
        match.context.text.trim()
          ? match.context.text.trim()
          : segment
            ? segment.text.slice(
                Math.max(0, relativeOffset - 25),
                Math.min(segment.text.length, relativeOffset + length + 25)
              )
            : '';

      return {
        fieldKey: segment ? segment.fieldKey : null,
        fieldType: segment ? segment.fieldType : 'unknown',
        fieldLabel: segment ? segment.fieldLabel : 'Report text',
        message: match.message || 'Possible writing issue found.',
        shortMessage: match.shortMessage || '',
        category:
          (match.rule &&
            match.rule.category &&
            typeof match.rule.category.name === 'string' &&
            match.rule.category.name) ||
          'Writing',
        context,
        issueText,
        replacements: Array.isArray(match.replacements)
          ? match.replacements
              .map((replacement) => replacement && replacement.value)
              .filter(Boolean)
              .slice(0, 5)
          : [],
        ruleId: (match.rule && match.rule.id) || 'unknown',
      };
    });
}

/** Call Python NLP service; returns { flags, metadata } or throws. */
async function callNlpService(text) {
  const base = NLP_SERVICE_URL.replace(/\/$/, '');
  if (!base) {
    throw new Error('NLP_SERVICE_URL is not set');
  }
  const res = await fetch(`${base}/nlp/analyze`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text: text || '' }),
    signal: AbortSignal.timeout(15000), // prevent hung requests if NLP container is cold-starting
  });
  if (!res.ok) {
    const errText = await res.text();
    throw new Error(errText || `NLP service returned ${res.status}`);
  }
  return res.json();
}

// Persist analysis to `ai_analysis` for history and GET /api/nlp/latest.
app.post('/api/reports/:id/analyze', async (req, res) => {
  if (!db) {
    return res.status(503).json({ message: 'Database not ready yet' });
  }

  if (!validateObjectId(req.params.id, res)) return;
  try {
    const id = req.params.id;
    const report = await db.collection('Reports').findOne({
      _id: new ObjectId(id),
      createdBy: req.user.email,
    });
    if (!report) {
      return res.status(404).json({ message: 'Report not found' });
    }

    const text = getTextFromReport(report);
    let flags = [];
    let metadata = { model_version: 'none' };

    if (NLP_SERVICE_URL) {
      try {
        const nlpResult = await callNlpService(text);
        flags = nlpResult.flags || [];
        metadata = nlpResult.metadata || metadata;
      } catch (err) {
        console.error('NLP service error:', err);
        return res.status(502).json({
          message: 'NLP service unavailable or error',
          error: err instanceof Error ? err.message : String(err),
        });
      }
    }

    const reportTitle =
      (report.capturedData && typeof report.capturedData === 'object' && Object.values(report.capturedData).find((v) => v && v.title))
        ? Object.values(report.capturedData).find((v) => v && v.title).title
        : `Report ${id}`;

    const analysisDoc = {
      reportId: id,
      reportTitle: reportTitle.substring(0, 200),
      flags,
      processed_at: new Date(),
      model_version: metadata.model_version || 'python-ml-v1.0',
      createdBy: req.user.email,
    };

    await db.collection('ai_analysis').insertOne(analysisDoc);

    return res.json({
      reportId: id,
      reportTitle: analysisDoc.reportTitle,
      flags,
      processed_at: analysisDoc.processed_at,
    });
  } catch (error) {
    console.error('Analyze report error:', error);
    return res.status(500).json({ message: 'Unexpected server error' });
  }
});

// Grammar/style check via configured LanguageTool-compatible endpoint.
app.post('/api/reports/:id/writing-review', async (req, res) => {
  if (!db) {
    return res.status(503).json({ message: 'Database not ready yet' });
  }

  if (!validateObjectId(req.params.id, res)) return;
  try {
    const id = req.params.id;
    const report = await db.collection('Reports').findOne({
      _id: new ObjectId(id),
      createdBy: req.user.email,
    });
    if (!report) {
      return res.status(404).json({ message: 'Report not found' });
    }

    const { text, segments } = getWritingReviewSegmentsFromReport(report);
    if (!text) {
      return res.json({
        reviewAvailable: isWritingReviewConfigured(),
        configured: isWritingReviewConfigured(),
        provider: isWritingReviewConfigured() ? 'languagetool' : 'none',
        issues: [],
        summary: {
          issueCount: 0,
          textLength: 0,
          checkedAt: new Date().toISOString(),
        },
        message: 'No report text found to review.',
      });
    }

    if (!isWritingReviewConfigured()) {
      return res.json({
        reviewAvailable: false,
        configured: false,
        provider: 'none',
        issues: [],
        summary: {
          issueCount: 0,
          textLength: text.length,
          checkedAt: null,
        },
        message: 'Writing review is not configured on this server.',
      });
    }

    const providerResult = await callWritingReviewService(text);
    const issues = normaliseWritingReviewIssues(providerResult.matches, segments);

    return res.json({
      reviewAvailable: true,
      configured: true,
      provider: 'languagetool',
      issues,
      summary: {
        issueCount: issues.length,
        textLength: text.length,
        checkedAt: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error('Writing review error:', error);
    return res.status(502).json({
      message: 'Writing review service unavailable or error',
      error: error instanceof Error ? error.message : String(error),
    });
  }
});

// PDF upload → pdf-parse text → same NLP path as reports; optional persist to ai_analysis.
app.post('/api/nlp/analyze-pdf', upload.single('pdf'), async (req, res) => {
  if (!req.file || !req.file.buffer) {
    return res.status(400).json({ message: 'No PDF file uploaded. Use field name "pdf".' });
  }
  let text;
  try {
    const data = await pdfParse(req.file.buffer);
    text = (data && data.text) ? data.text.trim() : '';
  } catch (err) {
    console.error('PDF parse error:', err);
    return res.status(400).json({ message: 'Could not extract text from PDF', error: err.message });
  }
  if (!text) {
    return res.status(400).json({ message: 'PDF has no extractable text.' });
  }
  let flags = [];
  let metadata = { model_version: 'none', classifier_mode: 'ml' };
  if (NLP_SERVICE_URL) {
    try {
      const nlpResult = await callNlpService(text);
      flags = nlpResult.flags || [];
      metadata = nlpResult.metadata || metadata;
    } catch (err) {
      console.error('NLP service error:', err);
      return res.status(502).json({
        message: 'NLP service unavailable or error',
        error: err instanceof Error ? err.message : String(err),
      });
    }
  } else {
    metadata.nlp_configured = false;
  }
  const reportTitle = (req.file.originalname || 'Uploaded PDF').substring(0, 200);
  if (db) {
    const analysisDoc = {
      reportId: null,
      reportTitle: `PDF: ${reportTitle}`,
      flags,
      processed_at: new Date(),
      model_version: metadata.model_version || 'python-ml-v1.0',
      createdBy: req.user.email,
    };
    await db.collection('ai_analysis').insertOne(analysisDoc);
  }
  return res.json({
    reportTitle: `PDF: ${reportTitle}`,
    flags,
    metadata: { text_length: text.length, ...metadata },
    text_preview: text.length > 0 ? text.substring(0, 500) : null,
    processed_at: new Date(),
  });
});

app.get('/api/nlp/latest', async (req, res) => {
  if (!db) {
    return res.status(503).json({ message: 'Database not ready yet' });
  }

  try {
    const latest = await db.collection('ai_analysis').findOne(
      { createdBy: req.user.email },
      { sort: { processed_at: -1 } }
    );
    if (!latest) {
      return res.json({ latest: null });
    }
    return res.json({
      latest: {
        reportId: latest.reportId,
        reportTitle: latest.reportTitle,
        flags: latest.flags || [],
        processed_at: latest.processed_at,
        model_version: latest.model_version,
      },
    });
  } catch (error) {
    console.error('Get latest analysis error:', error);
    return res.status(500).json({ message: 'Unexpected server error' });
  }
});

process.on('SIGINT', async () => {
  if (mongoClient) {
    await mongoClient.close();
    console.log('MongoDB connection closed');
  }
  process.exit(0);
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`========================================`);
  console.log(`🚀 Server started successfully!`);
  console.log(`📡 Listening on port ${PORT}`);
  console.log(`🌐 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`💾 Database: ${DB_NAME}`);
  console.log(`🔌 Database connected: ${db ? 'Yes' : 'No (connecting...)'}`);
  console.log(`========================================`);
});

