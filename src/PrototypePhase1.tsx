import { useMemo, useState, type ReactNode } from "react";
import {
  BarChartIcon,
  CalendarIcon,
  ChevronRightIcon,
  DashboardIcon,
  ExclamationTriangleIcon,
  LockClosedIcon,
  PersonIcon,
  SewingPinIcon,
} from "@radix-ui/react-icons";
import { KeyboardInput, MobileScroll, useKeyboard } from "./mobile";
import "./phase1.css";

type Tab = "home" | "commute" | "options" | "trust" | "program";
type CommuteMode = "need" | "route";

type CommuteForm = {
  originZone: string;
  destination: string;
  morningWindow: string;
  flexibility: string;
  accessPointPreference: string;
  transitPreference: string;
  evPreference: string;
  accessibilityNeeds: string;
  parkingDifficulty: string;
  capacity: string;
  maxDetour: string;
  plannedRouteNote: string;
};

type PrototypeSubmission = {
  mode: CommuteMode;
  days: string[];
  form: CommuteForm;
};

const EMPTY_FORM: CommuteForm = {
  originZone: "",
  destination: "",
  morningWindow: "",
  flexibility: "",
  accessPointPreference: "",
  transitPreference: "",
  evPreference: "",
  accessibilityNeeds: "",
  parkingDifficulty: "",
  capacity: "",
  maxDetour: "",
  plannedRouteNote: "",
};

const VERIFICATION_ITEMS = [
  { label: "Identity", status: "Not connected in this prototype" },
  { label: "Institution eligibility", status: "Not verified" },
  { label: "Phone & email", status: "Not verified" },
  { label: "Vehicle / route documents", status: "Nothing submitted" },
];

export default function PrototypePhase1() {
  const keyboard = useKeyboard();
  const [tab, setTab] = useState<Tab>("home");
  const [commuteMode, setCommuteMode] = useState<CommuteMode>("need");
  const [selectedDays, setSelectedDays] = useState<string[]>([]);
  const [form, setForm] = useState<CommuteForm>(EMPTY_FORM);
  const [submission, setSubmission] = useState<PrototypeSubmission | null>(null);
  const [approximateZones, setApproximateZones] = useState(true);
  const [maskedContact, setMaskedContact] = useState(true);

  const title = useMemo(() => ({
    home: "Relay Rider",
    commute: "My Commute",
    options: "Commuter Options",
    trust: "Trust Center",
    program: "My Program",
  })[tab], [tab]);

  const canSubmit = Boolean(
    form.originZone.trim() &&
    form.destination.trim() &&
    form.morningWindow.trim() &&
    selectedDays.length > 0,
  );

  function toggleDay(day: string) {
    setSelectedDays((current) => current.includes(day)
      ? current.filter((item) => item !== day)
      : [...current, day]);
  }

  function updateField(key: keyof CommuteForm, value: string) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  function submitCommute() {
    if (!canSubmit) return;
    keyboard.hide();
    setSubmission({
      mode: commuteMode,
      days: [...selectedDays],
      form: { ...form },
    });
    setTab("options");
  }

  function resetPrototypeSession() {
    keyboard.hide();
    setCommuteMode("need");
    setSelectedDays([]);
    setForm(EMPTY_FORM);
    setSubmission(null);
    setApproximateZones(true);
    setMaskedContact(true);
    setTab("home");
  }

  return (
    <div className="relay-shell phase1-shell">
      <MobileScroll key={tab} className="app-screen relay-scroll">
        <main className="relay-content">
          <header className="page-heading">
            <div>
              <span className="kicker">PCC-FOCUSED RESEARCH PROTOTYPE</span>
              <h1>{title}</h1>
            </div>
            <button className="profile-button" aria-label="Open Trust Center" onClick={() => setTab("trust")}><PersonIcon /></button>
          </header>

          <section className="beta-notice">
            <LockClosedIcon />
            <div>
              <strong>User-testing environment</strong>
              <p>This prototype does not provide live transportation, confirmed commuter matches, payments, guaranteed incentives, or verified participant connections. Information entered here remains in this browser session only.</p>
            </div>
          </section>

          {tab === "home" && (
            <>
              <section className="hero-card">
                <small>COMMUTER COORDINATION PROTOTYPE</small>
                <h2>Start with your actual commute pattern.</h2>
                <p>Share approximate zones, recurring days, schedule windows, Access Point preferences, and multimodal preferences. Relay Rider can use those signals to prepare governed commuter-option previews once real participant and matching data are connected.</p>
                <div className="hero-actions">
                  <button className="primary-action" onClick={() => { setCommuteMode("need"); setTab("commute"); }}>Set up my commute</button>
                  <button className="secondary-action" onClick={() => { setCommuteMode("route"); setTab("commute"); }}>Register a planned route</button>
                </div>
              </section>

              <section className="status-card">
                <div className="status-icon">{submission ? <CalendarIcon /> : <PersonIcon />}</div>
                <div>
                  <small>PROTOTYPE SESSION</small>
                  <strong>{submission ? "Commute signal saved" : "No commute profile yet"}</strong>
                  <p>{submission
                    ? `${submission.form.originZone} → ${submission.form.destination} · ${submission.days.join(", ")}`
                    : "Enter your own commute information to begin testing the participant flow."}</p>
                </div>
                <span>{submission ? "Saved" : "Start"}</span>
              </section>

              <div className="section-title"><h2>What you can test</h2></div>
              <button className="action-row" onClick={() => setTab("commute")}>
                <span className="icon-tile"><CalendarIcon /></span>
                <div><strong>Commute intake</strong><small>Approximate zones · schedule · Access Point preferences</small></div><ChevronRightIcon />
              </button>
              <button className="action-row" onClick={() => setTab("options")}>
                <span className="icon-tile"><SewingPinIcon /></span>
                <div><strong>Commuter-option state</strong><small>Empty until a real matching source is connected</small></div><ChevronRightIcon />
              </button>
              <button className="action-row" onClick={() => setTab("trust")}>
                <span className="icon-tile green-tile"><LockClosedIcon /></span>
                <div><strong>Privacy and trust controls</strong><small>Participant-facing defaults without fake verification</small></div><ChevronRightIcon />
              </button>
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
                <p><strong>Privacy by default:</strong> use approximate origin/destination zones and time windows. Do not enter a home address in this research prototype.</p>
              </section>

              <section className="form-card">
                <div className="form-heading">
                  <span className="icon-tile"><CalendarIcon /></span>
                  <div>
                    <small>{commuteMode === "need" ? "COMMUTER NEED INTAKE" : "PLANNED ROUTE REGISTRATION"}</small>
                    <h2>{commuteMode === "need" ? "Your recurring commute" : "A trip you already intend to make"}</h2>
                  </div>
                </div>

                <PrototypeInput id="origin-zone" label="Approximate origin zone *" placeholder="e.g. Central Glendale" value={form.originZone} onChange={(value) => updateField("originZone", value)} />
                <PrototypeInput id="destination" label="Destination zone *" placeholder="e.g. Pasadena City College" value={form.destination} onChange={(value) => updateField("destination", value)} />

                <div className="field-block">
                  <small>Recurring days *</small>
                  <div className="day-row">{["Mon", "Tue", "Wed", "Thu", "Fri"].map((day) => (
                    <button key={day} type="button" className={selectedDays.includes(day) ? "selected" : ""} onClick={() => toggleDay(day)}>{day}</button>
                  ))}</div>
                </div>

                <PrototypeInput id="morning-window" label="Travel / arrival window *" placeholder="e.g. arrive between 8:00–8:30 AM" value={form.morningWindow} onChange={(value) => updateField("morningWindow", value)} />
                <PrototypeInput id="flexibility" label="Schedule flexibility" placeholder="e.g. ±15 minutes" value={form.flexibility} onChange={(value) => updateField("flexibility", value)} />
                <PrototypeInput id="access-point" label="Access Point preference" placeholder="e.g. public transit station or campus stop" value={form.accessPointPreference} onChange={(value) => updateField("accessPointPreference", value)} />
                <PrototypeInput id="transit-preference" label="Transit / shuttle preference" placeholder="e.g. A Line and PCC shuttle are acceptable" value={form.transitPreference} onChange={(value) => updateField("transitPreference", value)} />
                <PrototypeInput id="ev-preference" label="EV / hybrid preference" placeholder="Optional preference" value={form.evPreference} onChange={(value) => updateField("evPreference", value)} />
                <PrototypeInput id="accessibility" label="Accessibility needs" placeholder="Optional; describe only what is needed for trip planning" value={form.accessibilityNeeds} onChange={(value) => updateField("accessibilityNeeds", value)} />

                {commuteMode === "need" ? (
                  <PrototypeInput id="parking-difficulty" label="Parking difficulty" placeholder="Optional; e.g. often difficult" value={form.parkingDifficulty} onChange={(value) => updateField("parkingDifficulty", value)} />
                ) : (
                  <>
                    <PrototypeInput id="capacity" label="Available capacity" placeholder="e.g. 1 seat" value={form.capacity} onChange={(value) => updateField("capacity", value)} />
                    <PrototypeInput id="max-detour" label="Maximum detour" placeholder="e.g. up to 8 minutes" value={form.maxDetour} onChange={(value) => updateField("maxDetour", value)} />
                    <PrototypeInput id="planned-route-note" label="Existing-route note" placeholder="Briefly describe the route you already plan to travel" value={form.plannedRouteNote} onChange={(value) => updateField("plannedRouteNote", value)} />
                  </>
                )}

                <div className="prototype-privacy-summary">
                  <LockClosedIcon />
                  <div><strong>Approximate-zone mode is on.</strong><p>Exact private locations are not required for this prototype intake.</p></div>
                </div>

                <button className="primary-action" disabled={!canSubmit} onClick={submitCommute}>{commuteMode === "need" ? "Save commute signal" : "Save planned-route signal"}</button>
                {!canSubmit && <p className="form-footnote">Complete origin zone, destination zone, at least one recurring day, and a travel/arrival window to continue.</p>}
                <p className="form-footnote">Saving this prototype form does not purchase transportation, activate a route, create a confirmed fare, guarantee a match, or send information to another participant.</p>
              </section>
            </>
          )}

          {tab === "options" && (
            <>
              <section className="prototype-disclaimer">
                <ExclamationTriangleIcon />
                <p><strong>No seeded commuter matches.</strong> This user-test build intentionally does not fabricate compatibility scores, planned-route participants, contributions, incentives, or itineraries.</p>
              </section>

              {submission ? (
                <>
                  <section className="session-summary-card">
                    <small>YOUR PROTOTYPE SIGNAL</small>
                    <strong>{submission.form.originZone} → {submission.form.destination}</strong>
                    <p>{submission.days.join(", ")} · {submission.form.morningWindow}</p>
                    <span>{submission.mode === "need" ? "Commuter need" : "Planned route"}</span>
                  </section>
                  <EmptyState
                    icon={<SewingPinIcon />}
                    title="No commuter options yet"
                    body="Your commute signal is saved for this browser session. Real commuter options should only appear after a matching data source, eligible participant records, program rules, and administrative review workflow are connected."
                    action="Edit my commute"
                    onAction={() => setTab("commute")}
                  />
                </>
              ) : (
                <EmptyState
                  icon={<CalendarIcon />}
                  title="Start with your commute"
                  body="There is no participant commute signal in this session yet. Submit your own approximate commute information before reviewing the option state."
                  action="Set up my commute"
                  onAction={() => setTab("commute")}
                />
              )}
            </>
          )}

          {tab === "trust" && (
            <>
              <section className="trust-hero">
                <LockClosedIcon />
                <div><small>PARTICIPANT TRUST CENTER</small><strong>Nothing is pre-verified.</strong><p>Verification, privacy, reporting, and communication should reflect real participant state. This prototype therefore begins with verification and connections unset.</p></div>
              </section>

              <div className="section-title"><h2>Verification status</h2><span>Not connected</span></div>
              <div className="verification-list">
                {VERIFICATION_ITEMS.map((item) => (
                  <article className="verification-row" key={item.label}>
                    <span className="dot neutral" />
                    <div><strong>{item.label}</strong><small>{item.status}</small></div>
                    <LockClosedIcon />
                  </article>
                ))}
              </div>

              <h2 className="standalone-title trust-section-title">Privacy controls</h2>
              <ToggleRow title="Approximate zones" detail="Use general zones instead of exact private addresses during intake and preview" enabled={approximateZones} onChange={setApproximateZones} />
              <ToggleRow title="Masked contact details" detail="Keep phone and email hidden until a governed connection state exists" enabled={maskedContact} onChange={setMaskedContact} />

              <h2 className="standalone-title trust-section-title">Governed messaging</h2>
              <section className="message-card">
                <div><span className="status-pill locked"><LockClosedIcon /> Connection unavailable</span><h3>No eligible participant connection exists.</h3><p>Messaging should not open until real eligibility, consent, program-rule, and administrative-review requirements are satisfied.</p></div>
              </section>

              <h2 className="standalone-title trust-section-title">Reliability & issue history</h2>
              <EmptyState icon={<LockClosedIcon />} title="No participant history" body="No ratings, reliability events, issue reports, or conduct records are seeded into this prototype." />
              <p className="form-footnote">A future controlled beta should connect reporting, blocking, suspension, escalation, and retention workflows before participant-to-participant coordination is enabled.</p>
            </>
          )}

          {tab === "program" && (
            <>
              <section className="program-card">
                <small>PCC-FOCUSED RESEARCH PROTOTYPE</small>
                <h2>Participant program status</h2>
                <p>PCC locations, Metro A Line stations, and publicly described PCC shuttle connections are used as mobility context for user testing. This screen does not imply PCC sponsorship, approval, or participant eligibility.</p>
              </section>

              <div className="program-status-list">
                <StatusRow label="Prototype stage" value="Research prototype" />
                <StatusRow label="Institution eligibility" value="Not verified" />
                <StatusRow label="Participant network" value="Not connected" />
                <StatusRow label="Program benefits" value="Not configured" />
                <StatusRow label="Live transportation" value="Not active" />
              </div>

              <h2 className="standalone-title admin-title">What this build is ready to test</h2>
              <section className="prototype-checklist">
                <p>1. Whether commuters understand approximate-zone intake.</p>
                <p>2. Whether Metro, PCC shuttle, Access Point, and corridor context are useful on the map.</p>
                <p>3. Whether planned-route registration and privacy language are understandable before matching is connected.</p>
              </section>

              <section className="legal-note"><LockClosedIcon /><p>Proposed contributions, Green Route Credits, participant verification, messaging, matching, and administrative decisions are not active in this clean user-test build.</p></section>

              <button className="secondary-action reset-session-button" onClick={resetPrototypeSession}>Reset prototype session</button>
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

function PrototypeInput({
  id,
  label,
  placeholder,
  value,
  onChange,
}: {
  id: string;
  label: string;
  placeholder: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <label className="prototype-input-field" htmlFor={id}>
      <small>{label}</small>
      <KeyboardInput id={id} value={value} placeholder={placeholder} onChange={(event) => onChange(event.currentTarget.value)} />
    </label>
  );
}

function ToggleRow({
  title,
  detail,
  enabled,
  onChange,
}: {
  title: string;
  detail: string;
  enabled: boolean;
  onChange: (value: boolean) => void;
}) {
  return (
    <button className="toggle-row toggle-row-button" type="button" role="switch" aria-checked={enabled} onClick={() => onChange(!enabled)}>
      <div><strong>{title}</strong><small>{detail}</small></div>
      <span className={`switch ${enabled ? "on" : ""}`}><i /></span>
    </button>
  );
}

function EmptyState({
  icon,
  title,
  body,
  action,
  onAction,
}: {
  icon: ReactNode;
  title: string;
  body: string;
  action?: string;
  onAction?: () => void;
}) {
  return (
    <section className="empty-state-card">
      <span className="empty-state-icon">{icon}</span>
      <strong>{title}</strong>
      <p>{body}</p>
      {action && onAction && <button className="secondary-action" onClick={onAction}>{action}</button>}
    </section>
  );
}

function StatusRow({ label, value }: { label: string; value: string }) {
  return <article className="program-status-row"><small>{label}</small><strong>{value}</strong></article>;
}
