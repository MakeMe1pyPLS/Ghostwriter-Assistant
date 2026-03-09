const fs = require('fs');
const content = fs.readFileSync('client/src/pages/dashboard.tsx', 'utf-8');
const startMatch = "  const renderWidgetContent = (widget: any) => {";
const endMatch = "  return (\n    <AppLayout>";

const startIndex = content.indexOf(startMatch);
const endIndex = content.indexOf(endMatch);

if (startIndex !== -1 && endIndex !== -1) {
  const newContent = content.substring(0, startIndex) + 
    "  const renderWidgetContent = (widget: any) => {\n" +
    "    return <WidgetRenderer widget={widget} data={{ metrics, chartData, donutData, allMetrics: getAllMetrics(1) }} sector={sector} loading={loading} presentationMode={true} />;\n" +
    "  };\n\n" +
    content.substring(endIndex);
  fs.writeFileSync('client/src/pages/dashboard.tsx', newContent);
  console.log("Replaced successfully!");
} else {
  console.log("Could not find boundaries", { startIndex, endIndex });
}
