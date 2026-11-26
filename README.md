<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://ai.google.dev/static/site-assets/images/share-ais-513315318.png" />
</div>

# Run and deploy your app

This contains everything you need to run your app locally.

View your app in AI Studio: https://ai.studio/apps/489febe5-25b2-42f7-b89a-12ea38c71b9c

## Run Locally

**Prerequisites:**  Node.js


1. Install dependencies:
   `npm install`
2. Set the `GEMINI_API_KEY` in [.env.local](.env.local) to your Gemini API key
3. Run the app:
   `npm run dev`

## Admin Dashboard

The administrator dashboard requires the API and PostgreSQL backend; it cannot be enabled by signing in to a browser-local account. Configure `api/.env` from [api/.env.example](./api/.env.example), set `ADMIN_EMAILS=emmanuelmonojaduku@gmail.com`, configure a working verification email provider, and apply the database migrations from the `api` directory. Set `VITE_API_BASE_URL` in the frontend environment if the API is not at `http://localhost:4000/api/v1`.

Create or verify the administrator account through the app, then sign in. The API assigns the administrator role after successful authentication of the verified bootstrap email and protects dashboard data with role-based authorization.


## App structure (wireframe implementation)

One design system drives every screen: near-black surfaces with a single Pearl yellow (`--pearl-*` tokens in `src/index.css`, shared building blocks in `src/components/ui.tsx`).

| Role | Screens |
|---|---|
| Everyone | Splash (Get Started / Login), Login, Register (name, email, phone, password), Google/Apple buttons |
| Traveller | Home, Profile, Journey, Requirements, Smart Checklist (Have It / Don't Have It / N/A), Readiness (+ "How does my score work?"), AI Assistant (Show Documents, voice), Guidance & Media, Border Guide, Offline Access, QR Summary, Notifications |
| Border officer (`border_officer`) | Home dashboard, QR scanner + manual search, Passenger Verification (Approve / Flag), History, Profile |
| Admin (`admin_staff`) | Dashboard, Requirements / FAQs / Guidance / Knowledge Base management, User Management, Analytics, AI Change Review |

Limitations: Google/Apple sign-in are not wired to an OAuth provider. Officer scan history, admin content and AI suggestions are stored in the browser (`src/utils/opsStore.ts`) until matching API routes exist; officer lookup only finds QR summaries generated on the same device unless the QR payload is pasted.
