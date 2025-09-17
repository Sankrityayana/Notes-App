// Vercel Serverless Function: returns JS snippet with client config
export default function handler(req, res) {
  const cfg = {
    GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID || '',
  };
  res.setHeader('Content-Type', 'application/javascript');
  res.status(200).send(`window.APP_CONFIG = ${JSON.stringify(cfg)};`);
}
