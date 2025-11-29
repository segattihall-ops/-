# Quick Start Guide

Get your MasseurMatch AI waitlist system running in under 15 minutes.

## Prerequisites Checklist

- [ ] OpenAI API key with Realtime API access
- [ ] Twilio account with phone number
- [ ] Supabase project created
- [ ] GitHub account
- [ ] Vercel account (free)
- [ ] Render account (free)

## Step 1: Clone Repository (1 min)

```bash
git clone https://github.com/segattihall-ops/twilloai.git
cd twilloai
```

## Step 2: Configure Supabase (2 min)

1. Go to https://supabase.com/dashboard
2. Create new project or select existing
3. Go to **SQL Editor** and run:

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

4. Go to **Settings** → **API**
5. Copy:
   - Project URL (e.g., `https://xxxxx.supabase.co`)
   - Service role key (starts with `eyJhbGc...`)

## Step 3: Deploy to Vercel (3 min)

1. Go to https://vercel.com/new
2. Import repository: `twilloai`
3. Click **Deploy** (don't add env vars yet)
4. After deployment, go to **Settings** → **Environment Variables**
5. Add these variables:

```bash
TWILIO_ACCOUNT_SID=ACxxxxx
TWILIO_AUTH_TOKEN=xxxxx
TWILIO_PHONE_NUMBER=+1xxxxxxxxxx
OPENAI_API_KEY=sk-proj-xxxxx
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJhbGc...
```

6. Click **Redeploy** to apply environment variables
7. Copy your deployment URL (e.g., `https://your-app.vercel.app`)

## Step 4: Configure Twilio (2 min)

1. Go to https://console.twilio.com
2. Navigate to **Phone Numbers** → **Manage** → **Active numbers**
3. Click your phone number
4. Under **Voice Configuration**:
   - **A CALL COMES IN**: Webhook
   - **URL**: `https://your-app.vercel.app/api/voice`
   - **HTTP**: POST
5. Click **Save**

## Step 5: Test Basic Setup (1 min)

Call your Twilio number. You should hear:

> "Thank you for calling MasseurMatch. We're coming soon!
> Press 1 to join our early access waitlist..."

If you hear this, **basic setup is working!**

Press 1 → You'll be redirected to Chat Completions fallback (works but higher latency).

## Step 6: Deploy WebSocket Server to Render (5 min)

### Option A: Automatic (Blueprint)

1. Go to https://render.com/deploy
2. Click **New** → **Blueprint**
3. Connect repository: `twilloai`
4. Render detects `server/render.yaml`
5. Add environment variables:
   - `OPENAI_API_KEY`
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `SUPABASE_SERVICE_ROLE_KEY`
6. Click **Apply**

### Option B: Manual

1. Go to https://render.com
2. Click **New** → **Web Service**
3. Connect repository: `twilloai`
4. Configure:
   - **Name**: `masseurmatch-realtime`
   - **Root Directory**: `server`
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
5. Add environment variables (same as above)
6. Click **Create Web Service**

### After Deployment

1. Wait for "Deploy succeeded" message (2-3 minutes)
2. Copy your WebSocket URL:
   ```
   wss://masseurmatch-realtime.onrender.com
   ```

## Step 7: Connect WebSocket to Vercel (1 min)

1. Go back to Vercel dashboard
2. **Settings** → **Environment Variables**
3. Add new variable:
   - **Key**: `REALTIME_WEBSOCKET_URL`
   - **Value**: `wss://masseurmatch-realtime.onrender.com`
4. Click **Redeploy**

## Step 8: Test Complete System (2 min)

Call your Twilio number again:

1. Hear IVR greeting
2. Press **1** for waitlist
3. AI should respond naturally: *"Welcome! MasseurMatch is launching soon..."*
4. Provide test information:
   - Name: "Test User"
   - Phone: "555-123-4567"
   - Email: "test@example.com"
   - Role: "client"
5. AI should confirm signup

### Verify in Supabase

1. Go to Supabase dashboard
2. **Table Editor** → **waitlist**
3. You should see your test entry

## Troubleshooting

### "I don't hear anything after pressing 1"

**Check:**
1. Render service is running (not building)
2. `REALTIME_WEBSOCKET_URL` is set in Vercel
3. WebSocket URL starts with `wss://` (not `https://`)
4. Vercel redeployed after adding env variable

**View logs:**
- Render: Dashboard → Logs tab
- Vercel: Dashboard → Deployments → View logs

### "OpenAI authentication error"

**Check:**
1. `OPENAI_API_KEY` is correct in Render
2. API key has Realtime API access
3. No extra spaces in environment variable

**Test API key:**
```bash
curl https://api.openai.com/v1/models \
  -H "Authorization: Bearer $OPENAI_API_KEY"
```

### "Database write failed"

**Check:**
1. Using `SUPABASE_SERVICE_ROLE_KEY` (not anon key)
2. `waitlist` table exists in Supabase
3. Table schema matches (see Step 2)

**Test connection:**
```bash
# In server directory
node -e "
import { createClient } from '@supabase/supabase-js';
const supabase = createClient('URL', 'SERVICE_KEY');
const { data, error } = await supabase.from('waitlist').select('count');
console.log(data, error);
"
```

### "Service unavailable / slow first call"

**Cause:** Render free tier spins down after 15 minutes

**Solutions:**
1. Accept 30-60s cold start on first call
2. Upgrade to Starter plan ($7/month) for always-on
3. Use uptime monitor (e.g., UptimeRobot) to keep alive

## Next Steps

### Production Checklist

- [ ] Update prompt personality for your brand
- [ ] Test error scenarios (unclear input, interruptions)
- [ ] Set up monitoring (Render logs, Supabase dashboard)
- [ ] Add SMS confirmation after signup
- [ ] Create admin dashboard to view waitlist
- [ ] Upgrade Render to Starter plan (no cold starts)
- [ ] Set up analytics tracking

### Optional Enhancements

- [ ] Email confirmation after signup
- [ ] Export waitlist to CSV
- [ ] A/B test different AI voices
- [ ] Multi-language support
- [ ] Call recording (with consent)
- [ ] Sentiment analysis

## Documentation

- **[README.md](README.md)** - Project overview
- **[DEPLOYMENT_GUIDE.md](DEPLOYMENT_GUIDE.md)** - Detailed deployment
- **[ARCHITECTURE.md](ARCHITECTURE.md)** - System architecture
- **[server/RENDER_DEPLOY.md](server/RENDER_DEPLOY.md)** - Render specifics
- **[REALTIME_API.md](REALTIME_API.md)** - OpenAI Realtime API notes

## Cost Estimate

### Free Tier (Development)
- Vercel: Free
- Render: 750 hours/month free (with cold starts)
- Supabase: Free up to 500MB
- **Cost per call**: ~$0.93 (OpenAI + Twilio only)

### Starter Tier (Production)
- Vercel: Free or $20/month (Pro)
- Render: $7/month (always on, no cold starts)
- Supabase: Free (adequate for waitlist)
- **Monthly**: ~$7-27 + $0.93/call

### Example: 100 calls/month
- Fixed: $7 (Render)
- Variable: $93 (OpenAI) + $7.80 (Twilio)
- **Total**: ~$107.80/month

## Support

Having issues? Check:

1. **Render Logs**: Look for connection errors
2. **Vercel Logs**: Check webhook responses
3. **Twilio Debugger**: View call flow
4. **Supabase Logs**: Database errors

Still stuck? Review the detailed guides or check official documentation:
- OpenAI: https://platform.openai.com/docs
- Twilio: https://www.twilio.com/docs
- Render: https://render.com/docs
- Supabase: https://supabase.com/docs

## Success!

If you've made it here, you now have a production-ready AI waitlist system using OpenAI's Realtime API!

Call your number and experience natural, low-latency voice AI collecting signups for your early access waitlist.
