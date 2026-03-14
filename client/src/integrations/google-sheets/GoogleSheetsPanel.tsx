import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { FileSpreadsheet, Clock } from "lucide-react";

export function GoogleSheetsPanel() {
  return (
    <Card className="border-slate-200 shadow-sm opacity-80">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-600 flex items-center justify-center border border-emerald-200">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <CardTitle className="text-sm font-black uppercase tracking-widest">Google Sheets</CardTitle>
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-0.5">Spreadsheet Integration</p>
            </div>
          </div>
          <Badge variant="secondary" className="bg-slate-100 text-slate-500 font-bold text-[9px] uppercase tracking-widest">
            <Clock className="w-3 h-3 mr-1" /> Coming Soon
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3 text-xs text-slate-600">
          <p className="font-medium leading-relaxed">Push dashboard data directly to Google Sheets with OAuth authentication. Support for scheduled syncs and live data updates.</p>
          <div className="bg-slate-50 rounded-xl p-3 border border-slate-100">
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">Planned Capabilities</p>
            <ul className="space-y-1 text-xs text-slate-500 font-medium">
              <li>• OAuth 2.0 authentication</li>
              <li>• Push KPIs and timeseries to sheets</li>
              <li>• Scheduled sync intervals</li>
              <li>• Adapter scaffold ready</li>
            </ul>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}