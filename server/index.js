const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const { MongoClient, ObjectId } = require('mongodb');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 4000;

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/';
const DB_NAME = process.env.MONGO_DB || 'ReportBuilderPro';

app.use(cors());
app.use(express.json({ limit: '50mb' })); // Allow larger payloads for PDFs

let mongoClient;
let db;

async function connectToMongo() {
  try {
    mongoClient = new MongoClient(MONGO_URI);
    await mongoClient.connect();
    db = mongoClient.db(DB_NAME);
    console.log(`Connected to MongoDB database "${DB_NAME}"`);
  } catch (error) {
    console.error('Failed to connect to MongoDB:', error);
    process.exit(1);
  }
}

connectToMongo();

// Health check
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', hasDb: Boolean(db) });
});

// Login endpoint
app.post('/api/login', async (req, res) => {
  if (!db) {
    return res.status(503).json({ message: 'Database not ready yet' });
  }

  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ message: 'Email and password are required' });
  }

  try {
    const user = await db.collection('Login').findOne({ email });
    if (!user || user.password !== password) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    return res.json({ email: user.email, name: user.name });
  } catch (error) {
    console.error('Login error:', error);
    return res.status(500).json({ message: 'Unexpected server error' });
  }
});

// Get all templates
app.get('/api/templates', async (_req, res) => {
  if (!db) {
    return res.status(503).json({ message: 'Database not ready yet' });
  }

  try {
    const templates = await db.collection('Templates').find({}).toArray();
    // Return only metadata, not the full PDF data
    const templatesList = templates.map((t) => ({
      id: t._id.toString(),
      title: t.title,
      description: t.description,
    }));
    return res.json(templatesList);
  } catch (error) {
    console.error('Templates error:', error);
    return res.status(500).json({ message: 'Unexpected server error' });
  }
});

// Get PDF data for a template
app.get('/api/templates/:id', async (req, res) => {
  if (!db) {
    return res.status(503).json({ message: 'Database not ready yet' });
  }

  try {
    const template = await db.collection('Templates').findOne({ _id: new ObjectId(req.params.id) });
    if (!template) {
      return res.status(404).json({ message: 'Template not found' });
    }

    // Return PDF as base64 data URL
    return res.json({ pdfData: template.pdfData });
  } catch (error) {
    console.error('Template error:', error);
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

app.listen(PORT, () => {
  console.log(`Auth API listening on http://localhost:${PORT}`);
});

