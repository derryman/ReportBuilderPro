// Import required libraries
const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const { MongoClient, ObjectId } = require('mongodb');

// Load environment variables from .env file
dotenv.config();

// Create Express app and set port
const app = express();
const PORT = process.env.PORT || 4000;

// Get MongoDB connection details from environment variables
// These come from the .env file you create
const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/';
const DB_NAME = process.env.MONGO_DB || 'ReportBuilderPro';

// Enable CORS (allows frontend to talk to backend)
app.use(cors());
// Allow large JSON payloads (needed for PDFs stored as base64)
app.use(express.json({ limit: '50mb' }));

// Variables to store MongoDB connection
let mongoClient;
let db;

// Function to connect to MongoDB
async function connectToMongo() {
  try {
    console.log('Attempting to connect to MongoDB...');
    console.log('Connection string present:', !!MONGO_URI);
    console.log('Database name:', DB_NAME);
    
    // Create a new MongoDB client with the connection string
    mongoClient = new MongoClient(MONGO_URI);
    // Connect to MongoDB
    await mongoClient.connect();
    // Select the database we want to use
    db = mongoClient.db(DB_NAME);
    console.log(`✅ Connected to MongoDB database "${DB_NAME}"`);
  } catch (error) {
    console.error('❌ Failed to connect to MongoDB:', error.message);
    console.error('Error details:', error);
    // Don't exit - let the server keep running so we can see the error
    // The API will return 503 until connection succeeds
  }
}

// Start the connection when server starts
console.log('Starting MongoDB connection...');
console.log('MONGO_URI:', MONGO_URI ? 'Set' : 'NOT SET');
console.log('MONGO_DB:', DB_NAME);
connectToMongo();

// Health check
app.get('/api/health', (_req, res) => {
  console.log('Health check requested');
  res.json({ 
    status: 'ok', 
    hasDb: Boolean(db),
    timestamp: new Date().toISOString(),
  });
});

// Test endpoint to verify connectivity
app.get('/api/test', (_req, res) => {
  console.log('Test endpoint called');
  res.json({ 
    message: 'Backend is reachable!',
    timestamp: new Date().toISOString(),
    dbConnected: Boolean(db),
  });
});

// Login endpoint - checks credentials against MongoDB "Login" collection
app.post('/api/login', async (req, res) => {
  // Make sure database is connected
  if (!db) {
    return res.status(503).json({ message: 'Database not ready yet' });
  }

  // Get email and password from request
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ message: 'Email and password are required' });
  }

  try {
    // Look up user in the "Login" collection by email
    const user = await db.collection('Login').findOne({ email });
    // Check if user exists and password matches
    if (!user || user.password !== password) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    // Return user info if login successful
    return res.json({ email: user.email, name: user.name });
  } catch (error) {
    console.error('Login error:', error);
    return res.status(500).json({ message: 'Unexpected server error' });
  }
});

// Get all templates - returns list from MongoDB "Templates" collection
app.get('/api/templates', async (_req, res) => {
  // Make sure database is connected
  if (!db) {
    return res.status(503).json({ message: 'Database not ready yet' });
  }

  try {
    // Get all documents from the "Templates" collection
    const templates = await db.collection('Templates').find({}).toArray();
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

// Get full template data (including structure) for a specific template by ID
app.get('/api/templates/:id', async (req, res) => {
  // Make sure database is connected
  if (!db) {
    return res.status(503).json({ message: 'Database not ready yet' });
  }

  try {
    // Find the template by its ID in the "Templates" collection
    const template = await db.collection('Templates').findOne({ _id: new ObjectId(req.params.id) });
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

// Create a new template
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

// Update an existing template
app.put('/api/templates/:id', async (req, res) => {
  if (!db) {
    return res.status(503).json({ message: 'Database not ready yet' });
  }

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
      { _id: new ObjectId(id) },
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

// Delete a template
app.delete('/api/templates/:id', async (req, res) => {
  if (!db) {
    return res.status(503).json({ message: 'Database not ready yet' });
  }

  try {
    const id = req.params.id;
    const result = await db.collection('Templates').deleteOne({ _id: new ObjectId(id) });

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

// Save a captured report from mobile
app.post('/api/reports', async (req, res) => {
  if (!db) {
    console.error('Database not connected');
    return res.status(503).json({ message: 'Database not ready yet' });
  }

  try {
    const { templateId, jobId, capturedData, timestamp } = req.body;
    
    console.log('Received report save request:', {
      templateId,
      jobId,
      capturedDataKeys: capturedData ? Object.keys(capturedData) : 'none',
      hasTimestamp: !!timestamp,
    });
    
    if (!templateId) {
      console.error('Missing templateId');
      return res.status(400).json({ message: 'Template ID is required' });
    }
    
    if (!capturedData || Object.keys(capturedData).length === 0) {
      console.error('Missing or empty capturedData');
      return res.status(400).json({ message: 'Captured data is required. Please fill in at least one field.' });
    }

    // Insert the captured report into the "Reports" collection
    const reportDoc = {
      templateId,
      jobId: jobId || null,
      capturedData, // This will contain the image and text data
      timestamp: timestamp || new Date().toISOString(),
      createdAt: new Date(),
    };

    console.log('Inserting report into database...');
    const result = await db.collection('Reports').insertOne(reportDoc);
    console.log('Report saved successfully with ID:', result.insertedId.toString());

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

// Get all captured reports
app.get('/api/reports', async (_req, res) => {
  if (!db) {
    return res.status(503).json({ message: 'Database not ready yet' });
  }

  try {
    // Get all reports, sorted by most recent first
    const reports = await db.collection('Reports')
      .find({})
      .sort({ createdAt: -1 })
      .toArray();

    const reportsList = reports.map((r) => ({
      id: r._id.toString(),
      templateId: r.templateId,
      jobId: r.jobId,
      capturedData: r.capturedData,
      timestamp: r.timestamp,
      createdAt: r.createdAt,
    }));

    return res.json(reportsList);
  } catch (error) {
    console.error('Get reports error:', error);
    return res.status(500).json({ message: 'Unexpected server error' });
  }
});

// Get a specific captured report by ID
app.get('/api/reports/:id', async (req, res) => {
  if (!db) {
    return res.status(503).json({ message: 'Database not ready yet' });
  }

  try {
    const report = await db.collection('Reports').findOne({ _id: new ObjectId(req.params.id) });
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
      { _id: new ObjectId(id) },
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

  try {
    const id = req.params.id;
    const result = await db.collection('Reports').deleteOne({ _id: new ObjectId(id) });

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

