import { useState } from "react";
import { useLocation, useSearch } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2, Lock, ShieldCheck, Zap, Check, ArrowRight, ArrowLeft } from "lucide-react";
import { getTierById, getTierByName } from "@/lib/pricing";
import { useDashboardStore, type PlanTier } from "@/hooks/use-dashboard-store";

const VALID_PAID_PLANS: PlanTier[] = ['starter', 'professional', 'business', 'enterprise'];

export default function CheckoutStripeMockPage() {
  const [, setLocation] = useLocation();
  const search = useSearch();
  const params = new URLSearchParams(search);
  const planId = params.get("plan") || "professional";

  const tier = getTierById(planId) ?? getTierByName("Professional")!;
  const priceFormatted = `$${tier.price!.toFixed(2)}`;

  const currentUser = useDashboardStore(s => s.currentUser);
  const signUp = useDashboardStore(s => s.signUp);
  const setPlan = useDashboardStore(s => s.setPlan);

  const [step, setStep] = useState<"confirm" | "payment">("confirm");
  const [isProcessing, setIsProcessing] = useState(false);

  const handleSubscribe = (e: React.FormEvent) => {
    e.preventDefault();
    setIsProcessing(true);
    const planToApply: PlanTier = (VALID_PAID_PLANS.includes(planId as PlanTier)
      ? (planId as PlanTier)
      : 'professional');
    setTimeout(() => {
      // Ensure a user record exists (mock guest checkout creates a placeholder account).
      if (!currentUser) {
        const form = e.target as HTMLFormElement;
        const emailField = form.elements.namedItem('email') as HTMLInputElement | null;
        const nameField = form.elements.namedItem('cardholderName') as HTMLInputElement | null;
        const email = emailField?.value?.trim() || `guest-${Date.now()}@chaininsideiq.com`;
        const fullName = nameField?.value?.trim() || email.split('@')[0];
        signUp({ fullName, email, password: 'mock' });
      }
      setPlan(planToApply);
      setLocation("/checkout/success");
    }, 1500);
  };

  const mainFeatures = tier.features.filter(f => !f.endsWith(":")).slice(0, 4);

  return (
    <div className="min-h-screen bg-[#F4F7FA] flex items-center justify-center p-4 font-sans selection:bg-primary/20">
      <div className="w-full max-w-5xl grid md:grid-cols-2 bg-white rounded-3xl shadow-2xl overflow-hidden min-h-[600px] border border-slate-200">
        {/* Left Side - Order Summary */}
        <div className="bg-slate-900 text-white p-8 md:p-12 flex flex-col justify-between relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-full bg-primary/10 blur-[100px] pointer-events-none" />

          <div className="relative z-10">
            <div className="flex items-center gap-2 mb-12 opacity-70">
              <Lock className="w-4 h-4" />
              <span className="text-xs font-black tracking-widest uppercase">Secure Checkout</span>
            </div>

            <h2 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-3">Subscribe to</h2>
            <h1 className="text-3xl font-black mb-2 tracking-tight">ChainInsideIQ {tier.name}</h1>

            {tier.badge && (
              <span className="inline-block text-[9px] font-black uppercase tracking-widest bg-primary text-white px-3 py-1 rounded-full mb-6">
                {tier.badge}
              </span>
            )}

            <div className="flex items-baseline gap-2 mb-8 pb-8 border-b border-slate-800">
              <span className="text-5xl font-black tracking-tighter">{priceFormatted}</span>
              <span className="text-sm font-bold text-slate-400">/ month</span>
            </div>

            <ul className="space-y-4 text-sm font-medium text-slate-300">
              <li className="flex justify-between">
                <span>ChainInsideIQ {tier.name}</span>
                <span className="text-white font-bold">{priceFormatted}</span>
              </li>
              <li className="flex justify-between font-bold text-emerald-400">
                <span>14-day free trial</span>
                <span>-{priceFormatted}</span>
              </li>
              <li className="flex justify-between border-t border-slate-800 pt-4 mt-4 text-white text-base font-black tracking-tight">
                <span>Due today</span>
                <span>$0.00</span>
              </li>
            </ul>

            <div className="mt-8 space-y-2.5">
              <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-3">Included in this plan</p>
              {mainFeatures.map((f, i) => (
                <div key={i} className="flex items-start gap-2.5">
                  <div className="w-4 h-4 rounded-full bg-primary/20 flex items-center justify-center shrink-0 mt-0.5">
                    <Check className="w-2.5 h-2.5 text-primary" />
                  </div>
                  <span className="text-xs text-slate-400 leading-snug">{f}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-12 text-xs font-bold text-slate-500 flex items-center gap-2 relative z-10">
            <Zap className="w-3.5 h-3.5 fill-primary text-primary" />
            Simulated Checkout UI
          </div>
        </div>

        {/* Right Side */}
        <div className="p-8 md:p-12 bg-white flex flex-col">
          {step === "confirm" ? (
            <div className="flex flex-col flex-1">
              <h3 className="text-xl font-black text-slate-900 tracking-tight mb-2">Confirm Your Plan</h3>
              <p className="text-sm text-slate-500 font-medium mb-8">Review your selection before entering payment details.</p>

              <div className="bg-[#F4F7FA] rounded-2xl border border-slate-200 p-6 mb-6">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Selected Plan</p>
                    <h4 className="text-2xl font-black text-slate-900 tracking-tight">{tier.name}</h4>
                    <p className="text-xs text-slate-500 font-medium mt-1">{tier.description}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-3xl font-black text-slate-900 tracking-tighter">{priceFormatted}</p>
                    <p className="text-xs text-slate-400 font-medium">per month</p>
                  </div>
                </div>

                {tier.trial && (
                  <div className="bg-emerald-50 border border-emerald-100 rounded-xl px-4 py-3 flex items-center gap-2 text-emerald-700">
                    <Check className="w-4 h-4 shrink-0" />
                    <span className="text-xs font-bold">{tier.trial} — no credit card charged today</span>
                  </div>
                )}
              </div>

              <div className="mb-8">
                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-3">What's included</p>
                <div className="space-y-2.5">
                  {mainFeatures.map((f, i) => (
                    <div key={i} className="flex items-start gap-2.5">
                      <div className="w-4 h-4 rounded-full bg-emerald-50 border border-emerald-100 flex items-center justify-center shrink-0 mt-0.5">
                        <Check className="w-2.5 h-2.5 text-emerald-600" />
                      </div>
                      <span className="text-xs text-slate-600 font-medium leading-snug">{f}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="mt-auto space-y-3">
                <Button
                  onClick={() => setStep("payment")}
                  className="w-full h-14 text-sm font-black uppercase tracking-widest rounded-xl shadow-lg shadow-primary/20 transition-all"
                  data-testid="button-confirm-plan"
                >
                  Confirm & Continue <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
                <button
                  type="button"
                  onClick={() => setLocation("/pricing")}
                  className="w-full text-xs font-bold text-slate-400 hover:text-slate-800 transition-colors flex items-center justify-center gap-1.5 py-2"
                >
                  <ArrowLeft className="w-3.5 h-3.5" /> Change plan
                </button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubscribe} className="space-y-6 flex flex-col flex-1">
              <div>
                <button
                  type="button"
                  onClick={() => setStep("confirm")}
                  className="flex items-center gap-1.5 text-xs font-bold text-slate-400 hover:text-slate-800 transition-colors mb-4"
                >
                  <ArrowLeft className="w-3.5 h-3.5" /> Back to confirmation
                </button>
                <h3 className="text-xl font-black text-slate-900 tracking-tight">Payment Details</h3>
                <p className="text-xs text-slate-500 font-medium mt-1">
                  Subscribing to <strong>{tier.name}</strong> at {priceFormatted}/month
                </p>
              </div>

              <div className="space-y-5">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">Email</label>
                  <Input required name="email" type="email" placeholder="you@company.com" className="h-12 rounded-xl border-slate-200" defaultValue="test@example.com" />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">Card Information</label>
                  <div className="border border-slate-200 rounded-xl overflow-hidden focus-within:border-primary transition-colors shadow-sm">
                    <Input required placeholder="Card number" className="h-12 border-0 rounded-none border-b border-slate-200 focus-visible:ring-0 font-mono text-sm" defaultValue="4242 4242 4242 4242" />
                    <div className="grid grid-cols-2">
                      <Input required placeholder="MM / YY" className="h-12 border-0 rounded-none border-r border-slate-200 focus-visible:ring-0 font-mono text-sm" defaultValue="12/26" />
                      <Input required placeholder="CVC" className="h-12 border-0 rounded-none focus-visible:ring-0 font-mono text-sm" defaultValue="123" />
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">Name on card</label>
                  <Input required name="cardholderName" placeholder="Full name" className="h-12 rounded-xl border-slate-200" defaultValue="Jane Doe" />
                </div>
              </div>

              <div className="mt-auto space-y-4">
                <Button
                  type="submit"
                  disabled={isProcessing}
                  className="w-full h-14 text-sm font-black uppercase tracking-widest bg-primary hover:bg-primary/90 text-white rounded-xl shadow-lg shadow-primary/20 transition-all active:scale-[0.98]"
                  data-testid="button-start-trial"
                >
                  {isProcessing ? (
                    <><Loader2 className="w-5 h-5 mr-2 animate-spin" /> Processing...</>
                  ) : (
                    `Start 14-Day Free Trial`
                  )}
                </Button>

                <p className="text-[11px] text-center font-medium text-slate-500 px-4 leading-relaxed">
                  By confirming, you allow us to charge you for future payments in accordance with our terms. You can always cancel.
                </p>

                <div className="flex items-center justify-center gap-2 text-xs font-bold text-emerald-600 bg-emerald-50 py-2 rounded-lg">
                  <ShieldCheck className="w-4 h-4" /> Payments are secure and encrypted.
                </div>

                <div className="text-center">
                  <button type="button" onClick={() => setLocation('/checkout/cancel')} className="text-xs font-bold text-slate-400 hover:text-slate-800 transition-colors underline-offset-4 hover:underline">
                    Cancel and return to pricing
                  </button>
                </div>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
