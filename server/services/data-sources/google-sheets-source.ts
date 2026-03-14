import { parseCsvText } from './csv-source';
import { inferColumns, registerDataset, type Dataset } from './dataset-registry';

export function extractSheetId(url: string): string | null {
  const match = url.match(/\/spreadsheets\/d\/([a-zA-Z0-9_-]+)/);
  return match ? match[1] : null;
}

export function buildExportUrl(sheetId: string): string {
  return `https://docs.google.com/spreadsheets/d/${sheetId}/export?format=csv`;
}

export async function fetchGoogleSheet(url: string): Promise<{ success: boolean; data?: Dataset; error?: string }> {
  const sheetId = extractSheetId(url);
  if (!sheetId) {
    return { success: false, error: 'Invalid Google Sheets URL. Expected format: https://docs.google.com/spreadsheets/d/{sheetId}/...' };
  }

  const exportUrl = buildExportUrl(sheetId);

  try {
    const response = await fetch(exportUrl);
    if (!response.ok) {
      return {
        success: false,
        error: `Could not fetch sheet (HTTP ${response.status}). Make sure the sheet is publicly accessible ("Anyone with the link can view").`
      };
    }

    const csvText = await response.text();
    if (!csvText.trim()) {
      return { success: false, error: 'Sheet appears to be empty.' };
    }

    const { rows } = parseCsvText(csvText);
    if (rows.length === 0) {
      return { success: false, error: 'No data rows found in the sheet.' };
    }

    const columns = inferColumns(rows);
    const dataset = registerDataset({
      name: `Google Sheet ${sheetId.slice(0, 8)}`,
      source_type: 'google-sheets',
      columns,
      rows,
      source_meta: { sheet_id: sheetId, source_url: url }
    });

    return { success: true, data: dataset };
  } catch (err: any) {
    return {
      success: false,
      error: `Failed to fetch sheet: ${err.message}. Ensure the sheet is set to "Anyone with the link can view".`
    };
  }
}