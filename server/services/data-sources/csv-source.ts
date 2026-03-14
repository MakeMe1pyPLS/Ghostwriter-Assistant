import { inferColumns, registerDataset, type Dataset, type DatasetColumn } from './dataset-registry';

export function parseCsvText(text: string): { headers: string[]; rows: Record<string, any>[] } {
  const lines = text.trim().split('\n');
  if (lines.length === 0) return { headers: [], rows: [] };

  const parseRow = (line: string): string[] => {
    const result: string[] = [];
    let current = '';
    let inQuotes = false;
    for (let i = 0; i < line.length; i++) {
      const ch = line[i];
      if (ch === '"') {
        if (inQuotes && line[i + 1] === '"') {
          current += '"';
          i++;
        } else {
          inQuotes = !inQuotes;
        }
      } else if (ch === ',' && !inQuotes) {
        result.push(current.trim());
        current = '';
      } else {
        current += ch;
      }
    }
    result.push(current.trim());
    return result;
  };

  const headers = parseRow(lines[0]);
  const rows = lines.slice(1)
    .filter(l => l.trim().length > 0)
    .map(line => {
      const values = parseRow(line);
      const row: Record<string, any> = {};
      headers.forEach((h, i) => {
        let val: any = values[i] || '';
        if (val !== '' && !isNaN(Number(val))) val = Number(val);
        row[h] = val;
      });
      return row;
    });

  return { headers, rows };
}

export function importCsvDataset(name: string, csvText: string): Dataset {
  const { rows } = parseCsvText(csvText);
  const columns = inferColumns(rows);

  return registerDataset({
    name,
    source_type: 'csv',
    columns,
    rows,
    source_meta: { original_size: csvText.length }
  });
}