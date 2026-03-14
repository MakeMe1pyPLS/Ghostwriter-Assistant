import { BaseIntegrationAdapter, ConnectionTestResult, SendResult, IntegrationConfig } from '../base-adapter';

export class PowerBIAdapter extends BaseIntegrationAdapter {
  constructor(config?: Partial<IntegrationConfig>) {
    super({
      name: 'Power BI',
      enabled: false,
      ...config
    });
  }

  async testConnection(): Promise<ConnectionTestResult> {
    return {
      success: false,
      message: 'Power BI integration requires Azure AD authentication. Coming soon.'
    };
  }

  formatPayload(data: any): any {
    return {
      dataset_name: `ChainInsideIQ_${data.sector || 'Unified'}`,
      tables: [
        { name: 'Metrics', columns: ['label', 'value', 'trend', 'direction'], rows: data.metrics || [] },
        { name: 'Timeseries', columns: ['period', 'actual', 'forecast'], rows: data.chartData || [] }
      ]
    };
  }

  async sendPayload(_payload: any): Promise<SendResult> {
    return {
      success: false,
      message: 'Power BI integration is not yet configured. Azure AD setup required.'
    };
  }
}