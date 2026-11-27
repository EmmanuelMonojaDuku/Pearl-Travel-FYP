# Pearl Travel mobile (React Native / Expo)

A native app for travellers and border officers. It uses the **same backend** as the web app (`../api`) and the **same rules evaluator and default rules** (`../shared`), so a checklist computed on the phone matches the web and the server.

| Feature | How it works on mobile |
|---|---|
| Sign in / register | Server accounts. Tokens stored in the device Keychain/Keystore (`expo-secure-store`). Roles always come from `/auth/me`. |
| Journey + checklist | Rules evaluated on-device from the cached published rules (bundled copy on first run). Changing nationality or purpose rebuilds the checklist; statuses already set are kept. |
| Offline | Profile, checklist, rules and the saved QR pass are cached (AsyncStorage). Changes go into an outbox and sync when `NetInfo` reports a connection. Sync is idempotent (assessment `clientKey`, journey last-write-wins). |
| Assistant | Calls `/assistant/ask` (RAG, cited answers). Needs a connection and a configured LLM on the server. |
| QR pass | Server-signed token rendered with `react-native-qrcode-svg`. No name or passport data. Cached for offline display; creating/revoking needs a connection. |
| Officer scanner | `expo-camera` QR scanning, server-side verification and approve/flag. Scoped to the officer's assigned border post by the server. |
| Admin | Content, rules, users and audit stay on the web dashboard (stated in the app). |

## Run

```bash
cd mobile
npm install
EXPO_PUBLIC_API_URL=http://<your-computer-LAN-IP>:4000 npx expo start
```
Scan the QR code with Expo Go, or press `a` for an Android emulator (the default `http://10.0.2.2:4000` reaches the API on the host computer).

Seed demo accounts first (`cd ../api && npm run seed:demo`): `traveller.demo@pearltravel.ug`, `officer.demo@pearltravel.ug` / `PearlDemo#2026`.

## Verify

```bash
npm run typecheck   # TypeScript
npm test            # checklist / rules logic
npx expo export --platform android   # full Metro bundle
```
Not covered here: running on a physical device or emulator (no device in the build environment). Camera scanning and the offline outbox on a real phone should be checked manually before the demo.
