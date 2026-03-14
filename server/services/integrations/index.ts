export { BaseIntegrationAdapter } from './base-adapter';
export type { IntegrationConfig, ConnectionTestResult, SendResult } from './base-adapter';

export { ExcelIntegrationAdapter } from './excel/adapter';
export { GoogleSheetsAdapter } from './google-sheets/adapter';
export { PowerBIAdapter } from './powerbi/adapter';
export { TableauAdapter } from './tableau/adapter';
export { CustomApiAdapter } from './custom-api/adapter';

export const INTEGRATION_REGISTRY = [
  { id: 'excel', name: 'Microsoft Excel', status: 'active' as const, adapter: 'ExcelIntegrationAdapter' },
  { id: 'google-sheets', name: 'Google Sheets', status: 'coming-soon' as const, adapter: 'GoogleSheetsAdapter' },
  { id: 'powerbi', name: 'Power BI', status: 'coming-soon' as const, adapter: 'PowerBIAdapter' },
  { id: 'tableau', name: 'Tableau', status: 'coming-soon' as const, adapter: 'TableauAdapter' },
  { id: 'custom-api', name: 'Custom API', status: 'active' as const, adapter: 'CustomApiAdapter' },
];