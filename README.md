# VoxVital

ER waiting-room check-in kiosk with camera vitals, voice intake in 7 languages, and a live nurse station. Safety rules set the minimum priority; a nurse confirms every level. Built at Hack the Hill III.

## What it does

**Kiosk** (`/kiosk`)
- Works in English, French, Spanish, Arabic, Punjabi, Mandarin and Russian
- 30-second camera vitals scan (pulse and breathing rate, simulated in this demo)
- Patient describes symptoms by voice or typing
- Asks up to 3 spoken follow-up questions in the patient's language, then a few quick questions (allergies, medicines, onset)
- Gives a ticket number and a QR code to follow their place in line

**Nurse station** (`/nurse`)
- Live queue sorted by triage level, with the reasons behind each suggested level
- The nurse confirms or changes every level, adds vitals, and calls the patient
- Can send a short message to the patient's phone or ask them for a re-check

**Waiting room screen** (`/board`)
- Shows the ticket being called and recent calls, and announces each call out loud

**Patient's phone** (from the QR code)
- Place in line, in the patient's language, updated live
- Nurse messages, and a "feeling worse?" form that updates their triage

## How triage works

Rules based on the Canadian Triage and Acuity Scale (CTAS) look at symptoms, vitals, pain and age to set a minimum level. Gemini can raise the priority but never lower it, and a nurse confirms every level.

## Tech stack

- **Next.js 16** and **React 19**, styled with **Tailwind CSS**, **Lucide** icons and **Framer Motion**
- **Google Gemini** (`gemini-3.8-flash`) for translating, summarizing and choosing follow-up questions
- **ElevenLabs** for spoken questions and announcements
- **Web Speech API** for voice input in the browser
- **Server-Sent Events** for live updates between screens
- **qrcode** for the patient's status link

Patient data stays in memory and is never saved to disk.

## Run it

```bash
npm install
cp .env.example .env.local   # then add your keys
npm run dev                  # development
npm run demo                 # production build, best for live demos
```

Open [http://localhost:3000](http://localhost:3000).

| Key | Used for | Without it |
|---|---|---|
| `GEMINI_API_KEY` | Symptom summaries and follow-up questions | Keyword-based fallback |
| `ELEVENLABS_API_KEY` | Natural voice | The browser's built-in voice |

## Demo tips

- The nurse station starts with five sample patients. Its **Demo** menu resets them.
- The **Demo** button on the scan screen skips the scan or sets high readings.
- Click anywhere on the waiting room screen once so it can play sound.
- Phones on the same Wi-Fi can scan the QR code. Use Chrome for voice input.

## License

MIT
