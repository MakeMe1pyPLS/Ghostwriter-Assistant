import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { generateExcelDashboard } from "./excel/excel-renderer";

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {

  app.post('/api/export/excel', async (req, res) => {
    try {
      const { spec, data, layouts, widgets } = req.body;

      if (!widgets || !Array.isArray(widgets)) {
        return res.status(400).json({ error: 'Missing or invalid widgets array' });
      }

      if (!data || !data.metrics) {
        return res.status(400).json({ error: 'Missing or invalid data payload' });
      }

      const buffer = await generateExcelDashboard({
        spec: spec || { widgets: [], meta: {} },
        data: {
          metrics: data.metrics || [],
          chartData: data.chartData || [],
          donutData: data.donutData || [],
          allMetrics: data.allMetrics || []
        },
        layouts: layouts || {},
        widgets
      });

      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', `attachment; filename="dashboard-${Date.now()}.xlsx"`);
      res.send(buffer);
    } catch (err: any) {
      console.error('Excel export error:', err);
      res.status(500).json({ error: 'Failed to generate Excel workbook', details: err.message });
    }
  });

  return httpServer;
}