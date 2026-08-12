import { useMemo, useState } from "react";
import "./rule-2202-workspace.css";

type Status = "ready" | "review" | "blocked" | "not_started";
type StepId = "worksite" | "population" | "pathway" | "validation" | "metrics" | "package";
type VmtPathway = "survey" | "zip" | null;
type ValidationFilter = "all" | "blocking" | "review" | "resolved";

type ValidationRule = {
  severity: "blocking" | "review";
  title: string;
  detail: string;
  field: string;
};

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

const validationRules: ValidationRule[] = [
  { severity: "blocking", title: "Missing commute mode", detail: "Required employee-day commute mode is absent.", field: "commute_mode" },
  { severity: "blocking", title: "Missing one-way distance", detail: "Required for survey-based VMT input.", field: "one_way_miles" },
  { severity: "blocking", title: "Invalid or missing ZIP", detail: "Required for ZIP-based VMT input.", field: "home_zip" },
  { severity: "review", title: "Duplicate employee-day", detail: "Potential duplicate needs administrator review.", field: "employee_day" },
  { severity: "review", title: "Unrecognized AQMD mode", detail: "Source value needs normalization to an AQMD reporting mode.", field: "commute_mode" },
  { severity: "review", title: "Population coverage mismatch", detail: "Survey/import population does not reconcile to the confirmed reporting population.", field: "population" },
];

export default function Rule2202Workspace() {
  const [activeStep, setActiveStep] = useState<StepId>("worksite");
  const [pathway, setPathway] = useState<VmtPathway>(null);
  const [reportingYear, setReportingYear] = useState("2026");
  const [worksiteConfirmed, setWorksiteConfirmed] = useState(false);
  const [populationConfirmed, setPopulationConfirmed] = useState(false);
  const [validationFilter, setValidationFilter] = useState<ValidationFilter>("all");
  const [packageReviewed, setPackageReviewed] = useState(false);

  const readiness = useMemo(() => {
    const worksite: Status = worksiteConfirmed ? "ready" : "review";
    const population: Status = populationConfirmed ? "ready" : "blocked";
    const pathwayStatus: Status = pathway ? "ready" : "not_started";
    const validation: Status = populationConfirmed && pathway ? "review" : "not_started";
    const metrics: Status = populationConfirmed && pathway ? "blocked" : "not_started";
    const pkg: Status = packageReviewed ? "ready" : "not_started";
    return [
      { id: "worksite" as StepId, label: "Worksite profile", status: worksite, detail: worksiteConfirmed ? "Worksite reporting profile confirmed for this session." : "Confirm worksite identity, business classification, ETC contact and annual due date." },
      { id: "population" as StepId, label: "Employee population", status: population, detail: populationConfirmed ? "Reporting population marked confirmed for this session." : "No verified employer population dataset is connected." },
      { id: "pathway" as StepId, label: "Survey / ZIP pathway", status: pathwayStatus, detail: pathway ? `${pathway === "survey" ? "AVR survey" : "Anonymized ZIP"} pathway selected.` : "Choose the AQMD AVR survey workflow or anonymized ZIP-code VMT workflow." },
      { id: "validation" as StepId, label: "Validation", status: validation, detail: populationConfirmed && pathway ? "Validation rules are ready; no employer records are connected yet." : "Validation becomes available after population and pathway setup." },
      { id: "metrics" as StepId, label: "AVR & weekly VMT", status: metrics, detail: populationConfirmed && pathway ? "Calculation is blocked until validated employer records exist." : "Metrics require a confirmed population and VMT pathway." },
      { id: "package" as StepId, label: "Compliance package", status: pkg, detail: packageReviewed ? "Package checklist reviewed for this session." : "Review package requirements after required inputs are validated." },
    ];
  }, [packageReviewed, pathway, populationConfirmed, worksiteConfirmed]);

  const passedChecks = readiness.filter((item) => item.status === "ready").length;
  const progress = Math.round((passedChecks / readiness.length) * 100);
  const filteredRules = validationRules.filter((rule) => validationFilter === "all" || validationFilter === rule.severity);

  return <div className="r2202-stack">
    <section className="r2202-hero">
      <div>
        <span className="ops-eyebrow">SOUTH COAST AQMD · RULE 2202</span>
        <h2>Interactive compliance workbench.</h2>
        <p>Move through worksite setup, reporting population, VMT pathway selection, validation, compliance metrics and package readiness. This interface does not fabricate employer records or claim that any filing has been submitted.</p>
      </div>
      <div className="r2202-status-card">
        <small>{reportingYear} REPORTING READINESS</small>
        <strong>{passedChecks} / {readiness.length}</strong>
        <span>workflow checks ready</span>
        <div className="r2202-progress"><i style={{ width: `${progress}%` }} /></div>
        <p>{progress === 100 ? "Workflow setup is complete for this session." : "Complete the highlighted workflow steps before preparing a compliance package."}</p>
      </div>
    </section>

    <section className="r2202-stepper" aria-label="Rule 2202 workflow">
      {readiness.map((item, index) => <button key={item.id} className={activeStep === item.id ? "active" : ""} onClick={() => setActiveStep(item.id)}>
        <span className={`r2202-step-dot ${item.status}`}>{index + 1}</span>
        <span><strong>{item.label}</strong><small>{formatStatus(item.status)}</small></span>
      </button>)}
    </section>

    <section className="ops-panel r2202-workbench-panel">
      {activeStep === "worksite" && <WorksiteStep reportingYear={reportingYear} setReportingYear={setReportingYear} confirmed={worksiteConfirmed} setConfirmed={setWorksiteConfirmed} />}
      {activeStep === "population" && <PopulationStep confirmed={populationConfirmed} setConfirmed={setPopulationConfirmed} />}
      {activeStep === "pathway" && <PathwayStep pathway={pathway} setPathway={setPathway} />}
      {activeStep === "validation" && <ValidationStep pathway={pathway} filter={validationFilter} setFilter={setValidationFilter} rules={filteredRules} />}
      {activeStep === "metrics" && <MetricsStep pathway={pathway} populationConfirmed={populationConfirmed} />}
      {activeStep === "package" && <PackageStep pathway={pathway} worksiteConfirmed={worksiteConfirmed} populationConfirmed={populationConfirmed} reviewed={packageReviewed} setReviewed={setPackageReviewed} />}
    </section>

    <div className="ops-grid two">
      <section className="ops-panel">
        <header><h2>Live readiness checklist</h2><span className="r2202-count">{passedChecks}/{readiness.length} ready</span></header>
        <div className="r2202-readiness compact">
          {readiness.map((item, index) => <button key={item.id} onClick={() => setActiveStep(item.id)}>
            <span className={`r2202-check-icon ${item.status}`}>{item.status === "ready" ? "✓" : index + 1}</span>
            <span><strong>{item.label}</strong><small>{item.detail}</small></span>
            <b className={`r2202-chip ${item.status}`}>{formatStatus(item.status)}</b>
          </button>)}
        </div>
      </section>

      <section className="ops-panel">
        <header><h2>Official references</h2></header>
        <div className="r2202-links">
          <a href="https://www.aqmd.gov/home/programs/business/r2202-forms-guidelines/compliance-forms" target="_blank" rel="noreferrer"><strong>Annual compliance forms</strong><span>Current South Coast AQMD Rule 2202 forms.</span></a>
          <a href="https://www.aqmd.gov/home/programs/business/r2202-forms-guidelines/survey-forms" target="_blank" rel="noreferrer"><strong>AVR survey forms</strong><span>Official five-day and seven-day survey formats.</span></a>
          <a href="https://xappp.aqmd.gov/VMTCalculator" target="_blank" rel="noreferrer"><strong>Rule 2202 VMT Calculator</strong><span>AQMD survey-data and anonymized ZIP-code pathways.</span></a>
          <a href="https://www.aqmd.gov/home/programs/business/r2202-forms-guidelines" target="_blank" rel="noreferrer"><strong>Rule, guidelines and methodology</strong><span>Current Rule 2202 guidance and methodology resources.</span></a>
        </div>
      </section>
    </div>
  </div>;
}

function WorksiteStep({ reportingYear, setReportingYear, confirmed, setConfirmed }: { reportingYear: string; setReportingYear: (value: string) => void; confirmed: boolean; setConfirmed: (value: boolean) => void }) {
  return <div className="r2202-step-content">
    <header><div><span className="ops-eyebrow">STEP 1</span><h2>Worksite profile</h2><p>Define the reporting context before any calculation or package generation.</p></div><b className={`r2202-chip ${confirmed ? "ready" : "review"}`}>{confirmed ? "ready" : "needs review"}</b></header>
    <div className="r2202-field-grid interactive">
      <label><span>Reporting year</span><select value={reportingYear} onChange={(e) => setReportingYear(e.currentTarget.value)}><option>2026</option><option>2027</option></select></label>
      <ReadOnly label="Worksite" value="[NEEDS INSTITUTION INPUT]" />
      <ReadOnly label="Business classification" value="Not confirmed" />
      <ReadOnly label="ETC / site contact" value="Not confirmed" />
      <ReadOnly label="Annual due date" value="Not confirmed" />
      <ReadOnly label="Applicability" value="Needs worksite review" />
    </div>
    <label className="r2202-confirm"><input type="checkbox" checked={confirmed} onChange={(e) => setConfirmed(e.currentTarget.checked)} /><span><strong>Mark worksite profile reviewed</strong><small>Session-only prototype control. It does not save or certify an AQMD filing.</small></span></label>
  </div>;
}

function PopulationStep({ confirmed, setConfirmed }: { confirmed: boolean; setConfirmed: (value: boolean) => void }) {
  return <div className="r2202-step-content">
    <header><div><span className="ops-eyebrow">STEP 2</span><h2>Employee reporting population</h2><p>Rule 2202 metrics must be based on a verified employer worksite population, not Pasadena public context.</p></div><b className={`r2202-chip ${confirmed ? "ready" : "blocked"}`}>{confirmed ? "ready" : "blocked"}</b></header>
    <div className="r2202-empty-state"><strong>No verified employer population is connected.</strong><p>Connect an approved employee roster or governed commute dataset before displaying employee counts, survey coverage, AVR or weekly VMT.</p></div>
    <label className="r2202-confirm"><input type="checkbox" checked={confirmed} onChange={(e) => setConfirmed(e.currentTarget.checked)} /><span><strong>Prototype: mark population source reviewed</strong><small>Use only for UI testing. Production must require a persisted, provenance-tagged employer source.</small></span></label>
  </div>;
}

function PathwayStep({ pathway, setPathway }: { pathway: VmtPathway; setPathway: (value: VmtPathway) => void }) {
  return <div className="r2202-step-content">
    <header><div><span className="ops-eyebrow">STEP 3</span><h2>Select the VMT input pathway</h2><p>The rest of the workflow changes based on the selected AQMD pathway.</p></div><b className={`r2202-chip ${pathway ? "ready" : "not_started"}`}>{pathway ? "selected" : "not started"}</b></header>
    <div className="r2202-path-selector">
      <button className={pathway === "survey" ? "selected" : ""} onClick={() => setPathway("survey")}>
        <span className="r2202-path-letter">A</span><div><strong>AVR survey pathway</strong><p>Use completed 5-day or 7-day employee survey records with commute mode and required one-way mileage inputs.</p><small>{pathway === "survey" ? "Selected" : "Choose pathway"}</small></div>
      </button>
      <button className={pathway === "zip" ? "selected" : ""} onClick={() => setPathway("zip")}>
        <span className="r2202-path-letter">B</span><div><strong>Anonymized ZIP pathway</strong><p>Use anonymized employee home ZIP codes for the applicable reporting population without names or direct identifiers.</p><small>{pathway === "zip" ? "Selected" : "Choose pathway"}</small></div>
      </button>
    </div>
    {pathway && <div className="r2202-selection-summary"><span>Selected workflow</span><strong>{pathway === "survey" ? "AVR survey → validation → AVR/VMT" : "ZIP population → ZIP validation → VMT"}</strong></div>}
  </div>;
}

function ValidationStep({ pathway, filter, setFilter, rules }: { pathway: VmtPathway; filter: ValidationFilter; setFilter: (value: ValidationFilter) => void; rules: ValidationRule[] }) {
  const relevant = rules.filter((rule) => pathway === "survey" ? rule.field !== "home_zip" : pathway === "zip" ? rule.field !== "one_way_miles" : true);
  return <div className="r2202-step-content">
    <header><div><span className="ops-eyebrow">STEP 4</span><h2>Interactive validation console</h2><p>Review the validation rules that will gate calculation once employer records are connected.</p></div><b className="r2202-chip review">rules ready</b></header>
    <div className="r2202-validation-toolbar">
      {(["all", "blocking", "review", "resolved"] as ValidationFilter[]).map((value) => <button key={value} className={filter === value ? "active" : ""} onClick={() => setFilter(value)}>{value}</button>)}
    </div>
    {!pathway && <div className="r2202-empty-state"><strong>Select a VMT pathway first.</strong><p>The validation console will automatically emphasize the fields required for that pathway.</p></div>}
    {pathway && filter === "resolved" && <div className="r2202-empty-state"><strong>No resolved employer issues yet.</strong><p>No employer records are connected, so there is no validation history to display.</p></div>}
    {pathway && filter !== "resolved" && <div className="r2202-validation-table">
      <div className="head"><span>Severity</span><span>Rule</span><span>Field</span><span>Current issues</span></div>
      {relevant.map((rule) => <div className="row" key={rule.title}><span><b className={`r2202-chip ${rule.severity === "blocking" ? "blocked" : "review"}`}>{rule.severity}</b></span><span><strong>{rule.title}</strong><small>{rule.detail}</small></span><code>{rule.field}</code><span>0 · data not connected</span></div>)}
    </div>}
  </div>;
}

function MetricsStep({ pathway, populationConfirmed }: { pathway: VmtPathway; populationConfirmed: boolean }) {
  const canCalculate = Boolean(pathway && populationConfirmed);
  return <div className="r2202-step-content">
    <header><div><span className="ops-eyebrow">STEP 5</span><h2>AVR & weekly VMT</h2><p>Metrics remain unavailable until verified, validated employer data exist.</p></div><b className={`r2202-chip ${canCalculate ? "blocked" : "not_started"}`}>{canCalculate ? "awaiting data" : "not ready"}</b></header>
    <div className="r2202-metric-table">
      <div className="head"><span>Metric</span><span>Current value</span><span>Source</span><span>Status</span></div>
      <Row metric="Peak-window employee population" value="Unavailable" source="Employer worksite records" status={populationConfirmed ? "Source reviewed; data not connected" : "Blocked"} />
      <Row metric="Average Vehicle Ridership (AVR)" value="Unavailable" source="Validated AQMD survey" status={pathway === "survey" ? "Awaiting records" : "Not applicable to selected prototype path"} />
      <Row metric="Weekly VMT by mode" value="Unavailable" source="AQMD VMT pathway" status={pathway ? "Awaiting validated inputs" : "Pathway not selected"} />
      <Row metric="Telecommute activity" value="Unavailable" source="Employer / survey records" status="Not calculated" />
    </div>
  </div>;
}

function PackageStep({ pathway, worksiteConfirmed, populationConfirmed, reviewed, setReviewed }: { pathway: VmtPathway; worksiteConfirmed: boolean; populationConfirmed: boolean; reviewed: boolean; setReviewed: (value: boolean) => void }) {
  const items = [
    ["Worksite registration fields", worksiteConfirmed],
    ["Reporting population source", populationConfirmed],
    ["VMT pathway selected", Boolean(pathway)],
    ["Validated weekly VMT values", false],
    ["Validation exception record", false],
    ["Methodology + source record", true],
    ["Administrator review", reviewed],
  ] as const;
  const ready = items.every(([, value]) => value);
  return <div className="r2202-step-content">
    <header><div><span className="ops-eyebrow">STEP 6</span><h2>Compliance-package readiness</h2><p>Preview every required package component before enabling a review export.</p></div><b className={`r2202-chip ${ready ? "ready" : "blocked"}`}>{ready ? "ready" : "blocked"}</b></header>
    <div className="r2202-package interactive">
      {items.map(([label, value]) => <p key={label}><span><i className={value ? "pass" : "wait"}>{value ? "✓" : "○"}</i>{label}</span><b>{value ? "Ready" : "Not ready"}</b></p>)}
    </div>
    <label className="r2202-confirm"><input type="checkbox" checked={reviewed} onChange={(e) => setReviewed(e.currentTarget.checked)} /><span><strong>Mark administrator checklist reviewed</strong><small>Session-only prototype state; this does not certify or submit an AQMD filing.</small></span></label>
    <button className="primary" disabled={!ready}>Prepare review package</button>
    <p className="ops-note">The production action should remain disabled until verified employer inputs, validation results and calculated reporting values are persisted.</p>
  </div>;
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
