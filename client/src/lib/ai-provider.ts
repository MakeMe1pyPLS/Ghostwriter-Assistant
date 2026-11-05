// Helpers for showing the AI Analyst's structured answer as plain text.
//
// This file used to hold a "demo" provider with canned insights, a fixed forecast and
// recommended KPIs with made-up current values. All of that was removed: nothing the app
// shows may look like analysis of the customer's business unless it came from their data.

// Flattens the structured AnalystResponse from /api/ai/chat into a readable
// plain-text briefing for legacy string-based chat consumers.
export function flattenAnalystResponse(data: any): string {
  const parts: string[] = [];
  if (data.businessSummary) parts.push(data.businessSummary);
  if (Array.isArray(data.keyFindings) && data.keyFindings.length) {
    parts.push('Key Findings:\n' + data.keyFindings.map((f: string) => `• ${f}`).join('\n'));
  }
  if (Array.isArray(data.bottlenecks) && data.bottlenecks.length) {
    parts.push(
      'Bottlenecks:\n' +
        data.bottlenecks.map((b: any) => `• ${b.title} (${b.severity}) — ${b.detail}`).join('\n')
    );
  }
  if (data.rootCause) parts.push(`Root Cause: ${data.rootCause}`);
  if (Array.isArray(data.recommendedActions) && data.recommendedActions.length) {
    parts.push(
      'Recommended Actions:\n' +
        data.recommendedActions
          .map((a: any, i: number) => `${i + 1}. ${a.action}${a.impact ? ` — ${a.impact}` : ''}`)
          .join('\n')
    );
  }
  if (data.expectedImpact) parts.push(`Expected Impact: ${data.expectedImpact}`);
  if (Array.isArray(data.nextSteps) && data.nextSteps.length) {
    parts.push('Next Steps:\n' + data.nextSteps.map((s: string, i: number) => `${i + 1}. ${s}`).join('\n'));
  }
  return parts.join('\n\n');
}
