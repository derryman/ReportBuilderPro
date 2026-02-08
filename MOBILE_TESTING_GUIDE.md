# Mobile Testing Guide

## Quick Setup for Testing Mobile Capture

### Step 1: Create a Sample Template

Run this command from the project root to create a simple template with one image and one text box:

```bash
cd server
npm run create-sample-template
```

Or manually:

```bash
node server/scripts/create-sample-template.js
```

This creates a template called "Simple Mobile Template" with:
- One image capture field (Site Photo)
- One text box (Notes)

### Step 2: Start Servers for Mobile Testing

```bash
npm run dev:mobile
```

This will:
- Find your local IP address
- Configure the frontend to use your network IP
- Start both backend and frontend servers

### Step 3: Access from Mobile

1. Make sure your phone is on the **same WiFi network** as your computer
2. Open browser on your phone
3. Go to: `http://YOUR_IP:5173` (the script will show you the exact URL)
4. Navigate to "Mobile Capture" page
5. Select "Simple Mobile Template"
6. Fill out the form:
   - Take a photo (or select from gallery)
   - Enter some notes
   - Optionally add a Job ID
   - Click "Save Report"

### Step 4: View Captured Reports

1. On your computer (or mobile), go to the "Reports" page
2. You should see the report you just captured
3. The report will show:
   - The image you captured
   - The text you entered
   - Job ID (if provided)
   - Timestamp

## Template Structure

Templates are stored in MongoDB with this structure:

```json
{
  "title": "Template Name",
  "description": "Template description",
  "components": [
    {
      "id": "comp-image-1",
      "type": "image",
      "data": {
        "title": "Site Photo"
      }
    },
    {
      "id": "comp-text-1",
      "type": "text",
      "data": {
        "title": "Notes"
      }
    }
  ]
}
```

## Creating Templates via Web UI

1. Go to Template Creator page (desktop only)
2. Add components:
   - Click "Image" to add image capture
   - Click "Text Box" to add text input
3. Set titles for each component
4. Click "Preview template" (save functionality coming soon)

## API Endpoints

- `GET /api/templates` - Get all templates
- `GET /api/templates/:id` - Get full template details
- `POST /api/reports` - Save a captured report
- `GET /api/reports` - Get all captured reports
- `GET /api/reports/:id` - Get a specific report

## Troubleshooting

- **Can't see templates on mobile**: Make sure you ran the create-sample-template script
- **Can't save report**: Check that backend server is running and MongoDB is connected
- **Image not showing**: Make sure image was captured/selected before submitting
- **Can't access from mobile**: Check firewall settings and ensure both devices are on same WiFi
