import { useMemo, useState } from "react";
import "./saas-institutional.css";

type Props = {
  onOpenMap: () => void;
  onOpenParticipant: () => void;
};

type SectionId = "dashboard" | "intelligence" | "mobility" | "programs" | "operations" | "measure" | "settings";
type ViewId =
  | "dashboard"
  | "baseline"
  | "sites"
  | "corridors"
  | "parking"
  | "ev"
  | "options"
  | "transit"
  | "exchange"
  | "access"
  | "programs"
  | "incentives"
  | "engagement"
  | "participants"
  | "review"
  | "rules"
  | "measurement"
  | "reports"
  | "exports"
  | "settings";

type ReviewState = "Administrative review required" | "Accepted for Review" | "Needs Revision" | "Waitlist" | "Not Eligible" | "Escalated";

type ViewConfig = { id: ViewId; label: string; section: SectionId };

const SECTIONS: { id: SectionId; label: string }[] = [
  { id: "dashboard", label: "Dashboard" },
  { id: "intelligence", label: "Intelligence" },
  { id: "mobility", label: "Mobility" },
  { id: "programs", label: "Programs" },
  { id: "operations", label: "Operations" },
  { id: "measure", label: "Measure" },
  { id: "settings", label: "Settings" },
];

const VIEWS: ViewConfig[] = [
  { id: "dashboard", label: "Executive Dashboard", section: "dashboard" },
  { id: "baseline", label: "Baseline", section: "intelligence" },
  { id: "sites", label: "Sites", section: "intelligence" },
  { id: "corridors", label: "Corridors", section: "intelligence" },
  { id: "parking", label: "Parking", section: "intelligence" },
  { id: "ev", label: "EV & Charging", section: "intelligence" },
  { id: "options", label: "Commute Options", section: "mobility" },
  { id: "transit", label: "Transit & Mobility", section: "mobility" },
  { id: "exchange", label: "Corridor Exchange", section: "mobility" },
  { id: "access", label: "Access Points", section: "mobility" },
  { id: "programs", label: "TDM Programs", section: "programs" },
  { id: "incentives", label: "Incentives", section: "programs" },
  { id: "engagement", label: "Engagement", section: "programs" },
  { id: "participants", label: "Participants", section: "operations" },
  { id: "review", label: "Review Queue", section: "operations" },
  { id: "rules", label: "Program Rules", section: "operations" },
  { id: "measurement", label: "Measurement", section: "measure" },
  { id: "reports", label: "Reports", section: "measure" },
  { id: "exports", label: "Exports", section: "measure" },
  { id: "settings", label: "Organization Settings", section: "settings" },
];

const KPIS = [
  ["Drive-Alone / SOV Share", "71%", "Survey-reported · modeled example", "amber"],
  ["Peak Parking Pressure", "94%", "Modeled utilization", "coral"],
  ["Recurring Corridor Signals", "568", "Demonstration data", "violet"],
  ["Commute-Option Coverage", "61%", "Modeled example", "blue"],
  ["Transit Participation", "18%", "Demonstration data", "blue"],
  ["EV / Hybrid Participation", "28%", "Demonstration data", "green"],
  ["Active Participants", "412", "Demonstration data", "mint"],
  ["Data Confidence", "Medium", "Prototype confidence band", "neutral"],
];

const CORRIDORS = [
  { id: "glendale", name: "Glendale → Pasadena", signals: 126, sov: "73%", coverage: "61%", seats: "43", transit: "Strong", access: "72%", parking: "High", ev: "39%", detour: "6 min", gap: "Insufficient planned-route supply" },
  { id: "eagle-rock", name: "Eagle Rock → Pasadena", signals: 94, sov: "69%", coverage: "58%", seats: "22", transit: "Moderate", access: "65%", parking: "High", ev: "31%", detour: "5 min", gap: "Access Point coverage" },
  { id: "highland-park", name: "Highland Park → PCC", signals: 81, sov: "62%", coverage: "74%", seats: "14", transit: "Strong", access: "78%", parking: "Moderate", ev: "21%", detour: "7 min", gap: "Schedule mismatch" },
  { id: "east-hollywood", name: "East Hollywood → Glendale", signals: 67, sov: "76%", coverage: "49%", seats: "11", transit: "Moderate", access: "43%", parking: "High", ev: "26%", detour: "8 min", gap: "First / last mile gap" },
  { id: "altadena", name: "Altadena → Pasadena", signals: 54, sov: "79%", coverage: "38%", seats: "9", transit: "Limited", access: "41%", parking: "Severe", ev: "35%", detour: "9 min", gap: "Insufficient route supply" },
];

const SITES = [
  ["Pasadena City College", "Constrained", "Strong", "78", "Medium"],
  ["Caltech", "Moderate", "Strong", "82", "Medium"],
  ["Glendale Community College", "High", "Moderate", "64", "Low"],
  ["Hospital / Medical Center", "Severe", "Moderate", "59", "Low"],
  ["Employer Campus", "High", "Moderate", "66", "Low"],
];

const OPTIONS = [
  { type: "Planned Shared Route", time: "31 min", fit: "87% compatibility", walk: "5 min", transfer: "0", access: "Glendale Transportation Center", benefit: "+3 Green Route Credits", tone: "violet", reason: "A recurring planned route overlaps the commute window, passes a reviewed Access Point candidate, and has low modeled detour." },
  { type: "Metro / Rail + Bus", time: "47 min", fit: "Good schedule fit", walk: "8 min", transfer: "1", access: "A Line / local bus context", benefit: "Transit benefit", tone: "blue", reason: "Scheduled transit serves the destination corridor and the commuter reported transit willingness." },
  { type: "Transit + Access Point", time: "43 min", fit: "Strong first / last mile fit", walk: "6 min", transfer: "1", access: "Allen Station", benefit: "Institution-sponsored option", tone: "mint", reason: "The commuter accepts an Access Point and the station connects to the destination-area mobility network." },
  { type: "Drive + Preferred Parking", time: "27 min", fit: "Fallback intervention", walk: "—", transfer: "—", access: "Site parking", benefit: "Preferred parking if program rules allow", tone: "amber", reason: "The trip remains drive-based but can still be managed as a parking-demand intervention rather than unmeasured SOV travel." },
];

const REVIEW_ITEMS = [
  { id: "RR-2048", corridor: "Glendale → Pasadena", compatibility: "87%", detour: "6 min", access: "Glendale Transportation Center", cohort: "PCC Student Program", accessibility: "No additional request" },
  { id: "RR-2061", corridor: "Eagle Rock → Pasadena", compatibility: "82%", detour: "5 min", access: "Eagle Rock Plaza public edge", cohort: "Campus commuter cohort", accessibility: "Review requested" },
  { id: "RR-2094", corridor: "Highland Park → PCC", compatibility: "79%", detour: "7 min", access: "Allen Station", cohort: "PCC Student Program", accessibility: "No additional request" },
];

const PARTICIPANTS = [
  ["RR-2048", "PCC Student Program", "Glendale", "Pasadena", "Submitted", "Approximate zone"],
  ["RR-2061", "Campus commuter cohort", "Eagle Rock", "Pasadena", "Submitted", "Approximate zone"],
  ["RR-2094", "PCC Student Program", "Highland Park", "PCC", "Under review", "Approximate zone"],
  ["RR-2110", "Employee cohort", "Altadena", "Pasadena", "Submitted", "Approximate zone"],
];

const PROGRAMS = [
  ["Transit Benefit", "Active · demo", "Sustainability / TDM", "All eligible commuters"],
  ["Carpool / Planned Route Coordination", "Active · demo", "Mobility Program Manager", "Approved cohort"],
  ["Green Route Credits", "Under Review", "Program Administrator", "Qualifying behaviors"],
  ["Preferred Parking", "Under Review", "Site Manager", "Carpool / program cohort"],
  ["Flexible Work", "Proposed", "HR / TDM", "Eligible employees"],
  ["Access Point Program", "Proposed", "Mobility Program Manager", "Reviewed corridors"],
];

const RULES = [
  ["Approximate location first", "Required", "Participant exact home locations are not shown to institutional users."],
  ["Administrative review before participant connection", "Required", "Commuter-option previews do not automatically create confirmed transportation."],
  ["Institution / cohort eligibility", "Required", "Only eligible participants can enter a governed program workflow."],
  ["Access Point review", "Required", "Candidate locations require institutional review for suitability."],
  ["Participant contribution", "Disabled for PCC demo", "No participant contribution is required in the institution-sponsored PCC demonstration."],
  ["Green Route Credits", "Capped benefit", "Promotional or employer-sponsored participation benefit; not wages or guaranteed earnings."],
];

const REPORTS = [
  ["Executive Mobility Report", "Leadership", "Baseline + programs + outcomes"],
  ["TDM Program Performance", "Program managers", "Participation + intervention metrics"],
  ["Parking Pressure Report", "Facilities / leadership", "Modeled utilization + corridor contribution"],
  ["Corridor Opportunity Report", "Mobility team", "Demand + coverage + primary gaps"],
  ["Transit Participation Report", "Sustainability / TDM", "Survey-reported / configured context"],
  ["EV & Charging Demand Report", "Facilities / sustainability", "Reported + modeled clean-vehicle signals"],
  ["Rule 2202 Reporting Readiness", "ETC / compliance team", "Readiness support only · not a filing"],
];

export default function SaasInstitutionalWorkspace({ onOpenMap, onOpenParticipant }: Props) {
  const [section, setSection] = useState<SectionId>("dashboard");
  const [view, setView] = useState<ViewId>("dashboard");
  const [organization, setOrganization] = useState("Relay Rider Demonstration Organization");
  const [site, setSite] = useState("All demonstration sites");
  const [cohort, setCohort] = useState("All cohorts");
  const [corridorId, setCorridorId] = useState(CORRIDORS[0].id);
  const [reviewStates, setReviewStates] = useState<Record<string, ReviewState>>({});
  const [creditBudget, setCreditBudget] = useState("2500");
  const [creditCap, setCreditCap] = useState("3");

  const subviews = useMemo(() => VIEWS.filter((item) => item.section === section), [section]);
  const currentLabel = VIEWS.find((item) => item.id === view)?.label ?? "Executive Dashboard";
  const corridor = CORRIDORS.find((item) => item.id === corridorId) ?? CORRIDORS[0];

  function chooseSection(next: SectionId) {
    setSection(next);
    setView(VIEWS.find((item) => item.section === next)?.id ?? "dashboard");
  }

  function exportDemoCsv() {
    const rows = [
      ["participant_ref", "cohort", "origin_zone", "destination_zone", "status", "privacy_mode"],
      ...PARTICIPANTS,
    ];
    const csv = rows.map((row) => row.map((cell) => `"${String(cell).replaceAll('"', '""')}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "relay-rider-demo-participants.csv";
    link.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="saas-shell">
      <header className="saas-header">
        <div className="saas-brand-block">
          <strong>Relay Rider</strong>
          <span>Institutional Transportation Demand Management Platform</span>
        </div>
        <div className="saas-header-actions">
          <span className="saas-demo-badge">DEMONSTRATION ENVIRONMENT</span>
          <button className="saas-ghost-button" onClick={onOpenParticipant}>Participant App</button>
          <button className="saas-dark-button" onClick={onOpenMap}>Mobility Map</button>
        </div>
      </header>

      <section className="tenant-context" aria-label="Institutional context">
        <label><span>Organization</span><select value={organization} onChange={(event) => setOrganization(event.currentTarget.value)}><option>Relay Rider Demonstration Organization</option><option>Employer Program · Demo</option><option>Campus Program · Demo</option></select></label>
        <label><span>Site</span><select value={site} onChange={(event) => setSite(event.currentTarget.value)}><option>All demonstration sites</option><option>Pasadena City College context</option><option>Glendale site context</option><option>Medical center context</option></select></label>
        <label><span>Cohort</span><select value={cohort} onChange={(event) => setCohort(event.currentTarget.value)}><option>All cohorts</option><option>Student demonstration cohort</option><option>Employee demonstration cohort</option><option>Shift-based cohort</option></select></label>
        <div className="tenant-context-note"><strong>Multi-tenant SaaS model</strong><span>Production requires authenticated organization membership and RBAC. These selectors are demonstration context only.</span></div>
      </section>

      <nav className="saas-primary-nav" aria-label="Relay Rider platform sections">
        {SECTIONS.map((item) => <button key={item.id} className={section === item.id ? "active" : ""} onClick={() => chooseSection(item.id)}>{item.label}</button>)}
      </nav>

      <div className="saas-body">
        <aside className="saas-subnav" aria-label={`${section} navigation`}>
          <small>{SECTIONS.find((item) => item.id === section)?.label}</small>
          {subviews.map((item) => <button key={item.id} className={view === item.id ? "active" : ""} onClick={() => setView(item.id)}>{item.label}</button>)}
          <div className="saas-subnav-foot"><strong>Institutional operating model</strong><span>Measure → Diagnose → Plan → Coordinate → Administer → Engage → Measure Outcomes → Report</span></div>
        </aside>

        <main className="saas-main">
          <div className="saas-page-heading">
            <div><span>PASADENA · EAGLE ROCK · GLENDALE · DEMONSTRATION CONTEXT</span><h1>{currentLabel}</h1></div>
            <span className="data-state-chip">Modeled / demo data clearly labeled</span>
          </div>

          <section className="saas-notice"><strong>Institutional SaaS TDM demonstration.</strong><span>Named institutions and public facilities are context only; no customer, partnership, program approval, regulatory filing, guaranteed transportation, or live-transit integration is implied.</span></section>

          {view === "dashboard" && <DashboardView setSection={chooseSection} setView={setView} onOpenMap={onOpenMap} />}
          {view === "baseline" && <BaselineView />}
          {view === "sites" && <SitesView />}
          {view === "corridors" && <CorridorsView corridorId={corridorId} setCorridorId={setCorridorId} corridor={corridor} onOpenMap={onOpenMap} />}
          {view === "parking" && <ParkingView setView={setView} setSection={setSection} />}
          {view === "ev" && <EvView onOpenMap={onOpenMap} />}
          {view === "options" && <CommuteOptionsView />}
          {view === "transit" && <TransitView />}
          {view === "exchange" && <CorridorExchangeView />}
          {view === "access" && <AccessPointsView onOpenMap={onOpenMap} />}
          {view === "programs" && <ProgramsView />}
          {view === "incentives" && <IncentivesView budget={creditBudget} setBudget={setCreditBudget} cap={creditCap} setCap={setCreditCap} />}
          {view === "engagement" && <EngagementView />}
          {view === "participants" && <ParticipantsView />}
          {view === "review" && <ReviewQueueView reviewStates={reviewStates} setReviewStates={setReviewStates} />}
          {view === "rules" && <RulesView />}
          {view === "measurement" && <MeasurementView />}
          {view === "reports" && <ReportsView />}
          {view === "exports" && <ExportsView onExport={exportDemoCsv} />}
          {view === "settings" && <SettingsView />}
        </main>
      </div>
    </div>
  );
}

function DashboardView({ setSection, setView, onOpenMap }: { setSection: (section: SectionId) => void; setView: (view: ViewId) => void; onOpenMap: () => void }) {
  const go = (section: SectionId, view: ViewId) => { setSection(section); setView(view); };
  return <>
    <section className="saas-hero">
      <div><small>INSTITUTIONAL MOBILITY HEALTH</small><h2>Understand commute demand, identify mobility constraints, deploy interventions, and measure outcomes.</h2><p>Relay Rider connects TDM intelligence to governed commuter coordination through planned routes, Access Points, multimodal options, program administration, and institutional reporting.</p></div>
      <div className="saas-operating-spine">Signal <b>→</b> Record <b>→</b> Score <b>→</b> Preview <b>→</b> Task <b>→</b> Review <b>→</b> Dashboard <b>→</b> Report <b>→</b> Partner Action</div>
    </section>
    <div className="saas-kpi-grid">{KPIS.map(([label, value, note, tone]) => <article className={`tone-${tone}`} key={label}><small>{label}</small><strong>{value}</strong><span>{note}</span></article>)}</div>
    <div className="saas-two-column">
      <section className="saas-card"><div className="saas-card-heading"><div><small>CORRIDOR INTELLIGENCE</small><h3>Recurring demand requiring program attention</h3></div><button onClick={() => go("intelligence", "corridors")}>Open corridors</button></div><div className="saas-list-table"><div className="saas-list-head"><span>Corridor</span><span>Signals</span><span>SOV</span><span>Coverage</span></div>{CORRIDORS.map((item) => <button key={item.id} onClick={() => go("intelligence", "corridors")}><span><strong>{item.name}</strong><small>{item.gap}</small></span><span>{item.signals}</span><span>{item.sov}</span><span>{item.coverage}</span></button>)}</div></section>
      <section className="saas-card tone-amber action-board"><div className="saas-card-heading"><div><small>ACTION NEEDED</small><h3>Administrative intervention queue</h3></div></div>{["38 commuters have no compatible alternative", "Site A reaches 94% modeled peak parking utilization", "12 commuters could benefit from Metro + Access Point coordination", "24 participants qualify for an institution-sponsored option", "EV charging demand clusters between 9 AM and noon"].map((item, index) => <button key={item} onClick={() => index < 2 ? go("intelligence", index === 0 ? "corridors" : "parking") : go("operations", "review")}><b>{index + 1}</b><span>{item}</span></button>)}</section>
    </div>
    <div className="saas-quick-grid"><button onClick={onOpenMap}><strong>Mobility Map</strong><span>Demand · transit · Access Points · parking · EV</span></button><button onClick={() => go("mobility", "exchange")}><strong>Corridor Exchange</strong><span>Commute needs · planned routes · match previews</span></button><button onClick={() => go("programs", "programs")}><strong>Program Manager</strong><span>Interventions · incentives · engagement</span></button><button onClick={() => go("measure", "reports")}><strong>Reports</strong><span>Executive · parking · sustainability · readiness</span></button></div>
  </>;
}

function BaselineView() {
  return <><Intro kicker="BASELINE ASSESSMENT" title="Establish current mobility conditions before selecting interventions." body="Institutional views aggregate approximate zones, schedules, current mode, parking experience, transit access, EV/hybrid status, and preferences. Participant-level home addresses are not displayed." /><div className="metric-card-grid"><Metric label="Drive alone" value="71%" note="Survey-reported example" /><Metric label="Transit" value="18%" note="Demonstration data" /><Metric label="Carpool / shared commute" value="7%" note="Demonstration data" /><Metric label="Walk / bike / micromobility" value="4%" note="Demonstration data" /><Metric label="Parking difficulty" value="46%" note="Often / sometimes · demo" /><Metric label="Transit willingness" value="64%" note="Reported willingness" /><Metric label="Access Point willingness" value="61%" note="Reported willingness" /><Metric label="EV / hybrid" value="28%" note="Reported status" /><Metric label="Typical arrival" value="7–9 AM" note="Recurring weekday demand" /><Metric label="Median flexibility" value="±15 min" note="Demonstration data" /></div></>;
}

function SitesView() {
  return <><Intro kicker="SITE MOBILITY READINESS" title="Compare site-level mobility constraints and intervention readiness." body="Scores are Relay Rider modeled readiness scores for demonstration only—not a validated scientific or regulatory standard." /><div className="site-card-grid">{SITES.map(([name, parking, transit, score, confidence]) => <article className="site-saas-card" key={name}><div className="site-score"><strong>{score}</strong><span>Modeled readiness</span></div><h3>{name}</h3><Detail label="Parking pressure" value={parking} /><Detail label="Transit access" value={transit} /><Detail label="Major corridor opportunity" value="High / medium · demo" /><Detail label="EV / charging context" value="Available for planning" /><Detail label="Data confidence" value={confidence} /></article>)}</div></>;
}

function CorridorsView({ corridorId, setCorridorId, corridor, onOpenMap }: { corridorId: string; setCorridorId: (id: string) => void; corridor: typeof CORRIDORS[number]; onOpenMap: () => void }) {
  return <><Intro kicker="CORRIDOR INTELLIGENCE" title="Find recurring demand, option coverage, and the reason demand remains unmatched." body="Origin geography is generalized. Planned-route capacity, compatibility, and detour values are modeled demonstration values." action="Open corridor map" onAction={onOpenMap} /><div className="corridor-saas-layout"><section className="saas-card corridor-pick"><small>DEMONSTRATION CORRIDORS</small>{CORRIDORS.map((item) => <button key={item.id} className={corridorId === item.id ? "active" : ""} onClick={() => setCorridorId(item.id)}><strong>{item.name}</strong><span>{item.signals} recurring signals</span></button>)}</section><section className="saas-card corridor-selected"><div className="saas-card-heading"><div><small>SELECTED CORRIDOR</small><h3>{corridor.name}</h3></div><span className="data-state-chip">Modeled example</span></div><div className="metric-card-grid compact"><Metric label="Recurring demand" value={String(corridor.signals)} note="Commute signals" /><Metric label="Drive-alone share" value={corridor.sov} note="Demo baseline" /><Metric label="Planned-route seats" value={corridor.seats} note="Modeled capacity" /><Metric label="Transit alternatives" value={corridor.transit} note="Scheduled/static context" /><Metric label="Option coverage" value={corridor.coverage} note="Modeled" /><Metric label="Access Point coverage" value={corridor.access} note="Modeled" /><Metric label="Estimated detour" value={corridor.detour} note="Modeled median" /><Metric label="EV / hybrid" value={corridor.ev} note="Demo participation" /></div><div className="primary-gap-box"><small>PRIMARY GAP</small><strong>{corridor.gap}</strong><span>Failed matching becomes a TDM task for the institution rather than a dead end for the commuter.</span></div></section></div></>;
}

function ParkingView({ setView, setSection }: { setView: (view: ViewId) => void; setSection: (section: SectionId) => void }) {
  return <><Intro kicker="PARKING INTELLIGENCE" title="Treat parking pressure as a measurable institutional mobility constraint." body="Parking utilization values shown here are modeled examples until facility observations or connected parking data are available." /><div className="metric-card-grid"><Metric label="Total spaces" value="2,480" note="Demonstration supply" /><Metric label="Modeled peak utilization" value="94%" note="Severe" /><Metric label="EV spaces" value="72" note="Demonstration data" /><Metric label="Carpool spaces" value="36" note="Demonstration data" /></div><section className="saas-card tone-amber"><div className="saas-card-heading"><div><small>CORRIDOR CONTRIBUTION</small><h3>31% of modeled peak parking demand originates in three recurring corridors.</h3></div></div><p className="card-copy">Use corridor-targeted interventions—transit benefits, planned-route recruitment, preferred parking, schedule flexibility, and Access Point improvements—instead of undifferentiated parking messaging.</p><button className="saas-dark-button" onClick={() => { setSection("intelligence"); setView("corridors"); }}>Review contributing corridors</button></section></>;
}

function EvView({ onOpenMap }: { onOpenMap: () => void }) {
  return <><Intro kicker="EV & CHARGING" title="Use clean-vehicle signals for corridor and infrastructure planning." body="Charging demand remains modeled unless an actual charger or institution data source is connected. No utility credit, LCFS credit, certified emissions reduction, or reimbursement is implied." action="View EV context on map" onAction={onOpenMap} /><div className="metric-card-grid"><Metric label="EV / hybrid participants" value="28%" note="Demonstration data" /><Metric label="EV planned-route supply" value="19" note="Modeled routes" /><Metric label="Charging interest" value="34%" note="Reported / modeled" /><Metric label="Peak charging signal" value="9 AM–noon" note="Modeled window" /></div></>;
}

function CommuteOptionsView() {
  return <><Intro kicker="MULTIMODAL COMMUTE OPTIONS" title="Compare institutional interventions instead of forcing every commuter into one mode." body="These are simulated option previews for product evaluation and are not guaranteed transportation." /><div className="option-saas-grid">{OPTIONS.map((option) => <article className={`saas-option-card tone-${option.tone}`} key={option.type}><span className="sim-chip">SIMULATED OPTION</span><h3>{option.type}</h3><strong>{option.time}</strong><div className="option-facts"><Detail label="Schedule / compatibility" value={option.fit} /><Detail label="Walk" value={option.walk} /><Detail label="Transfers" value={option.transfer} /><Detail label="Access Point / connection" value={option.access} /><Detail label="Program benefit" value={option.benefit} /></div><div className="why-option"><small>WHY THIS OPTION APPEARED</small><p>{option.reason}</p></div></article>)}</div></>;
}

function TransitView() {
  return <><Intro kicker="TRANSIT & LOCAL MOBILITY" title="Make Metro, municipal transit, campus mobility, walking, biking, and first / last mile first-class options." body="Times shown are scheduled/static demonstration values. No live arrival or fare-card feed is represented." /><div className="saas-table"><div className="saas-table-head five"><span>Option</span><span>Time</span><span>Walk</span><span>Transfers</span><span>Benefit</span></div>{[["Metro + Bus", "47 min", "8 min", "1", "Transit benefit"],["Planned Route", "31 min", "5 min", "0", "+3 Green Route Credits"],["Drive Alone", "26 min", "—", "—", "Parking pressure high"],["A Line + PCC shuttle context", "42 min", "6 min", "1", "Institution-sponsored"]].map((row) => <div className="saas-table-row five" key={row[0]}>{row.map((cell) => <span key={cell}>{cell}</span>)}</div>)}</div></>;
}

function CorridorExchangeView() {
  return <><Intro kicker="CORRIDOR EXCHANGE" title="Govern planned-route coordination inside the broader TDM platform." body="The Corridor Exchange is not a public ride-hailing marketplace. It coordinates trips participants already intend to make, subject to program rules and administrative review." /><div className="exchange-flow"><article className="tone-violet"><small>COMMUTE NEEDS</small><strong>38 eligible demo records</strong><span>Approximate zones · schedules · preferences</span></article><b>→</b><article className="tone-mint"><small>PLANNED ROUTES</small><strong>19 recurring demo routes</strong><span>Capacity · detour limits · Access Points</span></article><b>→</b><article className="tone-blue"><small>MATCH PREVIEWS</small><strong>27 simulated options</strong><span>Explainable compatibility · no guaranteed ride</span></article><b>→</b><article className="tone-amber"><small>ADMIN REVIEW</small><strong>7 need attention</strong><span>Eligibility · accessibility · program rules</span></article></div><section className="saas-card"><div className="saas-card-heading"><div><small>MATCH PREVIEW REQUIREMENTS</small><h3>Every option should explain why it exists.</h3></div></div><div className="pill-cloud">{["Origin / destination compatibility", "Route overlap", "Time-window fit", "Estimated detour", "Access Point compatibility", "Institution / cohort eligibility", "Accessibility compatibility", "EV / hybrid preference", "Program rules"].map((item) => <span key={item}>{item}</span>)}</div></section></>;
}

function AccessPointsView({ onOpenMap }: { onOpenMap: () => void }) {
  return <><Intro kicker="ACCESS POINT MANAGER" title="Review public coordination locations before including them in governed commuter options." body="Locations may be reviewed for visibility, lighting, accessibility, permission, hours, and route compatibility. Relay Rider does not guarantee safety." action="Open Access Point map" onAction={onOpenMap} /><div className="saas-table"><div className="saas-table-head four"><span>Access Point</span><span>Transit context</span><span>Permission</span><span>Status</span></div>{[["Glendale Transportation Center", "Regional rail / bus", "Pending", "Under Review"],["Eagle Rock Plaza public edge", "Bus corridor context", "Pending", "Candidate"],["Allen Station", "A Line + PCC shuttle context", "Program review", "Under Review"],["PCC Colorado · Lots 6/7 area", "PCC shuttle context", "Institution required", "Restricted"],["Memorial Park Station", "Metro A Line", "Program review", "Candidate"]].map((row) => <div className="saas-table-row four" key={row[0]}>{row.map((cell) => <span key={cell}>{cell}</span>)}</div>)}</div></>;
}

function ProgramsView() {
  return <><Intro kicker="TDM PROGRAM MANAGER" title="Manage commuter coordination as one intervention inside a broader mobility strategy." body="Program records below are demonstration planning records, not claims of active institutional programs." /><div className="program-saas-grid">{PROGRAMS.map(([name, status, owner, eligibility]) => <article key={name}><span className="status-pill">{status}</span><h3>{name}</h3><Detail label="Owner" value={owner} /><Detail label="Eligibility" value={eligibility} /><Detail label="Measurement" value="Configured KPI set · demo" /></article>)}</div></>;
}

function IncentivesView({ budget, setBudget, cap, setCap }: { budget: string; setBudget: (value: string) => void; cap: string; setCap: (value: string) => void }) {
  return <><Intro kicker="INCENTIVE PROGRAM MANAGER" title="Configure capped institution-sponsored participation benefits." body="Green Route Credits are promotional or employer-sponsored participation benefits in this prototype—not wages, fares, cash earnings, certified offsets, or guaranteed benefits." /><section className="saas-card incentive-saas-card"><div className="config-grid"><label><span>Program budget</span><input type="number" min="0" value={budget} onChange={(event) => setBudget(event.currentTarget.value)} /></label><label><span>Credits per qualifying choice</span><input type="number" min="0" max="20" value={cap} onChange={(event) => setCap(event.currentTarget.value)} /></label><label><span>Eligible cohort</span><select defaultValue="pcc"><option value="pcc">PCC student demonstration cohort</option><option value="employee">Employee cohort</option></select></label><label><span>Approval</span><select defaultValue="admin"><option value="admin">Administrative approval</option><option value="auto-disabled">Automatic approval — not active</option></select></label></div><div className="incentive-preview"><small>COMMUTER PREVIEW</small><strong>You may qualify for {cap || "0"} Green Route Credits for choosing this commute option.</strong><span>No participant contribution required for this institution-sponsored demonstration program.</span></div></section></>;
}

function EngagementView() {
  return <><Intro kicker="ENGAGEMENT" title="Target communications and participation programs to specific mobility problems." body="This is a prototype planning workspace. Campaign sending and messaging automation are not represented as live functionality." /><div className="program-saas-grid">{[["Corridor-targeted outreach", "Glendale → Pasadena", "Recruit planned-route supply"],["Transit orientation", "PCC demonstration cohort", "Increase transit familiarity"],["Parking-pressure campaign", "Site A", "Shift peak drive-alone demand"],["EV charging survey", "Clean-vehicle cohort", "Improve charging-demand signal"]].map(([name, audience, goal]) => <article key={name}><span className="status-pill">Prototype</span><h3>{name}</h3><Detail label="Audience" value={audience} /><Detail label="Goal" value={goal} /><Detail label="Status" value="Planning only" /></article>)}</div></>;
}

function ParticipantsView() {
  return <><Intro kicker="PARTICIPANT OPERATIONS" title="Manage program participation without exposing unnecessary private location data." body="Participant references, approximate zones, cohort membership, status, and program workflow are separated from exact private locations." /><div className="saas-table"><div className="saas-table-head six"><span>Reference</span><span>Cohort</span><span>Origin</span><span>Destination</span><span>Status</span><span>Privacy</span></div>{PARTICIPANTS.map((row) => <div className="saas-table-row six" key={row[0]}>{row.map((cell) => <span key={cell}>{cell}</span>)}</div>)}</div></>;
}

function ReviewQueueView({ reviewStates, setReviewStates }: { reviewStates: Record<string, ReviewState>; setReviewStates: React.Dispatch<React.SetStateAction<Record<string, ReviewState>>> }) {
  const setState = (id: string, next: ReviewState) => setReviewStates((current) => ({ ...current, [id]: next }));
  return <><Intro kicker="ADMINISTRATIVE REVIEW" title="Govern eligibility and commuter-option previews before participant connection." body="Review actions change demonstration workflow state only. They do not confirm transportation." /><div className="review-saas-grid">{REVIEW_ITEMS.map((review) => { const status = reviewStates[review.id] ?? "Administrative review required"; return <article key={review.id}><div className="review-top"><div><small>COMMUTER OPTION</small><h3>{review.id}</h3></div><span>{status}</span></div><Detail label="Corridor" value={review.corridor} /><Detail label="Compatibility" value={review.compatibility} /><Detail label="Estimated detour" value={review.detour} /><Detail label="Access Point" value={review.access} /><Detail label="Cohort" value={review.cohort} /><Detail label="Accessibility" value={review.accessibility} /><div className="review-buttons"><button onClick={() => setState(review.id, "Accepted for Review")}>Accept for Review</button><button onClick={() => setState(review.id, "Needs Revision")}>Needs Revision</button><button onClick={() => setState(review.id, "Waitlist")}>Waitlist</button><button onClick={() => setState(review.id, "Not Eligible")}>Not Eligible</button><button onClick={() => setState(review.id, "Escalated")}>Escalate</button></div></article>; })}</div></>;
}

function RulesView() {
  return <><Intro kicker="PROGRAM RULES" title="Make institutional governance explicit and auditable." body="Rules shown are product-prototype defaults and demonstration policy states. Production enforcement requires authenticated roles and persisted organization configuration." /><div className="rules-list">{RULES.map(([rule, state, detail]) => <article key={rule}><div><small>{state}</small><h3>{rule}</h3></div><p>{detail}</p></article>)}</div></>;
}

function MeasurementView() {
  return <><Intro kicker="MEASUREMENT" title="Every KPI should expose source, period, coverage, confidence, and methodology." body="Observed, survey-reported, estimated, modeled, and simulated values remain visibly distinct." /><div className="saas-table"><div className="saas-table-head five"><span>Metric</span><span>Source</span><span>Period</span><span>Confidence</span><span>Methodology</span></div>{[["SOV / drive-alone share", "Survey-reported", "Demo period", "Medium", "Participant-reported baseline mode"],["Parking utilization", "Modeled", "AM peak", "Low", "Occupied spaces / available spaces"],["Option coverage", "Modeled", "Snapshot", "Medium", "Needs with ≥1 simulated compatible option"],["Transit participation", "Survey-reported", "Snapshot", "Medium", "Reported mode use; not fare-card data"],["Estimated VMT change", "Modeled", "Scenario", "Low", "Scenario estimate; not certified"]].map((row) => <div className="saas-table-row five" key={row[0]}>{row.map((cell) => <span key={cell}>{cell}</span>)}</div>)}</div></>;
}

function ReportsView() {
  return <><Intro kicker="INSTITUTIONAL REPORTING" title="Turn mobility operations into decision-ready reports." body="Reporting surfaces remain demonstration outputs until source-backed pipelines and methodology are connected." /><div className="report-grid">{REPORTS.map(([name, audience, scope]) => <article key={name}><span className="status-pill">Prototype report</span><h3>{name}</h3><Detail label="Audience" value={audience} /><Detail label="Scope" value={scope} /></article>)}</div></>;
}

function ExportsView({ onExport }: { onExport: () => void }) {
  return <><Intro kicker="DATA EXPORTS" title="Support analysis and partner workflows without disguising demo data as operational records." body="The CSV below exports only the demonstration participant rows shown in this interface." /><section className="saas-card export-card"><div><small>DEMONSTRATION CSV</small><h3>Participant operations export</h3><p>Participant reference · cohort · approximate zones · status · privacy mode</p></div><button className="saas-dark-button" onClick={onExport}>Download demo CSV</button></section></>;
}

function SettingsView() {
  const roles = ["Organization Owner", "Program Administrator", "TDM / ETC Manager", "Sustainability Manager", "Site Manager", "Analyst", "Reviewer", "Participant"];
  return <><Intro kicker="ORGANIZATION SETTINGS" title="Structure Relay Rider as a multi-tenant institutional SaaS platform." body="Production configuration requires authenticated organization membership and real RBAC. This screen shows the intended operating model without claiming those controls are live." /><div className="settings-saas-grid"><section className="saas-card"><small>ORGANIZATION STRUCTURE</small><h3>Organization → Sites → Cohorts → Programs</h3><div className="pill-cloud">{["Institution profile", "Sites", "Cohorts", "Program ownership", "Data retention", "Privacy defaults"].map((item) => <span key={item}>{item}</span>)}</div></section><section className="saas-card"><small>ROLES</small><h3>Role-based access model</h3><div className="pill-cloud">{roles.map((role) => <span key={role}>{role}</span>)}</div></section><section className="saas-card"><small>DATA SOURCES</small><h3>Institutional + transportation intelligence</h3><div className="pill-cloud">{["Participant intake", "Parking observations", "GTFS / GTFS-RT future", "ACS / CTPP", "LEHD / LODES", "SCAG", "Caltrans", "EPA Smart Location Database"].map((item) => <span key={item}>{item}</span>)}</div></section><section className="saas-card"><small>SECURITY & PRIVACY</small><h3>Governed program controls</h3><div className="pill-cloud">{["Organization scoping", "Role permissions", "Approximate zones", "Consent", "90-day research retention", "Withdrawal", "Blocking / reporting", "Audit trail future"].map((item) => <span key={item}>{item}</span>)}</div></section></div></>;
}

function Intro({ kicker, title, body, action, onAction }: { kicker: string; title: string; body: string; action?: string; onAction?: () => void }) {
  return <section className="saas-intro"><div><small>{kicker}</small><h2>{title}</h2><p>{body}</p></div>{action && onAction ? <button className="saas-dark-button" onClick={onAction}>{action}</button> : null}</section>;
}

function Metric({ label, value, note }: { label: string; value: string; note: string }) {
  return <article className="metric-saas-card"><small>{label}</small><strong>{value}</strong><span>{note}</span></article>;
}

function Detail({ label, value }: { label: string; value: string }) {
  return <div className="detail-saas-row"><span>{label}</span><strong>{value}</strong></div>;
}
