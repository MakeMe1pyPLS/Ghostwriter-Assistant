export interface AIResponse {
  summary?: string;
  what_changed?: string[];
  why_it_matters?: string;
  actions?: string[];
  forecast_note?: string;
}

export interface AIProvider {
  generateInsights(sector: string, data: any): Promise<AIResponse>;
  generateSummary(sector: string, data: any, trend: string, isPositive: boolean): Promise<string>;
  generateForecast(metric: string, data: any): Promise<any>;
  chat(message: string, context: any): Promise<string>;
  recommendKpis(sector: string): Promise<any[]>;
}

export class BackendAIProvider implements AIProvider {
  async generateInsights(sector: string, _data: any): Promise<AIResponse> {
    try {
      const res = await fetch('/api/ai/insights', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sector })
      });
      if (!res.ok) throw new Error('API error');
      return await res.json();
    } catch {
      return new DemoAIProvider().generateInsights(sector, _data);
    }
  }

  async generateSummary(sector: string, data: any, trend: string, isPositive: boolean): Promise<string> {
    return new DemoAIProvider().generateSummary(sector, data, trend, isPositive);
  }

  async generateForecast(_metric: string, data: any): Promise<any> {
    try {
      const res = await fetch('/api/ai/forecast', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sector: data?.sector || 'unified', period: '14d' })
      });
      if (!res.ok) throw new Error('API error');
      return await res.json();
    } catch {
      return { summary: "Projected 12% increase over the next 14 days based on historical patterns." };
    }
  }

  async chat(message: string, context: any): Promise<string> {
    try {
      const res = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message, sector: context?.sector || 'unified' })
      });
      if (!res.ok) throw new Error('API error');
      const data = await res.json();
      return data.response;
    } catch {
      return new DemoAIProvider().chat(message, context);
    }
  }

  async recommendKpis(sector: string): Promise<any[]> {
    try {
      const res = await fetch('/api/ai/recommend-kpis', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sector })
      });
      if (!res.ok) throw new Error('API error');
      const data = await res.json();
      return data.kpis;
    } catch {
      return [];
    }
  }
}

export class DemoAIProvider implements AIProvider {
  async generateInsights(sector: string, data: any): Promise<AIResponse> {
    if (sector === 'ecommerce') {
      return {
        summary: "Order fulfillment delays increased this week.",
        what_changed: ["Late shipments increased 11%", "Warehouse utilization reached 92%", "Carrier delays rose in the Midwest region"],
        why_it_matters: "This could reduce customer satisfaction and increase refund risk.",
        actions: ["Shift overflow orders to backup carrier", "Increase warehouse labor during peak hours", "Prioritize high-value orders"],
        forecast_note: "If current delays continue, on-time delivery could fall another 2-3% next week."
      };
    } else if (sector === 'logistics') {
      return {
        summary: "Transit times are extending beyond the 2.4 day average.",
        what_changed: ["Cross-border hold times increased by 14 hours", "Fuel surcharges rose 4.2%", "Port congestion affecting inbound freight"],
        why_it_matters: "Extending transit times will negatively impact ATP accuracy.",
        actions: ["Reroute critical freight through secondary ports", "Renegotiate spot rates with regional carriers", "Adjust customer delivery expectations"],
        forecast_note: "Transit times are expected to normalize within 6-8 days."
      };
    } else if (sector === 'manufacturing') {
      return {
        summary: "Machine downtime spiked on Assembly Line C.",
        what_changed: ["Unplanned maintenance hours up 18%", "Component defect rate increased to 1.2%", "Raw material staging delayed by 2 hours"],
        why_it_matters: "Overall throughput is at risk of falling below the 1,750 units/day target.",
        actions: ["Schedule preventive maintenance for off-shift hours", "Switch to secondary supplier for sub-components", "Reallocate staff to Line B"],
        forecast_note: "Yield expected to recover to 98% once Line C calibration is complete."
      };
    }
    return {
      summary: "Working capital is increasingly tied up in inventory.",
      what_changed: ["Cash-to-Cash cycle extended to 16 days", "Safety stock levels increased by 15%", "Supplier lead times grew by 2.1 days"],
      why_it_matters: "This reduces liquidity and indicates a growing bullwhip effect.",
      actions: ["Implement tighter inventory control limits", "Work with suppliers to improve lead time reliability", "Discount slow-moving stock"],
      forecast_note: "Bullwhip Index will likely climb above 1.15 next quarter."
    };
  }

  async generateSummary(sector: string, data: any, trend: string, isPositive: boolean): Promise<string> {
    return `Based on the current dataset, performance in the ${sector} sector is showing a ${trend} trend. A recommended action would be to stabilize current throughput.`;
  }

  async generateForecast(metric: string, data: any): Promise<any> {
    return { summary: "Projected 12% increase over the next 14 days." };
  }

  async chat(message: string, context: any): Promise<string> {
    return `I've analyzed the recent ${context.sector || 'supply chain'} data. While core operations are stable, there are emerging trends that warrant attention.`;
  }

  async recommendKpis(sector: string): Promise<any[]> { return []; }
}

export const ai = new BackendAIProvider();