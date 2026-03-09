import { MarketingLayout } from "@/components/layout/MarketingLayout";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { XCircle, ArrowLeft, RotateCcw } from "lucide-react";

export default function CheckoutCancelPage() {
  return (
    <MarketingLayout>
      <div className="pt-24 pb-32 px-4 md:px-6 min-h-[70vh] flex flex-col items-center justify-center">
        <div className="max-w-xl w-full mx-auto bg-white rounded-3xl p-8 md:p-12 border border-slate-200 shadow-[0_8px_30px_rgb(0,0,0,0.04)] text-center relative overflow-hidden">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[300px] h-[300px] bg-slate-100 blur-[80px] rounded-full pointer-events-none" />
          
          <div className="relative z-10">
            <div className="w-16 h-16 bg-slate-50 text-slate-400 border border-slate-100 rounded-full flex items-center justify-center mx-auto mb-6 shadow-sm">
              <XCircle className="w-8 h-8" />
            </div>
            
            <h1 className="text-2xl md:text-3xl font-black text-slate-900 tracking-tight mb-3">Checkout canceled</h1>
            <p className="text-base text-slate-500 font-medium mb-8 leading-relaxed max-w-sm mx-auto">
              You can return to pricing or try again when you're ready. Your payment process was interrupted.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Link href="/pricing">
                <Button className="w-full sm:w-auto h-12 px-8 rounded-xl font-bold uppercase tracking-widest text-xs shadow-md hover:shadow-lg transition-all active:scale-[0.98]">
                  <RotateCcw className="w-4 h-4 mr-2" /> Try Again
                </Button>
              </Link>
              <Link href="/">
                <Button variant="outline" className="w-full sm:w-auto h-12 px-8 rounded-xl font-bold uppercase tracking-widest text-xs border-slate-200 hover:bg-slate-50">
                  <ArrowLeft className="w-4 h-4 mr-2" /> Back to Pricing
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </MarketingLayout>
  );
}
