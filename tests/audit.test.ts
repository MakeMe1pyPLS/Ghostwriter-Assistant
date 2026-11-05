import { clean, diffDatasets, diffActions, diffClients, appendEntries, auditCsv, AUDIT_MAX, BULK, type AuditEntry } from '../shared/audit';
let fails = 0;
const ok = (c: boolean, m: string, x?: unknown) => { console.log(c ? 'PASS' : 'FAIL', m, c ? '' : JSON.stringify(x)); if (!c) fails++; };

// Secrets never reach the log.
const secrets = ['sk_live_abcdefghijklmnop1234', 'sk-ant-api03-abcdefghijklmnopqrstuv', 'AIzaSyA1234567890abcdefghijklmnop', 'whsec_abcdefgh12345678', 'Bearer abcdef1234567890abcdef', 'eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiIxMjM0NTY3ODkwIn0.signature'];
for (const s of secrets) ok(!clean(`my key is ${s} ok`).includes(s.slice(5, 20)) && clean(`my key ${s}`).includes('[hidden]'), `scrubs ${s.slice(0, 8)}…`, clean(`my key ${s}`));
ok(clean('  a \n\n b\t c ') === 'a b c', 'collapses whitespace');
ok(clean('x'.repeat(300), 50).length === 50 && clean('x'.repeat(300), 50).endsWith('…'), 'truncates long text');
ok(clean(null) === '' && clean(undefined) === '' && clean({}) === '[object Object]', 'odd values do not throw');

// Datasets
const d = (id: string, name: string, rowCount = 10, archived = false) => ({ id, name, rowCount, archived });
let c = diffDatasets([d('1', 'a.csv')], [d('1', 'a.csv'), d('2', 'sales.csv', 5000)]);
ok(c.length === 1 && c[0].kind === 'data-added' && c[0].summary === 'Added data file "sales.csv" (5,000 rows).', 'data added', c);
c = diffDatasets([d('1', 'a.csv'), d('2', 'b.csv')], [d('1', 'a.csv')]);
ok(c.length === 1 && c[0].kind === 'data-removed' && c[0].summary.includes('b.csv'), 'data removed', c);
c = diffDatasets([d('1', 'a.csv')], [d('1', 'a.csv', 10, true)]);
ok(c.length === 1 && c[0].kind === 'data-archived', 'archived', c);
c = diffDatasets([d('1', 'a.csv', 10, true)], [d('1', 'a.csv')]);
ok(c.length === 1 && c[0].kind === 'data-restored', 'restored', c);
ok(diffDatasets([d('1', 'a.csv')], [d('1', 'a.csv')]).length === 0, 'no change, no entry');
c = diffDatasets([], Array.from({ length: BULK.datasets }, (_, i) => d(String(i), `f${i}`)));
ok(c.length === 1 && c[0].kind === 'bulk', 'bulk load is one entry, not a flood', c);
ok(diffDatasets(undefined, undefined).length === 0 && diffDatasets(null as any, [null as any, d('1', 'x')]).length === 1, 'undefined/null safe');

// Actions
const a = (id: string, title: string, status = 'todo') => ({ id, title, status });
c = diffActions([a('1', 'Call carrier')], [a('1', 'Call carrier', 'done')]);
ok(c.length === 1 && c[0].kind === 'action-status' && c[0].summary === 'Action "Call carrier" changed from todo to done.', 'status change', c);
c = diffActions([], [a('1', 'New thing')]); ok(c[0].kind === 'action-added' && c[0].summary === 'Added action "New thing".', 'action added', c);
c = diffActions([a('1', 'Old')], []); ok(c[0].kind === 'action-removed', 'action removed', c);
c = diffActions([], Array.from({ length: BULK.actions }, (_, i) => a(String(i), `s${i}`)));
ok(c.length === 1 && c[0].kind === 'bulk', 'a 10-step plan is one entry', c);
c = diffActions([], Array.from({ length: BULK.actions - 1 }, (_, i) => a(String(i), `s${i}`)));
ok(c.length === BULK.actions - 1, 'just under the bulk limit lists each', c.length);
c = diffActions([], [a('1', 'Use key sk_live_abcdefghijklmnop1234 here')]);
ok(!c[0].summary.includes('abcdefghijklmnop1234') && c[0].summary.includes('[hidden]'), 'secret in an action title is scrubbed', c);

// Clients
c = diffClients([], [{ id: 'c1', name: 'Alpha' }]); ok(c[0].kind === 'client-added' && c[0].summary === 'Added client "Alpha".', 'client added', c);
c = diffClients([{ id: 'c1', name: 'Alpha' }], []); ok(c[0].kind === 'client-removed', 'client removed', c);

// Log size and order
const mk = (i: number): AuditEntry => ({ id: `e${i}`, at: i, kind: 'export', summary: `s${i}`, workspace: 'w' });
let log: AuditEntry[] = [];
for (let i = 0; i < AUDIT_MAX + 25; i++) log = appendEntries(log, [mk(i)]);
ok(log.length === AUDIT_MAX && log[0].id === `e${AUDIT_MAX + 24}` && log.at(-1)!.id === 'e25', 'keeps the newest 500, newest first', [log.length, log[0].id, log.at(-1)!.id]);

// CSV
const csv = auditCsv([{ id: '1', at: Date.UTC(2026, 10, 5), kind: 'export', summary: '=HYPERLINK("http://x")', workspace: 'My "business"' }]);
ok(csv.split('\n')[0] === 'When,Workspace,Type,What happened', 'csv header');
ok(csv.includes("\"'=HYPERLINK(\"\"http://x\"\")\"") && csv.includes('"My ""business"""'), 'csv: formulas neutralised, quotes escaped', csv);
console.log(fails ? `${fails} FAILED` : 'all passed'); process.exit(fails ? 1 : 0);
