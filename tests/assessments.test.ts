import { cleanAssessments, updateAssessment, summariseAssessments, ASSESSMENT_KINDS, SUMMARY_MAX, type AssessmentRecord } from '../shared/assessments';
let fails = 0;
const ok = (c: boolean, m: string, x?: unknown) => { console.log(c ? 'PASS' : 'FAIL', m, c ? '' : JSON.stringify(x)); if (!c) fails++; };
const NOW = Date.UTC(2026, 10, 5, 12);

// Always three records, in order
let l = cleanAssessments(undefined);
ok(l.length === 3 && l.map((r) => r.kind).join() === 'business,operational,gtm' && l.every((r) => r.status === 'not-started'), 'empty input gives three not-started records', l);
ok(cleanAssessments('x').length === 3 && cleanAssessments(null).length === 3 && cleanAssessments({}).length === 3, 'non-arrays are safe');
l = cleanAssessments([{ kind: 'gtm', status: 'done', updatedAt: 5, completedAt: 9 }, { kind: 'nonsense', status: 'done' }, { kind: 'business', status: 'finished' }, null, 7]);
ok(l[2].status === 'done' && l[2].completedAt === 9, 'a valid record is kept', l);
ok(l[0].status === 'not-started' && l[1].status === 'not-started', 'an invalid status or unknown kind falls back to not started (never hides one)', l);
l = cleanAssessments([{ kind: 'business', status: 'in-progress', dueDate: '2026-13-45', summary: 'x'.repeat(900) }]);
ok(!l[0].dueDate, 'an impossible date is dropped', l[0]);
ok(l[0].summary!.length === SUMMARY_MAX, 'long notes are cut', l[0].summary!.length);
l = cleanAssessments([{ kind: 'business', status: 'in-progress', dueDate: 'tomorrow' }]);
ok(!l[0].dueDate, 'a non-date is dropped');
l = cleanAssessments([{ kind: 'business', status: 'done', completedAt: 5, dueDate: '2026-12-01', secret: 'x' }]);
ok(!l[0].dueDate && !('secret' in l[0]), 'a done record keeps no due date and no unknown fields', l[0]);
ok(cleanAssessments([{ kind: 'business', status: 'in-progress', summary: '  a \n\n b  ' }])[0].summary === 'a b', 'note whitespace tidied');
ok(!('summary' in cleanAssessments([{ kind: 'business', status: 'in-progress', summary: '   ' }])[0]), 'a blank note is not stored');

// Updating
l = updateAssessment(undefined, 'operational', { status: 'in-progress', dueDate: '2026-11-20' }, NOW);
ok(l[1].status === 'in-progress' && l[1].dueDate === '2026-11-20' && l[1].updatedAt === NOW && l[0].status === 'not-started' && l[2].status === 'not-started', 'only the chosen assessment changes', l);
l = updateAssessment(l, 'operational', { status: 'done' }, NOW + 1000);
ok(l[1].status === 'done' && l[1].completedAt === NOW + 1000 && !l[1].dueDate, 'finishing stamps the time and drops the due date', l[1]);
l = updateAssessment(l, 'operational', { summary: 'Returns are the main bottleneck.' }, NOW + 5000);
ok(l[1].completedAt === NOW + 1000 && l[1].summary === 'Returns are the main bottleneck.', 'editing a note does not change when it was finished', l[1]);
l = updateAssessment(l, 'operational', { status: 'done' }, NOW + 9000);
ok(l[1].completedAt === NOW + 1000, 'marking done twice keeps the first finish time', l[1]);
l = updateAssessment(l, 'operational', { dueDate: '2026-12-01' }, NOW + 9500);
ok(!l[1].dueDate, 'a done assessment cannot be given a due date', l[1]);
l = updateAssessment(l, 'operational', { status: 'in-progress' }, NOW + 10_000);
ok(l[1].status === 'in-progress' && !l[1].completedAt, 'reopening clears the finish time', l[1]);
l = updateAssessment(l, 'operational', { dueDate: null, summary: null }, NOW + 11_000);
ok(!l[1].dueDate && !l[1].summary, 'null clears the due date and note', l[1]);
l = updateAssessment(l, 'gtm', { status: 'bogus' as any }, NOW);
ok(l[2].status === 'not-started', 'a bad status is ignored');
l = updateAssessment(l, 'nope' as any, { status: 'done' }, NOW);
ok(l.every((r) => r.status !== 'done'), 'an unknown kind changes nothing');

// Summary
let s = summariseAssessments(undefined, 'Active', NOW);
ok(s.pending.length === 3 && s.done === 0 && s.text === '3 of 3 assessments pending', 'a new active client has three pending', s);
s = summariseAssessments(undefined, 'Onboarding', NOW);
ok(s.pending.length === 3, 'onboarding clients are expected to have them');
for (const st of ['Paused', 'Completed', undefined]) { s = summariseAssessments(undefined, st as any, NOW); ok(s.pending.length === 0 && s.text === '', `${st ?? 'no status'}: nothing pending, nothing said`, s); }
let two: AssessmentRecord[] = updateAssessment(undefined, 'business', { status: 'done' }, NOW);
two = updateAssessment(two, 'gtm', { status: 'in-progress', dueDate: '2026-11-01' }, NOW);
s = summariseAssessments(two, 'Active', NOW);
ok(s.pending.length === 2 && s.done === 1 && s.overdue === 1 && s.text === '2 of 3 assessments pending, 1 overdue', 'counts pending, done and overdue', s);
ok(s.pending.find((p) => p.kind === 'gtm')!.overdue && !s.pending.find((p) => p.kind === 'operational')!.overdue, 'only the one past its date is overdue', s.pending);
two = updateAssessment(two, 'gtm', { dueDate: '2026-11-05' }, NOW);
ok(summariseAssessments(two, 'Active', NOW).overdue === 0, 'due today is not overdue');
let all = ASSESSMENT_KINDS.reduce((acc, k) => updateAssessment(acc, k, { status: 'done' }, NOW), undefined as AssessmentRecord[] | undefined);
s = summariseAssessments(all, 'Active', NOW);
ok(s.pending.length === 0 && s.done === 3 && s.text === 'All 3 assessments done', 'all done', s);

console.log(fails ? `${fails} FAILED` : 'all passed'); process.exit(fails ? 1 : 0);
