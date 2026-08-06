import { useMemo, useState } from "react";
import {
  BarChartIcon,
  CalendarIcon,
  CheckCircledIcon,
  ChevronRightIcon,
  DashboardIcon,
  ExclamationTriangleIcon,
  FileTextIcon,
  GlobeIcon,
  LightningBoltIcon,
  LockClosedIcon,
  PersonIcon,
  SewingPinIcon,
} from "@radix-ui/react-icons";
import { MobileScroll } from "./mobile";

type Tab = "home" | "commute" | "options" | "benefits" | "program";
type CommuteMode = "need" | "route";
type ReviewState = "Preview available" | "Administrative review" | "Approved for beta";
type LegalView = "privacy" | "terms" | null;

type CommuterOption = {
  id: string;
  label: string;
  route: string;
  window: string;
  accessPoint: string;
  compatibility: number;
  routeFit: number;
  detour: string;
  vehicle: string;
  capacity: string;
  review: ReviewState;
  reasons: string[];
};

const OPTIONS: CommuterOption[] = [
  {
    id: "option-01",
    label: "Option 01",
    route: "Glendale → Pasadena City College",
    window: "Arrive 8:05–8:25 AM",
    accessPoint: "Glendale Transportation Center",
    compatibility: 94,
    routeFit: 91,
    detour: "Estimated 4–6 min",
    vehicle: "Verified EV · demonstration profile",
    capacity: "1 seat indicated",
    review: "Administrative review",
    reasons: [
      "Recurring Tuesday and Thursday schedule overlaps",
      "Selected Access Point is compatible with both route profiles",
      "Estimated detour remains within the participant's stated limit",
      "Both participants belong to the PCC demonstration cohort",
    ],
  },
  {
    id: "option-02",
    label: "Option 02",
    route: "Eagle Rock → Pasadena City College",
    window: "Arrive 8:15–8:35 AM",
    accessPoint: "Eagle Rock Plaza public edge",
    compatibility: 87,
    routeFit: 84,
    detour: "Estimated 7–9 min",
    vehicle: "Hybrid · demonstration profile",
    capacity: "2 seats indicated",
    review: "Preview available",
    reasons: [
      "Origin zones are within the same institution-defined corridor",
      "Return schedule is compatible on one recurring day",
      "Access Point preference is shared",
      "Detour is near the participant's maximum and requires review",
    ],
  },
];

const BENEFITS = [
  { title: "Green Route Credit", value: "Up to 8 points", status: "Sponsor approval required" },
  { title: "Preferred Parking", value: "1 modeled day", status: "Program-rule review" },
  { title: "Mode-Shift Challenge", value: "1 of 2 commutes", status: "Demonstration progress" },
];

export default function Prototype() {
  const [tab, setTab] = useState<Tab>("home");
  const [commuteMode, setCommuteMode] = useState<CommuteMode>("need");
  const [selectedDays, setSelectedDays] = useState(["Tue", "Thu"]);
  const [selectedOption, setSelectedOption] = useState(OPTIONS[0]);
  const [interestSent, setInterestSent] = useState(false);
  const [legalView, setLegalView] = useState<LegalView>(null);
  const [consents, setConsents] = useState({ terms: true, privacy: true, program: true, research: false });

  const title = useMemo(
    () => ({ home: "Relay Rider", commute: "My Commute", options: "Commuter Options", benefits: "Program Benefits", program: "Program" })[tab],
    [tab],
  );

  function toggleDay(day: string) {
    setSelectedDays((current) => current.includes(day) ? current.filter((item) => item !== day) : [...current, day]);
  }

  function expressInterest() {
    setInterestSent(true);
  }

  if (legalView) {
    return (
      <div className="relay-shell">
        <MobileScroll className="app-screen relay-scroll">
          <main className="relay-content legal-screen">
            <button className="text-button back-button" onClick={() => setLegalView(null)}>← Back to program</button>
            {legalView === "privacy" ? <PrivacyPolicy /> : <TermsOfService />}
          </main>
        </MobileScroll>
      </div>
    );
  }

  return (
    <div className="relay-shell">
      <MobileScroll key={tab} className="app-screen relay-scroll">
        <main className="relay-content">
          <header className="page-heading">
            <div>
              <span className="kicker">PCC CONTROLLED BETA · DEMONSTRATION</span>
              <h1>{title}</h1>
            </div>
            <button className="profile-button" aria-label="Open participant profile"><PersonIcon /></button>
          </header>

          <section className="beta-notice">
            <LockClosedIcon />
            <div>
              <strong>Closed, institution-sponsored beta</strong>
              <p>Approved commuters are not charged. Transportation is not guaranteed, and every option remains subject to participant consent, capacity, program rules, and administrative review.</p>
            </div>
          </section>

          {tab === "home" && (
            <>
              <section className="hero-card">
                <small>EMPLOYER & CAMPUS MOBILITY PROGRAM</small>
                <h2>Coordinate the commute you already make.</h2>
                <p>Submit a commute need, register a planned route, and review explainable commuter-option previews.</p>
                <div className="hero-actions">
                  <button className="primary-action" onClick={() => { setCommuteMode("need"); setTab("commute"); }}>Submit commute need</button>
                  <button className="secondary-action" onClick={() => { setCommuteMode("route"); setTab("commute"); }}>Register planned route</button>
                </div>
              </section>

              <section className="status-card">
                <div className="status-icon"><CheckCircledIcon /></div>
                <div>
                  <small>PROGRAM STATUS</small>
                  <strong>PCC demonstration cohort</strong>
                  <p>Eligibility acknowledged · privacy controls active</p>
                </div>
                <span>Active</span>
              </section>

              <div className="section-title"><h2>Next actions</h2><button onClick={() => setTab("options")}>View all</button></div>
              <button className="action-row" onClick={() => setTab("options")}>
                <span className="icon-tile"><SewingPinIcon /></span>
                <div><strong>Review 2 commuter-option previews</strong><small>Simulated results · no reservation created</small></div>
                <ChevronRightIcon />
              </button>
              <button className="action-row" onClick={() => setTab("benefits")}>
                <span className="icon-tile yellow-tile"><LightningBoltIcon /></span>
                <div><strong>Review potential program benefits</strong><small>Institution funding and verification required</small></div>
                <ChevronRightIcon />
              </button>

              <div className="metric-grid">
                <article className="metric"><small>Demand</small><strong>19</strong><span>modeled signals</span></article>
                <article className="metric"><small>Supply</small><strong>12</strong><span>planned routes</span></article>
                <article className="metric"><small>Preview</small><strong>7</strong><span>compatible options</span></article>
                <article className="metric"><small>Estimate</small><strong>26.4</strong><span>potential shared miles</span></article>
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
                <p><strong>Privacy notice:</strong> Relay Rider uses approximate zones and commute windows to generate controlled-beta match previews. Exact home addresses are not shown during intake or preview.</p>
              </section>

              <section className="form-card">
                <div className="form-heading">
                  <span className="icon-tile"><CalendarIcon /></span>
                  <div>
                    <small>{commuteMode === "need" ? "COMMUTER NEED INTAKE" : "PLANNED ROUTE REGISTRATION"}</small>
                    <h2>{commuteMode === "need" ? "Recurring campus commute" : "Existing route availability"}</h2>
                  </div>
                </div>

                <Field label="Approximate origin zone" value={commuteMode === "need" ? "Glendale Central" : "Glendale / Brand corridor"} />
                <Field label="Destination" value="Pasadena City College" />
                <div className="field-block">
                  <small>Recurring days</small>
                  <div className="day-row">
                    {["Mon", "Tue", "Wed", "Thu", "Fri"].map((day) => (
                      <button key={day} className={selectedDays.includes(day) ? "selected" : ""} onClick={() => toggleDay(day)}>{day}</button>
                    ))}
                  </div>
                </div>
                <Field label="Morning window" value="7:45–8:30 AM" />
                <Field label="Return window" value="4:30–5:30 PM" />
                <Field label="Schedule flexibility" value="±15 minutes" />
                {commuteMode === "need" ? (
                  <>
                    <Field label="Current commute mode" value="Solo gasoline vehicle" />
                    <Field label="Parking difficulty" value="Often difficult" />
                    <Field label="Access Point willingness" value="Yes · up to 8 minutes walking" />
                    <Field label="EV/hybrid preference" value="Preferred, not required" />
                    <Field label="Accessibility preference" value="No request recorded" />
                  </>
                ) : (
                  <>
                    <Field label="Available capacity" value="1 seat" />
                    <Field label="Maximum detour" value="Up to 8 minutes" />
                    <Field label="Preferred Access Points" value="Glendale Transportation Center · Memorial Park" />
                    <Field label="Vehicle status" value="EV verification pending" />
                    <Field label="Existing-route confirmation" value="I already intend to make this trip" />
                  </>
                )}
                <Field label="Privacy setting" value="Approximate zones until approval" />
                <button className="primary-action" onClick={() => setTab("options")}>{commuteMode === "need" ? "Generate match previews" : "Register planned route"}</button>
                <p className="form-footnote">Demonstration only. Submitting this form does not purchase transportation, activate a route, or guarantee a commuter option.</p>
              </section>
            </>
          )}

          {tab === "options" && (
            <>
              <section className="prototype-disclaimer">
                <ExclamationTriangleIcon />
                <p><strong>Simulated commuter options.</strong> A preview is not a reservation or transportation purchase. Options do not guarantee acceptance or route operation and may require administrative review.</p>
              </section>

              <div className="section-title"><h2>Compatible previews</h2><span>2 modeled</span></div>
              <div className="option-list">
                {OPTIONS.map((option) => (
                  <button key={option.id} className={`option-card ${selectedOption.id === option.id ? "selected" : ""}`} onClick={() => { setSelectedOption(option); setInterestSent(false); }}>
                    <div className="option-top"><small>{option.label}</small><span>{option.review}</span></div>
                    <strong>{option.route}</strong>
                    <p>{option.window}</p>
                    <div className="option-metrics"><b>{option.compatibility}% compatibility</b><span>{option.detour}</span></div>
                  </button>
                ))}
              </div>

              <section className="detail-card">
                <div className="section-title"><h2>Why this option appeared</h2><span>Explainable</span></div>
                <div className="score-grid">
                  <Score label="Compatibility" value={selectedOption.compatibility} />
                  <Score label="Route fit" value={selectedOption.routeFit} />
                </div>
                <Field label="Estimated detour impact" value={selectedOption.detour} />
                <Field label="Access Point" value={selectedOption.accessPoint} />
                <Field label="Vehicle indicator" value={selectedOption.vehicle} />
                <Field label="Capacity signal" value={selectedOption.capacity} />
                <Field label="Administrative status" value={selectedOption.review} />
                <ul className="reason-list">{selectedOption.reasons.map((reason) => <li key={reason}>{reason}</li>)}</ul>
                <button className={`primary-action ${interestSent ? "success-action" : ""}`} onClick={expressInterest}>
                  {interestSent ? "Interest recorded · review pending" : "Express route interest"}
                </button>
                <p className="form-footnote">No fare is charged during the controlled beta. Both participants may decline, and an administrator may request changes before coordination.</p>
              </section>
            </>
          )}

          {tab === "benefits" && (
            <>
              <section className="benefit-summary">
                <LightningBoltIcon />
                <div><small>INSTITUTION-SPONSORED SCENARIO</small><strong>Potential participant benefits</strong><p>Benefits are promotional, capped, and subject to verification, budget availability, and program approval.</p></div>
              </section>
              <div className="benefit-list">
                {BENEFITS.map((benefit) => (
                  <article className="benefit-card" key={benefit.title}>
                    <div><small>{benefit.status}</small><strong>{benefit.title}</strong></div><span>{benefit.value}</span>
                  </article>
                ))}
              </div>
              <section className="legal-note">
                <LockClosedIcon />
                <p>Program benefits are not cash, wages, fares, guaranteed earnings, certified carbon credits, or guaranteed reimbursements. A sponsor must fund and approve any live benefit.</p>
              </section>
              <h2 className="standalone-title">Participation history</h2>
              <article className="history-card"><span>Tue</span><div><strong>Glendale → PCC</strong><small>Participant confirmation pending</small></div><b>Review</b></article>
              <article className="history-card"><span>Thu</span><div><strong>Eagle Rock → PCC</strong><small>Demonstration record</small></div><b>Modeled</b></article>
            </>
          )}

          {tab === "program" && (
            <>
              <section className="program-card">
                <small>PASADENA CITY COLLEGE</small>
                <h2>Controlled commuter beta</h2>
                <p>Closed participant network · planned routes · approximate zones · Access Points · administrative oversight</p>
              </section>

              <h2 className="standalone-title">Consent and privacy controls</h2>
              <ConsentRow label="Terms of Service" detail="Required for beta participation" checked={consents.terms} onToggle={() => setConsents({ ...consents, terms: !consents.terms })} />
              <ConsentRow label="Privacy Policy acknowledgment" detail="Required for beta participation" checked={consents.privacy} onToggle={() => setConsents({ ...consents, privacy: !consents.privacy })} />
              <ConsentRow label="PCC program rules" detail="Required for cohort participation" checked={consents.program} onToggle={() => setConsents({ ...consents, program: !consents.program })} />
              <ConsentRow label="Optional research participation" detail="May be withdrawn at any time" checked={consents.research} onToggle={() => setConsents({ ...consents, research: !consents.research })} />

              <h2 className="standalone-title">Legal and program information</h2>
              <button className="action-row" onClick={() => setLegalView("privacy")}><span className="icon-tile"><LockClosedIcon /></span><div><strong>Privacy Policy</strong><small>Location, schedule, institution, rights, and retention</small></div><ChevronRightIcon /></button>
              <button className="action-row" onClick={() => setLegalView("terms")}><span className="icon-tile yellow-tile"><FileTextIcon /></span><div><strong>Terms of Service</strong><small>Controlled-beta rules and participant responsibilities</small></div><ChevronRightIcon /></button>
              <button className="action-row"><span className="icon-tile"><GlobeIcon /></span><div><strong>Access or delete my information</strong><small>Prototype request workflow · administrator follow-up</small></div><ChevronRightIcon /></button>
              <button className="action-row"><span className="icon-tile peach-tile"><ExclamationTriangleIcon /></span><div><strong>Report an issue</strong><small>Safety, privacy, accessibility, or participant conduct</small></div><ChevronRightIcon /></button>

              <section className="admin-preview">
                <div className="section-title"><h2>Administrator preview</h2><span>Role restricted</span></div>
                <div className="metric-grid">
                  <article className="metric"><small>Needs</small><strong>19</strong><span>open signals</span></article>
                  <article className="metric"><small>Routes</small><strong>12</strong><span>registered</span></article>
                  <article className="metric"><small>Review</small><strong>5</strong><span>pending</span></article>
                  <article className="metric"><small>Access</small><strong>4</strong><span>points to review</span></article>
                </div>
                <p>Future role-based administration will include cohort rules, Access Point review, incentive caps, decision reasons, privacy boundaries, and exportable modeled reporting.</p>
              </section>
            </>
          )}
        </main>
      </MobileScroll>

      <nav className="bottom-nav" aria-label="Primary navigation">
        <button className={tab === "home" ? "active" : ""} onClick={() => setTab("home")} aria-label="Home"><DashboardIcon /><span>Home</span></button>
        <button className={tab === "commute" ? "active" : ""} onClick={() => setTab("commute")} aria-label="Commute"><CalendarIcon /><span>Commute</span></button>
        <button className={tab === "options" ? "active" : ""} onClick={() => setTab("options")} aria-label="Options"><SewingPinIcon /><span>Options</span></button>
        <button className={tab === "benefits" ? "active" : ""} onClick={() => setTab("benefits")} aria-label="Benefits"><LightningBoltIcon /><span>Benefits</span></button>
        <button className={tab === "program" ? "active" : ""} onClick={() => setTab("program")} aria-label="Program"><BarChartIcon /><span>Program</span></button>
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

function ConsentRow({ label, detail, checked, onToggle }: { label: string; detail: string; checked: boolean; onToggle: () => void }) {
  return <button className="consent-row" onClick={onToggle}><span className={checked ? "check active" : "check"}>{checked ? "✓" : ""}</span><div><strong>{label}</strong><small>{detail}</small></div></button>;
}

function PrivacyPolicy() {
  return (
    <article className="legal-copy">
      <span className="kicker">PLANNING DRAFT · COUNSEL REVIEW REQUIRED</span>
      <h1>Relay Rider Privacy Policy</h1>
      <p className="effective">Effective date: August 5, 2026</p>
      <p>Relay Rider is an institution-sponsored commuter coordination and Transportation Demand Management platform developed by Common Pathways Technologies. This policy describes the information used in the product prototype and a future controlled beta. It does not represent a live public transportation service.</p>
      <h2>Information we may collect</h2>
      <p>We may collect contact information, institution and cohort affiliation, approximate origin and destination zones, recurring commute days and time windows, schedule flexibility, current commute mode, parking difficulty, Access Point preferences, planned-route information, vehicle and EV/hybrid status, accessibility requests, privacy preferences, program participation records, benefit eligibility records, communications, support reports, and device or usage information.</p>
      <h2>How information is used</h2>
      <p>Information may be used to determine program eligibility, generate commuter-option previews, evaluate route and schedule compatibility, suggest Access Points, support administrative review, administer institution-sponsored benefits, provide support, investigate incidents, produce aggregated TDM reports, and improve the prototype or controlled beta.</p>
      <h2>Location privacy</h2>
      <p>Relay Rider uses approximate zones before precise locations. Exact home addresses should not be displayed during intake or match preview. More precise information should be disclosed only when needed for an approved coordination workflow and with appropriate consent.</p>
      <h2>Institutional sponsors and service providers</h2>
      <p>Information may be shared with the sponsoring institution, verification providers, hosting and communication providers, support vendors, legal or insurance advisors, and authorities when legally required. The exact data-controller relationship with each institution requires program-specific legal review.</p>
      <h2>No sale of commute-location information</h2>
      <p>Relay Rider does not intend to sell participant personal information or use commute-location information for cross-context behavioral advertising. This statement must remain consistent with the product's actual analytics and vendor configuration.</p>
      <h2>Retention</h2>
      <p>Relay Rider intends to retain information only as long as needed for the relevant program, legal obligations, accounting, safety, and dispute resolution. Final retention periods require counsel, insurance, and institutional review.</p>
      <h2>Your choices</h2>
      <p>Participants may request access, correction, deletion, portability where applicable, withdrawal from a program, communication-preference changes, research-consent withdrawal, or changes to location precision. Some records may need to be retained for legal, accounting, safety, or program-administration reasons.</p>
      <h2>Security</h2>
      <p>Relay Rider intends to use reasonable safeguards such as encryption in transit, role-based access, least-privilege permissions, logging, vendor review, and incident-response procedures. No system can guarantee absolute security.</p>
      <h2>Adults only</h2>
      <p>The current prototype and controlled-beta concept are intended for adult participants. A separate attorney-reviewed policy would be required before any program involving unaccompanied minors.</p>
      <h2>Contact</h2>
      <p>Privacy questions may be sent to relayridersupport@gmail.com. Mailing address and formal privacy-request process: [NEEDS FOUNDER INPUT].</p>
    </article>
  );
}

function TermsOfService() {
  return (
    <article className="legal-copy">
      <span className="kicker">PLANNING DRAFT · COUNSEL REVIEW REQUIRED</span>
      <h1>Relay Rider Terms of Service</h1>
      <p className="effective">Effective date: August 5, 2026</p>
      <h2>Product description</h2>
      <p>Relay Rider provides commuter intake, planned-route registration, compatibility previews, Access Point information, institution-sponsored program administration, and modeled TDM reporting. Relay Rider is not an on-demand ride-hailing, taxi, shuttle, instant-pickup, or guaranteed transportation service.</p>
      <h2>Eligibility</h2>
      <p>Current controlled-beta participation is limited to eligible adults in an approved institution or cohort. Participants must provide accurate information, comply with program-specific rules, and maintain only one account unless the program administrator authorizes otherwise.</p>
      <h2>No commuter charge during beta</h2>
      <p>Approved commuter participants are not charged by Relay Rider to participate in the current controlled beta. This policy does not guarantee that a commuter option will be available or operate. Relay Rider will provide notice and obtain any required agreement before introducing a future fee, contribution, or purchase workflow.</p>
      <h2>Commuter-option limitations</h2>
      <p>A commuter option is a compatibility preview, not a reservation or purchase. Scores, detours, arrival windows, capacity, Access Point suitability, and modeled outcomes are estimates. Participation requires mutual consent and may require administrative review. Either participant may decline before confirmation.</p>
      <h2>Planned routes</h2>
      <p>A participant registering a route confirms that the trip is already planned. Relay Rider does not dispatch participants to create trips on demand. Route participants may accept or decline compatible interest and must comply with program rules, verification requirements, and Access Point procedures.</p>
      <h2>Institution-sponsored benefits</h2>
      <p>A sponsoring institution may offer capped promotional benefits under separate program rules. Eligibility may depend on verification, participation, budget availability, program limits, and administrative approval. Benefits are not wages, fares, guaranteed earnings, certified carbon credits, or guaranteed reimbursements.</p>
      <h2>Access Points</h2>
      <p>Access Points may be proposed, reviewed, designated, or institutionally approved. Relay Rider does not guarantee the safety, availability, accessibility, lighting, or suitability of any location. Participants must follow site rules and may not enter restricted property without authorization.</p>
      <h2>Participant conduct</h2>
      <p>Participants may not harass, discriminate, threaten, operate while impaired, provide false information, arrange unauthorized payments, reveal another participant's personal information, circumvent program controls, or use Relay Rider for unauthorized commercial activity.</p>
      <h2>Accessibility and nondiscrimination</h2>
      <p>Relay Rider intends to provide an accessibility-request pathway and maintain a nondiscrimination policy. The prototype does not promise that every vehicle or route is accessible. Program administrators must review unresolved accommodation requests before coordination.</p>
      <h2>Incidents and emergencies</h2>
      <p>Call emergency services first in an emergency. Relay Rider is not an emergency-response service. Participants should report safety, privacy, accessibility, conduct, or property incidents through the applicable program channel.</p>
      <h2>Suspension and termination</h2>
      <p>Relay Rider or a sponsoring institution may suspend a participant, pause a route, remove a preview, preserve records, or revoke eligibility when needed to enforce program rules, investigate an incident, protect participants, or comply with law.</p>
      <h2>Legal provisions requiring counsel</h2>
      <p>Warranty disclaimer, limitation of liability, indemnification, dispute resolution, governing law, arbitration, and class-action waiver provisions remain [NEEDS COUNSEL INPUT] and should not be treated as final.</p>
      <h2>Contact</h2>
      <p>Questions may be sent to relayridersupport@gmail.com.</p>
    </article>
  );
}
