import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Zap, Menu, X, ArrowRight } from "lucide-react";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

export function MarketingLayout({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navLinks = [
    { name: "Features", href: "/features" },
    { name: "Pricing", href: "/pricing" },
    { name: "Contact", href: "/contact" },
  ];

  return (
    <div className="min-h-screen bg-[#F4F7FA] font-sans selection:bg-primary/20 selection:text-primary flex flex-col">
      {/* Marquee Banner */}
      <div className="bg-slate-900 text-white py-2 overflow-hidden flex items-center shrink-0">
        <div className="flex whitespace-nowrap animate-[marquee_30s_linear_infinite] hover:[animation-play-state:paused]">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="flex items-center gap-8 mx-4 text-[11px] font-black uppercase tracking-widest text-slate-300">
              <span>Build once. Render dashboards anywhere.</span>
              <span className="w-1.5 h-1.5 bg-primary rounded-full" />
              <span className="text-primary">14-Day Free Trial available now.</span>
              <span className="w-1.5 h-1.5 bg-primary rounded-full" />
              <span>AI dashboard generator for Excel, Power BI & Sheets.</span>
              <span className="w-1.5 h-1.5 bg-primary rounded-full" />
              <span>Bridge KPIs for E-commerce, Logistics, and Manufacturing.</span>
              <span className="w-1.5 h-1.5 bg-primary rounded-full" />
              <span>AI Supply Chain Analyst included.</span>
              <span className="w-1.5 h-1.5 bg-primary rounded-full" />
              <span>Turn raw data into tool-ready dashboards.</span>
              <span className="w-1.5 h-1.5 bg-primary rounded-full" />
              <span>Request custom dashboard setup.</span>
              <span className="w-1.5 h-1.5 bg-primary rounded-full" />
            </div>
          ))}
        </div>
      </div>

      <style>{`
        @keyframes marquee {
          0% { transform: translateX(0); }
          100% { transform: translateX(-33.33%); }
        }
      `}</style>

      {/* Navbar */}
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-lg border-b border-slate-200 shadow-sm shrink-0">
        <div className="max-w-7xl mx-auto px-4 md:px-6 h-16 md:h-20 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="w-8 h-8 md:w-10 md:h-10 rounded-xl bg-slate-900 text-primary flex items-center justify-center shadow-md group-hover:scale-105 transition-transform">
               <Zap size={20} fill="currentColor" />
            </div>
            <div className="flex flex-col">
              <span className="font-black text-sm md:text-base text-slate-900 uppercase tracking-tighter leading-none">ChainInside</span>
              <span className="text-[9px] md:text-[10px] font-black text-primary uppercase tracking-[0.2em] mt-0.5">Intelligence IQ</span>
            </div>
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center gap-8">
            {navLinks.map(link => (
              <Link key={link.name} href={link.href} className={`text-sm font-bold uppercase tracking-wider transition-colors ${location === link.href ? 'text-primary' : 'text-slate-500 hover:text-slate-900'}`}>
                {link.name}
              </Link>
            ))}
            <Link href="/builder" className="text-sm font-bold uppercase tracking-wider text-slate-500 hover:text-slate-900">
              Live Demo
            </Link>
          </nav>

          <div className="hidden md:flex items-center gap-4">
            <Link href="/builder">
              <Button variant="ghost" className="font-bold uppercase tracking-wider text-xs">Interactive Demo</Button>
            </Link>
            <Link href="/pricing">
              <Button className="font-bold uppercase tracking-widest text-xs h-11 px-6 rounded-xl shadow-lg shadow-primary/20 hover:shadow-primary/30 hover:-translate-y-0.5 transition-all">
                Start 14-Day Free Trial <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </Link>
          </div>

          {/* Mobile Toggle */}
          <Button variant="ghost" size="icon" className="md:hidden" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </Button>
        </div>

        {/* Mobile Menu */}
        <AnimatePresence>
          {mobileMenuOpen && (
            <motion.div 
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="md:hidden bg-white border-t border-slate-100 overflow-hidden"
            >
              <div className="flex flex-col p-4 space-y-4">
                {navLinks.map(link => (
                  <Link key={link.name} href={link.href} onClick={() => setMobileMenuOpen(false)} className="text-sm font-bold uppercase tracking-wider text-slate-700 py-2 border-b border-slate-50">
                    {link.name}
                  </Link>
                ))}
                <Link href="/builder" onClick={() => setMobileMenuOpen(false)} className="text-sm font-bold uppercase tracking-wider text-slate-700 py-2 border-b border-slate-50">
                  Live Demo
                </Link>
                <div className="flex flex-col gap-3 pt-2">
                  <Link href="/builder" onClick={() => setMobileMenuOpen(false)}>
                    <Button variant="outline" className="w-full font-bold uppercase tracking-wider h-11 rounded-xl">Interactive Demo</Button>
                  </Link>
                  <Link href="/pricing" onClick={() => setMobileMenuOpen(false)}>
                    <Button className="w-full font-bold uppercase tracking-widest h-11 rounded-xl shadow-lg shadow-primary/20">
                      Start 14-Day Free Trial <ArrowRight className="w-4 h-4 ml-2" />
                    </Button>
                  </Link>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </header>

      {/* Main Content */}
      <main className="flex-1 w-full relative z-10 flex flex-col">
        {children}
      </main>

      {/* Footer */}
      <footer className="bg-slate-900 pt-20 pb-10 px-4 md:px-6 mt-auto shrink-0 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-primary/10 blur-[120px] rounded-full translate-x-1/2 -translate-y-1/2 pointer-events-none" />
        
        <div className="max-w-7xl mx-auto relative z-10">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-12 lg:gap-8 mb-16">
            <div className="lg:col-span-2">
              <Link href="/" className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-xl bg-white text-primary flex items-center justify-center shadow-lg">
                   <Zap size={22} fill="currentColor" />
                </div>
                <div className="flex flex-col">
                  <span className="font-black text-xl text-white uppercase tracking-tighter leading-none">ChainInside</span>
                  <span className="text-[10px] font-black text-primary uppercase tracking-[0.2em] mt-1">Intelligence IQ</span>
                </div>
              </Link>
              <p className="text-slate-400 text-sm leading-relaxed max-w-sm mb-8">
                The AI-powered dashboard generator platform that helps businesses create operational analytics and render them into Excel, Power BI, Google Sheets, and beyond.
              </p>
              <div className="flex gap-4">
                <Link href="/builder">
                  <Button className="font-black uppercase tracking-widest text-[10px] h-10 px-5 rounded-xl shadow-lg shadow-primary/20 hover:shadow-primary/30">
                    Try Demo
                  </Button>
                </Link>
                <Link href="/pricing">
                  <Button variant="outline" className="font-black uppercase tracking-widest text-[10px] h-10 px-5 rounded-xl border-slate-700 text-white hover:bg-slate-800 hover:text-white">
                    Start Your 14-Day Free Trial
                  </Button>
                </Link>
              </div>
            </div>

            <div>
              <h4 className="text-white font-black uppercase tracking-widest text-xs mb-6">Product</h4>
              <ul className="space-y-4">
                <li><Link href="/features" className="text-slate-400 hover:text-white text-sm font-medium transition-colors">Features</Link></li>
                <li><Link href="/pricing" className="text-slate-400 hover:text-white text-sm font-medium transition-colors">Pricing</Link></li>
                <li><Link href="/builder" className="text-slate-400 hover:text-white text-sm font-medium transition-colors">Interactive Demo</Link></li>
                <li><Link href="/contact" className="text-slate-400 hover:text-white text-sm font-medium transition-colors">Request Setup</Link></li>
              </ul>
            </div>

            <div>
              <h4 className="text-white font-black uppercase tracking-widest text-xs mb-6">Company</h4>
              <ul className="space-y-4">
                <li><Link href="/contact" className="text-slate-400 hover:text-white text-sm font-medium transition-colors">Contact Us</Link></li>
                <li><a href="#" className="text-slate-400 hover:text-white text-sm font-medium transition-colors">Support</a></li>
                <li><a href="#" className="text-slate-400 hover:text-white text-sm font-medium transition-colors">Privacy Policy</a></li>
                <li><a href="#" className="text-slate-400 hover:text-white text-sm font-medium transition-colors">Terms of Service</a></li>
              </ul>
            </div>
            
            <div>
              <h4 className="text-white font-black uppercase tracking-widest text-xs mb-6">Use Cases</h4>
              <ul className="space-y-4">
                <li className="text-slate-400 text-sm font-medium">E-commerce Operations</li>
                <li className="text-slate-400 text-sm font-medium">Logistics & Fulfillment</li>
                <li className="text-slate-400 text-sm font-medium">Manufacturing QA</li>
                <li className="text-slate-400 text-sm font-medium">Unified Supply Chain</li>
              </ul>
            </div>
          </div>

          <div className="pt-8 border-t border-slate-800 flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="text-slate-500 text-xs font-medium">© {new Date().getFullYear()} ChainInsideIQ. All rights reserved.</p>
            <p className="text-slate-500 text-xs font-medium flex items-center gap-1">Built with <Zap className="w-3 h-3 text-primary fill-primary" /> for operations teams.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
