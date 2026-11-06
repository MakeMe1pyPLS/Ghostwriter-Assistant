import type { Express } from "express";
import { z } from "zod";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { generateExcelDashboard } from "@shared/excel/excel-renderer";
import { generateCsvExport } from "./services/exports/csv-exporter";
import { generateJsonExport } from "./services/exports/json-exporter";
import { generateDatasetExport, generateDatasetCsv } from "./services/exports/dataset-exporter";
import { exportFilename } from "./services/exports";
import multer from "multer";
import { importCsvDataset, parseCsvText } from "./services/data-sources/csv-source";
import { fetchGoogleSheet } from "./services/data-sources/google-sheets-source";
import { fetchApiData } from "./services/data-sources/api-source";
import { getDatasetRows } from "./services/data-sources/dataset-registry";
import { DemoAIProvider } from "./services/ai/demo-provider";
import { getIntelligenceProvider } from "./services/ai/intelligence-router";
import type { AiAccess } from "./services/platform/ai-access";
import { engineStatus } from "./services/ai/engines";
import type { CommandCenterRequest, AnalystChatRequest, AIEnginePreference } from "@shared/ai-types";
import type { GrowthProfile } from "@shared/growth";
import { GOALS, COMPANY_SIZES, STAGES, CHALLENGES } from "@shared/growth";
import { SESSION_TEMPLATES, type ConsultRequest } from "@shared/consult";
import { rateLimit } from "./services/rate-limit";
import { assertPublicHttpUrl, isAllowedWebhook, postWebhook } from "./services/integrations/webhooks";


export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {

  // AI endpoints cost money per call: cap them per client IP.
  app.use('/api/data', rateLimit({ windowMs: 60_000, max: 30 }));
  app.use('/api/export', rateLimit({ windowMs: 60_000, max: 30 }));
  app.use('/api/ai', rateLimit({ windowMs: 60_000, max: Number(process.env.AI_RATE_LIMIT_PER_MIN || 30) }));

  const engineSchema = z.enum(['auto', 'claude', 'openai', 'gemini']).optional().default('auto');
  const enginePref = (body: any): AIEnginePreference => {
    const r = engineSchema.safeParse(body?.engine);
    return r.success ? r.data : 'auto';
  };

  // The engines this request may use (set by platform-routes.ts): the customer's
  // own keys first, then ours within their monthly allowance, else built-in.
  const providerFor = (req: any, res: any) => {
    const access = res.locals.ai as AiAccess | undefined;
    let pref = enginePref(req.body);
    if (pref === 'auto' && access?.ownFirst) pref = access.ownFirst;
    return getIntelligenceProvider(pref, access?.engines);
  };
  // Counts the answer BEFORE replying: on serverless hosting the function is frozen once the reply is sent,
  // which cut off the usage count and left every answer uncounted.
  const sendAi = async (res: any, result: any) => {
    const access = res.locals.ai as AiAccess | undefined;
    await access?.record(result?.generatedBy);
    res.json(access?.notice ? { ...result, aiNotice: access.notice } : result);
  };

  app.get('/api/ai/engines', (_req, res) => {
    res.json(engineStatus());
  });

  // Removed: this used to return canned text and random numbers presented as analysis of the customer's business.
  app.post('/api/ai/insights', (_req, res) => {
    res.status(501).json({ error: 'Not available. Answers come from your own data through /api/ai/chat.' });
  });

  app.post('/api/ai/chat', async (req, res) => {
    const parsed = analystChatSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: 'Invalid chat payload', details: parsed.error.flatten() });
    }

    try {
      const provider = providerFor(req, res);
      const result = await provider.generateAnalystResponse({
        ...normalizeIntelRequest(parsed.data),
        message: parsed.data.message,
        businessContext: parsed.data.businessContext,
      } satisfies AnalystChatRequest & { businessContext?: string });
      await sendAi(res, result);
    } catch (err) {
      console.error('[ai/chat] error:', err);
      res.status(500).json({ error: 'Failed to generate analyst response' });
    }
  });

  // Removed: this used to return canned text and random numbers presented as analysis of the customer's business.
  app.post('/api/ai/forecast', (_req, res) => {
    res.status(501).json({ error: 'Not available. Answers come from your own data through /api/ai/chat.' });
  });

  // Removed: this used to return canned text and random numbers presented as analysis of the customer's business.
  app.post('/api/ai/recommend-kpis', (_req, res) => {
    res.status(501).json({ error: 'Not available. Answers come from your own data through /api/ai/chat.' });
  });

  // Shared schema + normalizer for the operations intelligence endpoints.
  const operationsIntelSchema = z.object({
    sector: z.string().trim().max(60).optional(),
    businessStructure: z.string().trim().max(60).optional(),
    metrics: z
      .array(
        z.object({
          label: z.string().trim().max(120),
          value: z.union([z.string().max(60), z.number()]).optional(),
          trend: z.string().max(60).optional(),
          isPositive: z.boolean().optional(),
        })
      )
      .max(50)
      .default([]),
  });

  const analystChatSchema = operationsIntelSchema.extend({
    message: z.string().trim().max(2000).default(''),
    businessContext: z.string().trim().max(3000).optional(),
  });

  type OperationsIntelInput = z.infer<typeof operationsIntelSchema>;
  // `satisfies CommandCenterRequest` ties the Zod validator to the shared
  // request contract: if the schema or shared type drift apart (e.g. a renamed
  // field or a metric losing its `value`), this stops compiling and `npm run
  // check` fails — the request side now has the same drift guard as responses.
  const normalizeIntelRequest = (data: OperationsIntelInput): CommandCenterRequest => ({
    sector: data.sector || 'unified',
    metrics: data.metrics.map((m) => ({
      label: m.label,
      value: m.value === undefined ? '' : String(m.value),
      trend: m.trend ?? '',
      isPositive: m.isPositive ?? true,
    })),
    businessStructure: data.businessStructure,
  }) satisfies CommandCenterRequest;

  app.post('/api/ai/command-center', async (req, res) => {
    const parsed = operationsIntelSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: 'Invalid command center payload', details: parsed.error.flatten() });
    }

    try {
      const provider = providerFor(req, res);
      const result = await provider.generateCommandCenter(normalizeIntelRequest(parsed.data));
      await sendAi(res, result);
    } catch (err) {
      console.error('[command-center] error:', err);
      res.status(500).json({ error: 'Failed to generate command center briefing' });
    }
  });

  app.post('/api/ai/operations-intel', async (req, res) => {
    const parsed = operationsIntelSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: 'Invalid operations intel payload', details: parsed.error.flatten() });
    }

    try {
      const provider = providerFor(req, res);
      const result = await provider.generateOperationsIntel(normalizeIntelRequest(parsed.data));
      await sendAi(res, result);
    } catch (err) {
      console.error('[operations-intel] error:', err);
      res.status(500).json({ error: 'Failed to generate operations intelligence' });
    }
  });

  // Growth plan from the onboarding interview.
  const growthProfileSchema = z.object({
    businessName: z.string().trim().max(120).optional(),
    goal: z.enum(GOALS.map((g) => g.id) as [string, ...string[]]),
    goalDetail: z.string().trim().max(600).optional(),
    industryId: z.string().trim().max(60),
    size: z.enum(COMPANY_SIZES.map((s) => s.id) as [string, ...string[]]),
    stage: z.enum(STAGES.map((s) => s.id) as [string, ...string[]]),
    challenges: z.array(z.enum(CHALLENGES.map((c) => c.id) as [string, ...string[]])).max(12).default([]),
    targetKpi: z.string().trim().max(120),
    targetValue: z.string().trim().max(80).optional(),
    timeframeDays: z.union([z.literal(30), z.literal(90), z.literal(180), z.literal(365)]),
    partners: z.array(z.string().trim().max(120)).max(10).default([]),
    dataStatus: z.enum(['uploaded', 'later', 'new']).optional(),
    dataSummary: z.string().trim().max(300).optional(),
    dataInputs: z.array(z.string().trim().max(120)).max(16).optional(),
  });

  app.post('/api/ai/growth-plan', async (req, res) => {
    const parsed = growthProfileSchema.safeParse(req.body?.profile ?? req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: 'Invalid growth profile', details: parsed.error.flatten() });
    }
    try {
      const plan = await providerFor(req, res).generateGrowthPlan(parsed.data as GrowthProfile);
      await sendAi(res, plan);
    } catch (err) {
      console.error('[growth-plan] error:', err);
      res.status(500).json({ error: 'Failed to build growth plan' });
    }
  });

  // AI consultant session: answers to a session template → findings, options, recommendation.
  const consultSchema = z.object({
    kind: z.enum(SESSION_TEMPLATES.map((t) => t.id) as [string, ...string[]]),
    answers: z.record(z.string().max(40), z.union([z.string().max(600), z.number()])).default({}),
    businessContext: z.string().max(4000).optional(),
  });

  app.post('/api/ai/consult', async (req, res) => {
    const parsed = consultSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: 'Invalid consult request', details: parsed.error.flatten() });
    }
    try {
      const result = await providerFor(req, res).generateConsult(parsed.data as ConsultRequest);
      await sendAi(res, result);
    } catch (err) {
      console.error('[consult] error:', err);
      res.status(500).json({ error: 'Failed to run consult session' });
    }
  });

  // Send a message to Microsoft Teams, Google Chat or Slack via an incoming
  // webhook the customer created in that tool. Only those tools' webhook hosts
  // are allowed, so this endpoint cannot be used to reach arbitrary URLs.
  const notifySchema = z.object({
    channel: z.enum(['teams', 'google-chat', 'slack']),
    webhookUrl: z.string().url().max(2000),
    title: z.string().trim().min(1).max(200),
    text: z.string().trim().max(4000).default(''),
    link: z.string().url().max(2000).optional(),
    facts: z.array(z.object({ name: z.string().max(80), value: z.string().max(200) })).max(10).optional(),
  });

  app.post('/api/integrations/notify', rateLimit({ windowMs: 60_000, max: 20 }), async (req, res) => {
    const parsed = notifySchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: 'Invalid notification', details: parsed.error.flatten() });
    const { channel, webhookUrl } = parsed.data;
    if (!isAllowedWebhook(channel, webhookUrl)) {
      return res.status(400).json({ error: `That URL is not a ${channel === 'teams' ? 'Microsoft Teams' : channel === 'google-chat' ? 'Google Chat' : 'Slack'} webhook address.` });
    }
    try {
      await postWebhook(parsed.data);
      res.json({ success: true });
    } catch (err: any) {
      res.status(502).json({ error: `The ${channel} webhook did not accept the message.`, details: String(err?.message ?? err).slice(0, 200) });
    }
  });

  app.post('/api/export/excel', async (req, res) => {
    try {
      const { spec, data, layouts, widgets, sector } = req.body;
      if (!widgets || !Array.isArray(widgets)) return res.status(400).json({ error: 'Missing or invalid widgets array' });
      if (!data || !data.metrics) return res.status(400).json({ error: 'Missing or invalid data payload' });

      const buffer = await generateExcelDashboard({
        spec: spec || { widgets: [], meta: {} },
        data: { metrics: data.metrics || [], chartData: data.chartData || [], donutData: data.donutData || [], allMetrics: data.allMetrics || [] },
        layouts: layouts || {},
        widgets
      });

      const filename = exportFilename('dashboard_excel', sector || 'unified', 'xlsx');
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      res.send(Buffer.from(buffer));
    } catch (err: any) {
      console.error('Excel export error:', err);
      res.status(500).json({ error: 'Failed to generate Excel workbook', details: err.message });
    }
  });

  app.post('/api/export/csv', (req, res) => {
    try {
      const { metrics, chartData, sector, dateRange } = req.body;
      if (!metrics || !Array.isArray(metrics) || metrics.length === 0) {
        return res.status(400).json({ error: 'Missing or empty metrics array' });
      }

      const csv = generateCsvExport({ metrics, chartData, sector, dateRange });
      const filename = exportFilename('dashboard', sector || 'unified', 'csv');

      res.setHeader('Content-Type', 'text/csv; charset=utf-8');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      res.send(csv);
    } catch (err: any) {
      console.error('CSV export error:', err);
      res.status(500).json({ error: 'Failed to generate CSV', details: err.message });
    }
  });

  app.post('/api/export/json', (req, res) => {
    try {
      const body = req.body;
      const exportPayload = generateJsonExport(body);
      const json = JSON.stringify(exportPayload, null, 2);
      const filename = exportFilename('dashboard_spec', body.sector || 'unified', 'json');

      res.setHeader('Content-Type', 'application/json; charset=utf-8');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      res.send(json);
    } catch (err: any) {
      console.error('JSON export error:', err);
      res.status(500).json({ error: 'Failed to generate JSON export', details: err.message });
    }
  });

  app.post('/api/export/dataset', (req, res) => {
    try {
      const { metrics, chartData, donutData, sector, dateRange, format } = req.body;
      if (!metrics || !Array.isArray(metrics) || metrics.length === 0) {
        return res.status(400).json({ error: 'Missing or empty metrics array' });
      }

      const outputFormat = format || 'json';

      if (outputFormat === 'csv') {
        const csv = generateDatasetCsv({ metrics, chartData, donutData, sector, dateRange });
        const filename = exportFilename('dataset', sector || 'unified', 'csv');
        res.setHeader('Content-Type', 'text/csv; charset=utf-8');
        res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
        res.send(csv);
      } else {
        const dataset = generateDatasetExport({ metrics, chartData, donutData, sector, dateRange });
        const filename = exportFilename('dataset', sector || 'unified', 'json');
        res.setHeader('Content-Type', 'application/json; charset=utf-8');
        res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
        res.send(JSON.stringify(dataset, null, 2));
      }
    } catch (err: any) {
      console.error('Dataset export error:', err);
      res.status(500).json({ error: 'Failed to generate dataset export', details: err.message });
    }
  });

  // Sending a dashboard to your own API is not built yet.
  app.post('/api/export/custom-api', (_req, res) => {
    res.status(501).json({ success: false, message: 'Sending to your own API is not available yet.' });
  });

  const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 10 * 1024 * 1024 } });

  app.post('/api/data/upload-csv', upload.single('file'), (req, res) => {
    try {
      if (!req.file) return res.status(400).json({ error: 'No file uploaded' });
      const csvText = req.file.buffer.toString('utf-8');
      const name = req.body.name || req.file.originalname?.replace('.csv', '') || 'CSV Import';
      const dataset = importCsvDataset(name, csvText);
      const { rows, ...meta } = dataset;
      res.json({ success: true, dataset: meta, preview: rows.slice(0, 10) });
    } catch (err: any) {
      res.status(500).json({ error: 'Failed to parse CSV', details: err.message });
    }
  });

  app.post('/api/data/parse-csv-text', (req, res) => {
    try {
      const { text, name } = req.body;
      if (!text) return res.status(400).json({ error: 'No CSV text provided' });
      const dataset = importCsvDataset(name || 'CSV Import', text);
      const { rows, ...meta } = dataset;
      res.json({ success: true, dataset: meta, preview: rows.slice(0, 10) });
    } catch (err: any) {
      res.status(500).json({ error: 'Failed to parse CSV', details: err.message });
    }
  });

  // Direct database connections are not built yet. These answer plainly instead of returning made-up rows.
  app.all('/api/data/sql/:step', (_req, res) => {
    res.status(501).json({ success: false, error: 'Database connections are not available yet. Export the table as a CSV and upload it instead.' });
  });

  app.post('/api/data/google-sheets', async (req, res) => {
    try {
      const { url } = req.body;
      if (!url) return res.status(400).json({ success: false, error: 'Sheet URL is required' });
      const result = await fetchGoogleSheet(url);
      if (result.success && result.data) {
        const { rows, ...meta } = result.data;
        res.json({ success: true, dataset: meta, preview: rows.slice(0, 10) });
      } else {
        res.json({ success: false, error: result.error });
      }
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  app.post('/api/data/api-ingest', async (req, res) => {
    try {
      const { url, method, headers } = req.body;
      if (!url) return res.status(400).json({ success: false, error: 'API URL is required' });
      try {
        await assertPublicHttpUrl(url);
      } catch (e: any) {
        return res.status(400).json({ success: false, error: e.message });
      }
      const safeMethod = String(method || 'GET').toUpperCase() === 'POST' ? 'POST' : 'GET';
      const safeHeaders: Record<string, string> = {};
      if (headers && typeof headers === 'object') {
        for (const [k, v] of Object.entries(headers).slice(0, 10)) {
          if (typeof v === 'string' && /^[a-z0-9-]{1,64}$/i.test(k) && !/^(host|cookie|connection|content-length)$/i.test(k)) safeHeaders[k] = v.slice(0, 500);
        }
      }
      const result = await fetchApiData(url, safeMethod, safeHeaders);
      if (result.success && result.data) {
        const { rows, ...meta } = result.data;
        res.json({ success: true, dataset: meta, preview: rows.slice(0, 10) });
      } else {
        res.json({ success: false, error: result.error });
      }
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  app.get('/api/data/datasets/:id/rows', (req, res) => {
    const limit = Math.min(1000, Math.max(1, parseInt(req.query.limit as string) || 100));
    const offset = Math.max(0, parseInt(req.query.offset as string) || 0);
    const rows = getDatasetRows(req.params.id, limit, offset);
    res.json({ rows, count: rows.length });
  });

  const dashboardAI = new DemoAIProvider();

  app.post('/api/ai/generate-dashboard', async (req, res) => {
    try {
      const result = await dashboardAI.generateDashboard(req.body);
      res.json(result);
    } catch (err: any) {
      console.error('Dashboard generation error:', err);
      res.status(500).json({ error: 'Failed to generate dashboard', details: err.message });
    }
  });

  app.post('/api/ai/enhance-dashboard', async (req, res) => {
    try {
      const result = await dashboardAI.enhanceDashboard(req.body);
      res.json(result);
    } catch (err: any) {
      console.error('Dashboard enhancement error:', err);
      res.status(500).json({ error: 'Failed to enhance dashboard', details: err.message });
    }
  });

  return httpServer;
}