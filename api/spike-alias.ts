import { KPI_COUNTS } from '@shared/kpi-stats';
export default function handler(_req: any, res: any) { res.status(200).json({ ok: true, via: 'alias', kpis: KPI_COUNTS }); }
