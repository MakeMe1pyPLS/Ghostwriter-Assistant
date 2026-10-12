// Shows whether the signed-in user's workspaces are saved to their account.
import { useEffect, useState } from "react";
import { Cloud, CloudOff, Loader2, AlertTriangle, HardDrive } from "lucide-react";
import { useSyncStatus } from "@/lib/cloud-sync";
import { cloudEnabled } from "@/lib/supabase";
import { cn } from "@/lib/utils";

function ago(ts?: number) {
  if (!ts) return "";
  const s = Math.round((Date.now() - ts) / 1000);
  if (s < 10) return "just now";
  if (s < 60) return `${s}s ago`;
  const m = Math.round(s / 60);
  return m < 60 ? `${m} min ago` : new Date(ts).toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" });
}

export function SyncBadge({ className }: { className?: string }) {
  const { state, lastSyncedAt, message } = useSyncStatus();
  const [, tick] = useState(0);
  useEffect(() => { const t = setInterval(() => tick((n) => n + 1), 30_000); return () => clearInterval(t); }, []);

  const view = !cloudEnabled || state === "off"
    ? { icon: HardDrive, text: "Saved in this browser", tone: "text-slate-500" }
    : state === "loading" ? { icon: Loader2, text: "Loading your workspaces…", tone: "text-slate-500", spin: true }
    : state === "syncing" ? { icon: Loader2, text: "Saving to your account…", tone: "text-slate-500", spin: true }
    : state === "offline" ? { icon: CloudOff, text: "Offline. Changes will save when you reconnect.", tone: "text-amber-600" }
    : state === "error" ? { icon: AlertTriangle, text: "Couldn’t save. Retrying…", tone: "text-rose-600", title: message }
    : { icon: Cloud, text: `Saved to your account${lastSyncedAt ? ` · ${ago(lastSyncedAt)}` : ""}`, tone: "text-emerald-600" };

  return (
    <span className={cn("inline-flex items-center gap-1.5 text-[11px] font-semibold", view.tone, className)} title={(view as any).title} role="status" data-testid="sync-badge">
      <view.icon className={cn("w-3.5 h-3.5 shrink-0", (view as any).spin && "motion-safe:animate-spin")} aria-hidden />
      {view.text}
    </span>
  );
}
