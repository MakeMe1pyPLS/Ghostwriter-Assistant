import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { FileSpreadsheet, CheckCircle2 } from "lucide-react";

export function ExcelIntegrationPanel() {
  return (
    <Card className="border-slate-200 shadow-sm">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-green-100 text-green-600 flex items-center justify-center border border-green-200">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <CardTitle className="text-sm font-black uppercase tracking-widest">Microsoft Excel</CardTitle>
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-0.5">Export Integration</p>
            </div>
          </div>
          <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200 font-bold text-[9px] uppercase tracking-widest">
            <CheckCircle2 className="w-3 h-3 mr-1" /> Active
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3 text-xs text-slate-600">
          <p className="font-medium leading-relaxed">Server-side Excel generation is fully operational. Exports include formatted KPI cards, chart placeholders, data tables, and a dedicated data sheet.</p>
          <div className="bg-slate-50 rounded-xl p-3 border border-slate-100">
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">Capabilities</p>
            <ul className="space-y-1 text-xs text-slate-600 font-medium">
              <li>• Formatted .xlsx workbook generation</li>
              <li>• KPI cards with trend indicators</li>
              <li>• Data sheet with all metrics</li>
              <li>• Professional styling and branding</li>
            </ul>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}