import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type Sector = 'ecommerce' | 'logistics' | 'manufacturing' | 'unified' | 'custom';
export type DateRange = '7d' | '30d' | '90d';

interface DashboardState {
  selectedSector: Sector;
  selectedRange: DateRange;
  lastRefreshed: number;
  importedData: any[] | null;
  setSector: (sector: Sector) => void;
  setRange: (range: DateRange) => void;
  refresh: () => void;
  setImportedData: (data: any[] | null) => void;
}

export const useDashboardStore = create<DashboardState>()(
  persist(
    (set) => ({
      selectedSector: 'unified',
      selectedRange: '30d',
      lastRefreshed: Date.now(),
      importedData: null,
      setSector: (sector) => set({ selectedSector: sector }),
      setRange: (range) => set({ selectedRange: range }),
      refresh: () => set({ lastRefreshed: Date.now() }),
      setImportedData: (data) => set({ importedData: data }),
    }),
    {
      name: 'chaininsideiq-storage',
    }
  )
);
