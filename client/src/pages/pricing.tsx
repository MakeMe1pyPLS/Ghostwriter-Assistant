import { MarketingLayout } from "@/components/layout/MarketingLayout";
import { Button } from "@/components/ui/button";
import { Link, useLocation } from "wouter";
import { Check, ArrowRight, Sparkles, Loader2 } from "lucide-react";
import { useState } from "react";

export default function PricingPage() {
  const [, setLocation] = useLocation();
  const [isCheckoutLoading, setIsCheckoutLoading] = useState(false);

  const handleCheckout = async () => {
    setIsCheckoutLoading(true);
    
    // Simulate an API call to /api/create-checkout-session
    await new Promise(resolve => setTimeout(resolve, 800));
    
    // Since we are in frontend mockup mode without a FastAPI backend,
    // we redirect to a simulated Stripe Checkout UI to demonstrate the flow.
    setLocation("/checkout/stripe-mock");
  };

  return (
    <MarketingLayout>
      <div className="pt-20 pb-32 px-4 md:px-6">
        <div className="max-w-3xl mx-auto text-center mb-16">
          <h1 className="text-4xl md:text-6xl font-black text-slate-900 tracking-tighter mb-6">Simple, transparent pricing.</h1>
          <p className="text-lg text-slate-500 font-medium">Get the complete AI dashboard generator platform with simple tiering for professional teams.</p>
        </div>

        <div className="max-w-5xl mx-auto grid md:grid-cols-2 gap-8 md:gap-12 items-start mt-8">
          
          {/* Main Pricing Card */}
          <div className="bg-white rounded-[2rem] p-8 md:p-10 border-2 border-primary shadow-2xl shadow-primary/10 relative overflow-visible group mt-4">
            {/* Inner background container to clip glows but let the badge break out */}
            <div className="absolute inset-0 rounded-[2rem] overflow-hidden pointer-events-none">
              <div className="absolute top-0 right-0 w-[300px] h-[300px] bg-primary/5 blur-[80px] rounded-full translate-x-1/2 -translate-y-1/2 group-hover:bg-primary/10 transition-colors duration-500" />
            </div>
            
            <div className="absolute -top-4 right-6 md:right-8 bg-primary text-white px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest flex items-center gap-1.5 shadow-lg shadow-primary/30 z-20 border-2 border-white">
              <Sparkles className="w-3 h-3" />
              Founder Price
            </div>
            
            <div className="mb-8 relative z-10">
              <h2 className="text-2xl font-black text-slate-900 mb-2">ChainInsideIQ Pro</h2>
              <p className="text-sm text-slate-500 font-medium">Everything you need to build and export professional analytics. <span className="text-primary font-bold">Includes a 14-Day Free Trial.</span></p>
            </div>
            
            <div className="mb-8 flex items-end gap-2 relative z-10">
              <span className="text-6xl font-black text-slate-900 tracking-tighter">$79</span>
              <span className="text-slate-500 font-bold mb-2">/month</span>
              <span className="text-sm text-slate-400 line-through mb-2 ml-2">$149</span>
            </div>
            
            <Button 
              onClick={handleCheckout}
              disabled={isCheckoutLoading}
              className="w-full h-14 rounded-2xl font-black uppercase tracking-widest text-sm shadow-xl shadow-primary/20 hover:-translate-y-0.5 transition-all relative z-10"
            >
              {isCheckoutLoading ? (
                <>Processing <Loader2 className="w-5 h-5 ml-2 animate-spin" /></>
              ) : (
                <>Start 14-Day Free Trial <ArrowRight className="w-5 h-5 ml-2" /></>
              )}
            </Button>
            
            <div className="mt-8 space-y-4 relative z-10">
              <h4 className="text-xs font-black text-slate-900 uppercase tracking-widest mb-4">What's included:</h4>
              {[
                "Dashboard Builder",
                "AI Supply Chain Analyst",
                "Forecasting Widgets",
                "Bridge KPIs",
                "Export Engine (Excel, BI, PDF)",
                "Hub + Alerts",
                "Sector-aware widgets",
                "Unlimited data imports"
              ].map((feature, i) => (
                <div key={i} className="flex items-center gap-3">
                  <div className="w-5 h-5 rounded-full bg-emerald-50 flex items-center justify-center shrink-0">
                    <Check className="w-3 h-3 text-emerald-600 font-bold" />
                  </div>
                  <span className="text-sm text-slate-700 font-medium">{feature}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Add-ons & Services */}
          <div className="space-y-6">
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
            </div>
            
            <div className="flex items-center justify-center gap-2 text-xs font-medium text-slate-400 mt-8">
               Questions? <a href="mailto:support@chaininsideiq.com" className="font-bold text-primary hover:underline">Contact Sales</a>
            </div>
          </div>

        </div>
      </div>
    </MarketingLayout>
  );
}
