Notes App (Vanilla JS)
======================

Private, user-specific notes with Google Sign-Up/Sign-In using only HTML, CSS, and JavaScript. Notes are stored per user in your browser's IndexedDB (demo only). A tiny Node server loads your Google Client ID from a `.env` file to avoid hard-coding keys.

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
- `server.js` – Node.js static server that exposes `/config.js` from `.env`
- `.env.example` – template for secrets; copy to `.env` and fill

Run Locally
-----------
Local Setup
-----------
1) Create a Google OAuth Client ID (Web) in Google Cloud Console.
	- Authorized JavaScript origins: `http://localhost:8080`
	- Copy the Client ID.
2) Create `.env` from the example:
	```
	copy .env.example .env
	```
	Then edit `.env` and set:
	```
	GOOGLE_CLIENT_ID=YOUR_CLIENT_ID.apps.googleusercontent.com
	PORT=8080
	```
3) Install and run the server:
	```powershell
	npm install
	npm start
	```
4) Open `http://localhost:8080` in your browser.

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
3. Authorized JavaScript origins: add `http://localhost:8080` (and/or your host).
4. Note the Client ID and set it in `app.js` by replacing `GOOGLE_CLIENT_ID`.

Security Notes
--------------
- This is a demo. Notes are stored locally in IndexedDB and tied to the Google account ID in the browser.
- No backend is used; do not store sensitive data.

Security Notes
--------------
- This is a demo. Do not use `localStorage` for real credentials.
- Passwords are salted and hashed client-side with SHA-256 to avoid plain text, but this is not a substitute for a backend.

Storage
-------
- `IndexedDB` database `notesApp`, store `notes` with fields `{ id, userId, title, content, createdAt, updatedAt }`.
- Session stored in `sessionStorage` under `notes.session.google`.

License
-------
MIT
# Notes-App