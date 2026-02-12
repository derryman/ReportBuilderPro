# Azure Login Setup - Quick Guide

Your database is already hosted on Azure Cosmos DB. Here's how to add users and test login.

---

## Step 1: Verify Database Connection

1. Go to **Azure Portal** → Your **App Service** (backend)
2. Left menu → **"Configuration"** → **"Application settings"**
3. Verify these are set:
   - ✅ `MONGO_URI` = Your Cosmos DB connection string
   - ✅ `MONGO_DB` = `ReportBuilderPro`
4. If missing, add them and click **"Save"**

---

## Step 2: Create Login Collection & Add User

### Using Azure Portal (Easiest)

1. Go to **Azure Portal** → Your **Cosmos DB** resource
2. Left menu → **"Data Explorer"**
3. Expand your database (`ReportBuilderPro`)
4. If you see **"Login"** collection → skip to step 5
   - If not, right-click your database → **"New Collection"**
   - Name: `Login`
   - Click **"Create"**
5. Right-click **"Login"** → **"New Document"**
6. Delete the default content and paste this:

```json
{
  "email": "admin@test.com",
  "password": "admin123",
  "name": "Admin User",
  "createdAt": "2024-01-01T00:00:00Z"
}
```

7. Click **"Save"**
8. **Change the email and password** to something you'll remember!

---

## Step 3: Test Login

1. Open your frontend URL: `https://your-app.azurestaticapps.net`
2. Go to the login page
3. Enter:
   - **Email:** `admin@test.com` (or what you set)
   - **Password:** `admin123` (or what you set)
4. Click **"Sign in"**

If it works → **You're done!** 🎉

---

## Troubleshooting

### "Database not ready yet"
- Check App Service → **Log stream** (left menu) to see errors
- Verify `MONGO_URI` in App Service settings matches Cosmos DB connection string
- Make sure Cosmos DB is running (check Overview page)

### "Invalid email or password"
- Go to Cosmos DB → Data Explorer → Login collection
- Verify the user document exists
- Check email/password spelling (case-sensitive!)

### Can't see Login collection
- Create it manually: Right-click database → New Collection → Name: `Login`

### Backend not responding
- Check App Service → **Deployment Center** → Logs
- Make sure deployment succeeded
- Check **Log stream** for runtime errors

---

## Add More Users

Repeat Step 2 for each new user. Just change the email, password, and name in the JSON.

---

## Quick Checklist

- [ ] Cosmos DB created and running
- [ ] App Service has `MONGO_URI` and `MONGO_DB` set
- [ ] `Login` collection exists in Cosmos DB
- [ ] At least one user document added to `Login` collection
- [ ] Frontend URL is accessible
- [ ] Login works with test credentials

---

## Security Note ⚠️

Passwords are stored in **plain text** right now. This is fine for testing, but for production you should:
- Hash passwords with bcrypt
- Use HTTPS (Azure already does this)
- Add rate limiting

For now, this setup will work for testing your app!
