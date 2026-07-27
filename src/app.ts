import express, { Express } from 'express';
import { v1Router } from './gateway/v1.router.js';
import { config } from './config/index.js';

/**
 * Builds the QelomaLens Express app: JSON/urlencoded parsing, permissive CORS
 * (single-tenant demo gateway, keyed by X-API-Key rather than origin), the
 * health check, and the /v1 REST contract. Shared between local dev
 * (server.ts, which adds Vite middleware / static serving) and the Vercel
 * serverless entrypoint (api/index.ts, which Vercel serves directly).
 */
export function createApp(): Express {
  const app = express();

  app.use(express.json({ limit: '25mb' }));
  app.use(express.urlencoded({ extended: true, limit: '25mb' }));

  app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, X-API-Key, Authorization');
    if (req.method === 'OPTIONS') {
      res.sendStatus(200);
      return;
    }
    next();
  });

  app.get('/health', (req, res) => {
    res.json({
      status: 'ok',
      service: 'QelomaLens Understanding Service',
      version: 'v1.0.0',
      aiEnabled: config.aiEnabled,
      hasGeminiKey: Boolean(process.env.GEMINI_API_KEY || config.geminiApiKey),
      persistence: config.supabasePersistenceEnabled ? 'supabase' : 'in-memory',
    });
  });

  app.use('/v1', v1Router);

  return app;
}
