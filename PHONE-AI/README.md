# MINIJOY PHONE AI

Installable mobile-first PWA companion for the user's Redmi Note 15 Pro.

## Version 0.1
- Project dashboard for MINIJOY AI, FLIXO AI, and 1000 кармильцы.
- Voice-to-text command capture where browser support exists.
- Copy command and open ChatGPT.
- Local task checklist stored on the device.
- Screenshot selection and local preview.
- Offline app shell via service worker.

## Important limitations
This is a companion dashboard, not an autonomous phone-control agent. It does not read other apps, tap UI controls, access private messages, or send prompts to ChatGPT automatically. Android Accessibility integration requires a separately installed native app and explicit user-granted permissions. AI chat backend is not connected in this version; no API secrets are stored in client code.

## Hosting
Serve this directory over HTTPS. Then open it on Android Chrome and choose "Add to Home screen" / "Install app".
