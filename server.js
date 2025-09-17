// Simple Node server to serve static files and expose Google Client ID from .env
const path = require('path');
const fs = require('fs');
const express = require('express');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 8080;

const ROOT = __dirname;

// Serve config as JS to the client
app.get('/config.js', (req, res) => {
  const cfg = {
    GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID || '',
  };
  res.set('Content-Type', 'application/javascript');
  res.send(`window.APP_CONFIG = ${JSON.stringify(cfg)};`);
});

// Serve static files
app.use(express.static(ROOT, { extensions: ['html'] }));

// Fallback to index.html
app.get('*', (req, res) => {
  res.sendFile(path.join(ROOT, 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Notes-App server running at http://localhost:${PORT}`);
});
