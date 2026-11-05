// "Shared with you": client workspaces other people have shared with this account, read only.
// The server decides what is shown (see supabase/migrations/20261105_share_client_workspaces.sql).
import { useEffect, useState } from "react";
import { Link } from "wouter";
import { ArrowRight, Eye, Loader2 } from "lucide-react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { useDashboardStore } from "@/hooks/use-dashboard-store";
import { acceptMyInvites, cloudEnabled, getSession, listSharedWithMe, removeMember, type SharedItem } from "@/lib/supabase";
import { useToast } from "@/hooks/use-toast";

export default function SharedPage() {
  const { toast } = useToast();
  const signedIn = useDashboardStore((s) => !!s.currentUser) && cloudEnabled && !!getSession();
  const [items, setItems] = useState<SharedItem[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = async () => {
    try {
      await acceptMyInvites().catch(() => 0);
      setItems(await listSharedWithMe());
      setError(null);
    } catch (e: any) {
      setError(e?.message || "Could not load what is shared with you.");
      setItems([]);
    }
  };
  useEffect(() => { if (signedIn) void load(); }, [signedIn]);

  const leave = async (it: SharedItem) => {
    try { await removeMember(it.owner_id, it.workspace_id, getSession()!.user.id); toast({ title: "You no longer have access" }); await load(); }
    catch (e: any) { toast({ title: "That did not work", description: e?.message, variant: "destructive" }); }
  };

  return (
    <AppLayout>
      <div className="p-4 md:p-6 lg:p-8 max-w-[900px] mx-auto w-full space-y-6">
        <header>
          <p className="text-[10px] font-black uppercase tracking-widest text-primary">Clients & partners</p>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-slate-900">Shared with you</h1>
          <p className="text-slate-600 mt-1 max-w-2xl">
            Workspaces that a consultant or partner has shared with this account. You can look at the plan, actions and results. You cannot change anything.
          </p>
        </header>

        {!signedIn ? (
          <div className="rounded-2xl border border-slate-200 bg-white p-6 space-y-3" data-testid="shared-signed-out">
            <p className="font-bold text-slate-900">Sign in to see what has been shared with you.</p>
            <p className="text-sm text-slate-600">Use the same email address the invite was sent to. It has to be a confirmed email.</p>
            <Button asChild className="h-11 rounded-xl font-bold"><Link href="/sign-in">Sign in</Link></Button>
          </div>
        ) : items === null ? (
          <p className="text-slate-500 flex items-center gap-2"><Loader2 className="w-4 h-4 animate-spin" /> Loading…</p>
        ) : (
          <>
            {error && <p className="text-sm text-rose-700" role="alert">{error}</p>}
            {items.length === 0 && !error && (
              <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-6 space-y-1" data-testid="shared-empty">
                <p className="font-bold text-slate-900">Nothing has been shared with you yet.</p>
                <p className="text-sm text-slate-600">When someone shares a client workspace, sign in with the email they used and it appears here. Invites last 14 days.</p>
              </div>
            )}
            <ul className="space-y-3">
              {items.map((it) => (
                <li key={`${it.owner_id}/${it.workspace_id}`} className="rounded-2xl border border-slate-200 bg-white p-4 flex flex-wrap items-center gap-3" data-testid={`shared-item-${it.workspace_id}`}>
                  <span className="w-10 h-10 rounded-xl bg-slate-100 text-slate-500 flex items-center justify-center shrink-0"><Eye className="w-5 h-5" aria-hidden /></span>
                  <div className="min-w-0 flex-1">
                    <p className="font-black text-slate-900 truncate">{it.name || "Client"}</p>
                    <p className="text-xs text-slate-500">Shared by {it.owner_name} · view only · since {new Date(it.shared_at).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })}</p>
                  </div>
                  <Button asChild className="h-10 rounded-xl font-bold"><Link href={`/shared/${it.owner_id}/${encodeURIComponent(it.workspace_id)}`}>Open <ArrowRight className="w-4 h-4 ml-1.5" /></Link></Button>
                  <Button variant="ghost" onClick={() => leave(it)} className="h-10 rounded-xl font-bold text-slate-600">Leave</Button>
                </li>
              ))}
            </ul>
          </>
        )}
      </div>
    </AppLayout>
  );
}
