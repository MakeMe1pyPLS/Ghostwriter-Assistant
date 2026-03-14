import { BaseIntegrationAdapter, ConnectionTestResult, SendResult, IntegrationConfig } from '../base-adapter';

export class GoogleSheetsAdapter extends BaseIntegrationAdapter {
  constructor(config?: Partial<IntegrationConfig>) {
    super({
      name: 'Google Sheets',
      enabled: false,
      ...config
    });
  }

  async testConnection(): Promise<ConnectionTestResult> {
    return {
      success: false,
      message: 'Google Sheets integration requires OAuth configuration. Coming soon.'
    };
  }

  formatPayload(data: any): any {
    return {
      spreadsheet_title: `ChainInsideIQ Dashboard - ${data.sector || 'Unified'}`,
      sheets: [
        { name: 'KPIs', data: data.metrics || [] },
        { name: 'Timeseries', data: data.chartData || [] },
        { name: 'Channels', data: data.donutData || [] }
      ]
    };
  }

  async sendPayload(_payload: any): Promise<SendResult> {
    return {
      success: false,
      message: 'Google Sheets integration is not yet configured. OAuth setup required.'
    };
  }
}