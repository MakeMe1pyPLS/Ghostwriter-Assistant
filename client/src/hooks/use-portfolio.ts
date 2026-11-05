// The consultant's view across all clients: one summary each, and a roll-up.
// Each summary is built from that one client's workspace only.
import { useMemo } from "react";
import { useClientsStore } from "@/hooks/use-clients-store";
import { useGrowthStore } from "@/hooks/use-growth-store";
import { useDashboardStore } from "@/hooks/use-dashboard-store";
import { clientInputFrom } from "@/lib/portfolio";
import { rollUp, summariseClient } from "@shared/consultant";

export function usePortfolio() {
  const clients = useClientsStore((s) => s.clients);
  const activeClientId = useClientsStore((s) => s.activeClientId);
  const workspaceFor = useClientsStore((s) => s.workspaceFor);
  // The open client's workspace is live in these stores, so read them to stay current.
  const liveActions = useGrowthStore((s) => s.actions);
  const liveLibrary = useDashboardStore((s) => s.datasetLibrary);
  const liveActive = useDashboardStore((s) => s.activeDatasetBySector);
  const liveSector = useDashboardStore((s) => s.selectedSector);

  return useMemo(() => {
    const summaries = clients.map((c) => summariseClient(clientInputFrom(c, workspaceFor(c.id))));
    return { summaries, portfolio: rollUp(summaries) };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [clients, activeClientId, workspaceFor, liveActions, liveLibrary, liveActive, liveSector]);
}
