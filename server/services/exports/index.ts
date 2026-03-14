export { generateCsvExport } from './csv-exporter';
export { generateJsonExport } from './json-exporter';
export { generateDatasetExport } from './dataset-exporter';

export function formatExportDate(): string {
  return new Date().toISOString().slice(0, 10);
}

export function exportFilename(type: string, sector: string, ext: string): string {
  return `chaininsideiq_${type}_${sector || 'unified'}_${formatExportDate()}.${ext}`;
}