import { MarketingLayout } from "@/components/layout/MarketingLayout";
import { FileText } from "lucide-react";

export default function TermsPage() {
  return (
    <MarketingLayout>
      <div className="bg-white">
        <section className="py-20 md:py-28 px-4 md:px-6 bg-[#F4F7FA]">
          <div className="max-w-3xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-4 py-2 rounded-full mb-6">
              <FileText className="w-4 h-4" />
              <span className="text-xs font-black uppercase tracking-widest">Legal</span>
            </div>
            <h1 className="text-4xl md:text-5xl font-black text-slate-900 tracking-tighter mb-4">Terms of Service</h1>
            <p className="text-slate-500">Last updated: March 2026</p>
          </div>
        </section>

        <section className="py-16 px-4 md:px-6">
          <div className="max-w-3xl mx-auto prose prose-slate prose-sm">
            <div className="space-y-10">
              <div>
                <h2 className="text-xl font-black text-slate-900 mb-3">1. Acceptance of Terms</h2>
                <p className="text-slate-600 leading-relaxed">By accessing or using ChainInsideIQ ("the Platform"), you agree to be bound by these Terms of Service. If you do not agree to these terms, do not use the Platform.</p>
              </div>
              <div>
                <h2 className="text-xl font-black text-slate-900 mb-3">2. Description of Service</h2>
                <p className="text-slate-600 leading-relaxed">ChainInsideIQ is an AI-powered dashboard generator platform that enables users to create, customize, analyze, and export supply chain operational dashboards across multiple formats and BI tools.</p>
              </div>
              <div>
                <h2 className="text-xl font-black text-slate-900 mb-3">3. Account Registration</h2>
                <p className="text-slate-600 leading-relaxed">You must provide accurate and complete information when creating an account. You are responsible for maintaining the security of your account credentials and for all activities that occur under your account.</p>
              </div>
              <div>
                <h2 className="text-xl font-black text-slate-900 mb-3">4. Subscription & Billing</h2>
                <p className="text-slate-600 leading-relaxed">Paid plans are billed monthly or annually. All plans include a 14-day free trial period. You may cancel your subscription at any time. Refunds are handled in accordance with our refund policy.</p>
              </div>
              <div>
                <h2 className="text-xl font-black text-slate-900 mb-3">5. Acceptable Use</h2>
                <p className="text-slate-600 leading-relaxed mb-3">You agree not to:</p>
                <ul className="list-disc pl-6 text-slate-600 space-y-2">
                  <li>Use the Platform for any unlawful purpose.</li>
                  <li>Attempt to gain unauthorized access to any part of the Platform.</li>
                  <li>Reverse engineer, decompile, or disassemble any part of the service.</li>
                  <li>Upload malicious content or data designed to disrupt the service.</li>
                  <li>Resell or redistribute the Platform without prior written consent.</li>
                </ul>
              </div>
              <div>
                <h2 className="text-xl font-black text-slate-900 mb-3">6. Intellectual Property</h2>
                <p className="text-slate-600 leading-relaxed">All content, features, and functionality of the Platform are owned by ChainInsideIQ and are protected by intellectual property laws. Your uploaded data remains your property.</p>
              </div>
              <div>
                <h2 className="text-xl font-black text-slate-900 mb-3">7. Data & Privacy</h2>
                <p className="text-slate-600 leading-relaxed">Your use of the Platform is also governed by our Privacy Policy. We are committed to protecting your data and maintaining the highest standards of data security.</p>
              </div>
              <div>
                <h2 className="text-xl font-black text-slate-900 mb-3">8. Limitation of Liability</h2>
                <p className="text-slate-600 leading-relaxed">ChainInsideIQ shall not be liable for any indirect, incidental, special, or consequential damages arising out of or in connection with your use of the Platform.</p>
              </div>
              <div>
                <h2 className="text-xl font-black text-slate-900 mb-3">9. Modifications</h2>
                <p className="text-slate-600 leading-relaxed">We reserve the right to modify these Terms at any time. Continued use of the Platform after changes constitutes acceptance of the updated terms.</p>
              </div>
              <div>
                <h2 className="text-xl font-black text-slate-900 mb-3">10. Contact</h2>
                <p className="text-slate-600 leading-relaxed">For questions about these terms, contact us at legal@chaininsideiq.com.</p>
              </div>
            </div>
          </div>
        </section>
      </div>
    </MarketingLayout>
  );
}