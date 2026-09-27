# VoxVital

ER waiting-room check-in kiosk with touchless camera vitals, voice intake in 7 languages, and a live nurse station. Safety rules set the minimum priority; a nurse confirms every level. Built at Hack the Hill III.

## Getting Started

### 1. Install Dependencies
```bash
npm install
```

### 2. Environment Setup
Create a `.env.local` file in the root directory:

```env
GEMINI_API_KEY=your_gemini_api_key
ELEVENLABS_API_KEY=your_elevenlabs_api_key
PRESAGE_API_KEY=your_presage_api_key
```

All keys are optional. Without them VoxVital uses a keyword-based symptom parser, the browser's built-in voice, and simulated vitals.

### 3. Run
```bash
npm run dev    # development
npm run demo   # production build, use this for live demos
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

- Kiosk: `/kiosk`
- Nurse station: `/nurse` (starts with five sample patients; the Demo menu resets them)
- Waiting-room TV: `/board` announces each called ticket out loud automatically. Browsers block sound until a page is clicked, so click anywhere on the board once, or open it on the TV with sound allowed from the start:
  ```bash
  open -a "Google Chrome" --args --kiosk --autoplay-policy=no-user-gesture-required http://localhost:3000/board
  ```
  (Quit Chrome first; the flags only apply when Chrome starts.)
- Patient phone view: scan the QR code on the kiosk's final screen

The QR code uses the address the kiosk was opened on. From `localhost` it falls back to this laptop's Wi-Fi address, so phones on the same network can open it. Set `PUBLIC_BASE` in `.env.local` to override it.

### 4. Share it online (optional)

Patients live in memory and every screen holds a live connection, so VoxVital needs one long-running Node server. Serverless hosts like Vercel won't work. The simplest way to put it online is to run it on your laptop and open a Cloudflare Tunnel:

```bash
brew install cloudflared
npm run demo
cloudflared tunnel --url http://localhost:3000
```

Open the `https://….trycloudflare.com` link it prints and start the kiosk from there, so the QR codes use the public link and work on any phone. To host it permanently, use a service that runs a normal Node server, such as Render, Railway or Fly.io.

Gemini, ElevenLabs and patient updates are rate limited per visitor so a public link can't drain your API credits.

## Tech Stack

- **Framework**: Next.js 16 (App Router), React 19, TailwindCSS, Lucide Icons
- **Optical Vitals**: Presage facial micro-blush camera telemetry (rPPG signal processing)
- **AI & Clinical Extraction**: Google Gemini 3.8 Flash (`@google/generative-ai`)
- **Speech & Audio**: Browser Web Speech API (STT) + ElevenLabs Text-to-Speech (TTS)
- **Real-Time Sync**: In-memory Server-Sent Events (SSE) streaming API
