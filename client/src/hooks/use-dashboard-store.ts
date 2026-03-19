import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type Sector = 'ecommerce' | 'logistics' | 'manufacturing' | 'unified' | 'custom';
export type SectorMode = 'single' | 'unified';
export type DateRange = '7d' | '30d' | '90d';
export type BusinessStructure = 'single' | 'partnered' | 'unified-chain';
export type DataShareStatus = 'pending' | 'approved' | 'rejected';

export interface DataShareRequest {
  id: string;
  fromSector: Sector;
  toSector: Sector;
  dataset: string;
  message: string;
  status: DataShareStatus;
  createdAt: number;
}

interface DashboardState {
  selectedSector: Sector;
  sectorMode: SectorMode;
  selectedRange: DateRange;
  lastRefreshed: number;
  importedData: any[] | null;

  businessStructure: BusinessStructure;
  connectedSectors: Sector[];
  dataSharingEnabled: boolean;
  hubEnabled: boolean;
  dataShareRequests: DataShareRequest[];
  setupComplete: boolean;
  analystMode: boolean;

  setSector: (sector: Sector) => void;
  setSectorMode: (mode: SectorMode) => void;
  setRange: (range: DateRange) => void;
  refresh: () => void;
  setImportedData: (data: any[] | null) => void;

  setBusinessStructure: (structure: BusinessStructure) => void;
  setConnectedSectors: (sectors: Sector[]) => void;
  setDataSharingEnabled: (enabled: boolean) => void;
  setHubEnabled: (enabled: boolean) => void;
  addDataShareRequest: (request: Omit<DataShareRequest, 'id' | 'createdAt' | 'status'>) => void;
  updateDataShareRequestStatus: (id: string, status: DataShareStatus) => void;
  completeSetup: () => void;
  dismissSetup: () => void;
  setAnalystMode: (enabled: boolean) => void;
}

export const useDashboardStore = create<DashboardState>()(
  persist(
    (set, get) => ({
      selectedSector: 'unified',
      sectorMode: 'unified',
      selectedRange: '30d',
      lastRefreshed: Date.now(),
      importedData: null,

      businessStructure: 'single',
      connectedSectors: ['ecommerce'],
      dataSharingEnabled: false,
      hubEnabled: false,
      dataShareRequests: [],
      setupComplete: false,
      analystMode: false,

      setSector: (sector) => set({ selectedSector: sector }),
      setSectorMode: (mode) => set({ 
        sectorMode: mode,
        selectedSector: mode === 'unified' ? 'unified' : 'ecommerce',
      }),
      setRange: (range) => set({ selectedRange: range }),
      refresh: () => set({ lastRefreshed: Date.now() }),
      setImportedData: (data) => set({ importedData: data }),

      setBusinessStructure: (structure) => {
        const updates: Partial<DashboardState> = { businessStructure: structure };
        if (structure === 'single') {
          updates.connectedSectors = [get().connectedSectors[0] || 'ecommerce'];
          updates.sectorMode = 'single';
          updates.selectedSector = updates.connectedSectors[0];
          updates.hubEnabled = false;
        } else if (structure === 'partnered') {
          if (get().connectedSectors.length < 2) {
            updates.connectedSectors = ['ecommerce', 'logistics'];
          }
          updates.sectorMode = 'single';
          updates.hubEnabled = true;
        } else {
          updates.connectedSectors = ['manufacturing', 'ecommerce', 'logistics'];
          updates.sectorMode = 'unified';
          updates.selectedSector = 'unified';
          updates.hubEnabled = true;
        }
        set(updates as any);
      },
      setConnectedSectors: (sectors) => set({ connectedSectors: sectors }),
      setDataSharingEnabled: (enabled) => set({ dataSharingEnabled: enabled }),
      setHubEnabled: (enabled) => set({ hubEnabled: enabled }),
      addDataShareRequest: (request) => set(state => ({
        dataShareRequests: [
          ...state.dataShareRequests,
          { ...request, id: `dsr-${Date.now()}`, status: 'pending' as DataShareStatus, createdAt: Date.now() },
        ],
      })),
      updateDataShareRequestStatus: (id, status) => set(state => ({
        dataShareRequests: state.dataShareRequests.map(r => r.id === id ? { ...r, status } : r),
      })),
      completeSetup: () => set({ setupComplete: true }),
      dismissSetup: () => set({ setupComplete: true }),
      setAnalystMode: (enabled) => set({ analystMode: enabled }),
    }),
    {
      name: 'chaininsideiq-storage',
    }
  )
);
