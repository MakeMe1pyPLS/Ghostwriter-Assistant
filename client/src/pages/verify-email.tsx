import { useState, useEffect } from "react";
import { useLocation, Link } from "wouter";
import { AuthLayout } from "@/components/auth/AuthLayout";
import { Button } from "@/components/ui/button";
import { useDashboardStore } from "@/hooks/use-dashboard-store";
import { useToast } from "@/hooks/use-toast";
import { Mail, CheckCircle2, ArrowRight, RefreshCw } from "lucide-react";

export default function VerifyEmailPage() {
  const [, setLocation] = useLocation();
  const { currentUser, verifyEmail } = useDashboardStore();
  const { toast } = useToast();
  const [resendCooldown, setResendCooldown] = useState(0);
  const [verifying, setVerifying] = useState(false);

  useEffect(() => {
    if (resendCooldown <= 0) return;
    const t = setTimeout(() => setResendCooldown(c => c - 1), 1000);
    return () => clearTimeout(t);
  }, [resendCooldown]);

  useEffect(() => {
    if (!currentUser) setLocation('/sign-in');
  }, [currentUser, setLocation]);

  if (!currentUser) return null;

  const handleResend = () => {
    setResendCooldown(30);
    toast({ title: "Verification email sent", description: `We re-sent a verification link to ${currentUser.email}.` });
  };

  const handleSimulateVerify = async () => {
    setVerifying(true);
    await new Promise(r => setTimeout(r, 800));
    verifyEmail();
    setVerifying(false);
    toast({ title: "Email verified", description: "Your workspace is now fully active." });
    setLocation('/welcome');
  };

  if (currentUser.emailVerified) {
    return (
      <AuthLayout title="You're all set" subtitle="Your email is verified and your workspace is fully active." side="verify">
        <div className="flex flex-col items-center text-center space-y-6 py-4">
          <div className="w-20 h-20 rounded-full bg-emerald-100 border border-emerald-200 flex items-center justify-center">
            <CheckCircle2 className="w-10 h-10 text-emerald-600" />
          </div>
          <div>
            <h3 className="text-xl font-black text-slate-900 mb-2">Email verified successfully</h3>
            <p className="text-sm text-slate-500">{currentUser.email}</p>
          </div>
          <Link href="/welcome" className="w-full">
            <Button className="w-full h-12 rounded-xl font-black uppercase tracking-widest text-xs" data-testid="button-continue">
              Continue to Workspace <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </Link>
        </div>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout
      title="Check your email"
      subtitle="We sent a verification link so we can keep your workspace and data secure."
      side="verify"
    >
      <div className="space-y-6" data-testid="verify-email-pending">
        <div className="rounded-2xl border border-slate-200 bg-slate-50/50 p-6 text-center">
          <div className="w-16 h-16 rounded-2xl bg-white border border-slate-200 mx-auto flex items-center justify-center mb-4 shadow-sm">
            <Mail className="w-7 h-7 text-primary" />
          </div>
          <p className="text-xs font-black uppercase tracking-widest text-slate-400 mb-1">Sent to</p>
          <p className="text-sm font-black text-slate-900" data-testid="text-email">{currentUser.email}</p>
        </div>

        <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">
          <p className="text-xs text-amber-800 font-semibold leading-relaxed">
            Your 14-day trial has already started. You can keep exploring while you verify — but verification unlocks exports, sharing, and sign-in from new devices.
          </p>
        </div>

        <Button
          onClick={handleSimulateVerify}
          disabled={verifying}
          className="w-full h-12 rounded-xl font-black uppercase tracking-widest text-xs shadow-lg shadow-primary/20"
          data-testid="button-verify"
        >
          {verifying ? "Verifying..." : <>I&apos;ve Verified My Email <ArrowRight className="w-4 h-4 ml-2" /></>}
        </Button>

        <div className="flex items-center justify-between text-xs">
          <button
            onClick={handleResend}
            disabled={resendCooldown > 0}
            className="flex items-center gap-1.5 text-primary font-bold hover:underline disabled:text-slate-400 disabled:no-underline"
            data-testid="button-resend"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            {resendCooldown > 0 ? `Resend in ${resendCooldown}s` : "Resend verification email"}
          </button>
          <Link href="/welcome" className="text-slate-400 font-bold hover:text-slate-700" data-testid="link-skip">
            Skip for now
          </Link>
        </div>
      </div>
    </AuthLayout>
  );
}
