import type { SaasSession } from "./saasApi";

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL ?? "https://dzrqrqfxcihvufvyctbt.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY ?? "sb_publishable_hLCfTlWFEQRkwz5Wv2g_DwoVqPyVq2";

export type EtcStatus = "not_configured" | "draft" | "in_progress" | "blocked" | "ready_for_review" | "reviewed" | "filed" | "archived";
export type EtcStepStatus = "ready" | "review" | "blocked" | "not_started";
export type EtcTaskStatus = "blocking" | "required" | "open" | "complete";

export type EtcDashboardStep = {
  id: "applicability" | "population" | "survey-vmt" | "validation" | "package";
  label: string;
  detail: string;
  status: EtcStepStatus;
};

export type EtcDashboardTask = {
  id: string;
  title: string;
  description: string;
  owner: string;
  due_label: string;
  status: EtcTaskStatus;
};

export type EtcDashboardResponse = {
  status: EtcStatus;
  worksite: {
    organization_id: string;
    site_id: string;
    name: string;
  };
  cycle: {
    id: string;
    reporting_year: number;
    status: string;
    vmt_pathway: "avr_survey" | "anonymized_zip" | null;
    survey_format: "five_day" | "seven_day" | null;
    methodology_version: string;
    annual_due_date: string | null;
    business_classification: string | null;
    etc_contact_name: string | null;
    etc_contact_email: string | null;
  } | null;
  readiness: {
    ready: number;
    total: number;
    percent: number;
    label: string;
  };
  steps: EtcDashboardStep[];
  tasks: EtcDashboardTask[];
  evidence: {
    verified: number;
    self_reported: number;
    needs_correction: number;
    missing: number;
  };
  deadlines: Array<{
    id: string;
    task: string;
    owner: string;
    due: string;
    status: string;
  }>;
  issue_counts: {
    open: number;
    blocking: number;
    review: number;
  };
  calculation_count: number;
  package_ready: boolean;
  generated_at: string;
};

export type Rule2202Issue = {
  id: string;
  reporting_year_id: string;
  source_row_key: string | null;
  rule_code: string;
  severity: "blocking" | "review" | "warning";
  field_name: string | null;
  message: string;
  status: "open" | "resolved" | "excluded" | "accepted";
  resolution_note: string | null;
  resolved_at: string | null;
  resolved_by: string | null;
};

export type Rule2202CalculationRun = {
  id: string;
  reporting_year_id: string;
  calculation_type: "avr" | "weekly_vmt" | "telecommute" | "package_readiness";
  methodology_version: string;
  status: "pending" | "running" | "succeeded" | "failed" | "superseded";
  input_record_count: number;
  excluded_record_count: number;
  result_value: number | null;
  result_unit: string | null;
  result_payload: Record<string, unknown>;
  input_snapshot: Record<string, unknown>;
  error_message: string | null;
  created_at: string;
};

export type Rule2202Package = {
  id: string;
  reporting_year_id: string;
  version: number;
  status: "draft" | "blocked" | "ready_for_review" | "reviewed" | "filed" | "superseded";
  readiness_snapshot: Record<string, unknown>;
  source_snapshot: Record<string, unknown>;
  generated_at: string | null;
  reviewed_at: string | null;
  filed_at: string | null;
  filing_reference: string | null;
};

type ApiError = { message?: string; error_description?: string; msg?: string; details?: string; hint?: string };

function headers(session: SaasSession, extra?: Record<string, string>) {
  return {
    apikey: SUPABASE_PUBLISHABLE_KEY,
    Authorization: `Bearer ${session.access_token}`,
    "Content-Type": "application/json",
    ...extra,
  };
}

async function parse<T>(response: Response): Promise<T> {
  const raw = await response.text();
  let body: unknown = null;
  try {
    body = raw ? JSON.parse(raw) : null;
  } catch {
    body = raw;
  }
  if (!response.ok) {
    const error = (body ?? {}) as ApiError;
    throw new Error(error.message ?? error.error_description ?? error.msg ?? error.details ?? `Request failed (${response.status})`);
  }
  return body as T;
}

async function rpc<T>(session: SaasSession, name: string, body: Record<string, unknown>) {
  const response = await fetch(`${SUPABASE_URL}/rest/v1/rpc/${name}`, {
    method: "POST",
    headers: headers(session),
    body: JSON.stringify(body),
  });
  return parse<T>(response);
}

async function rest<T>(session: SaasSession, path: string, init?: RequestInit, prefer = "return=representation") {
  const response = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, {
    ...init,
    headers: { ...headers(session), Prefer: prefer, ...(init?.headers ?? {}) },
  });
  return parse<T>(response);
}

function encode(value: string) {
  return encodeURIComponent(value);
}

/** GET /rpc/get_rule2202_etc_overview */
export function getEtcOverview(session: SaasSession, organizationId: string, siteId: string, reportingYearId?: string | null) {
  return rpc<EtcDashboardResponse>(session, "get_rule2202_etc_overview", {
    p_org_id: organizationId,
    p_site_id: siteId,
    p_reporting_year_id: reportingYearId ?? null,
  });
}

/** GET /rule2202_reporting_years */
export function listEtcReportingCycles(session: SaasSession, organizationId: string, siteId: string) {
  return rest<Array<EtcDashboardResponse["cycle"]>>(session, `rule2202_reporting_years?organization_id=eq.${encode(organizationId)}&site_id=eq.${encode(siteId)}&select=*&order=reporting_year.desc`);
}

/** PATCH /rule2202_reporting_years?id=eq.{cycleId} */
export function updateEtcReportingCycle(
  session: SaasSession,
  cycleId: string,
  patch: Partial<{
    status: string;
    vmt_pathway: "avr_survey" | "anonymized_zip" | null;
    survey_format: "five_day" | "seven_day" | null;
    annual_due_date: string | null;
    business_classification: string | null;
    etc_contact_name: string | null;
    etc_contact_email: string | null;
    notes: string | null;
  }>,
) {
  return rest<unknown[]>(session, `rule2202_reporting_years?id=eq.${encode(cycleId)}`, {
    method: "PATCH",
    body: JSON.stringify(patch),
  });
}

/** GET /rule2202_validation_issues */
export function listEtcValidationIssues(session: SaasSession, reportingYearId: string) {
  return rest<Rule2202Issue[]>(session, `rule2202_validation_issues?reporting_year_id=eq.${encode(reportingYearId)}&select=*&order=created_at.asc`);
}

/** PATCH /rule2202_validation_issues?id=eq.{issueId} */
export function resolveEtcValidationIssue(session: SaasSession, issueId: string, status: "resolved" | "excluded" | "accepted", resolutionNote: string) {
  return rest<Rule2202Issue[]>(session, `rule2202_validation_issues?id=eq.${encode(issueId)}`, {
    method: "PATCH",
    body: JSON.stringify({
      status,
      resolution_note: resolutionNote.trim(),
      resolved_at: new Date().toISOString(),
      resolved_by: session.user.id,
    }),
  });
}

/** GET /rule2202_calculation_runs */
export function listEtcCalculationRuns(session: SaasSession, reportingYearId: string) {
  return rest<Rule2202CalculationRun[]>(session, `rule2202_calculation_runs?reporting_year_id=eq.${encode(reportingYearId)}&select=*&order=created_at.desc`);
}

/** GET /rule2202_compliance_packages */
export function listEtcPackages(session: SaasSession, reportingYearId: string) {
  return rest<Rule2202Package[]>(session, `rule2202_compliance_packages?reporting_year_id=eq.${encode(reportingYearId)}&select=*&order=version.desc`);
}

/** PATCH /rule2202_compliance_packages?id=eq.{packageId}; intended for review workflow only. */
export function updateEtcPackageStatus(session: SaasSession, packageId: string, status: Rule2202Package["status"], reviewNote?: string) {
  return rest<Rule2202Package[]>(session, `rule2202_compliance_packages?id=eq.${encode(packageId)}`, {
    method: "PATCH",
    body: JSON.stringify({ status, review_note: reviewNote?.trim() || null, reviewed_at: new Date().toISOString(), reviewed_by: session.user.id }),
  });
}
