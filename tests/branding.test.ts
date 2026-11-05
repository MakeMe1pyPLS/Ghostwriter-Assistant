import { cleanBrand, updateBrand, reportBranding, isSafeLogo, NAME_MAX, LOGO_MAX_CHARS, type Brand } from '../shared/branding';
let fails = 0;
const ok = (c: boolean, m: string, x?: unknown) => { console.log(c ? 'PASS' : 'FAIL', m, c ? '' : JSON.stringify(x)); if (!c) fails++; };
const PNG = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==';

// Logos: only small PNG/JPEG data URLs
ok(isSafeLogo(PNG) && isSafeLogo(PNG.replace('png', 'jpeg')), 'png and jpeg data URLs are accepted');
for (const [n, v] of [['svg', 'data:image/svg+xml;base64,PHN2Zz48L3N2Zz4='], ['gif', 'data:image/gif;base64,R0lGODlhAQABAAAAACw='], ['html', 'data:text/html;base64,PGgxPg=='], ['http', 'https://example.com/logo.png'], ['javascript', 'javascript:alert(1)'], ['quote break', 'data:image/png;base64,AAAA"onerror="x'], ['not base64', 'data:image/png;utf8,<svg>'], ['empty', ''], ['number', 5], ['null', null]] as const) {
  ok(!isSafeLogo(v), `rejects ${n}`);
}
ok(!isSafeLogo('data:image/png;base64,' + 'A'.repeat(LOGO_MAX_CHARS)), 'rejects an oversize logo');

// Cleaning
ok(cleanBrand(undefined) === undefined && cleanBrand('x') === undefined && cleanBrand({}) === undefined && cleanBrand({ hideProduct: false }) === undefined, 'nothing to keep gives undefined');
let b = cleanBrand({ name: '  Rivera   &  Co \n', logo: PNG, hideProduct: true, extra: 'x' }) as Brand;
ok(b.name === 'Rivera & Co' && b.logo === PNG && b.hideProduct === true && !('extra' in b), 'tidies the name, keeps a good logo, drops unknown fields', b);
b = cleanBrand({ name: 'A'.repeat(300), hideProduct: 'yes' }) as Brand;
ok(b.name!.length === NAME_MAX && b.hideProduct === false, 'long name cut; hideProduct must be exactly true');
ok(!('logo' in (cleanBrand({ name: 'X', logo: 'data:image/svg+xml;base64,PHN2Zz48L3N2Zz4=' }) as Brand)), 'a bad saved logo is dropped on load');

// Updating
let u = updateBrand(undefined, { name: 'Rivera Advisory' });
ok(u?.name === 'Rivera Advisory' && u.hideProduct === false, 'first change creates a brand', u);
u = updateBrand(u, { logo: PNG, hideProduct: true });
ok(u?.logo === PNG && u.hideProduct && u.name === 'Rivera Advisory', 'later changes keep the rest', u);
u = updateBrand(u, { logo: 'data:image/svg+xml;base64,PHN2Zz48L3N2Zz4=' });
ok(!u?.logo, 'an unsafe logo is not stored');
u = updateBrand(u, { name: null, hideProduct: false });
ok(u === undefined, 'clearing everything leaves no brand');

// What the report prints
let r = reportBranding(undefined, 'Atom Consulting');
ok(r.preparedBy === 'Atom Consulting' && r.showProductMark && r.footer === 'Prepared by Atom Consulting with ChainInsideIQ. Figures come from the numbers entered in this workspace.', 'no branding: same wording as before', r);
r = reportBranding(undefined, undefined);
ok(r.footer === 'Prepared with ChainInsideIQ. Figures come from the numbers entered in this workspace.', 'no name at all: same wording as before', r.footer);
ok(!/by undefined|by null/.test(r.footer), 'never prints "undefined"', r.footer);
r = reportBranding({ name: 'Rivera Advisory', logo: PNG, hideProduct: true }, 'Atom Consulting');
ok(r.preparedBy === 'Rivera Advisory' && r.logo === PNG && !r.showProductMark && !/ChainInsideIQ/.test(r.footer), 'white-label: your name and logo, no product name', r);
ok(/Figures come from the numbers entered in this workspace\.$/.test(r.footer), 'the sentence about where the figures come from always stays', r.footer);
r = reportBranding({ name: 'Rivera Advisory', hideProduct: false }, 'Atom Consulting');
ok(r.showProductMark && r.footer.startsWith('Prepared by Rivera Advisory with ChainInsideIQ.'), 'your name with our mark shown', r.footer);
r = reportBranding({ hideProduct: true }, undefined);
ok(r.footer.startsWith('Prepared.') && !r.preparedBy, 'hidden mark with no name: neutral wording', r.footer);
console.log(fails ? `${fails} FAILED` : 'all passed'); process.exit(fails ? 1 : 0);
