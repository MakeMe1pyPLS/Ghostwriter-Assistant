import { MarketingLayout } from "@/components/layout/MarketingLayout";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { ArrowRight, LayoutDashboard, BrainCircuit, TrendingUp, Download, Plug, BarChart3, CheckCircle2, Zap, Sparkles, Wand2, Wrench } from "lucide-react";

export default function HomePage() {
  return (
    <MarketingLayout>
      {/* HERO SECTION */}
      <section className="relative pt-20 pb-32 md:pt-32 md:pb-48 px-4 md:px-6 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-white to-[#F4F7FA] -z-10" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-primary/5 blur-[120px] rounded-full pointer-events-none -z-10" />
        
        <div className="max-w-5xl mx-auto text-center relative z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-100 border border-slate-200 text-xs font-bold text-slate-600 mb-8 uppercase tracking-widest">
            <Zap className="w-3.5 h-3.5 text-primary fill-primary" />
            AI-Powered Dashboard Generator
          </div>
          
          <h1 className="text-5xl md:text-7xl font-black text-slate-900 tracking-tighter leading-[1.1] mb-8">
            Build Once. <br className="hidden md:block" />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-teal-400">Render Dashboards Anywhere.</span>
          </h1>
          
          <p className="text-lg md:text-xl text-slate-500 font-medium max-w-3xl mx-auto mb-12 leading-relaxed">
            ChainInsideIQ is an AI-powered dashboard generator platform that helps businesses create analytics dashboards and render them into Excel, Power BI, Google Sheets, and more.
          </p>
          
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link href="/pricing">
              <Button className="w-full sm:w-auto font-black uppercase tracking-widest text-sm h-14 px-8 rounded-2xl shadow-xl shadow-primary/20 hover:shadow-primary/30 hover:-translate-y-0.5 transition-all">
                Start 14-Day Free Trial <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
            </Link>
            <Link href="/demo">
              <Button variant="outline" className="w-full sm:w-auto font-black uppercase tracking-widest text-sm h-14 px-8 rounded-2xl border-slate-200 bg-white hover:bg-slate-50 shadow-sm" data-testid="button-explore-demo">
                Explore Demo Workspace
              </Button>
            </Link>
          </div>
          
          <div className="mt-6 flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-6 text-xs font-bold text-slate-400 uppercase tracking-widest">
            <span className="flex items-center gap-1.5"><CheckCircle2 className="w-4 h-4 text-emerald-500" /> No setup friction</span>
            <span className="hidden sm:inline">•</span>
            <span className="text-primary">Try free for 14 days · No credit card</span>
            <span className="hidden sm:inline">•</span>
            <span className="text-slate-400">Demo requires no signup</span>
          </div>
        </div>
      </section>

      {/* SOCIAL PROOF */}
      <section className="py-12 bg-white border-y border-slate-100">
        <div className="max-w-7xl mx-auto px-4 md:px-6">
          <p className="text-center text-xs font-black text-slate-400 uppercase tracking-widest mb-8">Built for modern supply chain decision-making</p>
          <div className="flex flex-wrap justify-center gap-8 md:gap-16 opacity-50 grayscale">
            <span className="text-xl font-black tracking-tighter">E-COMMERCE</span>
            <span className="text-xl font-black tracking-tighter">LOGISTICS</span>
            <span className="text-xl font-black tracking-tighter">MANUFACTURING</span>
            <span className="text-xl font-black tracking-tighter">OPERATIONS</span>
          </div>
        </div>
      </section>

      {/* 3 CREATION MODES */}
      <section className="py-24 md:py-32 px-4 md:px-6 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-bold uppercase tracking-widest mb-6">
              <Sparkles className="w-3.5 h-3.5" /> 3 Ways to Create
            </div>
            <h2 className="text-3xl md:text-5xl font-black text-slate-900 tracking-tighter mb-4">Choose Your Creation Mode</h2>
            <p className="text-slate-500 text-lg">Build manually, let AI generate for you, or enhance an existing dashboard.</p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {[
              {
                icon: Wrench, title: 'Build Manually', href: '/builder',
                desc: 'Full creative control. Drag-and-drop widgets, customize KPI cards, arrange your layout precisely.',
                badge: 'Full Control', color: 'bg-slate-900 text-white',
              },
              {
                icon: Sparkles, title: 'Generate For Me', href: '/generate',
                desc: 'Answer guided questions about your business, goals, and tools. AI builds the perfect dashboard.',
                badge: 'AI-Powered', color: 'bg-primary text-white',
              },
              {
                icon: Wand2, title: 'Enhance My Dashboard', href: '/enhance',
                desc: 'Already have a dashboard? Let AI improve readability, KPI design, and tool compatibility.',
                badge: 'Smart Upgrade', color: 'bg-indigo-600 text-white',
              },
            ].map((mode, i) => (
              <Link key={i} href={mode.href}>
                <div className="bg-white rounded-3xl p-8 border border-slate-200 shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all cursor-pointer group h-full" data-testid={`card-mode-${i}`}>
                  <div className={`w-14 h-14 rounded-2xl ${mode.color} flex items-center justify-center mb-6 shadow-lg group-hover:scale-110 transition-transform`}>
                    <mode.icon className="w-7 h-7" />
                  </div>
                  <span className={`text-[9px] font-black uppercase tracking-widest px-2.5 py-1 rounded-full ${mode.color}`}>{mode.badge}</span>
                  <h3 className="text-xl font-black text-slate-900 tracking-tight mt-3 mb-2">{mode.title}</h3>
                  <p className="text-slate-500 text-sm leading-relaxed">{mode.desc}</p>
                  <div className="flex items-center gap-2 text-primary font-bold text-xs uppercase tracking-widest mt-4 group-hover:gap-3 transition-all">
                    Get Started <ArrowRight className="w-4 h-4" />
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section className="py-24 md:py-32 px-4 md:px-6 bg-[#F4F7FA]">
        <div className="max-w-7xl mx-auto">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <h2 className="text-3xl md:text-5xl font-black text-slate-900 tracking-tighter mb-4">How It Works</h2>
            <p className="text-slate-500 text-lg">Generate once, render anywhere. A seamless workflow for operational data.</p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8 relative">
            <div className="hidden md:block absolute top-12 left-[16%] right-[16%] h-0.5 bg-gradient-to-r from-transparent via-primary/30 to-transparent -z-10" />
            
            {[
              { step: "1", title: "Build Your Dashboard", desc: "Start with the builder to arrange KPIs, charts, and forecasts.", icon: LayoutDashboard },
              { step: "2", title: "Connect Your Data", desc: "Import your data or connect directly to your systems.", icon: Plug },
              { step: "3", title: "Render & Export", desc: "Export where your team already works: Excel, BI, or PDF.", icon: Download }
            ].map((s, i) => (
              <div key={i} className="bg-white rounded-3xl p-8 border border-slate-200 shadow-sm relative group">
                <div className="w-12 h-12 bg-primary text-white rounded-2xl flex items-center justify-center text-xl font-black mb-6 shadow-lg shadow-primary/20 group-hover:scale-110 transition-transform">
                  {s.step}
                </div>
                <s.icon className="w-8 h-8 text-primary/40 absolute top-8 right-8" />
                <h3 className="text-xl font-black text-slate-900 mb-3">{s.title}</h3>
                <p className="text-slate-500 font-medium leading-relaxed">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FEATURES */}
      <section className="py-24 md:py-32 px-4 md:px-6 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="text-center max-w-3xl mx-auto mb-20">
            <h2 className="text-3xl md:text-5xl font-black text-slate-900 tracking-tighter mb-6">Everything you need to turn insights into action</h2>
            <p className="text-slate-500 text-lg">Build dashboards faster with AI and distribute them effortlessly.</p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              { icon: LayoutDashboard, title: "Dashboard Builder", desc: "Drag, drop, and configure components in a fully visual editor." },
              { icon: BrainCircuit, title: "AI Supply Chain Analyst", desc: "Ask the AI what changed, understand shifts, and get next best actions." },
              { icon: TrendingUp, title: "Forecasting Widgets", desc: "Built-in predictive modeling to see where your metrics are heading." },
              { icon: BarChart3, title: "Bridge KPIs", desc: "Measure the links between silos with cross-supply-chain bridge metrics." },
              { icon: Download, title: "Export Engine", desc: "Generate native files for the tools your team already uses." },
              { icon: Plug, title: "Tool Connectors", desc: "Seamlessly integrate with your existing data warehouses and ERPs." }
            ].map((f, i) => (
              <div key={i} className="p-8 rounded-3xl bg-[#F4F7FA] border border-slate-100 hover:border-primary/20 transition-colors">
                <f.icon className="w-10 h-10 text-primary mb-6" />
                <h3 className="text-lg font-black text-slate-900 mb-3">{f.title}</h3>
                <p className="text-slate-500 text-sm font-medium leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* TOOL COMPATIBILITY */}
      <section className="py-24 px-4 md:px-6 bg-slate-900 text-white relative overflow-hidden">
        <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-primary/20 blur-[100px] rounded-full translate-x-1/2 -translate-y-1/2" />
        <div className="max-w-7xl mx-auto relative z-10 text-center">
          <h2 className="text-3xl md:text-5xl font-black tracking-tighter mb-6">One dashboard builder.<br/>Multiple native outputs.</h2>
          <p className="text-slate-400 text-lg max-w-2xl mx-auto mb-16">Designed for teams that use Excel, BI tools, and operational systems. Build in one place. Deliver in many.</p>
          
          <div className="flex flex-wrap justify-center gap-4 md:gap-6 max-w-4xl mx-auto">
            {['Microsoft Excel', 'Google Sheets', 'Power BI', 'Tableau', 'SQL', 'CSV / JSON'].map(tool => (
              <div key={tool} className="px-6 py-4 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-sm font-black uppercase tracking-widest text-sm text-white/90">
                {tool}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA SECTION */}
      <section className="py-32 px-4 md:px-6 bg-primary text-white text-center">
        <div className="max-w-3xl mx-auto">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/10 rounded-full text-xs font-bold uppercase tracking-widest text-white mb-8 border border-white/20">
            Start free, then upgrade
          </div>
          <h2 className="text-4xl md:text-6xl font-black tracking-tighter mb-6">Experience the AI dashboard generator live.</h2>
          <p className="text-teal-50 text-lg mb-10 font-medium">Start with a guided demo, then unlock your 14-day free trial.</p>
          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <Link href="/pricing">
              <Button className="w-full sm:w-auto font-black uppercase tracking-widest text-sm h-14 px-10 rounded-2xl bg-white text-primary hover:bg-slate-50 hover:scale-105 transition-all shadow-2xl">
                Start Your 14-Day Free Trial
              </Button>
            </Link>
            <Link href="/builder">
              <Button variant="outline" className="w-full sm:w-auto font-black uppercase tracking-widest text-sm h-14 px-10 rounded-2xl border-white/30 text-white hover:bg-white/10 transition-all">
                Try Interactive Demo
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </MarketingLayout>
  );
}
