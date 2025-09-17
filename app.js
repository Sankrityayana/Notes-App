// Notes App - Google Sign-In + IndexedDB (demo)

// CONFIG: Loaded from /config.js via Node server (.env -> GOOGLE_CLIENT_ID)
const GOOGLE_CLIENT_ID = (window.APP_CONFIG && window.APP_CONFIG.GOOGLE_CLIENT_ID) || '';
const SESSION_KEY = 'notes.session.google'; // sessionStorage

// Utilities
const $ = (sel, parent = document) => parent.querySelector(sel);
const $$ = (sel, parent = document) => Array.from(parent.querySelectorAll(sel));
const delay = (ms) => new Promise(r => setTimeout(r, ms));

function uid() {
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}
function formatDate(ts) {
  const d = new Date(ts);
  return d.toLocaleString();
}
function loadSession() {
  try { return JSON.parse(sessionStorage.getItem(SESSION_KEY) || 'null'); } catch { return null; }
}
function saveSession(s) {
  if (!s) sessionStorage.removeItem(SESSION_KEY); else sessionStorage.setItem(SESSION_KEY, JSON.stringify(s));
}
function decodeJwt(token) {
  const payload = token.split('.')[1];
  const padded = payload.replace(/-/g, '+').replace(/_/g, '/');
  const json = decodeURIComponent(atob(padded).split('').map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2)).join(''));
  return JSON.parse(json);
}

// IndexedDB helpers
const DB_NAME = 'notesApp';
const DB_VERSION = 1;
const STORE = 'notes';

function openDB() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(STORE)) {
        const store = db.createObjectStore(STORE, { keyPath: 'id' });
        store.createIndex('by_user', 'userId', { unique: false });
        store.createIndex('by_updated', 'updatedAt', { unique: false });
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

async function idbGetNotesByUser(userId) {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, 'readonly');
    const idx = tx.objectStore(STORE).index('by_user');
    const req = idx.getAll(IDBKeyRange.only(userId));
    req.onsuccess = () => resolve(req.result || []);
    req.onerror = () => reject(req.error);
  });
}
async function idbAddNote(note) {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, 'readwrite');
    const req = tx.objectStore(STORE).add(note);
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}
async function idbGetNote(id) {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, 'readonly');
    const req = tx.objectStore(STORE).get(id);
    req.onsuccess = () => resolve(req.result || null);
    req.onerror = () => reject(req.error);
  });
}
async function idbUpdateNote(note) {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, 'readwrite');
    const req = tx.objectStore(STORE).put(note);
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}
async function idbDeleteNote(id) {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, 'readwrite');
    const req = tx.objectStore(STORE).delete(id);
    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
  });
}

// Elements
const authSection = $('#auth-section');
const notesSection = $('#notes-section');
const authInfo = $('#auth-info');
const currentUsernameEl = $('#current-username');
const avatarEl = $('#avatar');
const logoutBtn = $('#logout-btn');
const gsiSignup = $('#gsi-signup');
const gsiSignin = $('#gsi-signin');
const authError = $('#auth-error');

// Notes UI
const newNoteBtn = $('#new-note-btn');
const searchInput = $('#search-input');
const editor = $('#editor');
const noteForm = $('#note-form');
const noteId = $('#note-id');
const noteTitle = $('#note-title');
const noteContent = $('#note-content');
const cancelEditBtn = $('#cancel-edit');
const notesList = $('#notes-list');
const noteCardTpl = $('#note-card-template');

// Auth state
let currentUser = null; // { id, name, email, picture }

function show(el) { el.removeAttribute('hidden'); el.classList.remove('hidden'); }
function hide(el) { el.setAttribute('hidden', ''); el.classList.add('hidden'); }
function resetForm(form) { form.reset(); $$('input[type="hidden"]', form).forEach(i => i.value = ''); }

function onAuthChanged() {
  if (currentUser) {
    hide(authSection);
    show(notesSection);
    show(authInfo);
    currentUsernameEl.textContent = currentUser.name || currentUser.email || 'User';
    if (currentUser.picture) { avatarEl.src = currentUser.picture; avatarEl.hidden = false; } else { avatarEl.hidden = true; }
    renderNotes();
  } else {
    show(authSection);
    hide(notesSection);
    hide(authInfo);
    notesList.innerHTML = '';
    resetForm(noteForm);
    hide(editor);
  }
}

function setupGoogleSignIn() {
  if (!GOOGLE_CLIENT_ID || GOOGLE_CLIENT_ID.startsWith('REPLACE_')) {
    authError.textContent = 'Missing Google CLIENT_ID. Please set GOOGLE_CLIENT_ID in app.js.';
    return;
  }
  /* global google */
  if (!window.google || !window.google.accounts || !window.google.accounts.id) {
    // The script loads async; retry a few times
    let retries = 0;
    const iv = setInterval(() => {
      retries++;
      if (window.google && window.google.accounts && window.google.accounts.id) {
        clearInterval(iv);
        setupGoogleSignIn();
      } else if (retries > 20) {
        clearInterval(iv);
        authError.textContent = 'Failed to load Google Sign-In. Check your network and try again.';
      }
    }, 150);
    return;
  }
  google.accounts.id.initialize({
    client_id: GOOGLE_CLIENT_ID,
    callback: handleCredentialResponse,
    auto_select: true,
    ux_mode: 'popup'
  });
  if (gsiSignup) {
    google.accounts.id.renderButton(gsiSignup, {
      type: 'standard',
      theme: 'outline',
      size: 'large',
      text: 'signup_with',
      shape: 'pill'
    });
  }
  if (gsiSignin) {
    google.accounts.id.renderButton(gsiSignin, {
      type: 'standard',
      theme: 'outline',
      size: 'large',
      text: 'signin_with',
      shape: 'pill'
    });
  }
  google.accounts.id.prompt();
}

function handleCredentialResponse(response) {
  try {
    const payload = decodeJwt(response.credential);
    const user = {
      id: payload.sub,
      name: payload.name,
      email: payload.email,
      picture: payload.picture,
    };
    currentUser = user;
    saveSession({ user });
    onAuthChanged();
    maybeInitUser();
  } catch (err) {
    authError.textContent = 'Failed to sign in. Please try again.';
    console.error(err);
  }
}

async function maybeInitUser() {
  if (!currentUser) return;
  const existing = await idbGetNotesByUser(currentUser.id);
  if (!existing || existing.length === 0) {
    const now = Date.now();
    await idbAddNote({
      id: uid(),
      userId: currentUser.id,
      title: 'Welcome to Notes',
      content: `Hi ${currentUser.name || ''}!\n\nThis is your private space. Create, edit, and delete notes.\n\nSigned in with: ${currentUser.email || 'Google'}\nDate: ${new Date(now).toLocaleString()}`,
      createdAt: now,
      updatedAt: now
    });
    renderNotes();
  }
}

function logout() {
  try {
    if (window.google && window.google.accounts && window.google.accounts.id) {
      google.accounts.id.disableAutoSelect();
    }
  } catch {}
  saveSession(null);
  currentUser = null;
  onAuthChanged();
}

// Notes logic
async function renderNotes(filter = '') {
  if (!currentUser) return;
  const all = await idbGetNotesByUser(currentUser.id);
  const query = filter.trim().toLowerCase();
  const filtered = all
    .filter(n => !query || (n.title && n.title.toLowerCase().includes(query)) || (n.content && n.content.toLowerCase().includes(query)))
    .sort((a, b) => b.updatedAt - a.updatedAt);

  const frag = document.createDocumentFragment();
  if (filtered.length === 0) {
    const empty = document.createElement('div');
    empty.className = 'card muted';
    empty.textContent = query ? 'No notes match your search.' : 'No notes yet — create your first note!';
    notesList.innerHTML = '';
    notesList.appendChild(empty);
    return;
  }
  filtered.forEach(n => {
    const node = noteCardTpl.content.firstElementChild.cloneNode(true);
    node.dataset.id = n.id;
    $('.note-title', node).textContent = n.title || 'Untitled';
    $('.note-time', node).textContent = 'Updated ' + formatDate(n.updatedAt);
    $('.note-time', node).setAttribute('datetime', new Date(n.updatedAt).toISOString());
    $('.note-content', node).textContent = n.content || '';
    $('.edit', node).addEventListener('click', () => startEdit(n));
    $('.delete', node).addEventListener('click', () => deleteNote(n.id));
    frag.appendChild(node);
  });
  notesList.innerHTML = '';
  notesList.appendChild(frag);
}

function startCreate() {
  noteId.value = '';
  noteTitle.value = '';
  noteContent.value = '';
  show(editor);
  noteTitle.focus();
  editor.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

function startEdit(n) {
  noteId.value = n.id;
  noteTitle.value = n.title || '';
  noteContent.value = n.content || '';
  show(editor);
  noteTitle.focus();
  editor.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

function cancelEdit() {
  resetForm(noteForm);
  hide(editor);
}

async function saveNote(e) {
  e.preventDefault();
  if (!currentUser) return;
  const id = noteId.value;
  const title = noteTitle.value.trim();
  const content = noteContent.value.trim();
  if (!title || !content) return;
  const now = Date.now();
  if (id) {
    const existing = await idbGetNote(id);
    const createdAt = existing?.createdAt || now;
    await idbUpdateNote({ id, userId: currentUser.id, title, content, createdAt, updatedAt: now });
  } else {
    await idbAddNote({ id: uid(), userId: currentUser.id, title, content, createdAt: now, updatedAt: now });
  }
  await renderNotes(searchInput.value);
  cancelEdit();
}

async function deleteNote(id) {
  const confirmMsg = 'Delete this note? This cannot be undone.';
  if (!confirm(confirmMsg)) return;
  const card = notesList.querySelector(`[data-id="${id}"]`);
  if (card) {
    card.classList.add('out');
    await delay(160);
  }
  await idbDeleteNote(id);
  await renderNotes(searchInput.value);
}

// Event wiring
logoutBtn.addEventListener('click', logout);
newNoteBtn.addEventListener('click', startCreate);
cancelEditBtn.addEventListener('click', cancelEdit);
noteForm.addEventListener('submit', saveNote);
searchInput.addEventListener('input', () => renderNotes(searchInput.value));
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && !editor.classList.contains('hidden')) {
    cancelEdit();
  }
});

// Init
(function init() {
  // Restore session
  const s = loadSession();
  currentUser = s?.user || null;
  onAuthChanged();
  // Setup Google Sign-In button/prompt
  setupGoogleSignIn();
})();
