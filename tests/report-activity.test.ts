import { addReportEvent, cleanEvents, summariseReports, countDue, agoText, REPORT_EVENTS_MAX, OPEN_DEBOUNCE_MS, DAY_MS, REPORT_DUE_DAYS, type ReportEvent } from '../shared/report-activity';
let fails = 0;
const ok = (c: boolean, m: string, x?: unknown) => { console.log(c ? 'PASS' : 'FAIL', m, c ? '' : JSON.stringify(x)); if (!c) fails++; };
const NOW = Date.UTC(2026, 10, 5, 12);

// Adding events
let ev: ReportEvent[] = addReportEvent(undefined, 'opened', NOW);
ok(ev.length === 1 && ev[0].kind === 'opened', 'first open is recorded', ev);
ev = addReportEvent(ev, 'opened', NOW + 60_000);
ok(ev.length === 1, 'a refresh within minutes is not a second open', ev);
ev = addReportEvent(ev, 'opened', NOW + OPEN_DEBOUNCE_MS + 1);
ok(ev.length === 2 && ev[0].at > ev[1].at, 'a later open counts, newest first', ev);
ev = addReportEvent(ev, 'printed', NOW + 1000);
ok(ev.some((e) => e.kind === 'printed'), 'print is always recorded (never debounced)');
ev = addReportEvent(ev, 'printed', NOW + 2000);
ok(ev.filter((e) => e.kind === 'printed').length === 2, 'two prints are two events');
let many: ReportEvent[] = [];
for (let i = 0; i < 40; i++) many = addReportEvent(many, 'printed', NOW + i * 1000);
ok(many.length === REPORT_EVENTS_MAX && many[0].at === NOW + 39_000, 'capped at the newest events', many.length);

// Bad stored data
ok(cleanEvents('x').length === 0 && cleanEvents(null).length === 0 && cleanEvents({}).length === 0, 'non-arrays give empty');
ok(cleanEvents([{ at: 'a', kind: 'printed' }, { at: 5, kind: 'sent' }, null, 7, { at: NaN, kind: 'opened' }, { at: 9, kind: 'opened', extra: 'x' }]).length === 1, 'bad entries are dropped');
ok(!('extra' in cleanEvents([{ at: 9, kind: 'opened', extra: 'x' }])[0]), 'unknown fields are not kept');
ok(cleanEvents([{ at: 1, kind: 'opened' }, { at: 3, kind: 'printed' }])[0].at === 3, 'sorted newest first');

// Wording
ok(agoText(NOW, NOW) === 'today' && agoText(NOW - DAY_MS, NOW) === 'yesterday', 'today, yesterday');
ok(agoText(NOW - 5 * DAY_MS, NOW) === '5 days ago' && agoText(NOW - 21 * DAY_MS, NOW) === '3 weeks ago' && agoText(NOW - 120 * DAY_MS, NOW) === '4 months ago', 'days, weeks, months');
ok(agoText(NOW + DAY_MS, NOW) === 'today', 'a clock a little ahead does not print "-1 days ago"');

// Summary and "due"
const old = NOW - 90 * DAY_MS;
let s = summariseReports([], { status: 'Active', createdAt: NOW - 3 * DAY_MS }, NOW);
ok(s.state === 'never' && s.text === 'No report yet', 'a new client with no report is not nagged', s);
s = summariseReports([], { status: 'Active', createdAt: old }, NOW);
ok(s.state === 'due' && s.text === 'No report yet', 'an old active client with no report is due', s);
s = summariseReports([], { status: 'Completed', createdAt: old }, NOW);
ok(s.state === 'never', 'a completed client is never due', s);
s = summariseReports([], { status: 'Paused', createdAt: old }, NOW);
ok(s.state === 'never', 'a paused client is never due', s);
s = summariseReports([{ at: NOW - 2 * DAY_MS, kind: 'printed' }], { status: 'Active', createdAt: old }, NOW);
ok(s.state === 'recent' && s.text === 'Report printed 2 days ago', 'recent print', s);
s = summariseReports([{ at: NOW - (REPORT_DUE_DAYS + 1) * DAY_MS, kind: 'printed' }], { status: 'Active', createdAt: old }, NOW);
ok(s.state === 'due' && s.text.startsWith('Report printed'), 'an old print makes it due', s);
s = summariseReports([{ at: NOW - DAY_MS, kind: 'opened' }], { status: 'Active', createdAt: NOW - 5 * DAY_MS }, NOW);
ok(s.state === 'recent' && s.text === 'Report opened yesterday, not printed', 'opened but not printed is said plainly', s);
s = summariseReports([{ at: NOW - 2 * DAY_MS, kind: 'opened' }, { at: NOW - 40 * DAY_MS, kind: 'printed' }], { status: 'Active', createdAt: old }, NOW);
ok(s.state === 'due', 'opening again does not hide that the last print is old', s);
ok(countDue([{ status: 'Active', createdAt: old }, { status: 'Active', createdAt: NOW }, { status: 'Completed', createdAt: old }], NOW) === 1, 'counts due clients');
ok(summariseReports(undefined, {}, NOW).state === 'never', 'empty client does not throw');

console.log(fails ? `${fails} FAILED` : 'all passed'); process.exit(fails ? 1 : 0);
