import { BaseIntegrationAdapter, ConnectionTestResult, SendResult, IntegrationConfig } from '../base-adapter';

export class ExcelIntegrationAdapter extends BaseIntegrationAdapter {
  constructor(config?: Partial<IntegrationConfig>) {
    super({
      name: 'Microsoft Excel',
      enabled: true,
      ...config
    });
  }

  async testConnection(): Promise<ConnectionTestResult> {
    return {
      success: true,
      message: 'Excel export is available via server-side generation.',
      latency_ms: 0
    };
  }

  formatPayload(data: any): any {
    return {
      spec: data.spec || {},
      data: data.data || {},
      layouts: data.layouts || {},
      widgets: data.widgets || []
    };
  }

  async sendPayload(_payload: any): Promise<SendResult> {
    return {
      success: true,
      message: 'Excel file generated successfully. Use /api/export/excel endpoint for download.',
      payload_size: 0
    };
  }
}