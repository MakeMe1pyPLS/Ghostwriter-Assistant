import { useState, useEffect } from "react";
import { Zap, TrendingUp, AlertTriangle, ChevronRight } from "lucide-react";

const SECTOR_INSIGHTS: Record<string, { text: string; type: 'positive' | 'warning' | 'info' }[]> = {
  ecommerce: [
    { text: "Revenue up 18.4% driven by strong Electronics performance and increased paid search conversion in the North East region.", type: 'positive' },
    { text: "Cart abandonment rose 3.1% on mobile — consider streamlining checkout flow and adding Apple Pay support.", type: 'warning' },
    { text: "Average Order Value declined slightly due to Accessories category mix shift; bundle promotions may help recover margin.", type: 'info' },
  ],
  logistics: [
    { text: "On-time delivery improved 1.8% this period — West Hub and Express Hub are top performers driving the gains.", type: 'positive' },
    { text: "Cost per shipment rose $1.20 due to fuel surcharges. Routing optimization on South Hub routes may reduce exposure.", type: 'warning' },
    { text: "Damaged goods rate increased to 0.42% — last-mile handling is the primary contributor; packaging audit recommended.", type: 'warning' },
  ],
  manufacturing: [
    { text: "Units produced up 8.4% — Line B performed above target. Line A maintained best-in-class OEE at 87.4%.", type: 'positive' },
    { text: "Line C OEE dropped to 69.2% with 8.6h downtime — root cause analysis required before next production cycle.", type: 'warning' },
    { text: "Defect rate rose 0.21% at assembly step 4. Corrective maintenance on Line C is the recommended priority action.", type: 'warning' },
  ],
  unified: [
    { text: "Perfect Order Rate reached 98.4%, led by the East region — 0.4% above target and 1.2% ahead of prior period.", type: 'positive' },
    { text: "Inventory turns declined to 8.4x due to slow-moving SKUs in Specialty and Industrial segments. Review reorder points.", type: 'warning' },
    { text: "Supply chain cost increased to 11.2% of revenue. Logistics is the primary driver — freight costs up 12% period over period.", type: 'info' },
  ],
};

const TYPE_STYLES = {
  positive: {
    bg: 'bg-emerald-50 border-emerald-200',
    icon: 'text-emerald-600',
    text: 'text-emerald-800',
    dot: 'bg-emerald-500',
    Icon: TrendingUp,
  },
  warning: {
    bg: 'bg-amber-50 border-amber-200',
    icon: 'text-amber-600',
    text: 'text-amber-800',
    dot: 'bg-amber-500',
    Icon: AlertTriangle,
  },
  info: {
    bg: 'bg-blue-50 border-blue-200',
    icon: 'text-blue-600',
    text: 'text-blue-800',
    dot: 'bg-blue-500',
    Icon: Zap,
  },
};

export function DashboardInsightBanner({ sector }: { sector: string }) {
  const insights = SECTOR_INSIGHTS[sector] || SECTOR_INSIGHTS['unified'];
  const [idx, setIdx] = useState(0);
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const timer = setInterval(() => {
      setVisible(false);
      setTimeout(() => {
        setIdx(i => (i + 1) % insights.length);
        setVisible(true);
      }, 300);
    }, 8000);
    return () => clearInterval(timer);
  }, [insights.length]);

  const insight = insights[idx];
  const style = TYPE_STYLES[insight.type];
  const Icon = style.Icon;

  return (
    <div
      className={`mb-5 flex items-start gap-3 px-4 py-3 rounded-2xl border ${style.bg} transition-opacity duration-300 ${visible ? 'opacity-100' : 'opacity-0'}`}
      data-testid="dashboard-insight-banner"
    >
      <div className={`w-7 h-7 rounded-xl bg-white flex items-center justify-center shrink-0 shadow-sm ${style.icon}`}>
        <Icon className="w-3.5 h-3.5" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-0.5">
          <span className={`text-[9px] font-black uppercase tracking-widest ${style.icon}`}>AI Insight</span>
          <span className="text-[9px] text-slate-400 font-bold">· auto-rotating {idx + 1}/{insights.length}</span>
        </div>
        <p className={`text-[11px] font-medium leading-relaxed ${style.text}`}>{insight.text}</p>
      </div>
      <div className="flex items-center gap-1 shrink-0">
        {insights.map((_, i) => (
          <button
            key={i}
            onClick={() => { setIdx(i); setVisible(true); }}
            className={`w-1.5 h-1.5 rounded-full transition-all ${i === idx ? style.dot : 'bg-slate-200'}`}
            data-testid={`insight-dot-${i}`}
          />
        ))}
        <ChevronRight className="w-3.5 h-3.5 text-slate-300 ml-1" />
      </div>
    </div>
  );
}
