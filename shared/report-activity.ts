// Reporting activity per client: when the consultant last opened a client's progress
// report and when they last pressed "Print or save PDF". It helps a consultant see
// which clients are due a report.
//
// Honest limits, repeated in the app: "printed" means the print dialog was opened.
// The browser does not tell us whether the person saved or cancelled, and we cannot
// see whether the file was sent to the client. Kept in the consultant's own client
// record only; never part of what a read-only viewer is shown.
//
// Pure TypeScript with no dependencies.

export type ReportEventKind = 'opened' | 'printed';
export interface ReportEvent { at: number; kind: ReportEventKind }

export const REPORT_EVENTS_MAX = 20;
/** Opening the page twice within this window counts once (a refresh is not a new report). */
export const OPEN_DEBOUNCE_MS = 10 * 60_000;
export const DAY_MS = 86_400_000;
/** A client with no report printed for this long is flagged as due. */
export const REPORT_DUE_DAYS = 30;

const isEvent = (e: unknown): e is ReportEvent =>
  !!e && typeof e === 'object' && Number.isFinite((e as ReportEvent).at) && ((e as ReportEvent).kind === 'opened' || (e as ReportEvent).kind === 'printed');

/** Newest first, bad entries dropped, capped. Safe on anything that came from storage. */
export function cleanEvents(raw: unknown): ReportEvent[] {
  if (!Array.isArray(raw)) return [];
  return raw.filter(isEvent).map((e) => ({ at: e.at, kind: e.kind })).sort((a, b) => b.at - a.at).slice(0, REPORT_EVENTS_MAX);
}

/** Add an event. A repeat "opened" inside the debounce window is ignored. */
export function addReportEvent(events: ReportEvent[] | undefined, kind: ReportEventKind, at: number): ReportEvent[] {
  const list = cleanEvents(events);
  if (kind === 'opened') {
    const last = list.find((e) => e.kind === 'opened');
    if (last && at - last.at >= 0 && at - last.at < OPEN_DEBOUNCE_MS) return list;
  }
  return cleanEvents([{ at, kind }, ...list]);
}

export const lastOf = (events: ReportEvent[] | undefined, kind: ReportEventKind): number | undefined =>
  cleanEvents(events).find((e) => e.kind === kind)?.at;

/** "today", "yesterday", "5 days ago", "3 weeks ago", "4 months ago". */
export function agoText(at: number, now: number): string {
  const days = Math.floor((now - at) / DAY_MS);
  if (days <= 0) return 'today';
  if (days === 1) return 'yesterday';
  if (days < 14) return `${days} days ago`;
  if (days < 60) return `${Math.floor(days / 7)} weeks ago`;
  return `${Math.floor(days / 30)} months ago`;
}

export type ReportState = 'never' | 'recent' | 'due';
export interface ReportSummary { state: ReportState; text: string; lastPrintedAt?: number; lastOpenedAt?: number }

/**
 * What to show on a client card. "Due" needs a reason to expect a report: the client
 * is not Completed or Paused, and the last print is older than REPORT_DUE_DAYS (or
 * there has never been one and the client is at least that old).
 */
export function summariseReports(
  events: ReportEvent[] | undefined,
  client: { status?: string; createdAt?: number },
  now: number,
): ReportSummary {
  const lastPrintedAt = lastOf(events, 'printed');
  const lastOpenedAt = lastOf(events, 'opened');
  const expecting = client.status === 'Active' || client.status === 'Onboarding';
  const ageDays = client.createdAt ? (now - client.createdAt) / DAY_MS : 0;

  if (lastPrintedAt !== undefined) {
    const due = expecting && (now - lastPrintedAt) / DAY_MS >= REPORT_DUE_DAYS;
    return { state: due ? 'due' : 'recent', text: `Report printed ${agoText(lastPrintedAt, now)}`, lastPrintedAt, lastOpenedAt };
  }
  if (lastOpenedAt !== undefined) {
    const due = expecting && ageDays >= REPORT_DUE_DAYS;
    return { state: due ? 'due' : 'recent', text: `Report opened ${agoText(lastOpenedAt, now)}, not printed`, lastOpenedAt };
  }
  const due = expecting && ageDays >= REPORT_DUE_DAYS;
  return { state: due ? 'due' : 'never', text: 'No report yet', };
}

/** How many clients are due a report. */
export function countDue(clients: { reportEvents?: ReportEvent[]; status?: string; createdAt?: number }[], now: number): number {
  return clients.filter((c) => summariseReports(c.reportEvents, c, now).state === 'due').length;
}
