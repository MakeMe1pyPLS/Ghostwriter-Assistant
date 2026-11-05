// Report branding: your name and logo on the reports you print for clients, and an
// option to hide the ChainInsideIQ mark. Saved in this browser for now.
import { useEffect, useRef, useState } from "react";
import { ImagePlus, Trash2, Palette } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Logo } from "@/components/Logo";
import { useToast } from "@/hooks/use-toast";
import { useClientsStore } from "@/hooks/use-clients-store";
import { useGrowthStore } from "@/hooks/use-growth-store";
import { fileToLogo } from "@/lib/brand-logo";
import { NAME_MAX, reportBranding } from "@shared/branding";

const LABEL = "text-[10px] font-black uppercase tracking-widest text-slate-500";

export function BrandingCard() {
  const brand = useClientsStore((s) => s.brand);
  const setBrand = useClientsStore((s) => s.setBrand);
  const ownBusiness = useGrowthStore((s) => s.profile?.businessName);
  const { toast } = useToast();
  const fileRef = useRef<HTMLInputElement>(null);
  const [name, setName] = useState(brand?.name ?? "");
  const [busy, setBusy] = useState(false);
  useEffect(() => { setName(brand?.name ?? ""); }, [brand?.name]);
  const preview = reportBranding(brand, ownBusiness);

  const pick = async (file: File | undefined) => {
    if (!file) return;
    setBusy(true);
    try { setBrand({ logo: await fileToLogo(file) }); toast({ title: "Logo saved" }); }
    catch (e) { toast({ title: "Could not use that image", description: e instanceof Error ? e.message : undefined, variant: "destructive" }); }
    finally { setBusy(false); if (fileRef.current) fileRef.current.value = ""; }
  };

  return (
    <section className="rounded-3xl border border-slate-200 bg-white p-4 sm:p-5 space-y-4" aria-labelledby="brand-title" data-testid="branding">
      <div>
        <h2 id="brand-title" className="text-base font-black text-slate-900 flex items-center gap-2"><Palette className="w-4 h-4 text-slate-500" aria-hidden /> Report branding</h2>
        <p className="text-[13px] text-slate-600 mt-1">Put your own name and logo on the progress reports you print for clients.</p>
      </div>

      <div className="grid sm:grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <label htmlFor="brand-name" className={LABEL}>Your business name</label>
          <Input id="brand-name" value={name} maxLength={NAME_MAX} placeholder={ownBusiness || "e.g. Rivera Advisory"} className="h-11 rounded-xl"
            onChange={(e) => setName(e.target.value)} onBlur={() => { if (name.trim() !== (brand?.name ?? "")) setBrand({ name: name.trim() || null }); }} />
          <p className="text-[11px] text-slate-500">Printed as "Prepared by". Left blank, the business name from your own workspace is used.</p>
        </div>
        <div className="space-y-1.5">
          <span className={LABEL}>Your logo</span>
          <div className="flex flex-wrap items-center gap-2">
            <input ref={fileRef} type="file" accept="image/png,image/jpeg,image/webp" className="sr-only" id="brand-logo" onChange={(e) => void pick(e.target.files?.[0])} />
            <Button type="button" variant="outline" disabled={busy} className="h-11 rounded-xl font-bold" onClick={() => fileRef.current?.click()}>
              <ImagePlus className="w-4 h-4 mr-1.5" aria-hidden /> {brand?.logo ? "Change logo" : "Upload logo"}
            </Button>
            {brand?.logo && <Button type="button" variant="ghost" className="h-11 rounded-xl font-bold text-rose-700" onClick={() => setBrand({ logo: null })}><Trash2 className="w-4 h-4 mr-1.5" aria-hidden /> Remove</Button>}
          </div>
          <p className="text-[11px] text-slate-500">PNG, JPG or WebP. It is shrunk to fit and kept small. SVG files are not accepted.</p>
        </div>
      </div>

      <label className="flex items-start gap-3 rounded-2xl border border-slate-200 p-3.5 cursor-pointer min-h-11">
        <input type="checkbox" className="mt-1 w-5 h-5 accent-teal-600" checked={!!brand?.hideProduct} onChange={(e) => setBrand({ hideProduct: e.target.checked })} data-testid="brand-hide-product" />
        <span>
          <span className="block text-sm font-bold text-slate-900">Hide the ChainInsideIQ logo and name on printed reports</span>
          <span className="block text-[13px] text-slate-600">The report then shows only your branding. The line saying the figures come from the numbers entered in the workspace stays.</span>
        </span>
      </label>

      <div className="rounded-2xl border border-dashed border-slate-300 p-4" aria-label="Preview of the report header and footer">
        <p className={LABEL}>Preview</p>
        <div className="mt-2 flex items-center justify-between gap-3 border-b border-slate-200 pb-3 min-h-[40px]">
          <span className="text-sm font-black text-slate-900">Client name · Progress report</span>
          <span className="flex items-center gap-3">
            {preview.logo && <img src={preview.logo} alt={preview.preparedBy ? `${preview.preparedBy} logo` : "Your logo"} className="max-h-9 max-w-[140px] object-contain" />}
            {preview.showProductMark && <Logo size={26} />}
          </span>
        </div>
        <p className="mt-2 text-xs text-slate-600">{preview.footer}</p>
      </div>
      <p className="text-[11px] text-slate-500">Saved in this browser for now, so set it up again on another device. It applies to reports you print or save here, and is cleared when you sign out. People you share a workspace with see the standard view.</p>
    </section>
  );
}
