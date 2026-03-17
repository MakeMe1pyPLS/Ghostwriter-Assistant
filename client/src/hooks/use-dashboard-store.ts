import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type Sector = 'ecommerce' | 'logistics' | 'manufacturing' | 'unified' | 'custom';
export type SectorMode = 'single' | 'unified';
export type DateRange = '7d' | '30d' | '90d';

interface DashboardState {
  selectedSector: Sector;
  sectorMode: SectorMode;
  selectedRange: DateRange;
  lastRefreshed: number;
  importedData: any[] | null;
  setSector: (sector: Sector) => void;
  setSectorMode: (mode: SectorMode) => void;
  setRange: (range: DateRange) => void;
  refresh: () => void;
  setImportedData: (data: any[] | null) => void;
}

export const useDashboardStore = create<DashboardState>()(
  persist(
    (set) => ({
      selectedSector: 'unified',
      sectorMode: 'unified',
      selectedRange: '30d',
      lastRefreshed: Date.now(),
      importedData: null,
      setSector: (sector) => set({ selectedSector: sector }),
      setSectorMode: (mode) => set({ 
        sectorMode: mode,
        selectedSector: mode === 'unified' ? 'unified' : 'ecommerce',
      }),
      setRange: (range) => set({ selectedRange: range }),
      refresh: () => set({ lastRefreshed: Date.now() }),
      setImportedData: (data) => set({ importedData: data }),
    }),
    {
      name: 'chaininsideiq-storage',
    }
  )
);
