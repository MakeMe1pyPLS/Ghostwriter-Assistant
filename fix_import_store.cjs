const fs = require('fs');
let content = fs.readFileSync('client/src/pages/builder.tsx', 'utf-8');

// I also want to make sure it loads correctly. 
// We should check where `localStorage.getItem(\`layout_\${sector}\`)` happens
// Currently in builder.tsx:
const loadLogic = `    const key = \`layout_\${sector}\`;
    const savedLayout = localStorage.getItem(key);
    const savedWidgets = localStorage.getItem(\`widgets_\${sector}\`);
    
    if (savedLayout && savedWidgets) {
      setLayout(JSON.parse(savedLayout));
      setLayouts({ lg: JSON.parse(savedLayout) });
      setWidgets(JSON.parse(savedWidgets));
    } else {
      resetLayout(false);
    }`;

// Wait, the spec says "Load spec on app startup".
// For now, storing as portable JSON spec and allowing users to *import* it is the best way to handle this.
// But the core of Sprint 1 is the spec schema, mappers, and export feature.
// Let's add an import function next to export.

const newHeaderActions = `               {!editMode && (
                 <>
                 <Button variant="outline" onClick={() => {
                   const input = document.createElement('input');
                   input.type = 'file';
                   input.accept = 'application/json';
                   input.onchange = (e) => {
                     const file = (e.target as HTMLInputElement).files?.[0];
                     if (!file) return;
                     const reader = new FileReader();
                     reader.onload = (event) => {
                       try {
                         const spec = JSON.parse(event.target?.result as string);
                         if (spec.version === "1.0.0" && spec.widgets) {
                           import { buildStateFromSpec } from "@/lib/dashboard-spec";
                           const { widgets: newWidgets, layouts: newLayouts } = buildStateFromSpec(spec);
                           setWidgets(newWidgets);
                           setLayout(newLayouts.lg || []);
                           setLayouts(newLayouts);
                           toast({ title: "Blueprint Imported", description: "Dashboard updated from spec." });
                         } else {
                           toast({ title: "Invalid Spec", description: "The uploaded file is not a valid v1.0.0 Dashboard Blueprint.", variant: "destructive" });
                         }
                       } catch (e) {
                         toast({ title: "Import Failed", description: "Failed to parse JSON blueprint.", variant: "destructive" });
                       }
                     };
                     reader.readAsText(file);
                   };
                   input.click();
                 }} className="flex-1 md:flex-none rounded-xl shadow-sm font-bold text-[10px] md:text-xs uppercase tracking-wider h-9 md:h-10 border-slate-200 bg-white px-3 md:px-4">
                   Import Spec
                 </Button>
                 <Button variant="outline" onClick={() => {
                   const spec = buildSpecFromState("My Dashboard", sector, widgets, layouts);
                   downloadSpecJson(spec);
                   toast({ title: "Blueprint Exported", description: "Your Dashboard JSON spec has been downloaded." });
                 }} className="flex-1 md:flex-none rounded-xl shadow-sm font-bold text-[10px] md:text-xs uppercase tracking-wider h-9 md:h-10 border-slate-200 bg-white px-3 md:px-4">
                   <Download className="w-3.5 h-3.5 mr-1.5" /> Export Spec
                 </Button>
                 </>
               )}`;
               
const oldExportBtn = `{!editMode && (
                 <Button variant="outline" onClick={() => {
                   const spec = buildSpecFromState("My Dashboard", sector, widgets, layouts);
                   downloadSpecJson(spec);
                   toast({ title: "Blueprint Exported", description: "Your Dashboard JSON spec has been downloaded." });
                 }} className="flex-1 md:flex-none rounded-xl shadow-sm font-bold text-[10px] md:text-xs uppercase tracking-wider h-9 md:h-10 border-slate-200 bg-white px-3 md:px-4">
                   <Download className="w-3.5 h-3.5 mr-1.5" /> Export Spec
                 </Button>
               )}`;

content = content.replace(oldExportBtn, newHeaderActions);

// Need to update the import list because `buildStateFromSpec` was just imported inside the onClick handler which is illegal
content = content.replace('import { buildSpecFromState, downloadSpecJson }', 'import { buildSpecFromState, buildStateFromSpec, downloadSpecJson }');
content = content.replace('import { buildStateFromSpec } from "@/lib/dashboard-spec";\n', ''); // remove inline import

fs.writeFileSync('client/src/pages/builder.tsx', content);
console.log('Builder updated with import spec button');
