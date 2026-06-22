import type { Express } from "express";
import { z } from "zod";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { generateExcelDashboard } from "./excel/excel-renderer";
import { generateCsvExport } from "./services/exports/csv-exporter";
import { generateJsonExport } from "./services/exports/json-exporter";
import { generateDatasetExport, generateDatasetCsv } from "./services/exports/dataset-exporter";
import { exportFilename } from "./services/exports";
import multer from "multer";
import { importCsvDataset, parseCsvText } from "./services/data-sources/csv-source";
import { testSqlConnection, fetchTableSchema, importTableData } from "./services/data-sources/sql-source";
import { fetchGoogleSheet } from "./services/data-sources/google-sheets-source";
import { fetchApiData } from "./services/data-sources/api-source";
import { getAllDatasets, getDataset, deleteDataset, getDatasetRows, inferColumns, registerDataset } from "./services/data-sources/dataset-registry";
import { DemoAIProvider } from "./services/ai/demo-provider";
import { getIntelligenceProvider } from "./services/ai/intelligence-router";

interface AIResponse {
  summary: string;
  what_changed: string[];
  why_it_matters: string;
  actions: string[];
  forecast_note: string;
}

const SECTOR_INSIGHTS: Record<string, AIResponse> = {
  ecommerce: {
    summary: "Order fulfillment delays increased this week, driven by warehouse congestion and carrier slowdowns.",
    what_changed: [
      "Late shipments increased 11% week-over-week",
      "Warehouse utilization reached 92%, approaching critical threshold",
      "Carrier delays rose significantly in the Midwest region",
      "Customer complaint tickets up 8% related to delivery windows"
    ],
    why_it_matters: "Delivery performance degradation directly impacts customer satisfaction scores and increases refund/return risk. NPS could drop 3-5 points if unresolved within 48 hours.",
    actions: [
      "Shift overflow orders to backup carrier network immediately",
      "Increase warehouse labor during peak picking hours (10am-2pm)",
      "Prioritize high-value and subscription orders for expedited fulfillment",
      "Proactively notify affected customers with updated ETAs"
    ],
    forecast_note: "If current delays continue, on-time delivery could fall another 2-3% next week. Confidence: Medium-High."
  },
  logistics: {
    summary: "Transit times are extending beyond the 2.4-day average due to port congestion and carrier capacity constraints.",
    what_changed: [
      "Cross-border hold times increased by 14 hours on average",
      "Fuel surcharges rose 4.2%, impacting cost-per-shipment",
      "Port congestion affecting 35% of inbound freight lanes",
      "Regional carrier on-time performance dropped to 87%"
    ],
    why_it_matters: "Extended transit times reduce ATP (Available-to-Promise) accuracy to below 90%, causing downstream stockout risk and customer dissatisfaction.",
    actions: [
      "Reroute critical freight through secondary ports (Savannah, Charleston)",
      "Renegotiate spot rates with top 3 regional carriers",
      "Adjust customer delivery expectations at checkout by +1 day",
      "Pre-position safety stock for high-velocity SKUs"
    ],
    forecast_note: "Transit times expected to normalize within 6-8 days as port congestion clears. Confidence: Medium."
  },
  manufacturing: {
    summary: "Machine downtime spiked on Assembly Line C, threatening daily throughput targets.",
    what_changed: [
      "Unplanned maintenance hours up 18% vs. prior week",
      "Component defect rate increased to 1.2% (target: <0.8%)",
      "Raw material staging delayed by 2 hours due to inbound logistics",
      "Second-shift yield dropped 3% below first-shift benchmark"
    ],
    why_it_matters: "Overall throughput is at risk of falling below the 1,750 units/day target, which would trigger backorder conditions for 12 active customer POs.",
    actions: [
      "Schedule preventive maintenance for Line C during off-shift hours tonight",
      "Switch to secondary supplier for sub-components with >1% defect rate",
      "Reallocate staff from Line A to Line B to compensate for lost capacity",
      "Expedite raw material deliveries from regional warehouse buffer"
    ],
    forecast_note: "Yield expected to recover to 98% within 48 hours once Line C calibration is complete. Confidence: High."
  },
  unified: {
    summary: "Working capital is increasingly tied up in inventory as the cash-to-cash cycle extends.",
    what_changed: [
      "Cash-to-Cash cycle extended to 16 days (target: 12 days)",
      "Safety stock levels increased by 15% across all distribution centers",
      "Supplier lead times grew by 2.1 days on weighted average",
      "Bullwhip Index rose to 1.15, indicating demand signal amplification"
    ],
    why_it_matters: "Extended cash cycles reduce liquidity and indicate a growing bullwhip effect across the supply chain, which could cascade into overstocking or critical stockouts.",
    actions: [
      "Implement tighter inventory control limits using dynamic reorder points",
      "Work with top 5 suppliers to improve lead time reliability by 20%",
      "Discount slow-moving stock in aging buckets >60 days to free up capital",
      "Deploy demand sensing algorithms to reduce forecast error by 15%"
    ],
    forecast_note: "If unaddressed, the Bullwhip Index will likely climb above 1.20 next quarter, increasing carrying costs by an estimated $180K. Confidence: Medium-High."
  }
};

const CHAT_RESPONSES: Record<string, string> = {
  revenue: "Revenue softened primarily due to lower conversion rates in the secondary market segment and a slight drop in Average Order Value (AOV) from $86 to $84. The root cause appears to be increased price sensitivity among mid-tier customers. To reverse this trend, consider running targeted promotions for high-intent segments (cart abandoners with AOV >$100) and bundling complementary products to push AOV back above target.",
  late: "Shipment delays increased mainly due to higher warehouse utilization (approaching 92%) and regional carrier congestion in the Midwest corridor. The bottleneck is concentrated at the picking-to-packing handoff during the 11am-1pm peak window. To stabilize performance, consider rerouting 10-15% of shipments through alternate carriers and temporarily increasing picking capacity with cross-trained staff.",
  action: "Based on current data, your top 3 immediate priorities should be: 1) Address the fulfillment bottleneck by reallocating labor from put-away to picking for the next 48 hours. 2) Expedite all priority and subscription orders through the express lane. 3) Proactively reach out to customers with orders in the delayed pipeline to manage expectations.",
  kpi: "The most critical KPI to monitor right now is the 'Perfect Order Rate'. It's currently at 98.4% but is under pressure from the transit delays and warehouse congestion. A drop below 97% would trigger SLA penalties with your top 3 retail partners. Secondary: watch the Cash-to-Cash Cycle — it's a leading indicator of liquidity stress.",
  forecast: "Looking ahead over the next 14 days:\n\n• Days 1-3: Continued pressure on On-Time Delivery (-1.5% projected)\n• Days 4-7: Stabilization as carrier capacity normalizes\n• Days 8-14: Recovery to baseline, with a potential 2% improvement if recommended actions are executed\n\nOverall forecast: Moderate recovery with 72% confidence. Key risk factor: unexpected demand surge from upcoming promotional calendar.",
  summarize: "Executive Summary:\n\nOperations remain fundamentally resilient, but we are seeing friction at the edges. Top-line metrics are holding (+8% revenue YoY), but underlying operational efficiency is slipping. Key concerns: warehouse utilization at 92%, transit times +14 hours, and defect rates creeping above target. Net assessment: Stable with Watch status. Recommended escalation: None at this time, but implement the 3 corrective actions within 48 hours to prevent degradation.",
  bullwhip: "The Bullwhip Effect Index measures how much demand signal amplification occurs as you move upstream in the supply chain. Your current index of 1.12 means demand variance at the supplier level is 12% higher than at the point of sale. This is within acceptable range (target: <1.15), but the upward trend is concerning. Root cause: inconsistent order batching and long lead times from Tier 2 suppliers.",
  perfect: "Perfect Order Rate measures the percentage of orders that are delivered complete, on-time, undamaged, and with accurate documentation. Your current rate of 98.4% is strong, but each 0.1% drop represents approximately $12,000 in penalty costs and 45 affected customers. The metric is currently under pressure from transit delays.",
  cash: "Cash-to-Cash Cycle Time measures the number of days between when you pay your suppliers and when you receive payment from customers. Your current 14-day cycle is 2 days above target. This means $2.1M in additional working capital is being tied up. Primary driver: supplier payment terms tightened while customer payment cycles extended.",
  defect: "The current defect rate of 0.8% is at the upper boundary of your target range. The increase is primarily driven by Assembly Line C, where a calibration drift was detected on the precision tooling module. Historical pattern suggests this is a maintenance-related issue rather than a material quality problem."
};

function matchChat(message: string, sector: string): string {
  const msg = message.toLowerCase();

  if (msg.includes("bullwhip")) return CHAT_RESPONSES.bullwhip;
  if (msg.includes("perfect order")) return CHAT_RESPONSES.perfect;
  if (msg.includes("cash-to-cash") || msg.includes("cash to cash") || msg.includes("c2c")) return CHAT_RESPONSES.cash;
  if (msg.includes("defect")) return CHAT_RESPONSES.defect;
  if (msg.includes("revenue") || msg.includes("drop") || msg.includes("decline") || msg.includes("aov")) return CHAT_RESPONSES.revenue;
  if (msg.includes("late") || msg.includes("shipment") || msg.includes("delay") || msg.includes("delivery")) return CHAT_RESPONSES.late;
  if (msg.includes("next") || msg.includes("action") || msg.includes("do") || msg.includes("priority")) return CHAT_RESPONSES.action;
  if (msg.includes("kpi") || msg.includes("track") || msg.includes("urgent") || msg.includes("attention")) return CHAT_RESPONSES.kpi;
  if (msg.includes("forecast") || msg.includes("14 day") || msg.includes("7 day") || msg.includes("future") || msg.includes("outlook")) return CHAT_RESPONSES.forecast;
  if (msg.includes("summarize") || msg.includes("leadership") || msg.includes("executive") || msg.includes("summary")) return CHAT_RESPONSES.summarize;
  if (msg.includes("what is") || msg.includes("what does") || msg.includes("explain") || msg.includes("mean")) {
    return `Great question. In supply chain analytics, that metric helps quantify operational efficiency across your ${sector} workflow. It's typically benchmarked against industry standards and monitored for trend deviations. Would you like me to break down how it specifically applies to your current dashboard configuration?`;
  }

  return `I've analyzed the recent ${sector} data across your dashboard. While core operations are stable, there are emerging trends in fulfillment efficiency and capacity utilization that warrant attention. The data suggests focusing on operational throughput in the near term. Would you like me to drill into a specific KPI or generate a detailed forecast?`;
}

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {

  app.post('/api/ai/insights', (req, res) => {
    const { sector } = req.body;
    const key = sector && SECTOR_INSIGHTS[sector] ? sector : 'unified';
    res.json(SECTOR_INSIGHTS[key]);
  });

  app.post('/api/ai/chat', (req, res) => {
    const { message, sector } = req.body;
    const response = matchChat(message || '', sector || 'unified');
    res.json({ response });
  });

  app.post('/api/ai/forecast', (req, res) => {
    const { sector, period } = req.body;
    const days = period === '7d' ? 7 : 14;
    res.json({
      period: `${days}-day`,
      confidence: days === 7 ? 'High' : 'Medium-High',
      summary: `Based on current ${sector || 'supply chain'} trends, we project a moderate recovery over the next ${days} days. Key risk factors include carrier capacity constraints and seasonal demand fluctuations.`,
      data_points: Array.from({ length: days }, (_, i) => ({
        day: i + 1,
        projected: Math.round(3500 + Math.random() * 1500),
        lower: Math.round(3000 + Math.random() * 1000),
        upper: Math.round(4200 + Math.random() * 1500),
      }))
    });
  });

  app.post('/api/ai/recommend-kpis', (req, res) => {
    const { sector } = req.body;
    const kpis: Record<string, any[]> = {
      ecommerce: [
        { name: 'Perfect Order Rate', priority: 'Critical', current: '98.4%', target: '99.0%', explanation: 'Measures orders delivered complete, on-time, undamaged, with correct documentation.' },
        { name: 'Average Order Value', priority: 'High', current: '$84.20', target: '$90.00', explanation: 'Average revenue per transaction. Key lever for revenue growth without traffic increase.' },
        { name: 'Cart Abandonment Rate', priority: 'Medium', current: '68%', target: '60%', explanation: 'Percentage of shopping carts not converted to orders. Indicates friction in checkout.' },
      ],
      logistics: [
        { name: 'On-Time Delivery', priority: 'Critical', current: '94.2%', target: '97.0%', explanation: 'Percentage of shipments delivered within the promised delivery window.' },
        { name: 'Cost per Shipment', priority: 'High', current: '$12.40', target: '$11.00', explanation: 'Total logistics cost divided by shipment count. Benchmark for carrier efficiency.' },
        { name: 'Transit Time Variance', priority: 'Medium', current: '±0.8 days', target: '±0.3 days', explanation: 'Standard deviation of transit times. Lower is more predictable.' },
      ],
      manufacturing: [
        { name: 'Overall Equipment Effectiveness', priority: 'Critical', current: '82%', target: '88%', explanation: 'Composite metric of availability × performance × quality.' },
        { name: 'Defect Rate', priority: 'High', current: '0.8%', target: '0.5%', explanation: 'Percentage of produced units failing quality control.' },
        { name: 'Throughput', priority: 'High', current: '1,750/day', target: '2,000/day', explanation: 'Units produced per day. Primary measure of production capacity.' },
      ],
      unified: [
        { name: 'Cash-to-Cash Cycle', priority: 'Critical', current: '14 days', target: '12 days', explanation: 'Days between paying suppliers and receiving customer payment.' },
        { name: 'Bullwhip Index', priority: 'High', current: '1.12', target: '<1.10', explanation: 'Ratio measuring demand signal amplification across supply chain tiers.' },
        { name: 'ATP Accuracy', priority: 'High', current: '94.2%', target: '97.0%', explanation: 'Accuracy of Available-to-Promise projections vs. actual fulfillment capability.' },
      ]
    };
    res.json({ kpis: kpis[sector || 'unified'] || kpis.unified });
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

  type OperationsIntelInput = z.infer<typeof operationsIntelSchema>;
  const normalizeIntelRequest = (data: OperationsIntelInput) => ({
    sector: data.sector || 'unified',
    metrics: data.metrics.map((m) => ({
      label: m.label,
      value: m.value === undefined ? '' : String(m.value),
      trend: m.trend ?? '',
      isPositive: m.isPositive ?? true,
    })),
    businessStructure: data.businessStructure,
  });

  app.post('/api/ai/command-center', async (req, res) => {
    const parsed = operationsIntelSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: 'Invalid command center payload', details: parsed.error.flatten() });
    }

    try {
      const provider = getIntelligenceProvider();
      const result = await provider.generateCommandCenter(normalizeIntelRequest(parsed.data));
      res.json(result);
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
      const provider = getIntelligenceProvider();
      const result = await provider.generateOperationsIntel(normalizeIntelRequest(parsed.data));
      res.json(result);
    } catch (err) {
      console.error('[operations-intel] error:', err);
      res.status(500).json({ error: 'Failed to generate operations intelligence' });
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
      res.send(buffer);
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

  app.post('/api/export/custom-api', (req, res) => {
    const { endpoint, method, apiKey, payload } = req.body;
    if (!endpoint) return res.status(400).json({ error: 'Endpoint URL is required' });

    res.json({
      success: true,
      message: `Dashboard payload would be sent to ${endpoint} via ${method || 'POST'}`,
      payload_size: JSON.stringify(payload || {}).length,
      timestamp: new Date().toISOString(),
      note: 'This is a simulated response. In production, the payload would be forwarded to the specified endpoint.'
    });
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

  app.post('/api/data/sql/test', async (req, res) => {
    try {
      const result = await testSqlConnection(req.body);
      res.json(result);
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message });
    }
  });

  app.post('/api/data/sql/schema', async (req, res) => {
    try {
      const { config, table } = req.body;
      const schema = await fetchTableSchema(config, table);
      res.json({ table, columns: schema });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.post('/api/data/sql/import', async (req, res) => {
    try {
      const { config, table } = req.body;
      const rows = await importTableData(config, table);
      const columns = inferColumns(rows);
      const dataset = registerDataset({
        name: `${config.database}.${table}`,
        source_type: 'sql',
        columns,
        rows,
        source_meta: { host: config.host, database: config.database, table }
      });
      const { rows: _, ...meta } = dataset;
      res.json({ success: true, dataset: meta, preview: rows.slice(0, 10) });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
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
      const result = await fetchApiData(url, method, headers);
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

  app.get('/api/data/datasets', (_req, res) => {
    res.json({ datasets: getAllDatasets() });
  });

  app.get('/api/data/datasets/:id', (req, res) => {
    const ds = getDataset(req.params.id);
    if (!ds) return res.status(404).json({ error: 'Dataset not found' });
    const { rows, ...meta } = ds;
    res.json({ dataset: meta, preview: rows.slice(0, 50) });
  });

  app.get('/api/data/datasets/:id/rows', (req, res) => {
    const limit = parseInt(req.query.limit as string) || 100;
    const offset = parseInt(req.query.offset as string) || 0;
    const rows = getDatasetRows(req.params.id, limit, offset);
    res.json({ rows, count: rows.length });
  });

  app.delete('/api/data/datasets/:id', (req, res) => {
    const deleted = deleteDataset(req.params.id);
    res.json({ success: deleted });
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