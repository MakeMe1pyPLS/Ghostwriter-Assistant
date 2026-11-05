// Static guard for the sharing migration. The real permission test needs a database
// (supabase/tests/sharing.test.sql); this runs everywhere and catches the easy regressions:
// a table without row-level security, a write policy for browsers, or a function without a pinned search path.
import { readFileSync } from 'node:fs';
const sql = readFileSync(new URL('../supabase/migrations/20261105_share_client_workspaces.sql', import.meta.url), 'utf8');
let fails = 0; const ok = (c: boolean, m: string) => { console.log(c ? 'PASS' : 'FAIL', m); if (!c) fails++; };

const tables = [...sql.matchAll(/create table public\.(\w+)/g)].map((m) => m[1]);
ok(tables.length === 3, `three new tables (${tables.join(', ')})`);
for (const t of tables) ok(new RegExp(`alter table public\\.${t} enable row level security`).test(sql), `${t}: row-level security is on`);

const policies = [...sql.matchAll(/create policy "[^"]+"\s+on public\.(\w+) for (\w+)/g)].map((m) => `${m[1]}:${m[2]}`);
ok(policies.length === 3 && policies.every((p) => p.endsWith(':select')), `only select policies exist (${policies.join(', ')})`);
ok(/revoke all on public\.workspace_members, public\.workspace_invites, public\.audit_log from anon, authenticated/.test(sql), 'browser roles lose every right first');
ok(/grant select on public\.workspace_members, public\.workspace_invites, public\.audit_log to authenticated/.test(sql) && !/grant (insert|update|delete)/i.test(sql), 'browsers are granted select only');

const fns = [...sql.matchAll(/create function public\.(\w+)\(([^)]*)\)([\s\S]*?)\$\$;/g)];
ok(fns.length === 6, `six functions (${fns.map((f) => f[1]).join(', ')})`);
for (const f of fns) ok(/security definer/.test(f[3]) && /set search_path = ''/.test(f[3]), `${f[1]}: security definer with an empty search path`);
ok(/revoke execute on function[\s\S]*from public, anon/.test(sql), 'functions are not callable without signing in');
ok(!/create policy[^;]*on public\.workspaces/.test(sql), 'the workspaces policies are untouched: viewers never read that table');
ok(/email_confirmed_at is not null/.test(sql), 'invites are only accepted for confirmed email addresses');
ok(/a - 'notes'/.test(sql) && !/'integrations'/.test(sql) && !/w\.meta -> 'notes'/.test(sql), 'shared copy leaves out notes and webhook settings');
ok(/role in \('viewer'\)/.test(sql) && !/'editor'/.test(sql), 'the only role is viewer');
console.log(fails ? `${fails} FAILED` : 'all passed'); process.exit(fails ? 1 : 0);
