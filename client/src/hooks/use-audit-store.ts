// Activity log, kept in this browser only. See shared/audit.ts for what it records and what it does not.
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { appendEntries, clean, type AuditEntry, type AuditKind } from '@shared/audit';

interface AuditState {
  entries: AuditEntry[];
  add: (entries: AuditEntry[]) => void;
  clear: () => void;
}

const storage = createJSONStorage(() => ({
  getItem: (k: string) => { try { return localStorage.getItem(k); } catch { return null; } },
  setItem: (k: string, v: string) => { try { localStorage.setItem(k, v); } catch { /* storage full: the log stays in memory */ } },
  removeItem: (k: string) => { try { localStorage.removeItem(k); } catch { /* ignore */ } },
}));

export const useAuditStore = create<AuditState>()(
  persist(
    (set) => ({
      entries: [],
      add: (add) => set((s) => ({ entries: appendEntries(s.entries, add) })),
      clear: () => set({ entries: [] }),
    }),
    { name: 'chaininsideiq-audit', version: 1, storage, partialize: (s) => ({ entries: s.entries }) },
  ),
);

// While a cloud sync is loading someone's saved workspace, nothing the person did is happening, so nothing is logged.
let paused = 0;
export const pauseAudit = (on: boolean) => { paused = Math.max(0, paused + (on ? 1 : -1)); };
export const auditPaused = () => paused > 0;

let seq = 0;
export function recordAudit(kind: AuditKind, summary: string, workspace: string) {
  if (paused > 0) return;
  const at = Date.now();
  useAuditStore.getState().add([{ id: `${at.toString(36)}-${(seq++).toString(36)}`, at, kind, summary: clean(summary, 200), workspace: clean(workspace, 60) }]);
}
