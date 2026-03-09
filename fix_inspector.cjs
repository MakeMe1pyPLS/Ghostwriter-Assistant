const fs = require('fs');
const content = fs.readFileSync('client/src/components/WidgetInspector.tsx', 'utf-8');

// The issue in WidgetInspector is that it needs the ability to set `chartType` to values like 'pie', 'progress', etc.
// Let's modify the chartType SelectContent
const oldChartTypeOptions = `<SelectContent className="rounded-xl z-[105]">\n                        <SelectItem value="area" className="text-xs">Area</SelectItem>\n                        <SelectItem value="bar" className="text-xs">Bar</SelectItem>\n                        <SelectItem value="line" className="text-xs">Line</SelectItem>\n                        <SelectItem value="donut" className="text-xs">Donut</SelectItem>\n                      </SelectContent>`;

const newChartTypeOptions = `<SelectContent className="rounded-xl z-[105]">\n                        <SelectGroup>\n                          <SelectLabel className="text-[10px] text-slate-500 uppercase">Trend</SelectLabel>\n                          <SelectItem value="area" className="text-xs">Area</SelectItem>\n                          <SelectItem value="bar" className="text-xs">Bar</SelectItem>\n                          <SelectItem value="line" className="text-xs">Line</SelectItem>\n                        </SelectGroup>\n                        <SelectGroup>\n                          <SelectLabel className="text-[10px] text-slate-500 uppercase mt-2">Distribution</SelectLabel>\n                          <SelectItem value="donut" className="text-xs">Donut</SelectItem>\n                          <SelectItem value="pie" className="text-xs">Pie</SelectItem>\n                        </SelectGroup>\n                        <SelectGroup>\n                          <SelectLabel className="text-[10px] text-slate-500 uppercase mt-2">Part-to-Whole</SelectLabel>\n                          <SelectItem value="progress" className="text-xs">Progress Ring</SelectItem>\n                        </SelectGroup>\n                      </SelectContent>`;

let newContent = content.replace(oldChartTypeOptions, newChartTypeOptions);

// Also we need to make sure the user can select chart types even for KPI or other widgets if we allow it
const oldChartWidgetCheck = `const isChartWidget = ['trend', 'bar', 'donut'].includes(widget.type);`;
const newChartWidgetCheck = `const isChartWidget = ['trend', 'bar', 'donut', 'kpi', 'table', 'progress'].includes(widget.type);`;

newContent = newContent.replace(oldChartWidgetCheck, newChartWidgetCheck);

fs.writeFileSync('client/src/components/WidgetInspector.tsx', newContent);
console.log("WidgetInspector updated!");
