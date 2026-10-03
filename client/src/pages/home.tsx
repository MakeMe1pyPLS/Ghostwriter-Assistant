import { MarketingLayout } from "@/components/layout/MarketingLayout";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { ArrowRight, LayoutDashboard, BrainCircuit, Download, BarChart3, CheckCircle2, Zap, Sparkles, Wand2, Wrench, Target, Search, Handshake, MessagesSquare, Store, Users, Building2, Briefcase } from "lucide-react";
import { motion } from "framer-motion";
import { Reveal, EASE_OUT } from "@/components/motion";
import { IntroSplash } from "@/components/IntroSplash";
import { useDashboardStore } from "@/hooks/use-dashboard-store";

export default function HomePage() {
  const currentUser = useDashboardStore((s) => s.currentUser);
  const isAuthed = !!currentUser;
  return (
    <MarketingLayout>
      <IntroSplash />
      {/* HERO SECTION */}
      <section className="relative pt-20 pb-32 md:pt-32 md:pb-48 px-4 md:px-6 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-white to-[#F4F7FA] -z-10" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-primary/5 blur-[120px] rounded-full pointer-events-none -z-10" />
        
        <div className="max-w-5xl mx-auto text-center relative z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-100 border border-slate-200 text-xs font-bold text-slate-600 mb-8 uppercase tracking-widest">
            <Zap className="w-3.5 h-3.5 text-primary fill-primary" />
            AI business analyst · Claude, ChatGPT &amp; Gemini
          </div>
          
          <motion.h1 initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, ease: EASE_OUT }}
            className="text-[2.6rem] leading-[1.05] sm:text-6xl md:text-7xl font-black text-slate-900 tracking-tighter md:leading-[1.05] mb-8 text-balance">
            Find the bottleneck. <br className="hidden md:block" />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-teal-400">Fix it together.</span>
          </motion.h1>
          
          <motion.p initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.08, ease: EASE_OUT }}
            className="text-lg md:text-xl text-slate-500 font-medium max-w-3xl mx-auto mb-12 leading-relaxed">
            ChainInsideIQ is an AI-powered business tool that turns your goal into a step-by-step growth plan, spots the bottlenecks holding you back, and lets you fix them with the suppliers, carriers and partners you work with. Build dashboards and export them to Excel, Power BI, Google Sheets and more.
          </motion.p>
          
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            {isAuthed ? (
              <>
                <Link href="/plan">
                  <Button className="w-full sm:w-auto font-black uppercase tracking-widest text-sm h-14 px-8 rounded-2xl shadow-xl shadow-primary/20 hover:shadow-primary/30 hover:-translate-y-0.5 transition-all" data-testid="button-open-dashboard">
                    Open my Growth Plan <ArrowRight className="w-5 h-5 ml-2" />
                  </Button>
                </Link>
                <Link href="/insights">
                  <Button variant="outline" className="w-full sm:w-auto font-black uppercase tracking-widest text-sm h-14 px-8 rounded-2xl border-slate-200 bg-white hover:bg-slate-50 shadow-sm" data-testid="button-open-ai-analyst">
                    Open AI Analyst
                  </Button>
                </Link>
              </>
            ) : (
              <>
                <Link href="/sign-up">
                  <Button className="w-full sm:w-auto font-black uppercase tracking-widest text-sm h-14 px-8 rounded-2xl shadow-xl shadow-primary/20 hover:shadow-primary/30 hover:-translate-y-0.5 transition-all" data-testid="button-start-free-trial">
                    Start Free Trial <ArrowRight className="w-5 h-5 ml-2" />
                  </Button>
                </Link>
                <Link href="/demo">
                  <Button variant="outline" className="w-full sm:w-auto font-black uppercase tracking-widest text-sm h-14 px-8 rounded-2xl border-slate-200 bg-white hover:bg-slate-50 shadow-sm" data-testid="button-book-demo">
                    Explore the demo
                  </Button>
                </Link>
              </>
            )}
          </div>
          
          {isAuthed ? (
            <div className="mt-6 flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-6 text-xs font-bold text-slate-400 uppercase tracking-widest">
              <span className="flex items-center gap-1.5"><CheckCircle2 className="w-4 h-4 text-emerald-500" /> Welcome back</span>
              <span className="hidden sm:inline">•</span>
              <span className="text-primary">Your workspace is ready</span>
              <span className="hidden sm:inline">•</span>
              <span className="text-slate-400">Your plan and actions are waiting</span>
            </div>
          ) : (
            <div className="mt-6 flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-6 text-xs font-bold text-slate-400 uppercase tracking-widest">
              <span className="flex items-center gap-1.5"><CheckCircle2 className="w-4 h-4 text-emerald-500" /> Your plan in 2 minutes</span>
              <span className="hidden sm:inline">•</span>
              <span className="text-primary">Try free for 14 days · No credit card</span>
              <span className="hidden sm:inline">•</span>
              <span className="text-slate-400">Demo requires no signup</span>
            </div>
          )}
        </div>
      </section>

      {/* SOCIAL PROOF */}
      <section className="py-12 bg-white border-y border-slate-100">
        <div className="max-w-7xl mx-auto px-4 md:px-6">
          <p className="text-center text-xs font-black text-slate-400 uppercase tracking-widest mb-8">Built for local businesses, growing teams, enterprises and the consultants who help them</p>
          <div className="flex flex-wrap justify-center gap-x-8 gap-y-3 md:gap-x-14 opacity-50 grayscale">
            {['RETAIL & E-COMMERCE', 'RESTAURANTS', 'LOGISTICS', 'MANUFACTURING', 'HEALTH', 'SERVICES', 'SAAS'].map((w) => (
              <span key={w} className="text-base md:text-xl font-black tracking-tighter">{w}</span>
            ))}
          </div>
        </div>
      </section>

      {/* 3 CREATION MODES */}
      <section className="py-24 md:py-32 px-4 md:px-6 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-bold uppercase tracking-widest mb-6">
              <Sparkles className="w-3.5 h-3.5" /> Start where you are
            </div>
            <h2 className="text-3xl md:text-5xl font-black text-slate-900 tracking-tighter mb-4 text-balance">Bring your dashboards, or start fresh</h2>
            <p className="text-slate-500 text-lg">Already tracking numbers in Excel or Power BI? Enhance them. Just starting? Let the AI build one for your industry. Then export it straight back into your own systems.</p>
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
                desc: 'Already have a dashboard? Tell the AI what you use today and what to improve. It rebuilds it with clearer KPIs and charts.',
                badge: 'Smart Upgrade', color: 'bg-indigo-600 text-white',
              },
            ].map((mode, i) => (
              <Reveal key={i} delay={i * 0.06} className="h-full"><Link href={mode.href} className="block h-full">
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
              </Link></Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section className="py-24 md:py-32 px-4 md:px-6 bg-[#F4F7FA]">
        <div className="max-w-7xl mx-auto">
          <Reveal className="text-center max-w-2xl mx-auto mb-16">
            <h2 className="text-3xl md:text-5xl font-black text-slate-900 tracking-tighter mb-4">How it works</h2>
            <p className="text-slate-500 text-lg">Tell the AI your goal. It builds the plan, watches your numbers and brings your partners into the fix.</p>
          </Reveal>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5 relative">
            <div className="hidden lg:block absolute top-12 left-[12%] right-[12%] h-0.5 bg-gradient-to-r from-transparent via-primary/30 to-transparent -z-10" />
            {[
              { step: "1", title: "Set your goal", desc: "Answer 8 quick questions. The AI Analyst writes a step-by-step plan with targets for your industry.", icon: Target },
              { step: "2", title: "Spot bottlenecks", desc: "Import your data. The analyst ranks what’s slowing you down, with the root cause for each.", icon: Search },
              { step: "3", title: "Fix it together", desc: "Share data with suppliers, carriers or your agency and turn every fix into tracked actions.", icon: Handshake },
              { step: "4", title: "Talk it through", desc: "Discuss in the Hub or send updates to Microsoft Teams and Google Chat. Watch the numbers move.", icon: MessagesSquare },
            ].map((s, i) => (
              <Reveal key={i} delay={i * 0.07} className="h-full">
                <div className="bg-white rounded-3xl p-7 border border-slate-200 shadow-sm relative group h-full hover:-translate-y-1 hover:shadow-lg transition-all">
                  <div className="w-12 h-12 bg-primary text-white rounded-2xl flex items-center justify-center text-xl font-black mb-6 shadow-lg shadow-primary/20 group-hover:scale-110 transition-transform">
                    {s.step}
                  </div>
                  <s.icon className="w-8 h-8 text-primary/40 absolute top-7 right-7" />
                  <h3 className="text-xl font-black text-slate-900 mb-3">{s.title}</h3>
                  <p className="text-slate-500 font-medium leading-relaxed">{s.desc}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* WHO IT'S FOR */}
      <section className="py-24 md:py-28 px-4 md:px-6 bg-white">
        <div className="max-w-7xl mx-auto grid lg:grid-cols-[1fr_1.2fr] gap-10 items-center">
          <Reveal>
            <p className="text-xs font-black uppercase tracking-widest text-primary mb-4">For owners, teams and consultants</p>
            <h2 className="text-3xl md:text-5xl font-black text-slate-900 tracking-tighter text-balance">A business consultant and analyst in one tool</h2>
            <p className="text-slate-500 text-lg mt-5 leading-relaxed">Whether you run a single shop or a multi-site operation, ChainInsideIQ gives you the playbook a consultant would: the right KPIs, a clear plan, and the next step every week. Consultants use it to run client engagements with shared data and trackable actions.</p>
          </Reveal>
          <div className="grid sm:grid-cols-2 gap-4">
            {[
              { title: 'Local & small businesses', desc: 'A plain-language plan, the 5 numbers that matter and a weekly next step. No analyst needed.', icon: Store },
              { title: 'Growing teams', desc: 'Owners for every action, shared KPIs with partners and one place to discuss fixes.', icon: Users },
              { title: 'Enterprises', desc: 'Cross-company bottleneck detection, collab presets per partner and exports into Power BI and Excel.', icon: Building2 },
              { title: 'Consultants & agencies', desc: 'Onboard a client in minutes, share their data safely and track every recommendation to done.', icon: Briefcase },
            ].map((c, i) => (
              <Reveal key={c.title} delay={i * 0.06} className="h-full">
                <div className="rounded-3xl bg-[#F4F7FA] border border-slate-100 p-6 h-full hover:border-primary/20 transition-colors">
                  <c.icon className="w-8 h-8 text-primary mb-4" />
                  <h3 className="font-black text-slate-900 text-lg">{c.title}</h3>
                  <p className="text-slate-500 text-sm mt-2 leading-relaxed">{c.desc}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* FEATURES */}
      <section className="py-24 md:py-32 px-4 md:px-6 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="text-center max-w-3xl mx-auto mb-20">
            <h2 className="text-3xl md:text-5xl font-black text-slate-900 tracking-tighter mb-6 text-balance">Everything you need to turn insights into action</h2>
            <p className="text-slate-500 text-lg">Plan, analyze, collaborate and report from one workspace.</p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              { icon: Target, title: "AI Growth Plans", desc: "A step-by-step plan from your goal, with owners, due dates and a North Star metric." },
              { icon: BrainCircuit, title: "AI Business Analyst", desc: "Ask what changed and what to do next. Runs on Claude, ChatGPT or Gemini." },
              { icon: Handshake, title: "Data Collabs", desc: "Share the numbers you and your partners depend on. Save collabs as presets for the next partner." },
              { icon: BarChart3, title: "KPI Library", desc: "300+ metrics across 45 industries, each with how it’s measured and which way is better." },
              { icon: LayoutDashboard, title: "Dashboard Builder", desc: "Drag, drop and configure dashboards, or let the AI generate one for you." },
              { icon: Download, title: "Import & Export", desc: "Bring in CSV, Excel, Sheets or APIs. Export to Excel, CSV and JSON for your own systems." }
            ].map((f, i) => (
              <Reveal key={i} delay={(i % 3) * 0.06} className="h-full"><div className="p-8 rounded-3xl bg-[#F4F7FA] border border-slate-100 hover:border-primary/20 hover:-translate-y-0.5 transition-all h-full">
                <f.icon className="w-10 h-10 text-primary mb-6" />
                <h3 className="text-lg font-black text-slate-900 mb-3">{f.title}</h3>
                <p className="text-slate-500 text-sm font-medium leading-relaxed">{f.desc}</p>
              </div></Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* TOOL COMPATIBILITY */}
      <section className="py-24 px-4 md:px-6 bg-slate-900 text-white relative overflow-hidden">
        <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-primary/20 blur-[100px] rounded-full translate-x-1/2 -translate-y-1/2" />
        <div className="max-w-7xl mx-auto relative z-10 text-center">
          <h2 className="text-3xl md:text-5xl font-black tracking-tighter mb-6 text-balance">Works with the tools<br className="hidden sm:block" /> you already use.</h2>
          <p className="text-slate-400 text-lg max-w-2xl mx-auto mb-16">Export to Excel and CSV, build for Power BI and Tableau, send updates to Microsoft Teams and Google Chat, and put action due dates in Outlook or Google Calendar.</p>
          
          <div className="flex flex-wrap justify-center gap-4 md:gap-6 max-w-4xl mx-auto">
            {['Microsoft Excel', 'Microsoft Teams', 'Outlook', 'Google Sheets', 'Google Chat', 'Google Calendar', 'Power BI', 'Tableau', 'Slack', 'CSV / JSON'].map(tool => (
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
            {isAuthed ? 'Your workspace is ready' : 'Start free, then upgrade'}
          </div>
          <h2 className="text-4xl md:text-6xl font-black tracking-tighter mb-6 text-balance">Your growth plan is two minutes away.</h2>
          <p className="text-teal-50 text-lg mb-10 font-medium">
            {isAuthed
              ? 'Jump back into your plan, your partners and your AI analyst.'
              : 'Start your 14-day free trial. The AI Analyst asks about your goal and builds the plan.'}
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-4">
            {isAuthed ? (
              <>
                <Link href="/plan">
                  <Button className="w-full sm:w-auto font-black uppercase tracking-widest text-sm h-14 px-10 rounded-2xl bg-white text-primary hover:bg-slate-50 hover:scale-105 transition-all shadow-2xl" data-testid="button-cta-open-dashboard">
                    Open my Growth Plan
                  </Button>
                </Link>
                <Link href="/insights">
                  <Button variant="outline" className="w-full sm:w-auto font-black uppercase tracking-widest text-sm h-14 px-10 rounded-2xl border-white/30 text-white hover:bg-white/10 transition-all" data-testid="button-cta-open-ai-analyst">
                    Open AI Analyst
                  </Button>
                </Link>
              </>
            ) : (
              <>
                <Link href="/sign-up">
                  <Button className="w-full sm:w-auto font-black uppercase tracking-widest text-sm h-14 px-10 rounded-2xl bg-white text-primary hover:bg-slate-50 hover:scale-105 transition-all shadow-2xl" data-testid="button-cta-start-free-trial">
                    Start Free Trial
                  </Button>
                </Link>
                <Link href="/contact">
                  <Button variant="outline" className="w-full sm:w-auto font-black uppercase tracking-widest text-sm h-14 px-10 rounded-2xl border-white/30 text-white hover:bg-white/10 transition-all" data-testid="button-cta-book-demo">
                    Book Demo
                  </Button>
                </Link>
              </>
            )}
          </div>
        </div>
      </section>
    </MarketingLayout>
  );
}
