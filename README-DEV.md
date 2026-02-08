# Development Setup

## Quick Start

### Option 1: Using npm scripts (Recommended) ⭐

1. **Install root dependencies** (first time only):
   ```bash
   npm install
   ```

2. **Install all project dependencies** (first time only):
   ```bash
   npm run install:all
   ```

3. **Start both servers with one command**:
   ```bash
   npm run dev
   ```
   
   This will start:
   - ✅ Backend server: http://localhost:4000
   - ✅ Frontend server: http://localhost:5173
   - ✅ Both servers auto-restart when you change files

### Option 2: Using PowerShell script (Windows)

```powershell
.\start-dev.ps1
```

### Option 3: Using Batch script (Windows)

```cmd
start-dev.bat
```

### Option 4: Manual start (if you prefer)

**Terminal 1 - Backend:**
```bash
cd server
npm run dev
```

**Terminal 2 - Frontend:**
```bash
cd web
npm run dev
```

## Keeping Servers Running

### For Development (Auto-restart on changes)
- Use `npm run dev` - both servers will auto-restart when you change files
- Backend uses `nodemon` for auto-restart
- Frontend uses Vite's hot module replacement

### For Persistent Testing (Keep running in background)

**Option A: Use PM2 (Process Manager) - Best for keeping servers running**

```bash
# Install PM2 globally (one time)
npm install -g pm2

# Start both servers with PM2 (keeps them running)
npm run pm2:start

# View running processes
npm run pm2:logs
# OR
pm2 list

# Stop servers
npm run pm2:stop

# Restart servers
npm run pm2:restart

# Delete PM2 processes
npm run pm2:delete

# Auto-start on system boot (optional)
pm2 startup
pm2 save
```

**Benefits of PM2:**
- ✅ Servers keep running even if you close the terminal
- ✅ Auto-restarts if a server crashes
- ✅ Easy to start/stop with simple commands
- ✅ Can view logs easily

**Option B: Use Windows Task Scheduler**
- Create scheduled tasks to run the batch script on login

**Option C: Use a free hosting service** (for testing)
- **Render.com** - Free tier available
- **Railway.app** - Free tier available  
- **Fly.io** - Free tier available

## Mobile Testing 📱

### Quick Setup for Mobile Access

**Option 1: Automatic Setup (Easiest)**
```powershell
.\start-dev-mobile.ps1
```
This script will:
- Find your local IP address
- Configure the frontend to use your network IP
- Start both servers
- Show you the URLs to access from your phone

**Option 2: Manual Setup**

1. **Find your local IP address:**
   ```powershell
   .\get-ip.ps1
   ```
   Or manually: `ipconfig` (Windows) / `ifconfig` (Mac/Linux)

2. **Create `web/.env` file** with your IP:
   ```env
   VITE_API_URL=http://YOUR_IP:4000
   ```
   Example: `VITE_API_URL=http://192.168.1.100:4000`

3. **Start the servers:**
   ```bash
   npm run dev
   ```

4. **Access from your phone:**
   - Make sure your phone is on the **same WiFi network**
   - Open browser and go to: `http://YOUR_IP:5173`
   - Example: `http://192.168.1.100:5173`

### Mobile Testing Checklist

- ✅ Phone and computer on same WiFi network
- ✅ Windows Firewall allows connections on ports 4000 and 5173
- ✅ Backend server listening on `0.0.0.0` (already configured)
- ✅ Frontend Vite server configured for network access (already configured)
- ✅ `web/.env` file has correct `VITE_API_URL` pointing to your IP

### Windows Firewall Setup

If you can't access from mobile, you may need to allow ports through Windows Firewall:

```powershell
# Allow Node.js through firewall (run as Administrator)
New-NetFirewallRule -DisplayName "Node.js Backend" -Direction Inbound -LocalPort 4000 -Protocol TCP -Action Allow
New-NetFirewallRule -DisplayName "Node.js Frontend" -Direction Inbound -LocalPort 5173 -Protocol TCP -Action Allow
```

Or use Windows Firewall GUI:
1. Open Windows Defender Firewall
2. Advanced Settings → Inbound Rules → New Rule
3. Port → TCP → Specific ports: `4000, 5173`
4. Allow the connection

## Environment Setup

Make sure you have a `.env` file in the `server/` directory:
```env
PORT=4000
MONGO_URI=your_mongodb_connection_string
MONGO_DB=ReportBuilderPro
```

**For mobile testing**, also create `web/.env`:
```env
VITE_API_URL=http://YOUR_LOCAL_IP:4000
```

## Troubleshooting

- **Port already in use**: Change the port in `server/index.js` or kill the process using the port
- **MongoDB connection issues**: Check your `.env` file and MongoDB connection string
- **Dependencies not found**: Run `npm run install:all` from the root directory
- **Can't access from mobile**: 
  - Check both devices are on same WiFi
  - Verify Windows Firewall allows ports 4000 and 5173
  - Make sure `web/.env` has correct IP address
  - Try accessing `http://YOUR_IP:4000/api/health` from phone browser to test backend
