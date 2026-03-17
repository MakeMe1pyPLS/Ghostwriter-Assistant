import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Share2, Send, CheckCircle2, Clock, XCircle, ShoppingCart, Truck, Building2 } from "lucide-react";
import { useDashboardStore, type Sector, type DataShareRequest, type DataShareStatus } from "@/hooks/use-dashboard-store";
import { useToast } from "@/hooks/use-toast";
import { formatDistanceToNow } from "date-fns";

const SECTOR_LABELS: Record<string, { label: string; icon: any }> = {
  ecommerce: { label: 'E-commerce', icon: ShoppingCart },
  logistics: { label: 'Logistics', icon: Truck },
  manufacturing: { label: 'Manufacturing', icon: Building2 },
};

const DATASETS = [
  'Orders',
  'Demand',
  'Inventory',
  'Fulfillment',
  'Shipping Performance',
  'Custom Dataset',
];

const STATUS_STYLES: Record<DataShareStatus, { bg: string; icon: any }> = {
  pending: { bg: 'bg-amber-50 text-amber-700 border-amber-200', icon: Clock },
  approved: { bg: 'bg-emerald-50 text-emerald-700 border-emerald-200', icon: CheckCircle2 },
  rejected: { bg: 'bg-rose-50 text-rose-700 border-rose-200', icon: XCircle },
};

export function DataShareModal({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  const { connectedSectors, selectedSector, addDataShareRequest } = useDashboardStore();
  const { toast } = useToast();
  const [targetSector, setTargetSector] = useState<string>('');
  const [dataset, setDataset] = useState<string>('');
  const [message, setMessage] = useState('');

  const availableSectors = connectedSectors.filter(s => s !== selectedSector && s !== 'unified' && s !== 'custom');

  const handleSubmit = () => {
    if (!targetSector || !dataset) return;
    addDataShareRequest({
      fromSector: selectedSector,
      toSector: targetSector as Sector,
      dataset,
      message: message.trim(),
    });
    toast({ title: "Data Share Request Sent", description: `Request to share ${dataset} with ${SECTOR_LABELS[targetSector]?.label || targetSector} has been submitted.` });
    setTargetSector('');
    setDataset('');
    setMessage('');
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md rounded-2xl border-slate-200">
        <DialogHeader>
          <DialogTitle className="text-lg font-black text-slate-900 uppercase tracking-tight flex items-center gap-2">
            <Share2 className="w-5 h-5 text-primary" />
            Request to Share Data
          </DialogTitle>
          <DialogDescription className="text-xs text-slate-500">
            Select a sector and dataset to share operational data across your business structure.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5 pt-2">
          <div className="space-y-2">
            <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Share with Sector</Label>
            <Select value={targetSector} onValueChange={setTargetSector}>
              <SelectTrigger className="h-11 rounded-xl border-slate-200" data-testid="select-share-sector">
                <SelectValue placeholder="Select sector" />
              </SelectTrigger>
              <SelectContent className="rounded-xl">
                {availableSectors.map(s => (
                  <SelectItem key={s} value={s} className="text-xs">{SECTOR_LABELS[s]?.label || s}</SelectItem>
                ))}
                {availableSectors.length === 0 && (
                  <div className="p-3 text-xs text-slate-400 text-center">No other sectors available. Add sectors in Settings.</div>
                )}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Dataset to Share</Label>
            <Select value={dataset} onValueChange={setDataset}>
              <SelectTrigger className="h-11 rounded-xl border-slate-200" data-testid="select-share-dataset">
                <SelectValue placeholder="Select dataset" />
              </SelectTrigger>
              <SelectContent className="rounded-xl">
                {DATASETS.map(d => (
                  <SelectItem key={d} value={d} className="text-xs">{d}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Message (Optional)</Label>
            <Textarea
              placeholder="e.g. Sharing order demand data so logistics can forecast fulfillment volume."
              className="resize-none rounded-xl border-slate-200 min-h-[80px] text-sm"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              data-testid="input-share-message"
            />
          </div>

          <Button
            onClick={handleSubmit}
            disabled={!targetSector || !dataset}
            className="w-full h-12 rounded-xl font-black text-xs uppercase tracking-widest shadow-lg shadow-primary/20"
            data-testid="button-submit-share"
          >
            <Send className="w-4 h-4 mr-2" />
            Submit Request
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export function DataShareRequestsPanel() {
  const { dataShareRequests, updateDataShareRequestStatus } = useDashboardStore();

  if (dataShareRequests.length === 0) {
    return (
      <div className="text-center py-8">
        <Share2 className="w-8 h-8 text-slate-200 mx-auto mb-3" />
        <p className="text-sm font-bold text-slate-400">No data share requests yet</p>
        <p className="text-xs text-slate-400 mt-1">Use "Request to Share Data" to send your first request.</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {dataShareRequests.map(req => {
        const statusStyle = STATUS_STYLES[req.status];
        const StatusIcon = statusStyle.icon;
        const fromLabel = SECTOR_LABELS[req.fromSector]?.label || req.fromSector;
        const toLabel = SECTOR_LABELS[req.toSector]?.label || req.toSector;

        return (
          <div key={req.id} className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm" data-testid={`share-request-${req.id}`}>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <Badge variant="outline" className={`rounded-lg text-[9px] font-black uppercase tracking-widest border ${statusStyle.bg}`}>
                  <StatusIcon className="w-3 h-3 mr-1" />
                  {req.status}
                </Badge>
                <span className="text-[10px] text-slate-400 font-medium">{formatDistanceToNow(req.createdAt)} ago</span>
              </div>
            </div>
            <p className="text-sm font-bold text-slate-800 mb-1">{req.dataset}</p>
            <p className="text-xs text-slate-500 mb-2">{fromLabel} → {toLabel}</p>
            {req.message && <p className="text-xs text-slate-500 italic mb-3">"{req.message}"</p>}
            {req.status === 'pending' && (
              <div className="flex gap-2">
                <Button size="sm" variant="outline" onClick={() => updateDataShareRequestStatus(req.id, 'approved')} className="h-8 rounded-lg text-[10px] font-bold text-emerald-600 border-emerald-200 hover:bg-emerald-50" data-testid={`approve-${req.id}`}>
                  <CheckCircle2 className="w-3 h-3 mr-1" /> Approve
                </Button>
                <Button size="sm" variant="outline" onClick={() => updateDataShareRequestStatus(req.id, 'rejected')} className="h-8 rounded-lg text-[10px] font-bold text-rose-600 border-rose-200 hover:bg-rose-50" data-testid={`reject-${req.id}`}>
                  <XCircle className="w-3 h-3 mr-1" /> Reject
                </Button>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
