import { Link } from "wouter";
import { ShieldCheck, Lock, Sparkles } from "lucide-react";

function Zap({ size = 22 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
    </svg>
  );
}

interface AuthLayoutProps {
  children: React.ReactNode;
  title: string;
  subtitle?: string;
  side?: "signin" | "signup" | "verify";
}

export function AuthLayout({ children, title, subtitle, side = "signin" }: AuthLayoutProps) {
  const sideContent = {
    signin: {
      headline: "Welcome back to your supply chain command center.",
      points: [
        { icon: ShieldCheck, text: "Your dashboards, KPIs, and data stay tied to your account." },
        { icon: Sparkles, text: "AI Analyst Mode picks up exactly where you left off." },
        { icon: Lock, text: "Bank-grade security and encryption for your operational data." },
      ],
    },
    signup: {
      headline: "Build dashboards your team will actually use.",
      points: [
        { icon: Sparkles, text: "Generate full operations dashboards in seconds with AI." },
        { icon: ShieldCheck, text: "14-day free trial. No credit card required." },
        { icon: Lock, text: "Export to Excel, Power BI, or Google Sheets when ready." },
      ],
    },
    verify: {
      headline: "One quick step before you dive in.",
      points: [
        { icon: ShieldCheck, text: "Verifying your email keeps your workspace secure." },
        { icon: Sparkles, text: "Unlock the full Analyst Mode and AI insights." },
        { icon: Lock, text: "Your trial is already active — no time wasted." },
      ],
    },
  }[side];

  return (
    <div className="min-h-screen bg-[#F4F7FA] grid lg:grid-cols-2">
      {/* Left brand panel */}
      <aside className="hidden lg:flex flex-col justify-between bg-slate-900 text-white p-12 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-primary/15 blur-[120px] rounded-full translate-x-1/3 -translate-y-1/3 pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-primary/10 blur-[120px] rounded-full -translate-x-1/3 translate-y-1/3 pointer-events-none" />

        <Link href="/" className="flex items-center gap-3 relative z-10" data-testid="link-brand-home">
          <div className="w-10 h-10 rounded-xl bg-white text-primary flex items-center justify-center shadow-lg">
            <Zap />
          </div>
          <div className="flex flex-col">
            <span className="font-black text-base uppercase tracking-tighter leading-none">ChainInside</span>
            <span className="text-[10px] font-black text-primary uppercase tracking-[0.2em] mt-1">Intelligence IQ</span>
          </div>
        </Link>

        <div className="relative z-10 max-w-md">
          <h2 className="text-3xl font-black tracking-tight leading-tight mb-8">
            {sideContent.headline}
          </h2>
          <ul className="space-y-5">
            {sideContent.points.map((p, i) => (
              <li key={i} className="flex items-start gap-3">
                <div className="w-9 h-9 rounded-lg bg-white/10 border border-white/20 flex items-center justify-center shrink-0">
                  <p.icon className="w-4 h-4 text-primary" />
                </div>
                <p className="text-sm text-slate-300 leading-relaxed pt-1.5">{p.text}</p>
              </li>
            ))}
          </ul>
        </div>

        <div className="relative z-10 text-[11px] text-slate-500 font-medium">
          &copy; {new Date().getFullYear()} ChainInsideIQ. Trusted by operations teams worldwide.
        </div>
      </aside>

      {/* Right form panel */}
      <main className="flex flex-col px-6 sm:px-10 py-10 lg:py-16 overflow-y-auto">
        <div className="lg:hidden flex items-center justify-between mb-8">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-slate-900 text-primary flex items-center justify-center">
              <Zap size={18} />
            </div>
            <span className="font-black text-sm uppercase tracking-tighter">ChainInsideIQ</span>
          </Link>
        </div>

        <div className="flex-1 flex flex-col justify-center max-w-md w-full mx-auto">
          <h1 className="text-3xl md:text-4xl font-black text-slate-900 tracking-tighter mb-2">{title}</h1>
          {subtitle && <p className="text-slate-500 text-sm leading-relaxed mb-8">{subtitle}</p>}
          {children}
        </div>

        <div className="text-center mt-10 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
          Protected by bank-grade encryption · SOC 2 ready
        </div>
      </main>
    </div>
  );
}
