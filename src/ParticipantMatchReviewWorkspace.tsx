import { useEffect, useMemo, useState } from "react";
import { listOrganizations, restoreSession, signIn, signOut, type Organization, type SaasSession } from "./saasApi";
import {
  generateMatchPreviews,
  getMatchReviewQueue,
  listAdministrativeReviews,
  recordAdministrativeReview,
  type AdministrativeReview,
  type MatchReviewQueueRow,
} from "./matchReviewApi";
import "./participant-match-review.css";

const decisions: Array<{ value: AdministrativeReview["decision"]; label: string; help: string }> = [
  { value: "approved_for_review", label: "Approve for controlled review", help: "Allows the participant-facing client to display that administrative review is complete. This does not activate transportation." },
  { value: "request_changes", label: "Request changes", help: "Returns the option to program review for additional conditions or data." },
  { value: "declined", label: "Decline preview", help: "Declines this Match Preview without representing a transportation cancellation." },
];

function label(value: string | null | undefined) {
  return value ? value.replaceAll("_", " ") : "Not available";
}

function explanationRows(explanation: Record<string, unknown>) {
  return [
    ["Route basis", explanation.route_basis],
    ["Shared days", explanation.shared_days],
    ["Time fit", explanation.time_fit],
    ["Access Point", explanation.access_point_factor],
    ["EV / hybrid", explanation.ev_hybrid_factor],
    ["Contribution", explanation.contribution_factor],
    ["Detour", explanation.detour_estimate],
  ].filter(([, value]) => value !== null && value !== undefined && value !== "");
}

export default function ParticipantMatchReviewWorkspace() {
  const [session, setSession] = useState<SaasSession | null>(null);
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [organizationId, setOrganizationId] = useState("");
  const [queue, setQueue] = useState<MatchReviewQueueRow[]>([]);
  const [reviews, setReviews] = useState<AdministrativeReview[]>([]);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [drafts, setDrafts] = useState<Record<string, { decision: AdministrativeReview["decision"]; rationale: string }>>({});

  useEffect(() => {
    restoreSession().then(value => {
      setSession(value);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (!session) return;
    listOrganizations(session).then(rows => {
      setOrganizations(rows);
      setOrganizationId(current => current || rows[0]?.id || "");
    }).catch(e => setError(e instanceof Error ? e.message : String(e)));
  }, [session]);

  useEffect(() => {
    if (!session || !organizationId) {
      setQueue([]);
      setReviews([]);
      return;
    }
    void refresh(session, organizationId);
  }, [session, organizationId]);

  const latestReviews = useMemo(() => {
    const byMatch = new Map<string, AdministrativeReview>();
    for (const review of reviews) if (!byMatch.has(review.match_preview_id)) byMatch.set(review.match_preview_id, review);
    return byMatch;
  }, [reviews]);

  async function refresh(activeSession = session, orgId = organizationId) {
    if (!activeSession || !orgId) return;
    setError("");
    try {
      const [nextQueue, nextReviews] = await Promise.all([
        getMatchReviewQueue(activeSession, orgId),
        listAdministrativeReviews(activeSession, orgId),
      ]);
      setQueue(nextQueue);
      setReviews(nextReviews);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    }
  }

  async function connect() {
    setBusy(true); setError(""); setMessage("");
    try {
      const next = await signIn(email.trim(), password);
      setSession(next);
      setPassword("");
      setMessage("Institutional reviewer session connected.");
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally { setBusy(false); }
  }

  async function disconnect() {
    const current = session;
    setSession(null); setOrganizations([]); setOrganizationId(""); setQueue([]); setReviews([]); setMessage(""); setError("");
    await signOut(current);
  }

  async function generate() {
    if (!session || !organizationId) return;
    setBusy(true); setError(""); setMessage("");
    try {
      const count = await generateMatchPreviews(session, organizationId, 5);
      setMessage(`${count} deterministic Match Preview${count === 1 ? "" : "s"} generated for administrative review. No transportation was activated.`);
      await refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally { setBusy(false); }
  }

  function draftFor(matchId: string) {
    return drafts[matchId] ?? { decision: "approved_for_review" as const, rationale: "" };
  }

  function patchDraft(matchId: string, patch: Partial<{ decision: AdministrativeReview["decision"]; rationale: string }>) {
    setDrafts(current => ({ ...current, [matchId]: { ...draftFor(matchId), ...patch } }));
  }

  async function submitReview(match: MatchReviewQueueRow) {
    if (!session || !organizationId) return;
    const draft = draftFor(match.id);
    setBusy(true); setError(""); setMessage("");
    try {
      await recordAdministrativeReview(session, organizationId, match.id, {
        decision: draft.decision,
        rationale: draft.rationale,
        conditions: {
          program_review_only: true,
          transportation_guaranteed: false,
          routing_service_connected: false,
        },
      });
      setMessage(`Administrative review recorded as “${decisions.find(item => item.value === draft.decision)?.label ?? label(draft.decision)}.” Participant readback can now reflect this review state.`);
      await refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally { setBusy(false); }
  }

  if (loading) return <div className="match-review-shell"><section className="match-review-card">Loading reviewer workspace…</section></div>;

  if (!session) return <div className="match-review-shell"><section className="match-review-card match-review-login">
    <p className="match-review-eyebrow">RELAY RIDER · ADMINISTRATIVE REVIEW</p>
    <h1>Sign in to review commuter options</h1>
    <p>Only authorized institutional roles can generate deterministic Match Previews or record administrative review decisions.</p>
    <label>Email<input type="email" value={email} onChange={e => setEmail(e.currentTarget.value)} /></label>
    <label>Password<input type="password" value={password} onChange={e => setPassword(e.currentTarget.value)} /></label>
    <button onClick={connect} disabled={busy || !email || password.length < 8}>Sign in</button>
    {error && <div className="match-review-error">{error}</div>}
  </section></div>;

  return <div className="match-review-shell">
    <header className="match-review-header">
      <div><p className="match-review-eyebrow">RELAY RIDER · CONTROLLED COMMUTER PROGRAM</p><h1>Match Preview administrative review</h1><p>Generate explainable commuter options from existing planned routes, then record a governed review state for participant readback.</p></div>
      <button className="secondary" onClick={disconnect}>Sign out</button>
    </header>

    <section className="match-review-card match-review-controls">
      <label>Organization<select value={organizationId} onChange={e => setOrganizationId(e.currentTarget.value)}><option value="">Select organization</option>{organizations.map(org => <option key={org.id} value={org.id}>{org.name}</option>)}</select></label>
      <div className="match-review-actions"><button onClick={generate} disabled={busy || !organizationId}>Generate deterministic Match Previews</button><button className="secondary" onClick={() => void refresh()} disabled={busy || !organizationId}>Refresh queue</button></div>
      <p className="match-review-note"><strong>Guardrail:</strong> generation compares active commuter needs with compatible planned routes. It creates Match Previews only. It does not dispatch, confirm transportation, calculate live routing detours, or charge participants.</p>
    </section>

    {message && <div className="match-review-message">{message}</div>}
    {error && <div className="match-review-error wide">{error}</div>}

    <section className="match-review-summary">
      <div><strong>{queue.length}</strong><span>queue records</span></div>
      <div><strong>{queue.filter(item => item.status === "awaiting_admin_review").length}</strong><span>awaiting review</span></div>
      <div><strong>{latestReviews.size}</strong><span>reviewed records</span></div>
    </section>

    <section className="match-review-list">
      {queue.length === 0 ? <article className="match-review-card empty"><h2>No Match Previews in the selected organization.</h2><p>A real proof requires at least one active commuter need and a compatible planned route belonging to a different participant. The matcher intentionally excludes self-matches.</p></article> : queue.map(match => {
        const review = latestReviews.get(match.id);
        const draft = draftFor(match.id);
        const explanation = match.explanation ?? {};
        return <article key={match.id} className="match-review-card match-review-item">
          <div className="match-review-item-head"><div><span className="status">{label(match.status)}</span><h2>{match.origin_zone} → {match.destination_zone}</h2><p>Generated {new Date(match.generated_at).toLocaleString()}</p></div><div className="score"><strong>{match.compatibility_score == null ? "—" : `${Math.round(match.compatibility_score)}%`}</strong><span>compatibility</span></div></div>

          <div className="match-review-facts"><div><span>Route fit</span><strong>{match.route_fit_score == null ? "—" : `${Math.round(match.route_fit_score)}%`}</strong></div><div><span>Time fit</span><strong>{label(match.time_window_fit)}</strong></div><div><span>EV / hybrid</span><strong>{label(match.ev_hybrid_indicator)}</strong></div><div><span>Contribution</span><strong>{label(match.contribution_compatibility)}</strong></div></div>

          <div className="match-review-explanation"><h3>Why this option was generated</h3>{explanationRows(explanation).map(([name, value]) => <p key={String(name)}><span>{String(name)}</span><strong>{Array.isArray(value) ? value.join(", ") : String(value)}</strong></p>)}<small>{String(explanation.guardrail ?? "Match Preview only; administrative review required; no transportation is guaranteed.")}</small></div>

          {review && <div className="match-review-existing"><strong>Latest administrative review: {label(review.decision)}</strong><span>{review.rationale || "No rationale recorded."}</span><small>{review.reviewed_at ? new Date(review.reviewed_at).toLocaleString() : "Review timestamp unavailable"}</small></div>}

          <div className="match-review-form"><h3>{review ? "Record a new review version" : "Record administrative review"}</h3><label>Decision<select value={draft.decision} onChange={e => patchDraft(match.id, { decision: e.currentTarget.value as AdministrativeReview["decision"] })}>{decisions.map(item => <option key={item.value} value={item.value}>{item.label}</option>)}</select></label><p className="decision-help">{decisions.find(item => item.value === draft.decision)?.help}</p><label>Rationale<textarea value={draft.rationale} onChange={e => patchDraft(match.id, { rationale: e.currentTarget.value })} placeholder="Document why this option is appropriate for controlled review, needs changes, or should be declined." /></label><button onClick={() => void submitReview(match)} disabled={busy}>Record review</button></div>
        </article>;
      })}
    </section>

    <footer className="match-review-footer"><strong>Product-state boundary</strong><p>This is an institutional research-beta review workflow. “Approved for controlled review” is not transportation confirmation, a fare, a guaranteed route, guaranteed safety, or permission to operate outside program rules.</p></footer>
  </div>;
}
