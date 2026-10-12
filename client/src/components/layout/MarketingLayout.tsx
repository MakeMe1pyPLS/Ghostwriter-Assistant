import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Menu, X, ArrowRight, LayoutDashboard } from "lucide-react";
import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useDashboardStore } from "@/hooks/use-dashboard-store";
import { Logo } from "@/components/Logo";
import { ThemeToggle } from "@/components/ThemeToggle";
import { cn } from "@/lib/utils";

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
  { name: "X / Twitter", href: "https://x.com/AtomBSA", icon: XIcon },
  { name: "YouTube", href: "https://youtube.com/@chaininsideiq", icon: YouTubeIcon },
  { name: "GitHub", href: "https://github.com/chaininsideiq", icon: GitHubIcon },
];

export function MarketingLayout({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const currentUser = useDashboardStore(s => s.currentUser);
  const isAuthed = !!currentUser;

  useEffect(() => {
    const on = () => setScrolled(window.scrollY > 8);
    on();
    window.addEventListener("scroll", on, { passive: true });
    return () => window.removeEventListener("scroll", on);
  }, []);
  useEffect(() => { setMobileMenuOpen(false); }, [location]);

  const navLinks = [
    { name: "Features", href: "/features" },
    { name: "Pricing", href: "/pricing" },
    { name: "Demo", href: "/demo" },
    { name: "Support", href: "/support" },
  ];

  return (
    <div className="min-h-dvh bg-[#F4F7FA] font-sans flex flex-col">
      <header className={cn(
        "sticky top-0 z-50 shrink-0 transition-[background-color,border-color,box-shadow,backdrop-filter] duration-300 border-b",
        scrolled || mobileMenuOpen
          ? "bg-white/75 dark:bg-slate-950/70 backdrop-blur-xl border-slate-200/70 shadow-[0_8px_30px_-20px_rgba(15,23,42,0.35)]"
          : "bg-transparent border-transparent",
      )}>
        <div className="max-w-7xl mx-auto px-4 md:px-6 h-16 md:h-[72px] flex items-center gap-4">
          <Link href="/" className="flex items-center rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40" aria-label="ChainInsideIQ home" data-intro-logo>
            <Logo size={34} />
          </Link>

          <nav className="hidden lg:flex items-center gap-1 ml-6" aria-label="Main">
            {navLinks.map(link => {
              const active = location === link.href;
              return (
                <Link key={link.name} href={link.href} aria-current={active ? "page" : undefined}
                  className={cn("relative px-3.5 py-2 rounded-xl text-[14px] font-semibold transition-colors", active ? "text-slate-900" : "text-slate-500 hover:text-slate-900")}
                  data-testid={`nav-${link.name.toLowerCase()}`}>
                  {active && <motion.span layoutId="mk-nav" className="absolute inset-0 rounded-xl bg-slate-900/[0.06] dark:bg-white/[0.08]" transition={{ type: "spring", stiffness: 500, damping: 40 }} />}
                  <span className="relative">{link.name}</span>
                </Link>
              );
            })}
          </nav>

          <div className="ml-auto hidden lg:flex items-center gap-2">
            <ThemeToggle />
            {isAuthed ? (
              <Button className="font-semibold text-[14px] h-10 px-5 rounded-xl" data-testid="button-go-to-dashboard" asChild>
                <Link href="/plan">
                  <LayoutDashboard className="w-4 h-4 mr-1" /> Open the app
                </Link>
              </Button>
            ) : (
              <>
                <Button variant="ghost" className="font-semibold text-[14px] h-10 px-4 rounded-xl text-slate-600 hover:text-slate-900" data-testid="button-sign-in" asChild>
                  <Link href="/sign-in">Sign in</Link>
                </Button>
                <Button className="font-semibold text-[14px] h-10 px-5 rounded-xl bg-slate-900 text-white hover:bg-slate-800 dark:bg-teal-400 dark:text-slate-950 dark:hover:bg-teal-300" data-testid="button-get-started" asChild>
                  <Link href="/sign-up">
                    Get started <ArrowRight className="w-4 h-4" />
                  </Link>
                </Button>
              </>
            )}
          </div>

          <div className="ml-auto lg:hidden flex items-center gap-1">
            <ThemeToggle />
            <button className="w-10 h-10 rounded-xl flex items-center justify-center text-slate-700 hover:bg-slate-100" onClick={() => setMobileMenuOpen(!mobileMenuOpen)} aria-label={mobileMenuOpen ? "Close menu" : "Open menu"} aria-expanded={mobileMenuOpen}>
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        <AnimatePresence>
          {mobileMenuOpen && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
              className="lg:hidden overflow-hidden border-t border-slate-200/70"
            >
              <div className="flex flex-col p-4 gap-1">
                {navLinks.map((link, i) => (
                  <motion.div key={link.name} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.04 * i }}>
                    <Link href={link.href} className="block text-[16px] font-semibold text-slate-800 py-3 px-2 rounded-xl hover:bg-slate-100">
                      {link.name}
                    </Link>
                  </motion.div>
                ))}
                <div className="flex flex-col gap-2 pt-3">
                  {isAuthed ? (
                    <Button className="w-full font-semibold h-12 rounded-xl" asChild>
                      <Link href="/plan"><LayoutDashboard className="w-4 h-4 mr-1" /> Open the app</Link>
                    </Button>
                  ) : (
                    <>
                      <Button className="w-full font-semibold h-12 rounded-xl bg-slate-900 text-white dark:bg-teal-400 dark:text-slate-950" asChild>
                        <Link href="/sign-up">Get started <ArrowRight className="w-4 h-4" /></Link>
                      </Button>
                      <Button variant="outline" className="w-full font-semibold h-12 rounded-xl" asChild>
                        <Link href="/sign-in">Sign in</Link>
                      </Button>
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

      <footer className="relative isolate overflow-hidden mt-auto shrink-0 border-t border-slate-200/70 px-4 md:px-6 pt-16 pb-10">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-6 gap-10">
            <div className="col-span-2 md:col-span-3">
              <Logo size={36} />
              <p className="mt-4 text-[14.5px] text-slate-500 leading-relaxed max-w-sm">
                The AI business analyst that turns goals into plans, spots bottlenecks and helps you fix them with your partners.
              </p>
              <div className="mt-6 flex gap-2">
                {socialLinks.map(social => (
                  <a key={social.name} href={social.href} target="_blank" rel="noopener noreferrer" title={social.name} aria-label={social.name}
                    className="w-9 h-9 rounded-xl border border-slate-200 flex items-center justify-center text-slate-400 hover:text-primary hover:border-primary/40 transition-colors"
                    data-testid={`social-${social.name.toLowerCase().replace(/\s+/g, '-')}`}>
                    <social.icon className="w-4 h-4" />
                  </a>
                ))}
              </div>
            </div>
            <FooterCol title="Product" links={[["Features", "/features"], ["Pricing", "/pricing"], ["Live demo", "/demo"], ["Request setup", "/contact"]]} />
            <FooterCol title="Company" links={[["Contact", "/contact"], ["Support", "/support"], ["Privacy", "/privacy"], ["Terms", "/terms"]]} />
            <FooterCol title="Get started" links={isAuthed ? [["Growth Plan", "/plan"], ["AI Analyst", "/insights"], ["Dashboard", "/dashboard"]] : [["Start free trial", "/sign-up"], ["Sign in", "/sign-in"], ["Build my plan", "/onboarding"]]} />
          </div>
          <div className="mt-14 pt-6 border-t border-slate-200/70 flex flex-col sm:flex-row items-center justify-between gap-3 text-[13px] text-slate-400">
            <p>&copy; {new Date().getFullYear()} ChainInsideIQ. All rights reserved.</p>
            <p>Find the bottleneck. Fix it together.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}

function FooterCol({ title, links }: { title: string; links: [string, string][] }) {
  return (
    <div>
      <p className="text-[13px] font-semibold text-slate-900">{title}</p>
      <ul className="mt-4 space-y-3">
        {links.map(([label, href]) => (
          <li key={href + label}><Link href={href} className="text-[14px] text-slate-500 hover:text-slate-900 transition-colors">{label}</Link></li>
        ))}
      </ul>
    </div>
  );
}
