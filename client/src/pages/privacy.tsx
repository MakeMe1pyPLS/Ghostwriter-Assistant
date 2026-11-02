import { MarketingLayout } from "@/components/layout/MarketingLayout";
import { Shield } from "lucide-react";

export default function PrivacyPage() {
  return (
    <MarketingLayout>
      <div className="bg-white">
        <section className="py-20 md:py-28 px-4 md:px-6 bg-[#F4F7FA]">
          <div className="max-w-3xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-4 py-2 rounded-full mb-6">
              <Shield className="w-4 h-4" />
              <span className="text-xs font-black uppercase tracking-widest">Legal</span>
            </div>
            <h1 className="text-4xl md:text-5xl font-black text-slate-900 tracking-tighter mb-4">Privacy Policy</h1>
            <p className="text-slate-500">Last updated: October 2026</p>
          </div>
        </section>

        <section className="py-16 px-4 md:px-6">
          <div className="max-w-3xl mx-auto prose prose-slate prose-sm">
            <div className="space-y-10">
              <div>
                <h2 className="text-xl font-black text-slate-900 mb-3">1. Introduction</h2>
                <p className="text-slate-600 leading-relaxed">ChainInsideIQ ("we", "our", "us") is committed to protecting the privacy and security of our users. This Privacy Policy describes how we collect, use, store, and share information when you use our platform, website, and related services.</p>
              </div>
              <div>
                <h2 className="text-xl font-black text-slate-900 mb-3">2. Information We Collect</h2>
                <p className="text-slate-600 leading-relaxed mb-3">We may collect the following types of information:</p>
                <ul className="list-disc pl-6 text-slate-600 space-y-2">
                  <li><strong>Account Information:</strong> Name, email address, company name, and billing details when you create an account.</li>
                  <li><strong>Usage Data:</strong> Dashboard configurations, export history, feature usage patterns, and session analytics.</li>
                  <li><strong>Uploaded Data:</strong> Datasets, CSV files, and custom data you import into the platform for dashboard generation.</li>
                  <li><strong>Technical Data:</strong> IP address, browser type, device information, and cookies for service optimization.</li>
                </ul>
              </div>
              <div>
                <h2 className="text-xl font-black text-slate-900 mb-3">3. How We Use Your Information</h2>
                <ul className="list-disc pl-6 text-slate-600 space-y-2">
                  <li>To provide, maintain, and improve the ChainInsideIQ platform and services.</li>
                  <li>To process your dashboard exports and AI analysis requests.</li>
                  <li>To communicate with you about your account, updates, and support inquiries.</li>
                  <li>To analyze usage patterns and improve user experience.</li>
                  <li>To comply with legal obligations and enforce our terms.</li>
                </ul>
              </div>
              <div>
                <h2 className="text-xl font-black text-slate-900 mb-3">4. Data Security</h2>
                <p className="text-slate-600 leading-relaxed mb-3">Connections to ChainInsideIQ are encrypted with HTTPS.</p>
                <ul className="list-disc pl-6 text-slate-600 space-y-2">
                  <li><strong>With an account:</strong> your account details and workspace data (growth plans, actions, consult sessions, client workspaces, collabs, imported datasets and dashboards) are stored in our database, hosted by Supabase in the United States. Database rules make sure each account can only read and change its own data. Passwords are handled by Supabase Auth and are never stored in plain text. A copy is also kept in your browser so the app is fast and works offline; signing out removes that copy from the browser.</li>
                  <li><strong>Without an account</strong> (for example in the demo): your workspace data stays in your browser on your device, and clearing your browser data removes it.</li>
                </ul>
              </div>
              <div>
                <h2 className="text-xl font-black text-slate-900 mb-3">5. Data Retention</h2>
                <p className="text-slate-600 leading-relaxed">We retain your data for as long as your account is active or as needed to provide services. You may request deletion of your data at any time by contacting Laishon.dev@gmail.com.</p>
              </div>
              <div>
                <h2 className="text-xl font-black text-slate-900 mb-3">6. Third-Party Sharing</h2>
                <p className="text-slate-600 leading-relaxed">We do not sell your personal data. We share data with service providers who help operate the platform: Vercel (website hosting) and Supabase (accounts and database). When you use AI features, the relevant business metrics, plan details and your question are sent to the AI provider selected for that request (Anthropic, OpenAI or Google) to generate a response; their handling of that data is governed by their own terms and policies. If you connect Microsoft Teams, Google Chat or Slack, the messages you choose to send are delivered to that service.</p>
              </div>
              <div>
                <h2 className="text-xl font-black text-slate-900 mb-3">7. Your Rights</h2>
                <p className="text-slate-600 leading-relaxed">You have the right to access, correct, export, or delete your personal data. For GDPR/CCPA requests, contact us at Laishon.dev@gmail.com.</p>
              </div>
              <div>
                <h2 className="text-xl font-black text-slate-900 mb-3">8. Contact</h2>
                <p className="text-slate-600 leading-relaxed">For questions about this policy, contact us at Laishon.dev@gmail.com or via our Contact page.</p>
              </div>
            </div>
          </div>
        </section>
      </div>
    </MarketingLayout>
  );
}