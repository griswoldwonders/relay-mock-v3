const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL ?? "https://dzrqrqfxcihvufvyctbt.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY ?? "sb_publishable_hLCfTlWFEQRkwKUwz5Wv2g_DwoVqPy1";

const TOKEN_KEY = "relay-rider-research-participant-token";
const SUBMISSION_ID_KEY = "relay-rider-research-submission-id";

export const CONSENT_VERSION = "research-beta-v1-2026-08-07";

export type ResearchSubmissionPayload = {
  submissionType: "commute_need" | "planned_route";
  consentVersion: string;
  age18Plus: boolean;
  dataConsent: boolean;
  prototypeAcknowledged: boolean;
  originZone: string;
  destinationZone: string;
  days: string[];
  arrivalStart: string;
  arrivalEnd: string;
  returnStart: string;
  returnEnd: string;
  flexibilityMinutes: number | null;
  currentMode: string;
  parkingDifficulty: string;
  accessPointWilling: boolean;
  preferredAccessPoint: string;
  transitPreference: string;
  evPreference: string;
  accessibilityNotes: string;
  contributionBand: string;
  capacity: number | null;
  maxDetourMinutes: number | null;
  plannedRouteNote: string;
  approximateZones: boolean;
  maskedContact: boolean;
};

export type ResearchSubmissionRecord = ResearchSubmissionPayload & {
  id: string;
  participantRef: string;
  status: "submitted" | "withdrawn";
  createdAt: string;
  updatedAt: string;
  withdrawnAt: string | null;
};

type RpcErrorShape = {
  message?: string;
  details?: string;
  hint?: string;
};

function getStorage() {
  return typeof window === "undefined" ? null : window.localStorage;
}

export function getOrCreateParticipantToken() {
  const storage = getStorage();
  if (!storage) return "";
  const existing = storage.getItem(TOKEN_KEY);
  if (existing) return existing;

  const bytes = new Uint8Array(32);
  crypto.getRandomValues(bytes);
  const token = Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0")).join("");
  storage.setItem(TOKEN_KEY, token);
  return token;
}

export function getStoredSubmissionId() {
  return getStorage()?.getItem(SUBMISSION_ID_KEY) ?? null;
}

export function storeSubmissionId(id: string) {
  getStorage()?.setItem(SUBMISSION_ID_KEY, id);
}

export function clearStoredSubmission() {
  getStorage()?.removeItem(SUBMISSION_ID_KEY);
}

async function rpc<T>(name: string, body: Record<string, unknown>): Promise<T> {
  const response = await fetch(`${SUPABASE_URL}/rest/v1/rpc/${name}`, {
    method: "POST",
    headers: {
      apikey: SUPABASE_PUBLISHABLE_KEY,
      Authorization: `Bearer ${SUPABASE_PUBLISHABLE_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    let error: RpcErrorShape = {};
    try {
      error = await response.json() as RpcErrorShape;
    } catch {
      // Keep the generic fallback below.
    }
    throw new Error(error.message || error.details || `Research beta request failed (${response.status}).`);
  }

  return await response.json() as T;
}

export async function saveResearchSubmission(
  token: string,
  payload: ResearchSubmissionPayload,
  submissionId: string | null,
) {
  const record = await rpc<ResearchSubmissionRecord>("save_research_submission", {
    p_token: token,
    p_submission_id: submissionId,
    p_payload: payload,
  });
  storeSubmissionId(record.id);
  return record;
}

export async function loadResearchSubmission(token: string, submissionId: string) {
  return await rpc<ResearchSubmissionRecord | null>("get_research_submission", {
    p_token: token,
    p_submission_id: submissionId,
  });
}

export async function withdrawResearchSubmission(token: string, submissionId: string) {
  const result = await rpc<{ withdrawn: boolean }>("withdraw_research_submission", {
    p_token: token,
    p_submission_id: submissionId,
  });
  if (result.withdrawn) clearStoredSubmission();
  return result.withdrawn;
}
