export interface ExcelTheme {
  primary: string;
  primaryLight: string;
  primaryDark: string;
  accent: string;
  headerBg: string;
  headerText: string;
  cardBg: string;
  cardBorder: string;
  textDark: string;
  textMid: string;
  textLight: string;
  positiveTrend: string;
  negativeTrend: string;
  chartColors: string[];
  fontFamily: string;
}

export function getExcelTheme(): ExcelTheme {
  return {
    primary: 'FF0F766E',
    primaryLight: 'FFE6F7F5',
    primaryDark: 'FF0D5F58',
    accent: 'FF14B8A6',
    headerBg: 'FF0F172A',
    headerText: 'FFFFFFFF',
    cardBg: 'FFFFFFFF',
    cardBorder: 'FFE2E8F0',
    textDark: 'FF0F172A',
    textMid: 'FF475569',
    textLight: 'FF94A3B8',
    positiveTrend: 'FF059669',
    negativeTrend: 'FFDC2626',
    chartColors: ['FF0F766E', 'FF3B82F6', 'FF6366F1', 'FFF43F5E', 'FFF59E0B', 'FF10B981'],
    fontFamily: 'Calibri'
  };
}

export function hexToArgb(hex: string): string {
  const clean = hex.replace('#', '');
  return `FF${clean.toUpperCase()}`;
}