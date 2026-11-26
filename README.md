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
