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
- Patient phone view: scan the QR code on the kiosk's final screen

The QR code points at this laptop's Wi-Fi address so phones on the same network can open it. Set `PUBLIC_BASE` in `.env.local` to override it.

## Tech Stack

- **Framework**: Next.js 16 (App Router), React 19, TailwindCSS, Lucide Icons
- **Optical Vitals**: Presage facial micro-blush camera telemetry (rPPG signal processing)
- **AI & Clinical Extraction**: Google Gemini 2.5 Flash (`@google/generative-ai`)
- **Speech & Audio**: Browser Web Speech API (STT) + ElevenLabs Text-to-Speech (TTS)
- **Real-Time Sync**: In-memory Server-Sent Events (SSE) streaming API
