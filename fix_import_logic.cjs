const fs = require('fs');
let content = fs.readFileSync('client/src/pages/builder.tsx', 'utf-8');

// I also need to make sure the imported state saves to localStorage so it persists upon reload!
const importLogicStr = `const { widgets: newWidgets, layouts: newLayouts } = buildStateFromSpec(spec);
                           setWidgets(newWidgets);
                           setLayout(newLayouts.lg || []);
                           setLayouts(newLayouts);
                           toast({ title: "Blueprint Imported", description: "Dashboard updated from spec." });`;

const newImportLogicStr = `const { widgets: newWidgets, layouts: newLayouts } = buildStateFromSpec(spec);
                           setWidgets(newWidgets);
                           setLayout(newLayouts.lg || []);
                           setLayouts(newLayouts);
                           localStorage.setItem(\`widgets_\${sector}\`, JSON.stringify(newWidgets));
                           localStorage.setItem(\`layout_\${sector}\`, JSON.stringify(newLayouts.lg || []));
                           toast({ title: "Blueprint Imported", description: "Dashboard updated from spec." });`;

content = content.replace(importLogicStr, newImportLogicStr);

fs.writeFileSync('client/src/pages/builder.tsx', content);
console.log('Builder updated with localStorage save on import');
