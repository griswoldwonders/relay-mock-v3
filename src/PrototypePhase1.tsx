import { useMemo, useState } from "react";
import {
  BarChartIcon,
  CalendarIcon,
  CheckCircledIcon,
  ChevronRightIcon,
  DashboardIcon,
  ExclamationTriangleIcon,
  GlobeIcon,
  LightningBoltIcon,
  LockClosedIcon,
  PersonIcon,
  SewingPinIcon,
} from "@radix-ui/react-icons";
import { MobileScroll } from "./mobile";
import "./phase1.css";

type Tab = "home" | "commute" | "options" | "trust" | "program";
type CommuteMode = "need" | "route";
type ReviewStatus = "Preview available" | "Administrative review" | "Eligible to connect";

type Segment = {
  mode: "Walk" | "Planned route" | "Transit" | "Bike / micromobility";
  time: string;
  detail: string;
};

type CommuterOption = {
  id: string;
  label: string;
  route: string;
  window: string;
  accessPoint: string;
  compatibility: number;
  routeFit: number;
  scheduleFit: number;
  multimodalFit: number;
  trustReadiness: string;
  detour: string;
  vehicle: string;
  review: ReviewStatus;
  incentive: string;
  contribution: string;
  totalTime: string;
  segments: Segment[];
  reasons: string[];
};

const OPTIONS: CommuterOption[] = [
  {
    id: "option-01",
    label: "Option 01",
    route: "Glendale → PCC via Memorial Park",
    window: "Arrive 8:08–8:24 AM",
    accessPoint: "Glendale Transportation Center",
    compatibility: 94,
    routeFit: 91,
    scheduleFit: 96,
    multimodalFit: 89,
    trustReadiness: "Verification review complete for demo",
    detour: "Estimated 4–6 min",
    vehicle: "EV · demonstration verification badge",
    review: "Administrative review",
    incentive: "Potential 4-point Green Route Credit",
    contribution: "Proposed contribution compatible · no purchase created",
    totalTime: "43–49 min estimated",
    segments: [
      { mode: "Walk", time: "7:22 AM", detail: "6 min to Glendale Transportation Center Access Point" },
      { mode: "Planned route", time: "7:30 AM", detail: "Compatible existing route to Memorial Park" },
      { mode: "Transit", time: "7:52 AM", detail: "Metro A Line connection toward Allen" },
      { mode: "Walk", time: "8:08 AM", detail: "Final 5 min to campus edge" },
    ],
    reasons: [
      "Recurring Tuesday and Thursday schedule overlaps within the selected flexibility window.",
      "The planned route shares most of the requested corridor and remains within the stated detour limit.",
      "The selected Access Point connects cleanly to the A Line and avoids exact-home location disclosure.",
      "Both demonstration profiles are in the PCC cohort and meet the current program-rule preview criteria.",
    ],
  },
  {
    id: "option-02",
    label: "Option 02",
    route: "Eagle Rock → PCC with Access Point transfer",
    window: "Arrive 8:16–8:34 AM",
    accessPoint: "Eagle Rock Plaza public edge",
    compatibility: 87,
    routeFit: 84,
    scheduleFit: 90,
    multimodalFit: 82,
    trustReadiness: "One verification item pending",
    detour: "Estimated 7–9 min",
    vehicle: "Hybrid · demonstration profile",
    review: "Preview available",
    incentive: "No incentive modeled yet",
    contribution: "Contribution gap estimated · administrator may review support",
    totalTime: "48–56 min estimated",
    segments: [
      { mode: "Walk", time: "7:20 AM", detail: "8 min to Eagle Rock Plaza Access Point" },
      { mode: "Planned route", time: "7:30 AM", detail: "Existing route toward Old Pasadena" },
      { mode: "Transit", time: "8:00 AM", detail: "A Line connection from Memorial Park" },
      { mode: "Walk", time: "8:16 AM", detail: "Campus-edge walk" },
    ],
    reasons: [
      "Origin zones are within the same institution-defined corridor.",
      "One recurring day fits the requested return schedule.",
      "Access Point preference is shared, but the detour is near the participant maximum.",
      "The preview remains available while an administrator reviews the pending verification item.",
    ],
  },
];

const VERIFICATION = [
  { label: "Identity", status: "Verified for demonstration", tone: "good" },
  { label: "Institution eligibility", status: "PCC cohort confirmed", tone: "good" },
  { label: "Phone & email", status: "Verified for demonstration", tone: "good" },
  { label: "Vehicle / route documents", status: "Not required for commuter profile", tone: "neutral" },
  { label: "Privacy settings", status: "Approximate zones enabled", tone: "good" },
];

const REVIEW_QUEUE = [
  { id: "RR-1042", type: "Commuter option", subject: "Glendale → PCC", reason: "Contribution + incentive eligibility", risk: "Standard", status: "Pending" },
  { id: "RR-1038", type: "Verification", subject: "Planned-route participant", reason: "Vehicle document review", risk: "Standard", status: "Needs info" },
  { id: "RR-1034", type: "Access Point", subject: "Eagle Rock Plaza edge", reason: "Visibility + site suitability review", risk: "Elevated", status: "Pending" },
  { id: "RR-1029", type: "Accessibility", subject: "PCC morning cohort", reason: "Step-free path request", risk: "Priority", status: "Admin review" },
];

const BENEFITS = [
  { title: "Green Route Credit", value: "4 points modeled", rule: "Eligible corridor + admin approval + funded pool" },
  { title: "Preferred Parking", value: "Potential eligibility", rule: "Institution program rule required" },
  { title: "Transit Connection Benefit", value: "Scenario only", rule: "Sponsor funding and participant eligibility required" },
];

export default function PrototypePhase1() {
  const [tab, setTab] = useState<Tab>("home");
  const [commuteMode, setCommuteMode] = useState<CommuteMode>("need");
  const [selectedDays, setSelectedDays] = useState(["Tue", "Thu"]);
  const [selectedOption, setSelectedOption] = useState(OPTIONS[0]);
  const [interestSent, setInterestSent] = useState(false);
  const [messageState, setMessageState] = useState<"locked" | "requested">("locked");
  const [reported, setReported] = useState(false);

  const title = useMemo(() => ({
    home: "Relay Rider",
    commute: "My Commute",
    options: "Commuter Options",
    trust: "Trust Center",
    program: "Program Console",
  })[tab], [tab]);

  function toggleDay(day: string) {
    setSelectedDays((current) => current.includes(day) ? current.filter((item) => item !== day) : [...current, day]);
  }

  return (
    <div className="relay-shell phase1-shell">
      <MobileScroll key={tab} className="app-screen relay-scroll">
        <main className="relay-content">
          <header className="page-heading">
            <div>
              <span className="kicker">PCC CONTROLLED BETA · PRODUCT PROTOTYPE</span>
              <h1>{title}</h1>
            </div>
            <button className="profile-button" aria-label="Open Trust Center" onClick={() => setTab("trust")}><PersonIcon /></button>
          </header>

          <section className="beta-notice">
            <LockClosedIcon />
            <div>
              <strong>Closed, institution-sponsored demonstration</strong>
              <p>Transportation is not guaranteed. Commuter options, verification states, benefits, messaging, and reviews shown here are prototype workflows subject to program rules and administrative review.</p>
            </div>
          </section>

          {tab === "home" && (
            <>
              <section className="hero-card">
                <small>GOVERNED COMMUTER PROGRAM</small>
                <h2>Coordinate planned commutes with more confidence.</h2>
                <p>Relay Rider combines corridor intelligence, explainable commuter-option previews, designated Access Points, trust controls, multimodal connections, and institution-funded benefit scenarios.</p>
                <div className="hero-actions">
                  <button className="primary-action" onClick={() => { setCommuteMode("need"); setTab("commute"); }}>Submit commute need</button>
                  <button className="secondary-action" onClick={() => { setCommuteMode("route"); setTab("commute"); }}>Register planned route</button>
                </div>
              </section>

              <section className="status-card">
                <div className="status-icon"><CheckCircledIcon /></div>
                <div>
                  <small>TRUST READINESS</small>
                  <strong>4 of 4 participant checks ready for this demo</strong>
                  <p>Approximate zones · cohort eligibility · contact verification · privacy controls</p>
                </div>
                <span>Ready</span>
              </section>

              <div className="section-title"><h2>Program actions</h2><button onClick={() => setTab("program")}>Admin view</button></div>
              <button className="action-row" onClick={() => setTab("options")}>
                <span className="icon-tile"><SewingPinIcon /></span>
                <div><strong>Review multimodal commuter options</strong><small>Planned route + transit + walking · explainable preview</small></div><ChevronRightIcon />
              </button>
              <button className="action-row" onClick={() => setTab("trust")}>
                <span className="icon-tile green-tile"><LockClosedIcon /></span>
                <div><strong>Open Trust Center</strong><small>Verification · privacy · messaging · reporting</small></div><ChevronRightIcon />
              </button>
              <button className="action-row" onClick={() => setTab("program")}>
                <span className="icon-tile yellow-tile"><LightningBoltIcon /></span>
                <div><strong>Review incentive scenarios</strong><small>Institution-funded · capped · administrative approval required</small></div><ChevronRightIcon />
              </button>

              <div className="metric-grid">
                <article className="metric"><small>Demand</small><strong>19</strong><span>modeled signals</span></article>
                <article className="metric"><small>Planned routes</small><strong>12</strong><span>registered</span></article>
                <article className="metric"><small>Multimodal</small><strong>7</strong><span>compatible previews</span></article>
                <article className="metric"><small>Admin review</small><strong>5</strong><span>pending items</span></article>
              </div>
            </>
          )}

          {tab === "commute" && (
            <>
              <div className="segmented-control" role="tablist" aria-label="Commute workflow">
                <button className={commuteMode === "need" ? "active" : ""} onClick={() => setCommuteMode("need")}>I need an option</button>
                <button className={commuteMode === "route" ? "active" : ""} onClick={() => setCommuteMode("route")}>I already travel this route</button>
              </div>

              <section className="notice-at-collection">
                <LockClosedIcon />
                <p><strong>Privacy by default:</strong> use approximate zones and commute windows during intake and preview. Exact private locations are not required to generate these demonstration options.</p>
              </section>

              <section className="form-card">
                <div className="form-heading">
                  <span className="icon-tile"><CalendarIcon /></span>
                  <div><small>{commuteMode === "need" ? "COMMUTER NEED INTAKE" : "PLANNED ROUTE REGISTRATION"}</small><h2>{commuteMode === "need" ? "Recurring campus commute" : "Existing route availability"}</h2></div>
                </div>
                <Field label="Approximate origin zone" value={commuteMode === "need" ? "Glendale Central" : "Glendale / Brand corridor"} />
                <Field label="Destination" value="Pasadena City College" />
                <div className="field-block"><small>Recurring days</small><div className="day-row">{["Mon", "Tue", "Wed", "Thu", "Fri"].map((day) => <button key={day} className={selectedDays.includes(day) ? "selected" : ""} onClick={() => toggleDay(day)}>{day}</button>)}</div></div>
                <Field label="Morning window" value="7:45–8:30 AM" />
                <Field label="Schedule flexibility" value="±15 minutes" />
                {commuteMode === "need" ? (
                  <>
                    <Field label="Maximum total travel time" value="60 minutes" />
                    <Field label="Maximum walk" value="10 minutes per segment" />
                    <Field label="Transit preference" value="A Line connection acceptable" />
                    <Field label="Micromobility willingness" value="Optional" />
                    <Field label="Parking difficulty" value="Often difficult" />
                    <Field label="Access Point willingness" value="Yes · public locations preferred" />
                    <Field label="EV/hybrid preference" value="Preferred, not required" />
                    <Field label="Accessibility preference" value="No request recorded" />
                  </>
                ) : (
                  <>
                    <Field label="Available capacity" value="1 seat" />
                    <Field label="Maximum detour" value="Up to 8 minutes" />
                    <Field label="Preferred Access Points" value="Glendale Transportation Center · Memorial Park" />
                    <Field label="EV/hybrid status" value="EV verification pending" />
                    <Field label="Existing-route confirmation" value="I already intend to make this trip" />
                    <Field label="Verification willingness" value="Yes · document review required before beta" />
                  </>
                )}
                <Field label="Privacy setting" value="Approximate zones until approved workflow" />
                <button className="primary-action" onClick={() => setTab("options")}>{commuteMode === "need" ? "Generate commuter-option previews" : "Register planned route"}</button>
                <p className="form-footnote">Prototype only. Submission does not purchase transportation, activate a route, guarantee acceptance, or trigger an automatic payment.</p>
              </section>
            </>
          )}

          {tab === "options" && (
            <>
              <section className="prototype-disclaimer"><ExclamationTriangleIcon /><p><strong>Simulated commuter options.</strong> These previews combine planned-route, Access Point, walking, and public-transit segments. They are not reservations and remain subject to participant consent and administrative review.</p></section>
              <div className="section-title"><h2>Compatible previews</h2><span>2 modeled</span></div>
              <div className="option-list">
                {OPTIONS.map((option) => (
                  <button key={option.id} className={`option-card ${selectedOption.id === option.id ? "selected" : ""}`} onClick={() => { setSelectedOption(option); setInterestSent(false); setMessageState("locked"); }}>
                    <div className="option-top"><small>{option.label}</small><span>{option.review}</span></div>
                    <strong>{option.route}</strong><p>{option.window} · {option.totalTime}</p>
                    <div className="option-metrics"><b>{option.compatibility}% compatibility</b><span>{option.detour}</span></div>
                  </button>
                ))}
              </div>

              <section className="detail-card">
                <div className="section-title"><h2>Why this option appeared</h2><span>Explainable</span></div>
                <div className="score-grid"><Score label="Compatibility" value={selectedOption.compatibility} /><Score label="Route fit" value={selectedOption.routeFit} /><Score label="Schedule fit" value={selectedOption.scheduleFit} /><Score label="Multimodal fit" value={selectedOption.multimodalFit} /></div>
                <div className="badge-row"><span className="status-pill good">Trust: {selectedOption.trustReadiness}</span><span className="status-pill">{selectedOption.review}</span></div>
                <h3 className="mini-heading">Multimodal itinerary</h3>
                <div className="itinerary">{selectedOption.segments.map((segment, index) => <div className="itinerary-row" key={`${segment.mode}-${index}`}><span>{index + 1}</span><div><small>{segment.time} · {segment.mode}</small><strong>{segment.detail}</strong></div></div>)}</div>
                <Field label="Estimated detour impact" value={selectedOption.detour} />
                <Field label="Designated Access Point" value={selectedOption.accessPoint} />
                <Field label="Vehicle indicator" value={selectedOption.vehicle} />
                <Field label="Contribution compatibility" value={selectedOption.contribution} />
                <Field label="Potential benefit" value={selectedOption.incentive} />
                <ul className="reason-list">{selectedOption.reasons.map((reason) => <li key={reason}>{reason}</li>)}</ul>
                <button className={`primary-action ${interestSent ? "success-action" : ""}`} onClick={() => setInterestSent(true)}>{interestSent ? "Interest recorded · administrative review pending" : "Express route interest"}</button>
                <p className="form-footnote">A proposed contribution is not a confirmed fare or transportation purchase. Incentive eligibility is modeled and requires funding, rule checks, and administrative approval.</p>
              </section>
            </>
          )}

          {tab === "trust" && (
            <>
              <section className="trust-hero"><LockClosedIcon /><div><small>PARTICIPANT TRUST CENTER</small><strong>Confidence through visible controls</strong><p>Verification, privacy, reporting, and communication permissions are separated from route-fit scoring so participants can understand what has and has not been reviewed.</p></div></section>
              <div className="section-title"><h2>Verification status</h2><span>Prototype states</span></div>
              <div className="verification-list">{VERIFICATION.map((item) => <article className="verification-row" key={item.label}><span className={`dot ${item.tone}`} /><div><strong>{item.label}</strong><small>{item.status}</small></div><CheckCircledIcon /></article>)}</div>

              <h2 className="standalone-title trust-section-title">Privacy controls</h2>
              <ToggleRow title="Approximate zones" detail="Hide exact private addresses during intake and preview" enabled />
              <ToggleRow title="Masked contact details" detail="Do not expose phone or email before eligible-to-connect state" enabled />
              <ToggleRow title="Trusted-contact sharing" detail="Future controlled-beta workflow · not active in this prototype" enabled={false} />

              <h2 className="standalone-title trust-section-title">Governed messaging</h2>
              <section className="message-card">
                <div><span className="status-pill locked"><LockClosedIcon /> Connection locked</span><h3>Messaging opens after eligibility and review.</h3><p>No phone number, email, exact address, payment request, or unrestricted file sharing is required for the match-preview stage.</p></div>
                <button className="secondary-action" onClick={() => setMessageState("requested")}>{messageState === "requested" ? "Connection request recorded" : "Request connection review"}</button>
              </section>

              <h2 className="standalone-title trust-section-title">Reliability feedback</h2>
              <div className="feedback-grid"><Feedback label="On-time window" value="Demo: positive" /><Feedback label="Clear communication" value="Demo: positive" /><Feedback label="Access Point compliance" value="No issue recorded" /><Feedback label="Privacy respect" value="No issue recorded" /></div>
              <p className="form-footnote">Behavior-specific feedback is shown instead of an unrestricted public safety score. Relay Rider does not guarantee participant safety.</p>

              <button className={`action-row report-row ${reported ? "reported" : ""}`} onClick={() => setReported(true)}><span className="icon-tile peach-tile"><ExclamationTriangleIcon /></span><div><strong>{reported ? "Issue report opened · demonstration" : "Report an issue"}</strong><small>Safety · privacy · accessibility · participant conduct</small></div><ChevronRightIcon /></button>
            </>
          )}

          {tab === "program" && (
            <>
              <section className="program-card"><small>PASADENA CITY COLLEGE</small><h2>Institutional program console</h2><p>Prototype administrator view for trust, commuter-option review, Access Points, incentive scenarios, and measurable TDM outcomes.</p></section>

              <div className="metric-grid">
                <article className="metric"><small>Verification</small><strong>84%</strong><span>modeled completion</span></article>
                <article className="metric"><small>Multimodal</small><strong>58%</strong><span>previews include transit</span></article>
                <article className="metric"><small>Access Point</small><strong>73%</strong><span>modeled preference</span></article>
                <article className="metric"><small>Review SLA</small><strong>1.4d</strong><span>scenario average</span></article>
              </div>

              <h2 className="standalone-title admin-title">Administrative review queue</h2>
              <div className="review-list">{REVIEW_QUEUE.map((item) => <article className="review-card" key={item.id}><div className="review-card-top"><span>{item.id}</span><b className={`risk ${item.risk.toLowerCase().replace(" ", "-")}`}>{item.risk}</b></div><strong>{item.type} · {item.subject}</strong><p>{item.reason}</p><div className="review-actions"><button>Review details</button><span>{item.status}</span></div></article>)}</div>

              <h2 className="standalone-title admin-title">Incentive strategy</h2>
              <div className="benefit-list">{BENEFITS.map((benefit) => <article className="benefit-card" key={benefit.title}><div><small>{benefit.rule}</small><strong>{benefit.title}</strong></div><span>{benefit.value}</span></article>)}</div>
              <section className="incentive-rule"><LightningBoltIcon /><div><strong>Modeled rule example</strong><p>If Pasadena–Glendale morning parking pressure exceeds the scenario threshold and a commuter option meets program eligibility, show an estimated 4-point employer-sponsored Green Route Credit, subject to budget and administrative approval.</p></div></section>

              <h2 className="standalone-title admin-title">Program safeguards</h2>
              <button className="action-row"><span className="icon-tile"><GlobeIcon /></span><div><strong>Access Point review</strong><small>Visibility · accessibility · route compatibility · institutional suitability</small></div><ChevronRightIcon /></button>
              <button className="action-row"><span className="icon-tile green-tile"><LockClosedIcon /></span><div><strong>Data & privacy controls</strong><small>Approximate zones · role permissions · retention · deletion requests</small></div><ChevronRightIcon /></button>
              <section className="legal-note"><LockClosedIcon /><p>Green Route Credits and other benefits are promotional or employer-sponsored program benefits. They are not cash, wages, fares, guaranteed earnings, certified offsets, or guaranteed reimbursements.</p></section>
            </>
          )}
        </main>
      </MobileScroll>

      <nav className="bottom-nav" aria-label="Primary navigation">
        <button className={tab === "home" ? "active" : ""} onClick={() => setTab("home")}><DashboardIcon /><span>Home</span></button>
        <button className={tab === "commute" ? "active" : ""} onClick={() => setTab("commute")}><CalendarIcon /><span>Commute</span></button>
        <button className={tab === "options" ? "active" : ""} onClick={() => setTab("options")}><SewingPinIcon /><span>Options</span></button>
        <button className={tab === "trust" ? "active" : ""} onClick={() => setTab("trust")}><LockClosedIcon /><span>Trust</span></button>
        <button className={tab === "program" ? "active" : ""} onClick={() => setTab("program")}><BarChartIcon /><span>Program</span></button>
      </nav>
    </div>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return <div className="field-row"><small>{label}</small><strong>{value}</strong><ChevronRightIcon /></div>;
}

function Score({ label, value }: { label: string; value: number }) {
  return <div className="score-card"><small>{label}</small><strong>{value}</strong><div><i style={{ width: `${value}%` }} /></div></div>;
}

function ToggleRow({ title, detail, enabled }: { title: string; detail: string; enabled: boolean }) {
  return <article className="toggle-row"><div><strong>{title}</strong><small>{detail}</small></div><span className={`switch ${enabled ? "on" : ""}`}><i /></span></article>;
}

function Feedback({ label, value }: { label: string; value: string }) {
  return <article className="feedback-card"><small>{label}</small><strong>{value}</strong></article>;
}
