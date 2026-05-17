import { useState } from "react";
import { Link, useLocation } from "wouter";
import { AuthLayout } from "@/components/auth/AuthLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useDashboardStore } from "@/hooks/use-dashboard-store";
import { useToast } from "@/hooks/use-toast";
import { ArrowRight, Eye, EyeOff, AlertCircle } from "lucide-react";

export default function SignInPage() {
  const [, setLocation] = useLocation();
  const { signIn } = useDashboardStore();
  const { toast } = useToast();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!email || !email.includes('@')) {
      setError("Please enter a valid email address.");
      return;
    }
    if (!password || password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }

    setSubmitting(true);
    await new Promise(r => setTimeout(r, 600));
    const user = signIn({ email, password });
    setSubmitting(false);

    toast({ title: `Welcome back, ${user.fullName.split(' ')[0]}`, description: "You're signed in." });
    setLocation('/dashboard');
  };

  return (
    <AuthLayout
      title="Sign in to your workspace"
      subtitle="Pick up exactly where you left off — your dashboards, sectors, and saved analyses are waiting."
      side="signin"
    >
      <form onSubmit={handleSubmit} className="space-y-5" data-testid="form-sign-in">
        <div role="alert" aria-live="polite" className={error ? "" : "sr-only"}>
          {error && (
            <div className="flex items-start gap-2 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-bold" data-testid="text-error">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="email" className="text-xs font-black uppercase tracking-widest text-slate-700">Work Email</Label>
          <Input
            id="email"
            type="email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            placeholder="you@company.com"
            autoComplete="email"
            required
            aria-invalid={!!error && (!email || !email.includes('@'))}
            className="h-12 rounded-xl border-slate-200 focus-visible:ring-primary"
            data-testid="input-email"
          />
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="password" className="text-xs font-black uppercase tracking-widest text-slate-700">Password</Label>
            <button
              type="button"
              onClick={() => toast({ title: "Password recovery", description: "Email reset is coming soon — contact support to recover access." })}
              className="text-[10px] font-bold text-primary uppercase tracking-widest hover:underline"
              data-testid="link-forgot"
            >
              Forgot password?
            </button>
          </div>
          <div className="relative">
            <Input
              id="password"
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="Enter your password"
              autoComplete="current-password"
              required
              aria-invalid={!!error && (!password || password.length < 6)}
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
        </div>

        <Button
          type="submit"
          disabled={submitting}
          className="w-full h-12 rounded-xl font-black uppercase tracking-widest text-xs shadow-lg shadow-primary/20"
          data-testid="button-submit-sign-in"
        >
          {submitting ? "Signing in..." : <>Sign In <ArrowRight className="w-4 h-4 ml-2" /></>}
        </Button>

        <p className="text-center text-xs text-slate-500 font-medium">
          New to ChainInsideIQ?{" "}
          <Link href="/sign-up" className="text-primary font-bold hover:underline" data-testid="link-sign-up">
            Create an account
          </Link>
        </p>
      </form>
    </AuthLayout>
  );
}
