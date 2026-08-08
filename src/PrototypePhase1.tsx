import { useEffect, useMemo, useState, type ReactNode } from "react";
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
import {
  CONSENT_VERSION,
  getOrCreateParticipantToken,
  getStoredSubmissionId,
  loadResearchSubmission,
  saveResearchSubmission,
  withdrawResearchSubmission,
  type ResearchSubmissionPayload,
  type ResearchSubmissionRecord,
} from "./researchBeta";
import "./phase1.css";

type Tab = "home" | "commute" | "options" | "trust" | "program";
type CommuteMode = "need" | "route";
type SaveState = "idle" | "saving" | "saved" | "error";
type LoadState = "loading" | "ready" | "error";

type CommuteForm = {
  originZone: string;
  destination: string;
  arrivalStart: string;
  arrivalEnd: string;
  returnStart: string;
  returnEnd: string;
  flexibilityMinutes: string;
  currentMode: string;
  parkingDifficulty: string;
  accessPointWilling: boolean;
  preferredAccessPoint: string;
  transitPreference: string;
  evPreference: string;
  accessibilityNeeds: string;
  contributionBand: string;
  capacity: string;
  maxDetourMinutes: string;
  plannedRouteNote: string;
};

const EMPTY_FORM: CommuteForm = {
  originZone: "",
  destination: "",
  arrivalStart: "",
  arrivalEnd: "",
  returnStart: "",
  returnEnd: "",
  flexibilityMinutes: "15",
  currentMode: "",
  parkingDifficulty: "",
  accessPointWilling: false,
  preferredAccessPoint: "",
  transitPreference: "",
  evPreference: "",
  accessibilityNeeds: "",
  contributionBand: "",
  capacity: "",
  maxDetourMinutes: "",
  plannedRouteNote: "",
};

const VERIFICATION_ITEMS = [
  { label: "Identity", status: "Not connected in this research beta" },
  { label: "Institution eligibility", status: "Not verified" },
  { label: "Phone & email", status: "Not collected for participant connection" },
  { label: "Vehicle / route documents", status: "Not reviewed" },
];

export default function PrototypePhase1() {
  const keyboard = useKeyboard();
  const [tab, setTab] = useState<Tab>("home");
  const [commuteMode, setCommuteMode] = useState<CommuteMode>("need");
  const [selectedDays, setSelectedDays] = useState<string[]>([]);
  const [form, setForm] = useState<CommuteForm>(EMPTY_FORM);
  const [submission, setSubmission] = useState<ResearchSubmissionRecord | null>(null);
  const [participantToken, setParticipantToken] = useState("");
  const [loadState, setLoadState] = useState<LoadState>("loading");
  const [saveState, setSaveState] = useState<SaveState>("idle");
  const [saveError, setSaveError] = useState("");
  const [age18Plus, setAge18Plus] = useState(false);
  const [dataConsent, setDataConsent] = useState(false);
  const [prototypeAcknowledged, setPrototypeAcknowledged] = useState(false);
  const [withdrawConfirm, setWithdrawConfirm] = useState(false);
  const [withdrawError, setWithdrawError] = useState("");
  const [notice, setNotice] = useState("");

  const title = useMemo(() => ({
    home: "Relay Rider",
    commute: "My Commute",
    options: "Commuter Options",
    trust: "Trust Center",
    program: "My Program",
  })[tab], [tab]);

  const canSubmit = Boolean(
    participantToken &&
    form.originZone.trim() &&
    form.destination.trim() &&
    form.arrivalStart &&
    form.arrivalEnd &&
    selectedDays.length > 0 &&
    age18Plus &&
    dataConsent &&
    prototypeAcknowledged &&
    (commuteMode === "need" || form.plannedRouteNote.trim()),
  );

  useEffect(() => {
    let cancelled = false;
    const token = getOrCreateParticipantToken();
    setParticipantToken(token);
    const submissionId = getStoredSubmissionId();

    if (!submissionId) {
      setLoadState("ready");
      return () => { cancelled = true; };
    }

    loadResearchSubmission(token, submissionId)
      .then((record) => {
        if (cancelled) return;
        if (record && record.status === "submitted") {
          hydrateFromRecord(record);
          setSubmission(record);
          setAge18Plus(record.age18Plus);
          setDataConsent(record.dataConsent);
          setPrototypeAcknowledged(record.prototypeAcknowledged);
        }
        setLoadState("ready");
      })
      .catch(() => {
        if (!cancelled) setLoadState("error");
      });

    return () => { cancelled = true; };
  }, []);

  function hydrateFromRecord(record: ResearchSubmissionRecord) {
    setCommuteMode(record.submissionType === "planned_route" ? "route" : "need");
    setSelectedDays(record.days);
    setForm({
      originZone: record.originZone,
      destination: record.destinationZone,
      arrivalStart: record.arrivalStart || "",
      arrivalEnd: record.arrivalEnd || "",
      returnStart: record.returnStart || "",
      returnEnd: record.returnEnd || "",
      flexibilityMinutes: record.flexibilityMinutes?.toString() ?? "15",
      currentMode: record.currentMode || "",
      parkingDifficulty: record.parkingDifficulty || "",
      accessPointWilling: record.accessPointWilling,
      preferredAccessPoint: record.preferredAccessPoint || "",
      transitPreference: record.transitPreference || "",
      evPreference: record.evPreference || "",
      accessibilityNeeds: record.accessibilityNotes || "",
      contributionBand: record.contributionBand || "",
      capacity: record.capacity?.toString() ?? "",
      maxDetourMinutes: record.maxDetourMinutes?.toString() ?? "",
      plannedRouteNote: record.plannedRouteNote || "",
    });
  }

  function toggleDay(day: string) {
    setSelectedDays((current) => current.includes(day)
      ? current.filter((item) => item !== day)
      : [...current, day]);
  }

  function updateField<K extends keyof CommuteForm>(key: K, value: CommuteForm[K]) {
    setForm((current) => ({ ...current, [key]: value }));
    if (saveState !== "idle") setSaveState("idle");
    setSaveError("");
  }

  function makePayload(): ResearchSubmissionPayload {
    return {
      submissionType: commuteMode === "route" ? "planned_route" : "commute_need",
      consentVersion: CONSENT_VERSION,
      age18Plus,
      dataConsent,
      prototypeAcknowledged,
      originZone: form.originZone.trim(),
      destinationZone: form.destination.trim(),
      days: [...selectedDays],
      arrivalStart: form.arrivalStart,
      arrivalEnd: form.arrivalEnd,
      returnStart: form.returnStart,
      returnEnd: form.returnEnd,
      flexibilityMinutes: toOptionalNumber(form.flexibilityMinutes),
      currentMode: form.currentMode,
      parkingDifficulty: commuteMode === "need" ? form.parkingDifficulty : "",
      accessPointWilling: form.accessPointWilling,
      preferredAccessPoint: form.accessPointWilling ? form.preferredAccessPoint : "",
      transitPreference: form.transitPreference,
      evPreference: form.evPreference,
      accessibilityNotes: form.accessibilityNeeds.trim(),
      contributionBand: form.contributionBand,
      capacity: commuteMode === "route" ? toOptionalNumber(form.capacity) : null,
      maxDetourMinutes: commuteMode === "route" ? toOptionalNumber(form.maxDetourMinutes) : null,
      plannedRouteNote: commuteMode === "route" ? form.plannedRouteNote.trim() : "",
      approximateZones: true,
      maskedContact: true,
    };
  }

  async function submitCommute() {
    if (!canSubmit) return;
    keyboard.hide();
    setSaveState("saving");
    setSaveError("");
    setNotice("");

    try {
      const record = await saveResearchSubmission(participantToken, makePayload(), submission?.id ?? getStoredSubmissionId());
      setSubmission(record);
      setSaveState("saved");
      setTab("options");
    } catch (error) {
      setSaveState("error");
      setSaveError(error instanceof Error ? error.message : "Your commute signal could not be saved.");
    }
  }

  function startNewDraft(mode: CommuteMode) {
    keyboard.hide();
    setCommuteMode(mode);
    if (!submission) {
      setForm(EMPTY_FORM);
      setSelectedDays([]);
      setAge18Plus(false);
      setDataConsent(false);
      setPrototypeAcknowledged(false);
    }
    setSaveError("");
    setSaveState("idle");
    setTab("commute");
  }

  async function confirmWithdrawal() {
    if (!submission || !participantToken) return;
    keyboard.hide();
    setWithdrawError("");
    try {
      const withdrawn = await withdrawResearchSubmission(participantToken, submission.id);
      if (!withdrawn) throw new Error("The stored submission could not be withdrawn.");
      setSubmission(null);
      setForm(EMPTY_FORM);
      setSelectedDays([]);
      setAge18Plus(false);
      setDataConsent(false);
      setPrototypeAcknowledged(false);
      setWithdrawConfirm(false);
      setNotice("Your research submission was withdrawn. It is no longer eligible for match-preview processing and remains scheduled for automatic deletion within the original 90-day retention period.");
      setTab("home");
    } catch (error) {
      setWithdrawError(error instanceof Error ? error.message : "Withdrawal could not be completed.");
    }
  }

  return (
    <div className="relay-shell phase1-shell">
      <MobileScroll key={tab} className="app-screen relay-scroll">
        <main className="relay-content">
          <header className="page-heading">
            <div>
              <span className="kicker">PCC-FOCUSED RESEARCH BETA</span>
              <h1>{title}</h1>
            </div>
            <button className="profile-button" aria-label="Open Trust Center" onClick={() => setTab("trust")}><PersonIcon /></button>
          </header>

          <section className="beta-notice">
            <LockClosedIcon />
            <div>
              <strong>Research beta · no live transportation</strong>
              <p>This environment collects participant-provided commute signals for product research. It does not provide confirmed commuter matches, transportation purchases, guaranteed incentives, or verified participant connections.</p>
            </div>
          </section>

          {loadState === "error" && (
            <section className="prototype-disclaimer"><ExclamationTriangleIcon /><p><strong>Stored record unavailable.</strong> You can still review the prototype, but do not assume a submission is saved until the app confirms it.</p></section>
          )}
          {notice && <section className="research-notice"><p>{notice}</p></section>}

          {tab === "home" && (
            <>
              <section className="hero-card">
                <small>COMMUTER COORDINATION RESEARCH</small>
                <h2>Start with your actual commute pattern.</h2>
                <p>Share approximate zones, recurring days, time windows, Access Point willingness, current commute mode, and multimodal preferences. Relay Rider stores the signal for research and future governed match-preview testing.</p>
                <div className="hero-actions">
                  <button className="primary-action" onClick={() => startNewDraft("need")}>{submission ? "Edit my commute" : "Set up my commute"}</button>
                  <button className="secondary-action" onClick={() => startNewDraft("route")}>{submission?.submissionType === "planned_route" ? "Edit planned route" : "Register a planned route"}</button>
                </div>
              </section>

              <section className="status-card">
                <div className="status-icon">{submission ? <CalendarIcon /> : <PersonIcon />}</div>
                <div>
                  <small>RESEARCH PARTICIPANT RECORD</small>
                  <strong>{loadState === "loading" ? "Checking this device…" : submission ? "Commute signal submitted" : "No stored commute signal"}</strong>
                  <p>{submission
                    ? `${submission.originZone} → ${submission.destinationZone} · ${submission.days.join(", ")}`
                    : "Submit your own approximate commute information to create a participant research record."}</p>
                </div>
                <span>{submission ? "Stored" : "Start"}</span>
              </section>

              <div className="section-title"><h2>Research-beta flow</h2></div>
              <button className="action-row" onClick={() => startNewDraft(submission?.submissionType === "planned_route" ? "route" : "need")}>
                <span className="icon-tile"><CalendarIcon /></span>
                <div><strong>Structured commuter intake</strong><small>Approximate zones · time windows · mode · Access Point willingness</small></div><ChevronRightIcon />
              </button>
              <button className="action-row" onClick={() => setTab("options")}>
                <span className="icon-tile"><SewingPinIcon /></span>
                <div><strong>Commuter-option state</strong><small>No fabricated matches; future previews require eligible real records</small></div><ChevronRightIcon />
              </button>
              <button className="action-row" onClick={() => setTab("program")}>
                <span className="icon-tile green-tile"><LockClosedIcon /></span>
                <div><strong>Manage my submission</strong><small>Participant reference · edit · withdrawal</small></div><ChevronRightIcon />
              </button>
            </>
          )}

          {tab === "commute" && (
            <>
              <div className="segmented-control" role="tablist" aria-label="Commute workflow">
                <button className={commuteMode === "need" ? "active" : ""} onClick={() => setCommuteMode("need")}>I need an option</button>
                <button className={commuteMode === "route" ? "active" : ""} onClick={() => setCommuteMode("route")}>I already travel this route</button>
              </div>

              <section className="consent-card">
                <small>RESEARCH PARTICIPATION & DATA USE</small>
                <h2>Before you submit</h2>
                <p>Relay Rider will store the approximate commute information you enter below so the research team can study corridor demand, parking pressure, multimodal preferences, planned-route compatibility, and prototype usability. Do not enter a home address.</p>
                <ConsentRow checked={age18Plus} onChange={setAge18Plus} title="I am 18 or older" detail="This research prototype is intended for adult participants." />
                <ConsentRow checked={prototypeAcknowledged} onChange={setPrototypeAcknowledged} title="I understand this is a research beta" detail="A submission is not a transportation purchase, confirmed fare, guaranteed match, or guaranteed route." />
                <ConsentRow checked={dataConsent} onChange={setDataConsent} title="I consent to storage and research use of this commute signal" detail="The record uses approximate zones and a random participant reference. You can edit or withdraw it from this device." />
                <p className="consent-footnote">Research-beta records are retained for no more than 90 days from initial submission and are then automatically deleted. Editing does not restart the 90-day clock. Participant-to-participant contact is not enabled in this build.</p>
              </section>

              <section className="notice-at-collection">
                <LockClosedIcon />
                <p><strong>Privacy by default:</strong> approximate origin/destination zones are required. Exact private addresses and participant contact details are not requested for matching in this research-beta intake.</p>
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
                  <div className="day-row">{["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((day) => (
                    <button key={day} type="button" className={selectedDays.includes(day) ? "selected" : ""} onClick={() => toggleDay(day)}>{day}</button>
                  ))}</div>
                </div>

                <div className="paired-fields">
                  <PrototypeTimeInput id="arrival-start" label="Arrival window starts *" value={form.arrivalStart} onChange={(value) => updateField("arrivalStart", value)} />
                  <PrototypeTimeInput id="arrival-end" label="Arrival window ends *" value={form.arrivalEnd} onChange={(value) => updateField("arrivalEnd", value)} />
                </div>
                <div className="paired-fields">
                  <PrototypeTimeInput id="return-start" label="Return window starts" value={form.returnStart} onChange={(value) => updateField("returnStart", value)} />
                  <PrototypeTimeInput id="return-end" label="Return window ends" value={form.returnEnd} onChange={(value) => updateField("returnEnd", value)} />
                </div>

                <PrototypeSelect id="flexibility" label="Schedule flexibility" value={form.flexibilityMinutes} onChange={(value) => updateField("flexibilityMinutes", value)} options={[
                  ["0", "No flexibility"], ["10", "±10 minutes"], ["15", "±15 minutes"], ["30", "±30 minutes"], ["45", "±45 minutes"], ["60", "±60 minutes"],
                ]} />
                <PrototypeSelect id="current-mode" label="Current commute mode" value={form.currentMode} onChange={(value) => updateField("currentMode", value)} placeholder="Select current mode" options={[
                  ["solo_drive", "Drive alone"], ["carpool", "Carpool / shared commute"], ["transit", "Transit"], ["walk_bike", "Walk / bike / micromobility"], ["mixed", "Mixed / multimodal"], ["other", "Other"],
                ]} />

                {commuteMode === "need" && (
                  <PrototypeSelect id="parking-difficulty" label="Parking difficulty" value={form.parkingDifficulty} onChange={(value) => updateField("parkingDifficulty", value)} placeholder="Select parking experience" options={[
                    ["rarely", "Rarely difficult"], ["sometimes", "Sometimes difficult"], ["often", "Often difficult"], ["not_applicable", "Parking not applicable"],
                  ]} />
                )}

                <ChoiceToggle title="I am willing to use a public Access Point" detail="Examples include a reviewed transit station, campus stop, or other public coordination point." enabled={form.accessPointWilling} onChange={(value) => updateField("accessPointWilling", value)} />
                {form.accessPointWilling && (
                  <PrototypeSelect id="preferred-access-point" label="Preferred Access Point / transfer context" value={form.preferredAccessPoint} onChange={(value) => updateField("preferredAccessPoint", value)} placeholder="No preference" options={[
                    ["allen_station", "Allen Station · A Line / PCC shuttle context"],
                    ["pcc_colorado", "PCC Colorado Campus · Lots 6/7 area"],
                    ["pcc_foothill", "PCC Foothill Campus · Lot C area"],
                    ["memorial_park", "Memorial Park Station"],
                    ["glendale_transit", "Glendale Transportation Center"],
                    ["other_public", "Another public Access Point"],
                  ]} />
                )}

                <PrototypeSelect id="transit-preference" label="Transit / PCC shuttle willingness" value={form.transitPreference} onChange={(value) => updateField("transitPreference", value)} placeholder="Select preference" options={[
                  ["no_preference", "No preference"], ["aline_ok", "Metro A Line is acceptable"], ["pcc_shuttle_ok", "PCC shuttle is acceptable"], ["aline_shuttle_ok", "A Line + PCC shuttle are acceptable"], ["avoid_transit", "Prefer not to use transit"],
                ]} />
                <PrototypeSelect id="ev-preference" label="EV / hybrid preference" value={form.evPreference} onChange={(value) => updateField("evPreference", value)} placeholder="Select preference" options={[
                  ["no_preference", "No vehicle preference"], ["prefer_clean_vehicle", "Prefer EV / hybrid when compatible"],
                ]} />
                <PrototypeSelect id="contribution-band" label="Willingness to contribute toward a compatible planned-route option" value={form.contributionBand} onChange={(value) => updateField("contributionBand", value)} placeholder="Optional" options={[
                  ["unsure", "Not sure yet"], ["none", "$0"], ["up_to_3", "Up to $3"], ["up_to_5", "Up to $5"], ["up_to_8", "Up to $8"],
                ]} />
                <p className="field-helper">This is a route-interest / willingness-to-contribute signal only. It is not a confirmed fare or transportation purchase.</p>
                <PrototypeInput id="accessibility" label="Accessibility needs" placeholder="Optional; only enter trip-planning needs you want considered" value={form.accessibilityNeeds} onChange={(value) => updateField("accessibilityNeeds", value)} />

                {commuteMode === "route" && (
                  <>
                    <PrototypeSelect id="capacity" label="Available capacity" value={form.capacity} onChange={(value) => updateField("capacity", value)} placeholder="Select capacity" options={[["1", "1 seat"], ["2", "2 seats"], ["3", "3 seats"], ["4", "4 seats"]]} />
                    <PrototypeSelect id="max-detour" label="Maximum detour" value={form.maxDetourMinutes} onChange={(value) => updateField("maxDetourMinutes", value)} placeholder="Select detour limit" options={[["0", "No detour"], ["5", "Up to 5 minutes"], ["8", "Up to 8 minutes"], ["10", "Up to 10 minutes"], ["15", "Up to 15 minutes"]]} />
                    <PrototypeInput id="planned-route-note" label="Existing planned route *" placeholder="Briefly describe the trip you already intend to make" value={form.plannedRouteNote} onChange={(value) => updateField("plannedRouteNote", value)} />
                  </>
                )}

                <div className="prototype-privacy-summary">
                  <LockClosedIcon />
                  <div><strong>Approximate-zone mode and contact masking are enforced.</strong><p>The research record does not require an exact home address or participant-to-participant contact information.</p></div>
                </div>

                <button className="primary-action" disabled={!canSubmit || saveState === "saving"} onClick={submitCommute}>{saveState === "saving" ? "Saving research record…" : submission ? "Update commute signal" : commuteMode === "need" ? "Submit commute signal" : "Submit planned-route signal"}</button>
                {!canSubmit && <p className="form-footnote">Complete the three consent acknowledgments, origin zone, destination zone, at least one recurring day, and both arrival-window times. Planned routes also require an existing-route description.</p>}
                {saveState === "error" && <p className="form-error">Not saved: {saveError}</p>}
                <p className="form-footnote">Submission does not purchase transportation, activate a route, create a confirmed fare, guarantee acceptance, or expose your record directly to another participant.</p>
              </section>
            </>
          )}

          {tab === "options" && (
            <>
              <section className="prototype-disclaimer">
                <ExclamationTriangleIcon />
                <p><strong>No fabricated commuter matches.</strong> Real previews will require compatible stored commuter-need and planned-route records plus program-rule and administrative-review logic.</p>
              </section>

              {submission ? (
                <>
                  <section className="session-summary-card">
                    <small>STORED RESEARCH SIGNAL · {submission.participantRef}</small>
                    <strong>{submission.originZone} → {submission.destinationZone}</strong>
                    <p>{submission.days.join(", ")} · arrival {formatTimeRange(submission.arrivalStart, submission.arrivalEnd)}</p>
                    <span>{submission.submissionType === "commute_need" ? "Commuter need" : "Planned route"}</span>
                  </section>
                  <EmptyState
                    icon={<SewingPinIcon />}
                    title="No commuter options yet"
                    body="Your real research record is stored, but Relay Rider will not fabricate a match. Match previews should appear only after compatible participant records and the governed Match Preview Engine are connected."
                    action="Edit my commute"
                    onAction={() => setTab("commute")}
                  />
                </>
              ) : (
                <EmptyState
                  icon={<CalendarIcon />}
                  title="Start with your commute"
                  body="There is no stored participant commute signal on this device yet. Complete consent and submit your own approximate commute information first."
                  action="Set up my commute"
                  onAction={() => startNewDraft("need")}
                />
              )}
            </>
          )}

          {tab === "trust" && (
            <>
              <section className="trust-hero">
                <LockClosedIcon />
                <div><small>PARTICIPANT TRUST CENTER</small><strong>Privacy controls precede matching.</strong><p>This beta stores a random participant reference plus the commute signal you submit. Exact home addresses, automatic payments, unrestricted participant contact, and fake verification states are not part of this build.</p></div>
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

              <h2 className="standalone-title trust-section-title">Data & privacy state</h2>
              <div className="program-status-list">
                <StatusRow label="Location precision" value="Approximate zones only" />
                <StatusRow label="Participant contact" value="Masked / not connected" />
                <StatusRow label="Participant identifier" value={submission?.participantRef ?? "Created on submission"} />
                <StatusRow label="Consent version" value={submission?.consentVersion ?? CONSENT_VERSION} />
                <StatusRow label="Research retention" value="Automatic deletion after 90 days" />
              </div>

              <h2 className="standalone-title trust-section-title">Governed messaging</h2>
              <section className="message-card">
                <div><span className="status-pill locked"><LockClosedIcon /> Connection unavailable</span><h3>No eligible participant connection exists.</h3><p>Messaging should remain locked until identity/eligibility, consent, program rules, match review, and administrative requirements are implemented.</p></div>
              </section>

              <h2 className="standalone-title trust-section-title">Reliability & issue history</h2>
              <EmptyState icon={<LockClosedIcon />} title="No participant history" body="No ratings, reliability events, issue reports, or conduct records are seeded into the research beta." />
            </>
          )}

          {tab === "program" && (
            <>
              <section className="program-card">
                <small>PCC-FOCUSED RESEARCH BETA</small>
                <h2>My research participation</h2>
                <p>PCC locations, Metro A Line stations, and publicly described PCC shuttle connections are used as mobility context. This does not imply PCC sponsorship, approval, or participant eligibility.</p>
              </section>

              <div className="program-status-list">
                <StatusRow label="Research record" value={submission ? "Submitted" : "Not submitted"} />
                <StatusRow label="Participant reference" value={submission?.participantRef ?? "—"} />
                <StatusRow label="Stored record status" value={submission?.status ?? "—"} />
                <StatusRow label="Retention" value="90 days from initial submission" />
                <StatusRow label="Match Preview Engine" value="Not connected" />
                <StatusRow label="Participant messaging" value="Locked" />
                <StatusRow label="Live transportation" value="Not active" />
              </div>

              {submission ? (
                <>
                  <button className="secondary-action manage-action" onClick={() => setTab("commute")}>Edit my stored commute signal</button>
                  {!withdrawConfirm ? (
                    <button className="danger-action manage-action" onClick={() => { setWithdrawConfirm(true); setWithdrawError(""); }}>Withdraw my research submission</button>
                  ) : (
                    <section className="withdraw-card">
                      <strong>Withdraw this submission?</strong>
                      <p>The record will be marked withdrawn immediately and will no longer be eligible for future match-preview processing. Withdrawal does not extend retention; the record remains scheduled for automatic deletion no later than 90 days after its original submission date.</p>
                      <div><button className="danger-action" onClick={confirmWithdrawal}>Confirm withdrawal</button><button className="secondary-action" onClick={() => setWithdrawConfirm(false)}>Cancel</button></div>
                      {withdrawError && <p className="form-error">{withdrawError}</p>}
                    </section>
                  )}
                </>
              ) : (
                <EmptyState icon={<CalendarIcon />} title="No research submission" body="Submit a commute need or planned-route signal to receive a participant reference and manage the stored record from this device." action="Start intake" onAction={() => startNewDraft("need")} />
              )}

              <section className="legal-note"><LockClosedIcon /><p>Research-beta records are automatically deleted after 90 days. Proposed contributions are willingness-to-contribute signals only. Green Route Credits, participant verification, matching, messaging, administrative decisions, and transportation operation are not active in this research-beta foundation.</p></section>
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

function PrototypeInput({ id, label, placeholder, value, onChange }: { id: string; label: string; placeholder: string; value: string; onChange: (value: string) => void }) {
  return (
    <label className="prototype-input-field" htmlFor={id}>
      <small>{label}</small>
      <KeyboardInput id={id} value={value} placeholder={placeholder} onChange={(event) => onChange(event.currentTarget.value)} />
    </label>
  );
}

function PrototypeTimeInput({ id, label, value, onChange }: { id: string; label: string; value: string; onChange: (value: string) => void }) {
  return (
    <label className="prototype-input-field" htmlFor={id}>
      <small>{label}</small>
      <KeyboardInput id={id} type="time" value={value} onChange={(event) => onChange(event.currentTarget.value)} />
    </label>
  );
}

function PrototypeSelect({ id, label, value, onChange, options, placeholder }: { id: string; label: string; value: string; onChange: (value: string) => void; options: [string, string][]; placeholder?: string }) {
  return (
    <label className="prototype-input-field" htmlFor={id}>
      <small>{label}</small>
      <select id={id} value={value} onChange={(event) => onChange(event.currentTarget.value)}>
        {placeholder && <option value="">{placeholder}</option>}
        {options.map(([optionValue, optionLabel]) => <option key={optionValue} value={optionValue}>{optionLabel}</option>)}
      </select>
    </label>
  );
}

function ConsentRow({ checked, onChange, title, detail }: { checked: boolean; onChange: (value: boolean) => void; title: string; detail: string }) {
  return (
    <label className="consent-row">
      <input type="checkbox" checked={checked} onChange={(event) => onChange(event.currentTarget.checked)} />
      <span><strong>{title}</strong><small>{detail}</small></span>
    </label>
  );
}

function ChoiceToggle({ title, detail, enabled, onChange }: { title: string; detail: string; enabled: boolean; onChange: (value: boolean) => void }) {
  return (
    <button className="toggle-row toggle-row-button choice-toggle" type="button" role="switch" aria-checked={enabled} onClick={() => onChange(!enabled)}>
      <div><strong>{title}</strong><small>{detail}</small></div>
      <span className={`switch ${enabled ? "on" : ""}`}><i /></span>
    </button>
  );
}

function EmptyState({ icon, title, body, action, onAction }: { icon: ReactNode; title: string; body: string; action?: string; onAction?: () => void }) {
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

function toOptionalNumber(value: string) {
  if (!value) return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function formatTimeRange(start: string, end: string) {
  if (!start || !end) return "window not set";
  return `${start}–${end}`;
}
