// Fulfillment prototype: sample data, a rule-based bottleneck analyst and a load
// estimator for 3PLs and the e-commerce brands they serve. Everything here is
// pure and runs in the browser, so it works with no keys and no server.
//
// All names, orders and numbers are SAMPLE data. The UI says so wherever they show.

export type Niche = "apparel" | "supplements";
export type ZoneId = "receiving" | "pick" | "pack" | "ship" | "returns";
export type Health = "ok" | "watch" | "bottleneck";
export type OrderStatus = "new" | "picking" | "packing" | "ready" | "shipped" | "returns";

export const NICHES: { id: Niche; label: string; blurb: string }[] = [
  { id: "apparel", label: "Apparel", blurb: "Sizes, colors and returns" },
  { id: "supplements", label: "Supplements", blurb: "Lots, expiry dates and subscriptions" },
];

/** Order of the fulfillment flow, left to right. */
export const ZONE_ORDER: ZoneId[] = ["receiving", "pick", "pack", "ship", "returns"];

const ZONE_INFO: Record<ZoneId, { name: string; what: string; unit: string; queueLabel: string; dwellTargetHrs: number }> = {
  receiving: { name: "Receiving", what: "Inbound stock is checked in and put away", unit: "deliveries/hr", queueLabel: "deliveries waiting", dwellTargetHrs: 6 },
  pick: { name: "Pick", what: "Items are taken off the shelves for an order", unit: "orders/hr", queueLabel: "orders waiting", dwellTargetHrs: 2 },
  pack: { name: "Pack", what: "Items are boxed, labeled and sealed", unit: "orders/hr", queueLabel: "orders waiting", dwellTargetHrs: 1.5 },
  ship: { name: "Ship", what: "Boxes wait for the carrier pickup", unit: "orders/hr", queueLabel: "orders waiting", dwellTargetHrs: 4 },
  returns: { name: "Returns", what: "Returned items are inspected and restocked or refunded", unit: "returns/hr", queueLabel: "returns waiting", dwellTargetHrs: 24 },
};

// ---------------------------------------------------------------------------
// Sample data
// ---------------------------------------------------------------------------

export interface Client { id: string; name: string; niche: Niche; blurb: string }

export const CLIENTS: Client[] = [
  { id: "a1", name: "Northline Apparel", niche: "apparel", blurb: "Everyday basics" },
  { id: "a2", name: "Moss & Thread", niche: "apparel", blurb: "Outdoor layers" },
  { id: "a3", name: "Kindred Basics", niche: "apparel", blurb: "Kids' clothing" },
  { id: "s1", name: "Vita Ridge", niche: "supplements", blurb: "Daily vitamins" },
  { id: "s2", name: "Daybreak Nutrition", niche: "supplements", blurb: "Protein and greens" },
  { id: "s3", name: "Cedar Labs", niche: "supplements", blurb: "Sleep and focus" },
];

export const clientsFor = (niche: Niche) => CLIENTS.filter((c) => c.niche === niche);

export interface OrderLine { label: string; qty: number; weightLb: number; lot?: string; expiryDays?: number }

export interface Order {
  id: string;
  clientId: string;
  status: OrderStatus;
  lines: OrderLine[];
  hrsInStage: number;
  stageTargetHrs: number;
  late: boolean;
  /** Plain reason when late (what the order is waiting on). */
  waitingOn?: string;
  carrier: string;
  service: string;
  boxIn: [number, number, number];
  weightLb: number;
  dimWeightLb: number;
  billableLb: number;
  /** Returns only. */
  returnReason?: string;
  returnStep?: number;
  /** Shipped only: a sample reference, not a real tracking number. */
  trackingRef?: string;
}

export interface Inbound { id: string; clientId: string; units: number; hrsWaiting: number; what: string }

export interface ZoneStat {
  id: ZoneId;
  name: string;
  what: string;
  unit: string;
  queueLabel: string;
  throughput: number;
  target: number;
  queue: number;
  /** Hours of work already waiting (queue divided by throughput). */
  backlogHrs: number;
  dwellHrs: number;
  dwellTargetHrs: number;
  trend: number[];
  health: Health;
  /** Plain reason shown on the card. */
  reason: string;
}

export interface FulfillmentData {
  niche: Niche;
  orders: Order[];
  inbound: Inbound[];
  zones: ZoneStat[];
}

function rng(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const PLAN: Record<Niche, Record<OrderStatus, number>> = {
  apparel: { new: 6, picking: 10, packing: 8, ready: 7, shipped: 18, returns: 24 },
  supplements: { new: 8, picking: 26, packing: 9, ready: 6, shipped: 16, returns: 4 },
};

// Typical hours an order spends in each stage on a normal day: [min, max].
const NORMAL_HRS: Record<OrderStatus, [number, number]> = {
  new: [0.1, 0.9], picking: [0.3, 1.7], packing: [0.2, 1.2], ready: [0.5, 3.5], shipped: [2, 30], returns: [3, 20],
};
const STAGE_TARGET: Record<OrderStatus, number> = { new: 1, picking: 2, packing: 1.5, ready: 4, shipped: 0, returns: 24 };
// Where each niche's work piles up in the sample (the analyst still finds it from the numbers).
const SLOW_STAGE: Record<Niche, OrderStatus> = { apparel: "returns", supplements: "picking" };

const APPAREL_ITEMS = [
  ["Crew tee", 0.5], ["Fleece hoodie", 1.4], ["Slim chino", 1.1], ["Rain shell", 1.3], ["Wool beanie", 0.3], ["Straight jean", 1.6],
] as const;
const COLORS = ["Black", "Navy", "Sand", "Olive"];
const SIZES = ["XS", "S", "M", "L", "XL"];
const SUPP_ITEMS = [
  ["Magnesium Glycinate 90ct", 0.5, "L24-0381", 41], ["Daily Multi 120ct", 0.7, "L24-0422", 212], ["Whey Protein 2 lb", 2.4, "L24-0307", 88],
  ["Greens Powder 30 srv", 1.2, "L24-0455", 305], ["Sleep Blend 60ct", 0.4, "L24-0290", 27], ["Omega-3 120ct", 0.8, "L24-0399", 150],
] as const;
const CARRIERS: [string, string][] = [["UPS", "Ground"], ["USPS", "Ground Advantage"], ["FedEx", "Home Delivery"], ["UPS", "2nd Day Air"]];
const RETURN_REASONS_APPAREL = ["Too small", "Too large", "Not as pictured", "Defective", "Changed mind"];
const RETURN_REASONS_SUPP = ["Damaged in transit", "Changed mind", "Wrong item"];

const WAIT_REASON: Record<OrderStatus, Record<Niche, string>> = {
  new: { apparel: "Waiting to be released to the floor", supplements: "Waiting for lot assignment" },
  picking: { apparel: "Waiting for a free picker", supplements: "Picker checking lot and expiry on each line" },
  packing: { apparel: "Waiting for a packing station", supplements: "Waiting for a packing station" },
  ready: { apparel: "Waiting for the carrier pickup", supplements: "Waiting for the carrier pickup" },
  shipped: { apparel: "", supplements: "" },
  returns: { apparel: "Waiting to be inspected", supplements: "Waiting to be inspected" },
};

const STATUS_RANK: OrderStatus[] = ["new", "picking", "packing", "ready", "shipped", "returns"];

function buildOrders(niche: Niche): Order[] {
  const rand = rng(niche === "apparel" ? 11 : 29);
  const clients = clientsFor(niche);
  const out: Order[] = [];
  let n = 10400;
  for (const status of STATUS_RANK) {
    const count = PLAN[niche][status];
    for (let i = 0; i < count; i++) {
      const client = clients[Math.floor(rand() * clients.length)];
      const nLines = 1 + Math.floor(rand() * 3);
      const lines: OrderLine[] = [];
      for (let l = 0; l < nLines; l++) {
        const qty = 1 + Math.floor(rand() * 2);
        if (niche === "apparel") {
          const [name, w] = APPAREL_ITEMS[Math.floor(rand() * APPAREL_ITEMS.length)];
          const color = COLORS[Math.floor(rand() * COLORS.length)];
          const size = SIZES[1 + Math.floor(rand() * 4)];
          lines.push({ label: `${name}, ${color} / ${size}`, qty, weightLb: w });
        } else {
          const [name, w, lot, exp] = SUPP_ITEMS[Math.floor(rand() * SUPP_ITEMS.length)];
          lines.push({ label: name, qty, weightLb: w, lot, expiryDays: exp });
        }
      }
      const slow = SLOW_STAGE[niche] === status;
      const [lo, hi] = NORMAL_HRS[status];
      let hrs = lo + rand() * (hi - lo);
      if (slow) hrs = hrs * 1.7 + 0.6;
      hrs = Math.round(hrs * 10) / 10;
      const target = STAGE_TARGET[status];
      const late = target > 0 && hrs > target;
      const weightLb = Math.round((lines.reduce((s, x) => s + x.qty * x.weightLb, 0) + 0.4) * 10) / 10; // + box
      const box: [number, number, number] = niche === "apparel" ? [14, 11, 5 + nLines * 2] : [12, 9, 6 + nLines];
      const dim = Math.round(((box[0] * box[1] * box[2]) / 139) * 10) / 10;
      const [carrier, service] = CARRIERS[Math.floor(rand() * CARRIERS.length)];
      const id = `#${n++}`;
      const o: Order = {
        id, clientId: client.id, status, lines, hrsInStage: hrs, stageTargetHrs: target, late,
        waitingOn: late ? WAIT_REASON[status][niche] : undefined,
        carrier, service, boxIn: box, weightLb, dimWeightLb: dim, billableLb: Math.max(Math.ceil(weightLb), Math.ceil(dim)),
      };
      if (status === "returns") {
        const reasons = niche === "apparel" ? RETURN_REASONS_APPAREL : RETURN_REASONS_SUPP;
        // Apparel returns skew toward size issues, as they do in real life.
        const r = rand();
        o.returnReason = niche === "apparel" ? (r < 0.34 ? reasons[0] : r < 0.58 ? reasons[1] : reasons[2 + Math.floor(rand() * 3)]) : reasons[Math.floor(rand() * reasons.length)];
        o.returnStep = hrs > 8 ? 1 : 2;
      }
      if (status === "shipped") o.trackingRef = `SAMPLE-${id.slice(1)}`;
      out.push(o);
    }
  }
  return out;
}

function buildInbound(niche: Niche): Inbound[] {
  const clients = clientsFor(niche);
  return niche === "apparel"
    ? [
        { id: "IN-2201", clientId: clients[0].id, units: 480, hrsWaiting: 2.5, what: "Spring restock, 6 cartons" },
        { id: "IN-2202", clientId: clients[1].id, units: 220, hrsWaiting: 1.2, what: "Rain shells, 3 cartons" },
        { id: "IN-2203", clientId: clients[2].id, units: 640, hrsWaiting: 0.6, what: "Kids' basics, 1 pallet" },
      ]
    : [
        { id: "IN-3101", clientId: clients[0].id, units: 1200, hrsWaiting: 3.1, what: "Daily Multi, 1 pallet" },
        { id: "IN-3102", clientId: clients[1].id, units: 600, hrsWaiting: 1.4, what: "Whey Protein, 12 cartons" },
        { id: "IN-3103", clientId: clients[2].id, units: 900, hrsWaiting: 0.8, what: "Sleep Blend, 1 pallet" },
      ];
}

// [throughput now, target, 7-day trend of throughput]
const FLOW: Record<Niche, Record<ZoneId, [number, number, number[]]>> = {
  apparel: {
    receiving: [1.8, 2, [1.9, 2, 1.8, 1.9, 1.7, 1.8, 1.8]],
    pick: [11, 12, [12, 12, 11, 12, 11, 11, 11]],
    pack: [8.5, 10, [10, 10, 9, 9, 9, 8.5, 8.5]],
    ship: [15, 15, [15, 15, 14, 15, 15, 15, 15]],
    returns: [3, 8, [6, 6, 5, 4, 4, 3, 3]],
  },
  supplements: {
    receiving: [1.9, 2, [2, 1.9, 1.9, 1.9, 1.9, 1.9, 1.9]],
    pick: [5, 9, [9, 8, 8, 7, 6, 5, 5]],
    pack: [8, 9, [9, 9, 9, 8, 8, 8, 8]],
    ship: [12, 12, [12, 12, 12, 11, 12, 12, 12]],
    returns: [3, 3, [3, 3, 3, 3, 3, 3, 3]],
  },
};

const round1 = (x: number) => Math.round(x * 10) / 10;

function classify(throughput: number, target: number, backlogHrs: number, dwell: number, dwellTarget: number): Health {
  const ratio = throughput / target;
  if (backlogHrs >= 4 && ratio < 0.8) return "bottleneck";
  if (backlogHrs >= 2 || ratio < 0.9 || dwell > dwellTarget * 1.25) return "watch";
  return "ok";
}

function reasonFor(z: Omit<ZoneStat, "reason">): string {
  if (z.health === "bottleneck") return `Doing ${z.throughput}/hr against ${z.target}/hr, with about ${round1(z.backlogHrs)} hours of work already waiting.`;
  if (z.health === "watch") {
    if (z.throughput / z.target < 0.9) return `Running at ${Math.round((z.throughput / z.target) * 100)}% of its target pace.`;
    if (z.backlogHrs >= 2) return `About ${round1(z.backlogHrs)} hours of work is waiting here.`;
    return `Items wait ${round1(z.dwellHrs)} h on average, over the ${z.dwellTargetHrs} h target.`;
  }
  return "On pace, with no real queue.";
}

const cache = new Map<Niche, FulfillmentData>();

export function getFulfillmentData(niche: Niche): FulfillmentData {
  const hit = cache.get(niche);
  if (hit) return hit;
  const orders = buildOrders(niche);
  const inbound = buildInbound(niche);
  const stageFor: Record<Exclude<ZoneId, "receiving">, OrderStatus> = { pick: "picking", pack: "packing", ship: "ready", returns: "returns" };
  const zones: ZoneStat[] = ZONE_ORDER.map((id) => {
    const info = ZONE_INFO[id];
    const [throughput, target, trend] = FLOW[niche][id];
    let queue: number;
    let dwell: number;
    if (id === "receiving") {
      queue = inbound.length;
      dwell = inbound.reduce((s, i) => s + i.hrsWaiting, 0) / Math.max(inbound.length, 1);
    } else {
      const here = orders.filter((o) => o.status === stageFor[id]);
      queue = here.length;
      dwell = here.reduce((s, o) => s + o.hrsInStage, 0) / Math.max(here.length, 1);
    }
    const backlogHrs = queue / Math.max(throughput, 0.1);
    const health = classify(throughput, target, backlogHrs, dwell, info.dwellTargetHrs);
    const base = { id, name: info.name, what: info.what, unit: info.unit, queueLabel: info.queueLabel, throughput, target, queue, backlogHrs, dwellHrs: round1(dwell), dwellTargetHrs: info.dwellTargetHrs, trend, health };
    return { ...base, reason: reasonFor(base) };
  });
  const data = { niche, orders, inbound, zones };
  cache.set(niche, data);
  return data;
}

// ---------------------------------------------------------------------------
// The built-in analyst: finds the bottleneck and says what, why, how and when.
// ---------------------------------------------------------------------------

export interface FulfillmentInsight {
  zoneId: ZoneId | null;
  health: Health;
  headline: string;
  what: string;
  why: string;
  how: string[];
  when: string;
  nextStep: string;
  /** What the numbers behind the answer were. */
  basis: string;
}

const HEALTH_RANK: Record<Health, number> = { ok: 0, watch: 1, bottleneck: 2 };

export function worstZone(zones: ZoneStat[]): ZoneStat | null {
  const bad = zones.filter((z) => z.health !== "ok");
  if (!bad.length) return null;
  return bad.sort((a, b) => HEALTH_RANK[b.health] - HEALTH_RANK[a.health] || b.backlogHrs - a.backlogHrs)[0];
}

export function analyzeFulfillment(data: FulfillmentData, clientId?: string): FulfillmentInsight {
  const z = worstZone(data.zones);
  const { niche } = data;
  const basis = "Built-in analyst on sample data. Real numbers replace this once your orders are connected.";
  if (!z) {
    return {
      zoneId: null, health: "ok", headline: "No bottleneck right now",
      what: "Every stage is close to its target pace and nothing is piling up.",
      why: "Queues are short and orders are moving through each stage in about the time they should.",
      how: ["Keep watching the Pick and Pack queues at the start of each shift.", "Check the weekly trend for any stage drifting below target."],
      when: "Review once a week.", nextStep: "Pick one stage and raise its target pace by 5% next week.", basis,
    };
  }
  const queueTxt = `${z.queue} ${z.queueLabel}`;
  const pace = `${z.throughput}/hr (target ${z.target}/hr)`;
  const stage: Partial<Record<ZoneId, OrderStatus>> = { pick: "picking", pack: "packing", ship: "ready", returns: "returns" };
  const here = data.orders.filter((o) => o.status === stage[z.id]);
  const mine = clientId ? here.filter((o) => o.clientId === clientId) : here;
  const lateHere = here.filter((o) => o.late).length;
  const kind = z.health === "bottleneck" ? "is the bottleneck" : "is the stage to watch";
  const headline = `${z.name} ${kind}`;
  const what = `${z.name} ${kind}: ${queueTxt}, working at ${pace}. That is about ${round1(z.backlogHrs)} hours of work already waiting${lateHere ? `, and ${lateHere} orders are past their time limit` : ""}.`;

  if (clientId) {
    return {
      zoneId: z.id, health: z.health,
      headline: mine.length ? `${mine.length} of your orders are waiting in ${z.name}` : "Your orders are moving",
      what: mine.length
        ? `${mine.length} of your orders are in ${z.name}, the stage holding things up for the whole warehouse right now.`
        : `The warehouse is slowest in ${z.name}, but none of your orders are waiting there.`,
      why: mine.length ? "Your 3PL is short on capacity in that stage, so orders wait their turn. It isn't something wrong with your orders." : "Your orders are in other stages that are keeping pace.",
      how: mine.length ? ["Ask your 3PL when the queue should clear.", "If an order is urgent, flag it to your 3PL contact so it can be moved up."] : ["Nothing to do. Check back tomorrow."],
      when: mine.length ? "Ask today." : "No action needed.",
      nextStep: mine.length ? "Message your 3PL about the oldest waiting order." : "Keep an eye on your late-order count.", basis,
    };
  }

  if (z.id === "pick" && niche === "supplements") {
    const shortDated = here.reduce((s, o) => s + o.lines.filter((l) => (l.expiryDays ?? 999) <= 60).length, 0);
    return {
      zoneId: z.id, health: z.health, headline, what,
      why: `Every supplement line needs a lot and expiry check so the oldest stock ships first (first-expiry, first-out). ${shortDated} lines waiting right now include lots that expire within 60 days, so pickers slow down to find and check them.`,
      how: [
        "Put short-dated lots in a labeled 'ship first' bin near the pack stations.",
        "Assign the lot when the order is released, so pickers don't have to hunt for it.",
        "Move one packer to picking during the afternoon wave until the queue is under 2 hours.",
      ],
      when: "Today: steps 1 and 2. This week: step 3, then check the queue again on Friday.",
      nextStep: "Set up the 'ship first' bin before tomorrow's first wave.", basis,
    };
  }
  if (z.id === "returns" && niche === "apparel") {
    const size = here.filter((o) => o.returnReason === "Too small" || o.returnReason === "Too large").length;
    const pct = here.length ? Math.round((size / here.length) * 100) : 0;
    return {
      zoneId: z.id, health: z.health, headline, what,
      why: `Returns are being checked one by one, so unopened items sit for about ${z.dwellHrs} hours. ${pct}% of waiting returns are size problems, and many of those are fine to put straight back on the shelf.`,
      how: [
        "Open a fast lane: tag-on, unworn items go back to stock after a quick look.",
        "Run two fixed returns blocks a day instead of fitting returns in between orders.",
        "Send each client the size-reason report so they can fix the size guide.",
      ],
      when: "Today: the fast lane. This week: the two blocks and the client report.",
      nextStep: "Pull the unopened returns out of the queue and restock them first.", basis,
    };
  }
  const generic: Record<ZoneId, { why: string; how: string[]; next: string }> = {
    receiving: { why: "Inbound deliveries are waiting to be checked in, so stock isn't available to pick.", how: ["Check in the oldest delivery first.", "Book delivery slots so trucks don't arrive together."], next: "Check in the oldest delivery this morning." },
    pick: { why: "Orders are arriving faster than pickers can clear them.", how: ["Group orders into waves by zone.", "Move one person from Pack to Pick at the peak."], next: "Start a second pick wave after lunch." },
    pack: { why: "Packing stations are the narrowest point, so picked orders wait for a box.", how: ["Pre-stage boxes and labels at each station.", "Add a station for the busiest two hours."], next: "Pre-stage boxes before the next wave." },
    ship: { why: "Boxes are ready but the carrier hasn't collected them.", how: ["Confirm the pickup time with each carrier.", "Stage the boxes by carrier so loading is fast."], next: "Call the carrier to confirm today's pickup." },
    returns: { why: "Returns are arriving faster than they are inspected.", how: ["Sort returns by reason on arrival.", "Restock clean items first."], next: "Clear the oldest returns first." },
  };
  const g = generic[z.id];
  return { zoneId: z.id, health: z.health, headline, what, why: g.why, how: g.how, when: "Today: step 1. This week: step 2.", nextStep: g.next, basis };
}

// ---------------------------------------------------------------------------
// Niche modules: sample stock, returns, lots and subscriptions
// ---------------------------------------------------------------------------

export const LOW_STOCK = 10;

/** Apparel: units on hand for each color and size. */
export const APPAREL_STOCK: { color: string; sizes: Record<string, number> }[] = [
  { color: "Black", sizes: { XS: 14, S: 42, M: 63, L: 38, XL: 9 } },
  { color: "Navy", sizes: { XS: 6, S: 28, M: 31, L: 4, XL: 12 } },
  { color: "Sand", sizes: { XS: 20, S: 17, M: 0, L: 22, XL: 15 } },
  { color: "Olive", sizes: { XS: 8, S: 11, M: 24, L: 19, XL: 0 } },
];
export const APPAREL_SIZES = SIZES;

/** Apparel: returns this month by reason. */
export const APPAREL_RETURNS: { reason: string; count: number }[] = [
  { reason: "Too small", count: 64 },
  { reason: "Too large", count: 41 },
  { reason: "Not as pictured", count: 22 },
  { reason: "Defective", count: 9 },
  { reason: "Changed mind", count: 27 },
];

export interface Lot { sku: string; product: string; lot: string; expiryDays: number; units: number; location: string; hold?: boolean; clientId: string }

/** Supplements: lots on the shelf, listed first-expiry-first-out. */
export const SUPPLEMENT_LOTS: Lot[] = [
  { sku: "SL-60", product: "Sleep Blend 60ct", lot: "L24-0290", expiryDays: 27, units: 340, location: "B-12", clientId: "s3" },
  { sku: "MG-90", product: "Magnesium Glycinate 90ct", lot: "L24-0381", expiryDays: 41, units: 880, location: "A-04", clientId: "s1" },
  { sku: "WP-2", product: "Whey Protein 2 lb", lot: "L24-0307", expiryDays: 88, units: 260, location: "C-02", clientId: "s2" },
  { sku: "O3-120", product: "Omega-3 120ct", lot: "L24-0399", expiryDays: 150, units: 1020, location: "A-09", hold: true, clientId: "s1" },
  { sku: "DM-120", product: "Daily Multi 120ct", lot: "L24-0422", expiryDays: 212, units: 1500, location: "A-01", clientId: "s1" },
  { sku: "GP-30", product: "Greens Powder 30 srv", lot: "L24-0455", expiryDays: 305, units: 610, location: "C-07", clientId: "s2" },
].sort((a, b) => a.expiryDays - b.expiryDays);

export function expiryStatus(days: number, hold?: boolean): { label: string; tone: "danger" | "warning" | "success" | "info" } {
  if (hold) return { label: "On hold", tone: "info" };
  if (days <= 30) return { label: "Ship first", tone: "danger" };
  if (days <= 60) return { label: "Ship soon", tone: "warning" };
  return { label: "OK", tone: "success" };
}

/** Supplements: subscription boxes (autoship) in the next 7 days. */
export const SUBSCRIPTIONS = { active: 1840, next7Days: 428, skipRatePct: 6.2, perDay: [52, 61, 70, 58, 66, 74, 47] };

// ---------------------------------------------------------------------------
// Sharing with a client: the 3PL chooses what each client may see.
// ---------------------------------------------------------------------------

export interface SharePerms { orders: boolean; inventory: boolean; returns: boolean; insight: boolean }
export const DEFAULT_PERMS: SharePerms = { orders: true, inventory: true, returns: true, insight: true };

/** A client only ever gets its own orders. Everything else is filtered the same way. */
export const ordersForClient = (data: FulfillmentData, clientId: string) => data.orders.filter((o) => o.clientId === clientId);

// ---------------------------------------------------------------------------
// Load check: a rough estimate of how full a vehicle is. It is not a load plan.
// ---------------------------------------------------------------------------

export type VehicleId = "cargo-van" | "box-truck" | "trailer-53";
export interface VehiclePreset { id: VehicleId; name: string; maxWeightLb: number; maxVolumeCuFt: number; note: string }

/** Typical figures only. Use the rating on your own vehicle's door label. */
export const VEHICLES: VehiclePreset[] = [
  { id: "cargo-van", name: "Cargo van", maxWeightLb: 3500, maxVolumeCuFt: 280, note: "Typical full-size cargo van" },
  { id: "box-truck", name: "Cutaway box truck", maxWeightLb: 6500, maxVolumeCuFt: 960, note: "Typical 16 ft box on a cutaway chassis" },
  { id: "trailer-53", name: "53' trailer", maxWeightLb: 43000, maxVolumeCuFt: 3800, note: "Typical dry van trailer" },
];

export interface LoadEstimate {
  weightPct: number;
  volumePct: number;
  limiting: "weight" | "volume" | "none";
  status: "empty" | "ok" | "near" | "over";
  message: string;
  roomWeightLb: number;
  roomVolumeCuFt: number;
}

export const NEAR_LIMIT_PCT = 85;

export function estimateLoad(v: { maxWeightLb: number; maxVolumeCuFt: number }, weightLb: number, volumeCuFt: number): LoadEstimate {
  const weightPct = v.maxWeightLb > 0 ? (weightLb / v.maxWeightLb) * 100 : 0;
  const volumePct = v.maxVolumeCuFt > 0 ? (volumeCuFt / v.maxVolumeCuFt) * 100 : 0;
  const top = Math.max(weightPct, volumePct);
  const limiting = top <= 0 ? "none" : weightPct >= volumePct ? "weight" : "volume";
  const status = top <= 0 ? "empty" : top > 100 ? "over" : top >= NEAR_LIMIT_PCT ? "near" : "ok";
  const lim = limiting === "weight" ? "Weight" : "Volume";
  const message =
    status === "empty" ? "Enter a weight and volume, or upload a list, to see how full the vehicle is."
    : status === "over" ? `${lim} is over the limit (${Math.round(top)}%). Remove some freight or use a bigger vehicle before loading.`
    : status === "near" ? `${lim} is the limit and it's ${Math.round(top)}% full. Real loads rarely pack perfectly, so leave some room.`
    : `${lim} would run out first, at ${Math.round(top)}% full. There is room to add more.`;
  return {
    weightPct, volumePct, limiting, status, message,
    roomWeightLb: Math.max(0, Math.round(v.maxWeightLb - weightLb)),
    roomVolumeCuFt: Math.max(0, Math.round((v.maxVolumeCuFt - volumeCuFt) * 10) / 10),
  };
}

// ---- CSV import for the load check ----------------------------------------

export interface LoadRow { line: number; description: string; qty: number; weightLb: number; volumeCuFt: number | null }
export interface LoadIssue { line: number; level: "error" | "warning"; text: string }
export interface LoadImport {
  rows: LoadRow[];
  issues: LoadIssue[];
  /** Which file column was matched to which field (null = not found). */
  mapping: Record<"description" | "qty" | "weight" | "length" | "width" | "height" | "volume", string | null>;
  totalWeightLb: number;
  totalVolumeCuFt: number;
  /** False when some rows had no size, so the volume is a minimum. */
  volumeComplete: boolean;
}

/** Comma, tab or semicolon, whichever the header row uses most. */
export function delimiterOf(text: string): string {
  const first = text.replace(/^﻿/, "").split(/\r?\n/, 1)[0] ?? "";
  return [",", "\t", ";"].map((d) => [d, first.split(d).length] as const).sort((a, b) => b[1] - a[1])[0][0];
}

export function splitCsv(text: string): string[][] {
  const t = text.replace(/^﻿/, "");
  const delim = delimiterOf(t);
  const rows: string[][] = [];
  let row: string[] = [];
  let cell = "";
  let q = false;
  for (let i = 0; i < t.length; i++) {
    const c = t[i];
    if (q) {
      if (c === '"' && t[i + 1] === '"') { cell += '"'; i++; }
      else if (c === '"') q = false;
      else cell += c;
    } else if (c === '"') q = true;
    else if (c === delim) { row.push(cell); cell = ""; }
    else if (c === "\n" || c === "\r") {
      if (c === "\r" && t[i + 1] === "\n") i++;
      row.push(cell); cell = "";
      if (row.some((x) => x.trim() !== "")) rows.push(row);
      row = [];
    } else cell += c;
  }
  row.push(cell);
  if (row.some((x) => x.trim() !== "")) rows.push(row);
  return rows;
}

const SYN: Record<keyof LoadImport["mapping"], RegExp> = {
  description: /^(desc|description|item|name|product|sku|title)/,
  qty: /^(qty|quantity|units|count|pieces|pcs|cartons)/,
  weight: /weight|^wt\b|^lbs?\b|^kgs?\b/,
  length: /^(l\b|len|length)/,
  width: /^(w\b|wid|width)/,
  height: /^(h\b|hei|height)/,
  volume: /volume|cu ?ft|cubic|cbm|m3/,
};

/**
 * Reads a number from a cell. In semicolon files a comma is the decimal mark
 * ("1,5" is 1.5 and "1.250,5" is 1250.5); otherwise commas are thousands
 * separators. An empty cell is "missing" (NaN), not zero.
 */
const num = (s: string | undefined, decimalComma = false) => {
  if (s === undefined) return NaN;
  const t = String(s).trim().replace(/\s/g, "");
  if (t === "") return NaN;
  const v = Number(decimalComma ? t.replace(/\./g, "").replace(",", ".") : t.replace(/,/g, ""));
  return Number.isFinite(v) ? v : NaN;
};

export function parseLoadCsv(text: string): LoadImport {
  const table = splitCsv(text);
  const dc = delimiterOf(text) === ";";
  const empty: LoadImport = { rows: [], issues: [], mapping: { description: null, qty: null, weight: null, length: null, width: null, height: null, volume: null }, totalWeightLb: 0, totalVolumeCuFt: 0, volumeComplete: true };
  if (table.length < 2) return { ...empty, issues: [{ line: 1, level: "error", text: "The file needs a header row and at least one item." }] };
  const headers = table[0].map((h) => h.trim());
  const norm = headers.map((h) => h.toLowerCase());
  const col: Partial<Record<keyof LoadImport["mapping"], number>> = {};
  (Object.keys(SYN) as (keyof typeof SYN)[]).forEach((k) => {
    const i = norm.findIndex((h, idx) => SYN[k].test(h) && !Object.values(col).includes(idx));
    if (i >= 0) col[k] = i;
  });
  const mapping = { ...empty.mapping };
  (Object.keys(col) as (keyof typeof SYN)[]).forEach((k) => { mapping[k] = headers[col[k]!]; });
  const issues: LoadIssue[] = [];
  if (col.weight === undefined) {
    return { ...empty, mapping, issues: [{ line: 1, level: "error", text: "No weight column found. Add a column called Weight (per item)." }] };
  }
  const wHead = norm[col.weight];
  const kg = /\bkg|kilo/.test(wHead);
  const totalWeight = /total/.test(wHead);
  const dimUnit = (k: "length" | "width" | "height") => {
    const h = col[k] === undefined ? "" : norm[col[k]!];
    return /\bcm\b|\(cm\)/.test(h) ? 1 / 2.54 : /\bft\b|\(ft\)|feet/.test(h) ? 12 : /\bm\b|\(m\)/.test(h) ? 39.3701 : 1; // to inches
  };
  const volHead = col.volume === undefined ? "" : norm[col.volume];
  const volToCuFt = /cbm|m3|m³/.test(volHead) ? 35.3147 : 1;
  const rows: LoadRow[] = [];
  for (let r = 1; r < table.length; r++) {
    const cells = table[r];
    const line = r + 1;
    const desc = col.description !== undefined ? (cells[col.description] ?? "").trim() : `Row ${r}`;
    const qtyRaw = col.qty !== undefined ? num(cells[col.qty], dc) : 1;
    const qty = Number.isNaN(qtyRaw) ? NaN : qtyRaw;
    const w = num(cells[col.weight], dc);
    if (Number.isNaN(w)) { issues.push({ line, level: "error", text: `${desc || "Row"}: weight is missing or not a number, so this row was skipped.` }); continue; }
    if (w <= 0) { issues.push({ line, level: "error", text: `${desc || "Row"}: weight must be more than 0, so this row was skipped.` }); continue; }
    if (Number.isNaN(qty) || qty <= 0 || !Number.isInteger(qty)) { issues.push({ line, level: "error", text: `${desc || "Row"}: quantity must be a whole number above 0, so this row was skipped.` }); continue; }
    let wLb = kg ? w * 2.20462 : w;
    if (totalWeight) wLb = wLb / qty;
    if (wLb > 5000) issues.push({ line, level: "warning", text: `${desc || "Row"}: ${Math.round(wLb)} lb for one item is very heavy. Check the unit.` });
    let vol: number | null = null;
    if (col.volume !== undefined && !Number.isNaN(num(cells[col.volume], dc)) && num(cells[col.volume], dc) > 0) {
      vol = num(cells[col.volume], dc) * volToCuFt;
    } else if (col.length !== undefined && col.width !== undefined && col.height !== undefined) {
      const L = num(cells[col.length], dc) * dimUnit("length");
      const W = num(cells[col.width], dc) * dimUnit("width");
      const H = num(cells[col.height], dc) * dimUnit("height");
      if ([L, W, H].every((x) => Number.isFinite(x) && x > 0)) vol = (L * W * H) / 1728;
    }
    if (vol === null) issues.push({ line, level: "warning", text: `${desc || "Row"}: no size, so its volume isn't counted.` });
    rows.push({ line, description: desc || `Row ${r}`, qty, weightLb: wLb, volumeCuFt: vol });
  }
  const totalWeightLb = rows.reduce((s, x) => s + x.weightLb * x.qty, 0);
  const totalVolumeCuFt = rows.reduce((s, x) => s + (x.volumeCuFt ?? 0) * x.qty, 0);
  return {
    rows, issues, mapping,
    totalWeightLb: Math.round(totalWeightLb * 10) / 10,
    totalVolumeCuFt: Math.round(totalVolumeCuFt * 10) / 10,
    volumeComplete: rows.every((x) => x.volumeCuFt !== null),
  };
}

// ---------------------------------------------------------------------------
// Per-client views of the sample stock, returns and subscriptions. In the
// sample the three clients of a niche hold 50%, 30% and 20% of the total, so a
// client only ever sees its own share and the 3PL sees the sum.
// ---------------------------------------------------------------------------

const SHARE = [0.5, 0.3, 0.2];
const shareOf = (clientId: string) => {
  const c = CLIENTS.find((x) => x.id === clientId);
  const idx = c ? clientsFor(c.niche).findIndex((x) => x.id === clientId) : 0;
  return SHARE[Math.max(0, idx)] ?? 0;
};
const scale = (n: number, f: number) => (n === 0 ? 0 : Math.max(0, Math.round(n * f)));

export function apparelStockFor(clientId?: string) {
  const ids = clientId ? [clientId] : clientsFor("apparel").map((c) => c.id);
  return APPAREL_STOCK.map((row) => ({
    color: row.color,
    sizes: Object.fromEntries(SIZES.map((s) => [s, ids.reduce((t, id) => t + scale(row.sizes[s], shareOf(id)), 0)])) as Record<string, number>,
  }));
}

export function apparelReturnsFor(clientId?: string) {
  const ids = clientId ? [clientId] : clientsFor("apparel").map((c) => c.id);
  return APPAREL_RETURNS.map((r) => ({ reason: r.reason, count: ids.reduce((t, id) => t + scale(r.count, shareOf(id)), 0) }));
}

export const lotsFor = (clientId?: string) => (clientId ? SUPPLEMENT_LOTS.filter((l) => l.clientId === clientId) : SUPPLEMENT_LOTS);

export function subscriptionsFor(clientId?: string) {
  const ids = clientId ? [clientId] : clientsFor("supplements").map((c) => c.id);
  const f = ids.reduce((t, id) => t + shareOf(id), 0);
  return {
    active: Math.round(SUBSCRIPTIONS.active * f),
    next7Days: Math.round(SUBSCRIPTIONS.next7Days * f),
    skipRatePct: SUBSCRIPTIONS.skipRatePct,
    perDay: SUBSCRIPTIONS.perDay.map((n) => Math.round(n * f)),
  };
}
