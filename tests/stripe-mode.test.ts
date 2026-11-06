// The app shows "Test mode" only for test keys. Restricted keys (rk_) must be recognised too.
import { stripeModeOf } from '../server/services/platform/config';
let fails = 0;
const ok = (c: boolean, m: string, x?: unknown) => { console.log(c ? 'PASS' : 'FAIL', m, c ? '' : JSON.stringify(x)); if (!c) fails++; };
ok(stripeModeOf('sk_live_abc') === 'live', 'standard live key is live');
ok(stripeModeOf('rk_live_abc') === 'live', 'restricted live key is live');
ok(stripeModeOf('sk_test_abc') === 'test', 'standard test key is test');
ok(stripeModeOf('rk_test_abc') === 'test', 'restricted test key is test');
ok(stripeModeOf('') === null, 'no key means no mode');
if (fails) { console.log(`\nFAILED: ${fails}`); process.exit(1); } else console.log('\nAll stripe-mode checks passed');
