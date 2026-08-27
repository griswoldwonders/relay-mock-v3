import { useMemo, useState } from "react";
import "./operational-saas-workspace.css";
import Rule2202Workspace from "./Rule2202Workspace";
import { PASADENA_PUBLIC_METRICS, PASADENA_SOURCE_REGISTRY } from "./pasadenaPublicData";

type WorkspaceView =
  | "command"
  | "rule2202"
  | "intake"
  | "corridors"
  | "tasks"
  | "reports"
  | "ev"
  | "settings";

const NAV: Array<{ id: WorkspaceView; label: string; group: string }> = [
  { id: "command", label: "Command Center", group: "Overview" },
  { id: "rule2202", label: "Rule 2202", group: "Compliance" },
  { id: "tasks", label: "Tasks & Reviews", group: "Compliance" },
  { id: "intake", label: "Commute Data", group: "Evidence" },
  { id: "corridors", label: "Origin & Corridor Context", group: "Evidence" },
  { id: "ev", label: "EV / ZEV Context", group: "Evidence" },
  { id: "reports", label: "Reports", group: "Reporting" },
  { id: "settings", label: "Data Settings", group: "Admin" },
];

const metricMap = Object.fromEntries(PASADENA_PUBLIC_METRICS.map((metric) => [metric.key, metric]));

export default function OperationalSaasWorkspace() {
  const [view, setView] = useState<WorkspaceView>("command");
  const title = NAV.find((item) => item.id === view)?.label ?? "Command Center";
  const groups = useMemo(() => Array.from(new Set(NAV.map((item) => item.group))), []);

  return (
    <div className="ops-app">
      <aside className="ops-sidebar">
        <div className="ops-brand"><div className="ops-mark">R</div><div><strong>Relay Rider</strong><span>Rule 2202 + Commute Intelligence</span></div></div>
        <div className="ops-tenant"><small>GEOGRAPHY</small><button>Pasadena, California<span>⌄</span></button></div>
        <nav>
          {groups.map((group) => <div className="ops-nav-group" key={group}><small>{group}</small>{NAV.filter((item) => item.group === group).map((item) => <button key={item.id} className={view === item.id ? "active" : ""} aria-current={view === item.id ? "page" : undefined} onClick={() => setView(item.id)}><span className="ops-nav-dot" aria-hidden="true" />{item.label}</button>)}</div>)}
        </nav>
        <div className="ops-sidebar-foot"><span className="ops-demo-dot" />Compliance-support workspace<small>Public Pasadena context is source-backed. Employer-specific Rule 2202 values remain unavailable until verified employer data are connected.</small></div>
      </aside>

      <section className="ops-main">
        <header className="ops-topbar"><div><small>RULE 2202 COMPLIANCE + PASADENA EVIDENCE</small><h1>{title}</h1></div><div className="ops-top-actions"><button className="ghost" type="button" aria-label="Print current workspace" onClick={() => window.print()}>Print</button></div></header>
        <main className="ops-content">
          {view === "command" && <CommandCenter onNavigate={setView} />}
          {view === "rule2202" && <Rule2202Workspace />}
          {view === "tasks" && <Tasks onNavigate={setView} />}
          {view === "intake" && <CommuteData />}
          {view === "corridors" && <Corridors />}
          {view === "ev" && <EvReadiness />}
          {view === "reports" && <Reports />}
          {view === "settings" && <Settings />}
        </main>
      </section>
    </div>
  );
}

function CommandCenter({ onNavigate }: { onNavigate: (view: WorkspaceView) => void }) {
  const cards = ["population_2025", "mean_commute_2024_1y", "drive_alone", "work_home", "transit", "carpool"].map((key) => metricMap[key]);
  return <>
    <section className="ops-hero"><div><span className="ops-eyebrow">COMPLIANCE OPERATIONS</span><h2>Run Rule 2202 from verified worksite data, not a static dashboard.</h2><p>Relay Rider now separates the employer compliance workflow from public Pasadena context. Worksite population, AVR, weekly VMT, telecommute activity and filing status stay unavailable until verified employer records support them.</p><div className="ops-hero-actions"><button className="primary" onClick={() => onNavigate("rule2202")}>Open Rule 2202 workspace</button><button className="ghost" onClick={() => onNavigate("intake")}>Review data sources</button></div></div><div className="ops-health"><small>2026 RULE 2202</small><strong>Blocked</strong><span>Employer data not connected</span><div><i style={{width:"17%"}} /></div><p>Next operational dependency: confirm the regulated worksite, employee population, business classification, ETC/site contact, reporting due date and selected VMT input pathway.</p></div></section>
    <div className="ops-grid two">
      <Panel title="Rule 2202 readiness"><div className="ops-task-list"><article><div><strong>Worksite applicability</strong><span>250+ employee threshold must be evaluated using actual worksite records</span></div><div><b className="warn">Needs input</b></div></article><article><div><strong>Survey / ZIP pathway</strong><span>AQMD supports AVR survey data or anonymized employee ZIP-code VMT inputs</span></div><div><b className="neutral">Not selected</b></div></article><article><div><strong>Weekly VMT by mode</strong><span>Required reporting value is unavailable until the AQMD input dataset is validated</span></div><div><b className="warn">Unavailable</b></div></article></div></Panel>
      <Panel title="Pasadena public context"><div className="ops-task-list"><article><div><strong>ACS commute mode context</strong><span>Official estimate for Pasadena residents; not employer commute behavior</span></div><div><b className="neutral">Source-backed</b></div></article><article><div><strong>PWP charging inventory</strong><span>Official utility infrastructure status; not commuter charging demand</span></div><div><b className="neutral">Source-backed</b></div></article><article><div><strong>Employer-specific baseline</strong><span>No verified worksite commute dataset connected</span></div><div><b className="warn">Unavailable</b></div></article></div></Panel>
    </div>
    <section className="ops-metrics">{cards.map((metric) => <article key={metric.key}><small>{metric.label}</small><strong>{metric.value}</strong><span>{metric.vintage} · Pasadena public context</span></article>)}</section>
    <Panel title="Public Pasadena evidence"><SourceMetricTable /></Panel>
  </>;
}

function SourceMetricTable() {
  return <div className="ops-table"><div className="head"><span>Metric</span><span>Value</span><span>Vintage</span><span>Class</span><span>Geography</span></div>{PASADENA_PUBLIC_METRICS.map((metric) => <div className="row" key={metric.key}><span className="strong">{metric.label}</span><span>{metric.value}</span><span>{metric.vintage}</span><span>{metric.evidenceClass.replace("_", " ")}</span><span>{metric.geography}</span></div>)}</div>;
}

function CommuteData() { return <div className="ops-grid two"><Panel title="Source registry"><div className="ops-records">{PASADENA_SOURCE_REGISTRY.map((source) => <article key={source.name}><strong>{source.name}</strong><span>{source.role}</span><span>{source.vintage}</span><a href={source.url} target="_blank" rel="noreferrer">Open source ↗</a></article>)}</div></Panel><Panel title="Employer Rule 2202 data"><div className="ops-empty"><strong>No verified employer commute dataset is connected.</strong><p>The operational import should accept an employer roster, completed AQMD 5-day or 7-day survey records, or the anonymized ZIP dataset required for the applicable AQMD VMT pathway. Every import should retain provenance and validation history.</p></div></Panel><Panel title="Public commute context"><div className="ops-kpis"><div><strong>{metricMap.drive_alone.value}</strong><span>drive alone</span></div><div><strong>{metricMap.carpool.value}</strong><span>carpool</span></div><div><strong>{metricMap.transit.value}</strong><span>public transit</span></div><div><strong>{metricMap.work_home.value}</strong><span>worked from home</span></div></div><p className="ops-note">U.S. Census Bureau ACS 2024 1-Year estimates for Pasadena city residents. These values are contextual and are not Rule 2202 worksite values.</p></Panel><Panel title="Travel-time context"><div className="ops-period"><span>ACS 2024 1-YEAR</span><strong>{metricMap.mean_commute_2024_1y.value}</strong><p>Mean travel time to work for Pasadena workers age 16+.</p></div></Panel></div>; }

function Corridors() { return <div className="ops-grid two"><Panel title="Pasadena corridor evidence"><div className="ops-empty"><strong>No employer corridor counts are displayed.</strong><p>The City of Pasadena maintains a Traffic Count Database with approach and turning-movement counts. These public traffic volumes can provide context but should not be represented as a Rule 2202 employee commute baseline.</p><a href="https://www.cityofpasadena.net/transportation/traffic-engineering-operations/" target="_blank" rel="noreferrer">Open Pasadena traffic-count source ↗</a></div></Panel><Panel title="Workforce origin-destination"><div className="ops-empty"><strong>LODES connection pending.</strong><p>Use Census LEHD/LODES for public workforce origin-destination context. Employer Rule 2202 records remain the authoritative worksite population for compliance reporting.</p><a href="https://lehd.ces.census.gov/data/lodes/" target="_blank" rel="noreferrer">Open LODES source ↗</a></div></Panel></div>; }

function Tasks({ onNavigate }: { onNavigate: (view: WorkspaceView) => void }) { return <Panel title="Compliance work queue"><div className="ops-task-list large"><article><div><strong>Confirm Rule 2202 worksite profile</strong><span>Worksite address, employee population, classification, ETC/site contact and due date</span></div><div><b className="danger">Blocking</b><button className="ghost" onClick={() => onNavigate("rule2202")}>Open</button></div></article><article><div><strong>Select VMT reporting pathway</strong><span>AVR survey records or anonymized ZIP-code workflow</span></div><div><b className="warn">Required</b><button className="ghost" onClick={() => onNavigate("rule2202")}>Open</button></div></article><article><div><strong>Connect employer commute data</strong><span>Needed before AVR, weekly VMT or compliance-package values can be calculated</span></div><div><b className="warn">Open</b></div></article><article><div><strong>Extract Pasadena public context</strong><span>Continue LODES, traffic-count and CEC ZEV context separately from compliance values</span></div><div><b className="neutral">Source identified</b></div></article></div></Panel>; }

function EvReadiness() { return <><section className="ops-summary-strip"><div><strong>{metricMap.pwp_l2.value}</strong><span>PWP Level 2 chargers</span></div><div><strong>{metricMap.pwp_fast.value}</strong><span>PWP public fast chargers</span></div><div><strong>2</strong><span>L2 offline at cited update</span></div><div><strong>14</strong><span>fast chargers offline at cited update</span></div></section><div className="ops-grid two"><Panel title="PWP infrastructure status"><div className="ops-decision"><small>OFFICIAL OBSERVED SOURCE</small><strong>Pasadena Water and Power reported 116 Level 2 chargers and 45 public fast chargers across its listed sites.</strong><p>The cited status page is dated March 12, 2026 and reported 2 Level 2 chargers and 14 fast chargers offline. Infrastructure inventory does not establish employee charging demand or Rule 2202 compliance credit.</p></div></Panel><Panel title="ZEV population"><div className="ops-empty"><strong>City-specific ZEV population not yet extracted.</strong><p>The California Energy Commission publishes vehicle-population and ZEV datasets. Extract Pasadena geography directly before displaying a local adoption count.</p><a href="https://www.energy.ca.gov/files/zev-and-infrastructure-stats-data" target="_blank" rel="noreferrer">Open CEC ZEV datasets ↗</a></div></Panel></div></>; }

function Reports() { return <div className="ops-grid three"><ReportCard type="Rule 2202" title="Annual compliance package" status="Employer data required"/><ReportCard type="Public Baseline" title="Pasadena commute context" status="Source-backed"/><ReportCard type="Evidence Comparison" title="Worksite VMT comparison" status="Not available"/></div>; }
function ReportCard({type,title,status}:{type:string;title:string;status:string}) { return <article className="ops-report-card"><small>{type}</small><h3>{title}</h3><span>{status}</span></article>; }
function Settings() { return <div className="ops-grid two"><Panel title="Compliance policy"><div className="ops-settings-list"><p><span>Rule 2202 year</span><strong>2026 methodology</strong></p><p><span>Employer values without source</span><strong>Hidden</strong></p><p><span>AQMD filing status</span><strong>Never inferred</strong></p><p><span>Automatic submission</span><strong>Disabled</strong></p></div></Panel><Panel title="Evidence policy"><div className="ops-settings-list"><p><span>Pasadena ACS</span><strong>Context only</strong></p><p><span>Employer commute records</span><strong>Compliance source when verified</strong></p><p><span>Public traffic / ZEV data</span><strong>Context only</strong></p><p><span>Modeled reductions</span><strong>Hidden until inputs exist</strong></p></div></Panel></div>; }
function Panel({title,action,onAction,children}:{title:string;action?:string;onAction?:()=>void;children:React.ReactNode}) { return <section className="ops-panel"><header><h2>{title}</h2>{action&&<button className="text" onClick={onAction}>{action} →</button>}</header>{children}</section>; }
