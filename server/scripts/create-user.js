/**
 * Script to create a user in the Login collection
 * Usage: node scripts/create-user.js <email> <password> <name>
 * Example: node scripts/create-user.js admin@example.com password123 "Admin User"
 */

require('dotenv').config();
const { MongoClient } = require('mongodb');

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/';
const DB_NAME = process.env.MONGO_DB || 'ReportBuilderPro';

async function createUser() {
  // Get command line arguments
  const args = process.argv.slice(2);
  if (args.length < 2) {
    console.error('Usage: node create-user.js <email> <password> [name]');
    console.error('Example: node create-user.js admin@example.com mypassword123 "Admin User"');
    process.exit(1);
  }

  const email = args[0];
  const password = args[1];
  const name = args[2] || email.split('@')[0]; // Default name is part before @

  let client;
  try {
    console.log('Connecting to database...');
    client = new MongoClient(MONGO_URI);
    await client.connect();
    console.log('Connected successfully!');

    const db = client.db(DB_NAME);
    const collection = db.collection('Login');

    // Check if user already exists
    const existingUser = await collection.findOne({ email });
    if (existingUser) {
      console.error(`❌ User with email "${email}" already exists!`);
      process.exit(1);
    }

    // Create new user
    const user = {
      email,
      password, // In production, this should be hashed!
      name,
      createdAt: new Date(),
    };

    const result = await collection.insertOne(user);
    console.log('✅ User created successfully!');
    console.log(`   Email: ${email}`);
    console.log(`   Name: ${name}`);
    console.log(`   ID: ${result.insertedId}`);

  } catch (error) {
    console.error('❌ Error creating user:', error.message);
    process.exit(1);
  } finally {
    if (client) {
      await client.close();
      console.log('Database connection closed.');
    }
  }
}

createUser();
