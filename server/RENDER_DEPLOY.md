# Quick Deploy to Render

## Automatic Deployment (Recommended)

This repository includes `render.yaml` for one-click deployment:

1. Fork or import this repository to your GitHub
2. Go to https://render.com/deploy
3. Click **"New +"** → **"Blueprint"**
4. Connect repository: `twilloai`
5. Render will detect `render.yaml` and configure automatically
6. Add environment variables when prompted:
   - `OPENAI_API_KEY`
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `SUPABASE_SERVICE_ROLE_KEY`
7. Click **"Apply"**

## Manual Deployment

If automatic deployment doesn't work:

### 1. Create Web Service
```
Service Type: Web Service
Repository: twilloai
Branch: main
Root Directory: server
Runtime: Node
Build Command: npm install
Start Command: npm start
```

### 2. Environment Variables
```bash
OPENAI_API_KEY=sk-proj-xxxxx
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
PORT=8080
NODE_ENV=production
```

### 3. Deploy
Click "Create Web Service" and wait for deployment.

## After Deployment

1. Copy your WebSocket URL: `wss://your-service.onrender.com`
2. Add to Vercel environment variables as `REALTIME_WEBSOCKET_URL`
3. Redeploy Vercel app

## Verify Deployment

Check logs for:
```
🚀 Realtime WS running on port 8080
```

Test WebSocket connection:
```bash
# Using wscat (npm install -g wscat)
wscat -c wss://your-service.onrender.com
```

## WebSocket URL Format

Your WebSocket URL will be:
```
wss://masseurmatch-realtime.onrender.com
```

Use this exact URL in Vercel's `REALTIME_WEBSOCKET_URL` environment variable.

## Free Tier Limitations

- Service spins down after 15 minutes of inactivity
- First request after spin-down takes 30-60 seconds to wake up
- 750 hours/month free compute time

## Upgrade to Starter ($7/month)

Benefits:
- Always-on service (no cold starts)
- Better for production use
- Faster response times

To upgrade:
1. Go to service dashboard
2. Click **"Upgrade"**
3. Select **"Starter"** plan
4. Confirm payment

## Monitoring

View real-time logs:
1. Go to service dashboard
2. Click **"Logs"** tab
3. Watch for connection events and errors

## Troubleshooting

**Service won't start:**
- Check environment variables are set
- Verify `package.json` has correct start script
- Check logs for error messages

**WebSocket connection refused:**
- Ensure PORT is set to 8080
- Verify service is running (not building)
- Check firewall/network settings

**OpenAI authentication failed:**
- Verify OPENAI_API_KEY is correct
- Ensure API key has Realtime API access
- Check for extra spaces in environment variable

## Alternative: Docker Deployment

If you prefer Docker:

```bash
cd server
docker build -t masseurmatch-realtime .
docker run -p 8080:8080 \
  -e OPENAI_API_KEY=sk-proj-xxxxx \
  -e NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co \
  -e SUPABASE_SERVICE_ROLE_KEY=eyJhbGc... \
  masseurmatch-realtime
```

Deploy Docker image to:
- Render (using Dockerfile)
- Railway
- Fly.io
- Google Cloud Run
- AWS ECS
