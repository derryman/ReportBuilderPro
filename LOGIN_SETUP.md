# Login Setup Guide

Your login system reads from a MongoDB collection called `Login`. Here's how to set it up.

---

## Option 1: Add Users via Azure Portal (Cosmos DB Data Explorer)

**Easiest method if you're using Azure Cosmos DB**

1. Go to **Azure Portal** → Your **Cosmos DB** resource
2. In the left menu, click **"Data Explorer"**
3. Expand your database → Right-click **"Login"** collection → **"New Document"**
   - If `Login` collection doesn't exist, right-click your database → **"New Collection"** → Name: `Login` → Create
4. Paste this JSON (edit the values):

```json
{
  "email": "admin@example.com",
  "password": "yourpassword123",
  "name": "Admin User",
  "createdAt": "2024-01-01T00:00:00Z"
}
```

5. Click **"Save"**
6. Repeat for more users

**✅ Done!** You can now log in with that email and password.

---

## Option 2: Add Users via MongoDB Compass (Local or Atlas)

**If you're using MongoDB Atlas or local MongoDB**

1. Open **MongoDB Compass**
2. Connect to your database:
   - **Azure Cosmos DB:** Use the connection string from Azure Portal
   - **MongoDB Atlas:** Use your Atlas connection string
   - **Local:** `mongodb://localhost:27017/`
3. Select database: `ReportBuilderPro`
4. Click on **"Login"** collection (create it if it doesn't exist)
5. Click **"Insert Document"** → **"{}"** (JSON view)
6. Paste this JSON:

```json
{
  "email": "admin@example.com",
  "password": "yourpassword123",
  "name": "Admin User",
  "createdAt": "2024-01-01T00:00:00Z"
}
```

7. Click **"Insert"**
8. Repeat for more users

---

## Option 3: Use the Script (Command Line)

**If you have Node.js and can run scripts**

1. Make sure your `.env` file in `server/` has:
   ```
   MONGO_URI=your_connection_string_here
   MONGO_DB=ReportBuilderPro
   ```

2. Run the script:
   ```bash
   cd server
   node scripts/create-user.js admin@example.com yourpassword123 "Admin User"
   ```

**Note:** Replace `admin@example.com`, `yourpassword123`, and `"Admin User"` with your values.

---

## User Document Structure

Each user document needs these fields:

```json
{
  "email": "user@example.com",      // Required - used for login
  "password": "plaintextpassword",   // Required - password (not hashed in current version)
  "name": "User Name",               // Optional - display name
  "createdAt": "2024-01-01T00:00:00Z" // Optional - when user was created
}
```

**Important:** 
- `email` must be unique
- `password` is currently stored as plain text (not secure for production!)
- MongoDB will auto-add an `_id` field (you can ignore it)

---

## Testing Login

1. Make sure your backend is running (or deployed to Azure)
2. Open your frontend (or Azure Static Web App URL)
3. Go to the login page
4. Enter the email and password you created
5. Click "Sign in"

If login works, you'll be redirected to the home page. If not, check:
- Database connection is working
- User exists in `Login` collection
- Email/password match exactly (case-sensitive)

---

## Security Note ⚠️

**Current implementation stores passwords in plain text.** This is **NOT secure** for production!

For production, you should:
1. Hash passwords using `bcrypt` or similar
2. Never store plain text passwords
3. Use HTTPS for all connections
4. Add rate limiting to prevent brute force attacks

This is fine for testing/development, but upgrade before going live with real users.

---

## Troubleshooting

### "Database not ready yet"
- Check that `MONGO_URI` is set correctly in Azure App Service settings
- Verify Cosmos DB is running and accessible
- Check backend logs in Azure Portal → App Service → Log stream

### "Invalid email or password"
- Verify the user exists in the `Login` collection
- Check email spelling (case-sensitive)
- Check password spelling (case-sensitive)
- Make sure collection name is exactly `Login` (capital L)

### Can't connect to database
- **Azure Cosmos DB:** Check connection string in App Service settings
- **MongoDB Atlas:** Check network access (IP allowlist)
- **Local:** Make sure MongoDB is running

---

## Quick Start - Create Your First User

**Fastest way (Azure Portal):**

1. Azure Portal → Cosmos DB → Data Explorer
2. Create `Login` collection if needed
3. Insert document:
```json
{
  "email": "test@test.com",
  "password": "test123",
  "name": "Test User"
}
```
4. Save
5. Try logging in with `test@test.com` / `test123`

**Done!** 🎉
