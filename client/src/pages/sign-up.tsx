import { useState, useMemo } from "react";
import { Link, useLocation } from "wouter";
import { AuthLayout } from "@/components/auth/AuthLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useDashboardStore } from "@/hooks/use-dashboard-store";
import { useToast } from "@/hooks/use-toast";
import { ArrowRight, Eye, EyeOff, AlertCircle, Check } from "lucide-react";
import { cn } from "@/lib/utils";

function passwordStrength(pw: string) {
  let score = 0;
  if (pw.length >= 8) score++;
  if (/[A-Z]/.test(pw)) score++;
  if (/[0-9]/.test(pw)) score++;
  if (/[^A-Za-z0-9]/.test(pw)) score++;
  return score;
}

export default function SignUpPage() {
  const [, setLocation] = useLocation();
  const { signUp } = useDashboardStore();
  const { toast } = useToast();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [agreed, setAgreed] = useState(false);

  const strength = useMemo(() => passwordStrength(password), [password]);
  const strengthLabel = ["Too weak", "Weak", "Okay", "Strong", "Excellent"][strength];
  const strengthColor = ["bg-rose-400", "bg-rose-400", "bg-amber-400", "bg-emerald-400", "bg-emerald-500"][strength];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!fullName.trim() || fullName.trim().split(/\s+/).length < 2) {
      setError("Please enter your full name (first and last).");
      return;
    }
    if (!email || !email.includes('@')) {
      setError("Please enter a valid work email.");
      return;
    }
    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }
    if (password !== confirm) {
      setError("Passwords do not match.");
      return;
    }
    if (!agreed) {
      setError("Please agree to the Terms and Privacy Policy.");
      return;
    }

    setSubmitting(true);
    await new Promise(r => setTimeout(r, 700));
    signUp({ fullName: fullName.trim(), email, password });
    setSubmitting(false);

    toast({
      title: "Account created — your trial just started.",
      description: "Check your email to verify your address.",
    });
    setLocation('/verify-email');
  };

  return (
    <AuthLayout
      title="Start your 14-day free trial"
      subtitle="No credit card required. Get full access to dashboards, AI Analyst Mode, and exports."
      side="signup"
    >
      <form onSubmit={handleSubmit} className="space-y-5" data-testid="form-sign-up">
        <div role="alert" aria-live="polite" className={error ? "" : "sr-only"}>
          {error && (
            <div className="flex items-start gap-2 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-bold" data-testid="text-error">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="fullName" className="text-xs font-black uppercase tracking-widest text-slate-700">Full Name</Label>
          <Input
            id="fullName"
            type="text"
            value={fullName}
            onChange={e => setFullName(e.target.value)}
            placeholder="Alex Chen"
            autoComplete="name"
            required
            className="h-12 rounded-xl border-slate-200 focus-visible:ring-primary"
            data-testid="input-full-name"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="email" className="text-xs font-black uppercase tracking-widest text-slate-700">Work Email</Label>
          <Input
            id="email"
            type="email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            placeholder="alex@company.com"
            autoComplete="email"
            required
            className="h-12 rounded-xl border-slate-200 focus-visible:ring-primary"
            data-testid="input-email"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="password" className="text-xs font-black uppercase tracking-widest text-slate-700">Password</Label>
          <div className="relative">
            <Input
              id="password"
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="At least 8 characters"
              autoComplete="new-password"
              required
              className="h-12 rounded-xl border-slate-200 pr-11 focus-visible:ring-primary"
              data-testid="input-password"
            />
            <button
              type="button"
              onClick={() => setShowPassword(s => !s)}
              aria-label={showPassword ? "Hide password" : "Show password"}
              aria-pressed={showPassword}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700"
              data-testid="button-toggle-password"
            >
              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
          {password && (
            <div className="space-y-1.5">
              <div className="flex gap-1">
                {[0, 1, 2, 3].map(i => (
                  <div
                    key={i}
                    className={cn("h-1 flex-1 rounded-full transition-colors", i < strength ? strengthColor : "bg-slate-200")}
                  />
                ))}
              </div>
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">{strengthLabel}</p>
            </div>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="confirm" className="text-xs font-black uppercase tracking-widest text-slate-700">Confirm Password</Label>
          <Input
            id="confirm"
            type={showPassword ? "text" : "password"}
            value={confirm}
            onChange={e => setConfirm(e.target.value)}
            placeholder="Re-enter your password"
            autoComplete="new-password"
            required
            className="h-12 rounded-xl border-slate-200 focus-visible:ring-primary"
            data-testid="input-confirm"
          />
        </div>

        <label className="flex items-start gap-2.5 cursor-pointer" data-testid="checkbox-terms-label">
          <input
            type="checkbox"
            checked={agreed}
            onChange={e => setAgreed(e.target.checked)}
            className="mt-1 w-4 h-4 rounded border-slate-300 text-primary focus:ring-primary"
            data-testid="checkbox-terms"
          />
          <span className="text-xs text-slate-600 leading-relaxed">
            I agree to the{" "}
            <Link href="/terms" className="text-primary font-bold hover:underline">Terms of Service</Link>{" "}
            and{" "}
            <Link href="/privacy" className="text-primary font-bold hover:underline">Privacy Policy</Link>.
          </span>
        </label>

        <Button
          type="submit"
          disabled={submitting}
          className="w-full h-12 rounded-xl font-black uppercase tracking-widest text-xs shadow-lg shadow-primary/20"
          data-testid="button-submit-sign-up"
        >
          {submitting ? "Creating your workspace..." : <>Create Account <ArrowRight className="w-4 h-4 ml-2" /></>}
        </Button>

        <div className="grid grid-cols-3 gap-2 text-[10px] font-bold text-slate-500 uppercase tracking-widest text-center">
          <div className="flex items-center justify-center gap-1"><Check className="w-3 h-3 text-emerald-500" /> 14-Day Trial</div>
          <div className="flex items-center justify-center gap-1"><Check className="w-3 h-3 text-emerald-500" /> No Card</div>
          <div className="flex items-center justify-center gap-1"><Check className="w-3 h-3 text-emerald-500" /> Cancel Anytime</div>
        </div>

        <p className="text-center text-xs text-slate-500 font-medium">
          Already have an account?{" "}
          <Link href="/sign-in" className="text-primary font-bold hover:underline" data-testid="link-sign-in">
            Sign in
          </Link>
        </p>
      </form>
    </AuthLayout>
  );
}
