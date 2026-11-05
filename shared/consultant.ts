// Consultant overview: one summary per client and a roll-up across clients, so a
// consultant can see who needs attention and whether the fixes are moving numbers.
//
// Inputs are plain data (actions, the client's uploaded rows), so this is easy to
// test. Every number comes from the client's own uploaded file or action board.
// Nothing here mixes one client's data with another's: each summary is built from
// that one client's workspace only, and the roll-up only counts and lists them.
//
// Pure TypeScript with no dependencies.
import { calculateKpis, type Row } from './kpi-engine';
import { compareOutcome, type InsightBaseline } from './insight';
import { summariseAssessments, type AssessmentRecord } from './assessments';

const DAY = 86400000;

export interface ClientAction {
  id: string;
  title: string;
  status: 'todo' | 'doing' | 'done';
  dueDate?: string;
  createdAt: number;
  completedAt?: number;
  baseline?: InsightBaseline;
}

export interface ClientInput {
  id: string;
  name: string;
  status: 'Onboarding' | 'Active' | 'Paused' | 'Completed';
  nextReview?: string;
  actions: ClientAction[];
  /** The file we summarise: the client's active file, or its newest if none is chosen. */
  dataset?: { name: string; rows: Row[]; headers?: string[]; rowCount: number };
  /** Latest time anything happened in this workspace (ms). */
  lastActivity?: number;
  /** The consultant's own assessment checklist for this client. */
  assessments?: AssessmentRecord[];
}

export type OutcomeState = 'improved' | 'worse' | 'same' | 'no-data';

export interface ClientOutcome {
  actionId: string;
  actionTitle: string;
  label: string;
  state: OutcomeState;
  message: string;
}

export interface ClientKpi { id: string; label: string; display: string; changeText?: string; better?: boolean | null }

export type AttentionKind = 'wrong-way' | 'overdue' | 'review-due' | 'assessment' | 'no-data' | 'quiet';

export interface AttentionItem {
  clientId: string;
  clientName: string;
  kind: AttentionKind;
  /** Lower is more urgent. */
  priority: number;
  text: string;
}

export interface ClientSummary {
  id: string;
  name: string;
  status: ClientInput['status'];
  hasData: boolean;
  datasetName?: string;
  rowsUsed?: number;
  partial?: boolean;
  kpis: ClientKpi[];
  actions: { total: number; done: number; open: number; overdue: number };
  outcomes: { improved: number; worse: number; same: number; noData: number; items: ClientOutcome[] };
  attention: AttentionItem[];
  /** Assessments not done yet (only counted for Active and Onboarding clients), and how many are past their due date. */
  assessments: { pending: number; overdue: number; done: number };
}

export interface Portfolio {
  clients: number;
  withData: number;
  openActions: number;
  overdueActions: number;
  pendingAssessments: number;
  outcomes: { tracked: number; improved: number; worse: number; same: number; noData: number };
  attention: AttentionItem[];
}

const KPI_ORDER = ['revenue', 'orders', 'gross-margin', 'net-margin', 'roas', 'on-time', 'return-rate', 'conversion'];
const iso = (t: number) => new Date(t).toISOString().slice(0, 10);

export function summariseClient(c: ClientInput, now: number = Date.now()): ClientSummary {
  const today = iso(now);
  const open = c.actions.filter((a) => a.status !== 'done');
  const overdue = open.filter((a) => a.dueDate && a.dueDate < today);

  let run = null as ReturnType<typeof calculateKpis> | null;
  try { run = c.dataset && c.dataset.rows.length ? calculateKpis(c.dataset.rows, c.dataset.headers) : null; } catch { run = null; }

  const kpis: ClientKpi[] = run
    ? KPI_ORDER.map((id) => run!.results.find((r) => r.id === id && r.status === 'ok' && r.display))
      .filter((r): r is NonNullable<typeof r> => !!r)
      .slice(0, 4)
      .map((r) => ({ id: r.id, label: r.label, display: r.display as string, changeText: r.change?.text, better: r.change ? r.change.better : undefined }))
    : [];

  const items: ClientOutcome[] = c.actions.filter((a) => a.baseline).map((a) => {
    const o = compareOutcome(a.baseline!, run);
    const state: OutcomeState = o.status === 'no-new-data' ? 'no-data' : o.better === true ? 'improved' : o.better === false ? 'worse' : 'same';
    return { actionId: a.id, actionTitle: a.title, label: a.baseline!.label, state, message: o.message };
  });
  const count = (s: OutcomeState) => items.filter((i) => i.state === s).length;

  const attention: AttentionItem[] = [];
  const add = (kind: AttentionKind, priority: number, text: string) => attention.push({ clientId: c.id, clientName: c.name, kind, priority, text });
  const live = c.status === 'Active' || c.status === 'Onboarding';

  items.filter((i) => i.state === 'worse').forEach((i) => add('wrong-way', 1, `${i.label} moved the wrong way since "${i.actionTitle}" was started. ${i.message}`));
  if (overdue.length) add('overdue', 2, `${overdue.length} overdue action${overdue.length > 1 ? 's' : ''}.`);
  if (live && c.nextReview && c.nextReview <= iso(now + 7 * DAY)) {
    add('review-due', 3, c.nextReview < today ? `Review was due ${c.nextReview}.` : `Review due ${c.nextReview}.`);
  }
  const asm = summariseAssessments(c.assessments, c.status, now);
  const lateAsm = asm.pending.filter((p) => p.overdue);
  if (lateAsm.length) add('assessment', 4, `${lateAsm.map((p) => p.label).join(', ')} assessment${lateAsm.length > 1 ? 's are' : ' is'} past the due date.`);
  if (c.status === 'Active' && !run) add('no-data', 5, 'No data uploaded yet, so there are no numbers to track.');
  if (c.status === 'Active' && c.lastActivity !== undefined && now - c.lastActivity > 30 * DAY) {
    add('quiet', 6, `No activity for ${Math.floor((now - c.lastActivity) / DAY)} days.`);
  }

  return {
    id: c.id, name: c.name, status: c.status,
    hasData: !!run, datasetName: c.dataset?.name, rowsUsed: run ? c.dataset!.rows.length : undefined,
    partial: !!(run && c.dataset && c.dataset.rowCount > c.dataset.rows.length),
    kpis,
    actions: { total: c.actions.length, done: c.actions.length - open.length, open: open.length, overdue: overdue.length },
    outcomes: { improved: count('improved'), worse: count('worse'), same: count('same'), noData: count('no-data'), items },
    attention,
    assessments: { pending: asm.pending.length, overdue: asm.overdue, done: asm.done },
  };
}

export function rollUp(summaries: ClientSummary[]): Portfolio {
  const sum = (f: (s: ClientSummary) => number) => summaries.reduce((n, s) => n + f(s), 0);
  const improved = sum((s) => s.outcomes.improved), worse = sum((s) => s.outcomes.worse), same = sum((s) => s.outcomes.same), noData = sum((s) => s.outcomes.noData);
  return {
    clients: summaries.length,
    withData: summaries.filter((s) => s.hasData).length,
    openActions: sum((s) => s.actions.open),
    overdueActions: sum((s) => s.actions.overdue),
    pendingAssessments: sum((s) => s.assessments.pending),
    outcomes: { tracked: improved + worse + same + noData, improved, worse, same, noData },
    attention: summaries.flatMap((s) => s.attention).sort((a, b) => a.priority - b.priority || a.clientName.localeCompare(b.clientName)),
  };
}
