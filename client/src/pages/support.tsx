import { MarketingLayout } from "@/components/layout/MarketingLayout";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { Mail, MessageCircle, BookOpen, Headphones, ArrowRight, ChevronDown, ChevronUp, HelpCircle, Zap } from "lucide-react";
import { useState } from "react";

const faqs = [
  { q: "How do I get started with ChainInsideIQ?", a: "Start by signing up for a 14-day free trial. You can immediately access the Dashboard Builder, import your data, and begin generating insights. No credit card required." },
  { q: "Can I import my own datasets?", a: "Yes. You can upload CSV files, paste JSON data, or connect to supported data sources. The platform will automatically detect column types and map them to the appropriate KPIs." },
  { q: "What export formats are supported?", a: "ChainInsideIQ supports Excel (.xlsx), CSV, JSON, Power BI, Tableau, PDF reports, and PowerPoint presentations. You can also use our Custom API to push data to your own systems." },
  { q: "Is the AI analysis powered by real machine learning?", a: "The current demo uses a sophisticated rule-based engine calibrated against real supply chain benchmarks. Our production tier integrates with advanced AI models for deeper predictive analytics." },
  { q: "How does the pricing work?", a: "We offer three tiers: Starter ($49/mo), Professional ($99/mo), and Enterprise (custom). All plans include a 14-day free trial. See our Pricing page for full details." },
  { q: "Can multiple team members use the same account?", a: "Yes. Professional plans include up to 10 users, and Enterprise plans support unlimited team members with role-based access controls." },
  { q: "Do you offer onboarding or setup assistance?", a: "Absolutely. We offer guided onboarding sessions for Professional and Enterprise customers. You can also request a custom setup through our Contact page." },
  { q: "Is my data secure?", a: "Yes. All data is encrypted in transit and at rest. We follow SOC 2 Type II compliance standards and never share your data with third parties. See our Privacy Policy for details." }
];

function FAQItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border border-slate-200 rounded-2xl bg-white overflow-hidden transition-all">
      <button onClick={() => setOpen(!open)} className="w-full flex items-center justify-between p-5 text-left gap-4 hover:bg-slate-50 transition-colors" data-testid={`faq-toggle-${q.slice(0, 20)}`}>
        <span className="text-sm font-bold text-slate-900">{q}</span>
        {open ? <ChevronUp className="w-4 h-4 text-slate-400 shrink-0" /> : <ChevronDown className="w-4 h-4 text-slate-400 shrink-0" />}
      </button>
      {open && (
        <div className="px-5 pb-5 border-t border-slate-100">
          <p className="text-sm text-slate-600 leading-relaxed pt-4">{a}</p>
        </div>
      )}
    </div>
  );
}

export default function SupportPage() {
  return (
    <MarketingLayout>
      <div className="bg-white">
        <section className="py-20 md:py-28 px-4 md:px-6">
          <div className="max-w-4xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-4 py-2 rounded-full mb-6">
              <Headphones className="w-4 h-4" />
              <span className="text-xs font-black uppercase tracking-widest">Support Center</span>
            </div>
            <h1 className="text-4xl md:text-5xl font-black text-slate-900 tracking-tighter mb-6">How can we help?</h1>
            <p className="text-lg text-slate-500 max-w-2xl mx-auto leading-relaxed">
              Get answers to common questions, reach our support team, or request a personalized setup for your organization.
            </p>
          </div>
        </section>

        <section className="py-16 px-4 md:px-6 bg-[#F4F7FA]">
          <div className="max-w-5xl mx-auto grid md:grid-cols-3 gap-6">
            {[
              { icon: Mail, title: "Email Support", desc: "Reach our team directly for technical questions or account issues.", action: "support@chaininsideiq.com", color: "text-primary bg-primary/10 border-primary/20" },
              { icon: MessageCircle, title: "Live Chat", desc: "Chat with our AI assistant or connect with a human agent during business hours.", action: "Available 9am-6pm EST", color: "text-indigo-600 bg-indigo-50 border-indigo-100" },
              { icon: BookOpen, title: "Documentation", desc: "Browse our guides, API docs, and video tutorials to get the most out of the platform.", action: "Coming Soon", color: "text-amber-600 bg-amber-50 border-amber-100" }
            ].map((item, i) => (
              <div key={i} className="bg-white rounded-2xl border border-slate-200 p-8 text-center shadow-sm hover:shadow-md transition-shadow">
                <div className={`w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-5 border ${item.color}`}>
                  <item.icon className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-black text-slate-900 mb-2">{item.title}</h3>
                <p className="text-sm text-slate-500 leading-relaxed mb-4">{item.desc}</p>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">{item.action}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="py-20 px-4 md:px-6">
          <div className="max-w-3xl mx-auto">
            <div className="flex items-center gap-3 mb-8">
              <HelpCircle className="w-5 h-5 text-primary" />
              <h2 className="text-2xl font-black text-slate-900 tracking-tight">Frequently Asked Questions</h2>
            </div>
            <div className="space-y-3">
              {faqs.map((faq, i) => <FAQItem key={i} q={faq.q} a={faq.a} />)}
            </div>
          </div>
        </section>

        <section className="py-16 px-4 md:px-6 bg-slate-900 text-white">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-3xl font-black tracking-tighter mb-4">Still need help?</h2>
            <p className="text-slate-400 mb-8 max-w-xl mx-auto">Our team is ready to assist you with custom onboarding, enterprise setup, or any technical questions.</p>
            <div className="flex flex-wrap justify-center gap-4">
              <Link href="/contact">
                <Button className="h-12 px-6 rounded-xl font-black text-xs uppercase tracking-widest shadow-lg shadow-primary/20">
                  <Mail className="w-4 h-4 mr-2" /> Contact Sales
                </Button>
              </Link>
              <Link href="/contact">
                <Button variant="outline" className="h-12 px-6 rounded-xl font-black text-xs uppercase tracking-widest border-slate-700 text-white hover:bg-slate-800 hover:text-white">
                  Request Setup <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </Link>
              <Link href="/builder">
                <Button variant="outline" className="h-12 px-6 rounded-xl font-black text-xs uppercase tracking-widest border-slate-700 text-white hover:bg-slate-800 hover:text-white">
                  <Zap className="w-4 h-4 mr-2" /> Try Demo
                </Button>
              </Link>
            </div>
          </div>
        </section>
      </div>
    </MarketingLayout>
  );
}