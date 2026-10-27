import mod from '../dist/fn/spike.cjs';
export default function handler(_req, res) { res.status(200).json({ ok: true, via: 'generated', kpis: mod.KPI_COUNTS }); }
