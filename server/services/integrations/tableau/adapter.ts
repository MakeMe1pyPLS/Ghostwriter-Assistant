import { BaseIntegrationAdapter, ConnectionTestResult, SendResult, IntegrationConfig } from '../base-adapter';

export class TableauAdapter extends BaseIntegrationAdapter {
  constructor(config?: Partial<IntegrationConfig>) {
    super({
      name: 'Tableau',
      enabled: false,
      ...config
    });
  }

  async testConnection(): Promise<ConnectionTestResult> {
    return {
      success: false,
      message: 'Tableau integration requires Tableau Server/Cloud authentication. Coming soon.'
    };
  }

  formatPayload(data: any): any {
    return {
      workbook_name: `ChainInsideIQ_${data.sector || 'Unified'}`,
      datasource: {
        metrics: data.metrics || [],
        timeseries: data.chartData || [],
        channels: data.donutData || []
      }
    };
  }

  async sendPayload(_payload: any): Promise<SendResult> {
    return {
      success: false,
      message: 'Tableau integration is not yet configured. Server authentication required.'
    };
  }
}