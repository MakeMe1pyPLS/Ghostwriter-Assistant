// Share one client workspace, read only, with a person who signs in with their own account.
// The server enforces it (see supabase/migrations/20261105_share_client_workspaces.sql):
// the person can look but never change anything, and every share, join, removal and view is
// written to a history the owner can read. No invite email is sent yet; the owner tells them.
import { useCallback, useEffect, useState } from "react";
import { Eye, Loader2, UserPlus, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { useDashboardStore } from "@/hooks/use-dashboard-store";
import {
  cloudEnabled, getSession, inviteToWorkspace, listHistory, listInvites, listMembers, removeMember, revokeInvite,
  type HistoryRow, type InviteRow, type MemberRow,
} from "@/lib/supabase";

const FIELD_LABEL = "text-[10px] font-black uppercase tracking-widest text-slate-500";
const when = (iso: string) => new Date(iso).toLocaleString(undefined, { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" });

export function SharingPanel({ clientId }: { clientId: string }) {
  const { toast } = useToast();
  const signedIn = useDashboardStore((s) => !!s.currentUser) && cloudEnabled && !!getSession();
  const [members, setMembers] = useState<MemberRow[]>([]);
  const [invites, setInvites] = useState<InviteRow[]>([]);
  const [history, setHistory] = useState<HistoryRow[]>([]);
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    try {
      const [m, i, h] = await Promise.all([listMembers(clientId), listInvites(clientId), listHistory(clientId)]);
      setMembers(m); setInvites(i); setHistory(h); setLoadError(null);
    } catch (e: any) {
      setLoadError(e?.message || "Could not load sharing details.");
    }
  }, [clientId]);

  useEffect(() => { if (signedIn) void refresh(); }, [signedIn, refresh]);

  if (!signedIn) {
    return (
      <section className="space-y-2" data-testid="sharing-signed-out">
        <h3 className={`${FIELD_LABEL} flex items-center gap-1.5`}><Eye className="w-3.5 h-3.5" /> Share with the client</h3>
        <p className="text-[13px] text-slate-600 leading-relaxed">Sign in to share this workspace. People you share with sign in to their own account and can look at it. They cannot change anything.</p>
      </section>
    );
  }

  const act = async (fn: () => Promise<void>, ok?: string) => {
    setBusy(true);
    try { await fn(); if (ok) toast({ title: ok }); await refresh(); }
    catch (e: any) { toast({ title: "That did not work", description: e?.message, variant: "destructive" }); }
    finally { setBusy(false); }
  };

  const invite = () => act(async () => {
    // The workspace has to be saved to the account before it can be shared.
    try { const m = await import("@/lib/cloud-sync"); await m.flush(); } catch { /* the invite call explains if it is not saved yet */ }
    await inviteToWorkspace(clientId, email);
    setEmail("");
  }, "Invite saved");

  const me = getSession()?.user.id ?? "";

  return (
    <section className="space-y-3" data-testid="sharing-panel">
      <h3 className={`${FIELD_LABEL} flex items-center gap-1.5`}><Eye className="w-3.5 h-3.5" /> Share with the client</h3>
      <p className="text-[13px] text-slate-600 leading-relaxed">
        They sign in with the email you enter and can look at this client's plan, actions and results. They cannot change anything, and they do not see your private notes or contact details.
        We do not send an invite email yet, so tell them to sign in (or create an account) with that address.
      </p>

      <form onSubmit={(e) => { e.preventDefault(); if (email.trim()) void invite(); }} className="flex gap-2">
        <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="client@company.com" maxLength={254} className="h-11 rounded-xl" aria-label="Email to share with" data-testid="input-share-email" />
        <Button type="submit" disabled={busy || !email.trim()} className="h-11 rounded-xl font-bold shrink-0" data-testid="button-share-invite">
          {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <><UserPlus className="w-4 h-4 mr-1.5" /> Share</>}
        </Button>
      </form>

      {loadError && <p className="text-[13px] text-rose-700" role="alert">{loadError}</p>}

      {(members.length > 0 || invites.length > 0) && (
        <ul className="space-y-1.5" data-testid="list-share-people">
          {members.map((m) => (
            <li key={m.user_id} className="flex items-center gap-2 rounded-xl border border-slate-100 bg-slate-50 px-3 py-2">
              <div className="min-w-0 flex-1">
                <p className="text-sm font-bold text-slate-800 truncate">{m.email}</p>
                <p className="text-[11px] text-slate-500">Can view since {when(m.created_at)}</p>
              </div>
              <button onClick={() => act(() => removeMember(me, clientId, m.user_id), "Access removed")} disabled={busy} className="w-9 h-9 rounded-lg flex items-center justify-center text-slate-500 hover:text-rose-600 hover:bg-rose-50" aria-label={`Remove access for ${m.email}`}><X className="w-4 h-4" /></button>
            </li>
          ))}
          {invites.map((i) => (
            <li key={i.id} className="flex items-center gap-2 rounded-xl border border-dashed border-slate-200 px-3 py-2">
              <div className="min-w-0 flex-1">
                <p className="text-sm font-bold text-slate-800 truncate">{i.email}</p>
                <p className="text-[11px] text-slate-500">Waiting for them to sign in · expires {when(i.expires_at)}</p>
              </div>
              <button onClick={() => act(() => revokeInvite(i.id), "Invite cancelled")} disabled={busy} className="w-9 h-9 rounded-lg flex items-center justify-center text-slate-500 hover:text-rose-600 hover:bg-rose-50" aria-label={`Cancel the invite for ${i.email}`}><X className="w-4 h-4" /></button>
            </li>
          ))}
        </ul>
      )}

      {history.length > 0 && (
        <div>
          <p className={FIELD_LABEL}>Sharing history</p>
          <ul className="mt-1.5 space-y-1" data-testid="list-share-history">
            {history.map((h) => (
              <li key={h.id} className="text-[12px] text-slate-600"><span className="text-slate-400">{when(h.at)}</span> · {h.summary}</li>
            ))}
          </ul>
          <p className="text-[11px] text-slate-400 mt-1.5">Kept on our server. You can read it; nobody can change or delete it from the app.</p>
        </div>
      )}
    </section>
  );
}
