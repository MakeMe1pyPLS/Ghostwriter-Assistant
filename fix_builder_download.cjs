const fs = require('fs');
let content = fs.readFileSync('client/src/pages/builder.tsx', 'utf-8');

// First add the import for the spec generator
const importLine = `import { buildSpecFromState, downloadSpecJson } from "@/lib/dashboard-spec";\n`;
content = content.replace('import { useToast } from "@/hooks/use-toast";', `import { useToast } from "@/hooks/use-toast";\n${importLine}`);

// Next, add the download action. Since ExportDrawer handles exports, maybe we can just put a button in the builder header next to ExportDrawer, or add it as a new function that is called from a button. Let's add a quick button next to the Reset button in edit mode, or in View mode next to TemplateGallery.

const headerActions = `{editMode && (
                 <Button variant="outline" onClick={() => resetLayout(true)} className="flex-1 md:flex-none rounded-xl shadow-sm font-bold text-[10px] md:text-xs uppercase tracking-wider h-9 md:h-10 border-slate-200 bg-white px-3 md:px-4">
                   Reset
                 </Button>
               )}
               {!editMode && <div className="flex-1 md:flex-none"><TemplateGallery onSelect={applyTemplate} /></div>}
               {!editMode && <div className="flex-1 md:flex-none"><ExportDrawer layout={layout} widgets={widgets} sector={sector} dateRange={dateRange} /></div>}`;

const newHeaderActions = `{editMode && (
                 <Button variant="outline" onClick={() => resetLayout(true)} className="flex-1 md:flex-none rounded-xl shadow-sm font-bold text-[10px] md:text-xs uppercase tracking-wider h-9 md:h-10 border-slate-200 bg-white px-3 md:px-4">
                   Reset
                 </Button>
               )}
               {!editMode && (
                 <Button variant="outline" onClick={() => {
                   const spec = buildSpecFromState("My Dashboard", sector, widgets, layouts);
                   downloadSpecJson(spec);
                   toast({ title: "Blueprint Exported", description: "Your Dashboard JSON spec has been downloaded." });
                 }} className="flex-1 md:flex-none rounded-xl shadow-sm font-bold text-[10px] md:text-xs uppercase tracking-wider h-9 md:h-10 border-slate-200 bg-white px-3 md:px-4">
                   <Download className="w-3.5 h-3.5 mr-1.5" /> Export Spec
                 </Button>
               )}
               {!editMode && <div className="flex-1 md:flex-none"><TemplateGallery onSelect={applyTemplate} /></div>}
               {!editMode && <div className="flex-1 md:flex-none"><ExportDrawer layout={layout} widgets={widgets} sector={sector} dateRange={dateRange} /></div>}`;

content = content.replace(headerActions, newHeaderActions);

// Add Download to lucide-react imports if not there
if (content.includes('from "lucide-react";') && !content.includes('Download,')) {
    content = content.replace('Bot\n} from "lucide-react";', 'Bot,\n  Download\n} from "lucide-react";');
}

fs.writeFileSync('client/src/pages/builder.tsx', content);
console.log('Builder updated with export spec button');
