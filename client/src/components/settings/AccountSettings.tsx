// Settings → Billing, and the "Use your own AI account" panel inside
// Settings → AI engine. Everything here talks to /api (lib/account.ts).
import { useEffect, useState } from "react";
import { Link } from "wouter";
import { CreditCard, Loader2, ExternalLink, KeyRound, ShieldCheck, Trash2, CheckCircle2, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useDashboardStore } from "@/hooks/use-dashboard-store";
import { getTierById } from "@/lib/pricing";
import { cn } from "@/lib/utils";
import {
  getAccountStatus, openBillingPortal, startCheckout, pendingCheckout, clearPendingCheckout,
  listAiKeys, saveAiKey, removeAiKey, KEY_HELP, type AccountStatus, type ConnectedKey, type EngineId,
} from "@/lib/account";
import type { ApiError } from "@/lib/api";

function Shell({ id, icon: Icon, title, children }: { id?: string; icon: any; title: string; children: React.ReactNode }) {
  return (
    <section id={id} className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden scroll-mt-24">
      <div className="px-6 py-4 bg-slate-50 border-b border-slate-100 flex items-center gap-2">
        <Icon className="w-4 h-4 text-slate-500" aria-hidden />
        <h2 className="text-base font-black text-slate-800">{title}</h2>
      </div>
      <div className="p-6 space-y-5">{children}</div>
    </section>
  );
}

/** Loads /api/me/status once. `undefined` while loading, `null` when signed out or the server isn't reachable. */
export function useAccountStatus() {
  const signedIn = useDashboardStore((s) => !!s.currentUser && !s.isDemoMode);
  const [status, setStatus] = useState<AccountStatus | null | undefined>(undefined);
  const [error, setError] = useState<string | null>(null);
  const load = () => {
    if (!signedIn) { setStatus(null); return; }
    getAccountStatus().then((s) => { setStatus(s); setError(null); }, (e: ApiError) => { setStatus(null); setError(e.code === "no_server" ? null : e.message); });
  };
  useEffect(load, [signedIn]);
  return { status, error, signedIn, reload: load };
}

const STATUS_LABEL: Record<string, { text: string; tone: string }> = {
  trialing: { text: "Free trial", tone: "bg-sky-50 text-sky-800 border-sky-200" },
  active: { text: "Active", tone: "bg-emerald-50 text-emerald-800 border-emerald-200" },
  past_due: { text: "Payment failed", tone: "bg-amber-50 text-amber-800 border-amber-200" },
  unpaid: { text: "Unpaid", tone: "bg-rose-50 text-rose-800 border-rose-200" },
  canceled: { text: "Canceled", tone: "bg-slate-100 text-slate-700 border-slate-200" },
  incomplete: { text: "Waiting for payment", tone: "bg-amber-50 text-amber-800 border-amber-200" },
};

const fmtDate = (iso: string | null | undefined) => iso ? new Date(iso).toLocaleDateString(undefined, { month: "long", day: "numeric", year: "numeric" }) : null;

export function BillingSection() {
  const { toast } = useToast();
  const { status, error, signedIn } = useAccountStatus();
  const [busy, setBusy] = useState<"portal" | "checkout" | null>(null);
  const pending = pendingCheckout();

  const portal = async () => {
    setBusy("portal");
    try { window.location.assign(await openBillingPortal()); }
    catch (e) { setBusy(null); toast({ title: "Billing didn't open", description: (e as Error).message, variant: "destructive" }); }
  };
  const resume = async () => {
    if (!pending) return;
    setBusy("checkout");
    const r = await startCheckout(pending.plan, pending.billing);
    if (r.kind === "redirect") { window.location.assign(r.url); return; }
    setBusy(null);
    if (r.kind === "already") clearPendingCheckout();
    toast({ title: r.kind === "not-ready" ? "Card payments open soon" : "Checkout didn't open", description: r.kind === "error" ? r.message : r.kind === "not-ready" ? "You're on the free trial in the meantime." : undefined });
  };

  const sub = status?.subscription;
  const tier = status ? getTierById(status.plan) : undefined;
  const trialEnds = status?.trialStartedAt ? new Date(Date.parse(status.trialStartedAt) + 14 * 86_400_000) : null;
  const trialDaysLeft = trialEnds ? Math.max(0, Math.ceil((trialEnds.getTime() - Date.now()) / 86_400_000)) : null;
  const label = sub ? STATUS_LABEL[sub.status] ?? { text: sub.status, tone: "bg-slate-100 text-slate-700 border-slate-200" } : null;

  return (
    <Shell id="billing" icon={CreditCard} title="Billing">
      {!signedIn ? (
        <p className="text-sm text-slate-600">Sign in to see your plan and billing.</p>
      ) : status === undefined ? (
        <div className="h-16 rounded-xl bg-slate-50 animate-pulse" role="status" aria-label="Loading billing" />
      ) : !status ? (
        <p className="text-sm text-slate-600">{error ?? "Billing isn’t available from this version of the app."}</p>
      ) : (
        <>
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="text-xs font-bold text-slate-500">Your plan</p>
              <p className="text-2xl font-black tracking-tight text-slate-900">{status.plan === "trial" ? "Free trial" : tier?.name ?? status.plan}</p>
              <p className="text-sm text-slate-600 mt-1">
                {sub
                  ? sub.status === "trialing" ? `Trial ends and your card is first charged on ${fmtDate(sub.renewsAt)}.`
                  : sub.status === "canceled" ? "Your subscription has ended. Choose a plan to pick up where you left off."
                  : sub.status === "past_due" ? "Your last payment didn’t go through. Update your card to keep your plan."
                  : `${sub.interval === "yearly" ? "Billed yearly" : "Billed monthly"}. Renews on ${fmtDate(sub.renewsAt)}.`
                  : trialDaysLeft ? `${trialDaysLeft} day${trialDaysLeft === 1 ? "" : "s"} left. No card needed until you choose a plan.`
                  : "Your free trial has ended. Choose a plan to keep using AI answers and premium features."}
              </p>
            </div>
            {label && <span className={cn("inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-bold", label.tone)}>{label.text}</span>}
          </div>

          <div className="rounded-xl border border-slate-200 p-4">
            <div className="flex items-baseline justify-between gap-2">
              <p className="text-sm font-bold text-slate-800">AI answers this month</p>
              <p className="text-sm font-black tabular-nums text-slate-900">{status.usage.used.toLocaleString()}{status.usage.limit !== null ? ` of ${status.usage.limit.toLocaleString()}` : ""}</p>
            </div>
            {status.usage.limit !== null && (
              <div className="mt-2 h-2 rounded-full bg-slate-100 overflow-hidden" role="progressbar" aria-valuemin={0} aria-valuemax={status.usage.limit} aria-valuenow={status.usage.used} aria-label="AI answers used this month">
                <div className={cn("h-full rounded-full", status.usage.used >= status.usage.limit ? "bg-rose-600" : "bg-teal-600")} style={{ width: `${Math.min(100, (status.usage.used / Math.max(1, status.usage.limit)) * 100)}%` }} />
              </div>
            )}
            <p className="mt-2 text-xs text-slate-500">Answers from your own AI key (Settings → AI engine) don’t count. Resets on the 1st.</p>
          </div>

          <div className="flex flex-wrap gap-2">
            {sub && sub.status !== "canceled" ? (
              <Button onClick={portal} disabled={busy !== null} className="rounded-xl font-bold" data-testid="button-manage-billing">
                {busy === "portal" ? <Loader2 className="w-4 h-4 mr-2 animate-spin" aria-hidden /> : <ExternalLink className="w-4 h-4 mr-2" aria-hidden />}
                Manage billing
              </Button>
            ) : pending && status.ready.payments ? (
              <Button onClick={resume} disabled={busy !== null} className="rounded-xl font-bold">
                {busy === "checkout" ? <Loader2 className="w-4 h-4 mr-2 animate-spin" aria-hidden /> : <ArrowRight className="w-4 h-4 mr-2" aria-hidden />}
                Continue to {getTierById(pending.plan)?.name ?? "your plan"} checkout
              </Button>
            ) : (
              <Button asChild className="rounded-xl font-bold"><Link href="/pricing">Choose a plan</Link></Button>
            )}
          </div>
          {sub && sub.status !== "canceled" && <p className="text-xs text-slate-500">Change plan, update your card, download invoices or cancel, on Stripe’s secure page.</p>}
          {!status.ready.payments && <p className="text-xs text-slate-500">Card payments aren’t switched on yet. Your free trial keeps going in the meantime.</p>}
          {status.ready.stripeMode === "test" && <p className="text-xs font-semibold text-amber-700">Test mode: no real cards are charged. Use card 4242 4242 4242 4242.</p>}
        </>
      )}
    </Shell>
  );
}

// ---------------------------------------------------------------- own keys

export function OwnKeysPanel({ onChange }: { onChange?: (keys: ConnectedKey[]) => void }) {
  const { toast } = useToast();
  const signedIn = useDashboardStore((s) => !!s.currentUser && !s.isDemoMode);
  const [keys, setKeys] = useState<ConnectedKey[] | null | undefined>(undefined);
  const [ready, setReady] = useState(true);
  const [open, setOpen] = useState<EngineId | null>(null);
  const [draft, setDraft] = useState({ key: "", model: "" });
  const [busy, setBusy] = useState<EngineId | null>(null);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    if (!signedIn) { setKeys(null); return; }
    listAiKeys().then((r) => { setKeys(r.keys); setReady(r.ready); onChange?.(r.keys); }, () => setKeys(null));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [signedIn]);

  const save = async (id: EngineId) => {
    if (!draft.key.trim()) { setErr("Paste your API key first."); return; }
    setBusy(id); setErr(null);
    try {
      const r = await saveAiKey(id, draft.key.trim(), draft.model.trim() || undefined);
      setKeys(r.keys); onChange?.(r.keys); setOpen(null); setDraft({ key: "", model: "" });
      toast({ title: `${r.keys.find((k) => k.provider === id)?.label} connected`, description: "We tested the key and it works. It’s now used first for your answers." });
    } catch (e) {
      setErr((e as Error).message);
    } finally { setBusy(null); }
  };
  const remove = async (id: EngineId) => {
    setBusy(id);
    try { const r = await removeAiKey(id); setKeys(r.keys); onChange?.(r.keys); toast({ title: "Key removed", description: "Your plan’s included answers are used again." }); }
    catch (e) { toast({ title: "Couldn’t remove the key", description: (e as Error).message, variant: "destructive" }); }
    finally { setBusy(null); }
  };

  return (
    <div className="rounded-xl border border-slate-200">
      <div className="p-4 border-b border-slate-100">
        <p className="flex items-center gap-2 text-sm font-black text-slate-900"><KeyRound className="w-4 h-4 text-primary" aria-hidden /> Use your own AI account</p>
        <p className="mt-1 text-sm text-slate-600">Connect a Claude, ChatGPT or Gemini key and your strategy answers run on your own account. They don’t count toward your plan’s monthly answers; your AI provider bills you for them directly.</p>
      </div>
      {!signedIn ? (
        <p className="p-4 text-sm text-slate-600">Sign in to connect your own key.</p>
      ) : keys === undefined ? (
        <div className="p-4"><div className="h-10 rounded-lg bg-slate-50 animate-pulse" /></div>
      ) : keys === null ? (
        <p className="p-4 text-sm text-slate-600">Connecting your own key needs the ChainInsideIQ server, which this version of the app can’t reach.</p>
      ) : !ready ? (
        <p className="p-4 text-sm text-slate-600">Connecting your own key isn’t switched on yet. Your plan’s included AI answers work in the meantime.</p>
      ) : (
        <ul className="divide-y divide-slate-100">
          {keys.map((k) => (
            <li key={k.provider} className="p-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="min-w-0">
                  <p className="font-bold text-slate-900">{k.label}</p>
                  {k.connected
                    ? <p className="text-sm text-slate-600 flex items-center gap-1.5"><CheckCircle2 className="w-4 h-4 text-emerald-700" aria-hidden /> Your key <span className="font-mono">•••• {k.last4}</span>{k.model ? ` · ${k.model}` : ""}</p>
                    : <p className="text-sm text-slate-500">Not connected · uses your plan’s answers</p>}
                </div>
                {k.connected ? (
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" className="rounded-lg font-bold" onClick={() => { setOpen(k.provider); setDraft({ key: "", model: k.model ?? "" }); setErr(null); }}>Replace</Button>
                    <Button variant="ghost" size="sm" className="rounded-lg font-bold text-rose-700 hover:bg-rose-50" onClick={() => remove(k.provider)} disabled={busy === k.provider} aria-label={`Remove your ${k.label} key`}>
                      {busy === k.provider ? <Loader2 className="w-4 h-4 animate-spin" aria-hidden /> : <Trash2 className="w-4 h-4" aria-hidden />}
                    </Button>
                  </div>
                ) : open !== k.provider && (
                  <Button variant="outline" size="sm" className="rounded-lg font-bold" onClick={() => { setOpen(k.provider); setDraft({ key: "", model: "" }); setErr(null); }} data-testid={`button-connect-${k.provider}`}>Connect</Button>
                )}
              </div>
              {open === k.provider && (
                <form className="mt-3 space-y-3" onSubmit={(e) => { e.preventDefault(); save(k.provider); }}>
                  <div>
                    <Label htmlFor={`key-${k.provider}`} className="text-sm font-bold">{k.label} API key</Label>
                    <Input id={`key-${k.provider}`} type="password" autoComplete="off" spellCheck={false} placeholder={KEY_HELP[k.provider].looksLike}
                      value={draft.key} onChange={(e) => { setDraft({ ...draft, key: e.target.value }); setErr(null); }} aria-invalid={!!err} className="font-mono" />
                    <a href={KEY_HELP[k.provider].url} target="_blank" rel="noreferrer" className="mt-1 inline-flex items-center gap-1 text-xs font-bold text-primary">Get a {k.label} key <ExternalLink className="w-3 h-3" aria-hidden /></a>
                  </div>
                  <div>
                    <Label htmlFor={`model-${k.provider}`} className="text-sm font-bold">Model <span className="font-normal text-slate-500">(optional)</span></Label>
                    <Input id={`model-${k.provider}`} placeholder={k.defaultModel} value={draft.model} onChange={(e) => setDraft({ ...draft, model: e.target.value })} className="font-mono" />
                  </div>
                  {err && <p className="text-sm font-semibold text-rose-700" role="alert">{err}</p>}
                  <div className="flex gap-2">
                    <Button type="submit" size="sm" className="rounded-lg font-bold" disabled={busy === k.provider}>
                      {busy === k.provider ? <><Loader2 className="w-4 h-4 mr-1.5 animate-spin" aria-hidden /> Testing…</> : "Test and save"}
                    </Button>
                    <Button type="button" variant="ghost" size="sm" className="rounded-lg font-bold" onClick={() => { setOpen(null); setErr(null); }}>Cancel</Button>
                  </div>
                </form>
              )}
            </li>
          ))}
        </ul>
      )}
      <p className="px-4 py-3 border-t border-slate-100 text-xs text-slate-500 flex items-start gap-1.5">
        <ShieldCheck className="w-4 h-4 shrink-0 text-slate-500" aria-hidden />
        Keys are tested before saving, encrypted on our server and never shown again. Only your workspace uses them. Remove a key any time.
      </p>
    </div>
  );
}
