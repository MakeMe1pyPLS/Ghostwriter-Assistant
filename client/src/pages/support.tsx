import { MarketingLayout } from "@/components/layout/MarketingLayout";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { 
  Mail, MessageCircle, BookOpen, Headphones, ArrowRight, ChevronDown, ChevronUp, HelpCircle, Zap,
  LayoutDashboard, Wand2, Sparkles, Database, Download, Plug, BrainCircuit, Shield, Users, CreditCard,
  Building, Share2, MessageSquare
} from "lucide-react";
import { useState } from "react";
import { getPricingSummary } from "@/lib/pricing";

const faqs = [
  { q: "How do I get started with ChainInsideIQ?", a: "Start by signing up for a 14-day free trial. You can immediately access the Dashboard Builder, import your data, and begin generating insights. No credit card required." },
  { q: "Can I import my own datasets?", a: "Yes. You can upload CSV files, connect to SQL databases, import from Google Sheets, or ingest data from external APIs. The platform will automatically detect column types and map them to the appropriate KPIs." },
  { q: "What export formats are supported?", a: "ChainInsideIQ supports Excel (.xlsx), CSV, JSON, formatted PDF reports, and scheduled exports. Professional plans and above also support Google Sheets, SQL, and API integrations. Enterprise plans add Power BI and Tableau connectors." },
  { q: "Is the AI analysis powered by real machine learning?", a: "The current demo uses a sophisticated rule-based engine calibrated against real supply chain benchmarks. Our production tier integrates with advanced AI models for deeper predictive analytics." },
  { q: "How does the pricing work?", a: getPricingSummary() },
  { q: "Can multiple team members use the same account?", a: "Yes. Starter includes 1 user, Professional supports up to 5 users, Business supports up to 15 users, and Enterprise plans support unlimited team members with role-based access controls, SSO, and audit logs." },
  { q: "Do you offer onboarding or setup assistance?", a: "Absolutely. We offer guided onboarding sessions for Business and Enterprise customers. Enterprise plans include dedicated onboarding assistance, custom KPI engineering, and direct support. You can also request a custom setup through our Contact page." },
  { q: "Is my data secure?", a: "Yes. All data is encrypted in transit and at rest. We follow SOC 2 Type II compliance standards and never share your data with third parties. Enterprise plans include dedicated environments and audit logs. See our Privacy Policy for details." },
  { q: "What is the difference between Single and Unified sector mode?", a: "Single mode focuses your dashboard on one sector (e.g. E-commerce only). Unified mode displays cross-sector KPIs that bridge manufacturing, logistics, and e-commerce together, showing end-to-end supply chain health." },
  { q: "Can I customize the look of individual KPI cards?", a: "Yes. Each KPI card supports 8 style presets, 4 data density modes (minimal, standard, detailed, grid), adjustable border radius, shadow intensity, padding, and toggles for sparklines, badges, icons, and comparison labels." },
  { q: "What are the three business structure types?", a: "Single Business: one company operating in one sector. Partnered Business: two sectors working together (e.g. E-commerce + Logistics), with Hub and data sharing enabled by default. Unified Supply Chain: three sectors connected end-to-end (e.g. Manufacturing → E-commerce → Logistics), unlocking cross-sector dashboards, shared intelligence, and the unified sector mode." },
  { q: "How does cross-sector data sharing work?", a: "Enable data sharing in Settings, then use 'Request to Share Data' to send a data exchange request to another sector. Each request specifies a dataset (Orders, Demand, Inventory, etc.) and can include a message. Requests go through a pending → approved/rejected workflow. Approved requests unlock shared metrics in your dashboards and AI analysis." },
  { q: "Can I disable the Ops Hub?", a: "Yes. The Hub can be toggled on or off in Settings under Hub Communication. When disabled, the Hub page shows a disabled state with a link to re-enable it. Hub is optional for single businesses but recommended for partnered and unified-chain structures." },
];

const docSections = [
  {
    icon: LayoutDashboard,
    title: "Dashboard Builder",
    color: "text-primary bg-primary/10 border-primary/20",
    content: [
      "The Dashboard Builder is your primary workspace. It uses a drag-and-drop grid layout where you can add, position, and resize any of the 12+ widget types.",
      "Key features: Free-form canvas with 12-column grid. Drag widgets from the Widget Library panel on the right. Click any widget to open the Widget Inspector for deep customization. Duplicate or delete widgets with one click.",
      "Layout changes are auto-saved to your browser. When you navigate to the Dashboard page, it loads the exact same layout in read-only presentation mode.",
    ]
  },
  {
    icon: Sparkles,
    title: "Generate For Me (AI Wizard)",
    color: "text-indigo-600 bg-indigo-50 border-indigo-100",
    content: [
      "The 10-step Generate For Me wizard creates a complete dashboard from scratch using AI. It starts by asking about your business structure and sectors, then covers priorities, KPI preferences, visual style, and layout density.",
      "Steps: (1) Business Structure (Single/Partnered/Unified), (2) Sector Selection (1-3 sectors based on structure), (3) Data Sharing preference, (4) Primary Goal, (5) Destination Tool, (6) Dashboard Style, (7) KPI Priorities, (8) Data Context, (9) Dashboard Density, (10) AI Help Level.",
      "For Partnered and Unified structures, the wizard generates dashboards for each connected sector. After generation, dashboards are loaded into the Builder where you can refine them before viewing in the Dashboard page.",
    ]
  },
  {
    icon: Wand2,
    title: "Enhance My Dashboard",
    color: "text-violet-600 bg-violet-50 border-violet-100",
    content: [
      "The 5-step Enhance flow takes your existing dashboard and improves it. It analyzes your current widget layout and suggests additions, reorganizations, and AI-powered upgrades.",
      "Enhancement options include: adding missing KPI coverage, upgrading chart types, inserting AI widgets (insights, forecasts, chat), and optimizing layout density.",
      "Your original widgets are preserved — enhancements are additive. You can undo any changes in the Builder afterwards.",
    ]
  },
  {
    icon: BrainCircuit,
    title: "AI & Insights Widgets",
    color: "text-teal-600 bg-teal-50 border-teal-100",
    content: [
      "ChainInsideIQ includes 5 AI-powered widget types: AI Insights (automated anomaly detection and recommendations), AI Chat (conversational data assistant), Demand Forecast (predictive trend lines), Executive Summary (natural language overview), and Opportunity & Risk Highlights (sector-specific alerts).",
      "AI widgets are 'always active' — they work across all sectors and date ranges without manual metric binding. They adapt their output based on the sector context selected in the sidebar.",
      "The Opportunity & Risk widget surfaces real-time alerts categorized as Risk, Opportunity, Urgent, Action, or Forecast, each with severity levels and color-coded indicators.",
    ]
  },
  {
    icon: Database,
    title: "Data Sources & KPI Library",
    color: "text-blue-600 bg-blue-50 border-blue-100",
    content: [
      "ChainInsideIQ includes a 36-metric KPI library spanning 4 categories: E-commerce (Revenue, AOV, Conversion Rate, Cart Abandonment, ROAS, etc.), Manufacturing (Throughput, Defect Rate, OEE, Yield, etc.), Logistics (On-Time Delivery, Shipment Volume, Transit Time, etc.), and Unified (Perfect Order Rate, Cash-to-Cash Cycle, Inventory Turnover, etc.).",
      "Each KPI includes a recommended visualization type (KPI card, trend, bar, etc.), a help tooltip, and an AI-suggested chart type. You can override any of these in the Widget Inspector.",
      "Demo data is sector-aware and changes automatically when you switch sectors. You can also import your own CSV files or connect external APIs through the Data Sources page.",
    ]
  },
  {
    icon: Download,
    title: "Export & Reporting",
    color: "text-amber-600 bg-amber-50 border-amber-100",
    content: [
      "Export your dashboards in multiple formats: Excel (.xlsx) with formatted sheets, CSV for raw data, JSON for developer integrations, and PDF for executive reporting.",
      "Exports include all visible widget data, chart configurations, and AI-generated insights. Scheduled exports are available on Professional plans and above.",
      "The Export drawer is accessible from both the Builder and Dashboard pages via the export icon in the top toolbar.",
    ]
  },
  {
    icon: Plug,
    title: "Connectors & Integrations",
    color: "text-emerald-600 bg-emerald-50 border-emerald-100",
    content: [
      "Connect ChainInsideIQ to your existing systems: ERP platforms (SAP, Oracle, NetSuite), WMS (Manhattan, Blue Yonder), TMS (Oracle TMS, MercuryGate), and e-commerce platforms (Shopify, WooCommerce, Magento).",
      "API-first architecture supports REST and webhook integrations. Professional plans and above include Google Sheets and SQL database connectors. Enterprise plans add Power BI, Tableau, and custom API endpoints.",
      "All connections are managed through the Connectors page in the sidebar. Data sync frequency depends on your plan tier.",
    ]
  },
  {
    icon: Users,
    title: "Team & Collaboration",
    color: "text-rose-600 bg-rose-50 border-rose-100",
    content: [
      "Invite team members to collaborate on dashboards. Each member can have a role: Viewer (read-only access), Editor (can modify dashboards), or Admin (full access including settings and billing).",
      "The Hub page provides internal communication features for discussing dashboard insights, flagging anomalies, and sharing views with stakeholders.",
      "Enterprise plans include SSO (SAML 2.0), audit logs, and granular permission controls for dashboard-level access.",
    ]
  },
  {
    icon: Shield,
    title: "Security & Compliance",
    color: "text-slate-600 bg-slate-50 border-slate-200",
    content: [
      "All data is encrypted in transit (TLS 1.3) and at rest (AES-256). We maintain SOC 2 Type II compliance and undergo annual third-party security audits.",
      "Enterprise deployments include dedicated environments, custom data retention policies, IP allowlisting, and comprehensive audit logging.",
      "We never share customer data with third parties. Our AI processing happens within your data boundary — no data leaves your environment for model training.",
    ]
  },
  {
    icon: Building,
    title: "Business Structure",
    color: "text-cyan-600 bg-cyan-50 border-cyan-100",
    content: [
      "ChainInsideIQ supports three business structure types: Single Business (one sector), Partnered Business (two sectors working together), and Unified Supply Chain (three sectors connected end-to-end).",
      "Your structure choice affects how dashboards are generated, which sectors appear in the sidebar, whether the Ops Hub is enabled, and how AI analysis provides cross-sector intelligence.",
      "Single Business: Operates in one sector (e.g. E-commerce only). Hub is optional. Best for focused, single-domain operations. Partnered Business: Two sectors (e.g. E-commerce + Logistics). Hub is enabled by default for inter-sector communication. Unified Supply Chain: Three sectors connected (Manufacturing → E-commerce → Logistics). Unlocks unified sector mode, cross-sector dashboards, and shared KPIs like Perfect Order Rate and Cash-to-Cash Cycle.",
      "Change your business structure at any time in the Settings page. The Generate wizard also asks about your structure as the first step."
    ]
  },
  {
    icon: Share2,
    title: "Data Sharing & Requests",
    color: "text-pink-600 bg-pink-50 border-pink-100",
    content: [
      "Data sharing allows sectors to exchange metrics, demand signals, fulfillment data, and performance indicators. This is the foundation for cross-sector AI intelligence.",
      "To share data: Enable Data Sharing in Settings, then click 'Request to Share Data'. Select the target sector, choose a dataset (Orders, Demand, Inventory, Fulfillment, Shipping Performance, or Custom), and optionally add a message explaining the purpose.",
      "Requests follow a workflow: Pending → Approved or Rejected. Approved requests unlock shared metrics in dashboards and AI analysis. You can view and manage all requests in the Settings page under the Data Sharing section.",
      "Data sharing is most useful with 2+ sectors and is automatically recommended for Partnered and Unified Supply Chain business structures."
    ]
  },
  {
    icon: MessageSquare,
    title: "Hub Settings & Communication",
    color: "text-fuchsia-600 bg-fuchsia-50 border-fuchsia-100",
    content: [
      "The Ops Hub is a centralized command center for real-time alerts, messages, and notifications across your connected sectors. It supports broadcasting updates, tracking issue resolution, and AI-generated insights.",
      "Hub behavior adapts based on your business structure: For Single businesses, only alerts from your sector are shown. For Partnered and Unified structures, the Hub shows cross-sector alerts and supports broadcasting to all connected sectors.",
      "The Hub can be toggled on or off in Settings under Hub Communication. When disabled, the Hub page shows a friendly disabled state with a link to re-enable it in Settings.",
      "The composer sidebar allows you to post updates targeting specific sectors with urgency levels (Low, Medium, High, Critical). Posts are attributed to your role and appear at the top of the feed."
    ]
  },
  {
    icon: CreditCard,
    title: "Plans & Billing",
    color: "text-orange-600 bg-orange-50 border-orange-100",
    content: [
      "Four plans are available: Starter ($79/mo, 1 user, 5 dashboards), Professional ($149/mo, 5 users, unlimited dashboards, AI features), Business ($299/mo, 15 users, API access, priority support), and Enterprise (custom pricing, unlimited users, dedicated support).",
      "All plans include a 14-day free trial. No credit card is required to start. Annual billing provides a 20% discount on all tiers.",
      "Upgrades and downgrades take effect immediately. Prorated charges are applied automatically. Enterprise customers receive custom invoicing.",
    ]
  },
];

function FAQItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border border-slate-200 rounded-2xl bg-white overflow-hidden transition-all">
      <button onClick={() => setOpen(!open)} className="w-full flex items-center justify-between p-5 text-left gap-4 hover:bg-slate-50 transition-colors" data-testid={`faq-toggle-${q.slice(0, 20)}`}>
        <span className="text-sm font-bold text-slate-900">{q}</span>
        {open ? <ChevronUp className="w-4 h-4 text-slate-400 shrink-0" /> : <ChevronDown className="w-4 h-4 text-slate-400 shrink-0" />}
      </button>
      {open && (
        <div className="px-5 pb-5 border-t border-slate-100">
          <p className="text-sm text-slate-600 leading-relaxed pt-4">{a}</p>
        </div>
      )}
    </div>
  );
}

function DocSection({ icon: Icon, title, color, content }: typeof docSections[0]) {
  const [expanded, setExpanded] = useState(false);
  return (
    <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm hover:shadow-md transition-shadow">
      <button onClick={() => setExpanded(!expanded)} className="w-full flex items-center gap-4 p-6 text-left hover:bg-slate-50/50 transition-colors" data-testid={`doc-section-${title.slice(0, 15)}`}>
        <div className={`w-12 h-12 rounded-xl flex items-center justify-center border shrink-0 ${color}`}>
          <Icon className="w-5 h-5" />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="text-base font-black text-slate-900 tracking-tight">{title}</h3>
          <p className="text-xs text-slate-500 mt-0.5 truncate">{content[0].slice(0, 80)}...</p>
        </div>
        {expanded ? <ChevronUp className="w-5 h-5 text-slate-400 shrink-0" /> : <ChevronDown className="w-5 h-5 text-slate-400 shrink-0" />}
      </button>
      {expanded && (
        <div className="px-6 pb-6 border-t border-slate-100 pt-4 space-y-3">
          {content.map((p, i) => (
            <p key={i} className="text-sm text-slate-600 leading-relaxed">{p}</p>
          ))}
        </div>
      )}
    </div>
  );
}

export default function SupportPage() {
  return (
    <MarketingLayout>
      <div className="bg-white">
        <section className="py-20 md:py-28 px-4 md:px-6">
          <div className="max-w-4xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-4 py-2 rounded-full mb-6">
              <Headphones className="w-4 h-4" />
              <span className="text-xs font-black uppercase tracking-widest">Support Center</span>
            </div>
            <h1 className="text-4xl md:text-5xl font-black text-slate-900 tracking-tighter mb-6">How can we help?</h1>
            <p className="text-lg text-slate-500 max-w-2xl mx-auto leading-relaxed">
              Get answers to common questions, browse our platform documentation, or reach our support team for personalized assistance.
            </p>
          </div>
        </section>

        <section className="py-16 px-4 md:px-6 bg-[#F4F7FA]">
          <div className="max-w-5xl mx-auto grid md:grid-cols-3 gap-6">
            {[
              { icon: Mail, title: "Email Support", desc: "Reach our team directly for technical questions or account issues.", action: "support@chaininsideiq.com", color: "text-primary bg-primary/10 border-primary/20" },
              { icon: MessageCircle, title: "Live Chat", desc: "Chat with our AI assistant or connect with a human agent during business hours.", action: "Available 9am-6pm EST", color: "text-indigo-600 bg-indigo-50 border-indigo-100" },
              { icon: BookOpen, title: "Documentation", desc: "Browse our guides, API docs, and video tutorials to get the most out of the platform.", action: "13 Sections Below", color: "text-amber-600 bg-amber-50 border-amber-100" }
            ].map((item, i) => (
              <div key={i} className="bg-white rounded-2xl border border-slate-200 p-8 text-center shadow-sm hover:shadow-md transition-shadow">
                <div className={`w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-5 border ${item.color}`}>
                  <item.icon className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-black text-slate-900 mb-2">{item.title}</h3>
                <p className="text-sm text-slate-500 leading-relaxed mb-4">{item.desc}</p>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">{item.action}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="py-20 px-4 md:px-6">
          <div className="max-w-4xl mx-auto">
            <div className="flex items-center gap-3 mb-8">
              <BookOpen className="w-5 h-5 text-primary" />
              <h2 className="text-2xl font-black text-slate-900 tracking-tight">Platform Documentation</h2>
            </div>
            <div className="space-y-3">
              {docSections.map((section, i) => <DocSection key={i} {...section} />)}
            </div>
          </div>
        </section>

        <section className="py-20 px-4 md:px-6 bg-[#F4F7FA]">
          <div className="max-w-3xl mx-auto">
            <div className="flex items-center gap-3 mb-8">
              <HelpCircle className="w-5 h-5 text-primary" />
              <h2 className="text-2xl font-black text-slate-900 tracking-tight">Frequently Asked Questions</h2>
            </div>
            <div className="space-y-3">
              {faqs.map((faq, i) => <FAQItem key={i} q={faq.q} a={faq.a} />)}
            </div>
          </div>
        </section>

        <section className="py-16 px-4 md:px-6 bg-slate-900 text-white">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-3xl font-black tracking-tighter mb-4">Still need help?</h2>
            <p className="text-slate-400 mb-8 max-w-xl mx-auto">Our team is ready to assist you with custom onboarding, enterprise setup, or any technical questions.</p>
            <div className="flex flex-wrap justify-center gap-4">
              <Link href="/contact">
                <Button className="h-12 px-6 rounded-xl font-black text-xs uppercase tracking-widest shadow-lg shadow-primary/20">
                  <Mail className="w-4 h-4 mr-2" /> Contact Sales
                </Button>
              </Link>
              <Link href="/contact">
                <Button variant="outline" className="h-12 px-6 rounded-xl font-black text-xs uppercase tracking-widest border-slate-700 text-white hover:bg-slate-800 hover:text-white">
                  Request Setup <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </Link>
              <Link href="/builder">
                <Button variant="outline" className="h-12 px-6 rounded-xl font-black text-xs uppercase tracking-widest border-slate-700 text-white hover:bg-slate-800 hover:text-white">
                  <Zap className="w-4 h-4 mr-2" /> Try Demo
                </Button>
              </Link>
            </div>
          </div>
        </section>
      </div>
    </MarketingLayout>
  );
}
