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
import "./participant-tdm.css";

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
  capacity: string;
  maxDetourMinutes: string;
  plannedRouteNote: string;
};

type PreviewOption = {
  id: string;
  type: string;
  label: string;
  time: string;
  schedule: string;
  walk: string;
  transfers: string;
  accessPoint: string;
  detour: string;
  vehicle: string;
  benefit: string;
  compatibility?: string;
  reason: string;
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
  const [interestExpressed, setInterestExpressed] = useState(false);

  const title = useMemo(() => ({
    home: "Relay Rider",
    commute: "Plan My Commute",
    options: "Explore Commute Options",
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

  const previewOptions = useMemo(() => buildPreviewOptions(submission), [submission]);

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
      capacity: record.capacity?.toString() ?? "",
      maxDetourMinutes: record.maxDetourMinutes?.toString() ?? "",
      plannedRouteNote: record.plannedRouteNote || "",
    });
  }

  function toggleDay(day: string) {
    setSelectedDays((current) => current.includes(day) ? current.filter((item) => item !== day) : [...current, day]);
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
      contributionBand: "",
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
    setInterestExpressed(false);

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
      setInterestExpressed(false);
      setNotice("Your research submission was withdrawn. It is no longer eligible for future match-preview processing and remains scheduled for automatic deletion within the original 90-day retention period.");
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
            <div><span className="kicker">PCC-FOCUSED RESEARCH BETA</span><h1>{title}</h1></div>
            <button className="profile-button" aria-label="Open Trust Center" onClick={() => setTab("trust")}><PersonIcon /></button>
          </header>

          <section className="participant-program-card">
            <div><small>INSTITUTION-SPONSORED DEMONSTRATION</small><strong>Pasadena City College Sustainable Commute Program</strong><span>No partnership or participant eligibility is implied by this research prototype.</span></div>
            <b>No participant contribution required.</b>
          </section>

          <section className="beta-notice">
            <LockClosedIcon />
            <div><strong>Research beta · no live transportation</strong><p>Commute-option previews are simulated for product evaluation. They are not guaranteed transportation, live dispatch, confirmed route acceptance, or real-time transit arrivals.</p></div>
          </section>

          {loadState === "error" && <section className="prototype-disclaimer"><ExclamationTriangleIcon /><p><strong>Stored record unavailable.</strong> You can still review the prototype, but do not assume a submission is saved until the app confirms it.</p></section>}
          {notice && <section className="research-notice"><p>{notice}</p></section>}

          {tab === "home" && (
            <>
              <section className="hero-card">
                <small>PLAN MY COMMUTE</small>
                <h2>Start with where, when, and how you already travel.</h2>
                <p>Share approximate zones, recurring days, schedule flexibility, parking experience, transit willingness, Access Point willingness, and EV/hybrid preference. Relay Rider uses those signals to demonstrate multimodal commute options and future governed planned-route coordination.</p>
                <div className="hero-actions">
                  <button className="primary-action" onClick={() => startNewDraft("need")}>{submission ? "Edit my commute" : "Plan my commute"}</button>
                  <button className="secondary-action" onClick={() => startNewDraft("route")}>{submission?.submissionType === "planned_route" ? "Edit planned route" : "Register a planned route"}</button>
                </div>
              </section>

              <section className="status-card">
                <div className="status-icon">{submission ? <CalendarIcon /> : <PersonIcon />}</div>
                <div><small>RESEARCH PARTICIPANT RECORD</small><strong>{loadState === "loading" ? "Checking this device…" : submission ? "Commute signal submitted" : "No stored commute signal"}</strong><p>{submission ? `${submission.originZone} → ${submission.destinationZone} · ${submission.days.join(", ")}` : "Submit your approximate commute information to create a research record."}</p></div>
                <span>{submission ? "Stored" : "Start"}</span>
              </section>

              <div className="section-title"><h2>Commute planning</h2></div>
              <button className="action-row" onClick={() => startNewDraft(submission?.submissionType === "planned_route" ? "route" : "need")}><span className="icon-tile"><CalendarIcon /></span><div><strong>Plan My Commute</strong><small>Approximate zones · schedule · mode · parking · Access Point</small></div><ChevronRightIcon /></button>
              <button className="action-row" onClick={() => setTab("options")}><span className="icon-tile"><SewingPinIcon /></span><div><strong>Explore Commute Options</strong><small>Transit · planned-route preview · multimodal alternatives · program benefits</small></div><ChevronRightIcon /></button>
              <button className="action-row" onClick={() => setTab("program")}><span className="icon-tile green-tile"><LockClosedIcon /></span><div><strong>Manage my research participation</strong><small>Participant reference · privacy · edit · withdrawal</small></div><ChevronRightIcon /></button>
            </>
          )}

          {tab === "commute" && (
            <>
              <div className="segmented-control" role="tablist" aria-label="Commute workflow">
                <button className={commuteMode === "need" ? "active" : ""} onClick={() => setCommuteMode("need")}>Explore commute options</button>
                <button className={commuteMode === "route" ? "active" : ""} onClick={() => setCommuteMode("route")}>Register planned route</button>
              </div>

              <section className="consent-card">
                <small>RESEARCH PARTICIPATION & DATA USE</small><h2>Before you submit</h2>
                <p>Relay Rider stores the approximate commute information below so the research team can study corridor demand, parking pressure, multimodal preferences, planned-route compatibility, and prototype usability. Do not enter a home address.</p>
                <ConsentRow checked={age18Plus} onChange={setAge18Plus} title="I am 18 or older" detail="This research prototype is intended for adult participants." />
                <ConsentRow checked={prototypeAcknowledged} onChange={setPrototypeAcknowledged} title="I understand this is a research beta" detail="A submission is not a transportation purchase, confirmed fare, guaranteed match, or guaranteed route." />
                <ConsentRow checked={dataConsent} onChange={setDataConsent} title="I consent to storage and research use of this commute signal" detail="The record uses approximate zones and a random participant reference. You can edit or withdraw it from this device." />
                <p className="consent-footnote">Research-beta records are retained for no more than 90 days from initial submission and then automatically deleted. Editing does not restart the 90-day clock.</p>
              </section>

              <section className="notice-at-collection"><LockClosedIcon /><p><strong>Privacy by default:</strong> administrators should work with generalized zones and corridor analytics rather than participant home addresses.</p></section>

              <section className="form-card">
                <div className="form-heading"><span className="icon-tile"><CalendarIcon /></span><div><small>{commuteMode === "need" ? "COMMUTER NEED INTAKE" : "PLANNED ROUTE REGISTRATION"}</small><h2>{commuteMode === "need" ? "Your recurring commute" : "Register a trip you already plan to make"}</h2></div></div>

                <PrototypeInput id="origin-zone" label="Approximate starting zone *" placeholder="e.g. Central Glendale" value={form.originZone} onChange={(value) => updateField("originZone", value)} />
                <PrototypeInput id="destination" label="Destination *" placeholder="e.g. Pasadena City College" value={form.destination} onChange={(value) => updateField("destination", value)} />

                <div className="field-block"><small>Recurring commute days *</small><div className="day-row">{["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((day) => <button key={day} type="button" className={selectedDays.includes(day) ? "selected" : ""} onClick={() => toggleDay(day)}>{day}</button>)}</div></div>

                <div className="paired-fields"><PrototypeTimeInput id="arrival-start" label="Arrival window starts *" value={form.arrivalStart} onChange={(value) => updateField("arrivalStart", value)} /><PrototypeTimeInput id="arrival-end" label="Arrival window ends *" value={form.arrivalEnd} onChange={(value) => updateField("arrivalEnd", value)} /></div>
                <div className="paired-fields"><PrototypeTimeInput id="return-start" label="Return window starts" value={form.returnStart} onChange={(value) => updateField("returnStart", value)} /><PrototypeTimeInput id="return-end" label="Return window ends" value={form.returnEnd} onChange={(value) => updateField("returnEnd", value)} /></div>

                <PrototypeSelect id="flexibility" label="Schedule flexibility" value={form.flexibilityMinutes} onChange={(value) => updateField("flexibilityMinutes", value)} options={[["0", "No flexibility"], ["10", "±10 minutes"], ["15", "±15 minutes"], ["30", "±30 minutes"], ["45", "±45 minutes"], ["60", "±60 minutes"]]} />
                <PrototypeSelect id="current-mode" label="Current commute method" value={form.currentMode} onChange={(value) => updateField("currentMode", value)} placeholder="Select current mode" options={[["solo_drive", "Drive alone"], ["carpool", "Carpool / shared commute"], ["transit", "Transit"], ["walk_bike", "Walk / bike / micromobility"], ["mixed", "Mixed / multimodal"], ["other", "Other"]]} />

                {commuteMode === "need" && <PrototypeSelect id="parking-difficulty" label="Parking difficulty" value={form.parkingDifficulty} onChange={(value) => updateField("parkingDifficulty", value)} placeholder="Select parking experience" options={[["rarely", "Rarely difficult"], ["sometimes", "Sometimes difficult"], ["often", "Often difficult"], ["not_applicable", "Parking not applicable"]]} />}

                <ChoiceToggle title="I am willing to use a public Access Point" detail="Examples include a reviewed transit station, campus stop, or other public coordination point." enabled={form.accessPointWilling} onChange={(value) => updateField("accessPointWilling", value)} />
                {form.accessPointWilling && <PrototypeSelect id="preferred-access-point" label="Preferred Access Point / transfer context" value={form.preferredAccessPoint} onChange={(value) => updateField("preferredAccessPoint", value)} placeholder="No preference" options={[["allen_station", "Allen Station · A Line / PCC shuttle context"], ["pcc_colorado", "PCC Colorado Campus · Lots 6/7 area"], ["pcc_foothill", "PCC Foothill Campus · Lot C area"], ["memorial_park", "Memorial Park Station"], ["glendale_transit", "Glendale Transportation Center"], ["other_public", "Another public Access Point"]]} />}

                <PrototypeSelect id="transit-preference" label="Transit / local mobility willingness" value={form.transitPreference} onChange={(value) => updateField("transitPreference", value)} placeholder="Select preference" options={[["no_preference", "No preference"], ["aline_ok", "Metro A Line is acceptable"], ["pcc_shuttle_ok", "PCC shuttle is acceptable"], ["aline_shuttle_ok", "A Line + PCC shuttle are acceptable"], ["avoid_transit", "Prefer not to use transit"]]} />
                <PrototypeSelect id="ev-preference" label="EV / hybrid preference" value={form.evPreference} onChange={(value) => updateField("evPreference", value)} placeholder="Select preference" options={[["no_preference", "No vehicle preference"], ["prefer_clean_vehicle", "Prefer EV / hybrid when compatible"]]} />
                <PrototypeInput id="accessibility" label="Accessibility needs" placeholder="Optional; only enter trip-planning needs you want considered" value={form.accessibilityNeeds} onChange={(value) => updateField("accessibilityNeeds", value)} />

                {commuteMode === "route" && <><PrototypeSelect id="capacity" label="Available capacity" value={form.capacity} onChange={(value) => updateField("capacity", value)} placeholder="Select capacity" options={[["1", "1 seat"], ["2", "2 seats"], ["3", "3 seats"], ["4", "4 seats"]]} /><PrototypeSelect id="max-detour" label="Maximum detour" value={form.maxDetourMinutes} onChange={(value) => updateField("maxDetourMinutes", value)} placeholder="Select detour limit" options={[["0", "No detour"], ["5", "Up to 5 minutes"], ["8", "Up to 8 minutes"], ["10", "Up to 10 minutes"], ["15", "Up to 15 minutes"]]} /><PrototypeInput id="planned-route-note" label="Existing planned route *" placeholder="Briefly describe the trip you already intend to make" value={form.plannedRouteNote} onChange={(value) => updateField("plannedRouteNote", value)} /><p className="planned-route-rule">Register a trip you already plan to make. This is not a driver-online, dispatch, or earnings workflow.</p></>}

                <section className="institution-sponsored-note"><strong>No participant contribution required.</strong><span>This PCC-focused demonstration is configured as institution-sponsored. No bid or payment field is shown.</span></section>

                <div className="prototype-privacy-summary"><LockClosedIcon /><div><strong>Approximate-zone mode and contact masking are enforced.</strong><p>The research record does not require an exact home address or participant-to-participant contact information.</p></div></div>

                <button className="primary-action" disabled={!canSubmit || saveState === "saving"} onClick={submitCommute}>{saveState === "saving" ? "Saving research record…" : submission ? "Update commute signal" : commuteMode === "need" ? "Explore commute options" : "Register planned-route signal"}</button>
                {!canSubmit && <p className="form-footnote">Complete the three consent acknowledgments, approximate starting zone, destination, at least one recurring day, and both arrival-window times. Planned routes also require an existing-route description.</p>}
                {saveState === "error" && <p className="form-error">Not saved: {saveError}</p>}
                <p className="form-footnote">Submission does not purchase transportation, activate a route, guarantee acceptance, or expose your record directly to another participant.</p>
              </section>
            </>
          )}

          {tab === "options" && (
            <>
              <section className="prototype-disclaimer"><ExclamationTriangleIcon /><p><strong>Simulated commuter options for product evaluation.</strong> Options are not guaranteed transportation and may be subject to program eligibility, availability, and administrative review. Transit information below is scheduled/static demonstration context, not live arrivals.</p></section>

              {submission ? <><section className="session-summary-card"><small>STORED RESEARCH SIGNAL · {submission.participantRef}</small><strong>{submission.originZone} → {submission.destinationZone}</strong><p>{submission.days.join(", ")} · arrival {formatTimeRange(submission.arrivalStart, submission.arrivalEnd)}</p><span>{submission.submissionType === "commute_need" ? "Commuter need" : "Planned route"}</span></section><div className="participant-option-grid">{previewOptions.map((option) => <PreviewCard key={option.id} option={option} interestExpressed={interestExpressed} onInterest={() => setInterestExpressed(true)} />)}</div>{interestExpressed && <section className="research-notice"><p><strong>Route-interest signal recorded in this interface only.</strong> This prototype action does not create a booking, confirmed match, payment, or guaranteed route.</p></section>}</> : <EmptyState icon={<CalendarIcon />} title="Start with your commute" body="Complete the structured commute intake first. Relay Rider will then show clearly labeled simulated multimodal options for product evaluation." action="Plan my commute" onAction={() => startNewDraft("need")} />}
            </>
          )}

          {tab === "trust" && (
            <>
              <section className="trust-hero"><LockClosedIcon /><div><small>PARTICIPANT TRUST CENTER</small><strong>Privacy controls precede participant connection.</strong><p>This beta stores a random participant reference plus the commute signal you submit. Exact home addresses, automatic payments, unrestricted participant contact, and fake verification states are not part of this build.</p></div></section>
              <div className="section-title"><h2>Verification status</h2><span>Not connected</span></div>
              <div className="verification-list">{VERIFICATION_ITEMS.map((item) => <article className="verification-row" key={item.label}><span className="dot neutral" /><div><strong>{item.label}</strong><small>{item.status}</small></div><LockClosedIcon /></article>)}</div>
              <h2 className="standalone-title trust-section-title">Data & privacy state</h2>
              <div className="program-status-list"><StatusRow label="Location precision" value="Approximate zones only" /><StatusRow label="Participant contact" value="Masked / not connected" /><StatusRow label="Participant identifier" value={submission?.participantRef ?? "Created on submission"} /><StatusRow label="Consent version" value={submission?.consentVersion ?? CONSENT_VERSION} /><StatusRow label="Research retention" value="Automatic deletion after 90 days" /></div>
              <h2 className="standalone-title trust-section-title">Governed messaging</h2>
              <section className="message-card"><div><span className="status-pill locked"><LockClosedIcon /> Connection unavailable</span><h3>No eligible participant connection exists.</h3><p>Messaging remains locked until identity/eligibility, consent, program rules, match review, and administrative requirements are implemented.</p></div></section>
            </>
          )}

          {tab === "program" && (
            <>
              <section className="program-card"><small>PCC-FOCUSED RESEARCH BETA</small><h2>My research participation</h2><p>PCC locations, Metro A Line stations, and publicly described PCC shuttle connections are used as mobility context. This does not imply PCC sponsorship, approval, or participant eligibility.</p></section>
              <div className="program-status-list"><StatusRow label="Program configuration" value="Institution-sponsored demonstration" /><StatusRow label="Participant contribution" value="None required" /><StatusRow label="Research record" value={submission ? "Submitted" : "Not submitted"} /><StatusRow label="Participant reference" value={submission?.participantRef ?? "—"} /><StatusRow label="Stored record status" value={submission?.status ?? "—"} /><StatusRow label="Retention" value="90 days from initial submission" /><StatusRow label="Match Preview Engine" value="Simulated product preview only" /><StatusRow label="Participant messaging" value="Locked" /><StatusRow label="Live transportation" value="Not active" /></div>
              {submission ? <><button className="secondary-action manage-action" onClick={() => setTab("commute")}>Edit my stored commute signal</button>{!withdrawConfirm ? <button className="danger-action manage-action" onClick={() => { setWithdrawConfirm(true); setWithdrawError(""); }}>Withdraw my research submission</button> : <section className="withdraw-card"><strong>Withdraw this submission?</strong><p>The record will be marked withdrawn immediately and will no longer be eligible for future match-preview processing. Withdrawal does not extend retention; deletion remains scheduled no later than 90 days after original submission.</p><div><button className="danger-action" onClick={confirmWithdrawal}>Confirm withdrawal</button><button className="secondary-action" onClick={() => setWithdrawConfirm(false)}>Cancel</button></div>{withdrawError && <p className="form-error">{withdrawError}</p>}</section>}</> : <EmptyState icon={<CalendarIcon />} title="No research submission" body="Submit a commute need or planned-route signal to receive a participant reference and manage the stored record from this device." action="Start intake" onAction={() => startNewDraft("need")} />}
              <section className="legal-note"><LockClosedIcon /><p>Research-beta records are automatically deleted after 90 days. Green Route Credits shown in simulated options are program-benefit examples, not wages, fares, cash earnings, certified offsets, or guaranteed benefits.</p></section>
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

function PreviewCard({ option, interestExpressed, onInterest }: { option: PreviewOption; interestExpressed: boolean; onInterest: () => void }) {
  return <article className="participant-option-card"><div className="participant-option-top"><div><small>{option.label}</small><h3>{option.type}</h3></div>{option.compatibility && <span>{option.compatibility}</span>}</div><strong className="participant-option-time">{option.time}</strong><div className="participant-option-metrics"><span><b>Schedule</b>{option.schedule}</span><span><b>Walk</b>{option.walk}</span><span><b>Transfers</b>{option.transfers}</span><span><b>Access Point</b>{option.accessPoint}</span><span><b>Estimated detour</b>{option.detour}</span><span><b>Vehicle</b>{option.vehicle}</span></div><div className="program-benefit"><small>PROGRAM BENEFIT</small><strong>{option.benefit}</strong></div><div className="participant-option-reason"><small>WHY THIS OPTION APPEARED</small><p>{option.reason}</p></div>{option.id === "planned" && <button className="secondary-action option-interest" disabled={interestExpressed} onClick={onInterest}>{interestExpressed ? "Route interest expressed" : "Express Route Interest"}</button>}</article>;
}

function buildPreviewOptions(submission: ResearchSubmissionRecord | null): PreviewOption[] {
  if (!submission) return [];
  const accessPoint = displayAccessPoint(submission.preferredAccessPoint, submission.accessPointWilling);
  const cleanVehicle = submission.evPreference === "prefer_clean_vehicle" ? "EV / hybrid preference considered" : "No vehicle preference";
  const flexibility = submission.flexibilityMinutes ? `Within ±${submission.flexibilityMinutes} min window` : "Uses submitted arrival window";
  const transitAccepted = submission.transitPreference !== "avoid_transit";
  const parkingPressure = submission.parkingDifficulty === "often" ? "Reported parking difficulty strengthens non-SOV recommendation." : "Provides an alternative to solo parking demand.";

  return [
    {
      id: "planned",
      type: "Planned Shared Route",
      label: "SIMULATED MATCH PREVIEW",
      time: "31–38 min estimated",
      schedule: flexibility,
      walk: submission.accessPointWilling ? "~5 min" : "Access Point decision needed",
      transfers: "0",
      accessPoint,
      detour: submission.accessPointWilling ? "~6 min modeled" : "Not scored",
      vehicle: cleanVehicle,
      benefit: "+3 Green Route Credits · modeled example",
      compatibility: submission.accessPointWilling ? "87% modeled" : "78% modeled",
      reason: submission.accessPointWilling
        ? "Your recurring time window overlaps a simulated planned route, you accept a public Access Point, and the modeled additional travel is low."
        : "Your recurring time window overlaps a simulated planned route, but an Access Point decision would be required before this option could advance to administrative review.",
    },
    {
      id: "metro",
      type: "Metro / Rail + Local Connection",
      label: "SCHEDULED / STATIC DEMONSTRATION",
      time: "44–52 min estimated",
      schedule: transitAccepted ? "Compatible with submitted window" : "Shown for comparison",
      walk: "~8 min",
      transfers: "1",
      accessPoint: "A Line / local connection context",
      detour: "Not applicable",
      vehicle: "Public transit",
      benefit: "Transit benefit · institution-configured example",
      reason: transitAccepted ? "Transit serves the destination corridor and your submitted preference does not exclude transit." : "Displayed as a multimodal comparison even though your submitted preference currently favors avoiding transit.",
    },
    {
      id: "access-transit",
      type: "Transit + Access Point",
      label: "MULTIMODAL OPTION",
      time: "42–50 min estimated",
      schedule: flexibility,
      walk: "~6 min",
      transfers: "1",
      accessPoint: submission.accessPointWilling ? accessPoint : "Requires Access Point willingness",
      detour: "Not applicable",
      vehicle: "Transit / shuttle context",
      benefit: "Institution-sponsored option",
      reason: submission.accessPointWilling ? "You indicated willingness to use a public Access Point, which can reduce first/last-mile friction around a transit connection." : "This option illustrates how a reviewed public Access Point could solve a first/last-mile gap if you choose to enable that preference.",
    },
    {
      id: "flex",
      type: "Flexible Schedule / Parking Avoidance",
      label: "TDM PROGRAM OPTION",
      time: "Trip time unchanged",
      schedule: submission.flexibilityMinutes && submission.flexibilityMinutes > 0 ? `Shift within ±${submission.flexibilityMinutes} min` : "No flexibility currently reported",
      walk: "—",
      transfers: "—",
      accessPoint: "Not required",
      detour: "Not applicable",
      vehicle: submission.currentMode === "solo_drive" ? "Current mode: drive alone" : "Current mode retained",
      benefit: "Participation reward / preferred parking may apply",
      reason: `${parkingPressure} A schedule-flexibility intervention can target peak parking pressure without representing a guaranteed transportation service.`,
    },
  ];
}

function displayAccessPoint(value: string, willing: boolean) {
  if (!willing) return "Not selected";
  return ({ allen_station: "Allen Station", pcc_colorado: "PCC Colorado · Lots 6/7 area", pcc_foothill: "PCC Foothill · Lot C area", memorial_park: "Memorial Park Station", glendale_transit: "Glendale Transportation Center", other_public: "Other reviewed public Access Point" } as Record<string, string>)[value] ?? "Reviewed public Access Point to be selected";
}

function PrototypeInput({ id, label, placeholder, value, onChange }: { id: string; label: string; placeholder: string; value: string; onChange: (value: string) => void }) {
  return <label className="prototype-input-field" htmlFor={id}><small>{label}</small><KeyboardInput id={id} value={value} placeholder={placeholder} onChange={(event) => onChange(event.currentTarget.value)} /></label>;
}

function PrototypeTimeInput({ id, label, value, onChange }: { id: string; label: string; value: string; onChange: (value: string) => void }) {
  return <label className="prototype-input-field" htmlFor={id}><small>{label}</small><KeyboardInput id={id} type="time" value={value} onChange={(event) => onChange(event.currentTarget.value)} /></label>;
}

function PrototypeSelect({ id, label, value, onChange, options, placeholder }: { id: string; label: string; value: string; onChange: (value: string) => void; options: [string, string][]; placeholder?: string }) {
  return <label className="prototype-input-field" htmlFor={id}><small>{label}</small><select id={id} value={value} onChange={(event) => onChange(event.currentTarget.value)}>{placeholder && <option value="">{placeholder}</option>}{options.map(([optionValue, optionLabel]) => <option key={optionValue} value={optionValue}>{optionLabel}</option>)}</select></label>;
}

function ConsentRow({ checked, onChange, title, detail }: { checked: boolean; onChange: (value: boolean) => void; title: string; detail: string }) {
  return <label className="consent-row"><input type="checkbox" checked={checked} onChange={(event) => onChange(event.currentTarget.checked)} /><span><strong>{title}</strong><small>{detail}</small></span></label>;
}

function ChoiceToggle({ title, detail, enabled, onChange }: { title: string; detail: string; enabled: boolean; onChange: (value: boolean) => void }) {
  return <button className="toggle-row toggle-row-button choice-toggle" type="button" role="switch" aria-checked={enabled} onClick={() => onChange(!enabled)}><div><strong>{title}</strong><small>{detail}</small></div><span className={`switch ${enabled ? "on" : ""}`}><i /></span></button>;
}

function EmptyState({ icon, title, body, action, onAction }: { icon: ReactNode; title: string; body: string; action?: string; onAction?: () => void }) {
  return <section className="empty-state-card"><span className="empty-state-icon">{icon}</span><strong>{title}</strong><p>{body}</p>{action && onAction && <button className="secondary-action" onClick={onAction}>{action}</button>}</section>;
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
