# MINIJOY PHONE AI — Android prototype

This is a native Android prototype for the Redmi Note 15 Pro (Android).

## Current scope
- Native launcher app.
- User opens Android Accessibility settings and manually enables the service.
- User types an exact visible button label and explicitly prepares one one-time click.
- The service only searches for an exact text match and clicks its clickable parent once.
- The command is cleared only after a successful click; it can be cancelled from the app.
- No screen recording, screenshots upload, message reading, password access, payment actions, network access, or background remote control.

## Build
The GitHub Actions workflow builds a debug APK. Install it only if you trust the source and review Android's accessibility permission prompt carefully.

## Important
This is not a full AI model and it does not give ChatGPT remote access to the phone. The service is a limited user-authorized helper. A real AI backend, secure account authentication, device pairing, privacy controls, and extensive testing are still required before wider use.
