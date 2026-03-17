import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { RefreshCw, Calendar, Zap, Clock, ArrowRight } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";
import { useDashboardStore, Sector, DateRange } from "@/hooks/use-dashboard-store";
import { format } from "date-fns";
import { ImportDataModal } from "@/components/ImportDataModal";
import { Link } from "wouter";

export function TopBar() {
  const { toast } = useToast();
  const [isRefreshing, setIsRefreshing] = useState(false);
  const { selectedSector, setSector, selectedRange, setRange, lastRefreshed, refresh } = useDashboardStore();

  const handleRefresh = () => {
    setIsRefreshing(true);
    setTimeout(() => {
      setIsRefreshing(false);
      refresh();
      toast({
        title: "Dashboard Refreshed",
        description: `Data synced for ${selectedSector} sector.`,
      });
    }, 800);
  };

  return (
    <div className="h-16 border-b border-border bg-white/80 backdrop-blur-md sticky top-0 z-40 flex items-center justify-between px-4 lg:px-6 shadow-sm overflow-x-auto custom-scrollbar no-scrollbar-on-mobile shrink-0">
      <div className="flex items-center gap-2 lg:gap-4 shrink-0 pr-4">
        <Select value={selectedSector} onValueChange={(v) => setSector(v as Sector)}>
          <SelectTrigger className="w-[140px] lg:w-[180px] bg-slate-50 border-slate-200 font-medium h-9">
            <SelectValue placeholder="Select Sector" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="unified">Unified Bridge</SelectItem>
            <SelectItem value="ecommerce">E-commerce</SelectItem>
            <SelectItem value="logistics">Logistics</SelectItem>
            <SelectItem value="manufacturing">Manufacturing</SelectItem>
            <SelectItem value="custom">Custom Data</SelectItem>
          </SelectContent>
        </Select>

        <Select value={selectedRange} onValueChange={(v) => setRange(v as DateRange)}>
          <SelectTrigger className="w-[110px] lg:w-[130px] bg-slate-50 border-slate-200 text-sm h-9">
            <SelectValue placeholder="Range" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="7d">Last 7 Days</SelectItem>
            <SelectItem value="30d">Last 30 Days</SelectItem>
            <SelectItem value="90d">Last 90 Days</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="flex items-center gap-3 lg:gap-4 shrink-0">
        <ImportDataModal />
        
        <div className="hidden md:flex flex-col items-end mr-2">
          <span className="text-[10px] uppercase tracking-wider text-slate-400 font-bold">Last Sync</span>
          <span className="text-xs text-slate-600 font-medium">{format(lastRefreshed, 'HH:mm:ss')}</span>
        </div>

        <Link href="/pricing" className="hidden sm:flex">
          <Button className="items-center gap-2 text-[10px] font-black bg-slate-900 text-white hover:bg-slate-800 rounded-full h-9 px-4 uppercase tracking-widest shadow-sm">
            <Zap className="w-3.5 h-3.5 fill-primary text-primary" />
            Upgrade to Pro
          </Button>
        </Link>
        
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={handleRefresh}
          className="gap-2 text-slate-600 hover:bg-slate-100 transition-all duration-200 h-9"
        >
          <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
          <span className="hidden sm:inline">Refresh</span>
        </Button>
      </div>
    </div>
  );
}
