import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { createServer as createViteServer } from 'vite';
import { createApp } from './src/app.js';
import { config } from './src/config/index.js';

const currentFilename = typeof __filename !== 'undefined'
  ? __filename
  : process.cwd();
const currentDirname = typeof __dirname !== 'undefined'
  ? __dirname
  : path.dirname(currentFilename);

async function startServer() {
  const app = createApp();
  const PORT = config.port;

  // Vite development middleware or static production serving
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[QelomaLens Engine] Server running at http://0.0.0.0:${PORT}`);
    console.log(`[QelomaLens Engine] REST API contract exposed at /v1`);
  });
}

startServer();
