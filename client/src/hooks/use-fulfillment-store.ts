// Fulfillment prototype settings: which niche is showing and what the 3PL has
// chosen to share with each client. Saved in this browser only.
import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { DEFAULT_PERMS, type Niche, type SharePerms } from "@shared/fulfillment";

interface FulfillmentState {
  niche: Niche;
  /** What each client may see. A client missing here gets the defaults. */
  perms: Record<string, SharePerms>;
  setNiche: (n: Niche) => void;
  setPerm: (clientId: string, key: keyof SharePerms, value: boolean) => void;
}

export const useFulfillmentStore = create<FulfillmentState>()(
  persist(
    (set) => ({
      niche: "apparel",
      perms: {},
      setNiche: (niche) => set({ niche }),
      setPerm: (clientId, key, value) =>
        set((s) => ({ perms: { ...s.perms, [clientId]: { ...DEFAULT_PERMS, ...s.perms[clientId], [key]: value } } })),
    }),
    {
      name: "ciq_fulfillment",
      storage: createJSONStorage(() => {
        try { return localStorage; } catch { return { getItem: () => null, setItem: () => {}, removeItem: () => {} } as unknown as Storage; }
      }),
      version: 1,
    },
  ),
);

export const permsFor = (perms: Record<string, SharePerms>, clientId: string): SharePerms => ({ ...DEFAULT_PERMS, ...perms[clientId] });
