import { Link, useLocation } from "wouter";
import { useDashboardStore, getTrialStatus } from "@/hooks/use-dashboard-store";
import {
  DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuLabel, DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { User, LogOut, Settings, CreditCard, ChevronUp, Sparkles, ShieldCheck, Mail } from "lucide-react";
import { cn } from "@/lib/utils";

function getInitials(name: string) {
  return name.split(/\s+/).filter(Boolean).slice(0, 2).map(p => p[0]?.toUpperCase()).join('') || 'U';
}

export function AccountDropdown() {
  const [, setLocation] = useLocation();
  const { currentUser, signOut } = useDashboardStore();
  const trial = getTrialStatus(currentUser);

  if (!currentUser) {
    return (
      <Link
        href="/sign-in"
        className="flex items-center gap-3 px-4 py-3 rounded-xl bg-slate-900 text-white hover:bg-slate-800 transition-all"
        data-testid="link-sign-in-sidebar"
      >
        <User className="w-4 h-4" />
        <span className="text-xs font-black uppercase tracking-widest">Sign In</span>
      </Link>
    );
  }

  const planLabel = currentUser.plan === 'trial' ? 'Free Trial' : currentUser.plan.charAt(0).toUpperCase() + currentUser.plan.slice(1);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          data-testid="button-account-dropdown"
          className="w-full flex items-center gap-3 p-2.5 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200 transition-all group text-left"
        >
          <div className="w-9 h-9 rounded-lg bg-slate-900 text-primary flex items-center justify-center shrink-0 font-black text-xs uppercase tracking-tighter">
            {getInitials(currentUser.fullName)}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5">
              <p className="text-xs font-black text-slate-900 truncate uppercase tracking-tight" data-testid="text-account-name">
                {currentUser.fullName}
              </p>
              {currentUser.emailVerified && (
                <ShieldCheck className="w-3 h-3 text-emerald-500 shrink-0" />
              )}
            </div>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className={cn(
                "text-[8px] font-black uppercase tracking-widest px-1.5 py-0.5 rounded",
                currentUser.plan === 'trial'
                  ? "bg-amber-100 text-amber-700 border border-amber-200"
                  : "bg-emerald-100 text-emerald-700 border border-emerald-200"
              )} data-testid="badge-plan">
                {planLabel}
              </span>
              {trial.active && (
                <span className="text-[9px] font-bold text-slate-500" data-testid="text-trial-days">
                  {trial.daysRemaining}d left
                </span>
              )}
            </div>
          </div>
          <ChevronUp className="w-3.5 h-3.5 text-slate-400 group-hover:text-slate-700 shrink-0" />
        </button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" side="top" className="w-64 mb-2">
        <DropdownMenuLabel className="font-normal">
          <div className="flex flex-col space-y-1">
            <p className="text-sm font-bold text-slate-900">{currentUser.fullName}</p>
            <p className="text-xs text-slate-500 truncate">{currentUser.email}</p>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />

        {!currentUser.emailVerified && (
          <>
            <DropdownMenuItem
              onClick={() => setLocation('/verify-email')}
              className="cursor-pointer"
              data-testid="menu-verify-email"
            >
              <Mail className="w-4 h-4 mr-2 text-amber-600" />
              <span className="text-amber-700 font-semibold">Verify your email</span>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
          </>
        )}

        {trial.active && (
          <>
            <div className="px-2 py-2">
              <div className="bg-gradient-to-br from-amber-50 to-orange-50 border border-amber-200 rounded-lg p-2.5">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-[10px] font-black uppercase tracking-widest text-amber-700">Trial</span>
                  <span className="text-[10px] font-black text-amber-700">{trial.daysRemaining} / {trial.totalDays}d</span>
                </div>
                <div className="h-1.5 bg-amber-200/50 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-amber-500 rounded-full transition-all"
                    style={{ width: `${(trial.daysRemaining / trial.totalDays) * 100}%` }}
                  />
                </div>
                <Link href="/pricing">
                  <button className="w-full mt-2 text-[10px] font-black uppercase tracking-widest bg-slate-900 text-white py-1.5 rounded-md hover:bg-slate-800 transition-colors flex items-center justify-center gap-1.5">
                    <Sparkles className="w-3 h-3" />
                    Upgrade Plan
                  </button>
                </Link>
              </div>
            </div>
            <DropdownMenuSeparator />
          </>
        )}

        <DropdownMenuItem onClick={() => setLocation('/settings')} className="cursor-pointer" data-testid="menu-settings">
          <Settings className="w-4 h-4 mr-2" />
          Account & Settings
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => setLocation('/pricing')} className="cursor-pointer" data-testid="menu-billing">
          <CreditCard className="w-4 h-4 mr-2" />
          Billing & Plan
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => setLocation('/welcome')} className="cursor-pointer" data-testid="menu-tutorial">
          <Sparkles className="w-4 h-4 mr-2" />
          Restart Tutorial
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onClick={() => { signOut(); setLocation('/'); }}
          className="cursor-pointer text-rose-600 focus:text-rose-700"
          data-testid="menu-sign-out"
        >
          <LogOut className="w-4 h-4 mr-2" />
          Sign Out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
