Notes App (Vanilla JS + Google Sign-In)
=======================================

A minimal, professional Notes app with Google Sign-Up/Sign-In. Each user’s notes are private (scoped to their Google Account ID) and stored locally in IndexedDB. No frameworks or backend database required. The Google OAuth Client ID is injected at runtime from environment variables via a lightweight config endpoint (`/api/config.js`) so it is never hard-coded in client code.

Highlights
----------
- Google OAuth 2.0: Sign Up and Sign In (two-button UX)
- Private per-user notes with IndexedDB (CRUD: create, list, edit, delete)
- Professional & Calm theme (light blue background, white cards, blue primary buttons)
- Smooth animations, responsive layout, clean accessibility-minded UI
- No frameworks; single HTML + separate CSS/JS
- Secure config delivery at runtime (`/api/config.js`), works on Vercel and locally via Vercel CLI

Tech Stack
----------
- Frontend: HTML, CSS, JavaScript (no frameworks)
- Auth: Google Identity Services (client-side OAuth 2.0)
- Storage: IndexedDB (per userId)
- Config: Serverless function returning `window.APP_CONFIG` from env vars

Architecture Overview
---------------------
1. On load, the app fetches `/api/config.js` which sets `window.APP_CONFIG.GOOGLE_CLIENT_ID` from environment variables.
2. Google Identity Services renders two buttons (Sign Up / Sign In).
3. After login, the app decodes the ID token to get the Google user ID (`sub`) and stores a session in `sessionStorage`.
4. Notes are fetched from IndexedDB filtered by `userId`. First-time users get a seeded welcome note.
5. Create/Edit/Delete operations update IndexedDB and the UI re-renders with animations.

Project Structure
-----------------
- `index.html` – semantic layout for auth and notes UI (includes `/api/config.js` and Google GSI script)
- `styles.css` – Professional & Calm theme, responsive layout, transitions
- `app.js` – Google auth flow, session, and per-user notes CRUD via IndexedDB
- `api/config.js` – serverless function: exposes `GOOGLE_CLIENT_ID` as `window.APP_CONFIG`
- `.env.example` – template for local development (used by `vercel dev`)

Local Development (Vercel CLI)
------------------------------
Use Vercel Dev to emulate serverless functions locally so `/api/config.js` works the same as production.

1) Install Vercel CLI:
```powershell
npm i -g vercel
```
2) Create `.env` from the example and fill in your Client ID:
```powershell
copy .env.example .env
```
3) Run locally:
```powershell
vercel dev
```
4) Open the provided localhost URL. Confirm `GET /api/config.js` returns a JS snippet with your `GOOGLE_CLIENT_ID`.

Deploy to Vercel
----------------
1) Push this repo to GitHub (or connect directly from Vercel).
2) In Vercel → Project → Settings → Environment Variables, add:
	 - `GOOGLE_CLIENT_ID=YOUR_CLIENT_ID.apps.googleusercontent.com`
3) Deploy. The client loads `/api/config.js`, which injects `window.APP_CONFIG` at runtime.
4) In Google Cloud Console → OAuth 2.0 Client, add your Vercel domain to Authorized JavaScript origins.

Usage
-----
1) Landing shows:
	 - “Sign up with Google” (for new users) – first login seeds a welcome note
	 - “Sign in with Google” (for returning users)
2) Create notes via “➕ New Note”. Edit inline; delete with confirmation. Search filters notes by title/content.
3) Logout from the header; notes are hidden until you sign in again.

Theme (Professional & Calm)
---------------------------
- Background: `#E8F0FE`
- Card/Note: `#FFFFFF`
- Primary Buttons: `#1A73E8`
- Secondary Buttons: `#5F6368`
- Text: `#202124`

Troubleshooting
---------------
- Google Sign-In not showing or fails:
	- Ensure `GOOGLE_CLIENT_ID` is set in Vercel env (and `.env` for `vercel dev`).
	- Check that your domain/localhost URL is in Google Cloud Console → Authorized JavaScript origins.
	- Open the browser console and visit `/api/config.js` to verify the config is being injected.
- Notes don’t persist:
	- IndexedDB can be blocked by private windows or strict settings; try a normal window.
	- Check the Application tab (DevTools) → IndexedDB → `notesApp` → `notes`.

Security Notes
--------------
- Demo-only: Notes live in the browser (IndexedDB) and are scoped by Google user ID.
- No backend database is used. Do not store sensitive data.
- The Google OAuth client ID is delivered at runtime from environment variables—never hard-coded in client bundles.

License
-------
MIT