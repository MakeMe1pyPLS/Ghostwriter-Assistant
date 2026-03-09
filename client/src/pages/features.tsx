import { MarketingLayout } from "@/components/layout/MarketingLayout";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { LayoutDashboard, BrainCircuit, TrendingUp, Download, Plug, BarChart3, ArrowRight } from "lucide-react";

export default function FeaturesPage() {
  return (
    <MarketingLayout>
      <div className="pt-20 pb-32 px-4 md:px-6 max-w-7xl mx-auto">
        <div className="text-center max-w-3xl mx-auto mb-10">
          <h1 className="text-4xl md:text-6xl font-black text-slate-900 tracking-tighter mb-6">Features Built for Operations</h1>
          <p className="text-lg text-slate-500 font-medium mb-8">Explore the tools that power the next generation of supply chain analytics.</p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link href="/pricing">
              <Button className="w-full sm:w-auto font-black uppercase tracking-widest text-sm h-12 px-8 rounded-xl shadow-xl shadow-primary/20 hover:-translate-y-0.5 transition-all">
                Start Your 14-Day Free Trial
              </Button>
            </Link>
          </div>
        </div>

        <div className="space-y-24 md:space-y-32 mt-20">
          {/* Feature 1 */}
          <div className="grid md:grid-cols-2 gap-8 md:gap-12 items-center">
            <div>
              <div className="w-12 h-12 bg-primary/10 rounded-2xl flex items-center justify-center mb-6 text-primary">
                <LayoutDashboard className="w-6 h-6" />
              </div>
              <h2 className="text-3xl font-black text-slate-900 mb-4">Dashboard Builder</h2>
              <p className="text-slate-500 text-lg mb-8 leading-relaxed">
                Drag, drop, and configure components in a fully visual editor. Build professional dashboards without writing a single line of code.
              </p>
              <Link href="/builder">
                <Button variant="outline" className="font-bold uppercase tracking-widest text-xs h-12 px-6 rounded-xl border-slate-200">
                  See the builder in action <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </Link>
            </div>
            <div className="bg-slate-100 rounded-[2rem] aspect-square relative overflow-hidden border border-slate-200 flex items-center justify-center">
              <LayoutDashboard className="w-32 h-32 text-slate-300" />
            </div>
          </div>

          {/* Feature 2 */}
          <div className="grid md:grid-cols-2 gap-8 md:gap-12 items-center">
            <div className="order-2 md:order-1 bg-slate-100 rounded-[2rem] aspect-square relative overflow-hidden border border-slate-200 flex items-center justify-center">
              <BrainCircuit className="w-32 h-32 text-slate-300" />
            </div>
            <div className="order-1 md:order-2">
              <div className="w-12 h-12 bg-primary/10 rounded-2xl flex items-center justify-center mb-6 text-primary">
                <BrainCircuit className="w-6 h-6" />
              </div>
              <h2 className="text-3xl font-black text-slate-900 mb-4">AI Supply Chain Analyst</h2>
              <p className="text-slate-500 text-lg mb-8 leading-relaxed">
                Ask the AI what changed, understand why performance shifted, and get the next best actions instantly. Turn KPI movement into decisions.
              </p>
              <Link href="/insights">
                <Button variant="outline" className="font-bold uppercase tracking-widest text-xs h-12 px-6 rounded-xl border-slate-200">
                  Try AI-powered insights <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </Link>
            </div>
          </div>

          {/* Feature 3 */}
          <div className="grid md:grid-cols-2 gap-8 md:gap-12 items-center">
            <div>
              <div className="w-12 h-12 bg-primary/10 rounded-2xl flex items-center justify-center mb-6 text-primary">
                <Download className="w-6 h-6" />
              </div>
              <h2 className="text-3xl font-black text-slate-900 mb-4">Export Engine</h2>
              <p className="text-slate-500 text-lg mb-8 leading-relaxed">
                One dashboard builder. Multiple native outputs. Export directly to Excel, Power BI, Google Sheets, or PDF. Generate once, render anywhere.
              </p>
              <Link href="/exports">
                <Button variant="outline" className="font-bold uppercase tracking-widest text-xs h-12 px-6 rounded-xl border-slate-200">
                  Explore exports <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </Link>
            </div>
            <div className="bg-slate-100 rounded-[2rem] aspect-square relative overflow-hidden border border-slate-200 flex items-center justify-center">
              <Download className="w-32 h-32 text-slate-300" />
            </div>
          </div>

          {/* Feature 4 */}
          <div className="grid md:grid-cols-2 gap-8 md:gap-12 items-center">
            <div className="order-2 md:order-1 bg-slate-100 rounded-[2rem] aspect-square relative overflow-hidden border border-slate-200 flex items-center justify-center">
              <Plug className="w-32 h-32 text-slate-300" />
            </div>
            <div className="order-1 md:order-2">
              <div className="w-12 h-12 bg-primary/10 rounded-2xl flex items-center justify-center mb-6 text-primary">
                <Plug className="w-6 h-6" />
              </div>
              <h2 className="text-3xl font-black text-slate-900 mb-4">Tool Connectors</h2>
              <p className="text-slate-500 text-lg mb-8 leading-relaxed">
                Connect your tools, keep your workflow. Seamlessly integrate with existing data warehouses, ERPs, and specialized operational software.
              </p>
              <Link href="/connectors">
                <Button variant="outline" className="font-bold uppercase tracking-widest text-xs h-12 px-6 rounded-xl border-slate-200">
                  Connect your data <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </MarketingLayout>
  );
}
