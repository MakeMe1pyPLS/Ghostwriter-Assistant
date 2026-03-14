export interface IntegrationMeta {
  id: string;
  name: string;
  description: string;
  status: 'active' | 'coming-soon' | 'beta';
  icon: string;
  category: 'export' | 'bi' | 'api' | 'spreadsheet';
  capabilities: string[];
}

export const INTEGRATIONS: IntegrationMeta[] = [
  {
    id: 'excel',
    name: 'Microsoft Excel',
    description: 'Generate formatted Excel workbooks with KPI cards, charts, and data tables from your dashboard.',
    status: 'active',
    icon: 'FileSpreadsheet',
    category: 'export',
    capabilities: ['export', 'download', 'formatted-workbook']
  },
  {
    id: 'google-sheets',
    name: 'Google Sheets',
    description: 'Push dashboard data directly to Google Sheets via OAuth. Live sync and scheduled updates.',
    status: 'coming-soon',
    icon: 'FileSpreadsheet',
    category: 'spreadsheet',
    capabilities: ['sync', 'oauth', 'scheduled']
  },
  {
    id: 'powerbi',
    name: 'Power BI',
    description: 'Export datasets and dashboard templates compatible with Power BI Desktop and Service.',
    status: 'coming-soon',
    icon: 'BarChart',
    category: 'bi',
    capabilities: ['template', 'dataset-push', 'azure-ad']
  },
  {
    id: 'tableau',
    name: 'Tableau',
    description: 'Generate Tableau-compatible data extracts and packaged workbook templates.',
    status: 'coming-soon',
    icon: 'CloudCog',
    category: 'bi',
    capabilities: ['extract', 'workbook', 'server-publish']
  },
  {
    id: 'custom-api',
    name: 'Custom API',
    description: 'Send dashboard specs, datasets, or metrics summaries to any external API endpoint.',
    status: 'active',
    icon: 'Plug',
    category: 'api',
    capabilities: ['webhook', 'rest-api', 'custom-payload']
  }
];