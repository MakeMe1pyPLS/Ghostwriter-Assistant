// The Checkout Session we send to Stripe. A missing tax code made Stripe refuse every checkout
// on accounts with Managed Payments switched on (the default for new accounts).
import { checkoutParams, form, isUnusableCustomer, SAAS_BUSINESS_TAX_CODE } from '../server/services/platform/billing';
let fails = 0;
const ok = (c: boolean, m: string, x?: unknown) => { console.log(c ? 'PASS' : 'FAIL', m, c ? '' : JSON.stringify(x)); if (!c) fails++; };

const tier = { id: 'starter', name: 'Starter', price: 49, priceAnnual: 39 };
const base = { userId: 'u1', customer: 'cus_1', tier, billing: 'monthly' as const, hadTrial: false, base: 'https://www.chaininsideiq.com' };
const enc = (o: Record<string, unknown>) => form(o).toString();
const decode = (o: Record<string, unknown>) => Object.fromEntries(new URLSearchParams(enc(o)).entries());

// Stripe's list of tax codes eligible for Managed Payments includes the SaaS business-use code.
ok(SAAS_BUSINESS_TAX_CODE === 'txcd_10103001', 'uses the SaaS business-use tax code');

const m = decode(checkoutParams(base));
ok(m['line_items[0][price_data][product_data][tax_code]'] === 'txcd_10103001', 'tax code is sent on the product', m);
ok(m['line_items[0][price_data][unit_amount]'] === '4900' && m['line_items[0][price_data][recurring][interval]'] === 'month', 'monthly price is in cents with a month interval', m);
ok(m['subscription_data[trial_period_days]'] === '14', 'first-time customers get the 14-day trial', m);
ok(m['customer'] === 'cus_1' && m['client_reference_id'] === 'u1' && m['mode'] === 'subscription', 'customer, reference and mode are set');
ok(m['metadata[plan_id]'] === 'starter' && m['subscription_data[metadata][user_id]'] === 'u1', 'plan and user ids travel in metadata (the webhook reads them)', m);
ok(m['success_url'] === 'https://www.chaininsideiq.com/checkout/success?session_id={CHECKOUT_SESSION_ID}', 'success url returns to the site', m['success_url']);
ok(m['cancel_url'] === 'https://www.chaininsideiq.com/pricing?plan=starter&billing=monthly', 'cancel url returns to pricing');

const y = decode(checkoutParams({ ...base, billing: 'yearly' }));
ok(y['line_items[0][price_data][unit_amount]'] === String(39 * 12 * 100) && y['line_items[0][price_data][recurring][interval]'] === 'year', 'yearly charges 12 times the discounted monthly price', y);

const again = decode(checkoutParams({ ...base, hadTrial: true }));
ok(!('subscription_data[trial_period_days]' in again), 'no second free trial', again);

// A saved customer id from test mode must not be reused with a live key.
ok(isUnusableCustomer(404, { error: { code: 'resource_missing' } }), 'unknown customer (404) is replaced');
ok(isUnusableCustomer(400, { error: { code: 'resource_missing' } }), 'resource_missing is replaced');
ok(isUnusableCustomer(200, { id: 'cus_1', deleted: true }), 'deleted customer is replaced');
ok(!isUnusableCustomer(200, { id: 'cus_1' }), 'a live customer is kept');
ok(!isUnusableCustomer(500, { error: { message: 'oops' } }), 'a Stripe outage is not mistaken for a missing customer');

if (fails) { console.log(`\nFAILED: ${fails}`); process.exit(1); } else console.log('\nAll checkout checks passed');
