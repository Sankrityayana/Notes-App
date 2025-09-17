Notes App (Vanilla JS)
======================

Private, user-specific notes with Google Sign-Up/Sign-In using only HTML, CSS, and JavaScript. Notes are stored per user in your browser's IndexedDB (demo only). The Google Client ID is provided at runtime by a config endpoint (`/api/config.js`) so it's never hard-coded.

Features
--------
- Google Sign-Up/Sign-In (OAuth 2.0)
- Per-user session stored in `sessionStorage`
- Per-user private notes (CRUD): create, list, edit, delete
- Clean, minimal, responsive UI; smooth transitions
- No frameworks, one HTML + separate CSS/JS

Project Structure
-----------------
- `index.html` – semantic layout for auth and notes UI
- `styles.css` – responsive styles and micro-interactions
- `app.js` – Google auth, notes CRUD, and IndexedDB persistence
- `.env.example` – template for secrets; copy to `.env` and fill

Local Dev (Vercel CLI)
----------------------
Use the Vercel Dev server to emulate serverless functions locally.

1) Install Vercel CLI (one-time):
```powershell
npm i -g vercel
```
2) Create `.env` from the example and fill in your client ID:
```powershell
copy .env.example .env
```
3) Run locally with env support:
```powershell
vercel dev
```
4) Open the provided localhost URL; `/api/config.js` will serve your `GOOGLE_CLIENT_ID`.

Deploy to Vercel
----------------
1) Push this repo to GitHub.
2) In Vercel, import the project and set Environment Variables:
	 - `GOOGLE_CLIENT_ID=YOUR_CLIENT_ID.apps.googleusercontent.com`
3) Deploy. The front-end loads `/api/config.js`, which returns `window.APP_CONFIG` with `GOOGLE_CLIENT_ID` from `process.env`.
4) Add your production domain to Google Cloud Console → Authorized JavaScript origins.

Sign Up vs Sign In
------------------
- The landing screen shows two Google buttons: “Sign up with Google” and “Sign in with Google”.
- First-time sign in for an account is treated as Sign Up and automatically creates a welcome note in your private space.

Google OAuth Setup
------------------
1. Go to Google Cloud Console → APIs & Services → Credentials.
2. Create Credentials → OAuth client ID → Application type: Web application.
3. Authorized JavaScript origins: add your Vercel domain, and the localhost URL used by `vercel dev`.
4. Note the Client ID and set it in your environment variables (`.env` locally, Vercel env in production). No changes are needed in `app.js`.

Security Notes
--------------
- This is a demo. Notes are stored locally in IndexedDB and tied to the Google account ID in the browser.
- No backend is used; do not store sensitive data.

Storage
-------
- `IndexedDB` database `notesApp`, store `notes` with fields `{ id, userId, title, content, createdAt, updatedAt }`.
- Session stored in `sessionStorage` under `notes.session.google`.

License
-------
MIT
# Notes-App