import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Plug, CheckCircle2 } from "lucide-react";

export function CustomApiPanel() {
  return (
    <Card className="border-slate-200 shadow-sm">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-violet-100 text-violet-600 flex items-center justify-center border border-violet-200">
              <Plug className="w-5 h-5" />
            </div>
            <div>
              <CardTitle className="text-sm font-black uppercase tracking-widest">Custom API</CardTitle>
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-0.5">API Integration</p>
            </div>
          </div>
          <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200 font-bold text-[9px] uppercase tracking-widest">
            <CheckCircle2 className="w-3 h-3 mr-1" /> Active
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3 text-xs text-slate-600">
          <p className="font-medium leading-relaxed">Send dashboard specs, datasets, or metrics summaries to any external REST API endpoint. Supports bearer token auth and custom headers.</p>
          <div className="bg-slate-50 rounded-xl p-3 border border-slate-100">
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">Capabilities</p>
            <ul className="space-y-1 text-xs text-slate-600 font-medium">
              <li>• Configurable endpoint URL</li>
              <li>• Multiple HTTP methods (GET/POST/PUT/PATCH)</li>
              <li>• Bearer token authentication</li>
              <li>• Multiple payload types</li>
              <li>• Test connection and send test</li>
            </ul>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}