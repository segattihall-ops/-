# MasseurMatch AI Waitlist System

AI-powered phone system for collecting early access waitlist signups using Twilio and OpenAI Realtime API.

## Features

- 🎙️ **OpenAI Realtime API** - Ultra-low latency voice conversations (50-150ms)
- 🤖 **AI Waitlist Assistant** - Natural conversation for collecting signups
- 📞 **Twilio Integration** - Professional IVR menu with Media Streams
- 💾 **Supabase Database** - Persistent waitlist storage
- 🔄 **WebSocket Proxy** - Bridges Twilio with OpenAI Realtime API
- 📋 **Function Calling** - Structured data extraction from conversations

## System Architecture

```
Phone Call → Twilio → Vercel Next.js → Render WebSocket → OpenAI Realtime API
                                              ↓
                                        Supabase Database
```

## Quick Start

**Get up and running in 15 minutes:**

👉 **[Follow the Quick Start Guide](QUICKSTART.md)**

## Documentation

- **[QUICKSTART.md](QUICKSTART.md)** - 15-minute setup guide
- **[DEPLOYMENT_GUIDE.md](DEPLOYMENT_GUIDE.md)** - Complete deployment instructions
- **[ARCHITECTURE.md](ARCHITECTURE.md)** - System architecture and data flow
- **[server/RENDER_DEPLOY.md](server/RENDER_DEPLOY.md)** - WebSocket server deployment
- **[REALTIME_API.md](REALTIME_API.md)** - OpenAI Realtime API details

## Tech Stack

- **Frontend**: Next.js 14 (App Router)
- **Voice AI**: OpenAI Realtime API (gpt-4o-realtime-preview)
- **Telephony**: Twilio Voice & Media Streams
- **WebSocket Server**: Node.js + ws (deployed on Render)
- **Database**: Supabase (PostgreSQL)
- **Deployment**: Vercel (Next.js) + Render (WebSocket)

## Prerequisites

- Node.js 18+
- Twilio account with phone number
- OpenAI API key with Realtime API access
- Supabase project
- Vercel account (free tier works)
- Render account (free tier works)

## Installation

### 1. Clone Repository

```bash
git clone https://github.com/segattihall-ops/twilloai.git
cd twilloai
```

### 2. Install Dependencies

```bash
# Main Next.js app
npm install

# WebSocket server
cd server
npm install
cd ..
```

### 3. Configure Environment Variables

```bash
cp .env.example .env.local
```

Edit `.env.local`:

```env
# Twilio
TWILIO_ACCOUNT_SID=ACxxxxx
TWILIO_AUTH_TOKEN=xxxxx
TWILIO_PHONE_NUMBER=+1xxxxxxxxxx

# OpenAI
OPENAI_API_KEY=sk-proj-xxxxx

# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJhbGc...

# WebSocket Server (after deploying to Render)
REALTIME_WEBSOCKET_URL=wss://your-service.onrender.com
```

### 4. Create Supabase Table

Run this SQL in Supabase SQL Editor:

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

### 5. Local Development

```bash
# Terminal 1: Next.js app
npm run dev

# Terminal 2: WebSocket server
cd server
npm run dev

# Terminal 3: Ngrok tunnel for Twilio
ngrok http 3000
```

Configure Twilio webhook:
- Voice webhook: `https://your-ngrok-url.ngrok.io/api/voice`
- Method: POST

## API Routes

### Voice Routes

| Route | Purpose |
|-------|---------|
| `POST /api/voice` | Main IVR menu entry point |
| `POST /api/voice/menu` | Handle menu digit selections |
| `POST /api/voice/realtime` | Connect to OpenAI Realtime API |
| `POST /api/voice/ai-assistant` | Fallback Chat Completions |
| `POST /api/voice/transfer` | Transfer to team member |
| `POST /api/voice/voicemail` | Record voicemail |

### Data Routes

| Route | Purpose |
|-------|---------|
| `POST /api/waitlist` | Direct waitlist submission |

### SMS Routes

| Route | Purpose |
|-------|---------|
| `POST /api/sms/command` | Handle SMS commands |
| `POST /api/sms/missed-call` | Missed call notifications |

## Phone Menu Flow

```
┌──────────────────────────────────────────────┐
│  Thank you for calling MasseurMatch.         │
│  We're coming soon!                          │
├──────────────────────────────────────────────┤
│  Press 1: Join early access waitlist (AI)   │
│  Press 2: Speak with our team               │
│  Press 3: Leave a message                   │
└──────────────────────────────────────────────┘
```

## AI Waitlist Assistant

### Collected Information

The AI assistant collects exactly 4 fields:

1. **Full Name** - Caller's complete name
2. **Phone** - Contact phone number
3. **Email** - Email address for updates
4. **Role** - Either "therapist" or "client"

### Personality: Knotty

- Warm, calm, friendly, professional
- High-quality concierge assistant
- NOT flirty, NOT humorous, NOT robotic
- Guides conversation step-by-step
- Only discusses waitlist signup (stays on topic)

### OpenAI Configuration

The WebSocket server references stored prompt:
```javascript
prompt: {
  id: "pmpt_692a9f2f6e148195850e91132c55366005098e88b3968255",
  version: "1"
}
```

Audio format: g711_ulaw (8kHz, 8-bit) for Twilio compatibility

## Deployment

### Deploy to Vercel (Next.js App)

```bash
vercel deploy --prod
```

Add environment variables in Vercel dashboard (Settings → Environment Variables).

### Deploy to Render (WebSocket Server)

See **[server/RENDER_DEPLOY.md](server/RENDER_DEPLOY.md)** for detailed instructions.

**Quick version:**

1. Create Web Service on Render
2. Connect GitHub repository
3. Set root directory: `server`
4. Build command: `npm install`
5. Start command: `npm start`
6. Add environment variables
7. Deploy and copy WebSocket URL

### Link WebSocket to Vercel

1. Add `REALTIME_WEBSOCKET_URL` to Vercel
2. Value: `wss://your-service.onrender.com`
3. Redeploy

### Configure Twilio

Update phone number webhook:
- Voice URL: `https://your-app.vercel.app/api/voice`
- Method: POST

## Testing

### Test Call Flow

1. Call your Twilio number
2. Hear IVR greeting
3. Press 1 for waitlist
4. Have natural conversation with AI
5. Provide all 4 required fields
6. Verify confirmation message

### Verify Data

Check Supabase:
1. Table Editor → waitlist
2. Confirm entry with all fields

### Monitor Logs

**Render (WebSocket Server):**
```
🚀 Realtime WS running on port 8080
📞 Twilio client connected
✅ Connected to OpenAI Realtime API
👤 User: [transcript]
🤖 Assistant: [transcript]
💾 Saving to waitlist
✅ Successfully saved to waitlist
```

**Vercel (Next.js):**
```
POST /api/voice 200
POST /api/voice/menu 200
POST /api/voice/realtime 200
```

## Cost Breakdown

### Per 3-Minute Call

| Component | Cost |
|-----------|------|
| Twilio Inbound | $0.026 |
| OpenAI Realtime Input | $0.18 |
| OpenAI Realtime Output | $0.72 |
| **Total per call** | **~$0.93** |

### Monthly Hosting

| Service | Plan | Cost |
|---------|------|------|
| Vercel | Hobby | Free |
| Render | Starter | $7/month |
| Supabase | Free | Free |

**100 calls/month total cost: ~$107.80**

## Project Structure

```
twilloai/
├── app/
│   ├── api/
│   │   ├── voice/
│   │   │   ├── route.ts              # IVR entry
│   │   │   ├── menu/route.ts         # Menu handler
│   │   │   ├── realtime/route.ts     # Realtime connector
│   │   │   ├── ai-assistant/route.ts # Chat fallback
│   │   │   ├── transfer/route.ts
│   │   │   └── voicemail/route.ts
│   │   ├── sms/
│   │   │   ├── command/route.ts
│   │   │   └── missed-call/route.ts
│   │   └── waitlist/route.ts
│   ├── layout.tsx
│   └── page.tsx
├── server/
│   ├── realtime.js                   # WebSocket proxy
│   ├── package.json
│   ├── .env.example
│   ├── Dockerfile
│   ├── railway.json
│   ├── render.yaml
│   └── RENDER_DEPLOY.md
├── .env.example
├── package.json
├── next.config.js
├── README.md
├── QUICKSTART.md
├── DEPLOYMENT_GUIDE.md
├── ARCHITECTURE.md
└── REALTIME_API.md
```

## Troubleshooting

### WebSocket Connection Failed

**Symptoms:** Call connects but no AI response

**Check:**
1. Verify `REALTIME_WEBSOCKET_URL` set in Vercel
2. Ensure Render service is running
3. Check WebSocket URL uses `wss://` protocol
4. Verify OpenAI API key in Render environment

### "Missing credentials" Error

**Fix:** Verify `OPENAI_API_KEY` in Render environment variables

### Database Save Fails

**Check:**
1. Using `SUPABASE_SERVICE_ROLE_KEY` (not anon key)
2. `waitlist` table exists with correct schema
3. All required fields present

### Slow First Call (30+ seconds)

**Cause:** Render free tier spins down after 15 minutes

**Solutions:**
1. Upgrade to Starter plan ($7/month)
2. Use uptime monitor to keep service awake
3. Accept cold start delay

## Development

```bash
# Run development server
npm run dev

# Build for production
npm run build

# Lint code
npm run lint

# Type check
npm run type-check
```

## WebSocket Server Development

```bash
cd server

# Run with auto-reload
npm run dev

# Run production mode
npm start
```

## Key Files

### WebSocket Server (`server/realtime.js`)

Handles:
- Twilio Media Stream connections
- OpenAI Realtime API WebSocket
- Bidirectional audio forwarding
- Function call execution
- Supabase data persistence

### Realtime Connector (`app/api/voice/realtime/route.ts`)

Initiates Twilio Media Stream to WebSocket server with automatic fallback.

### AI Assistant (`app/api/voice/ai-assistant/route.ts`)

Chat Completions fallback for when WebSocket server is unavailable.

## Environment Variables Reference

```bash
# Required for Vercel
TWILIO_ACCOUNT_SID          # Twilio account identifier
TWILIO_AUTH_TOKEN           # Twilio authentication token
TWILIO_PHONE_NUMBER         # Your Twilio phone number
OPENAI_API_KEY              # OpenAI API key
NEXT_PUBLIC_SUPABASE_URL    # Supabase project URL
SUPABASE_SERVICE_ROLE_KEY   # Supabase service role key
REALTIME_WEBSOCKET_URL      # WebSocket server URL (after Render deployment)

# Required for Render (WebSocket Server)
OPENAI_API_KEY              # OpenAI API key
NEXT_PUBLIC_SUPABASE_URL    # Supabase project URL
SUPABASE_SERVICE_ROLE_KEY   # Supabase service role key
PORT                        # WebSocket port (default: 8080)
NODE_ENV                    # Environment (production)
```

## Features Coming Soon

- SMS confirmation after signup
- Email welcome messages
- Admin dashboard for waitlist management
- Export to CSV
- Multi-language support
- Analytics dashboard
- A/B testing different prompts

## Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open Pull Request

## License

MIT License - see LICENSE file for details

## Support

- **Documentation**: See guides in this repository
- **Issues**: [GitHub Issues](https://github.com/segattihall-ops/twilloai/issues)
- **OpenAI Docs**: https://platform.openai.com/docs/guides/realtime
- **Twilio Docs**: https://www.twilio.com/docs/voice/media-streams
- **Render Docs**: https://render.com/docs

## Acknowledgments

- OpenAI for Realtime API
- Twilio for Voice & Media Streams
- Supabase for database infrastructure
- Vercel for Next.js hosting
- Render for WebSocket hosting
