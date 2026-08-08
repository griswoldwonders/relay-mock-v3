import { useMemo, useState } from "react";
import "./institutional-workspace.css";

type AdminView =
  | "overview"
  | "baseline"
  | "sites"
  | "corridors"
  | "options"
  | "transit"
  | "access"
  | "programs"
  | "incentives"
  | "parking"
  | "ev"
  | "administration"
  | "engagement"
  | "measurement"
  | "reports"
  | "settings";

type Props = {
  onOpenMap: () => void;
  onOpenParticipant: () => void;
};

type ReviewStatus = "Administrative review required" | "Accepted for Review" | "Needs Revision" | "Waitlist" | "Not Eligible" | "Escalated";

const NAV: { id: AdminView; label: string; priority?: string }[] = [
  { id: "overview", label: "Overview", priority: "P1" },
  { id: "baseline", label: "Baseline", priority: "P1" },
  { id: "sites", label: "Sites", priority: "P1" },
  { id: "corridors", label: "Corridors", priority: "P1" },
  { id: "options", label: "Commute Options", priority: "P1" },
  { id: "transit", label: "Transit & Mobility", priority: "P1" },
  { id: "access", label: "Access Points", priority: "P1" },
  { id: "programs", label: "Programs", priority: "P2" },
  { id: "incentives", label: "Incentives", priority: "P2" },
  { id: "parking", label: "Parking", priority: "P2" },
  { id: "ev", label: "EV & Charging", priority: "P2" },
  { id: "administration", label: "Administration", priority: "P1" },
  { id: "engagement", label: "Engagement", priority: "P3" },
  { id: "measurement", label: "Measurement", priority: "P2" },
  { id: "reports", label: "Reports", priority: "P3" },
  { id: "settings", label: "Settings", priority: "P3" },
];

const KPI = [
  ["Drive-Alone / SOV Share", "71%", "Survey-reported · modeled example"],
  ["Parking Pressure", "Severe", "Modeled peak utilization"],
  ["Active Participants", "412", "Demonstration data"],
  ["Corridor Demand", "568", "Recurring commute signals · demo"],
  ["Commuter Option Coverage", "61%", "Modeled example"],
  ["Transit Participation", "18%", "Demonstration data"],
  ["EV / Hybrid Participation", "28%", "Demonstration data"],
  ["Data Confidence", "Medium", "Prototype confidence band"],
];

const CORRIDORS = [
  { id: "glendale-pasadena", name: "Glendale → Pasadena", commuters: 126, peak: "Tue–Thu · 7:00–8:30 AM", sov: "73%", capacity: "43 seats", transit: "Strong", coverage: "61%", access: "72%", parking: "High", ev: "39%", detour: "6 min", gap: "Insufficient planned-route supply" },
  { id: "eagle-rock-pasadena", name: "Eagle Rock → Pasadena", commuters: 94, peak: "Mon–Thu · 7:30–9:00 AM", sov: "69%", capacity: "22 seats", transit: "Moderate", coverage: "58%", access: "65%", parking: "High", ev: "31%", detour: "5 min", gap: "Access Point coverage" },
  { id: "highland-park-pcc", name: "Highland Park → PCC", commuters: 81, peak: "Mon–Thu · 7:00–9:00 AM", sov: "62%", capacity: "14 seats", transit: "Strong", coverage: "74%", access: "78%", parking: "Moderate", ev: "21%", detour: "7 min", gap: "Schedule mismatch" },
  { id: "east-hollywood-glendale", name: "East Hollywood → Glendale", commuters: 67, peak: "Mon–Fri · 8:00–9:30 AM", sov: "76%", capacity: "11 seats", transit: "Moderate", coverage: "49%", access: "43%", parking: "High", ev: "26%", detour: "8 min", gap: "Transit / first-last-mile gap" },
  { id: "altadena-pasadena", name: "Altadena → Pasadena", commuters: 54, peak: "Tue–Thu · 6:30–8:00 AM", sov: "79%", capacity: "9 seats", transit: "Limited", coverage: "38%", access: "41%", parking: "Severe", ev: "35%", detour: "9 min", gap: "Insufficient route supply" },
];

const SITES = [
  { name: "Pasadena City College", population: "24.6k modeled", parking: "Constrained", transit: "Strong", walk: "Strong", bike: "Moderate", ev: "Institutional charging context", corridors: "5", opportunity: "High", confidence: "Medium", score: 78 },
  { name: "Caltech", population: "3.1k modeled", parking: "Moderate", transit: "Strong", walk: "Strong", bike: "Strong", ev: "Charging context", corridors: "4", opportunity: "Medium", confidence: "Medium", score: 82 },
  { name: "Glendale Community College", population: "16.8k modeled", parking: "High", transit: "Moderate", walk: "Moderate", bike: "Moderate", ev: "Charging context", corridors: "4", opportunity: "High", confidence: "Low", score: 64 },
  { name: "Hospital / Medical Center", population: "4.8k modeled", parking: "Severe", transit: "Moderate", walk: "Moderate", bike: "Low", ev: "Charging context", corridors: "6", opportunity: "High", confidence: "Low", score: 59 },
  { name: "Employer Campus", population: "2.2k modeled", parking: "High", transit: "Moderate", walk: "Moderate", bike: "Moderate", ev: "Charging context", corridors: "3", opportunity: "Medium", confidence: "Low", score: 66 },
];

const ACCESS_POINTS = [
  { name: "Glendale Transportation Center", corridor: "Glendale → Pasadena", transit: "Regional rail / bus context", ev: "Nearby charging review pending", accessibility: "Under Review", visibility: "Reviewed", lighting: "Under Review", permission: "Pending", hours: "Program-defined", status: "Under Review" },
  { name: "Eagle Rock Plaza public edge", corridor: "Eagle Rock → Pasadena", transit: "Bus corridor context", ev: "No assumption", accessibility: "Under Review", visibility: "Under Review", lighting: "Under Review", permission: "Pending", hours: "TBD", status: "Candidate" },
  { name: "Allen Station", corridor: "Pasadena / PCC", transit: "Metro A Line + PCC shuttle context", ev: "No assumption", accessibility: "Transit facility context", visibility: "Reviewed context", lighting: "Review required", permission: "Program review", hours: "Transit-dependent", status: "Under Review" },
  { name: "PCC Colorado · Lots 6/7 area", corridor: "PCC destination", transit: "PCC shuttle boarding context", ev: "Institutional context", accessibility: "Campus review", visibility: "Campus review", lighting: "Campus review", permission: "Institution required", hours: "Institution-defined", status: "Restricted" },
  { name: "Memorial Park Station", corridor: "Central Pasadena", transit: "Metro A Line", ev: "No assumption", accessibility: "Transit facility context", visibility: "Reviewed context", lighting: "Review required", permission: "Program review", hours: "Transit-dependent", status: "Candidate" },
];

const REVIEWS = [
  { id: "RR-2048", corridor: "Glendale → Pasadena", compatibility: "87%", detour: "6 min", access: "Glendale Transportation Center", cohort: "PCC Student Program", ev: "Yes", contribution: "Institution-sponsored / none required", accessibility: "No additional request" },
  { id: "RR-2061", corridor: "Eagle Rock → Pasadena", compatibility: "82%", detour: "5 min", access: "Eagle Rock Plaza public edge", cohort: "Campus commuter cohort", ev: "No preference", contribution: "Institution-sponsored / none required", accessibility: "Review requested" },
  { id: "RR-2094", corridor: "Highland Park → PCC", compatibility: "79%", detour: "7 min", access: "Allen Station", cohort: "PCC Student Program", ev: "Yes", contribution: "Institution-sponsored / none required", accessibility: "No additional request" },
];

const BASELINE_TABS = ["Commute Mode", "Origin Zones", "Schedules", "Parking", "Transit Access", "EV / Hybrid", "Participant Preferences"] as const;

const METRICS = [
  ["SOV / drive-alone share", "Survey-reported", "Spring demonstration period", "68% participant coverage", "Medium", "Mode share from participant-reported baseline mode."],
  ["Parking utilization", "Modeled", "Weekday AM peak", "3 demonstration facilities", "Low", "Occupied spaces / available spaces; replace with facility observations when connected."],
  ["Commute-option coverage", "Modeled", "Current demo snapshot", "Eligible demo commute needs", "Medium", "Share of commuter needs with at least one simulated compatible option."],
  ["Transit participation", "Survey-reported", "Current demo snapshot", "Participant sample", "Medium", "Reported transit use; not live fare-card or AVL data."],
  ["EV / hybrid participation", "Survey-reported", "Current demo snapshot", "Participant sample", "Medium", "Reported clean-vehicle status or preference."],
  ["Estimated VMT change", "Modeled", "Scenario only", "Demo interventions", "Low", "Scenario estimate; not a certified emissions or regulatory result."],
];

export default function InstitutionalWorkspace({ onOpenMap, onOpenParticipant }: Props) {
  const [view, setView] = useState<AdminView>("overview");
  const [baselineTab, setBaselineTab] = useState<(typeof BASELINE_TABS)[number]>("Commute Mode");
  const [corridorId, setCorridorId] = useState(CORRIDORS[0].id);
  const [reviewStates, setReviewStates] = useState<Record<string, ReviewStatus>>({});
  const [creditBudget, setCreditBudget] = useState("2500");
  const [creditCap, setCreditCap] = useState("3");

  const corridor = useMemo(() => CORRIDORS.find((item) => item.id === corridorId) ?? CORRIDORS[0], [corridorId]);
  const title = NAV.find((item) => item.id === view)?.label ?? "Overview";

  function setReview(id: string, status: ReviewStatus) {
    setReviewStates((current) => ({ ...current, [id]: status }));
  }

  return (
    <div className="institutional-shell">
      <aside className="institutional-sidebar" aria-label="Institutional TDM navigation">
        <div className="institutional-brand">
          <strong>Relay Rider</strong>
          <span>Transportation Demand Management</span>
        </div>
        <div className="institutional-env">DEMONSTRATION ENVIRONMENT</div>
        <nav>
          {NAV.map((item) => (
            <button key={item.id} className={view === item.id ? "active" : ""} onClick={() => setView(item.id)}>
              <span>{item.label}</span><small>{item.priority}</small>
            </button>
          ))}
        </nav>
        <button className="participant-switch" onClick={onOpenParticipant}>Open participant experience</button>
      </aside>

      <section className="institutional-main">
        <header className="institutional-topbar">
          <div>
            <span className="institutional-eyebrow">PASADENA · EAGLE ROCK · GLENDALE</span>
            <h1>{title}</h1>
          </div>
          <div className="topbar-actions">
            <span className="demo-badge">Demonstration data</span>
            <button onClick={onOpenMap}>Open mobility map</button>
          </div>
        </header>

        <main className="institutional-content">
          <section className="institutional-notice">
            <strong>Institutional TDM product demonstration.</strong>
            <span>Modeled and simulated values are labeled. Named institutions and public facilities are mobility context only; no customer, partnership, or program approval is implied.</span>
          </section>

          {view === "overview" && (
            <>
              <section className="overview-intro">
                <div><span className="section-kicker">OPERATING MODEL</span><h2>Start with the institutional mobility problem, then coordinate interventions.</h2><p>Relay Rider converts commute-pattern, parking-pressure, transit, route-interest, and EV/hybrid signals into corridor intelligence, governed commuter options, administrative tasks, and measurable TDM programs.</p></div>
                <div className="operating-spine">Signal <b>→</b> Record <b>→</b> Score <b>→</b> Preview <b>→</b> Task <b>→</b> Review <b>→</b> Dashboard <b>→</b> Report <b>→</b> Partner Action</div>
              </section>

              <div className="institutional-kpi-grid">
                {KPI.map(([label, value, note]) => <article key={label}><small>{label}</small><strong>{value}</strong><span>{note}</span></article>)}
              </div>

              <div className="two-column-grid">
                <section className="panel-card">
                  <div className="panel-heading"><div><span className="section-kicker">CORRIDOR DEMAND</span><h2>Recurring demand requiring program attention</h2></div><button onClick={() => setView("corridors")}>View corridors</button></div>
                  <div className="corridor-table compact">
                    <div className="table-head"><span>Corridor</span><span>Signals</span><span>SOV</span><span>Coverage</span></div>
                    {CORRIDORS.map((item) => <button key={item.id} onClick={() => { setCorridorId(item.id); setView("corridors"); }}><span><strong>{item.name}</strong><small>{item.peak}</small></span><span>{item.commuters}</span><span>{item.sov}</span><span>{item.coverage}</span></button>)}
                  </div>
                </section>
                <section className="panel-card action-needed">
                  <div className="panel-heading"><div><span className="section-kicker">ACTION NEEDED</span><h2>Where an administrator should intervene</h2></div></div>
                  {["38 commuters have no compatible option", "Site A parking reaches 94% modeled peak utilization", "12 commuters could benefit from Metro + Access Point coordination", "24 students qualify for an institution-sponsored commute option", "EV charging demand is concentrated between 9 AM and noon"].map((item, index) => <div className="action-item" key={item}><span>{index + 1}</span><p>{item}</p></div>)}
                </section>
              </div>
            </>
          )}

          {view === "baseline" && (
            <>
              <section className="page-intro"><span className="section-kicker">BASELINE ASSESSMENT</span><h2>Understand how people currently reach each site before choosing interventions.</h2><p>Participant-level home addresses are not shown. Institutional views aggregate approximate zones, schedules, mode choices, parking experience, transit access, and program preferences.</p></section>
              <div className="tab-strip">{BASELINE_TABS.map((tab) => <button key={tab} className={baselineTab === tab ? "active" : ""} onClick={() => setBaselineTab(tab)}>{tab}</button>)}</div>
              <section className="panel-card baseline-panel">
                <div className="panel-heading"><div><span className="section-kicker">{baselineTab.toUpperCase()}</span><h2>Demonstration baseline profile</h2></div><span className="demo-badge">Survey-reported + modeled example</span></div>
                <div className="baseline-grid">
                  <Metric label="Approximate origin zones" value="17" note="No individual homes displayed" />
                  <Metric label="Destination sites" value="5" note="Institution / campus / medical context" />
                  <Metric label="Typical arrival window" value="7:00–9:00 AM" note="Recurring weekday demand" />
                  <Metric label="Schedule flexibility" value="±15 min median" note="Demonstration data" />
                  <Metric label="Drive alone" value="71%" note="Survey-reported example" />
                  <Metric label="Parking difficulty" value="46% often/sometimes" note="Participant-reported example" />
                  <Metric label="Transit willingness" value="64%" note="Reported willingness" />
                  <Metric label="Access Point willingness" value="61%" note="Reported willingness" />
                  <Metric label="EV / hybrid" value="28%" note="Reported vehicle status" />
                  <Metric label="Charging interest" value="34%" note="Modeled / reported blend" />
                  <Metric label="Walking willingness" value="≤ 10 min common" note="Demonstration data" />
                  <Metric label="Privacy preference" value="Approximate zone first" note="Product default" />
                </div>
              </section>
            </>
          )}

          {view === "sites" && (
            <>
              <section className="page-intro"><span className="section-kicker">SITE MOBILITY READINESS</span><h2>Compare site conditions before allocating TDM resources.</h2><p>Scores are Relay Rider modeled readiness scores for demonstration only—not a validated scientific or regulatory standard.</p></section>
              <div className="site-grid">{SITES.map((site) => <article className="site-card" key={site.name}><div className="site-score"><strong>{site.score}</strong><span>Modeled readiness</span></div><h3>{site.name}</h3><div className="site-details"><Row label="Population" value={site.population} /><Row label="Parking pressure" value={site.parking} /><Row label="Transit access" value={site.transit} /><Row label="Pedestrian access" value={site.walk} /><Row label="Bicycle access" value={site.bike} /><Row label="EV charging" value={site.ev} /><Row label="Major origin corridors" value={site.corridors} /><Row label="Mode-shift opportunity" value={site.opportunity} /><Row label="Data confidence" value={site.confidence} /></div></article>)}</div>
            </>
          )}

          {view === "corridors" && (
            <>
              <section className="page-intro map-forward-intro"><div><span className="section-kicker">CORRIDOR INTELLIGENCE</span><h2>Find recurring demand, option coverage, and the reason demand remains unmatched.</h2><p>All origin geography is generalized. Planned-route and detour values below are modeled demonstration values.</p></div><button className="primary-admin-action" onClick={onOpenMap}>Open interactive corridor map</button></section>
              <div className="corridor-layout">
                <section className="panel-card corridor-selector"><span className="section-kicker">DEMONSTRATION CORRIDORS</span>{CORRIDORS.map((item) => <button key={item.id} className={corridorId === item.id ? "active" : ""} onClick={() => setCorridorId(item.id)}><strong>{item.name}</strong><span>{item.commuters} recurring signals</span></button>)}</section>
                <section className="panel-card corridor-detail"><div className="panel-heading"><div><span className="section-kicker">SELECTED CORRIDOR</span><h2>{corridor.name}</h2></div><span className="demo-badge">Modeled example</span></div><div className="baseline-grid"><Metric label="Recurring demand" value={`${corridor.commuters}`} note="Commute signals" /><Metric label="Peak" value={corridor.peak} note="Recurring window" /><Metric label="Drive-alone share" value={corridor.sov} note="Demonstration baseline" /><Metric label="Planned-route capacity" value={corridor.capacity} note="Modeled available capacity" /><Metric label="Transit alternatives" value={corridor.transit} note="Scheduled/static context" /><Metric label="Option coverage" value={corridor.coverage} note="Modeled" /><Metric label="Access Point coverage" value={corridor.access} note="Modeled" /><Metric label="Median estimated detour" value={corridor.detour} note="Modeled" /><Metric label="Parking difficulty" value={corridor.parking} note="Reported / modeled" /><Metric label="EV / hybrid" value={corridor.ev} note="Demonstration participation" /></div><div className="primary-gap"><small>PRIMARY GAP</small><strong>{corridor.gap}</strong><p>Relay Rider treats failed matching as a TDM signal that should create an administrative task, not a dead end for the commuter.</p></div></section>
              </div>
            </>
          )}

          {view === "options" && (
            <>
              <section className="page-intro"><span className="section-kicker">COMMUTE OPTIONS</span><h2>Compare interventions instead of forcing every commuter into one mode.</h2><p>These are simulated option previews for product evaluation. They are not guaranteed transportation.</p></section>
              <div className="option-admin-grid">
                <Option type="Planned Shared Route" time="31 min" fit="87% modeled compatibility" access="Glendale Transportation Center" benefit="+3 Green Route Credits" reason="Recurring planned-route window overlaps the commuter schedule, passes a reviewed Access Point candidate, and has low modeled detour." />
                <Option type="Metro / Rail + Bus" time="47 min" fit="Good schedule fit" access="A Line / local bus context" benefit="Transit benefit" reason="Scheduled transit serves the destination corridor and the commuter reported transit willingness." />
                <Option type="Transit + Access Point" time="43 min" fit="Strong first/last-mile fit" access="Allen Station" benefit="Institution-sponsored option" reason="The commuter accepts an Access Point and the station connects to the destination-area mobility network." />
                <Option type="Drive + Preferred Parking" time="27 min" fit="Fallback option" access="Site parking" benefit="Preferred parking if program rules allow" reason="The commute remains drive-based but can be managed as a parking-demand intervention rather than treated as unmeasured SOV travel." />
              </div>
              <section className="prototype-disclaimer-admin">This demonstration provides simulated commuter options for product evaluation. Options are not guaranteed transportation and may be subject to program eligibility, availability, and administrative review.</section>
            </>
          )}

          {view === "transit" && (
            <>
              <section className="page-intro"><span className="section-kicker">TRANSIT & LOCAL MOBILITY</span><h2>Make Metro, municipal transit, campus mobility, and first/last-mile choices first-class options.</h2><p>Times are scheduled/static demonstration values. No live arrival feed is represented in this prototype.</p></section>
              <section className="panel-card comparison-table"><div className="table-head transit-head"><span>Option</span><span>Time</span><span>Walk</span><span>Transfers</span><span>Program benefit</span></div>{[["Metro + Bus", "47 min", "8 min", "1", "Transit benefit"],["Planned Route", "31 min", "5 min", "0", "+3 Green Route Credits"],["Drive Alone", "26 min", "—", "—", "Parking pressure high"],["A Line + PCC shuttle context", "42 min", "6 min", "1", "Institution-sponsored option"]].map((row) => <div className="transit-row" key={row[0]}>{row.map((value) => <span key={value}>{value}</span>)}</div>)}</section>
              <div className="two-column-grid"><section className="panel-card"><span className="section-kicker">FIRST / LAST MILE</span><h2>Connection barriers</h2><div className="reason-bars"><Bar label="Walk distance" value="31%" width={31} /><Bar label="Transfer burden" value="24%" width={24} /><Bar label="Service timing" value="22%" width={22} /><Bar label="Access Point gap" value="14%" width={14} /></div></section><section className="panel-card"><span className="section-kicker">LOCAL MOBILITY CONTEXT</span><h2>Configured option families</h2><div className="tag-cloud"><span>LA Metro A Line</span><span>Metro bus</span><span>Municipal transit</span><span>Campus shuttle</span><span>Bike / micromobility</span><span>Walk</span><span>Flexible schedule</span></div></section></div>
            </>
          )}

          {view === "access" && (
            <>
              <section className="page-intro map-forward-intro"><div><span className="section-kicker">ACCESS POINT MANAGER</span><h2>Review public coordination locations before using them in governed commuter options.</h2><p>Status reflects demonstration workflow only. Relay Rider does not guarantee safety.</p></div><button className="primary-admin-action" onClick={onOpenMap}>View Access Points on map</button></section>
              <div className="access-table"><div className="access-head"><span>Name</span><span>Corridor</span><span>Transit</span><span>Accessibility</span><span>Permission</span><span>Status</span></div>{ACCESS_POINTS.map((point) => <div className="access-row" key={point.name}><span><strong>{point.name}</strong><small>Lighting: {point.lighting} · Visibility: {point.visibility}</small></span><span>{point.corridor}</span><span>{point.transit}</span><span>{point.accessibility}</span><span>{point.permission}</span><span className={`status-chip ${point.status.toLowerCase().replaceAll(" ", "-")}`}>{point.status}</span></div>)}</div>
            </>
          )}

          {view === "administration" && (
            <>
              <section className="page-intro"><span className="section-kicker">ADMINISTRATIVE REVIEW</span><h2>Govern participant eligibility and commuter-option previews before connection.</h2><p>Review actions change demonstration workflow state only. They do not confirm transportation.</p></section>
              <div className="review-grid">{REVIEWS.map((review) => { const status = reviewStates[review.id] ?? "Administrative review required"; return <article className="review-card" key={review.id}><div className="review-card-top"><div><small>COMMUTER OPTION</small><h3>{review.id}</h3></div><span>{status}</span></div><Row label="Corridor" value={review.corridor} /><Row label="Compatibility" value={review.compatibility} /><Row label="Estimated detour" value={review.detour} /><Row label="Access Point" value={review.access} /><Row label="Cohort" value={review.cohort} /><Row label="EV" value={review.ev} /><Row label="Contribution" value={review.contribution} /><Row label="Accessibility" value={review.accessibility} /><div className="review-actions"><button onClick={() => setReview(review.id, "Accepted for Review")}>Accept for Review</button><button onClick={() => setReview(review.id, "Needs Revision")}>Needs Revision</button><button onClick={() => setReview(review.id, "Waitlist")}>Waitlist</button><button onClick={() => setReview(review.id, "Not Eligible")}>Not Eligible</button><button onClick={() => setReview(review.id, "Escalated")}>Escalate</button></div></article>; })}</div>
            </>
          )}

          {view === "parking" && <ParkingView setView={setView} />}
          {view === "incentives" && <IncentivesView budget={creditBudget} setBudget={setCreditBudget} cap={creditCap} setCap={setCreditCap} />}
          {view === "programs" && <ProgramsView />}
          {view === "ev" && <EvView onOpenMap={onOpenMap} />}
          {view === "measurement" && <MeasurementView />}
          {view === "engagement" && <PrototypeModule title="Engagement" description="Campaigns, communications, cohort outreach, commute challenges, and participation messaging belong here. Priority 3 functionality is represented as a planning workspace rather than fake operational controls." items={["Corridor-targeted outreach", "New participant onboarding", "Transit / bike challenge", "Parking-pressure communications", "Program reminders"]} />}
          {view === "reports" && <PrototypeModule title="Reports" description="Report packaging is a Priority 3 prototype surface. Current metrics remain explicitly observed, survey-reported, estimated, modeled, or simulated." items={["Executive TDM summary", "Site comparison", "Parking-pressure report", "Corridor opportunity report", "Program participation export", "Rule 2202 readiness preview — not a filing"]} />}
          {view === "settings" && <PrototypeModule title="Settings" description="Production settings will require authenticated institution roles. This prototype shows the intended control domains without pretending permissions are live." items={["Institution profile", "Sites & cohorts", "Program contribution policy", "Privacy defaults", "Data retention", "Role-based permissions", "Transit / data-source configuration"]} />}
        </main>
      </section>
    </div>
  );
}

function Metric({ label, value, note }: { label: string; value: string; note: string }) {
  return <article className="baseline-metric"><small>{label}</small><strong>{value}</strong><span>{note}</span></article>;
}

function Row({ label, value }: { label: string; value: string }) {
  return <div className="detail-row"><span>{label}</span><strong>{value}</strong></div>;
}

function Option({ type, time, fit, access, benefit, reason }: { type: string; time: string; fit: string; access: string; benefit: string; reason: string }) {
  return <article className="admin-option-card"><div><span className="demo-badge">Simulated option</span><h3>{type}</h3><strong>{time}</strong></div><Row label="Schedule / compatibility" value={fit} /><Row label="Access Point / connection" value={access} /><Row label="Program benefit" value={benefit} /><div className="why-box"><small>WHY THIS OPTION APPEARED</small><p>{reason}</p></div></article>;
}

function Bar({ label, value, width }: { label: string; value: string; width: number }) {
  return <div className="reason-bar"><div><span>{label}</span><strong>{value}</strong></div><i><b style={{ width: `${width}%` }} /></i></div>;
}

function ParkingView({ setView }: { setView: (view: AdminView) => void }) {
  return <><section className="page-intro"><span className="section-kicker">PARKING PRESSURE</span><h2>Treat parking as a measurable institutional constraint, not an isolated facilities issue.</h2><p>Parking utilization = occupied spaces / available spaces. Values shown are modeled examples.</p></section><div className="institutional-kpi-grid parking-kpis"><Metric label="Total spaces" value="2,480" note="Demonstration supply" /><Metric label="Modeled peak occupancy" value="94%" note="Severe" /><Metric label="EV spaces" value="72" note="Demonstration data" /><Metric label="Carpool spaces" value="36" note="Demonstration data" /></div><div className="two-column-grid"><section className="panel-card"><span className="section-kicker">CORRIDOR CONTRIBUTION</span><h2>31% of modeled peak demand originates in three recurring corridors.</h2><p className="panel-copy">This makes corridor-targeted TDM interventions more actionable than broad, undifferentiated parking messaging.</p><button className="primary-admin-action inline" onClick={() => setView("corridors")}>Review contributing corridors</button></section><section className="panel-card"><span className="section-kicker">RECOMMENDED INTERVENTIONS</span><div className="intervention-list">{["Targeted corridor outreach", "Transit benefits", "Planned-route recruitment", "Preferred carpool parking", "Schedule flexibility", "Access Point improvements"].map((item) => <span key={item}>{item}</span>)}</div></section></div></>;
}

function IncentivesView({ budget, setBudget, cap, setCap }: { budget: string; setBudget: (value: string) => void; cap: string; setCap: (value: string) => void }) {
  return <><section className="page-intro"><span className="section-kicker">INCENTIVE PROGRAM MANAGER</span><h2>Configure capped institution-sponsored benefits around qualifying commute behavior.</h2><p>Green Route Credits are promotional or employer-sponsored participation benefits in this prototype—not wages, fares, cash earnings, certified offsets, or guaranteed benefits.</p></section><section className="panel-card incentive-config"><div className="panel-heading"><div><span className="section-kicker">PCC SUSTAINABLE COMMUTE PROGRAM · DEMO</span><h2>Green Route Credits scenario</h2></div><span className="demo-badge">Prototype configuration</span></div><div className="config-grid"><label><span>Program budget</span><input type="number" min="0" value={budget} onChange={(event) => setBudget(event.currentTarget.value)} /></label><label><span>Credits per qualifying choice</span><input type="number" min="0" max="20" value={cap} onChange={(event) => setCap(event.currentTarget.value)} /></label><label><span>Eligible cohort</span><select defaultValue="pcc"><option value="pcc">PCC student demonstration cohort</option><option value="employee">Employee cohort</option></select></label><label><span>Approval requirement</span><select defaultValue="admin"><option value="admin">Administrative approval</option><option value="auto-disabled">Automatic approval — not active</option></select></label></div><div className="incentive-preview"><small>COMMUTER PREVIEW</small><strong>You may qualify for {cap || "0"} Green Route Credits for choosing this commute option.</strong><span>No participant contribution required for this institution-sponsored demonstration program.</span></div></section></>;
}

function ProgramsView() {
  const programs = ["Transit Benefit", "Commute Incentive", "Bikeshare", "Flexible Work", "Carpool / Planned Route Coordination", "Preferred Parking", "First / Last Mile", "Access Point Program", "EV / Charging Program", "Communications Campaign"];
  return <><section className="page-intro"><span className="section-kicker">TDM STRATEGY CATALOG</span><h2>Manage commuter coordination as one intervention inside a broader mobility program.</h2><p>Program cards below are demonstration planning records, not claims of active institutional programs.</p></section><div className="program-grid">{programs.map((name, index) => <article key={name}><span className="status-chip">{index < 3 ? "Active · demo" : index < 7 ? "Under Review" : "Proposed"}</span><h3>{name}</h3><Row label="Owner" value={index % 2 ? "Mobility Program Manager" : "Sustainability / TDM"} /><Row label="Eligible site/cohort" value="Demonstration cohort" /><Row label="Participation" value={`${32 + index * 7} modeled`} /><Row label="Budget" value={index % 3 === 0 ? "$2,500 configured" : "Not configured"} /><Row label="Next action" value={index < 3 ? "Review observed results" : "Complete program review"} /></article>)}</div></>;
}

function EvView({ onOpenMap }: { onOpenMap: () => void }) {
  return <><section className="page-intro map-forward-intro"><div><span className="section-kicker">EV & CHARGING</span><h2>Keep clean-vehicle intelligence visible without making Relay Rider EV-only.</h2><p>Charging demand is modeled unless an actual charger data source is connected.</p></div><button className="primary-admin-action" onClick={onOpenMap}>View EV / charging context</button></section><div className="baseline-grid"><Metric label="EV / hybrid participants" value="28%" note="Demonstration data" /><Metric label="EV planned-route supply" value="19 routes" note="Modeled example" /><Metric label="Charging interest" value="34%" note="Reported / modeled" /><Metric label="Peak charging signal" value="9 AM–noon" note="Modeled demand window" /></div><section className="panel-card"><span className="section-kicker">CLEAN-VEHICLE CORRIDOR SIGNAL</span><h2>Glendale → Pasadena shows the strongest modeled EV/hybrid participation.</h2><p className="panel-copy">Use this as a site-planning and program-design signal. Do not interpret the prototype as certified emissions reduction, utility credit, LCFS credit, or direct charging reimbursement.</p></section></>;
}

function MeasurementView() {
  return <><section className="page-intro"><span className="section-kicker">MEASUREMENT & REPORTING</span><h2>Every KPI should expose source, period, coverage, confidence, and methodology.</h2><p>This prototype keeps observed, survey-reported, estimated, modeled, and simulated values visibly distinct.</p></section><div className="metric-dictionary"><div className="metric-head"><span>Metric</span><span>Source</span><span>Period</span><span>Coverage</span><span>Confidence</span><span>Methodology</span></div>{METRICS.map((row) => <div className="metric-row" key={row[0]}>{row.map((cell) => <span key={cell}>{cell}</span>)}</div>)}</div></>;
}

function PrototypeModule({ title, description, items }: { title: string; description: string; items: string[] }) {
  return <><section className="page-intro"><span className="section-kicker">PROTOTYPE MODULE</span><h2>{title}</h2><p>{description}</p></section><section className="panel-card"><span className="demo-badge">Planned / prototype functionality</span><div className="prototype-module-list">{items.map((item) => <div key={item}><strong>{item}</strong><span>Not presented as live functionality in this build.</span></div>)}</div></section></>;
}
