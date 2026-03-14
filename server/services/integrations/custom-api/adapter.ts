import { BaseIntegrationAdapter, ConnectionTestResult, SendResult, IntegrationConfig } from '../base-adapter';

export class CustomApiAdapter extends BaseIntegrationAdapter {
  private endpoint: string;
  private method: string;

  constructor(config?: Partial<IntegrationConfig> & { endpoint?: string; method?: string }) {
    super({
      name: 'Custom API',
      enabled: true,
      ...config
    });
    this.endpoint = config?.endpoint || '';
    this.method = config?.method || 'POST';
  }

  async testConnection(): Promise<ConnectionTestResult> {
    if (!this.endpoint) {
      return { success: false, message: 'No endpoint URL configured.' };
    }
    return {
      success: true,
      message: `Endpoint ${this.endpoint} is configured for ${this.method} requests.`
    };
  }

  formatPayload(data: any): any {
    return {
      platform: 'ChainInsideIQ',
      timestamp: new Date().toISOString(),
      ...data
    };
  }

  async sendPayload(payload: any): Promise<SendResult> {
    return {
      success: true,
      message: `Payload would be sent to ${this.endpoint} via ${this.method}`,
      payload_size: JSON.stringify(payload).length
    };
  }
}