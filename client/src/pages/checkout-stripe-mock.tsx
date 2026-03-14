import { useState } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2, Lock, ShieldCheck, Zap } from "lucide-react";
import { getTierByName } from "@/lib/pricing";

export default function CheckoutStripeMockPage() {
  const [, setLocation] = useLocation();
  const [isProcessing, setIsProcessing] = useState(false);
  const tier = getTierByName('Professional')!;
  const priceFormatted = `$${tier.price!.toFixed(2)}`;

  const handleSubscribe = (e: React.FormEvent) => {
    e.preventDefault();
    setIsProcessing(true);
    setTimeout(() => {
      setLocation("/checkout/success");
    }, 1500);
  };

  return (
    <div className="min-h-screen bg-[#F4F7FA] flex items-center justify-center p-4 font-sans selection:bg-primary/20">
      <div className="w-full max-w-5xl grid md:grid-cols-2 bg-white rounded-3xl shadow-2xl overflow-hidden min-h-[600px] border border-slate-200">
        {/* Left Side - Order Summary */}
        <div className="bg-slate-900 text-white p-8 md:p-12 flex flex-col justify-between relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-full bg-primary/10 blur-[100px] pointer-events-none" />
          
          <div className="relative z-10">
            <div className="flex items-center gap-2 mb-12 opacity-70">
              <Lock className="w-4 h-4" />
              <span className="text-xs font-black tracking-widest uppercase">Stripe Mock Environment</span>
            </div>
            
            <h2 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-3">Subscribe to</h2>
            <h1 className="text-3xl font-black mb-8 tracking-tight">ChainInsideIQ {tier.name}</h1>
            
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
          </div>
          
          <div className="mt-12 text-xs font-bold text-slate-500 flex items-center gap-2 relative z-10">
            <Zap className="w-3.5 h-3.5 fill-primary text-primary" />
            Simulated Checkout UI
          </div>
        </div>
        
        {/* Right Side - Payment Form */}
        <div className="p-8 md:p-12 bg-white">
          <form onSubmit={handleSubscribe} className="space-y-6">
            <h3 className="text-xl font-black text-slate-900 tracking-tight mb-6">Payment Details</h3>
            
            <div className="space-y-5">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">Email</label>
                <Input required type="email" placeholder="you@company.com" className="h-12 rounded-xl border-slate-200" defaultValue="test@example.com" />
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
                <Input required placeholder="Full name" className="h-12 rounded-xl border-slate-200" defaultValue="Jane Doe" />
              </div>
            </div>

            <Button 
              type="submit" 
              disabled={isProcessing}
              className="w-full h-14 text-sm font-black uppercase tracking-widest bg-primary hover:bg-primary/90 text-white rounded-xl mt-6 shadow-lg shadow-primary/20 transition-all active:scale-[0.98]"
            >
              {isProcessing ? (
                <><Loader2 className="w-5 h-5 mr-2 animate-spin" /> Processing...</>
              ) : (
                "Start 14-Day Free Trial"
              )}
            </Button>
            
            <p className="text-[11px] text-center font-medium text-slate-500 mt-6 px-4 leading-relaxed">
              By confirming your subscription, you allow us to charge you for future payments in accordance with our terms. You can always cancel your subscription.
            </p>
            
            <div className="mt-8 flex items-center justify-center gap-2 text-xs font-bold text-emerald-600 bg-emerald-50 py-2 rounded-lg">
               <ShieldCheck className="w-4 h-4" /> Payments are secure and encrypted.
            </div>
            
            <div className="text-center mt-6">
              <button type="button" onClick={() => setLocation('/checkout/cancel')} className="text-xs font-bold text-slate-400 hover:text-slate-800 transition-colors underline-offset-4 hover:underline">
                Cancel and return to pricing
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
