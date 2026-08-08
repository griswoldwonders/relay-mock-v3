import { useMemo, useState } from "react";
import "./control-center.css";

type Props = {
  onOpenParticipant: () => void;
  onOpenMap: () => void;
  onOpenAdmin: () => void;
};

type ViewId =
  | "overview"
  | "corridors"
  | "baseline"
  | "parking"
  | "ev"
  | "participants"
  | "options"
  | "reviews"
  | "access"
  | "tasks"
  | "programs"
  | "incentives"
  | "engagement"
  | "sources"
  | "imports"
  | "quality"
  | "measurement"
  | "reports"
  | "exports"
  | "organization"
  | "sites"
  | "cohorts"
  | "team"
  | "rules"
  | "audit"
  | "settings";

type NavItem = { id: ViewId | "map"; label: string };

type NavGroup = { label: string; items: NavItem[] };

const NAV: NavGroup[] = [
  { label: "Control Center", items: [{ id: "overview", label: "Overview" }] },
  { label: "Intelligence", items: [{ id: "map", label: "Mobility Map" }, { id: "corridors", label: "Corridors" }, { id: "baseline", label: "Baseline" }, { id: "parking", label: "Parking" }, { id: "ev", label: "EV & Charging" }] },
  { label: "Operations", items: [{ id: "participants", label: "Participants" }, { id: "options", label: "Commute Options" }, { id: "reviews", label: "Review Queue" }, { id: "access", label: "Access Points" }, { id: "tasks", label: "Tasks" }] },
  { label: "Programs", items: [{ id: "programs", label: "Programs" }, { id: "incentives", label: "Incentives" }, { id: "engagement", label: "Engagement" }] },
  { label: "Data", items: [{ id: "sources", label: "Data Sources" }, { id: "imports", label: "Imports" }, { id: "quality", label: "Data Quality" }] },
  { label: "Measure", items: [{ id: "measurement", label: "Measurement" }, { id: "reports", label: "Reports" }, { id: "exports", label: "Exports" }] },
  { label: "Admin", items: [{ id: "organization", label: "Organization" }, { id: "sites", label: "Sites" }, { id: "cohorts", label: "Cohorts" }, { id: "team", label: "Team & Roles" }, { id: "rules", label: "Program Rules" }, { id: "audit", label: "Audit Log" }, { id: "settings", label: "Settings" }] },
];

const TASKS = [
  { value: "12", label: "Match Previews require review", tone: "violet", target: "reviews" as ViewId },
  { value: "4", label: "CSV rows failed validation", tone: "coral", target: "quality" as ViewId },
  { value: "2", label: "Access Points awaiting review", tone: "mint", target: "access" as ViewId },
  { value: "17", label: "commuters have no viable option", tone: "amber", target: "tasks" as ViewId },
];

const HEALTH = [
  { value: "71%", label: "Drive-Alone Share", note: "Survey + intake · modeled example", tone: "amber" },
  { value: "94%", label: "Peak Parking Pressure", note: "Modeled utilization", tone: "coral" },
  { value: "568", label: "Recurring Commute Signals", note: "Demonstration dataset", tone: "violet" },
  { value: "61%", label: "Mobility Option Coverage", note: "Modeled example", tone: "blue" },
  { value: "18%", label: "Transit Participation", note: "Demonstration data", tone: "blue" },
  { value: "28%", label: "EV / Hybrid Participation", note: "Reported / demo", tone: "green" },
];

const CORRIDORS = [
  { name: "Glendale → Pasadena", signals: 74, coverage: "61%", issue: "Planned-route capacity", action: "Recruit compatible recurring-route participants", tone: "violet" },
  { name: "Eagle Rock → Pasadena", signals: 52, coverage: "58%", issue: "Access Point coverage", action: "Review candidate Access Point", tone: "mint" },
  { name: "Highland Park → PCC", signals: 46, coverage: "74%", issue: "Schedule mismatch", action: "Test alternate arrival windows", tone: "blue" },
  { name: "Altadena → Pasadena", signals: 31, coverage: "38%", issue: "Insufficient route supply", action: "Prioritize corridor recruitment", tone: "amber" },
];

const PROGRAMS = [
  { name: "Transit Benefit", participants: "184", status: "Active · demo", outcome: "Outcome measurement not connected" },
  { name: "Planned Route Coordination", participants: "76", status: "Active · demo", outcome: "23 simulated previews" },
  { name: "Preferred Parking", participants: "41", status: "Under review", outcome: "Monitoring configuration" },
  { name: "Access Point Program", participants: "38", status: "Proposed", outcome: "3 candidate locations" },
];

const PARTICIPANT_STATS = [
  ["438", "Enrolled"], ["302", "Current commute signals"], ["126", "Access Point willing"], ["121", "EV / hybrid"], ["87", "Transit-interested"], ["17", "Currently unresolved"],
];

const DATA_SOURCES = [
  ["Participant Intake", "Healthy", "428 records", "Current"],
  ["Commute Survey", "Healthy", "Updated 2 days ago", "Medium confidence"],
  ["Roster CSV", "Attention", "438 records", "3 validation issues"],
  ["Parking Inventory", "Configured", "Manual dataset", "Current"],
  ["GTFS", "Configured", "Static transit context", "Scheduled/static"],
  ["GTFS-RT", "Not connected", "Future integration", "—"],
  ["Parking Occupancy", "Not connected", "Future source", "—"],
  ["EV Charging", "Available", "Planning dataset", "Modeled / public context"],
];

const SEARCH_ITEMS = [
  ...CORRIDORS.map((item) => ({ label: item.name, meta: `Corridor · ${item.issue}`, target: "corridors" as ViewId })),
  ...PROGRAMS.map((item) => ({ label: item.name, meta: `Program · ${item.status}`, target: "programs" as ViewId })),
  ...TASKS.map((item) => ({ label: item.label, meta: "Task / action", target: item.target })),
  { label: "Participants", meta: "Participant Operations", target: "participants" as ViewId },
  { label: "Rule 2202 Reporting Readiness", meta: "Report readiness support", target: "reports" as ViewId },
  { label: "Pasadena City College context", meta: "Site / demonstration context", target: "sites" as ViewId },
];

const MODULE_COPY: Record<ViewId, { kicker: string; title: string; body: string; cards: [string, string][] }> = {
  overview: { kicker: "CONTROL CENTER", title: "Institutional Mobility Control Center", body: "Daily operating view for commute demand, parking pressure, corridor opportunity, governed commuter options, program administration, data health, and measurable TDM outcomes.", cards: [] },
  corridors: { kicker: "INTELLIGENCE", title: "Corridor Intelligence", body: "Identify recurring generalized origin-destination demand, option coverage, parking contribution, Access Point opportunity, and the primary reason demand remains unresolved.", cards: [["Privacy threshold", "Suppress groups below 3 distinct signals"], ["Primary unit", "Directional approximate-zone corridor"], ["Next production layer", "Routing-derived overlap and detour impact"]] },
  baseline: { kicker: "INTELLIGENCE", title: "Mobility Baseline", body: "Establish current mode split, generalized origins, travel windows, parking experience, transit access, EV/hybrid signals, and participant preferences before selecting interventions.", cards: [["Drive-alone share", "71% modeled example"], ["Transit willingness", "64% demo"], ["Access Point willingness", "61% demo"]] },
  parking: { kicker: "INTELLIGENCE", title: "Parking Intelligence", body: "Treat parking as a measurable institutional constraint and connect pressure back to corridors, schedules, commute modes, and program interventions.", cards: [["Peak pressure", "94% modeled"], ["Configured supply", "2,480 spaces · demo"], ["Target intervention", "Corridor-specific TDM"]] },
  ev: { kicker: "INTELLIGENCE", title: "EV & Charging", body: "Analyze clean-vehicle participation, charging-demand signals, corridor supply, and employer charging planning without implying utility credits or certified emissions claims.", cards: [["EV / hybrid participation", "28% demo"], ["Charging signal", "9 AM–noon modeled"], ["Use case", "Infrastructure planning"]] },
  participants: { kicker: "OPERATIONS", title: "Participant Operations", body: "Manage privacy-appropriate participant records, eligibility, cohort membership, commute signals, consent state, option status, and governed program participation.", cards: [["Privacy model", "Approximate zones first"], ["Directory", "Masked identifiers"], ["Production path", "Authenticated tenant records"]] },
  options: { kicker: "OPERATIONS", title: "Commute Options", body: "Compare planned shared routes, transit, multimodal Access Point options, parking interventions, schedule flexibility, walking, biking, and other institution-sponsored choices.", cards: [["Planned routes", "Administrative review required"], ["Transit", "Scheduled/static context"], ["Explanation", "Why each option appeared"]] },
  reviews: { kicker: "OPERATIONS", title: "Administrative Review Queue", body: "Review explainable Match Previews and program eligibility before participant connection. This is not ride booking or live dispatch.", cards: [["Current queue", "12 demo items"], ["Decision types", "Review · revise · waitlist · not eligible · escalate"], ["Guardrail", "No guaranteed transportation"]] },
  access: { kicker: "OPERATIONS", title: "Access Point Manager", body: "Review designated public coordination locations for route compatibility, visibility, lighting, accessibility, and general suitability without guaranteeing safety.", cards: [["Candidate", "Needs institutional review"], ["Approved", "Program-designated"], ["Restricted", "Not available for coordination"]] },
  tasks: { kicker: "OPERATIONS", title: "Task Queue", body: "Convert unresolved mobility conditions into accountable work: data validation, review requests, corridor gaps, program setup, and reporting actions.", cards: [["Open", "17 unresolved commute-option gaps · demo"], ["Generated from", "Imports · matches · thresholds"], ["Workflow", "Open → in progress → resolved / dismissed"]] },
  programs: { kicker: "PROGRAMS", title: "TDM Program Manager", body: "Configure, operate, and measure institution-sponsored mobility interventions across sites and cohorts.", cards: [["Program types", "Transit · routes · parking · Access Points · flexibility"], ["Scope", "Organization · site · cohort"], ["Lifecycle", "Configure → activate → measure → archive"]] },
  incentives: { kicker: "PROGRAMS", title: "Incentives", body: "Configure capped employer-sponsored participation benefits such as Green Route Credits, transit benefits, recognition, and preferential parking.", cards: [["Green Route Credits", "Promotional / employer-sponsored benefit"], ["Not", "Cash wages or guaranteed earnings"], ["Control", "Budget and eligibility rules"]] },
  engagement: { kicker: "PROGRAMS", title: "Engagement", body: "Support enrollment, campaigns, challenges, recognition, and program communications tied to measurable TDM programs.", cards: [["Enrollment", "Cohort-based"], ["Campaigns", "Prototype"], ["Recognition", "Program-configured"]] },
  sources: { kicker: "DATA", title: "Data Sources", body: "Track each institutional, participant, transportation, regional, and operational source with freshness, coverage, provenance, and confidence.", cards: [["Institutional", "Rosters · parking · schedules"], ["Transportation", "GTFS · GTFS-RT future"], ["Regional", "ACS · CTPP · LODES · SCAG"]] },
  imports: { kicker: "DATA", title: "Imports & Provenance", body: "Ingest privacy-minimized roster and commute-signal CSVs, retain row-level validation outcomes, and maintain source provenance without storing raw files in the current workflow.", cards: [["Roster CSV", "Hash-linked participant references"], ["Commute CSV", "Approximate-zone acknowledgment required"], ["Errors", "Create validation tasks"]] },
  quality: { kicker: "DATA", title: "Data Quality", body: "Surface incomplete, stale, invalid, or low-confidence inputs before they contaminate corridor intelligence or reports.", cards: [["Validation issues", "4 demo"], ["Coverage", "84% demo"], ["Confidence", "Metric-level metadata target"]] },
  measurement: { kicker: "MEASURE", title: "Measurement", body: "Track participation, option coverage, mode shift, parking pressure, clean-vehicle signals, estimated VMT, and other outcomes with explicit methodology and reporting periods.", cards: [["Rule", "Label modeled vs measured"], ["Period", "Configurable"], ["Provenance", "Source + coverage + confidence"]] },
  reports: { kicker: "MEASURE", title: "Reports", body: "Generate executive, TDM program, parking pressure, corridor opportunity, transit participation, EV/charging, and reporting-readiness outputs.", cards: [["Executive Mobility", "Leadership"], ["TDM Performance", "Program management"], ["Rule 2202", "Readiness support only"]] },
  exports: { kicker: "MEASURE", title: "Exports", body: "Provide governed exports with organization, site, cohort, period, source, and privacy context rather than unrestricted raw-data downloads.", cards: [["CSV", "Prototype / governed"], ["Reports", "Planned persistent exports"], ["Audit", "Export events should be logged"]] },
  organization: { kicker: "ADMIN", title: "Organization", body: "Manage the tenant identity, institutional type, operating context, reporting defaults, and governance settings.", cards: [["Tenant", "Organization-scoped"], ["Owner", "Authenticated role"], ["Security", "Supabase RLS"]] },
  sites: { kicker: "ADMIN", title: "Sites", body: "Configure campuses, offices, hospitals, venues, municipal sites, parking supply, transit context, and generalized site geography.", cards: [["Destinations", "Public institutional locations"], ["Parking", "Capacity + context"], ["Privacy", "No participant home locations"]] },
  cohorts: { kicker: "ADMIN", title: "Cohorts", body: "Create institution-defined participant groups for program eligibility, reporting, site access, schedules, and controlled mobility operations.", cards: [["Examples", "Employees · students · shifts"], ["Assignment", "Program + site"], ["Import", "Roster workflow"]] },
  team: { kicker: "ADMIN", title: "Team & Roles", body: "Manage organization members, site assignments, reviewer access, analysts, program administrators, and other institutional roles.", cards: [["Management", "Owner · admin · TDM manager"], ["Review", "Reviewer-scoped"], ["Analysis", "Analyst / sustainability / site roles"]] },
  rules: { kicker: "ADMIN", title: "Program Rules", body: "Define eligibility, cohort, schedule, Access Point, privacy, accessibility, EV/hybrid, and other institution-governed constraints.", cards: [["Review before connection", "Required"], ["Approximate location", "Required"], ["Planned routes", "Existing intended trips"]] },
  audit: { kicker: "ADMIN", title: "Audit Log", body: "Record governed changes to membership, roles, programs, rules, reviews, data imports, and other institution-sensitive operations.", cards: [["Purpose", "Traceability"], ["Scope", "Organization tenant"], ["Next", "Export + access events"]] },
  settings: { kicker: "ADMIN", title: "Settings", body: "Configure organization defaults, privacy, retention, reporting periods, notifications, integrations, and future enterprise identity controls.", cards: [["Privacy", "Retention + deletion"], ["Identity", "SSO / SAML future"], ["Integrations", "Institution and transportation sources"]] },
};

export default function ControlCenter({ onOpenParticipant, onOpenMap, onOpenAdmin }: Props) {
  const [view, setView] = useState<ViewId>("overview");
  const [organization, setOrganization] = useState("Relay Rider Demonstration Organization");
  const [site, setSite] = useState("All demonstration sites");
  const [cohort, setCohort] = useState("All cohorts");
  const [period, setPeriod] = useState("Current demonstration period");
  const [search, setSearch] = useState("");
  const [createOpen, setCreateOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [selectedCorridor, setSelectedCorridor] = useState(0);

  const searchResults = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return [];
    return SEARCH_ITEMS.filter((item) => `${item.label} ${item.meta}`.toLowerCase().includes(term)).slice(0, 6);
  }, [search]);

  function choose(id: ViewId | "map") {
    setSearch("");
    if (id === "map") onOpenMap();
    else setView(id);
  }

  const current = MODULE_COPY[view];

  return <div className="cc-shell">
    <header className="cc-topbar">
      <div className="cc-brand"><div className="cc-logo">RR</div><div><strong>Relay Rider</strong><span>Institutional Mobility Control Center</span></div></div>
      <div className="cc-search-wrap"><input value={search} onChange={(event) => setSearch(event.currentTarget.value)} placeholder="Search Relay Rider…" aria-label="Search Relay Rider" />{searchResults.length > 0 && <div className="cc-search-results">{searchResults.map((item) => <button key={`${item.label}-${item.meta}`} onClick={() => choose(item.target)}><strong>{item.label}</strong><span>{item.meta}</span></button>)}</div>}</div>
      <div className="cc-top-actions">
        <span className="cc-demo-chip">DEMONSTRATION ENVIRONMENT</span>
        <button className="cc-icon-button" aria-label="Notifications" onClick={() => setNotificationsOpen((value) => !value)}>3</button>
        <button className="cc-create-button" onClick={() => setCreateOpen((value) => !value)}>+ Create</button>
        <button className="cc-secondary-button" onClick={onOpenParticipant}>Participant Experience</button>
        <button className="cc-admin-button" onClick={onOpenAdmin}>Admin Workspace</button>
      </div>
      {notificationsOpen && <div className="cc-popover cc-notifications"><strong>Operational notifications · demo</strong><button onClick={() => choose("reviews")}>12 Match Previews require review</button><button onClick={() => choose("quality")}>4 import rows need validation</button><button onClick={() => choose("access")}>2 Access Point candidates await review</button></div>}
      {createOpen && <div className="cc-popover cc-create-menu"><strong>Authenticated creation</strong><span>Creation changes tenant data and opens the protected admin workspace.</span>{["Create Program", "Add Site", "Create Cohort", "Add Access Point", "Invite Team Member", "Import Dataset", "Create Task", "Launch Survey"].map((label) => <button key={label} onClick={onOpenAdmin}>{label}</button>)}</div>}
    </header>

    <aside className="cc-sidebar">
      {NAV.map((group) => <section key={group.label}><small>{group.label}</small>{group.items.map((item) => <button key={item.id} className={item.id === view ? "active" : ""} onClick={() => choose(item.id)}>{item.label}</button>)}</section>)}
      <div className="cc-sidebar-foot"><strong>Operating model</strong><span>Measure → Diagnose → Plan → Coordinate → Administer → Engage → Measure Outcomes → Report</span></div>
    </aside>

    <main className="cc-main">
      <section className="cc-context-bar">
        <label><span>Organization</span><select value={organization} onChange={(event) => setOrganization(event.currentTarget.value)}><option>Relay Rider Demonstration Organization</option><option>Employer Program · Demo</option><option>Campus Program · Demo</option></select></label>
        <label><span>Site</span><select value={site} onChange={(event) => setSite(event.currentTarget.value)}><option>All demonstration sites</option><option>Pasadena context</option><option>Glendale context</option><option>Medical center context</option></select></label>
        <label><span>Cohort</span><select value={cohort} onChange={(event) => setCohort(event.currentTarget.value)}><option>All cohorts</option><option>Student demonstration cohort</option><option>Employee demonstration cohort</option><option>Shift-based cohort</option></select></label>
        <label><span>Reporting Period</span><select value={period} onChange={(event) => setPeriod(event.currentTarget.value)}><option>Current demonstration period</option><option>Previous period · demo</option><option>Year to date · demo</option></select></label>
      </section>

      <section className="cc-heading"><div><span>{current.kicker}</span><h1>{current.title}</h1><p>{current.body}</p></div><div className="cc-heading-actions"><button onClick={onOpenMap}>Open Mobility Map</button>{view !== "overview" && <button onClick={() => setView("overview")}>Back to Control Center</button>}</div></section>
      <div className="cc-disclaimer"><strong>Institutional SaaS demonstration.</strong><span>Named institutions and public facilities provide context only. Modeled, simulated, and demonstration values are labeled and do not imply customer status, live transportation, guaranteed outcomes, regulatory filing, or active third-party integrations.</span></div>

      {view === "overview" ? <Overview onChoose={choose} onOpenMap={onOpenMap} selectedCorridor={selectedCorridor} setSelectedCorridor={setSelectedCorridor} /> : <ModuleView view={view} onOpenAdmin={onOpenAdmin} onOpenParticipant={onOpenParticipant} onOpenMap={onOpenMap} />}
    </main>
  </div>;
}

function Overview({ onChoose, onOpenMap, selectedCorridor, setSelectedCorridor }: { onChoose: (id: ViewId | "map") => void; onOpenMap: () => void; selectedCorridor: number; setSelectedCorridor: (index: number) => void }) {
  const corridor = CORRIDORS[selectedCorridor];
  return <div className="cc-overview">
    <section className="cc-section"><div className="cc-section-head"><div><small>TODAY / ACTION CENTER</small><h2>What needs attention</h2></div><button onClick={() => onChoose("tasks")}>View Task Queue</button></div><div className="cc-action-grid">{TASKS.map((task) => <button key={task.label} className={`cc-action-card tone-${task.tone}`} onClick={() => onChoose(task.target)}><strong>{task.value}</strong><span>{task.label}</span></button>)}</div></section>

    <section className="cc-section"><div className="cc-section-head"><div><small>MOBILITY HEALTH</small><h2>Institutional commute conditions</h2></div><span>Source · period · coverage · confidence become metric metadata in production</span></div><div className="cc-health-grid">{HEALTH.map((metric) => <article key={metric.label} className={`tone-${metric.tone}`}><span>{metric.label}</span><strong>{metric.value}</strong><small>{metric.note}</small></article>)}</div></section>

    <section className="cc-section cc-corridor-section"><div className="cc-section-head"><div><small>CORRIDOR INTELLIGENCE</small><h2>Where institutional mobility intervention matters most</h2></div><button onClick={() => onChoose("corridors")}>Open Corridor Intelligence</button></div><div className="cc-map-intelligence"><button className="cc-map-panel" onClick={onOpenMap}><div className="cc-map-grid" /><div className="cc-map-orbit one" /><div className="cc-map-orbit two" /><div className="cc-map-route route-a" /><div className="cc-map-route route-b" /><span className="cc-map-label">Interactive mobility map</span><small>Demand zones · transit · Access Points · parking · EV context</small></button><div className="cc-corridor-list">{CORRIDORS.map((item, index) => <button key={item.name} className={index === selectedCorridor ? "active" : ""} onClick={() => setSelectedCorridor(index)}><strong>{item.name}</strong><span>{item.signals} signals · {item.coverage} coverage</span><small>{item.issue}</small></button>)}</div><article className={`cc-opportunity-card tone-${corridor.tone}`}><small>SELECTED OPPORTUNITY</small><h3>{corridor.name}</h3><div><span>Signals</span><strong>{corridor.signals}</strong></div><div><span>Option coverage</span><strong>{corridor.coverage}</strong></div><p><b>Primary gap:</b> {corridor.issue}</p><p><b>Recommended action:</b> {corridor.action}</p><button onClick={() => onChoose("tasks")}>Create / review action</button></article></div></section>

    <section className="cc-split-row"><section className="cc-section"><div className="cc-section-head"><div><small>PROGRAM OPERATIONS</small><h2>Active mobility interventions</h2></div><button onClick={() => onChoose("programs")}>Manage Programs</button></div><div className="cc-program-list">{PROGRAMS.map((program) => <article key={program.name}><div><strong>{program.name}</strong><span>{program.status}</span></div><div><b>{program.participants}</b><span>participants · demo</span></div><small>{program.outcome}</small></article>)}</div></section><section className="cc-section"><div className="cc-section-head"><div><small>PARTICIPANT OPERATIONS</small><h2>Privacy-minimized participation</h2></div><button onClick={() => onChoose("participants")}>View Participants</button></div><div className="cc-participant-grid">{PARTICIPANT_STATS.map(([value, label]) => <article key={label}><strong>{value}</strong><span>{label}</span></article>)}</div><div className="cc-privacy-note"><strong>Approximate zones first</strong><span>Participant home addresses are not displayed in the institutional control center.</span></div></section></section>

    <section className="cc-split-row"><section className="cc-section"><div className="cc-section-head"><div><small>DATA HEALTH</small><h2>Can the institution trust the dashboard?</h2></div><button onClick={() => onChoose("sources")}>Open Data Center</button></div><div className="cc-data-list">{DATA_SOURCES.slice(0, 6).map(([name, state, detail, confidence]) => <article key={name}><div><strong>{name}</strong><span>{detail}</span></div><b>{state}</b><small>{confidence}</small></article>)}</div></section><section className="cc-section"><div className="cc-section-head"><div><small>REPORTING</small><h2>Upcoming institutional outputs</h2></div><button onClick={() => onChoose("reports")}>Open Reports</button></div><article className="cc-report-card tone-blue"><span>August Mobility Report · demonstration</span><strong>84%</strong><small>Modeled data completeness</small><div className="cc-progress"><i style={{ width: "84%" }} /></div><p>4 data-quality tasks remain before the demonstration reporting period is considered ready.</p><button onClick={() => onChoose("reports")}>Review reporting readiness</button></article><div className="cc-report-links"><button onClick={() => onChoose("reports")}>Executive Mobility</button><button onClick={() => onChoose("reports")}>Parking Pressure</button><button onClick={() => onChoose("reports")}>Corridor Opportunity</button><button onClick={() => onChoose("reports")}>Rule 2202 Readiness</button></div></section></section>

    <section className="cc-section"><div className="cc-section-head"><div><small>RECENT ACTIVITY</small><h2>Operational trace</h2></div><button onClick={() => onChoose("audit")}>Open Audit Log</button></div><div className="cc-activity"><article><b>08:42</b><span>Commute CSV validation completed</span><small>4 rows require review · demonstration</small></article><article><b>08:31</b><span>Match Preview batch generated</span><small>12 simulated previews require administrative review</small></article><article><b>Yesterday</b><span>Access Point candidate updated</span><small>Visibility and accessibility review pending</small></article></div></section>
  </div>;
}

function ModuleView({ view, onOpenAdmin, onOpenParticipant, onOpenMap }: { view: ViewId; onOpenAdmin: () => void; onOpenParticipant: () => void; onOpenMap: () => void }) {
  const module = MODULE_COPY[view];
  const isData = view === "sources" || view === "imports" || view === "quality";
  const isAdmin = ["organization", "sites", "cohorts", "team", "rules", "audit", "settings"].includes(view);
  const isParticipant = view === "participants" || view === "options";
  return <div className="cc-module-page"><section className="cc-module-hero"><small>{module.kicker}</small><h2>{module.title}</h2><p>{module.body}</p><div className="cc-module-actions">{isAdmin || isData ? <button onClick={onOpenAdmin}>Open authenticated workspace</button> : null}{isParticipant ? <button onClick={onOpenParticipant}>Open participant experience</button> : null}{["corridors", "parking", "ev", "access"].includes(view) ? <button onClick={onOpenMap}>Open mobility map</button> : null}</div></section><div className="cc-module-cards">{module.cards.map(([label, value]) => <article key={label}><span>{label}</span><strong>{value}</strong></article>)}</div>{view === "sources" && <section className="cc-section"><div className="cc-data-list">{DATA_SOURCES.map(([name, state, detail, confidence]) => <article key={name}><div><strong>{name}</strong><span>{detail}</span></div><b>{state}</b><small>{confidence}</small></article>)}</div></section>}{view === "programs" && <section className="cc-section"><div className="cc-program-list">{PROGRAMS.map((program) => <article key={program.name}><div><strong>{program.name}</strong><span>{program.status}</span></div><div><b>{program.participants}</b><span>participants · demo</span></div><small>{program.outcome}</small></article>)}</div></section>}{view === "corridors" && <section className="cc-section"><div className="cc-corridor-module-grid">{CORRIDORS.map((item) => <article key={item.name} className={`tone-${item.tone}`}><strong>{item.name}</strong><span>{item.signals} recurring signals · {item.coverage} option coverage</span><small>Primary gap: {item.issue}</small><p>Recommended action: {item.action}</p></article>)}</div></section>}</div>;
}
