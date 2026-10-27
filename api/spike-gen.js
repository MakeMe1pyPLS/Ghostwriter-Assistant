const mod = require('../dist/fn/spike.cjs');
module.exports = (req, res) => res.status(200).json({ ok: true, via: 'generated', kpis: mod.KPI_COUNTS });
