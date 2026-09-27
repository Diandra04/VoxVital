# VoxVital

**A multilingual ER check-in kiosk that helps nurses see who needs care first.**

Built by **Diandra Inturire** for **Hack the Hill III**.

## The problem

In a busy emergency room, patients can wait a long time before anyone knows how sick they are. Language barriers make it harder: someone with chest pain who doesn't speak English may struggle to explain it at the desk.

## How it works

1. **Check in at the kiosk.** The patient picks their language, does a quick camera vitals scan, and describes their symptoms by voice or typing.
2. **A short conversation.** The kiosk asks up to three spoken follow-up questions in the patient's own language, based on what they said.
3. **The nurse sees it instantly.** The nurse station shows every patient ranked by urgency, with a clear English summary and the reasons behind each suggested level.
4. **The patient follows along on their phone.** A QR code opens a live page in their language, with their place in line, messages from the nurse, and a way to report feeling worse.
5. **The waiting room screen calls them.** When the nurse calls a ticket, the screen shows it and announces it out loud.

## Highlights

- **7 languages:** English, French, Spanish, Arabic, Punjabi, Mandarin and Russian, from the kiosk to the patient's phone
- **Safety first:** triage rules based on the Canadian Triage and Acuity Scale (CTAS) set the minimum priority. The AI can raise it but never lower it, and a nurse confirms every level.
- **Nothing gets missed:** patients who feel worse can update their symptoms from their phone, and the nurse can ask anyone for a re-check
- **Private by design:** patient data stays in memory and is never saved to disk. The waiting room screen shows ticket numbers only.

## Tech stack

- **Next.js 16** and **React 19**, with **Tailwind CSS**
- **Google Gemini** for summaries, translation and follow-up questions
- **ElevenLabs** for the spoken voice
- **Web Speech API** for voice input
- **Server-Sent Events** for live updates across every screen

Camera vitals are simulated in this demo.

## Getting started

```bash
npm install
cp .env.example .env.local   # add your API keys
npm run demo
```

Then open [http://localhost:3000](http://localhost:3000) for the kiosk, nurse station and waiting room screen.

| Key | Used for |
|---|---|
| `GEMINI_API_KEY` | Summaries and follow-up questions |
| `ELEVENLABS_API_KEY` | Natural spoken voice |

Both are optional. Without them, VoxVital uses a simpler keyword parser and the browser's built-in voice.

## License

MIT © Diandra Inturire
