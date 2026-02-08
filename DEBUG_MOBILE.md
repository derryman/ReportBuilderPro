# Debugging Mobile Save Issues

## How to Check Logs

### 1. Backend Server Logs (Easiest)

**On your computer**, check the terminal where you ran `npm run dev:mobile` or `npm run dev`.

You should see logs like:
```
Received report save request: { templateId: 'test-template', ... }
Inserting report into database...
Report saved successfully with ID: ...
```

**If you see errors**, they'll show what went wrong:
- `Database not connected` → MongoDB issue
- `Missing templateId` → Frontend issue
- `Missing or empty capturedData` → Form validation issue
- Network errors → API URL or connectivity issue

### 2. Mobile Browser Console (Harder but More Detailed)

**Option A: Chrome Remote Debugging (Android)**
1. On your Android phone: Settings → Developer Options → Enable USB Debugging
2. Connect phone to computer via USB
3. On computer: Open Chrome → `chrome://inspect`
4. Click "Inspect" next to your phone's browser tab
5. You'll see the console with all errors/logs

**Option B: Safari Web Inspector (iPhone)**
1. On iPhone: Settings → Safari → Advanced → Web Inspector (enable)
2. Connect iPhone to Mac via USB
3. On Mac: Open Safari → Develop → [Your iPhone] → [Your Tab]
4. Console will show errors/logs

**Option C: Use Alert for Errors**
The app now shows detailed error messages in alerts - check those!

### 3. Test API Connectivity

**On your phone's browser**, try accessing:
```
http://YOUR_IP:4000/api/health
```

Should return: `{"status":"ok","hasDb":true}`

If this doesn't work:
- Backend server isn't running
- Wrong IP address
- Firewall blocking connection

### 4. Check API URL

On Mobile Capture page, look at the top - it shows:
```
API: http://YOUR_IP:4000
```

Make sure this matches your computer's IP address!

## Common Issues

### Issue: "Failed to save report: Network error"
**Cause:** Can't reach backend server
**Fix:**
- Check backend is running (port 4000)
- Verify API URL is correct (not localhost)
- Ensure phone and computer on same WiFi
- Check Windows Firewall allows port 4000

### Issue: "Database not ready yet"
**Cause:** MongoDB not connected
**Fix:**
- Check MongoDB is running
- Verify `server/.env` has correct `MONGO_URI`
- Check backend logs for MongoDB connection errors

### Issue: "Missing or empty capturedData"
**Cause:** Form fields not filled
**Fix:**
- Make sure at least one field (title, image, or notes) is filled
- Check form validation is working

### Issue: No error but nothing saves
**Cause:** Silent failure
**Fix:**
- Check backend console logs
- Verify MongoDB connection
- Check if Reports collection exists in MongoDB

## Quick Debug Steps

1. **Check backend logs** - Look for "Received report save request"
2. **Test API health** - Visit `http://YOUR_IP:4000/api/health` on phone
3. **Check API URL** - Verify it's shown correctly on Mobile Capture page
4. **Fill all fields** - Make sure title, image, and notes are filled
5. **Check MongoDB** - Verify Reports collection exists and is accessible
