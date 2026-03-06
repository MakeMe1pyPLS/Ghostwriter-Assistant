export interface AIResponse {
  summary?: string;
  what_changed?: string;
  why_it_matters?: string;
  actions?: string[];
  forecast_note?: string;
}

export interface AIProvider {
  generateInsights(sector: string, data: any): Promise<AIResponse>;
  generateSummary(sector: string, data: any, trend: string, isPositive: boolean): Promise<string>;
  generateForecast(metric: string, data: any): Promise<string>;
  chat(message: string, context: any): Promise<string>;
}

export class DemoAIProvider implements AIProvider {
  async generateInsights(sector: string, data: any): Promise<AIResponse> {
    return {
      what_changed: "System detected a 4.2% potential yield increase by adjusting Line C throughput.",
      actions: ["Reroute inventory from Central Hub to West Coast to avoid 3-day weather delay."]
    };
  }
  
  async generateSummary(sector: string, data: any, trend: string, isPositive: boolean): Promise<string> {
    return `Overall performance in ${sector} is showing a ${trend} trend. Key indicators suggest strong operational health despite minor localized disruptions. Focus should remain on sustaining current throughput and mitigating identified supply chain risks.`;
  }
  
  async generateForecast(metric: string, data: any): Promise<string> {
    return "Projected 12% increase over the next quarter based on current trend analysis.";
  }
  
  async chat(message: string, context: any): Promise<string> {
    if (message.toLowerCase().includes("risk")) {
      return "The biggest risk currently is a potential bottleneck at the Central Hub due to incoming weather.";
    }
    return `How can I help you analyze the ${context.sector || 'supply chain'} data today?`;
  }
}

export class OpenAIProvider implements AIProvider {
   async generateInsights() { return {}; }
   async generateSummary() { return ""; }
   async generateForecast() { return ""; }
   async chat() { return ""; }
}

// Current active provider
export const ai = new DemoAIProvider();