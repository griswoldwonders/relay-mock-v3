import { useMemo, useState } from "react";
import "./operational-saas-workspace.css";

type WorkspaceView =
  | "command"
  | "intake"
  | "corridors"
  | "matches"
  | "programs"
  | "tasks"
  | "reports"
  | "ev"
  | "settings";

const NAV: Array<{ id: WorkspaceView; label: string; group: string }> = [
  { id: "command", label: "Command Center", group: "Operate" },
  { id: "tasks", label: "Tasks & Reviews", group: "Operate" },
  { id: "intake", label: "Commute Data", group: "Understand" },
  { id: "corridors", label: "Corridors", group: "Understand" },
  { id: "matches", label: "Match Previews", group: "Coordinate" },
  { id: "programs", label: "Mobility Programs", group: "Coordinate" },
  { id: "ev", label: "EV Readiness", group: "Coordinate" },
  { id: "reports", label: "Reports", group: "Measure" },
  { id: "settings", label: "Program Settings", group: "Admin" },
];

const metrics = [
  ["312", "commute records", "+28 this month"],
  ["7", "priority corridors", "3 need review"],
  ["41", "match previews", "12 high-fit"],
  ["63%", "drive-alone share", "modeled baseline"],
  ["74", "parking pressure", "high · modeled"],
  ["22%", "EV / hybrid signal", "participant reported"],
];

const tasks = [
  ["Review North Pasadena corridor", "12 commuters · 4 low-detour options", "High", "Today"],
  ["Resolve 7 commute-data validation issues", "Imported employer CSV", "High", "Today"],
  ["Approve Access Point candidate", "Lake Ave / Del Mar corridor", "Medium", "Aug 13"],
  ["Prepare monthly mobility brief", "July observation period", "Medium", "Aug 15"],
];

const corridors = [
  ["Eagle Rock → Pasadena", "46", "8:00–9:00 AM", "High", "11"],
  ["Glendale → Pasadena", "38", "7:30–9:00 AM", "High", "9"],
  ["North Pasadena → PCC", "31", "7:45–8:45 AM", "Medium", "7"],
  ["Highland Park → Pasadena", "27", "8:00–9:30 AM", "Medium", "5"],
];

const matches = [
  ["RR-2048", "Eagle Rock → PCC", "92", "+4 min", "7:45–8:15 AM", "Admin review"],
  ["RR-2051", "Glendale → Pasadena", "88", "+6 min", "8:00–8:30 AM", "Preview ready"],
  ["RR-2056", "Highland Park → PCC", "81", "+8 min", "8:15–8:45 AM", "Needs Access Point"],
];

export default function OperationalSaasWorkspace() {
  const [view, setView] = useState<WorkspaceView>("command");
  const [site, setSite] = useState("Pasadena City College");
  const title = NAV.find((item) => item.id === view)?.label ?? "Command Center";
  const groups = useMemo(() => Array.from(new Set(NAV.map((item) => item.group))), []);

  return (
    <div className="ops-app">
      <aside className="ops-sidebar">
        <div className="ops-brand"><div className="ops-mark">R</div><div><strong>Relay Rider</strong><span>Mobility Operations</span></div></div>
        <div className="ops-tenant"><small>WORKSPACE</small><button>{site}<span>⌄</span></button></div>
        <nav>
          {groups.map((group) => <div className="ops-nav-group" key={group}><small>{group}</small>{NAV.filter((item) => item.group === group).map((item) => <button key={item.id} className={view === item.id ? "active" : ""} onClick={() => setView(item.id)}><span className="ops-nav-dot" />{item.label}</button>)}</div>)}
        </nav>
        <div className="ops-sidebar-foot"><span className="ops-demo-dot" />Demonstration workspace<small>Synthetic and modeled data are labeled.</small></div>
      </aside>

      <section className="ops-main">
        <header className="ops-topbar"><div><small>INSTITUTIONAL TDM WORKSPACE</small><h1>{title}</h1></div><div className="ops-top-actions"><select value={site} onChange={(e) => setSite(e.currentTarget.value)}><option>Pasadena City College</option><option>Pasadena Employer Demo</option><option>Glendale Corridor Demo</option></select><button className="ghost">Export</button><button className="primary">New action</button></div></header>

        <main className="ops-content">
          {view === "command" && <CommandCenter onNavigate={setView} />}
          {view === "tasks" && <Tasks />}
          {view === "intake" && <CommuteData />}
          {view === "corridors" && <Corridors />}
          {view === "matches" && <Matches />}
          {view === "programs" && <Programs />}
          {view === "ev" && <EvReadiness />}
          {view === "reports" && <Reports />}
          {view === "settings" && <Settings />}
        </main>
      </section>
    </div>
  );
}

function CommandCenter({ onNavigate }: { onNavigate: (view: WorkspaceView) => void }) {
  return <>
    <section className="ops-hero"><div><span className="ops-eyebrow">TODAY · PROGRAM OPERATIONS</span><h2>Turn commute demand into concrete TDM actions.</h2><p>Review data quality, identify corridor demand, resolve administrative tasks, and prepare measurable partner actions from one operating workspace.</p><div className="ops-hero-actions"><button className="primary" onClick={() => onNavigate("tasks")}>Review 4 priority tasks</button><button className="ghost" onClick={() => onNavigate("intake")}>Import commute records</button></div></div><div className="ops-health"><small>PROGRAM HEALTH</small><strong>78</strong><span>Operational readiness</span><div><i style={{width:"78%"}} /></div><p>Data coverage is sufficient for corridor screening. Seven validation issues remain before the next evidence period can be locked.</p></div></section>
    <section className="ops-metrics">{metrics.map(([value,label,note]) => <article key={label}><small>{label}</small><strong>{value}</strong><span>{note}</span></article>)}</section>
    <div className="ops-grid two">
      <Panel title="Priority work queue" action="View all" onAction={() => onNavigate("tasks")}><div className="ops-task-list">{tasks.map(([name,detail,priority,due]) => <article key={name}><div><strong>{name}</strong><span>{detail}</span></div><div><b className={priority === "High" ? "danger" : "warn"}>{priority}</b><small>{due}</small></div></article>)}</div></Panel>
      <Panel title="Decision pipeline" action="Open reports" onAction={() => onNavigate("reports")}><div className="ops-pipeline"><div><strong>3</strong><span>Findings ready</span></div><div><strong>5</strong><span>Actions proposed</span></div><div><strong>2</strong><span>Awaiting owner</span></div><div><strong>1</strong><span>Brief ready</span></div></div><div className="ops-decision"><small>NEXT DECISION</small><strong>Should PCC prioritize the Eagle Rock corridor for a controlled commute pilot?</strong><p>Evidence: 46 recurring records, concentrated arrival window, elevated parking-pressure signal, and 11 compatible Match Previews.</p></div></Panel>
    </div>
    <Panel title="Priority corridors" action="Open corridor intelligence" onAction={() => onNavigate("corridors")}><CorridorTable /></Panel>
  </>;
}

function CommuteData() { return <div className="ops-grid two"><Panel title="Data intake"><div className="ops-upload"><span>CSV</span><h3>Bring existing commute records into Relay Rider</h3><p>Map employer or campus fields into the Record layer before adding any new survey burden.</p><button className="primary">Choose CSV</button><small>Prototype action · no file is uploaded from this demonstration screen.</small></div></Panel><Panel title="Data quality"><div className="ops-kpis"><div><strong>312</strong><span>records</span></div><div><strong>289</strong><span>valid</span></div><div><strong>16</strong><span>warnings</span></div><div><strong>7</strong><span>blocking</span></div></div><div className="ops-quality-list"><p><b>4</b> unknown commute-mode values</p><p><b>2</b> duplicate participant/date rows</p><p><b>1</b> missing one-way distance</p></div></Panel><Panel title="Source registry"><div className="ops-records"><article><strong>PCC commute records · Spring 2026</strong><span>Institution supplied · 312 records · imported Aug 11</span></article><article><strong>ACS S0801 context</strong><span>Official estimate · Pasadena geography · contextual only</span></article><article><strong>Relay participant intake</strong><span>Participant reported · demonstration cohort</span></article></div></Panel><Panel title="Evidence period"><div className="ops-period"><span>BASELINE</span><strong>Spring 2026 commute baseline</strong><p>Mar 2 – May 29, 2026</p><div><b>Methodology</b><span>RR_VMT_METHOD_v0.1</span></div><button className="ghost">Review before lock</button></div></Panel></div>; }
function Corridors() { return <><div className="ops-filter-row"><button className="active">All corridors</button><button>High parking pressure</button><button>EV opportunity</button><button>Needs review</button></div><Panel title="Corridor intelligence"><CorridorTable /></Panel></>; }
function CorridorTable() { return <div className="ops-table"><div className="head"><span>Corridor</span><span>Records</span><span>Peak window</span><span>Pressure</span><span>Previews</span></div>{corridors.map((row) => <div className="row" key={row[0]}>{row.map((cell,i) => <span key={i} className={i===0?"strong":""}>{cell}</span>)}</div>)}</div>; }
function Matches() { return <><section className="ops-summary-strip"><div><strong>41</strong><span>active previews</span></div><div><strong>12</strong><span>high-fit</span></div><div><strong>6.2 min</strong><span>median detour</span></div><div><strong>8</strong><span>need review</span></div></section><Panel title="Explainable Match Previews"><div className="ops-table match"><div className="head"><span>ID</span><span>Route</span><span>Fit</span><span>Detour</span><span>Window</span><span>Status</span></div>{matches.map((row)=><div className="row" key={row[0]}>{row.map((cell,i)=><span key={i} className={i===2?"score":i===0?"strong":""}>{cell}{i===2?"%":""}</span>)}</div>)}</div><p className="ops-note">Match Previews are compatibility analyses, not guaranteed transportation. Administrative review remains required.</p></Panel></>; }
function Tasks() { return <Panel title="Administrative task queue"><div className="ops-task-list large">{tasks.concat([["Confirm monthly metric provenance","Source labels and methodology notes","Low","Aug 18"]]).map(([name,detail,priority,due])=><article key={name}><div><strong>{name}</strong><span>{detail}</span></div><div><b className={priority==="High"?"danger":priority==="Medium"?"warn":"neutral"}>{priority}</b><small>{due}</small><button className="ghost">Open</button></div></article>)}</div></Panel>; }
function Programs() { return <div className="ops-grid three"><ProgramCard name="Parking Pressure Reduction" status="Active" metric="74 → 66" note="Scenario-based target"/><ProgramCard name="Transit & Access Point Pilot" status="Draft" metric="2 corridors" note="Administrative review required"/><ProgramCard name="Planned-Route Coordination" status="Research beta" metric="41 previews" note="No guaranteed rides"/></div>; }
function ProgramCard({name,status,metric,note}:{name:string;status:string;metric:string;note:string}) { return <article className="ops-program-card"><span>{status}</span><h3>{name}</h3><strong>{metric}</strong><p>{note}</p><button className="ghost">Open program</button></article>; }
function EvReadiness() { return <><section className="ops-summary-strip"><div><strong>69</strong><span>EV / hybrid records</span></div><div><strong>34</strong><span>charging-interest signals</span></div><div><strong>3</strong><span>priority corridors</span></div><div><strong>2</strong><span>site questions</span></div></section><div className="ops-grid two"><Panel title="EV adoption readiness"><div className="ops-decision"><small>SCREENING FINDING</small><strong>EV interest is concentrated in two recurring commute corridors.</strong><p>This is a participant-interest signal. It does not establish charger demand, infrastructure need, or project eligibility.</p></div></Panel><Panel title="Recommended next action"><div className="ops-decision"><small>PROGRAM ACTION</small><strong>Validate workplace charging constraints before recommending infrastructure.</strong><p>Pair participant signals with parking duration, existing charging utilization, electrical readiness, and site-host priorities.</p></div></Panel></div></>; }
function Reports() { return <div className="ops-grid three"><ReportCard type="Decision Card" title="Eagle Rock corridor review" status="Ready for review"/><ReportCard type="Corridor Decision Brief" title="July mobility operations" status="Draft"/><ReportCard type="Evidence Export" title="Spring 2026 baseline" status="Validation pending"/></div>; }
function ReportCard({type,title,status}:{type:string;title:string;status:string}) { return <article className="ops-report-card"><small>{type}</small><h3>{title}</h3><span>{status}</span><button className="primary">Open</button></article>; }
function Settings() { return <div className="ops-grid two"><Panel title="Workspace configuration"><div className="ops-settings-list"><p><span>Institution</span><strong>Pasadena City College</strong></p><p><span>Default geography</span><strong>Pasadena, CA</strong></p><p><span>Minimum corridor group</span><strong>5 records</strong></p><p><span>Access Point review</span><strong>Required</strong></p></div></Panel><Panel title="Product-state guardrails"><div className="ops-settings-list"><p><span>Environment</span><strong>Research beta</strong></p><p><span>Transportation status</span><strong>No guaranteed service</strong></p><p><span>Match output</span><strong>Preview only</strong></p><p><span>Contribution status</span><strong>Participation signal</strong></p></div></Panel></div>; }
function Panel({title,action,onAction,children}:{title:string;action?:string;onAction?:()=>void;children:React.ReactNode}) { return <section className="ops-panel"><header><h2>{title}</h2>{action&&<button className="text" onClick={onAction}>{action} →</button>}</header>{children}</section>; }
