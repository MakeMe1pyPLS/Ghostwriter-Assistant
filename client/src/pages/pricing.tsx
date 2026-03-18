import { MarketingLayout } from "@/components/layout/MarketingLayout";
import { Button } from "@/components/ui/button";
import { Link, useLocation } from "wouter";
import { Check, ArrowRight, Sparkles, Loader2, Mail } from "lucide-react";
import { useState } from "react";
import { PRICING_TIERS, type PricingTier } from "@/lib/pricing";
import { cn } from "@/lib/utils";

function PricingCard({ tier, onCheckout, checkoutLoading }: { tier: PricingTier; onCheckout: () => void; checkoutLoading: boolean }) {
  const isEnterprise = tier.id === 'enterprise';

  return (
    <div className={cn(
      "relative flex flex-col rounded-[1.5rem] p-7 md:p-8 border-2 transition-all duration-300 group",
      tier.highlighted
        ? "bg-white border-primary shadow-2xl shadow-primary/10 scale-[1.02] z-10"
        : "bg-white border-slate-200 shadow-sm hover:shadow-lg hover:border-slate-300"
    )}>
      {tier.badge && (
        <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 bg-primary text-white px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest flex items-center gap-1.5 shadow-lg shadow-primary/30 z-20 border-2 border-white whitespace-nowrap">
          <Sparkles className="w-3 h-3" />
          {tier.badge}
        </div>
      )}

      {tier.highlighted && (
        <div className="absolute inset-0 rounded-[1.5rem] overflow-hidden pointer-events-none">
          <div className="absolute top-0 right-0 w-[250px] h-[250px] bg-primary/5 blur-[80px] rounded-full translate-x-1/3 -translate-y-1/3 group-hover:bg-primary/10 transition-colors duration-500" />
        </div>
      )}

      <div className="relative z-10 flex flex-col flex-1">
        <div className="mb-5">
          <h3 className="text-lg font-black text-slate-900 uppercase tracking-tight">{tier.name}</h3>
          <p className="text-xs text-slate-500 font-medium mt-1 leading-relaxed">{tier.description}</p>
        </div>

        <div className="mb-6 flex items-end gap-1.5">
          {tier.price !== null ? (
            <>
              <span className="text-4xl md:text-5xl font-black text-slate-900 tracking-tighter">{tier.priceLabel}</span>
              <span className="text-slate-400 font-bold mb-1.5 text-sm">{tier.period}</span>
            </>
          ) : (
            <span className="text-3xl md:text-4xl font-black text-slate-900 tracking-tighter">{tier.priceLabel}</span>
          )}
        </div>

        {tier.trial && (
          <p className="text-[10px] font-black text-primary uppercase tracking-widest mb-5">{tier.trial}</p>
        )}

        {isEnterprise ? (
          <Link href="/contact">
            <Button variant="outline" className="w-full h-12 rounded-xl font-black uppercase tracking-widest text-[10px] border-slate-300 hover:bg-slate-50 transition-all" data-testid={`button-cta-${tier.id}`}>
              <Mail className="w-4 h-4 mr-2" /> {tier.cta}
            </Button>
          </Link>
        ) : (
          <Button
            onClick={onCheckout}
            disabled={checkoutLoading}
            variant={tier.ctaVariant === 'default' ? 'default' : 'outline'}
            className={cn(
              "w-full h-12 rounded-xl font-black uppercase tracking-widest text-[10px] transition-all",
              tier.highlighted
                ? "shadow-xl shadow-primary/20 hover:-translate-y-0.5"
                : "border-slate-300 hover:bg-slate-50"
            )}
            data-testid={`button-cta-${tier.id}`}
          >
            {checkoutLoading ? (
              <>Processing <Loader2 className="w-4 h-4 ml-2 animate-spin" /></>
            ) : (
              <>{tier.cta} <ArrowRight className="w-4 h-4 ml-2" /></>
            )}
          </Button>
        )}

        <div className="mt-7 pt-6 border-t border-slate-100 flex-1">
          <h4 className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-4">What's included</h4>
          <div className="space-y-3">
            {tier.features.map((feature, i) => {
              const isHeader = feature.endsWith(':');
              return (
                <div key={i} className={cn("flex items-start gap-2.5", isHeader && "mt-1")}>
                  {!isHeader && (
                    <div className="w-4.5 h-4.5 rounded-full bg-emerald-50 flex items-center justify-center shrink-0 mt-0.5">
                      <Check className="w-2.5 h-2.5 text-emerald-600" />
                    </div>
                  )}
                  <span className={cn(
                    "text-xs leading-relaxed",
                    isHeader ? "font-black text-primary uppercase tracking-widest text-[10px]" : "text-slate-600 font-medium"
                  )}>{feature}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function PricingPage() {
  const [, setLocation] = useLocation();
  const [isCheckoutLoading, setIsCheckoutLoading] = useState(false);
  const [loadingTier, setLoadingTier] = useState<string | null>(null);

  const handleCheckout = async (tierId: string) => {
    setIsCheckoutLoading(true);
    setLoadingTier(tierId);
    await new Promise(resolve => setTimeout(resolve, 800));
    setLocation(`/checkout/stripe-mock?plan=${tierId}`);
  };

  return (
    <MarketingLayout>
      <div className="pt-20 pb-32 px-4 md:px-6">
        <div className="max-w-3xl mx-auto text-center mb-16">
          <h1 className="text-4xl md:text-6xl font-black text-slate-900 tracking-tighter mb-6" data-testid="text-pricing-title">
            Simple, transparent pricing.
          </h1>
          <p className="text-lg text-slate-500 font-medium max-w-2xl mx-auto">
            Choose the plan that fits your team. All paid plans include a 14-day free trial — no credit card required.
          </p>
        </div>

        <div className="max-w-6xl mx-auto grid sm:grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-5 items-start">
          {PRICING_TIERS.map(tier => (
            <PricingCard
              key={tier.id}
              tier={tier}
              onCheckout={() => handleCheckout(tier.id)}
              checkoutLoading={isCheckoutLoading && loadingTier === tier.id}
            />
          ))}
        </div>

        <div className="max-w-5xl mx-auto mt-20 grid md:grid-cols-2 gap-8">
          <div className="bg-[#F4F7FA] rounded-3xl p-8 border border-slate-200 transition-colors hover:border-slate-300">
            <h3 className="text-lg font-black text-slate-900 mb-6">Expert Services</h3>
            <div className="space-y-6">
              {[
                { name: "Custom Dashboard Build", desc: "Let our experts build your ideal setup.", price: "From $999" },
                { name: "Database Setup", desc: "We'll connect your data warehouse natively.", price: "From $1,499" },
                { name: "KPI Engineering", desc: "Custom bridge metric development.", price: "Custom" }
              ].map((service, i) => (
                <div key={i} className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-4 border-b border-slate-200 last:border-0 last:pb-0">
                  <div>
                    <div className="font-bold text-slate-900 text-sm mb-0.5">{service.name}</div>
                    <div className="text-xs text-slate-500">{service.desc}</div>
                  </div>
                  <div className="text-sm font-black text-slate-900 shrink-0">{service.price}</div>
                </div>
              ))}
            </div>
            <Link href="/contact">
              <Button variant="outline" className="w-full mt-6 h-12 rounded-xl font-bold uppercase tracking-widest text-xs border-slate-300 bg-white hover:bg-slate-50">
                Book Setup
              </Button>
            </Link>
          </div>

          <div className="bg-[#F4F7FA] rounded-3xl p-8 border border-slate-200 transition-colors hover:border-slate-300">
            <h3 className="text-lg font-black text-slate-900 mb-6">Native Add-ons</h3>
            <div className="space-y-4">
              {["Excel AI Add-on", "Power BI AI Add-on", "Tableau AI Add-on", "Google Sheets Add-on"].map((addon, i) => (
                <div key={i} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-slate-300" />
                    <span className="font-bold text-slate-700 text-sm">{addon}</span>
                  </div>
                  <span className="text-xs font-black text-slate-500 bg-slate-100 px-2 py-1 rounded-md">+$29/mo</span>
                </div>
              ))}
            </div>

            <div className="mt-8 pt-6 border-t border-slate-200">
              <p className="text-xs text-slate-500 font-medium leading-relaxed">
                Add-ons are available on Professional plans and above. Contact our team for volume pricing or custom integrations.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-center gap-2 text-xs font-medium text-slate-400 mt-10">
          Questions? <a href="mailto:support@chaininsideiq.com" className="font-bold text-primary hover:underline">Contact Sales</a>
        </div>
      </div>
    </MarketingLayout>
  );
}