import type { SaasSession } from "./saasApi";

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL ?? "https://dzrqrqfxcihvufvyctbt.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY ?? "sb_publishable_hLCfTlWFEQRkwKUwz5Wv2g_DwoVqPy1";

export type Invitation = { id: string; invited_email: string; role: string; site_id: string | null; site_role: string | null; cohort_id: string | null; status: string; expires_at: string; created_at: string };
export type InvitationResult = { invitation_id: string; invite_token: string; expires_at: string };
export type MemberDirectoryRow = { user_id: string; email: string; role: string; status: string; member_since: string; site_count: number; cohort_count: number };
export type SiteAssignment = { organization_id: string; site_id: string; user_id: string; role: string; created_at: string };
export type CohortMembership = { organization_id: string; cohort_id: string; user_id: string; status: string; joined_at: string };
export type ProgramSite = { organization_id: string; program_id: string; site_id: string };
export type ProgramCohort = { organization_id: string; program_id: string; cohort_id: string };
export type IngestionRun = { id: string; data_source_id: string | null; import_type: string; file_name: string; content_sha256: string; status: string; row_count: number; valid_row_count: number; invalid_row_count: number; created_at: string; completed_at: string | null };
export type InvalidIngestionRow = { id: string; row_number: number; validation_errors: string[] };
export type IngestionSummary = { run_id: string; row_count: number; valid_row_count: number; invalid_row_count: number; status: string };
export type OperationalTask = { id: string; category: string; status: string; priority: string; title: string; detail: string | null; subject_type: string | null; subject_id: string | null; assigned_to: string | null; due_at: string | null; created_at: string; resolved_at: string | null };
export type CorridorSummary = { origin_zone: string; destination_zone: string; signal_count: number; imported_signal_count: number; authenticated_signal_count: number; parking_pressure_count: number; access_point_interest_count: number; ev_hybrid_interest_count: number; travel_days: number[]; average_parking_difficulty: number | null; latest_signal_at: string };
export type MatchQueueRow = { id: string; origin_zone: string; destination_zone: string; compatibility_score: number | null; route_fit_score: number | null; time_window_fit: string | null; contribution_compatibility: string | null; ev_hybrid_indicator: string | null; explanation: Record<string, unknown>; status: string; generated_at: string; expires_at: string | null };

type ApiError = { message?: string; error_description?: string; msg?: string; details?: string; hint?: string };

function headers(session: SaasSession, extra?: Record<string,string>) {
  return { apikey: SUPABASE_PUBLISHABLE_KEY, Authorization: `Bearer ${session.access_token}`, "Content-Type": "application/json", ...extra };
}

async function parse<T>(response: Response): Promise<T> {
  const raw = await response.text();
  const body = raw ? JSON.parse(raw) : null;
  if (!response.ok) {
    const err = (body ?? {}) as ApiError;
    throw new Error(err.message ?? err.error_description ?? err.msg ?? err.details ?? `Request failed (${response.status})`);
  }
  return body as T;
}

async function rest<T>(session: SaasSession, path: string, init?: RequestInit, prefer = "return=representation") {
  const response = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, { ...init, headers: { ...headers(session), Prefer: prefer, ...(init?.headers ?? {}) } });
  return parse<T>(response);
}

async function rpc<T>(session: SaasSession, name: string, body: Record<string,unknown>) {
  const response = await fetch(`${SUPABASE_URL}/rest/v1/rpc/${name}`, { method: "POST", headers: headers(session), body: JSON.stringify(body) });
  return parse<T>(response);
}

export function listInvitations(session: SaasSession, organizationId: string) {
  return rest<Invitation[]>(session, `organization_invitations?organization_id=eq.${organizationId}&select=id,invited_email,role,site_id,site_role,cohort_id,status,expires_at,created_at&order=created_at.desc`);
}

export async function createInvitation(session: SaasSession, organizationId: string, input: { email: string; role: string; siteId?: string | null; siteRole?: string | null; cohortId?: string | null; expiresDays?: number }) {
  const rows = await rpc<InvitationResult[]>(session, "create_organization_invitation", { org_id: organizationId, invite_email: input.email, invite_role: input.role, invite_site_id: input.siteId ?? null, invite_site_role: input.siteRole ?? null, invite_cohort_id: input.cohortId ?? null, expires_days: input.expiresDays ?? 7 });
  if (!rows[0]) throw new Error("Invitation was not created.");
  return rows[0];
}

export function acceptInvitation(session: SaasSession, token: string) {
  return rpc<string>(session, "accept_organization_invitation", { invite_token: token });
}

export function getMemberDirectory(session: SaasSession, organizationId: string) {
  return rpc<MemberDirectoryRow[]>(session, "get_organization_member_directory", { org_id: organizationId });
}

export function updateMember(session: SaasSession, organizationId: string, userId: string, role: string, status: string) {
  return rpc<null>(session, "update_organization_member", { org_id: organizationId, target_user_id: userId, new_role: role, new_status: status });
}

export function listSiteAssignments(session: SaasSession, organizationId: string) {
  return rest<SiteAssignment[]>(session, `organization_member_sites?organization_id=eq.${organizationId}&select=organization_id,site_id,user_id,role,created_at&order=created_at.asc`);
}

export function assignSite(session: SaasSession, organizationId: string, siteId: string, userId: string, role: string) {
  return rest<SiteAssignment[]>(session, "organization_member_sites?on_conflict=site_id,user_id", { method: "POST", body: JSON.stringify({ organization_id: organizationId, site_id: siteId, user_id: userId, role }) }, "resolution=merge-duplicates,return=representation");
}

export function removeSiteAssignment(session: SaasSession, siteId: string, userId: string) {
  return rest<SiteAssignment[]>(session, `organization_member_sites?site_id=eq.${siteId}&user_id=eq.${userId}`, { method: "DELETE" });
}

export function listCohortMemberships(session: SaasSession, organizationId: string) {
  return rest<CohortMembership[]>(session, `cohort_members?organization_id=eq.${organizationId}&select=organization_id,cohort_id,user_id,status,joined_at&order=joined_at.asc`);
}

export function enrollCohortMember(session: SaasSession, organizationId: string, cohortId: string, userId: string) {
  return rest<CohortMembership[]>(session, "cohort_members?on_conflict=cohort_id,user_id", { method: "POST", body: JSON.stringify({ organization_id: organizationId, cohort_id: cohortId, user_id: userId, status: "active" }) }, "resolution=merge-duplicates,return=representation");
}

export function removeCohortMember(session: SaasSession, cohortId: string, userId: string) {
  return rest<CohortMembership[]>(session, `cohort_members?cohort_id=eq.${cohortId}&user_id=eq.${userId}`, { method: "DELETE" });
}

export function listProgramSites(session: SaasSession, organizationId: string) {
  return rest<ProgramSite[]>(session, `program_sites?organization_id=eq.${organizationId}&select=organization_id,program_id,site_id`);
}

export function assignProgramSite(session: SaasSession, organizationId: string, programId: string, siteId: string) {
  return rest<ProgramSite[]>(session, "program_sites?on_conflict=program_id,site_id", { method: "POST", body: JSON.stringify({ organization_id: organizationId, program_id: programId, site_id: siteId }) }, "resolution=merge-duplicates,return=representation");
}

export function removeProgramSite(session: SaasSession, programId: string, siteId: string) {
  return rest<ProgramSite[]>(session, `program_sites?program_id=eq.${programId}&site_id=eq.${siteId}`, { method: "DELETE" });
}

export function listProgramCohorts(session: SaasSession, organizationId: string) {
  return rest<ProgramCohort[]>(session, `program_cohorts?organization_id=eq.${organizationId}&select=organization_id,program_id,cohort_id`);
}

export function assignProgramCohort(session: SaasSession, organizationId: string, programId: string, cohortId: string) {
  return rest<ProgramCohort[]>(session, "program_cohorts?on_conflict=program_id,cohort_id", { method: "POST", body: JSON.stringify({ organization_id: organizationId, program_id: programId, cohort_id: cohortId }) }, "resolution=merge-duplicates,return=representation");
}

export function removeProgramCohort(session: SaasSession, programId: string, cohortId: string) {
  return rest<ProgramCohort[]>(session, `program_cohorts?program_id=eq.${programId}&cohort_id=eq.${cohortId}`, { method: "DELETE" });
}

export function listIngestionRuns(session: SaasSession, organizationId: string) {
  return rest<IngestionRun[]>(session, `ingestion_runs?organization_id=eq.${organizationId}&select=id,data_source_id,import_type,file_name,content_sha256,status,row_count,valid_row_count,invalid_row_count,created_at,completed_at&order=created_at.desc&limit=50`);
}

export function listInvalidRows(session: SaasSession, runId: string) {
  return rest<InvalidIngestionRow[]>(session, `ingestion_rows?ingestion_run_id=eq.${runId}&is_valid=eq.false&select=id,row_number,validation_errors&order=row_number.asc&limit=250`);
}

export async function importRoster(session: SaasSession, organizationId: string, input: { cohortId: string; sourceId?: string | null; fileName: string; hash: string; rows: Record<string,unknown>[]; siteId?: string | null }) {
  const result = await rpc<IngestionSummary[]>(session, "import_cohort_roster", { org_id: organizationId, cohort_id: input.cohortId, source_id: input.sourceId ?? null, file_name: input.fileName, content_sha256: input.hash, rows: input.rows, default_site_id: input.siteId ?? null });
  if (!result[0]) throw new Error("Roster import did not return a run summary.");
  return result[0];
}

export async function importCommuteRecords(session: SaasSession, organizationId: string, input: { sourceId?: string | null; fileName: string; hash: string; rows: Record<string,unknown>[]; siteId?: string | null; cohortId?: string | null }) {
  const result = await rpc<IngestionSummary[]>(session, "import_commute_records", { org_id: organizationId, source_id: input.sourceId ?? null, file_name: input.fileName, content_sha256: input.hash, rows: input.rows, default_site_id: input.siteId ?? null, default_cohort_id: input.cohortId ?? null });
  if (!result[0]) throw new Error("Commute import did not return a run summary.");
  return result[0];
}

export function listTasks(session: SaasSession, organizationId: string) {
  return rest<OperationalTask[]>(session, `operational_tasks?organization_id=eq.${organizationId}&select=id,category,status,priority,title,detail,subject_type,subject_id,assigned_to,due_at,created_at,resolved_at&order=created_at.desc&limit=250`);
}

export function updateTask(session: SaasSession, taskId: string, status: string) {
  return rest<OperationalTask[]>(session, `operational_tasks?id=eq.${taskId}`, { method: "PATCH", body: JSON.stringify({ status, resolved_at: status === "resolved" ? new Date().toISOString() : null }) });
}

export function getCorridorIntelligence(session: SaasSession, organizationId: string, minGroupSize = 3) {
  return rpc<CorridorSummary[]>(session, "get_corridor_intelligence", { org_id: organizationId, min_group_size: minGroupSize });
}

export function generateMatchPreviews(session: SaasSession, organizationId: string, maxPerNeed = 5) {
  return rpc<number>(session, "generate_deterministic_match_previews", { org_id: organizationId, max_results_per_need: maxPerNeed });
}

export function getMatchQueue(session: SaasSession, organizationId: string) {
  return rpc<MatchQueueRow[]>(session, "get_match_preview_admin_queue", { org_id: organizationId });
}
