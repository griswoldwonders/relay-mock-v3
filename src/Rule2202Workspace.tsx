import "./rule-2202-workspace.css";

type Status = "ready" | "review" | "blocked" | "not_started";

type ReadinessItem = {
  label: string;
  status: Status;
  detail: string;
};

const readiness: ReadinessItem[] = [
  { label: "Worksite profile", status: "review", detail: "Employee count, worksite address, business classification, ETC contact and annual due date must be confirmed." },
  { label: "Employee population", status: "blocked", detail: "No verified employer population dataset is connected." },
  { label: "Survey / ZIP pathway", status: "not_started", detail: "Choose the AQMD AVR survey workflow or anonymized employee ZIP-code VMT workflow." },
  { label: "Response validation", status: "not_started", detail: "Validation begins after employee commute records are imported." },
  { label: "Weekly VMT by mode", status: "not_started", detail: "AQMD VMT inputs are not available until the reporting population is validated." },
  { label: "Compliance package", status: "not_started", detail: "Generate a review package only after required inputs pass validation." },
];

const modes = [
  "Zero Emission Vehicle (Electric/Fuel cell)",
  "Bus",
  "Rail/Train",
  "Walk",
  "Bicycle",
  "Telecommute",
  "Noncommuting",
  "Drive alone",
  "Motorcycle",
  "2–15 persons in vehicle",
  "Compressed work week day off",
  "Vacation / Sick / Other day off",
];

export default function Rule2202Workspace() {
  return <div className="r2202-stack">
    <section className="r2202-hero">
      <div>
        <span className="ops-eyebrow">SOUTH COAST AQMD · RULE 2202</span>
        <h2>Compliance operations without fabricated employer data.</h2>
        <p>Relay Rider structures the annual Rule 2202 workflow around verified worksite records, AQMD survey or ZIP-code VMT inputs, validation, weekly VMT by mode, internal review, and a filing-ready evidence package.</p>
      </div>
      <div className="r2202-status-card">
        <small>2026 REPORTING STATUS</small>
        <strong>Not ready</strong>
        <span>Employer dataset not connected</span>
        <div className="r2202-progress"><i style={{ width: "17%" }} /></div>
        <p>This is a compliance-support workspace. It does not claim that a filing has been submitted to or approved by South Coast AQMD.</p>
      </div>
    </section>

    <section className="r2202-cards">
      <Metric label="Applicability threshold" value="250+" note="employees at a worksite" />
      <Metric label="VMT reporting" value="Required" note="effective Jan. 1, 2025" />
      <Metric label="Survey formats" value="5 / 7 day" note="official AQMD AVR forms" />
      <Metric label="VMT pathways" value="2" note="survey data or anonymized ZIPs" />
    </section>

    <section className="ops-panel">
      <header><h2>Compliance readiness</h2></header>
      <div className="r2202-readiness">
        {readiness.map((item, index) => <article key={item.label}>
          <div className="r2202-step">{index + 1}</div>
          <div><strong>{item.label}</strong><span>{item.detail}</span></div>
          <b className={`r2202-chip ${item.status}`}>{formatStatus(item.status)}</b>
        </article>)}
      </div>
    </section>

    <div className="ops-grid two">
      <section className="ops-panel">
        <header><h2>Worksite profile</h2></header>
        <div className="r2202-field-grid">
          <ReadOnly label="Worksite" value="[NEEDS INSTITUTION INPUT]" />
          <ReadOnly label="Employee count" value="Not connected" />
          <ReadOnly label="Business classification" value="Not confirmed" />
          <ReadOnly label="ETC / site contact" value="Not confirmed" />
          <ReadOnly label="Annual due date" value="Not confirmed" />
          <ReadOnly label="Compliance pathway" value="Not selected" />
        </div>
        <p className="ops-note">Rule 2202 generally applies to South Coast Air Basin worksites with 250 or more employees. Applicability should be confirmed against the current rule and AQMD guidance.</p>
      </section>

      <section className="ops-panel">
        <header><h2>Choose VMT input pathway</h2></header>
        <div className="r2202-paths">
          <article><span>A</span><div><strong>AVR survey pathway</strong><p>Use completed 5-day or 7-day employee survey records. AQMD's VMT calculator requires one-way miles and commute mode for each surveyed peak-window employee-day.</p></div></article>
          <article><span>B</span><div><strong>Anonymized ZIP pathway</strong><p>For employers not conducting an AVR survey, use anonymized employee home ZIP codes for peak-window employees. Do not include names or other identifying information.</p></div></article>
        </div>
      </section>
    </div>

    <div className="ops-grid two">
      <section className="ops-panel">
        <header><h2>Validation controls</h2></header>
        <div className="r2202-checks">
          <p><b>BLOCK</b><span>Missing required employee-day commute mode</span></p>
          <p><b>BLOCK</b><span>Missing one-way distance for survey VMT input</span></p>
          <p><b>BLOCK</b><span>Invalid or missing ZIP for ZIP-based VMT input</span></p>
          <p><b>REVIEW</b><span>Duplicate employee-day record</span></p>
          <p><b>REVIEW</b><span>Unrecognized AQMD transportation mode</span></p>
          <p><b>REVIEW</b><span>Population / survey coverage mismatch</span></p>
        </div>
      </section>

      <section className="ops-panel">
        <header><h2>AQMD transportation modes</h2></header>
        <div className="r2202-mode-list">{modes.map((mode) => <span key={mode}>{mode}</span>)}</div>
        <p className="ops-note">Relay Rider should preserve the source value and normalize it to AQMD-approved reporting terminology. The authoritative list remains the current AQMD VMT calculator/template.</p>
      </section>
    </div>

    <section className="ops-panel">
      <header><h2>Compliance metrics</h2></header>
      <div className="r2202-metric-table">
        <div className="head"><span>Metric</span><span>Current value</span><span>Source</span><span>Status</span></div>
        <Row metric="Peak-window employee population" value="Unavailable" source="Employer worksite records" status="Blocked" />
        <Row metric="Average Vehicle Ridership (AVR)" value="Unavailable" source="Validated AQMD survey" status="Not calculated" />
        <Row metric="Weekly VMT by mode" value="Unavailable" source="AQMD VMT pathway" status="Not calculated" />
        <Row metric="Telecommute activity" value="Unavailable" source="Employer / survey records" status="Not calculated" />
        <Row metric="Business classification" value="Unavailable" source="Employer registration" status="Needs review" />
      </div>
    </section>

    <div className="ops-grid two">
      <section className="ops-panel">
        <header><h2>Compliance package</h2></header>
        <div className="r2202-package">
          <p><span>Registration / annual form fields</span><b>Not ready</b></p>
          <p><span>Weekly VMT by Mode values</span><b>Not ready</b></p>
          <p><span>Survey / ZIP source export</span><b>Not ready</b></p>
          <p><span>Validation exceptions</span><b>Not ready</b></p>
          <p><span>Methodology + source record</span><b>Ready</b></p>
        </div>
        <button className="primary" disabled>Generate review package</button>
        <p className="ops-note">Disabled until required employer data and validation checks exist. Relay Rider should generate a review-ready package; actual AQMD submission remains an explicit administrator action unless a supported filing integration is established.</p>
      </section>

      <section className="ops-panel">
        <header><h2>Official references</h2></header>
        <div className="r2202-links">
          <a href="https://www.aqmd.gov/home/programs/business/r2202-forms-guidelines/compliance-forms" target="_blank" rel="noreferrer"><strong>Annual compliance forms</strong><span>Revised forms include business classification, telecommute activity and weekly VMT.</span></a>
          <a href="https://www.aqmd.gov/home/programs/business/r2202-forms-guidelines/survey-forms" target="_blank" rel="noreferrer"><strong>AVR survey forms</strong><span>Official five-day and seven-day English/Spanish survey forms.</span></a>
          <a href="https://xappp.aqmd.gov/VMTCalculator" target="_blank" rel="noreferrer"><strong>Rule 2202 VMT Calculator</strong><span>AQMD survey-data and anonymized ZIP-code calculation pathways.</span></a>
          <a href="https://www.aqmd.gov/home/programs/business/r2202-forms-guidelines" target="_blank" rel="noreferrer"><strong>Rule, guidelines and 2026 factors</strong><span>Current Rule 2202 guidance and emission-factor methodology/tables.</span></a>
        </div>
      </section>
    </div>
  </div>;
}

function Metric({ label, value, note }: { label: string; value: string; note: string }) {
  return <article><small>{label}</small><strong>{value}</strong><span>{note}</span></article>;
}

function ReadOnly({ label, value }: { label: string; value: string }) {
  return <div><span>{label}</span><strong>{value}</strong></div>;
}

function Row({ metric, value, source, status }: { metric: string; value: string; source: string; status: string }) {
  return <div className="row"><span className="strong">{metric}</span><span>{value}</span><span>{source}</span><span>{status}</span></div>;
}

function formatStatus(status: Status) {
  return status.replace("_", " ");
}
