import { MarketingLayout } from "@/components/layout/MarketingLayout";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { CheckCircle2, ArrowRight, ShieldCheck } from "lucide-react";

export default function CheckoutSuccessPage() {
  return (
    <MarketingLayout>
      <div className="pt-24 pb-32 px-4 md:px-6 min-h-[70vh] flex flex-col items-center justify-center">
        <div className="max-w-2xl w-full mx-auto bg-white rounded-3xl p-8 md:p-12 border border-slate-200 shadow-2xl shadow-primary/10 text-center relative overflow-hidden">
          {/* Decorative background */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[400px] h-[400px] bg-primary/5 blur-[80px] rounded-full pointer-events-none" />
          
          <div className="relative z-10">
            <div className="w-20 h-20 bg-emerald-50 text-emerald-500 rounded-full flex items-center justify-center mx-auto mb-8 shadow-sm">
              <CheckCircle2 className="w-10 h-10" />
            </div>
            
            <h1 className="text-3xl md:text-5xl font-black text-slate-900 tracking-tighter mb-4">You're all set.</h1>
            <p className="text-lg text-slate-600 font-bold mb-10 max-w-lg mx-auto leading-relaxed">
              Your 14-day free trial has started.
            </p>
            
            <div className="bg-slate-50 rounded-2xl p-6 mb-10 text-left border border-slate-100 flex flex-col items-center justify-center text-center">
               <ShieldCheck className="w-8 h-8 text-primary mb-3" />
               <h3 className="text-sm font-black text-slate-800 mb-1">Payment Method Confirmed</h3>
               <p className="text-xs font-medium text-slate-500">Your card was successfully securely connected through Stripe. You won't be charged until the trial ends.</p>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/builder">
                <Button className="w-full sm:w-auto h-14 px-8 rounded-2xl font-black uppercase tracking-widest text-sm shadow-xl shadow-primary/20 hover:-translate-y-0.5 transition-all">
                  Launch Platform <ArrowRight className="w-5 h-5 ml-2" />
                </Button>
              </Link>
              <Link href="/">
                <Button variant="outline" className="w-full sm:w-auto h-14 px-8 rounded-2xl font-black uppercase tracking-widest text-sm border-slate-200 hover:bg-slate-50">
                  Back to Home
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </MarketingLayout>
  );
}
