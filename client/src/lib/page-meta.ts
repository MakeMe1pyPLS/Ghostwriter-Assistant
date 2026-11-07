// Page titles, descriptions and indexing rules per route, applied in one place
// (see <RouteMeta /> in App.tsx). Marketing pages are indexable; the app and
// account pages are not.
export const SITE_URL = "https://www.chaininsideiq.com";
const BRAND = "ChainInsideIQ";
// What link previews (Slack, X, LinkedIn, iMessage) show for the home page. Matches the tags in index.html.
const SHARE_DESC = "Turn your business data into dashboards, KPIs and next steps.";
const DEFAULT_DESC = "AI business analyst: growth plans, bottleneck detection and partner collaboration for businesses of every size.";

type Meta = { title: string; description?: string; index?: boolean };

const MARKETING: Record<string, Meta> = {
  "/": { title: `${BRAND} — Find the bottleneck. Fix it together.`, description: DEFAULT_DESC, index: true },
  "/features": { title: `Features — ${BRAND}`, description: "Growth plans, bottleneck detection, an AI analyst, partner collabs and exports to Excel, Google Sheets and Power BI.", index: true },
  "/pricing": { title: `Pricing — ${BRAND}`, description: "Simple plans for owner-operators, growing teams, multi-site operators and consultants. 14-day free trial, no credit card.", index: true },
  "/support": { title: `Support — ${BRAND}`, description: "Help with setup, data imports, exports and your account.", index: true },
  "/contact": { title: `Contact — ${BRAND}`, description: "Talk to the ChainInsideIQ team about onboarding, enterprise setup or a demo.", index: true },
  "/request-setup": { title: `Request setup — ${BRAND}`, description: "Get help setting up ChainInsideIQ for your business.", index: true },
  "/privacy": { title: `Privacy policy — ${BRAND}`, description: "How ChainInsideIQ collects, uses and protects your data.", index: true },
  "/terms": { title: `Terms of service — ${BRAND}`, index: true },
  "/demo": { title: `Live demo — ${BRAND}`, description: "Explore ChainInsideIQ with sample data, no account needed.", index: true },
  "/sign-in": { title: `Sign in — ${BRAND}` },
  "/sign-up": { title: `Start your free trial — ${BRAND}`, description: "Create your account and get a step-by-step growth plan in about two minutes.", index: true },
};

const APP: Record<string, string> = {
  "/plan": "Growth Plan", "/app": "Growth Plan", "/onboarding": "AI interview", "/welcome": "AI interview",
  "/dashboard": "Dashboard", "/builder": "Builder", "/insights": "AI Analyst", "/bottlenecks": "Bottlenecks",
  "/recommendations": "Recommendations", "/pipeline": "Pipeline", "/hub": "Hub", "/collabs": "Collabs",
  "/kpis": "KPI Library", "/fulfillment": "Fulfillment", "/gtm": "Go-to-market", "/design": "Design system", "/consult": "AI Consultant", "/clients": "Clients", "/shared": "Shared with you", "/connectors": "Connectors",
  "/exports": "Exports", "/data": "Data sources", "/generate": "Generate a dashboard", "/enhance": "Enhance a dashboard",
  "/settings": "Settings", "/verify-email": "Verify your email", "/reset-password": "Reset password",
  "/checkout/success": "You're in", "/checkout/cancel": "Checkout cancelled",
};

export function metaFor(path: string): Meta {
  if (MARKETING[path]) return MARKETING[path];
  const base = "/" + (path.split("/")[1] ?? "");
  const name = APP[path] ?? APP[base] ?? (path.startsWith("/clients/") ? "Client report" : path.startsWith("/shared/") ? "Shared workspace" : path.startsWith("/consult/") ? "AI Consultant" : null);
  return { title: name ? `${name} · ${BRAND}` : BRAND, index: false };
}

function setMeta(selector: string, create: () => HTMLElement, attr: string, value: string | null) {
  let el = document.head.querySelector<HTMLElement>(selector);
  if (value === null) { el?.remove(); return; }
  if (!el) { el = create(); document.head.appendChild(el); }
  el.setAttribute(attr, value);
}

export function applyMeta(path: string) {
  const m = metaFor(path);
  document.title = m.title;
  const desc = m.description ?? DEFAULT_DESC;
  setMeta('meta[name="description"]', () => Object.assign(document.createElement("meta"), { name: "description" }), "content", desc);
  const home = path === "/";
  const og = (name: string) => () => { const e = document.createElement("meta"); e.setAttribute("property", name); return e; };
  setMeta('meta[property="og:title"]', og("og:title"), "content", home ? BRAND : m.title);
  setMeta('meta[property="og:description"]', og("og:description"), "content", home ? SHARE_DESC : desc);
  setMeta('meta[property="og:url"]', og("og:url"), "content", m.index ? SITE_URL + (home ? "" : path) : SITE_URL);
  setMeta('meta[name="robots"]', () => Object.assign(document.createElement("meta"), { name: "robots" }), "content", m.index ? null : "noindex");
  setMeta('link[rel="canonical"]', () => Object.assign(document.createElement("link"), { rel: "canonical" }), "href", m.index ? SITE_URL + (path === "/" ? "/" : path) : null);
}
