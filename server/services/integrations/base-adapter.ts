export interface IntegrationConfig {
  name: string;
  enabled: boolean;
  credentials?: Record<string, string>;
  settings?: Record<string, any>;
}

export interface ConnectionTestResult {
  success: boolean;
  message: string;
  latency_ms?: number;
}

export interface SendResult {
  success: boolean;
  message: string;
  response_code?: number;
  payload_size?: number;
}

export abstract class BaseIntegrationAdapter {
  protected config: IntegrationConfig;

  constructor(config: IntegrationConfig) {
    this.config = config;
  }

  abstract testConnection(): Promise<ConnectionTestResult>;

  abstract formatPayload(data: any): any;

  abstract sendPayload(payload: any): Promise<SendResult>;

  getStatus(): { name: string; enabled: boolean; configured: boolean } {
    return {
      name: this.config.name,
      enabled: this.config.enabled,
      configured: !!this.config.credentials && Object.keys(this.config.credentials).length > 0
    };
  }

  getName(): string {
    return this.config.name;
  }
}