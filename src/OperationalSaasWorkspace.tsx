import { useMemo, useState } from "react";
import "./operational-saas-workspace.css";
import { PASADENA_PUBLIC_METRICS, PASADENA_SOURCE_REGISTRY } from "./pasadenaPublicData";

type WorkspaceView =
  | "command"
  | "intake"
  | "corridors"
  | "tasks"
  | "reports"
  | "ev"
  | "settings";

const NAV: Array<{ id: WorkspaceView; label: string; group: string }> = [
  { id: "command", label: "Command Center", group: "Operate" },
  { id: "tasks", label: "Tasks & Reviews", group: "Operate" },
  { id: "intake", label: "Commute Data", group: "Understand" },
  { id: "corridors", label: "Corridors", group: "Understand" },
  { id: "ev", label: "EV Readiness", group: "Understand" },
  { id: "reports", label: "Reports", group: "Measure" },
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
        <div className="ops-brand"><div className="ops-mark">R</div><div><strong>Relay Rider</strong><span>Pasadena Commute Intelligence</span></div></div>
        <div className="ops-tenant"><small>GEOGRAPHY</small><button>Pasadena, California<span>⌄</span></button></div>
        <nav>
          {groups.map((group) => <div className="ops-nav-group" key={group}><small>{group}</small>{NAV.filter((item) => item.group === group).map((item) => <button key={item.id} className={view === item.id ? "active" : ""} onClick={() => setView(item.id)}><span className="ops-nav-dot" />{item.label}</button>)}</div>)}
        </nav>
        <div className="ops-sidebar-foot"><span className="ops-demo-dot" />Public evidence workspace<small>No synthetic PCC or Pasadena operational metrics are displayed.</small></div>
      </aside>

      <section className="ops-main">
        <header className="ops-topbar"><div><small>PASADENA PUBLIC COMMUTE EVIDENCE</small><h1>{title}</h1></div><div className="ops-top-actions"><button className="ghost" onClick={() => window.print()}>Print</button></div></header>
        <main className="ops-content">
          {view === "command" && <CommandCenter onNavigate={setView} />}
          {view === "tasks" && <Tasks />}
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
    <section className="ops-hero"><div><span className="ops-eyebrow">CURRENT PUBLIC BASELINE</span><h2>Start with verified Pasadena data, then layer PCC-specific evidence only when it exists.</h2><p>This workspace separates public Pasadena context from future PCC institutional records and Relay Rider observations. No corridor participant counts, VMT reductions, parking-pressure scores, or PCC commuter counts are shown unless they are backed by a verified source.</p><div className="ops-hero-actions"><button className="primary" onClick={() => onNavigate("intake")}>Review source registry</button><button className="ghost" onClick={() => onNavigate("corridors")}>See corridor data gaps</button></div></div><div className="ops-health"><small>DATA STATUS</small><strong>Public</strong><span>Pasadena baseline</span><div><i style={{width:"72%"}} /></div><p>ACS, Census QuickFacts, Pasadena traffic-count sources, PWP charging data, CEC ZEV datasets, and LODES are identified. PCC-specific institutional and participant data are not yet connected.</p></div></section>
    <section className="ops-metrics">{cards.map((metric) => <article key={metric.key}><small>{metric.label}</small><strong>{metric.value}</strong><span>{metric.vintage}</span></article>)}</section>
    <div className="ops-grid two">
      <Panel title="What is real now"><div className="ops-task-list"><article><div><strong>Pasadena commute mode</strong><span>ACS 2024 1-Year estimate for Pasadena residents</span></div><div><b className="neutral">Official estimate</b></div></article><article><div><strong>Pasadena population</strong><span>Latest Census QuickFacts population estimate shown in this workspace</span></div><div><b className="neutral">Official estimate</b></div></article><article><div><strong>PWP charging inventory</strong><span>Published City utility infrastructure status</span></div><div><b className="neutral">Official observed</b></div></article></div></Panel>
      <Panel title="What remains unavailable"><div className="ops-task-list"><article><div><strong>PCC commuter baseline</strong><span>No verified institutional PCC commute dataset connected</span></div><div><b className="warn">Unavailable</b></div></article><article><div><strong>PCC VMT and emissions difference</strong><span>Requires comparable PCC baseline and observation records</span></div><div><b className="warn">Unavailable</b></div></article><article><div><strong>Relay Rider corridor participation totals</strong><span>Requires real participant records</span></div><div><b className="warn">Unavailable</b></div></article></div></Panel>
    </div>
    <Panel title="Public Pasadena evidence"><SourceMetricTable /></Panel>
  </>;
}

function SourceMetricTable() {
  return <div className="ops-table"><div className="head"><span>Metric</span><span>Value</span><span>Vintage</span><span>Class</span><span>Geography</span></div>{PASADENA_PUBLIC_METRICS.map((metric) => <div className="row" key={metric.key}><span className="strong">{metric.label}</span><span>{metric.value}</span><span>{metric.vintage}</span><span>{metric.evidenceClass.replace("_", " ")}</span><span>{metric.geography}</span></div>)}</div>;
}

function CommuteData() { return <div className="ops-grid two"><Panel title="Source registry"><div className="ops-records">{PASADENA_SOURCE_REGISTRY.map((source) => <article key={source.name}><strong>{source.name}</strong><span>{source.role}</span><span>{source.vintage}</span><a href={source.url} target="_blank" rel="noreferrer">Open source ↗</a></article>)}</div></Panel><Panel title="PCC institutional data"><div className="ops-empty"><strong>No verified PCC commuter dataset is connected.</strong><p>When PCC supplies an approved anonymized commute file or Relay Rider collects a governed baseline cohort, this panel can show sample size, source, observation period, commute mode, commute distance, occupancy, and VMT methodology.</p></div></Panel><Panel title="Public commute context"><div className="ops-kpis"><div><strong>{metricMap.drive_alone.value}</strong><span>drive alone</span></div><div><strong>{metricMap.carpool.value}</strong><span>carpool</span></div><div><strong>{metricMap.transit.value}</strong><span>public transit</span></div><div><strong>{metricMap.work_home.value}</strong><span>worked from home</span></div></div><p className="ops-note">U.S. Census Bureau ACS 2024 1-Year estimates for Pasadena city residents. These values are contextual and should not be treated as PCC commuter behavior.</p></Panel><Panel title="Travel-time context"><div className="ops-period"><span>ACS 2024 1-YEAR</span><strong>{metricMap.mean_commute_2024_1y.value}</strong><p>Mean travel time to work for Pasadena workers age 16+.</p></div></Panel></div>; }

function Corridors() { return <div className="ops-grid two"><Panel title="Pasadena corridor evidence"><div className="ops-empty"><strong>No corridor-level commuter counts are displayed yet.</strong><p>The City of Pasadena maintains a Traffic Count Database with current approach and turning-movement counts. Relay Rider should ingest specific intersections and corridors from that official system before displaying corridor volumes.</p><a href="https://www.cityofpasadena.net/transportation/traffic-engineering-operations/" target="_blank" rel="noreferrer">Open Pasadena traffic-count source ↗</a></div></Panel><Panel title="Workforce origin-destination"><div className="ops-empty"><strong>LODES connection pending.</strong><p>Use Census LEHD/LODES for public workforce origin-destination context. Do not label LODES flows as PCC commute records.</p><a href="https://lehd.ces.census.gov/data/lodes/" target="_blank" rel="noreferrer">Open LODES source ↗</a></div></Panel></div>; }

function Tasks() { return <Panel title="Evidence work queue"><div className="ops-task-list large"><article><div><strong>Connect PCC baseline data</strong><span>Needed before PCC-specific VMT or emissions comparisons</span></div><div><b className="warn">Open</b></div></article><article><div><strong>Extract official Pasadena corridor counts</strong><span>Use PDOT Traffic Count Database for selected corridors</span></div><div><b className="neutral">Source identified</b></div></article><article><div><strong>Extract Pasadena workforce flows</strong><span>Use latest LODES release for public OD context</span></div><div><b className="neutral">Source identified</b></div></article><article><div><strong>Extract Pasadena ZEV population</strong><span>Use latest California Energy Commission vehicle-population dataset</span></div><div><b className="neutral">Source identified</b></div></article></div></Panel>; }

function EvReadiness() { return <><section className="ops-summary-strip"><div><strong>{metricMap.pwp_l2.value}</strong><span>PWP Level 2 chargers</span></div><div><strong>{metricMap.pwp_fast.value}</strong><span>PWP public fast chargers</span></div><div><strong>2</strong><span>L2 offline at cited update</span></div><div><strong>14</strong><span>fast chargers offline at cited update</span></div></section><div className="ops-grid two"><Panel title="PWP infrastructure status"><div className="ops-decision"><small>OFFICIAL OBSERVED SOURCE</small><strong>Pasadena Water and Power reported 116 Level 2 chargers and 45 public fast chargers across its listed sites.</strong><p>The cited status page is dated March 12, 2026 and reported 2 Level 2 chargers and 14 fast chargers offline. Infrastructure inventory does not establish commuter charging demand.</p></div></Panel><Panel title="ZEV population"><div className="ops-empty"><strong>City-specific ZEV population not yet extracted.</strong><p>The California Energy Commission publishes 2026 vehicle-population and ZEV datasets. Relay Rider should extract Pasadena geography directly from the latest published file before displaying a local adoption count.</p><a href="https://www.energy.ca.gov/files/zev-and-infrastructure-stats-data" target="_blank" rel="noreferrer">Open CEC ZEV datasets ↗</a></div></Panel></div></>; }

function Reports() { return <div className="ops-grid three"><ReportCard type="Public Baseline" title="Pasadena commute context" status="Source-backed"/><ReportCard type="Institution Baseline" title="PCC commute baseline" status="Data not connected"/><ReportCard type="Outcome Evidence" title="VMT / emissions comparison" status="Not available"/></div>; }
function ReportCard({type,title,status}:{type:string;title:string;status:string}) { return <article className="ops-report-card"><small>{type}</small><h3>{title}</h3><span>{status}</span></article>; }
function Settings() { return <div className="ops-grid two"><Panel title="Evidence policy"><div className="ops-settings-list"><p><span>Default geography</span><strong>Pasadena city, California</strong></p><p><span>Mock metrics</span><strong>Disabled</strong></p><p><span>PCC values without source</span><strong>Hidden</strong></p><p><span>Modeled reductions</span><strong>Hidden until inputs exist</strong></p></div></Panel><Panel title="Source policy"><div className="ops-settings-list"><p><span>ACS context</span><strong>Official estimate</strong></p><p><span>City traffic counts</span><strong>Official observed</strong></p><p><span>PWP charger status</span><strong>Official observed</strong></p><p><span>Relay Rider outcomes</span><strong>Unavailable until observed</strong></p></div></Panel></div>; }
function Panel({title,action,onAction,children}:{title:string;action?:string;onAction?:()=>void;children:React.ReactNode}) { return <section className="ops-panel"><header><h2>{title}</h2>{action&&<button className="text" onClick={onAction}>{action} →</button>}</header>{children}</section>; }
