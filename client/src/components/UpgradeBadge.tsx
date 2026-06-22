import { Link } from "wouter";
import { Lock, ArrowUpRight } from "lucide-react";
import { useDashboardStore } from "@/hooks/use-dashboard-store";
import { hasPlan, getFeatureRequirement, type FeatureKey } from "@/lib/pricing";

/**
 * Cosmetic upsell badge. Renders nothing when the current plan already unlocks
 * the feature (including demo/trial). Otherwise shows a small pill linking to the
 * pricing page pre-focused on the required tier. Never blocks the underlying UI.
 */
export function UpgradeBadge({ feature, className = "" }: { feature: FeatureKey; className?: string }) {
  const currentUser = useDashboardStore((s) => s.currentUser);

  if (hasPlan(currentUser?.plan, feature)) return null;

  const req = getFeatureRequirement(feature);

  return (
    <Link href={`/pricing?plan=${req.plan}`}>
      <span
        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-50 text-amber-700 border border-amber-200 text-[10px] font-black uppercase tracking-widest hover:bg-amber-100 transition-colors cursor-pointer ${className}`}
        data-testid={`badge-upgrade-${feature}`}
      >
        <Lock className="w-3 h-3" />
        {req.label} feature
        <ArrowUpRight className="w-3 h-3" />
      </span>
    </Link>
  );
}

/**
 * Larger soft banner for a gated page. Renders nothing when unlocked.
 */
export function UpgradeBanner({ feature }: { feature: FeatureKey }) {
  const currentUser = useDashboardStore((s) => s.currentUser);

  if (hasPlan(currentUser?.plan, feature)) return null;

  const req = getFeatureRequirement(feature);

  return (
    <div
      className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-2xl border border-amber-200 bg-amber-50/70 px-4 py-3.5"
      data-testid={`banner-upgrade-${feature}`}
    >
      <div className="flex items-start gap-3">
        <div className="w-8 h-8 rounded-xl bg-amber-100 border border-amber-200 flex items-center justify-center shrink-0">
          <Lock className="w-4 h-4 text-amber-700" />
        </div>
        <div>
          <p className="text-xs font-black text-amber-900 uppercase tracking-wider">{req.label} plan feature</p>
          <p className="text-xs font-medium text-amber-800/80 mt-0.5 leading-relaxed">
            You're previewing this feature. Upgrade to {req.label} to use it with your live data and team.
          </p>
        </div>
      </div>
      <Link href={`/pricing?plan=${req.plan}`}>
        <span
          className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-amber-600 text-white text-[10px] font-black uppercase tracking-widest hover:bg-amber-700 transition-colors cursor-pointer shrink-0 self-start"
          data-testid={`button-upgrade-${feature}`}
        >
          Upgrade to {req.label}
          <ArrowUpRight className="w-3.5 h-3.5" />
        </span>
      </Link>
    </div>
  );
}
