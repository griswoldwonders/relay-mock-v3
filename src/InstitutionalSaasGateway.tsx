import { useEffect, useMemo, useState } from "react";
import InstitutionalWorkspace from "./InstitutionalWorkspace";
import {
  createCohort,
  createDataSource,
  createOrganization,
  createProgram,
  createSite,
  getAuditEvents,
  getOnboarding,
  getParticipantDirectory,
  listCohorts,
  listDataSources,
  listMemberships,
  listOrganizations,
  listPrograms,
  listSites,
  restoreSession,
  signIn,
  signOut,
  signUp,
  updateOnboarding,
  type AuditEvent,
  type Cohort,
  type DataSource,
  type Membership,
  type Onboarding,
  type Organization,
  type OrganizationSite,
  type ParticipantDirectoryRow,
  type SaasSession,
  type TdmProgram,
} from "./saasApi";
import "./saas-foundation.css";

type FoundationView = "overview" | "sites" | "cohorts" | "programs" | "participants" | "sources" | "audit";

type Props = { onOpenMap: () => void; onOpenParticipant: () => void };

const FOUNDATION_NAV: { id: FoundationView; label: string }[] = [
  { id: "overview", label: "SaaS Overview" },
  { id: "sites", label: "Sites" },
  { id: "cohorts", label: "Cohorts" },
  { id: "programs", label: "Programs" },
  { id: "participants", label: "Participants" },
  { id: "sources", label: "Data Sources" },
  { id: "audit", label: "Audit" },
];

export default function InstitutionalSaasGateway({ onOpenMap, onOpenParticipant }: Props) {
  const [session, setSession] = useState<SaasSession | null>(null);
  const [loading, setLoading] = useState(true);
  const [authMode, setAuthMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [authNotice, setAuthNotice] = useState("");
  const [error, setError] = useState("");
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [memberships, setMemberships] = useState<Membership[]>([]);
  const [organizationId, setOrganizationId] = useState("");
  const [view, setView] = useState<FoundationView>("overview");
  const [workspaceOpen, setWorkspaceOpen] = useState(false);
  const [sites, setSites] = useState<OrganizationSite[]>([]);
  const [cohorts, setCohorts] = useState<Cohort[]>([]);
  const [programs, setPrograms] = useState<TdmProgram[]>([]);
  const [sources, setSources] = useState<DataSource[]>([]);
  const [participants, setParticipants] = useState<ParticipantDirectoryRow[]>([]);
  const [audit, setAudit] = useState<AuditEvent[]>([]);
  const [onboarding, setOnboarding] = useState<Onboarding | null>(null);
  const [orgName, setOrgName] = useState("");
  const [orgType, setOrgType] = useState("employer");
  const [siteName, setSiteName] = useState("");
  const [siteType, setSiteType] = useState("employer");
  const [siteZone, setSiteZone] = useState("");
  const [parkingCapacity, setParkingCapacity] = useState("");
  const [cohortName, setCohortName] = useState("");
  const [cohortDescription, setCohortDescription] = useState("");
  const [cohortSite, setCohortSite] = useState("");
  const [programName, setProgramName] = useState("");
  const [programType, setProgramType] = useState("multimodal");
  const [programObjective, setProgramObjective] = useState("");
  const [sourceName, setSourceName] = useState("");
  const [sourceType, setSourceType] = useState("participant_intake");

  const organization = useMemo(() => organizations.find((item) => item.id === organizationId) ?? organizations[0] ?? null, [organizations, organizationId]);
  const membership = memberships.find((item) => item.organization_id === organization?.id && item.user_id === session?.user.id);

  useEffect(() => {
    restoreSession().then((saved) => { setSession(saved); setLoading(false); }).catch(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (!session) return;
    loadOrganizations(session).catch((reason) => setError(messageOf(reason)));
  }, [session]);

  useEffect(() => {
    if (!session || !organization?.id) return;
    loadFoundation(session, organization.id).catch((reason) => setError(messageOf(reason)));
  }, [session, organization?.id]);

  async function loadOrganizations(activeSession: SaasSession) {
    const [orgRows, membershipRows] = await Promise.all([listOrganizations(activeSession), listMemberships(activeSession)]);
    setOrganizations(orgRows);
    setMemberships(membershipRows);
    if (!organizationId && orgRows[0]) setOrganizationId(orgRows[0].id);
  }

  async function loadFoundation(activeSession: SaasSession, orgId: string) {
    const [siteRows, cohortRows, programRows, sourceRows, onboardingRows, participantRows, auditRows] = await Promise.all([
      listSites(activeSession, orgId), listCohorts(activeSession, orgId), listPrograms(activeSession, orgId), listDataSources(activeSession, orgId), getOnboarding(activeSession, orgId), getParticipantDirectory(activeSession, orgId), getAuditEvents(activeSession, orgId),
    ]);
    setSites(siteRows); setCohorts(cohortRows); setPrograms(programRows); setSources(sourceRows); setOnboarding(onboardingRows[0] ?? null); setParticipants(participantRows); setAudit(auditRows);
  }

  async function handleAuth() {
    setError(""); setAuthNotice("");
    try {
      if (authMode === "signin") setSession(await signIn(email.trim(), password));
      else {
        const result = await signUp(email.trim(), password);
        if (result.session) setSession(result.session);
        else setAuthNotice("Account created. Check your email if confirmation is required, then sign in.");
      }
    } catch (reason) { setError(messageOf(reason)); }
  }

  async function handleCreateOrganization() {
    if (!session || !orgName.trim()) return;
    setError("");
    try {
      const id = await createOrganization(session, orgName.trim(), orgType);
      await updateOnboarding(session, id, { organization_profile_complete: true });
      await loadOrganizations(session);
      setOrganizationId(id);
      setOrgName("");
    } catch (reason) { setError(messageOf(reason)); }
  }

  async function refresh(flag?: Partial<Onboarding>) {
    if (!session || !organization?.id) return;
    if (flag) await updateOnboarding(session, organization.id, flag);
    await loadFoundation(session, organization.id);
  }

  if (loading) return <div className="saas-auth-shell"><div className="saas-auth-card"><strong>Relay Rider</strong><p>Loading institutional workspace…</p></div></div>;

  if (!session) {
    return <div className="saas-auth-shell"><section className="saas-auth-card"><span className="saas-kicker">INSTITUTIONAL TDM SAAS</span><h1>Run mobility programs from one governed workspace.</h1><p>Sign in to manage organizations, sites, cohorts, programs, participant operations, data sources, and TDM intelligence.</p><label>Email<input value={email} type="email" autoComplete="email" onChange={(event) => setEmail(event.currentTarget.value)} /></label><label>Password<input value={password} type="password" minLength={8} autoComplete={authMode === "signin" ? "current-password" : "new-password"} onChange={(event) => setPassword(event.currentTarget.value)} /></label>{error && <div className="saas-error">{error}</div>}{authNotice && <div className="saas-notice">{authNotice}</div>}<button className="saas-primary" disabled={!email.trim() || password.length < 8} onClick={handleAuth}>{authMode === "signin" ? "Sign in" : "Create account"}</button><button className="saas-link" onClick={() => { setAuthMode(authMode === "signin" ? "signup" : "signin"); setError(""); }}>{authMode === "signin" ? "Need an administrator account? Create one" : "Already have an account? Sign in"}</button><small>Authentication is provided by the connected Supabase project. Access to institutional records is enforced with row-level security.</small></section></div>;
  }

  if (!organizations.length) {
    return <div className="saas-auth-shell"><section className="saas-auth-card"><span className="saas-kicker">ORGANIZATION ONBOARDING</span><h1>Create your institutional workspace</h1><p>This creates a real tenant record and makes your authenticated account the Organization Owner.</p><label>Organization name<input value={orgName} onChange={(event) => setOrgName(event.currentTarget.value)} placeholder="Example institution" /></label><label>Organization type<select value={orgType} onChange={(event) => setOrgType(event.currentTarget.value)}><option value="employer">Employer</option><option value="campus">Campus / college</option><option value="hospital">Hospital / medical center</option><option value="business_district">Business district</option><option value="venue">Venue</option><option value="municipality">Municipality</option><option value="other">Other institution</option></select></label>{error && <div className="saas-error">{error}</div>}<button className="saas-primary" disabled={!orgName.trim()} onClick={handleCreateOrganization}>Create organization</button><button className="saas-link" onClick={async () => { await signOut(session); setSession(null); }}>Sign out</button></section></div>;
  }

  if (workspaceOpen) {
    return <div className="saas-workspace-host"><div className="saas-session-bar"><div><strong>{organization?.name}</strong><span>{membership?.role ?? "member"} · authenticated tenant</span></div><div><button onClick={() => setWorkspaceOpen(false)}>SaaS Setup</button><button onClick={async () => { await signOut(session); setSession(null); }}>Sign out</button></div></div><InstitutionalWorkspace onOpenMap={onOpenMap} onOpenParticipant={onOpenParticipant} /></div>;
  }

  return <div className="saas-foundation-shell">
    <header className="saas-foundation-header"><div><span className="saas-kicker">RELAY RIDER · INSTITUTIONAL TDM SAAS</span><h1>{organization?.name}</h1><p>{organization?.organization_type.replaceAll("_", " ")} · {membership?.role ?? "member"} · tenant data enforced by RLS</p></div><div className="saas-header-actions"><select value={organization?.id ?? ""} onChange={(event) => setOrganizationId(event.currentTarget.value)}>{organizations.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select><button onClick={() => setWorkspaceOpen(true)}>Open TDM Workspace</button><button onClick={onOpenMap}>Mobility Map</button><button onClick={async () => { await signOut(session); setSession(null); }}>Sign out</button></div></header>
    <nav className="saas-foundation-nav">{FOUNDATION_NAV.map((item) => <button key={item.id} className={view === item.id ? "active" : ""} onClick={() => setView(item.id)}>{item.label}</button>)}</nav>
    <main className="saas-foundation-content">
      {error && <div className="saas-error wide">{error}</div>}
      {view === "overview" && <FoundationOverview onboarding={onboarding} sites={sites} cohorts={cohorts} programs={programs} sources={sources} participants={participants} audit={audit} onParticipantPath={async () => { try { await refresh({ participant_path_configured: true }); } catch (reason) { setError(messageOf(reason)); } }} />}
      {view === "sites" && <CrudPanel title="Sites" description="Public institutional destinations and operating locations. Participant homes never belong in this table." form={<><input value={siteName} onChange={(e) => setSiteName(e.currentTarget.value)} placeholder="Site name" /><select value={siteType} onChange={(e) => setSiteType(e.currentTarget.value)}><option value="employer">Employer</option><option value="campus">Campus</option><option value="hospital">Hospital</option><option value="venue">Venue</option><option value="municipal">Municipal</option><option value="other">Other</option></select><input value={siteZone} onChange={(e) => setSiteZone(e.currentTarget.value)} placeholder="General zone / city" /><input value={parkingCapacity} onChange={(e) => setParkingCapacity(e.currentTarget.value)} inputMode="numeric" placeholder="Parking capacity (optional)" /><button onClick={async () => { if (!session || !organization || !siteName.trim()) return; try { await createSite(session, organization.id, { name: siteName.trim(), site_type: siteType, general_zone: siteZone.trim() || undefined, parking_capacity: parkingCapacity ? Number(parkingCapacity) : null }); setSiteName(""); setSiteZone(""); setParkingCapacity(""); await refresh({ site_configured: true }); } catch (reason) { setError(messageOf(reason)); } }}>Add site</button></>} items={sites.map((item) => ({ title: item.name, meta: `${item.site_type} · ${item.general_zone ?? "zone not set"}`, detail: item.parking_capacity == null ? "Parking capacity not configured" : `${item.parking_capacity} parking spaces configured` }))} />}
      {view === "cohorts" && <CrudPanel title="Cohorts" description="Institution-defined participant groups used for eligibility, reporting, and program rules." form={<><input value={cohortName} onChange={(e) => setCohortName(e.currentTarget.value)} placeholder="Cohort name" /><input value={cohortDescription} onChange={(e) => setCohortDescription(e.currentTarget.value)} placeholder="Description" /><select value={cohortSite} onChange={(e) => setCohortSite(e.currentTarget.value)}><option value="">Organization-wide</option>{sites.map((site) => <option key={site.id} value={site.id}>{site.name}</option>)}</select><button onClick={async () => { if (!session || !organization || !cohortName.trim()) return; try { await createCohort(session, organization.id, { name: cohortName.trim(), description: cohortDescription.trim(), site_id: cohortSite || null }); setCohortName(""); setCohortDescription(""); await refresh({ cohort_configured: true }); } catch (reason) { setError(messageOf(reason)); } }}>Add cohort</button></>} items={cohorts.map((item) => ({ title: item.name, meta: item.site_id ? sites.find((site) => site.id === item.site_id)?.name ?? "Site-scoped" : "Organization-wide", detail: item.description ?? "No description" }))} />}
      {view === "programs" && <CrudPanel title="TDM Programs" description="Persistent institution-governed interventions. Creating a program does not activate transportation or guarantee outcomes." form={<><input value={programName} onChange={(e) => setProgramName(e.currentTarget.value)} placeholder="Program name" /><select value={programType} onChange={(e) => setProgramType(e.currentTarget.value)}><option value="multimodal">Multimodal</option><option value="transit">Transit</option><option value="planned_route">Planned-route coordination</option><option value="parking">Parking</option><option value="access_point">Access Point</option><option value="ev_charging">EV / charging</option><option value="flexible_work">Flexible work</option><option value="engagement">Engagement</option></select><input value={programObjective} onChange={(e) => setProgramObjective(e.currentTarget.value)} placeholder="Program objective" /><button onClick={async () => { if (!session || !organization || !programName.trim()) return; try { await createProgram(session, organization.id, { name: programName.trim(), program_type: programType, objective: programObjective.trim() }); setProgramName(""); setProgramObjective(""); await refresh({ program_configured: true }); } catch (reason) { setError(messageOf(reason)); } }}>Create draft program</button></>} items={programs.map((item) => ({ title: item.name, meta: `${item.program_type.replaceAll("_", " ")} · ${item.status}`, detail: item.objective ?? "No objective recorded" }))} />}
      {view === "participants" && <section className="saas-panel"><div className="saas-panel-heading"><div><span className="saas-kicker">PRIVACY-MINIMIZED DIRECTORY</span><h2>Participants</h2><p>This authenticated directory intentionally excludes participant names, phone numbers, and exact home locations.</p></div><button onClick={onOpenParticipant}>Open participant app</button></div><div className="saas-table"><div className="saas-table-head"><span>Participant</span><span>Status</span><span>Needs</span><span>Routes</span><span>Latest signal</span></div>{participants.length ? participants.map((row) => <div className="saas-table-row" key={row.user_id}><span><strong>{row.user_id.slice(0, 8)}…</strong><small>{row.participant_type}</small></span><span>{row.membership_status}</span><span>{row.commuter_need_count}</span><span>{row.planned_route_count}</span><span>{row.latest_signal_at ? new Date(row.latest_signal_at).toLocaleDateString() : "No canonical signal"}</span></div>) : <div className="saas-empty">No authenticated participant members are enrolled in this organization yet. Research-beta staging records remain separate until promotion/onboarding is explicitly designed.</div>}</div></section>}
      {view === "sources" && <CrudPanel title="Data Sources" description="Track source configuration and freshness without placing credentials or secrets in browser-visible settings." form={<><input value={sourceName} onChange={(e) => setSourceName(e.currentTarget.value)} placeholder="Source name" /><select value={sourceType} onChange={(e) => setSourceType(e.currentTarget.value)}><option value="participant_intake">Participant intake</option><option value="survey_csv">Commute survey CSV</option><option value="roster_csv">Roster CSV</option><option value="parking_inventory">Parking inventory</option><option value="parking_occupancy">Parking occupancy</option><option value="gtfs">GTFS</option><option value="gtfs_rt">GTFS-RT</option><option value="ev_charging">EV charging</option><option value="hris">HRIS</option><option value="sis">SIS</option><option value="manual">Manual dataset</option></select><button onClick={async () => { if (!session || !organization || !sourceName.trim()) return; try { await createDataSource(session, organization.id, { name: sourceName.trim(), source_type: sourceType }); setSourceName(""); await refresh({ data_source_reviewed: true }); } catch (reason) { setError(messageOf(reason)); } }}>Register source</button></>} items={sources.map((item) => ({ title: item.name, meta: `${item.source_type.replaceAll("_", " ")} · ${item.status}`, detail: item.last_synced_at ? `Last synced ${new Date(item.last_synced_at).toLocaleString()}` : item.coverage_summary ?? "No sync has been recorded" }))} />}
      {view === "audit" && <section className="saas-panel"><div className="saas-panel-heading"><div><span className="saas-kicker">IMMUTABLE OPERATION HISTORY</span><h2>Audit events</h2><p>Generated by database triggers for governed tables. Source IP is not exposed in this client view.</p></div></div><div className="audit-list">{audit.length ? audit.map((event) => <article key={event.id}><div><strong>{event.operation} · {event.table_name}</strong><span>{new Date(event.occurred_at).toLocaleString()}</span></div><small>{event.changed_columns.length ? `Changed: ${event.changed_columns.join(", ")}` : "No changed-column metadata"}</small></article>) : <div className="saas-empty">No organization-scoped audit events yet.</div>}</div></section>}
    </main>
  </div>;
}

function FoundationOverview({ onboarding, sites, cohorts, programs, sources, participants, audit, onParticipantPath }: { onboarding: Onboarding | null; sites: OrganizationSite[]; cohorts: Cohort[]; programs: TdmProgram[]; sources: DataSource[]; participants: ParticipantDirectoryRow[]; audit: AuditEvent[]; onParticipantPath: () => void }) {
  const steps = [
    ["Organization profile", onboarding?.organization_profile_complete], ["Site configured", onboarding?.site_configured], ["Cohort configured", onboarding?.cohort_configured], ["TDM program configured", onboarding?.program_configured], ["Participant enrollment path", onboarding?.participant_path_configured], ["Data-source review", onboarding?.data_source_reviewed],
  ] as const;
  const complete = steps.filter(([, done]) => done).length;
  return <><section className="saas-hero"><div><span className="saas-kicker">SAAS FOUNDATION</span><h2>Institution → sites → cohorts → programs → participants → outcomes.</h2><p>The records on this page are tenant-scoped and persistent. The analytical TDM workspace can still contain clearly labeled demonstration/model values until real source pipelines populate those metrics.</p></div><div className="saas-progress"><strong>{complete}/6</strong><span>onboarding controls configured</span><i><b style={{ width: `${(complete / 6) * 100}%` }} /></i></div></section><div className="saas-metric-grid"><MetricCard label="Sites" value={`${sites.length}`} note="Persistent tenant records" /><MetricCard label="Cohorts" value={`${cohorts.length}`} note="Eligibility groups" /><MetricCard label="Programs" value={`${programs.length}`} note="Persistent TDM programs" /><MetricCard label="Participants" value={`${participants.length}`} note="Authenticated canonical members" /><MetricCard label="Data sources" value={`${sources.length}`} note="Registered source records" /><MetricCard label="Audit events" value={`${audit.length}`} note="Latest 100 organization events" /></div><section className="saas-panel"><div className="saas-panel-heading"><div><span className="saas-kicker">ONBOARDING CHECKLIST</span><h2>Production foundation</h2></div></div><div className="onboarding-grid">{steps.map(([label, done]) => <div key={label} className={done ? "done" : "pending"}><span>{done ? "✓" : "○"}</span><strong>{label}</strong></div>)}</div>{!onboarding?.participant_path_configured && <button className="saas-secondary" onClick={onParticipantPath}>Mark participant enrollment path reviewed</button>}<p className="saas-small-note">This checklist records administrator configuration state. It does not certify regulatory compliance, transportation availability, or safety.</p></section></>;
}

function MetricCard({ label, value, note }: { label: string; value: string; note: string }) { return <article className="saas-metric-card"><small>{label}</small><strong>{value}</strong><span>{note}</span></article>; }

function CrudPanel({ title, description, form, items }: { title: string; description: string; form: React.ReactNode; items: { title: string; meta: string; detail: string }[] }) {
  return <div className="saas-crud-layout"><section className="saas-panel"><span className="saas-kicker">CREATE / CONFIGURE</span><h2>{title}</h2><p>{description}</p><div className="saas-form-stack">{form}</div></section><section className="saas-panel"><div className="saas-panel-heading"><div><span className="saas-kicker">CURRENT RECORDS</span><h2>{items.length} {title.toLowerCase()}</h2></div></div><div className="saas-record-list">{items.length ? items.map((item) => <article key={`${item.title}-${item.meta}`}><strong>{item.title}</strong><span>{item.meta}</span><p>{item.detail}</p></article>) : <div className="saas-empty">No records configured yet.</div>}</div></section></div>;
}

function messageOf(reason: unknown) { return reason instanceof Error ? reason.message : "Something went wrong."; }
