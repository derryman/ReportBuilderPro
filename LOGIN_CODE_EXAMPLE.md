# Login Authentication Code

## Backend: MongoDB Login Check

**File:** `server/index.js`

```javascript
// Login endpoint - checks credentials against MongoDB
app.post('/api/login', async (req, res) => {
  const { email, password } = req.body;

  // Find user in MongoDB 'Login' collection
  const user = await db.collection('Login').findOne({ email });

  // Check if user exists and password matches
  if (!user || user.password !== password) {
    return res.status(401).json({ message: 'Invalid email or password' });
  }

  // Success - return user info
  return res.json({ email: user.email, name: user.name });
});
```

## Frontend: Login Form Submission

**File:** `web/src/pages/LoginPage.tsx`

```typescript
// Send login request to backend
const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
  event.preventDefault();

  const response = await fetch(`${API_BASE_URL}/api/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });

  if (response.ok) {
    // Login successful - navigate to home page
    navigate('/');
  } else {
    // Show error message
    const data = await response.json();
    setError(data.message || 'Invalid email or password');
  }
};
```

## MongoDB Collection Structure

**Collection:** `Login`

```json
{
  "email": "derrymahon@icloud.com",
  "password": "prototype",
  "name": "Derry Mahon"
}
```

## How It Works

1. User enters email and password in the login form
2. Frontend sends credentials to `/api/login` endpoint
3. Backend queries MongoDB `Login` collection for matching email
4. Backend compares provided password with stored password
5. If match: return success and navigate to home page
6. If no match: return error message

