import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Zap, Menu, X, ArrowRight, LayoutDashboard } from "lucide-react";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useDashboardStore } from "@/hooks/use-dashboard-store";

function LinkedInIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg>
  );
}

function XIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
  );
}

function YouTubeIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor"><path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/></svg>
  );
}

function GitHubIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor"><path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12"/></svg>
  );
}

const socialLinks = [
  { name: "LinkedIn", href: "https://linkedin.com/company/chaininsideiq", icon: LinkedInIcon },
  { name: "X / Twitter", href: "https://x.com/chaininsideiq", icon: XIcon },
  { name: "YouTube", href: "https://youtube.com/@chaininsideiq", icon: YouTubeIcon },
  { name: "GitHub", href: "https://github.com/chaininsideiq", icon: GitHubIcon },
];

export function MarketingLayout({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const currentUser = useDashboardStore(s => s.currentUser);
  const isAuthed = !!currentUser;

  const navLinks = [
    { name: "Features", href: "/features" },
    { name: "Pricing", href: "/pricing" },
  ];

  return (
    <div className="min-h-screen bg-[#F4F7FA] font-sans selection:bg-primary/20 selection:text-primary flex flex-col">
      <div className="bg-slate-900 text-white py-2 overflow-hidden flex items-center shrink-0">
        <div className="flex whitespace-nowrap animate-[marquee_30s_linear_infinite] hover:[animation-play-state:paused]">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="flex items-center gap-8 mx-4 text-[11px] font-black uppercase tracking-widest text-slate-300">
              <span>Build once. Render dashboards anywhere.</span>
              <span className="w-1.5 h-1.5 bg-primary rounded-full" />
              <span className="text-primary">{isAuthed ? 'Your AI supply chain analyst is ready.' : '14-Day Free Trial available now.'}</span>
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

          <nav className="hidden md:flex items-center gap-8">
            {navLinks.map(link => (
              <Link key={link.name} href={link.href} className={`text-sm font-bold uppercase tracking-wider transition-colors ${location === link.href ? 'text-primary' : 'text-slate-500 hover:text-slate-900'}`} data-testid={`nav-${link.name.toLowerCase()}`}>
                {link.name}
              </Link>
            ))}
          </nav>

          <div className="hidden md:flex items-center gap-3">
            {isAuthed ? (
              <Link href="/dashboard">
                <Button className="font-bold uppercase tracking-widest text-xs h-11 px-6 rounded-xl shadow-lg shadow-primary/20" data-testid="button-go-to-dashboard">
                  <LayoutDashboard className="w-4 h-4 mr-2" /> My Dashboard
                </Button>
              </Link>
            ) : (
              <>
                <Link href="/sign-in">
                  <Button variant="ghost" className="font-bold uppercase tracking-wider text-xs" data-testid="button-sign-in">Sign In</Button>
                </Link>
                <Link href="/sign-up">
                  <Button className="font-bold uppercase tracking-widest text-xs h-11 px-6 rounded-xl shadow-lg shadow-primary/20 hover:shadow-primary/30 hover:-translate-y-0.5 transition-all" data-testid="button-get-started">
                    Get Started <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </Link>
              </>
            )}
          </div>

          <Button variant="ghost" size="icon" className="md:hidden" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </Button>
        </div>

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
                <div className="flex flex-col gap-3 pt-2">
                  {isAuthed ? (
                    <Link href="/dashboard" onClick={() => setMobileMenuOpen(false)}>
                      <Button className="w-full font-bold uppercase tracking-widest h-11 rounded-xl shadow-lg shadow-primary/20">
                        <LayoutDashboard className="w-4 h-4 mr-2" /> My Dashboard
                      </Button>
                    </Link>
                  ) : (
                    <>
                      <Link href="/sign-in" onClick={() => setMobileMenuOpen(false)}>
                        <Button variant="outline" className="w-full font-bold uppercase tracking-wider h-11 rounded-xl">Sign In</Button>
                      </Link>
                      <Link href="/sign-up" onClick={() => setMobileMenuOpen(false)}>
                        <Button className="w-full font-bold uppercase tracking-widest h-11 rounded-xl shadow-lg shadow-primary/20">
                          Get Started <ArrowRight className="w-4 h-4 ml-2" />
                        </Button>
                      </Link>
                    </>
                  )}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </header>

      <main className="flex-1 w-full relative z-10 flex flex-col">
        {children}
      </main>

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
              <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 mb-8">
                {isAuthed ? (
                  <>
                    <Link href="/dashboard" className="w-full sm:w-auto">
                      <Button className="w-full sm:w-auto font-black uppercase tracking-widest text-[10px] h-10 px-5 rounded-xl shadow-lg shadow-primary/20 hover:shadow-primary/30" data-testid="button-footer-open-dashboard">
                        Open Dashboard
                      </Button>
                    </Link>
                    <Link href="/insights" className="w-full sm:w-auto">
                      <Button variant="outline" className="w-full sm:w-auto font-black uppercase tracking-widest text-[10px] h-10 px-5 rounded-xl border-slate-700 text-white hover:bg-slate-800 hover:text-white" data-testid="button-footer-open-ai-analyst">
                        Open AI Analyst
                      </Button>
                    </Link>
                  </>
                ) : (
                  <>
                    <Link href="/sign-up" className="w-full sm:w-auto">
                      <Button className="w-full sm:w-auto font-black uppercase tracking-widest text-[10px] h-10 px-5 rounded-xl shadow-lg shadow-primary/20 hover:shadow-primary/30" data-testid="button-footer-start-free-trial">
                        Start Free Trial
                      </Button>
                    </Link>
                    <Link href="/contact" className="w-full sm:w-auto">
                      <Button variant="outline" className="w-full sm:w-auto font-black uppercase tracking-widest text-[10px] h-10 px-5 rounded-xl border-slate-700 text-white hover:bg-slate-800 hover:text-white" data-testid="button-footer-book-demo">
                        Book Demo
                      </Button>
                    </Link>
                  </>
                )}
              </div>

              <div className="space-y-3">
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">Connect with ChainInsideIQ</p>
                <div className="flex gap-3">
                  {socialLinks.map(social => (
                    <a
                      key={social.name}
                      href={social.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-9 h-9 rounded-lg bg-slate-800 hover:bg-primary/20 border border-slate-700 hover:border-primary/40 flex items-center justify-center text-slate-400 hover:text-primary transition-all"
                      title={social.name}
                      data-testid={`social-${social.name.toLowerCase().replace(/\s+/g, '-')}`}
                    >
                      <social.icon className="w-4 h-4" />
                    </a>
                  ))}
                </div>
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
                <li><Link href="/support" className="text-slate-400 hover:text-white text-sm font-medium transition-colors">Support</Link></li>
                <li><Link href="/privacy" className="text-slate-400 hover:text-white text-sm font-medium transition-colors">Privacy Policy</Link></li>
                <li><Link href="/terms" className="text-slate-400 hover:text-white text-sm font-medium transition-colors">Terms of Service</Link></li>
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
            <p className="text-slate-500 text-xs font-medium">&copy; {new Date().getFullYear()} ChainInsideIQ. All rights reserved.</p>
            <div className="flex items-center gap-6">
              <Link href="/privacy" className="text-slate-500 hover:text-slate-300 text-xs font-medium transition-colors">Privacy</Link>
              <Link href="/terms" className="text-slate-500 hover:text-slate-300 text-xs font-medium transition-colors">Terms</Link>
              <p className="text-slate-500 text-xs font-medium flex items-center gap-1">Built with <Zap className="w-3 h-3 text-primary fill-primary" /> for operations teams.</p>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}