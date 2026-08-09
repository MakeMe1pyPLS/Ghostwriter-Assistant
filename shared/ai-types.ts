// Shared operational-intelligence API contract types.
// These shapes cross the client/server network boundary: the server produces
// them (`server/services/ai/operational-intelligence.ts` + the Claude provider)
// and the client consumes them (`client/src/components/analyst/operations-shared.tsx`
// and the operations pages). Defining them once here keeps both sides in lockstep.

export type Severity = "high" | "medium" | "low";

// ---------------------------------------------------------------------------
// Request contract (client -> server)
// ---------------------------------------------------------------------------
// The shapes the client POSTs to the operational-intelligence endpoints
// (`/api/ai/command-center`, `/api/ai/operations-intel`, `/api/ai/chat`).
// Defined once here so the client payload builders, the server Zod validator,
// and the provider method signatures cannot silently drift apart.
export interface CommandCenterMetric {
  label: string;
  value: string;
  trend: string;
  isPositive: boolean;
}

export interface CommandCenterRequest {
  sector: string;
  metrics: CommandCenterMetric[];
  businessStructure?: string;
}

// The AI Analyst answers a free-form question with a consistent operational
// structure (the same shape whether Claude or the rule-based engine responds),
// so the chat never degrades into a generic free-form paragraph.
export interface AnalystChatRequest extends CommandCenterRequest {
  message: string;
}

export interface OperationsIntelItem {
  id: string;
  type: "bottleneck" | "opportunity";
  title: string;
  severity: Severity;
  priorityRank: number; // 1 = highest priority
  affectedWorkflow: string;
  currentState: string;
  issueDetected: string;
  rootCause: string;
  reasoning: string;
  recommendedAction: string;
  actionPlanSteps: string[];
  estimatedImpact: string;
  expectedOutcome: string;
}

export interface OperationsIntelResult {
  items: OperationsIntelItem[];
  generatedBy: "claude" | "rule-based";
}

export interface AnalystBottleneck {
  title: string;
  severity: Severity;
  detail: string;
}

export interface AnalystAction {
  action: string;
  impact: string;
}

export interface AnalystResponse {
  question: string;
  businessSummary: string;
  keyFindings: string[];
  bottlenecks: AnalystBottleneck[];
  rootCause: string;
  recommendedActions: AnalystAction[]; // ordered by operational impact (highest first)
  expectedImpact: string;
  nextSteps: string[];
  generatedBy: "claude" | "rule-based";
}

// Executive Command Center contract. The server computes the deterministic
// health score and narration; the client renders the health ring, executive
// summary, and Top Priorities feed from this exact shape.
export interface TopPriority {
  id: string;
  title: string;
  severity: Severity;
  whatHappened: string;
  whyItMatters: string;
  businessImpact: string;
  recommendedAction: string;
  expectedOutcome: string;
}

export interface HealthPillar {
  pillar: string;
  score: number;
}

export interface CommandCenterResult {
  healthScore: number;
  healthGrade: string;
  healthBreakdown: HealthPillar[];
  executiveSummary: string;
  topPriorities: TopPriority[];
  alerts: { label: string; severity: Severity }[];
  generatedBy: "claude" | "rule-based";
}

// ---------------------------------------------------------------------------
// Compile-time contract guards
// ---------------------------------------------------------------------------
// `Equal`/`Expect` are tsd-style helpers used by the client and server to
// assert that their response builders conform *exactly* to the shapes above.
// If a developer re-introduces a local copy of these types or lets a response
// builder drift, the corresponding `Expect<Equal<...>>` assertion stops
// compiling and `npm run check` (tsc) fails fast.
export type Equal<X, Y> =
  (<T>() => T extends X ? 1 : 2) extends <T>() => T extends Y ? 1 : 2
    ? true
    : false;

export type Expect<T extends true> = T;
