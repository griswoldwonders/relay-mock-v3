import type { SaasSession } from "./saasApi";

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL ?? "https://dzrqrqfxcihvufvyctbt.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY ?? "sb_publishable_hLCfTlWFEQRkwKUwz5Wv2g_DwoVqPy1";

export type MatchReviewQueueRow = {
  id: string;
  origin_zone: string;
  destination_zone: string;
  compatibility_score: number | null;
  route_fit_score: number | null;
  time_window_fit: string | null;
  contribution_compatibility: string | null;
  ev_hybrid_indicator: string | null;
  explanation: Record<string, unknown>;
  status: string;
  generated_at: string;
  expires_at: string | null;
};

export type AdministrativeReview = {
  id: string;
  match_preview_id: string;
  organization_id: string;
  reviewer_id: string | null;
  decision: "pending" | "request_changes" | "approved_for_review" | "declined" | "withdrawn";
  rationale: string | null;
  conditions: Record<string, unknown>;
  reviewed_at: string | null;
  created_at: string;
};

function headers(session: SaasSession) {
  return {
    apikey: SUPABASE_PUBLISHABLE_KEY,
    Authorization: `Bearer ${session.access_token}`,
    "Content-Type": "application/json",
    Accept: "application/json",
  };
}

async function parse<T>(response: Response): Promise<T> {
  const raw = await response.text();
  let body: unknown = null;
  if (raw) {
    try { body = JSON.parse(raw); } catch { body = raw; }
  }
  if (!response.ok) {
    const record = body && typeof body === "object" ? body as Record<string, unknown> : null;
    const message = (record?.message as string | undefined) ?? (record?.hint as string | undefined) ?? `Request failed (${response.status}).`;
    throw new Error(message);
  }
  return body as T;
}

export async function generateMatchPreviews(session: SaasSession, organizationId: string, maxResultsPerNeed = 5) {
  return parse<number>(await fetch(`${SUPABASE_URL}/rest/v1/rpc/generate_deterministic_match_previews`, {
    method: "POST",
    headers: headers(session),
    body: JSON.stringify({ org_id: organizationId, max_results_per_need: maxResultsPerNeed }),
  }));
}

export async function getMatchReviewQueue(session: SaasSession, organizationId: string) {
  return parse<MatchReviewQueueRow[]>(await fetch(`${SUPABASE_URL}/rest/v1/rpc/get_match_preview_admin_queue`, {
    method: "POST",
    headers: headers(session),
    body: JSON.stringify({ org_id: organizationId }),
  }));
}

export async function listAdministrativeReviews(session: SaasSession, organizationId: string) {
  const query = new URLSearchParams({
    organization_id: `eq.${organizationId}`,
    select: "id,match_preview_id,organization_id,reviewer_id,decision,rationale,conditions,reviewed_at,created_at",
    order: "created_at.desc",
  });
  return parse<AdministrativeReview[]>(await fetch(`${SUPABASE_URL}/rest/v1/administrative_reviews?${query.toString()}`, {
    headers: headers(session),
  }));
}

export async function recordAdministrativeReview(
  session: SaasSession,
  organizationId: string,
  matchPreviewId: string,
  input: {
    decision: AdministrativeReview["decision"];
    rationale?: string;
    conditions?: Record<string, unknown>;
  },
) {
  return parse<AdministrativeReview[]>(await fetch(`${SUPABASE_URL}/rest/v1/administrative_reviews`, {
    method: "POST",
    headers: { ...headers(session), Prefer: "return=representation" },
    body: JSON.stringify({
      match_preview_id: matchPreviewId,
      organization_id: organizationId,
      reviewer_id: session.user.id,
      decision: input.decision,
      rationale: input.rationale?.trim() || null,
      conditions: input.conditions ?? {},
      reviewed_at: new Date().toISOString(),
    }),
  }));
}
