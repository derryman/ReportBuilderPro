// Script to create a sample template in MongoDB
// Run with: node server/scripts/create-sample-template.js

const { MongoClient, ObjectId } = require('mongodb');
const dotenv = require('dotenv');
const path = require('path');

// Load environment variables
dotenv.config({ path: path.join(__dirname, '../.env') });

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/';
const DB_NAME = process.env.MONGO_DB || 'ReportBuilderPro';

async function createSampleTemplate() {
  let client;
  
  try {
    // Connect to MongoDB
    client = new MongoClient(MONGO_URI);
    await client.connect();
    const db = client.db(DB_NAME);
    
    console.log('Connected to MongoDB');
    
    // Check if template already exists
    const existing = await db.collection('Templates').findOne({ 
      title: 'Simple Mobile Template' 
    });
    
    if (existing) {
      console.log('Template already exists! Updating...');
      await db.collection('Templates').updateOne(
        { title: 'Simple Mobile Template' },
        {
          $set: {
            description: 'A simple template with one image and one text box for mobile capture',
            components: [
              {
                id: 'comp-image-1',
                type: 'image',
                data: {
                  title: 'Site Photo',
                },
              },
              {
                id: 'comp-text-1',
                type: 'text',
                data: {
                  title: 'Notes',
                },
              },
            ],
            updatedAt: new Date(),
          },
        }
      );
      console.log('Template updated successfully!');
    } else {
      // Create the sample template
      const template = {
        title: 'Simple Mobile Template',
        description: 'A simple template with one image and one text box for mobile capture',
        components: [
          {
            id: 'comp-image-1',
            type: 'image',
            data: {
              title: 'Site Photo',
            },
          },
          {
            id: 'comp-text-1',
            type: 'text',
            data: {
              title: 'Notes',
            },
          },
        ],
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      
      const result = await db.collection('Templates').insertOne(template);
      console.log('Template created successfully!');
      console.log('Template ID:', result.insertedId.toString());
    }
    
    // List all templates
    const templates = await db.collection('Templates').find({}).toArray();
    console.log('\nAll templates:');
    templates.forEach((t) => {
      console.log(`- ${t.title} (${t._id})`);
    });
    
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  } finally {
    if (client) {
      await client.close();
      console.log('\nMongoDB connection closed');
    }
  }
}

createSampleTemplate();
