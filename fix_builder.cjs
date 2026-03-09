const fs = require('fs');
const content = fs.readFileSync('client/src/pages/builder.tsx', 'utf-8');

// We need to make sure the builder components have the card style applied
// Look for where we iterate over widgets
const oldGridItem = `                return (
                  <div key={w.id} className="bg-white rounded-3xl border border-slate-100 shadow-[0_10px_40px_rgb(0,0,0,0.04)] p-4 md:p-5 flex flex-col group relative">
                    {/* Widget Actions */}`;

const newGridItem = `                return (
                  <div key={w.id} className={"group relative flex flex-col " + (w.stylePreset === 'corporate' ? "bg-white rounded-lg border border-slate-300 shadow-sm p-4 md:p-5" : w.stylePreset === 'executive' ? "bg-gradient-to-b from-slate-900 to-slate-800 text-white rounded-xl border border-slate-700 shadow-lg p-4 md:p-5" : w.stylePreset === 'elevated' ? "bg-white rounded-2xl border border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.08)] p-4 md:p-5" : w.stylePreset === 'compact' ? "bg-white rounded-md border border-slate-200 shadow-sm p-2" : "bg-white rounded-3xl border border-slate-100 shadow-[0_10px_40px_rgb(0,0,0,0.04)] p-4 md:p-5")}>
                    {/* Widget Actions */}`;

let newContent = content.replace(oldGridItem, newGridItem);
fs.writeFileSync('client/src/pages/builder.tsx', newContent);
console.log("Builder grid item updated!");

const inspectorContent = fs.readFileSync('client/src/components/WidgetInspector.tsx', 'utf-8');

const appearanceSection = `          {/* Appearance Section */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="px-4 py-3 bg-slate-50/80 border-b border-slate-100 flex items-center gap-2">
              <Palette className="w-3.5 h-3.5 text-slate-400" />
              <h3 className="text-[10px] font-black text-slate-700 uppercase tracking-widest">Appearance</h3>
            </div>
            <div className="p-4 space-y-5">`;

const stylePresetOption = `          {/* Appearance Section */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="px-4 py-3 bg-slate-50/80 border-b border-slate-100 flex items-center gap-2">
              <Palette className="w-3.5 h-3.5 text-slate-400" />
              <h3 className="text-[10px] font-black text-slate-700 uppercase tracking-widest">Appearance</h3>
            </div>
            <div className="p-4 space-y-5">
              <div className="space-y-2">
                <Label className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Card Style Preset</Label>
                <Select 
                  value={widget.stylePreset || "soft"} 
                  onValueChange={(val) => handleUpdate({ stylePreset: val })}
                >
                  <SelectTrigger className="h-9 text-xs rounded-xl shadow-sm border-slate-200 bg-white">
                    <SelectValue placeholder="Select preset" />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl z-[105]">
                    <SelectItem value="soft" className="text-xs">Soft Modern (Default)</SelectItem>
                    <SelectItem value="corporate" className="text-xs">Clean Corporate</SelectItem>
                    <SelectItem value="elevated" className="text-xs">Elevated Insight</SelectItem>
                    <SelectItem value="executive" className="text-xs">Executive Tile (Dark)</SelectItem>
                    <SelectItem value="compact" className="text-xs">Compact Dense</SelectItem>
                  </SelectContent>
                </Select>
              </div>`;

let newInspectorContent = inspectorContent.replace(appearanceSection, stylePresetOption);
fs.writeFileSync('client/src/components/WidgetInspector.tsx', newInspectorContent);
console.log("WidgetInspector preset updated!");

const dashboardContent = fs.readFileSync('client/src/pages/dashboard.tsx', 'utf-8');

const dashOldGridItem = `                return (
                  <div key={w.id} className="bg-white rounded-3xl border border-slate-100 shadow-[0_10px_40px_rgb(0,0,0,0.04)] p-6 md:p-8 flex flex-col overflow-hidden transition-all duration-300 hover:shadow-[0_10px_40px_rgb(0,0,0,0.08)]">
                    {renderWidgetContent(w)}
                  </div>
                );`;
                
const dashNewGridItem = `                return (
                  <div key={w.id} className={"flex flex-col overflow-hidden transition-all duration-300 " + (w.stylePreset === 'corporate' ? "bg-white rounded-lg border border-slate-300 shadow-sm p-6" : w.stylePreset === 'executive' ? "bg-gradient-to-b from-slate-900 to-slate-800 text-white rounded-xl border border-slate-700 shadow-lg p-6" : w.stylePreset === 'elevated' ? "bg-white rounded-2xl border border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.08)] hover:shadow-[0_12px_40px_rgb(0,0,0,0.12)] p-6" : w.stylePreset === 'compact' ? "bg-white rounded-md border border-slate-200 shadow-sm p-4" : "bg-white rounded-3xl border border-slate-100 shadow-[0_10px_40px_rgb(0,0,0,0.04)] p-6 md:p-8 hover:shadow-[0_10px_40px_rgb(0,0,0,0.08)]")}>
                    {renderWidgetContent(w)}
                  </div>
                );`;
                
let newDashboardContent = dashboardContent.replace(dashOldGridItem, dashNewGridItem);
fs.writeFileSync('client/src/pages/dashboard.tsx', newDashboardContent);
console.log("Dashboard grid item updated!");

