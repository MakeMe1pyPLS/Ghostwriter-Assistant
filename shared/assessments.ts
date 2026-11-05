// Client assessments: the consultant's own checklist of the three reviews they
// run for each client (business performance, operational, go-to-market) and where
// each one stands.
//
// Honest limits, repeated in the app: this is a tracker the consultant fills in.
// Nothing here checks that an assessment was really carried out, and the status is
// never worked out from the client's data. "Ready to start" only says the client has
// numbers uploaded to look at. Private to the consultant; never part of what a
// read-only viewer is shown.
//
// Pure TypeScript with no dependencies.

export type AssessmentKind = 'business' | 'operational' | 'gtm';
export type AssessmentStatus = 'not-started' | 'in-progress' | 'done';

export interface AssessmentRecord {
  kind: AssessmentKind;
  status: AssessmentStatus;
  updatedAt: number;
  completedAt?: number;
  /** yyyy-mm-dd */
  dueDate?: string;
  /** The consultant's own short note on the outcome. */
  summary?: string;
}

export const ASSESSMENT_KINDS: AssessmentKind[] = ['business', 'operational', 'gtm'];
export const ASSESSMENT_STATUSES: AssessmentStatus[] = ['not-started', 'in-progress', 'done'];
export const SUMMARY_MAX = 300;

export const ASSESSMENT_INFO: Record<AssessmentKind, { label: string; what: string; href: string; openLabel: string }> = {
  business: { label: 'Business performance', what: 'Review the headline numbers, health score and plan against the client\'s goal.', href: '/dashboard', openLabel: 'Open dashboard' },
  operational: { label: 'Operational', what: 'Find what slows the client down: bottlenecks, fulfillment and fixes.', href: '/bottlenecks', openLabel: 'Open bottlenecks' },
  gtm: { label: 'Go-to-market', what: 'Review ads, sales pipeline and channels from the client\'s files.', href: '/gtm', openLabel: 'Open go-to-market' },
};
export const STATUS_LABEL: Record<AssessmentStatus, string> = { 'not-started': 'Not started', 'in-progress': 'In progress', done: 'Done' };

const DATE = /^\d{4}-\d{2}-\d{2}$/;
const validDate = (s: unknown): s is string => typeof s === 'string' && DATE.test(s) && !Number.isNaN(Date.parse(s + 'T00:00:00Z'));
const text = (s: unknown) => String(s ?? '').replace(/\s+/g, ' ').trim().slice(0, SUMMARY_MAX);

export const blankAssessment = (kind: AssessmentKind): AssessmentRecord => ({ kind, status: 'not-started', updatedAt: 0 });

/**
 * Always returns exactly one record per kind, in a fixed order. Anything from storage that
 * is not valid falls back to "not started", so a bad record can never hide an assessment.
 */
export function cleanAssessments(raw: unknown): AssessmentRecord[] {
  const list = Array.isArray(raw) ? raw : [];
  return ASSESSMENT_KINDS.map((kind) => {
    const r = list.find((x) => x && typeof x === 'object' && (x as AssessmentRecord).kind === kind) as Partial<AssessmentRecord> | undefined;
    if (!r || !ASSESSMENT_STATUSES.includes(r.status as AssessmentStatus)) return blankAssessment(kind);
    const status = r.status as AssessmentStatus;
    const out: AssessmentRecord = { kind, status, updatedAt: Number.isFinite(r.updatedAt) ? (r.updatedAt as number) : 0 };
    if (status === 'done' && Number.isFinite(r.completedAt)) out.completedAt = r.completedAt;
    if (validDate(r.dueDate) && status !== 'done') out.dueDate = r.dueDate;
    const summary = text(r.summary);
    if (summary) out.summary = summary;
    return out;
  });
}

export interface AssessmentPatch { status?: AssessmentStatus; dueDate?: string | null; summary?: string | null }

/** Change one assessment. Finishing one stamps the time and drops its due date; reopening clears the time. */
export function updateAssessment(list: AssessmentRecord[] | undefined, kind: AssessmentKind, patch: AssessmentPatch, now: number): AssessmentRecord[] {
  return cleanAssessments(list).map((r) => {
    if (r.kind !== kind) return r;
    const next: AssessmentRecord = { ...r, updatedAt: now };
    if (patch.status && ASSESSMENT_STATUSES.includes(patch.status)) {
      next.status = patch.status;
      if (patch.status === 'done') { next.completedAt = r.status === 'done' && r.completedAt ? r.completedAt : now; delete next.dueDate; }
      else delete next.completedAt;
    }
    if (patch.dueDate !== undefined) {
      if (patch.dueDate && validDate(patch.dueDate) && next.status !== 'done') next.dueDate = patch.dueDate;
      else delete next.dueDate;
    }
    if (patch.summary !== undefined) {
      const t = text(patch.summary);
      if (t) next.summary = t; else delete next.summary;
    }
    return next;
  });
}

export interface PendingAssessment { kind: AssessmentKind; label: string; status: 'not-started' | 'in-progress'; overdue: boolean; dueDate?: string }
export interface AssessmentSummary { pending: PendingAssessment[]; done: number; overdue: number; text: string }

const iso = (t: number) => new Date(t).toISOString().slice(0, 10);

/**
 * Pending means not done. Only clients you are working with (Active or Onboarding) are
 * expected to have pending assessments; Paused and Completed clients show none.
 */
export function summariseAssessments(list: AssessmentRecord[] | undefined, status: string | undefined, now: number): AssessmentSummary {
  const all = cleanAssessments(list);
  const done = all.filter((r) => r.status === 'done').length;
  const live = status === 'Active' || status === 'Onboarding';
  const today = iso(now);
  const pending: PendingAssessment[] = live
    ? all.filter((r) => r.status !== 'done').map((r) => ({
      kind: r.kind, label: ASSESSMENT_INFO[r.kind].label, status: r.status as 'not-started' | 'in-progress',
      overdue: !!r.dueDate && r.dueDate < today, dueDate: r.dueDate,
    }))
    : [];
  const overdue = pending.filter((p) => p.overdue).length;
  const textOut = !live ? '' : pending.length === 0 ? 'All 3 assessments done' : `${pending.length} of 3 assessments pending${overdue ? `, ${overdue} overdue` : ''}`;
  return { pending, done, overdue, text: textOut };
}
