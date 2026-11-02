// Stripe sends people here after checkout. Stripe tells our server about the
// new plan separately (the webhook), usually within a few seconds, so this
// page checks a few times before saying it's done.
import { useEffect, useState } from "react";
import { Link } from "wouter";
import { CheckCircle2, ArrowRight, Loader2, Clock } from "lucide-react";
import { MarketingLayout } from "@/components/layout/MarketingLayout";
import { Button } from "@/components/ui/button";
import { useGrowthStore } from "@/hooks/use-growth-store";
import { getAccountStatus, type AccountStatus } from "@/lib/account";
import { getTierById } from "@/lib/pricing";

export default function CheckoutSuccessPage() {
  const onboardingComplete = useGrowthStore((s) => s.onboardingComplete);
  const [status, setStatus] = useState<AccountStatus | null>(null);
  const [gaveUp, setGaveUp] = useState(false);

  useEffect(() => {
    let tries = 0, stop = false;
    const check = async () => {
      try {
        const s = await getAccountStatus();
        if (stop) return;
        if (s.subscription) { setStatus(s); return; }
      } catch { /* try again */ }
      if (++tries < 8 && !stop) setTimeout(check, 2000);
      else if (!stop) setGaveUp(true);
    };
    check();
    return () => { stop = true; };
  }, []);

  const tier = status ? getTierById(status.plan) : undefined;
  const trialing = status?.subscription?.status === "trialing";
  const renews = status?.subscription?.renewsAt ? new Date(status.subscription.renewsAt).toLocaleDateString(undefined, { month: "long", day: "numeric", year: "numeric" }) : null;

  return (
    <MarketingLayout>
      <div className="pt-24 pb-32 px-4 md:px-6 min-h-[70vh] flex flex-col items-center justify-center">
        <div className="max-w-xl w-full mx-auto bg-white rounded-3xl p-8 md:p-12 border border-slate-200 shadow-card text-center">
          {status ? (
            <>
              <div className="w-16 h-16 bg-emerald-50 text-emerald-700 rounded-full flex items-center justify-center mx-auto mb-6">
                <CheckCircle2 className="w-8 h-8" aria-hidden />
              </div>
              <h1 className="text-3xl md:text-4xl font-black text-slate-900 tracking-tight mb-3">You're on {tier?.name ?? "your new plan"}.</h1>
              <p className="text-base text-slate-600 mb-8 max-w-md mx-auto leading-relaxed">
                {trialing
                  ? `Your free trial is running. Your card is first charged on ${renews ?? "the day it ends"}, and you can cancel any time before then from Settings → Billing.`
                  : `Your plan is active${renews ? ` and renews on ${renews}` : ""}. Receipts and invoices are in Settings → Billing.`}
              </p>
            </>
          ) : gaveUp ? (
            <>
              <div className="w-16 h-16 bg-amber-50 text-amber-700 rounded-full flex items-center justify-center mx-auto mb-6">
                <Clock className="w-8 h-8" aria-hidden />
              </div>
              <h1 className="text-3xl font-black text-slate-900 tracking-tight mb-3">Payment received</h1>
              <p className="text-base text-slate-600 mb-8 max-w-md mx-auto leading-relaxed">
                Your plan is still being switched on. It usually takes under a minute. You can keep working; Settings → Billing shows it once it's ready.
              </p>
            </>
          ) : (
            <div role="status" className="py-6">
              <Loader2 className="w-8 h-8 mx-auto text-primary animate-spin" aria-hidden />
              <p className="mt-4 text-base font-semibold text-slate-700">Confirming your plan…</p>
            </div>
          )}

          {(status || gaveUp) && (
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Button className="h-12 px-6 rounded-xl font-bold" data-testid="button-start-onboarding" asChild>
                <Link href={onboardingComplete ? "/plan" : "/onboarding"}>
                  {onboardingComplete ? "Open my workspace" : "Meet your AI Analyst"} <ArrowRight className="w-4 h-4 ml-2" aria-hidden />
                </Link>
              </Button>
              <Button variant="outline" className="h-12 px-6 rounded-xl font-bold" asChild>
                <Link href="/settings#billing">See billing</Link>
              </Button>
            </div>
          )}
        </div>
      </div>
    </MarketingLayout>
  );
}
