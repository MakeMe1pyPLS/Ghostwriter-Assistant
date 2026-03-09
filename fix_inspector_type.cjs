const fs = require('fs');
const content = fs.readFileSync('client/src/components/WidgetInspector.tsx', 'utf-8');

const oldTypeOptions = `<SelectContent className="rounded-xl z-[105]">\n                        <SelectItem value="kpi" className="text-xs">KPI Card</SelectItem>\n                        <SelectItem value="trend" className="text-xs">Trend Chart</SelectItem>\n                        <SelectItem value="bar" className="text-xs">Bar Chart</SelectItem>\n                        <SelectItem value="donut" className="text-xs">Donut Chart</SelectItem>\n                        <SelectItem value="table" className="text-xs">Data Table</SelectItem>\n                      </SelectContent>`;

const newTypeOptions = `<SelectContent className="rounded-xl z-[105] max-h-[300px]">
                        <SelectGroup>
                          <SelectLabel className="text-[10px] text-slate-500 uppercase">Summary Cards</SelectLabel>
                          <SelectItem value="kpi" className="text-xs">KPI Card</SelectItem>
                        </SelectGroup>
                        <SelectGroup>
                          <SelectLabel className="text-[10px] text-slate-500 uppercase mt-2">Charts & Graphs</SelectLabel>
                          <SelectItem value="trend" className="text-xs">Trend / Time Series</SelectItem>
                          <SelectItem value="bar" className="text-xs">Bar / Comparison</SelectItem>
                          <SelectItem value="donut" className="text-xs">Donut / Distribution</SelectItem>
                          <SelectItem value="progress" className="text-xs">Progress Ring</SelectItem>
                        </SelectGroup>
                        <SelectGroup>
                          <SelectLabel className="text-[10px] text-slate-500 uppercase mt-2">Data & Lists</SelectLabel>
                          <SelectItem value="table" className="text-xs">Data Table</SelectItem>
                        </SelectGroup>
                      </SelectContent>`;

let newContent = content.replace(oldTypeOptions, newTypeOptions);

fs.writeFileSync('client/src/components/WidgetInspector.tsx', newContent);
console.log("WidgetInspector type dropdown updated!");
