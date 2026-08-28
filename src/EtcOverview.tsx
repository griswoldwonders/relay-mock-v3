import * as React from "react";

export type ReadinessStatus = "ready" | "review" | "blocked" | "not_started";

export type AnnualCycleStep = {
  id: string;
  label: string;
  detail: string;
  status: ReadinessStatus;
};

export type EtcTask = {
  id: string;
  title: string;
  description: string;
  owner: string;
  dueLabel: string;
  status: "blocking" | "required" | "open" | "complete";
};

export type EvidenceHealth = {
  verified: number;
  selfReported: number;
  needsCorrection: number;
  missing: number;
};

export type EtcOverviewData = {
  worksiteName: string;
  reportingYear: number;
  cycleLabel: string;
  readinessReady: number;
  readinessTotal: number;
  readinessLabel: string;
  nextAction: {
    title: string;
    description: string;
    actionLabel: string;
  };
  steps: AnnualCycleStep[];
  tasks: EtcTask[];
  evidence: EvidenceHealth;
  deadlines: Array<{
    id: string;
    task: string;
    owner: string;
    due: string;
    status: string;
  }>;
  publicContext?: {
    driveAlone: string;
    carpool: string;
    transit: string;
    travelTime: string;
  };
};

export type EtcOverviewProps = {
  data: EtcOverviewData;
  isLoading?: boolean;
  error?: string | null;
  onOpenNextAction?: () => void;
  onOpenStep?: (stepId: string) => void;
  onOpenTasks?: () => void;
  onOpenEvidence?: () => void;
  onExportStatusBrief?: () => void;
  onRetry?: () => void;
};

const statusCopy: Record<ReadinessStatus, string> = {
  ready: "Ready",
  review: "Needs review",
  blocked: "Blocked",
  not_started: "Not started",
};

const statusClasses: Record<ReadinessStatus, string> = {
  ready: "bg-emerald-50 text-emerald-800 ring-emerald-200",
  review: "bg-amber-50 text-amber-800 ring-amber-200",
  blocked: "bg-rose-50 text-rose-800 ring-rose-200",
  not_started: "bg-slate-100 text-slate-600 ring-slate-200",
};

function cx(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

function Icon({ name, className = "h-4 w-4" }: { name: "arrow" | "check" | "alert" | "file" | "chevron" | "refresh"; className?: string }) {
  const common = { className, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 1.8, strokeLinecap: "round" as const, strokeLinejoin: "round" as const, "aria-hidden": true };
  if (name === "arrow") return <svg {...common}><path d="M5 12h13" /><path d="m13 6 6 6-6 6" /></svg>;
  if (name === "check") return <svg {...common}><path d="m5 12 4 4L19 6" /></svg>;
  if (name === "alert") return <svg {...common}><path d="M12 9v4" /><path d="M12 17h.01" /><path d="M10.3 3.9 2.4 18a2 2 0 0 0 1.7 3h15.8a2 2 0 0 0 1.7-3l-7.9-14.1a2 2 0 0 0-3.4 0Z" /></svg>;
  if (name === "file") return <svg {...common}><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8Z" /><path d="M14 2v6h6" /><path d="M8 13h8M8 17h6" /></svg>;
  if (name === "refresh") return <svg {...common}><path d="M20 11a8.1 8.1 0 0 0-14.8-3L3 11" /><path d="M3 5v6h6" /><path d="M4 13a8.1 8.1 0 0 0 14.8 3L21 13" /><path d="M21 19v-6h-6" /></svg>;
  return <svg {...common}><path d="m9 18 6-6-6-6" /></svg>;
}

function Button({ children, variant = "secondary", ...props }: React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: "primary" | "secondary" | "quiet" }) {
  return (
    <button
      {...props}
      className={cx(
        "inline-flex min-h-10 items-center justify-center gap-2 rounded-lg px-3.5 text-sm font-semibold transition active:scale-[.98] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-teal-100 disabled:cursor-not-allowed disabled:opacity-50",
        variant === "primary" && "bg-[#0d7c76] text-white shadow-sm shadow-teal-900/10 hover:bg-[#075e5b]",
        variant === "secondary" && "border border-slate-300 bg-white text-slate-700 hover:border-slate-400 hover:bg-slate-50",
        variant === "quiet" && "text-[#0d7c76] hover:bg-teal-50",
        props.className,
      )}
    >
      {children}
    </button>
  );
}

function StatusPill({ status }: { status: ReadinessStatus }) {
  return <span className={cx("inline-flex items-center rounded-full px-2 py-1 text-[11px] font-bold ring-1 ring-inset", statusClasses[status])}>{statusCopy[status]}</span>;
}

export function AnnualCycleRail({ steps, activeStepId, onSelect }: { steps: AnnualCycleStep[]; activeStepId?: string; onSelect?: (stepId: string) => void }) {
  return (
    <section aria-labelledby="annual-cycle-title" className="rounded-xl border border-slate-200 bg-white p-5 shadow-[0_1px_2px_rgba(18,38,43,.04),0_5px_16px_rgba(18,38,43,.04)]">
      <div className="mb-5 flex items-center justify-between gap-4">
        <div>
          <h2 id="annual-cycle-title" className="font-[Space_Grotesk] text-base font-semibold tracking-[-.02em] text-[#17252b]">Annual cycle</h2>
          <p className="mt-1 text-xs text-slate-500">The persisted workflow for this reporting cycle.</p>
        </div>
        <Button variant="quiet" onClick={() => onSelect?.(steps[0]?.id)} aria-label="View annual cycle details">View details <Icon name="arrow" className="h-3.5 w-3.5" /></Button>
      </div>
      <ol className="grid gap-2 md:grid-cols-5" aria-label="Rule 2202 annual cycle progress">
        {steps.map((step, index) => (
          <li key={step.id} className="relative">
            {index < steps.length - 1 && <span aria-hidden="true" className="absolute left-8 right-[-8px] top-4 hidden h-px bg-slate-200 md:block" />}
            <button type="button" onClick={() => onSelect?.(step.id)} className={cx("group relative flex w-full items-start gap-3 rounded-lg p-2 text-left transition hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-teal-100", activeStepId === step.id && "bg-teal-50/70") } aria-current={activeStepId === step.id ? "step" : undefined}>
              <span className={cx("z-10 grid h-8 w-8 shrink-0 place-items-center rounded-full border text-xs font-bold", step.status === "ready" && "border-emerald-600 bg-emerald-600 text-white", step.status === "blocked" && "border-rose-200 bg-rose-50 text-rose-700", step.status === "review" && "border-amber-200 bg-amber-50 text-amber-700", step.status === "not_started" && "border-slate-300 bg-white text-slate-500")}>{step.status === "ready" ? <Icon name="check" className="h-4 w-4" /> : index + 1}</span>
              <span className="min-w-0 pt-0.5"><span className="block text-xs font-bold text-slate-800">{step.label}</span><span className="mt-1 block text-[11px] text-slate-500">{statusCopy[step.status]}</span></span>
            </button>
          </li>
        ))}
      </ol>
    </section>
  );
}

function LoadingOverview() {
  return <div className="space-y-4" aria-label="Loading ETC overview" aria-busy="true"><div className="h-52 animate-pulse rounded-2xl bg-slate-200" /><div className="h-32 animate-pulse rounded-xl bg-slate-200" /><div className="grid gap-4 md:grid-cols-2"><div className="h-48 animate-pulse rounded-xl bg-slate-200" /><div className="h-48 animate-pulse rounded-xl bg-slate-200" /></div></div>;
}

function ErrorOverview({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return <div role="alert" className="rounded-xl border border-rose-200 bg-rose-50 p-6 text-rose-900"><div className="flex items-start gap-3"><Icon name="alert" className="mt-0.5 h-5 w-5 shrink-0" /><div><h2 className="font-semibold">The ETC overview could not load</h2><p className="mt-1 text-sm text-rose-800">{message}</p>{onRetry && <Button className="mt-4" onClick={onRetry}> <Icon name="refresh" className="h-4 w-4" /> Try again</Button>}</div></div></div>;
}

export function EtcOverview({ data, isLoading = false, error = null, onOpenNextAction, onOpenStep, onOpenTasks, onOpenEvidence, onExportStatusBrief, onRetry }: EtcOverviewProps) {
  if (isLoading) return <LoadingOverview />;
  if (error) return <ErrorOverview message={error} onRetry={onRetry} />;

  const progress = data.readinessTotal === 0 ? 0 : Math.round((data.readinessReady / data.readinessTotal) * 100);
  const blockerCount = data.tasks.filter((task) => task.status === "blocking").length;
  const evidenceTotal = Object.values(data.evidence).reduce((sum, value) => sum + value, 0);

  return (
    <main className="min-w-0 space-y-5 bg-[#f5f8f7] p-4 text-[#17252b] sm:p-6 lg:p-8" aria-labelledby="etc-overview-title">
      <header className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div><p className="text-[11px] font-bold uppercase tracking-[.14em] text-[#0d7c76]">ETC overview</p><h1 id="etc-overview-title" className="mt-2 font-[Space_Grotesk] text-2xl font-bold tracking-[-.05em] sm:text-3xl">{data.reportingYear} Rule 2202 annual cycle</h1><p className="mt-2 text-sm text-slate-600">{data.worksiteName} · {data.cycleLabel}</p></div>
        <Button variant="secondary" onClick={onExportStatusBrief}><Icon name="file" className="h-4 w-4" /> Export status brief</Button>
      </header>

      <section className="grid gap-4 lg:grid-cols-[minmax(0,1.35fr)_minmax(300px,.65fr)]">
        <div className="rounded-2xl border border-[#cfe0de] bg-gradient-to-br from-[#eef9f6] to-white p-6 shadow-[0_1px_2px_rgba(18,38,43,.04),0_5px_16px_rgba(18,38,43,.04)] sm:p-8"><p className="text-[11px] font-bold uppercase tracking-[.13em] text-[#0d7c76]">Reporting readiness</p><div className="mt-4 flex items-end gap-3"><span className="font-[Space_Grotesk] text-5xl font-bold tracking-[-.07em] text-[#17343b]">{data.readinessReady} / {data.readinessTotal}</span><span className="pb-1 text-sm text-slate-500">checks ready</span></div><div className="mt-5 h-2 overflow-hidden rounded-full bg-[#d7ebe7]" role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={progress} aria-label="Reporting readiness"><span className="block h-full rounded-full bg-[#0d7c76] transition-[width] duration-300" style={{ width: `${progress}%` }} /></div><p className="mt-3 text-sm text-slate-600">{data.readinessLabel}</p></div>
        <div className="flex flex-col rounded-2xl border border-[#ead8b9] bg-[#fffaf1] p-6 shadow-[0_1px_2px_rgba(18,38,43,.04),0_5px_16px_rgba(18,38,43,.04)]"><p className="text-[11px] font-bold uppercase tracking-[.13em] text-[#a86612]">Next action</p><h2 className="mt-4 font-[Space_Grotesk] text-xl font-bold tracking-[-.04em] text-[#6e4712]">{data.nextAction.title}</h2><p className="mt-2 flex-1 text-sm leading-6 text-[#866e4e]">{data.nextAction.description}</p><Button className="mt-5 w-full sm:w-auto" variant="primary" onClick={onOpenNextAction}>{data.nextAction.actionLabel} <Icon name="arrow" className="h-4 w-4" /></Button></div>
      </section>

      <AnnualCycleRail steps={data.steps} onSelect={onOpenStep} />

      <section className="grid gap-4 lg:grid-cols-2">
        <article className="rounded-xl border border-slate-200 bg-white p-5 shadow-[0_1px_2px_rgba(18,38,43,.04),0_5px_16px_rgba(18,38,43,.04)]"><div className="mb-3 flex items-center justify-between gap-3"><h2 className="font-[Space_Grotesk] text-base font-semibold tracking-[-.02em]">Open work items</h2><span className="rounded-full bg-rose-50 px-2 py-1 text-[11px] font-bold text-rose-800">{blockerCount} blocking</span></div><div className="divide-y divide-slate-100">{data.tasks.slice(0, 4).map((task) => <button type="button" key={task.id} onClick={onOpenTasks} className="flex w-full items-start justify-between gap-4 py-3 text-left first:pt-1 hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-teal-100"><span className="flex min-w-0 gap-2"><Icon name={task.status === "blocking" ? "alert" : "file"} className={cx("mt-0.5 h-4 w-4 shrink-0", task.status === "blocking" ? "text-rose-600" : "text-slate-400")} /><span><span className="block text-sm font-semibold text-slate-800">{task.title}</span><span className="mt-1 block text-xs leading-5 text-slate-500">{task.description}</span></span></span><span className={cx("shrink-0 rounded-full px-2 py-1 text-[11px] font-bold", task.status === "blocking" ? "bg-rose-50 text-rose-800" : task.status === "complete" ? "bg-emerald-50 text-emerald-800" : "bg-amber-50 text-amber-800")}>{task.status}</span></button>)}</div><Button variant="quiet" className="mt-3" onClick={onOpenTasks}>Open review queue <Icon name="arrow" className="h-3.5 w-3.5" /></Button></article>
        <article className="rounded-xl border border-slate-200 bg-white p-5 shadow-[0_1px_2px_rgba(18,38,43,.04),0_5px_16px_rgba(18,38,43,.04)]"><div className="mb-3 flex items-center justify-between gap-3"><div><h2 className="font-[Space_Grotesk] text-base font-semibold tracking-[-.02em]">Evidence health</h2><p className="mt-1 text-xs text-slate-500">{evidenceTotal} evidence records in this cycle</p></div><Button variant="quiet" onClick={onOpenEvidence}>Open vault <Icon name="arrow" className="h-3.5 w-3.5" /></Button></div><div className="grid grid-cols-2 gap-2 sm:grid-cols-4">{([ ["Verified", data.evidence.verified, "text-emerald-700 bg-emerald-50"], ["Self-reported", data.evidence.selfReported, "text-slate-700 bg-slate-100"], ["Needs correction", data.evidence.needsCorrection, "text-amber-800 bg-amber-50"], ["Missing", data.evidence.missing, "text-rose-800 bg-rose-50"] ] as const).map(([label, value, classes]) => <div key={label} className={cx("rounded-lg p-3", classes)}><strong className="block font-[Space_Grotesk] text-2xl tracking-[-.04em]">{value}</strong><span className="mt-1 block text-[11px] font-semibold">{label}</span></div>)}</div><p className="mt-4 text-xs leading-5 text-slate-500">Evidence becomes package-eligible only after the required review decision is recorded.</p></article>
      </section>

      <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-[0_1px_2px_rgba(18,38,43,.04),0_5px_16px_rgba(18,38,43,.04)]"><div className="flex items-center justify-between gap-4 border-b border-slate-100 p-5"><div><h2 className="font-[Space_Grotesk] text-base font-semibold tracking-[-.02em]">Deadlines & owners</h2><p className="mt-1 text-xs text-slate-500">Tasks that keep the current annual cycle moving.</p></div></div><div className="overflow-x-auto"><table className="w-full min-w-[620px] text-left text-xs"><thead className="bg-slate-50 text-[10px] uppercase tracking-[.1em] text-slate-500"><tr><th scope="col" className="px-5 py-3 font-bold">Task</th><th scope="col" className="px-5 py-3 font-bold">Owner</th><th scope="col" className="px-5 py-3 font-bold">Due date</th><th scope="col" className="px-5 py-3 font-bold">Status</th></tr></thead><tbody className="divide-y divide-slate-100">{data.deadlines.map((row) => <tr key={row.id} className="text-slate-700"><th scope="row" className="px-5 py-3 font-semibold">{row.task}</th><td className="px-5 py-3 text-slate-500">{row.owner}</td><td className="px-5 py-3 text-slate-500">{row.due}</td><td className="px-5 py-3"><span className="rounded-full bg-slate-100 px-2 py-1 text-[11px] font-semibold text-slate-600">{row.status}</span></td></tr>)}</tbody></table></div></section>

      {data.publicContext && <details className="group rounded-xl border border-slate-200 bg-white shadow-[0_1px_2px_rgba(18,38,43,.04),0_5px_16px_rgba(18,38,43,.04)]"><summary className="flex cursor-pointer list-none items-center justify-between gap-4 p-5 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-teal-100"><span><span className="block text-[10px] font-bold uppercase tracking-[.12em] text-slate-500">Public Pasadena context</span><span className="mt-1 block text-xs text-slate-500">Context only — not employer compliance evidence.</span></span><Icon name="chevron" className="h-4 w-4 text-slate-400 transition group-open:rotate-90" /></summary><div className="grid grid-cols-2 gap-2 border-t border-slate-100 p-5 sm:grid-cols-4">{Object.entries(data.publicContext).map(([key, value]) => <div key={key} className="rounded-lg bg-slate-50 p-3"><strong className="block font-[Space_Grotesk] text-lg">{value}</strong><span className="mt-1 block text-[11px] capitalize text-slate-500">{key.replace(/([A-Z])/g, " $1")}</span></div>)}</div></details>}
    </main>
  );
}

export const etcOverviewFixture: EtcOverviewData = {
  worksiteName: "Pasadena Worksite A",
  reportingYear: 2026,
  cycleLabel: "South Coast AQMD · ETC workspace",
  readinessReady: 2,
  readinessTotal: 6,
  readinessLabel: "Needs employer data before a package can be prepared.",
  nextAction: { title: "Confirm worksite profile", description: "Worksite employee count, ETC contact, business classification, and due date are missing.", actionLabel: "Open worksite profile" },
  steps: [
    { id: "applicability", label: "Applicability", detail: "Confirm subjectivity", status: "blocked" },
    { id: "population", label: "Population", detail: "Connect employee count", status: "not_started" },
    { id: "survey-vmt", label: "Survey / VMT", detail: "Select pathway", status: "not_started" },
    { id: "validation", label: "Validate", detail: "Resolve issues", status: "not_started" },
    { id: "package", label: "Package", detail: "Prepare draft", status: "not_started" },
  ],
  tasks: [
    { id: "profile", title: "Confirm worksite applicability", description: "Address, employee population, classification, ETC, and due date.", owner: "ETC", dueLabel: "Not confirmed", status: "blocking" },
    { id: "pathway", title: "Select VMT reporting pathway", description: "Choose AVR survey or anonymized ZIP-code workflow.", owner: "ETC", dueLabel: "Not scheduled", status: "required" },
    { id: "population", title: "Connect employee commute data", description: "Required before AVR or weekly VMT values can be calculated.", owner: "Analyst", dueLabel: "Not scheduled", status: "required" },
  ],
  evidence: { verified: 0, selfReported: 0, needsCorrection: 0, missing: 4 },
  deadlines: [
    { id: "1", task: "Confirm worksite profile", owner: "ETC", due: "Not confirmed", status: "Blocking" },
    { id: "2", task: "Launch commute survey", owner: "ETC", due: "Not scheduled", status: "Not started" },
    { id: "3", task: "Review imported commute data", owner: "Analyst", due: "Not scheduled", status: "Not started" },
    { id: "4", task: "Approve draft package", owner: "Responsible official", due: "—", status: "Not started" },
  ],
  publicContext: { driveAlone: "56%", carpool: "5%", transit: "6%", travelTime: "29 min" },
};
