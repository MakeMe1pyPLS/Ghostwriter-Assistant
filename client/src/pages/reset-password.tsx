// Landing page for the "reset your password" email link. The link signs the
// person in for this one purpose; here they choose a new password.
import { useEffect, useState } from "react";
import { Link, useLocation } from "wouter";
import { AuthLayout } from "@/components/auth/AuthLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useDashboardStore } from "@/hooks/use-dashboard-store";
import { useGrowthStore } from "@/hooks/use-growth-store";
import { AlertCircle, ArrowRight, Eye, EyeOff } from "lucide-react";
import { cloudEnabled, getSession, updatePassword, CloudError, friendly } from "@/lib/supabase";
import { takeAuthResult } from "@/lib/cloud-sync";

export default function ResetPasswordPage() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const currentUser = useDashboardStore((s) => s.currentUser);
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [show, setShow] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(() => takeAuthResult()?.error ?? null);

  useEffect(() => {
    const on = () => { const r = takeAuthResult(); if (r?.error) setError(r.error); };
    window.addEventListener("ciq-auth-result", on);
    return () => window.removeEventListener("ciq-auth-result", on);
  }, []);

  const hasSession = cloudEnabled && (!!currentUser || !!getSession());

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (password.length < 8) { setError("Password must be at least 8 characters."); return; }
    if (password !== confirm) { setError("Passwords do not match."); return; }
    setSaving(true);
    try {
      await updatePassword(password);
      toast({ title: "Password updated", description: "You're signed in with your new password." });
      setLocation(useGrowthStore.getState().onboardingComplete ? "/plan" : "/onboarding");
    } catch (err) {
      setError(err instanceof CloudError ? friendly(err) : "Couldn’t update your password. Try again.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <AuthLayout title="Choose a new password" subtitle="Pick something you don’t use on other sites." side="signin">
      {!hasSession ? (
        <div className="space-y-5" data-testid="reset-no-session">
          <div className="flex items-start gap-2 p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-xs font-bold">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{error ?? "Open the reset link from your email on this device to set a new password. Links expire after a short time."}</span>
          </div>
          <Button variant="outline" className="w-full h-12 rounded-xl font-bold" asChild>
            <Link href="/sign-in">Back to sign in</Link>
          </Button>
        </div>
      ) : (
        <form onSubmit={submit} className="space-y-5" data-testid="form-reset-password">
          {error && (
            <div className="flex items-start gap-2 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-bold" role="alert">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" /><span>{error}</span>
            </div>
          )}
          <div className="space-y-2">
            <Label htmlFor="new-password" className="text-xs font-black uppercase tracking-widest text-slate-700">New password</Label>
            <div className="relative">
              <Input id="new-password" type={show ? "text" : "password"} value={password} onChange={(e) => setPassword(e.target.value)}
                autoComplete="new-password" placeholder="At least 8 characters" className="h-12 rounded-xl pr-11" required />
              <button type="button" onClick={() => setShow((s) => !s)} aria-label={show ? "Hide password" : "Show password"}
                className="absolute right-1 top-1/2 -translate-y-1/2 w-10 h-10 flex items-center justify-center text-slate-400 hover:text-slate-700">
                {show ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="confirm-password" className="text-xs font-black uppercase tracking-widest text-slate-700">Confirm password</Label>
            <Input id="confirm-password" type={show ? "text" : "password"} value={confirm} onChange={(e) => setConfirm(e.target.value)}
              autoComplete="new-password" className="h-12 rounded-xl" required />
          </div>
          <Button type="submit" disabled={saving} className="w-full h-12 rounded-xl font-black uppercase tracking-widest text-xs" data-testid="button-save-password">
            {saving ? "Saving…" : <>Save new password <ArrowRight className="w-4 h-4 ml-2" /></>}
          </Button>
        </form>
      )}
    </AuthLayout>
  );
}
