// Loads one workspace that someone shared with the signed-in person (read only).
// The server sends a trimmed copy; this turns it into the same shapes the report page already uses.
import { useEffect, useState } from "react";
import { acceptMyInvites, getSharedWorkspace, type SharedWorkspace } from "@/lib/supabase";
import { emptyGrowthWorkspace } from "@/hooks/use-growth-store";
import { emptyDashboardWorkspace, type ClientRecord, type WorkspaceSnapshot } from "@/hooks/use-clients-store";

export type SharedState = 'idle' | 'loading' | 'ready' | 'missing' | 'error';

export function toClientRecord(row: SharedWorkspace): { client: ClientRecord; ws: WorkspaceSnapshot } {
  const m = row.meta ?? {};
  const ws: WorkspaceSnapshot = {
    growth: { ...emptyGrowthWorkspace(), ...(row.growth ?? {}) },
    dashboard: { ...emptyDashboardWorkspace(), ...(row.dashboard ?? {}) },
  };
  const client: ClientRecord = {
    id: row.id, name: row.name || 'Client', industryId: m.industryId,
    engagement: m.engagement ?? 'Project', status: m.status ?? 'Active', nextReview: m.nextReview,
    notes: [], createdAt: Number(m.createdAt) || Date.now(), workspace: ws,
  };
  return { client, ws };
}

export function useSharedWorkspace(ownerId: string | null, workspaceId: string | null) {
  const [state, setState] = useState<SharedState>('idle');
  const [data, setData] = useState<{ client: ClientRecord; ws: WorkspaceSnapshot; ownerName: string; updatedAt?: string } | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!ownerId || !workspaceId) { setState('idle'); setData(null); return; }
    let live = true;
    setState('loading');
    (async () => {
      try {
        await acceptMyInvites().catch(() => 0);
        const row = await getSharedWorkspace(ownerId, workspaceId);
        if (!live) return;
        if (!row) { setData(null); setState('missing'); return; }
        setData({ ...toClientRecord(row), ownerName: row.owner_name, updatedAt: row.updated_at });
        setState('ready');
      } catch (e: any) {
        if (!live) return;
        setError(e?.message || 'Could not load this workspace.');
        setState('error');
      }
    })();
    return () => { live = false; };
  }, [ownerId, workspaceId]);

  return { state, error, client: data?.client ?? null, ws: data?.ws ?? null, ownerName: data?.ownerName, updatedAt: data?.updatedAt };
}
