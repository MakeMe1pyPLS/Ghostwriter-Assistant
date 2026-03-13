export interface ExcelTheme {
  primary: string;
  primaryLight: string;
  primaryDark: string;
  primarySoft: string;
  accent: string;
  accentLight: string;
  headerBg: string;
  headerText: string;
  cardBg: string;
  cardBorder: string;
  cardShadow: string;
  sectionBg: string;
  pageBg: string;
  textDark: string;
  textMid: string;
  textLight: string;
  textMuted: string;
  positiveTrend: string;
  positiveTrendBg: string;
  negativeTrend: string;
  negativeTrendBg: string;
  neutralTrend: string;
  chartColors: string[];
  donutColors: string[];
  barGradient: [string, string];
  fontFamily: string;
  fontFamilyHeading: string;
  divider: string;
  rowStripe: string;
  rowStripeDark: string;
}

export function getExcelTheme(): ExcelTheme {
  return {
    primary: 'FF0F766E',
    primaryLight: 'FFCCFBF1',
    primaryDark: 'FF0D5F58',
    primarySoft: 'FFF0FDFA',
    accent: 'FF14B8A6',
    accentLight: 'FF99F6E4',
    headerBg: 'FF0F172A',
    headerText: 'FFFFFFFF',
    cardBg: 'FFFFFFFF',
    cardBorder: 'FFE2E8F0',
    cardShadow: 'FFF1F5F9',
    sectionBg: 'FFF8FAFC',
    pageBg: 'FFFAFBFD',
    textDark: 'FF0F172A',
    textMid: 'FF475569',
    textLight: 'FF94A3B8',
    textMuted: 'FFCBD5E1',
    positiveTrend: 'FF059669',
    positiveTrendBg: 'FFECFDF5',
    negativeTrend: 'FFDC2626',
    negativeTrendBg: 'FFFEF2F2',
    neutralTrend: 'FF64748B',
    chartColors: ['FF0F766E', 'FF3B82F6', 'FF8B5CF6', 'FFF43F5E', 'FFF59E0B', 'FF10B981', 'FF6366F1', 'FFEC4899'],
    donutColors: ['FF0F766E', 'FF14B8A6', 'FF5EEAD4', 'FF99F6E4', 'FFCCFBF1'],
    barGradient: ['FF0F766E', 'FF14B8A6'],
    fontFamily: 'Calibri',
    fontFamilyHeading: 'Calibri',
    divider: 'FFE2E8F0',
    rowStripe: 'FFF8FAFC',
    rowStripeDark: 'FFF1F5F9'
  };
}

export function hexToArgb(hex: string): string {
  const clean = hex.replace('#', '');
  return `FF${clean.toUpperCase()}`;
}