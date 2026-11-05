// Guards against made-up "AI" content coming back. Nothing the app shows may look like
// analysis of the customer's business unless it was worked out from their data.
import { readFileSync, existsSync } from 'node:fs';
let fails = 0;
const ok = (c: boolean, m: string, x?: unknown) => { console.log(c ? 'PASS' : 'FAIL', m, c ? '' : JSON.stringify(x)); if (!c) fails++; };
const read = (p: string) => readFileSync(p, 'utf8');

// 1. The files that held canned insights are gone.
ok(!existsSync('client/src/lib/opportunity-risk-engine.ts'), 'canned opportunity/risk engine is removed');
ok(!existsSync('client/src/components/analyst/DashboardInsightBanner.tsx'), 'rotating canned insight banner is removed');

// 2. Known canned sentences must not appear anywhere in client or server code.
const FILES = [
  'client/src/lib/ai-provider.ts', 'client/src/pages/insights.tsx', 'client/src/components/visualizations/WidgetRenderer.tsx',
  'client/src/components/WidgetLibrary.tsx', 'client/src/components/WidgetInspector.tsx', 'server/routes.ts',
];
const CANNED = ['Revenue up 18.4%', 'Cart abandonment rose 3.1%', 'Line C OEE dropped', 'Perfect Order Rate reached 98.4%', 'SECTOR_INSIGHTS', 'DashboardInsightBanner', 'opportunity-risk-engine'];
for (const f of FILES) {
  const s = read(f);
  const hit = CANNED.filter((c) => s.includes(c));
  ok(hit.length === 0, `no canned insight text in ${f}`, hit);
}

// 3. The client provider file only holds the real helper.
const prov = read('client/src/lib/ai-provider.ts');
ok(!/class\s+\w*Provider/.test(prov) && !prov.includes('Math.random'), 'ai-provider has no fake provider or random numbers');
ok(prov.includes('export function flattenAnalystResponse'), 'ai-provider keeps flattenAnalystResponse');

// 4. Server routes that used to return invented numbers now say they are not available.
const routes = read('server/routes.ts');
for (const r of ['/api/ai/insights', '/api/ai/forecast', '/api/ai/recommend-kpis']) {
  const i = routes.indexOf(r);
  const block = i >= 0 ? routes.slice(i, i + 700) : '';
  ok(i >= 0 && /501/.test(block) && !/Math\.random/.test(block), `${r} answers 501, not made-up data`);
}

// 5. Screens that show built-in sample figures say so.
for (const f of ['client/src/pages/dashboard.tsx', 'client/src/pages/builder.tsx', 'client/src/pages/exports.tsx']) {
  ok(read(f).includes('<SampleDataNotice'), `${f} shows the sample-data notice`);
}
const notice = read('client/src/components/SampleDataNotice.tsx');
ok(notice.includes('hasImportedData') && notice.includes('Sample data'), 'notice is driven by whether a file is in use');

if (fails) { console.log(`\nFAILED: ${fails}`); process.exit(1); } else console.log('\nAll honesty checks passed');
