import { useEffect, useMemo, useState } from "react";
import "./pcc-evidence-dashboard.css";
import { fetchPasadenaAcsContext, pccInstitutionalMetrics, sourceRegistry, type EvidenceMetric, type PasadenaAcsContext } from "./pccEvidenceData";

const classLabels: Record<EvidenceMetric["evidenceClass"], string> = {
  official_estimate: "Official estimate",
  institution_supplied: "Institution supplied",
  participant_reported: "Participant reported",
  relay_observed: "Relay Rider observed",
  relay_modeled: "Relay Rider modeled",
  unavailable: "Unavailable",
};

function valueOf(metric: EvidenceMetric) {
  if (metric.value == null) return "Not available";
  return metric.formatted ?? `${metric.value.toLocaleString()} ${metric.unit}`;
}

function MetricCard({ metric }: { metric: EvidenceMetric }) {
  return <article className={`evidence-kpi evidence-class-${metric.evidenceClass}`}>
    <div><p>{metric.label}</p><strong>{valueOf(metric)}</strong><small>{classLabels[metric.evidenceClass]}</small></div>
  </article>;
}

function ProvenanceRow({ metric }: { metric: EvidenceMetric }) {
  return <details className="provenance-row">
    <summary><span>{metric.label}</span><b>{valueOf(metric)}</b><em>{classLabels[metric.evidenceClass]}</em></summary>
    <div className="provenance-grid">
      <p><b>Source</b>{metric.source || "Not yet connected"}</p>
      <p><b>Vintage</b>{metric.vintage}</p>
      <p><b>Geography</b>{metric.geography}</p>
      <p><b>Sample / universe</b>{metric.sampleSize == null ? "Not available" : metric.sampleSize.toLocaleString()}</p>
      <p><b>Refresh</b>{new Date(metric.refreshedAt).toLocaleString()}</p>
      <p><b>Comparability</b>{metric.comparability.replaceAll("_", " ")}</p>
      <p className="wide"><b>Methodology</b>{metric.methodology}</p>
      <p className="wide"><b>Limitations</b>{metric.limitations.join(" · ")}</p>
      {metric.sourceUrl && <p className="wide"><a href={metric.sourceUrl} target="_blank" rel="noreferrer">Open official source ↗</a></p>}
    </div>
  </details>;
}

export default function PccEvidenceDashboard() {
  const [acs, setAcs] = useState<PasadenaAcsContext>({ status: "loading", metrics: [] });
  useEffect(() => { fetchPasadenaAcsContext(import.meta.env.VITE_CENSUS_API_KEY).then(setAcs); }, []);

  const allMetrics = useMemo(() => [...acs.metrics, ...pccInstitutionalMetrics], [acs.metrics]);
  const contextMode = acs.metrics.filter((m) => ["pasadena_drive_alone", "pasadena_carpool", "pasadena_transit", "pasadena_walk_bike", "pasadena_wfh"].includes(m.key));

  return <main className="evidence-shell">
    <header className="evidence-header">
      <div><p className="evidence-eyebrow">RELAY RIDER · PCC EVIDENCE WORKSPACE</p><h1>PCC / Pasadena Mobility Evidence Baseline</h1><p className="evidence-subtitle">Official Pasadena context + PCC institutional baseline + Relay Rider observations</p><div className="evidence-badges"><span className="badge demo">◉ Research beta</span><span className="badge info">ⓘ No PCC outcome is claimed until a verified institutional baseline and observation period are connected.</span></div></div>
      <div className="evidence-brand"><span>R</span><strong>Relay Rider</strong></div>
    </header>

    <section className="evidence-panel evidence-status">
      <div><span className={`status-dot ${acs.status}`} /> <b>Pasadena contextual baseline:</b> {acs.status === "ready" ? "connected to Census ACS" : acs.status === "loading" ? "loading official ACS data…" : "official ACS request unavailable"}</div>
      <div><span className="status-dot unavailable" /> <b>PCC institutional baseline:</b> awaiting approved PCC record import or baseline survey.</div>
      <div><span className="status-dot unavailable" /> <b>Relay Rider current observation:</b> awaiting a locked PCC observation window.</div>
      {acs.message && <small>{acs.message}</small>}
    </section>

    <section className="evidence-kpi-grid" aria-label="Evidence readiness">
      {pccInstitutionalMetrics.map((metric) => <MetricCard key={metric.key} metric={metric} />)}
    </section>

    <section className="evidence-two-col">
      <article className="evidence-panel">
        <div className="panel-title-row"><h2>A. Pasadena commute context</h2><span className="method-pill">ACS 2024 5-Year</span></div>
        <p className="panel-copy">Official residence-based context for Pasadena. These estimates are useful for comparison, but they are not PCC commuter behavior.</p>
        {acs.status === "ready" ? <div className="context-list">{contextMode.map((metric) => <div key={metric.key}><span>{metric.label.replace("Pasadena ", "")}</span><strong>{valueOf(metric)}</strong><small>Official estimate · context only</small></div>)}</div> : <div className="empty-state">Official ACS context is unavailable in this session. Configure <code>VITE_CENSUS_API_KEY</code> if the Census endpoint requires a key.</div>}
      </article>

      <article className="evidence-panel">
        <div className="panel-title-row"><h2>B. PCC VMT & emissions evidence</h2><span className="method-pill neutral">Awaiting PCC data</span></div>
        <p className="panel-copy">This panel will become the before/current comparison once PCC commute records or a verified baseline survey are imported.</p>
        <div className="locked-metrics">
          <div><span>Baseline weekly VMT</span><b>Not available</b><small>Institution supplied</small></div>
          <div><span>Current observed weekly VMT</span><b>Not available</b><small>Participant reported</small></div>
          <div><span>Difference from baseline</span><b>Not available</b><small>Calculated only after comparable periods exist</small></div>
          <div><span>Modeled CO₂e difference</span><b>Not available</b><small>CARB EMFAC2025 method after VMT verification</small></div>
        </div>
      </article>
    </section>

    <section className="evidence-two-col lower">
      <article className="evidence-panel"><h2>Evidence ladder</h2><div className="evidence-ladder">
        <div className="ready"><b>1. Pasadena context</b><span>ACS / LODES</span><small>Official population estimates</small></div>
        <div><b>2. PCC baseline</b><span>Institutional import / survey</span><small>Actual PCC cohort</small></div>
        <div><b>3. Current observation</b><span>Relay Rider participant records</span><small>Day-specific commute behavior</small></div>
        <div><b>4. VMT difference</b><span>Baseline vs current</span><small>Descriptive comparison</small></div>
        <div><b>5. Modeled emissions</b><span>CARB EMFAC2025</span><small>Modeled, not certified reduction</small></div>
      </div></article>

      <article className="evidence-panel"><h2>Source registry</h2><div className="source-registry">{sourceRegistry.map((source) => <div key={source.id}><b>{source.agency}</b><span>{source.dataset}</span><small>{source.role}</small><a href={source.url} target="_blank" rel="noreferrer">Official source ↗</a></div>)}</div></article>
    </section>

    <section className="evidence-panel provenance"><h2>Metric provenance</h2><p className="panel-copy">Every metric carries source, vintage, geography, refresh time, methodology, limitations, sample size, and comparability.</p>{allMetrics.length ? allMetrics.map((metric) => <ProvenanceRow key={metric.key} metric={metric} />) : <div className="empty-state">No metrics loaded.</div>}</section>

    <section className="evidence-panel confidence"><h2>Evidence confidence</h2><div className="confidence-grid"><div className="confidence-card official"><b>✓ Official Estimate</b><small>Government/statistical source</small></div><div className="confidence-card institution"><b>▥ Institution Supplied</b><small>PCC-approved record or survey data</small></div><div className="confidence-card participant"><b>○ Participant Reported</b><small>Self-reported current behavior</small></div><div className="confidence-card observed"><b>◉ Relay Rider Observed</b><small>Platform-generated event or workflow signal</small></div><div className="confidence-card modeled"><b>↗ Relay Rider Modeled</b><small>Derived estimate with versioned method</small></div></div></section>

    <footer className="evidence-footer"><span>▤</span><p><b>Research-grade evidence rule:</b> ACS and LODES provide context; they do not substitute for PCC-specific commute records. VMT and emissions differences remain unavailable until comparable PCC baseline and current observations are verified. Modeled emissions are not certified emissions reductions or carbon offsets.</p></footer>
  </main>;
}
