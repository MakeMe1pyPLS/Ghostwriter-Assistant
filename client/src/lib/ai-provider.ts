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
  generateForecast(metric: string, data: any): Promise<string>;
  chat(message: string, context: any): Promise<string>;
}

export class DemoAIProvider implements AIProvider {
  async generateInsights(sector: string, data: any): Promise<AIResponse> {
    if (sector === 'ecommerce') {
      return {
        summary: "Order fulfillment delays increased this week.",
        what_changed: [
          "Late shipments increased 11%",
          "Warehouse utilization reached 92%",
          "Carrier delays rose in the Midwest region"
        ],
        why_it_matters: "This could reduce customer satisfaction and increase refund risk.",
        actions: [
          "Shift overflow orders to backup carrier",
          "Increase warehouse labor during peak hours",
          "Prioritize high-value orders"
        ],
        forecast_note: "If current delays continue, on-time delivery could fall another 2-3% next week."
      };
    } else if (sector === 'logistics') {
      return {
        summary: "Transit times are extending beyond the 2.4 day average.",
        what_changed: [
          "Cross-border hold times increased by 14 hours",
          "Fuel surcharges rose 4.2%",
          "Port congestion affecting inbound freight"
        ],
        why_it_matters: "Extending transit times will negatively impact ATP (Available-to-Promise) accuracy.",
        actions: [
          "Reroute critical freight through secondary ports",
          "Renegotiate spot rates with regional carriers",
          "Adjust customer delivery expectations on checkout"
        ],
        forecast_note: "Transit times are expected to normalize within 6-8 days as port congestion clears."
      };
    } else if (sector === 'manufacturing') {
      return {
        summary: "Machine downtime spiked on Assembly Line C.",
        what_changed: [
          "Unplanned maintenance hours up 18%",
          "Component defect rate increased to 1.2%",
          "Raw material staging delayed by 2 hours"
        ],
        why_it_matters: "Overall throughput is at risk of falling below the 1,750 units/day target.",
        actions: [
          "Schedule preventive maintenance for off-shift hours",
          "Switch to secondary supplier for sub-components",
          "Reallocate staff to Line B to compensate"
        ],
        forecast_note: "Yield expected to recover to 98% once Line C calibration is complete."
      };
    }
    
    // Unified/Default
    return {
      summary: "Working capital is increasingly tied up in inventory.",
      what_changed: [
        "Cash-to-Cash cycle extended to 16 days",
        "Safety stock levels increased by 15%",
        "Supplier lead times grew by 2.1 days"
      ],
      why_it_matters: "This reduces liquidity and indicates a growing bullwhip effect across the supply chain.",
      actions: [
        "Implement tighter inventory control limits",
        "Work with suppliers to improve lead time reliability",
        "Discount slow-moving stock to free up capital"
      ],
      forecast_note: "If unaddressed, the Bullwhip Index will likely climb above 1.15 next quarter."
    };
  }
  
  async generateSummary(sector: string, data: any, trend: string, isPositive: boolean): Promise<string> {
    return `Based on the current dataset, performance in the ${sector} sector is showing a ${trend} trend. A key driver appears to be recent operational shifts affecting core KPIs. A recommended action would be to stabilize current throughput and address localized friction points to sustain growth.`;
  }
  
  async generateForecast(metric: string, data: any): Promise<string> {
    return "Recent trends indicate a projected 12% increase over the next 14 days, assuming demand seasonality follows historical patterns.";
  }
  
  async chat(message: string, context: any): Promise<string> {
    const msg = message.toLowerCase();
    
    if (msg.includes("revenue") || msg.includes("drop") || msg.includes("decline")) {
      return "Revenue softened primarily due to lower conversion rates in the secondary market and a slight drop in Average Order Value (AOV). To reverse this trend, consider running targeted promotions for high-intent segments and bundling products to push AOV back up.";
    }
    
    if (msg.includes("late") || msg.includes("shipment") || msg.includes("delay")) {
      return "Shipment delays increased mainly due to higher warehouse utilization (approaching 92%) and regional carrier congestion in the Midwest. To stabilize performance, consider rerouting 10-15% of shipments through alternate carriers and temporarily increasing picking capacity during peak hours.";
    }
    
    if (msg.includes("next") || msg.includes("action") || msg.includes("do")) {
      return "Based on current data, your immediate priority should be addressing the bottleneck in fulfillment. I recommend reallocating labor from put-away to picking for the next 48 hours and expediting priority orders.";
    }
    
    if (msg.includes("kpi") || msg.includes("track") || msg.includes("urgent")) {
      return "The most critical KPI to monitor right now is the 'Perfect Order Rate'. It is highly sensitive to the current transit delays and will serve as a leading indicator for customer satisfaction dropping.";
    }
    
    if (msg.includes("forecast") || msg.includes("14 day") || msg.includes("future") || msg.includes("days")) {
       return "Looking ahead over the next 14 days, my simulation projects a continued tightening of capacity. Expect a 2-3% dip in On-Time Delivery before the network stabilizes. Confidence band is Medium, driven by variable carrier performance.";
    }

    if (msg.includes("summarize") || msg.includes("leadership") || msg.includes("executive")) {
       return `Overall ${context.sector || 'operations'} remain resilient, but we are seeing friction at the edges. Top-line metrics are holding, but underlying efficiency (like utilization and transit times) is slipping. We need targeted interventions in fulfillment to protect margins this quarter.`;
    }

    return `I've analyzed the recent ${context.sector || 'supply chain'} data. While core operations are stable, there are emerging trends in fulfillment and capacity that warrant attention. How specific would you like me to get?`;
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