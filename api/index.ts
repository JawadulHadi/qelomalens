import { createApp } from '../src/app.js';

// Vercel's Node.js runtime accepts an Express app directly as the default
// export — it's callable as (req, res), matching the (IncomingMessage,
// ServerResponse) signature Vercel invokes. vercel.json rewrites /health and
// /v1/:path* to this function; everything else is served as static files
// from the Vite build output (see outputDirectory in vercel.json).
export default createApp();
