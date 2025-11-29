# Deployment Guide: MasseurMatch AI Waitlist System

## Overview

This guide covers deploying the complete MasseurMatch AI waitlist system with OpenAI Realtime API integration.

## Architecture

```
Phone Call → Twilio → Vercel Next.js App → Render WebSocket Server → OpenAI Realtime API
                                                    ↓
                                              Supabase Database
```

## Part 1: Deploy WebSocket Server to Render

### Prerequisites
- GitHub repository with the `server/` directory
- OpenAI API key with Realtime API access
- Supabase project URL and service role key

### Step 1: Create Render Account
1. Go to https://render.com
2. Sign up with GitHub account
3. Authorize Render to access your repositories

### Step 2: Create New Web Service
1. Click **"New +"** → **"Web Service"**
2. Connect your GitHub repository: `twilloai`
3. Configure the service:
   - **Name**: `masseurmatch-realtime`
   - **Region**: Oregon (or closest to your users)
   - **Branch**: `main`
   - **Root Directory**: `server`
   - **Runtime**: Node
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`

### Step 3: Configure Environment Variables
Add these environment variables in Render dashboard:

| Key | Value | Notes |
|-----|-------|-------|
| `OPENAI_API_KEY` | `sk-proj-...` | Your OpenAI API key |
| `NEXT_PUBLIC_SUPABASE_URL` | `https://xxxxx.supabase.co` | From Supabase dashboard |
| `SUPABASE_SERVICE_ROLE_KEY` | `eyJhbGc...` | From Supabase → Settings → API |
| `PORT` | `8080` | Default WebSocket port |
| `NODE_ENV` | `production` | Production mode |

### Step 4: Deploy
1. Click **"Create Web Service"**
2. Wait for deployment to complete (2-3 minutes)
3. Note your WebSocket URL: `wss://masseurmatch-realtime.onrender.com`

### Step 5: Verify Deployment
Check the Render logs for:
```
🚀 Realtime WS running on port 8080
```

## Part 2: Configure Vercel Integration

### Step 1: Add Environment Variable
1. Go to Vercel dashboard
2. Select your project
3. Go to **Settings** → **Environment Variables**
4. Add new variable:
   - **Key**: `REALTIME_WEBSOCKET_URL`
   - **Value**: `wss://masseurmatch-realtime.onrender.com`
   - **Environment**: Production, Preview, Development

### Step 2: Redeploy Vercel App
1. Go to **Deployments**
2. Click **"..."** on latest deployment → **"Redeploy"**
3. Or push any commit to trigger automatic deployment

## Part 3: Update Twilio Webhook (Optional)

To use the Realtime API instead of Chat Completions:

### Option A: Via Twilio Console
1. Go to https://console.twilio.com/
2. Navigate to **Phone Numbers** → **Manage** → **Active numbers**
3. Click your MasseurMatch phone number
4. Under **Voice Configuration**:
   - **A CALL COMES IN**: Webhook
   - **URL**: `https://your-vercel-app.vercel.app/api/voice/realtime`
   - **HTTP**: POST
5. Click **Save**

### Option B: Keep Current Setup
Leave webhook pointed to `/api/voice` route. The menu system will automatically use Realtime API when `REALTIME_WEBSOCKET_URL` is configured.

## Part 4: Test End-to-End

### Test Checklist
- [ ] Call your Twilio number
- [ ] Hear IVR greeting about early access waitlist
- [ ] Press 1 to speak with AI assistant
- [ ] Verify natural conversation flow
- [ ] Provide all 4 fields: name, phone, email, role
- [ ] Confirm AI successfully saves data
- [ ] Check Supabase for new waitlist entry

### Monitoring

**Render Logs (WebSocket Server):**
```bash
# Check for these log messages:
📞 Twilio client connected
🎬 Stream started: {streamSid}
✅ Connected to OpenAI Realtime API
👤 User: [transcription]
🤖 Assistant: [transcription]
💾 Saving to waitlist: {data}
✅ Successfully saved to waitlist
```

**Vercel Logs (Next.js App):**
```bash
# Check for successful webhook calls:
POST /api/voice/realtime 200
```

**Supabase Dashboard:**
1. Go to **Table Editor** → **waitlist**
2. Verify new entries appear with all fields

## Troubleshooting

### Issue: WebSocket Connection Failed
**Symptoms**: Call connects but no audio response
**Check**:
1. Verify `REALTIME_WEBSOCKET_URL` is set in Vercel
2. Check Render service is running (not sleeping)
3. Ensure WebSocket URL uses `wss://` protocol
4. Verify OpenAI API key has Realtime API access

### Issue: "Missing credentials" Error
**Symptoms**: Render logs show OpenAI authentication error
**Fix**: Double-check `OPENAI_API_KEY` in Render environment variables

### Issue: Database Save Fails
**Symptoms**: Conversation works but no Supabase entry
**Check**:
1. Verify `SUPABASE_SERVICE_ROLE_KEY` (not anon key)
2. Check `waitlist` table exists in Supabase
3. Verify table schema matches:
   ```sql
   CREATE TABLE waitlist (
     id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
     full_name TEXT NOT NULL,
     phone TEXT NOT NULL,
     email TEXT NOT NULL,
     role TEXT NOT NULL CHECK (role IN ('therapist', 'client')),
     created_at TIMESTAMP DEFAULT NOW()
   );
   ```

### Issue: Render Service Sleeping
**Symptoms**: First call takes 30+ seconds to connect
**Explanation**: Free tier spins down after 15 minutes of inactivity
**Solutions**:
1. Upgrade to paid plan ($7/month keeps service always on)
2. Use external uptime monitor (e.g., UptimeRobot) to ping every 10 minutes
3. Accept cold start delay for low-volume usage

## Cost Estimates

### OpenAI Realtime API
- **Input Audio**: $0.06 per minute
- **Output Audio**: $0.24 per minute
- **Average 3-minute call**: ~$0.40

### Render Hosting
- **Free Tier**: 750 hours/month, spins down after inactivity
- **Starter Tier**: $7/month, always on, better for production

### Vercel
- **Hobby**: Free for personal projects
- **Pro**: $20/month if scaling beyond hobby limits

### Supabase
- **Free Tier**: 500MB database, 50,000 monthly active users
- More than sufficient for waitlist collection

## Next Steps

After successful deployment:
1. Monitor first few test calls in Render logs
2. Verify data quality in Supabase
3. Test error scenarios (unclear input, interruptions)
4. Consider adding SMS confirmation after signup
5. Set up analytics/monitoring for call volume

## Support

- **OpenAI Realtime API Docs**: https://platform.openai.com/docs/guides/realtime
- **Twilio Media Streams**: https://www.twilio.com/docs/voice/media-streams
- **Render Support**: https://render.com/docs
- **Supabase Docs**: https://supabase.com/docs

## Rollback Plan

If Realtime API has issues, fallback to Chat Completions:
1. Remove `REALTIME_WEBSOCKET_URL` from Vercel
2. Redeploy Vercel app
3. System automatically falls back to `/api/voice/ai-assistant` route
4. Higher latency but proven stable implementation
