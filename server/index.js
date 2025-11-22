const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const { MongoClient } = require('mongodb');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 4000;

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/';
const DB_NAME = process.env.MONGO_DB || 'ReportBuilderProLogin';
const COLLECTION_NAME = process.env.MONGO_COLLECTION || 'Login';

app.use(cors());
app.use(express.json());

let mongoClient;
let loginCollection;

async function connectToMongo() {
  try {
    mongoClient = new MongoClient(MONGO_URI);
    await mongoClient.connect();
    loginCollection = mongoClient.db(DB_NAME).collection(COLLECTION_NAME);
    console.log(`Connected to MongoDB database "${DB_NAME}" (collection "${COLLECTION_NAME}")`);
  } catch (error) {
    console.error('Failed to connect to MongoDB:', error);
    process.exit(1);
  }
}

connectToMongo();

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', hasDb: Boolean(loginCollection) });
});

app.post('/api/login', async (req, res) => {
  if (!loginCollection) {
    return res.status(503).json({ message: 'Database not ready yet' });
  }

  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: 'Email and password are required' });
  }

  try {
    const user = await loginCollection.findOne({ email });
    if (!user || user.password !== password) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    return res.json({
      email: user.email,
      name: user.name,
    });
  } catch (error) {
    console.error('Login error:', error);
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

