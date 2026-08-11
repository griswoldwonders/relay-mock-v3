import "./pcc-evidence-dashboard.css";

const corridors = [
  { corridor: "Eagle Rock → PCC", participants: 31, vmt: "2,180 mi", previews: 14 },
  { corridor: "Glendale → PCC", participants: 24, vmt: "2,640 mi", previews: 10 },
  { corridor: "Highland Park → PCC", participants: 19, vmt: "988 mi", previews: 7 },
  { corridor: "Pasadena Local → PCC", participants: 22, vmt: "540 mi", previews: 9 },
];

const modeLegend = [
  ["Drive Alone", "68%", "mode-blue"],
  ["Carpool", "9%", "mode-teal"],
  ["Transit", "14%", "mode-gold"],
  ["Walk/Bike", "5%", "mode-green"],
  ["Other/Remote", "4%", "mode-gray"],
] as const;

function KpiCard({ icon, label, value }: { icon: string; label: string; value: string }) {
  return <article className="evidence-kpi"><span className="evidence-kpi-icon" aria-hidden="true">{icon}</span><div><p>{label}</p><strong>{value}</strong></div></article>;
}

function BarPair({ baseline, current, baselineLabel, currentLabel, max }: { baseline: number; current: number; baselineLabel: string; currentLabel: string; max: number }) {
  return <div className="evidence-bars" aria-label={`${baselineLabel} compared with ${currentLabel}`}>
    <div className="evidence-bar-col"><span>{baselineLabel}</span><div className="evidence-bar-track"><div className="evidence-bar baseline" style={{ height: `${Math.max(8, (baseline / max) * 100)}%` }} /></div><small>Baseline</small></div>
    <div className="evidence-bar-col"><span>{currentLabel}</span><div className="evidence-bar-track"><div className="evidence-bar current" style={{ height: `${Math.max(8, (current / max) * 100)}%` }} /></div><small>Current</small></div>
  </div>;
}

export default function PccEvidenceDashboard() {
  return <main className="evidence-shell">
    <header className="evidence-header">
      <div><p className="evidence-eyebrow">RELAY RIDER · MOBILITY EVIDENCE</p><h1>PCC / Pasadena Mobility Evidence Baseline</h1><p className="evidence-subtitle">Commuter baseline, weekly VMT, and modeled emissions comparison</p><div className="evidence-badges"><span className="badge demo">◉ Demonstration Environment</span><span className="badge info">ⓘ Illustrative demo data — not an official AQMD filing</span></div></div>
      <div className="evidence-brand"><span>R</span><strong>Relay Rider</strong></div>
    </header>

    <section className="evidence-kpi-grid" aria-label="Key metrics">
      <KpiCard icon="◎" label="Participant Cohort" value="184" />
      <KpiCard icon="▣" label="Drive-Alone Share" value="68%" />
      <KpiCard icon="P" label="Parking Difficulty" value="62%" />
      <KpiCard icon="◒" label="EV / Hybrid Share" value="24%" />
    </section>

    <section className="evidence-two-col">
      <article className="evidence-panel compare-panel">
        <div className="panel-title-row"><h2>A. Weekly VMT <small>(miles)</small></h2><span className="change-pill">↓ -8.4%</span></div>
        <div className="compare-body"><dl><div><dt><i className="dot blue" />Baseline</dt><dd>18,420 mi</dd></div><div><dt><i className="dot teal" />Current</dt><dd>16,870 mi</dd></div><div><dt><i className="dot purple" />Difference</dt><dd className="purple-text">-1,550 mi</dd></div><div className="compare-divider"><dt>Change</dt><dd><span className="change-pill">-8.4%</span></dd></div></dl><BarPair baseline={18420} current={16870} baselineLabel="18,420" currentLabel="16,870" max={20000} /></div>
      </article>

      <article className="evidence-panel compare-panel">
        <div className="panel-title-row"><h2>B. Modeled CO₂e <small>(t/week)</small></h2><span className="method-pill">Modeled estimate</span></div>
        <div className="compare-body"><dl><div><dt><i className="dot blue" />Baseline</dt><dd>4.2 t/week</dd></div><div><dt><i className="dot teal" />Current</dt><dd>3.9 t/week</dd></div><div><dt><i className="dot purple" />Difference</dt><dd className="purple-text">-0.3 t/week</dd></div><div className="compare-divider"><dt>Method</dt><dd><span className="method-pill">Modeled estimate</span></dd></div></dl><BarPair baseline={4.2} current={3.9} baselineLabel="4.2" currentLabel="3.9" max={5} /></div>
      </article>
    </section>

    <section className="evidence-two-col lower">
      <article className="evidence-panel commute-panel"><h2>Commute Baseline</h2><div className="commute-body"><div className="donut-wrap"><div className="mode-donut"><span>◎</span></div></div><div className="mode-legend">{modeLegend.map(([label, value, className]) => <div key={label}><span className={`legend-swatch ${className}`} /><b>{label}</b><strong>{value}</strong></div>)}</div><div className="commute-stats"><div><span className="stat-icon">⌖</span><p>Median one-way<br/>commute<strong>8.7 mi</strong></p></div><div><span className="stat-icon green">◷</span><p>Median travel<br/>time<strong>31 min</strong></p></div></div></div></article>

      <article className="evidence-panel corridor-panel"><h2>Corridor Evidence</h2><div className="corridor-table" role="table"><div className="corridor-row header" role="row"><span>Corridor</span><span>Participants</span><span>Baseline Weekly VMT</span><span>Match Previews</span></div>{corridors.map((row) => <div className="corridor-row" role="row" key={row.corridor}><strong>{row.corridor}</strong><span>{row.participants}</span><span>{row.vmt}</span><b>{row.previews}</b></div>)}</div><p className="corridor-note">ⓘ Use for corridor prioritization, not proof of causality.</p></article>
    </section>

    <section className="evidence-panel confidence"><h2>Evidence Confidence</h2><div className="confidence-grid"><div className="confidence-card official"><b>✓ Official Estimate</b><small>Highest confidence</small></div><div className="confidence-card institution"><b>▥ Institution Supplied</b><small>Verified third-party data</small></div><div className="confidence-card participant"><b>○ Participant Reported</b><small>Self-reported by users</small></div><div className="confidence-card observed"><b>◉ Relay Rider Observed</b><small>Observed platform signals</small></div><div className="confidence-card modeled"><b>↗ Relay Rider Modeled</b><small>Model-based estimate</small></div></div></section>

    <footer className="evidence-footer"><span>▤</span><p>This dashboard is a concept visual for research-grade commute evidence. Baseline and current values are illustrative placeholders.<br/><b>Final metrics should display source, vintage, geography, refresh date, and methodology notes.</b></p></footer>
  </main>;
}
