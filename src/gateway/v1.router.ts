import { Router, Request, Response } from 'express';
import multer from 'multer';
import { tenancyService } from '../tenancy/tenancy.service.js';
import { ingestionService } from '../ingestion/ingestion.service.js';
import { orchestratorService } from '../orchestrator/orchestrator.service.js';
import { capabilityRegistry } from '../capabilities/capability.registry.js';
import { geminiProvider } from '../ai/gemini.provider.js';
import { ruleBasedProvider } from '../ai/rule-based.provider.js';
import { config } from '../config/index.js';
import { resolveUserIdFromBearerToken } from '../lib/supabase.server.js';

const upload = multer({
  limits: { fileSize: config.maxFileSizeMB * 1024 * 1024 },
});

export const v1Router = Router();

// Middleware to resolve tenant server-side from X-API-Key header, and the
// authenticated Supabase user (if any) from the Authorization bearer token.
// These are deliberately separate headers: X-API-Key is the demo/tenant
// key, Authorization carries the end-user's Supabase session token.
v1Router.use(async (req: Request, res: Response, next) => {
  const apiKey = req.headers['x-api-key'] as string | undefined;
  const tenant = tenancyService.resolveTenantFromApiKey(apiKey);
  (req as any).tenant = tenant;
  (req as any).userId = await resolveUserIdFromBearerToken(req.headers['authorization'] as string | undefined);
  next();
});

// 1. POST /v1/inputs - Upload/Register input
v1Router.post('/inputs', upload.single('file'), async (req: Request, res: Response): Promise<void> => {
  try {
    const tenant = (req as any).tenant;
    const userId = (req as any).userId;
    let envelope;

    if (req.file) {
      envelope = await ingestionService.processFile(
        req.file.buffer,
        req.file.originalname,
        req.file.mimetype,
        tenant.tenantId,
        userId
      );
    } else if (req.body && (req.body.text || req.body.content)) {
      const text = req.body.text || req.body.content;
      const name = req.body.name || req.body.filename || 'text_input.txt';
      envelope = await ingestionService.processRawText(text, name, tenant.tenantId, userId);
    } else {
      res.status(400).json({
        error: 'Invalid input. Provide a file in multipart field "file" or JSON body with "text".',
      });
      return;
    }

    const suggested = ingestionService.suggestCapabilities(envelope);

    res.status(200).json({
      inputId: envelope.inputId,
      envelope,
      suggestedCapabilities: suggested,
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Ingestion failed' });
  }
});

// 2. POST /v1/inputs/:id/run - Run capabilities on an input
v1Router.post('/inputs/:id/run', async (req: Request, res: Response): Promise<void> => {
  try {
    const inputId = req.params.id;
    const envelope = await ingestionService.getEnvelope(inputId, (req as any).userId);

    if (!envelope) {
      res.status(404).json({ error: `Input envelope with ID '${inputId}' not found.` });
      return;
    }

    const requestedCaps: string[] = req.body.capabilities || ['SUMMARIZE', 'EXTRACT_FACTS'];
    const options = req.body.options || {};

    const results = await orchestratorService.runMultiple(requestedCaps, envelope, options);

    res.status(200).json({
      inputId,
      results,
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Capability execution failed' });
  }
});

// 3. POST /v1/run - One-shot upload + run capabilities
v1Router.post('/run', upload.single('file'), async (req: Request, res: Response): Promise<void> => {
  try {
    const tenant = (req as any).tenant;
    const userId = (req as any).userId;
    let envelope;

    if (req.file) {
      envelope = await ingestionService.processFile(
        req.file.buffer,
        req.file.originalname,
        req.file.mimetype,
        tenant.tenantId,
        userId
      );
    } else if (req.body && (req.body.text || req.body.content)) {
      const text = req.body.text || req.body.content;
      const name = req.body.name || req.body.filename || 'pasted_input.txt';
      envelope = await ingestionService.processRawText(text, name, tenant.tenantId, userId);
    } else {
      res.status(400).json({
        error: 'Invalid input. Provide a file in multipart field "file" or JSON body with "text".',
      });
      return;
    }

    let caps: string[] = [];
    if (typeof req.body.capabilities === 'string') {
      try {
        caps = JSON.parse(req.body.capabilities);
      } catch {
        caps = [req.body.capabilities];
      }
    } else if (Array.isArray(req.body.capabilities)) {
      caps = req.body.capabilities;
    } else {
      caps = ['SUMMARIZE', 'EXTRACT_FACTS'];
    }

    const options = req.body.options || {};
    const results = await orchestratorService.runMultiple(caps, envelope, options);

    res.status(200).json({
      inputId: envelope.inputId,
      envelope,
      results,
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'One-shot run failed' });
  }
});

// 4. GET /v1/jobs/:jobId - Poll job status
v1Router.get('/jobs/:jobId', (req: Request, res: Response) => {
  const jobId = req.params.jobId;
  res.status(200).json({
    jobId,
    status: 'completed',
    message: 'QelomaLens synchronous processing complete.',
  });
});

// 5. POST /v1/inputs/:id/chat - Grounded conversational Q&A
v1Router.post('/inputs/:id/chat', async (req: Request, res: Response): Promise<void> => {
  try {
    const inputId = req.params.id;
    const envelope = await ingestionService.getEnvelope(inputId, (req as any).userId);

    if (!envelope) {
      res.status(404).json({ error: `Input envelope with ID '${inputId}' not found.` });
      return;
    }

    const userMessage = req.body.message || req.body.prompt || '';
    const history = req.body.history || [];

    if (!userMessage) {
      res.status(400).json({ error: 'User message/prompt is required.' });
      return;
    }

    const aiAvailable = config.aiEnabled && Boolean(process.env.GEMINI_API_KEY || config.geminiApiKey);
    const provider = aiAvailable ? geminiProvider : ruleBasedProvider;

    const chatRes = await provider.chat(envelope, userMessage, history);

    res.status(200).json({
      inputId,
      reply: chatRes.reply,
      citedFacts: chatRes.citedFacts || [],
      confidence: chatRes.confidence,
      source: aiAvailable ? 'gemini-2.5-flash' : 'rule-based',
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Chat generation failed' });
  }
});

// 6. GET /v1/capabilities - Capability discovery
v1Router.get('/capabilities', (req: Request, res: Response) => {
  const plugins = capabilityRegistry.list().map((p) => ({
    id: p.id,
    name: p.name,
    description: p.description,
    appliesTo: p.appliesTo,
    confidenceGate: p.confidenceGate,
    outputSchema: p.outputSchema,
  }));

  res.status(200).json({
    capabilities: plugins,
    count: plugins.length,
  });
});
