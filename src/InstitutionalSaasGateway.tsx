import { useEffect, useMemo, useState } from "react";
import OperationalEngine from "./OperationalEngine";
import { acceptInvitation } from "./operationalApi";
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

type FoundationView = "overview" | "operations" | "sites" | "cohorts" | "programs" | "commuters" | "sources" | "audit";

const FOUNDATION_NAV: { id: FoundationView; label: string }[] = [
  { id: "overview", label: "Control Center" },
  { id: "operations", label: "Operations" },
  { id: "sites", label: "Sites" },
  { id: "cohorts", label: "Cohorts" },
  { id: "programs", label: "Programs" },
  { id: "commuters", label: "Commuter Records" },
  { id: "sources", label: "Data Sources" },
  { id: "audit", label: "Audit" },
];

export default function InstitutionalSaasGateway() {
  const [session, setSession] = useState<SaasSession | null>(null);
  const [loading, setLoading] = useState(true);
  const [processingInvite, setProcessingInvite] = useState(false);
  const [authMode, setAuthMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [authNotice, setAuthNotice] = useState("");
  const [error, setError] = useState("");
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [memberships, setMemberships] = useState<Membership[]>([]);
  const [organizationId, setOrganizationId] = useState("");
  const [view, setView] = useState<FoundationView>("overview");
  const [sites, setSites] = useState<OrganizationSite[]>([]);
  const [cohorts, setCohorts] = useState<Cohort[]>([]);
  const [programs, setPrograms] = useState<TdmProgram[]>([]);
  const [sources, setSources] = useState<DataSource[]>([]);
  const [commuters, setCommuters] = useState<ParticipantDirectoryRow[]>([]);
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
    let active = true;
    (async () => {
      const inviteToken = new URLSearchParams(window.location.search).get("invite");
      if (inviteToken) setProcessingInvite(true);
      try {
        if (inviteToken) {
          const acceptedOrgId = await acceptInvitation(session, inviteToken);
          if (!active) return;
          setOrganizationId(acceptedOrgId);
          setAuthNotice("Institution invitation accepted. Your organization membership and assigned scope are active.");
          const url = new URL(window.location.href);
          url.searchParams.delete("invite");
          window.history.replaceState({}, document.title, `${url.pathname}${url.search}${url.hash}`);
        }
        await loadOrganizations(session);
      } catch (reason) {
        if (active) {
          setError(messageOf(reason));
          await loadOrganizations(session).catch(() => undefined);
        }
      } finally {
        if (active) setProcessingInvite(false);
      }
    })();
    return () => { active = false; };
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
    const [siteRows, cohortRows, programRows, sourceRows, onboardingRows, commuterRows, auditRows] = await Promise.all([
      listSites(activeSession, orgId), listCohorts(activeSession, orgId), listPrograms(activeSession, orgId), listDataSources(activeSession, orgId), getOnboarding(activeSession, orgId), getParticipantDirectory(activeSession, orgId), getAuditEvents(activeSession, orgId),
    ]);
    setSites(siteRows);
    setCohorts(cohortRows);
    setPrograms(programRows);
    setSources(sourceRows);
    setOnboarding(onboardingRows[0] ?? null);
    setCommuters(commuterRows);
    setAudit(auditRows);
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

  if (loading || processingInvite) return <div className="saas-auth-shell"><div className="saas-auth-card"><strong>Relay Rider</strong><p>{processingInvite ? "Accepting institution invitation…" : "Loading admin operations…"}</p></div></div>;

  if (!session) {
    return <div className="saas-auth-shell"><section className="saas-auth-card"><span className="saas-kicker">INSTITUTIONAL TDM ADMIN</span><h1>Operate mobility programs from one governed workspace.</h1><p>Sign in to access organization-scoped sites, cohorts, programs, data ingestion, task queues, corridor intelligence, commuter records, Match Previews, and audit history.</p><label>Email<input value={email} type="email" autoComplete="email" onChange={(event) => setEmail(event.currentTarget.value)} /></label><label>Password<input value={password} type="password" minLength={8} autoComplete={authMode === "signin" ? "current-password" : "new-password"} onChange={(event) => setPassword(event.currentTarget.value)} /></label>{error && <div className="saas-error">{error}</div>}{authNotice && <div className="saas-notice">{authNotice}</div>}<button className="saas-primary" disabled={!email.trim() || password.length < 8} onClick={handleAuth}>{authMode === "signin" ? "Sign in" : "Create administrator account"}</button><button className="saas-link" onClick={() => { setAuthMode(authMode === "signin" ? "signup" : "signin"); setError(""); }}>{authMode === "signin" ? "Create an administrator account" : "Already have an account? Sign in"}</button><small>Institutional records are protected by Supabase authentication, organization membership, role checks, and row-level security.</small></section></div>;
  }

  if (!organizations.length) {
    return <div className="saas-auth-shell"><section className="saas-auth-card"><span className="saas-kicker">ORGANIZATION ONBOARDING</span><h1>Create your institutional workspace</h1><p>This creates a persistent tenant record and makes the authenticated account the Organization Owner.</p>{error && <div className="saas-error">{error}</div>}{authNotice && <div className="saas-notice">{authNotice}</div>}<label>Organization name<input value={orgName} onChange={(event) => setOrgName(event.currentTarget.value)} placeholder="Institution name" /></label><label>Organization type<select value={orgType} onChange={(event) => setOrgType(event.currentTarget.value)}><option value="employer">Employer</option><option value="campus">Campus / college</option><option value="hospital">Hospital / medical center</option><option value="business_district">Business district</option><option value="venue">Venue</option><option value="municipality">Municipality</option><option value="other">Other institution</option></select></label><button className="saas-primary" disabled={!orgName.trim()} onClick={handleCreateOrganization}>Create organization</button><button className="saas-link" onClick={async () => { await signOut(session); setSession(null); }}>Sign out</button></section></div>;
  }

  return <div className="saas-foundation-shell">
    <header className="saas-foundation-header"><div><span className="saas-kicker">RELAY RIDER · ADMIN OPERATIONS</span><h1>{organization?.name}</h1><p>{organization?.organization_type.replaceAll("_", " ")} · {membership?.role ?? "member"} · real tenant data only</p></div><div className="saas-header-actions"><select value={organization?.id ?? ""} onChange={(event) => setOrganizationId(event.currentTarget.value)}>{organizations.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select><button onClick={async () => { await signOut(session); setSession(null); }}>Sign out</button></div></header>
    <nav className="saas-foundation-nav">{FOUNDATION_NAV.map((item) => <button key={item.id} className={view === item.id ? "active" : ""} onClick={() => setView(item.id)}>{item.label}</button>)}</nav>
    <main className="saas-foundation-content">
      {error && <div className="saas-error wide">{error}</div>}
      {authNotice && <div className="saas-notice">{authNotice}</div>}
      {view === "overview" && <FoundationOverview onboarding={onboarding} sites={sites} cohorts={cohorts} programs={programs} sources={sources} commuters={commuters} audit={audit} onCommuterIntake={async () => { try { await refresh({ participant_path_configured: true }); } catch (reason) { setError(messageOf(reason)); } }} />}
      {view === "operations" && session && organization && <OperationalEngine session={session} organization={organization} role={membership?.role ?? "participant"} sites={sites} cohorts={cohorts} programs={programs} sources={sources} onChanged={() => loadFoundation(session, organization.id)} />}
      {view === "sites" && <CrudPanel title="Sites" description="Institutional destinations and operating locations. Exact commuter home locations do not belong in this table." form={<><input value={siteName} onChange={(e) => setSiteName(e.currentTarget.value)} placeholder="Site name" /><select value={siteType} onChange={(e) => setSiteType(e.currentTarget.value)}><option value="employer">Employer</option><option value="campus">Campus</option><option value="hospital">Hospital</option><option value="venue">Venue</option><option value="municipal">Municipal</option><option value="other">Other</option></select><input value={siteZone} onChange={(e) => setSiteZone(e.currentTarget.value)} placeholder="General zone / city" /><input value={parkingCapacity} onChange={(e) => setParkingCapacity(e.currentTarget.value)} inputMode="numeric" placeholder="Parking capacity (optional)" /><button onClick={async () => { if (!session || !organization || !siteName.trim()) return; try { await createSite(session, organization.id, { name: siteName.trim(), site_type: siteType, general_zone: siteZone.trim() || undefined, parking_capacity: parkingCapacity ? Number(parkingCapacity) : null }); setSiteName(""); setSiteZone(""); setParkingCapacity(""); await refresh({ site_configured: true }); } catch (reason) { setError(messageOf(reason)); } }}>Add site</button></>} items={sites.map((item) => ({ title: item.name, meta: `${item.site_type} · ${item.general_zone ?? "zone not set"}`, detail: item.parking_capacity == null ? "Parking capacity not configured" : `${item.parking_capacity} parking spaces configured` }))} />}
      {view === "cohorts" && <CrudPanel title="Cohorts" description="Institution-defined groups used for eligibility, reporting, and program rules." form={<><input value={cohortName} onChange={(e) => setCohortName(e.currentTarget.value)} placeholder="Cohort name" /><input value={cohortDescription} onChange={(e) => setCohortDescription(e.currentTarget.value)} placeholder="Description" /><select value={cohortSite} onChange={(e) => setCohortSite(e.currentTarget.value)}><option value="">Organization-wide</option>{sites.map((site) => <option key={site.id} value={site.id}>{site.name}</option>)}</select><button onClick={async () => { if (!session || !organization || !cohortName.trim()) return; try { await createCohort(session, organization.id, { name: cohortName.trim(), description: cohortDescription.trim(), site_id: cohortSite || null }); setCohortName(""); setCohortDescription(""); await refresh({ cohort_configured: true }); } catch (reason) { setError(messageOf(reason)); } }}>Add cohort</button></>} items={cohorts.map((item) => ({ title: item.name, meta: item.site_id ? sites.find((site) => site.id === item.site_id)?.name ?? "Site-scoped" : "Organization-wide", detail: item.description ?? "No description" }))} />}
      {view === "programs" && <CrudPanel title="TDM Programs" description="Persistent institution-governed interventions. Creating a program does not activate transportation or guarantee outcomes." form={<><input value={programName} onChange={(e) => setProgramName(e.currentTarget.value)} placeholder="Program name" /><select value={programType} onChange={(e) => setProgramType(e.currentTarget.value)}><option value="multimodal">Multimodal</option><option value="transit">Transit</option><option value="planned_route">Planned-route coordination</option><option value="parking">Parking</option><option value="access_point">Access Point</option><option value="ev_charging">EV / charging</option><option value="flexible_work">Flexible work</option><option value="engagement">Engagement</option></select><input value={programObjective} onChange={(e) => setProgramObjective(e.currentTarget.value)} placeholder="Program objective" /><button onClick={async () => { if (!session || !organization || !programName.trim()) return; try { await createProgram(session, organization.id, { name: programName.trim(), program_type: programType, objective: programObjective.trim() }); setProgramName(""); setProgramObjective(""); await refresh({ program_configured: true }); } catch (reason) { setError(messageOf(reason)); } }}>Create draft program</button></>} items={programs.map((item) => ({ title: item.name, meta: `${item.program_type.replaceAll("_", " ")} · ${item.status}`, detail: item.objective ?? "No objective recorded" }))} />}
      {view === "commuters" && <section className="saas-panel"><div className="saas-panel-heading"><div><span className="saas-kicker">PRIVACY-MINIMIZED ADMIN DIRECTORY</span><h2>Commuter records</h2><p>This administrator view excludes names, phone numbers, and exact home locations. It shows only organization-scoped canonical records.</p></div></div><div className="saas-table"><div className="saas-table-head"><span>Commuter</span><span>Status</span><span>Needs</span><span>Routes</span><span>Latest signal</span></div>{commuters.length ? commuters.map((row) => <div className="saas-table-row" key={row.user_id}><span><strong>{row.user_id.slice(0, 8)}…</strong><small>{row.participant_type}</small></span><span>{row.membership_status}</span><span>{row.commuter_need_count}</span><span>{row.planned_route_count}</span><span>{row.latest_signal_at ? new Date(row.latest_signal_at).toLocaleDateString() : "No canonical signal"}</span></div>) : <div className="saas-empty">No canonical commuter records are enrolled in this organization yet.</div>}</div></section>}
      {view === "sources" && <CrudPanel title="Data Sources" description="Track actual source configuration and freshness. Credentials and secrets are not stored in browser-visible settings." form={<><input value={sourceName} onChange={(e) => setSourceName(e.currentTarget.value)} placeholder="Source name" /><select value={sourceType} onChange={(e) => setSourceType(e.currentTarget.value)}><option value="participant_intake">Commuter intake</option><option value="survey_csv">Commute survey CSV</option><option value="roster_csv">Roster CSV</option><option value="parking_inventory">Parking inventory</option><option value="parking_occupancy">Parking occupancy</option><option value="gtfs">GTFS</option><option value="gtfs_rt">GTFS-RT</option><option value="ev_charging">EV charging</option><option value="hris">HRIS</option><option value="sis">SIS</option><option value="manual">Manual dataset</option></select><button onClick={async () => { if (!session || !organization || !sourceName.trim()) return; try { await createDataSource(session, organization.id, { name: sourceName.trim(), source_type: sourceType }); setSourceName(""); await refresh({ data_source_reviewed: true }); } catch (reason) { setError(messageOf(reason)); } }}>Register source</button></>} items={sources.map((item) => ({ title: item.name, meta: `${item.source_type.replaceAll("_", " ")} · ${item.status}`, detail: item.last_synced_at ? `Last synced ${new Date(item.last_synced_at).toLocaleString()}` : item.coverage_summary ?? "No sync has been recorded" }))} />}
      {view === "audit" && <section className="saas-panel"><div className="saas-panel-heading"><div><span className="saas-kicker">OPERATION HISTORY</span><h2>Audit events</h2><p>Generated by database triggers for governed tenant records.</p></div></div><div className="audit-list">{audit.length ? audit.map((event) => <article key={event.id}><div><strong>{event.operation} · {event.table_name}</strong><span>{new Date(event.occurred_at).toLocaleString()}</span></div><small>{event.changed_columns.length ? `Changed: ${event.changed_columns.join(", ")}` : "No changed-column metadata"}</small></article>) : <div className="saas-empty">No organization-scoped audit events yet.</div>}</div></section>}
    </main>
  </div>;
}

function FoundationOverview({ onboarding, sites, cohorts, programs, sources, commuters, audit, onCommuterIntake }: { onboarding: Onboarding | null; sites: OrganizationSite[]; cohorts: Cohort[]; programs: TdmProgram[]; sources: DataSource[]; commuters: ParticipantDirectoryRow[]; audit: AuditEvent[]; onCommuterIntake: () => void }) {
  const steps = [["Organization profile", onboarding?.organization_profile_complete], ["Site configured", onboarding?.site_configured], ["Cohort configured", onboarding?.cohort_configured], ["TDM program configured", onboarding?.program_configured], ["Commuter intake reviewed", onboarding?.participant_path_configured], ["Data-source review", onboarding?.data_source_reviewed]] as const;
  const complete = steps.filter(([, done]) => done).length;
  return <><section className="saas-hero"><div><span className="saas-kicker">ADMIN CONTROL CENTER · REAL DATA ONLY</span><h2>Institution → sites → cohorts → programs → commuter signals → operations → outcomes.</h2><p>This workspace no longer displays modeled KPIs, sample corridors, simulated participants, or demonstration program performance. Empty states remain empty until tenant data is created or ingested.</p></div><div className="saas-progress"><strong>{complete}/6</strong><span>administrative setup controls configured</span><i><b style={{ width: `${(complete / 6) * 100}%` }} /></i></div></section><div className="saas-metric-grid"><MetricCard label="Sites" value={`${sites.length}`} note="Persistent tenant records" /><MetricCard label="Cohorts" value={`${cohorts.length}`} note="Persistent eligibility groups" /><MetricCard label="Programs" value={`${programs.length}`} note="Persistent TDM programs" /><MetricCard label="Commuter records" value={`${commuters.length}`} note="Canonical organization members" /><MetricCard label="Data sources" value={`${sources.length}`} note="Registered source records" /><MetricCard label="Audit events" value={`${audit.length}`} note="Latest organization events" /></div><section className="saas-panel"><div className="saas-panel-heading"><div><span className="saas-kicker">ADMIN SETUP</span><h2>Operational readiness</h2></div></div><div className="onboarding-grid">{steps.map(([label, done]) => <div key={label} className={done ? "done" : "pending"}><span>{done ? "✓" : "○"}</span><strong>{label}</strong></div>)}</div>{!onboarding?.participant_path_configured && <button className="saas-secondary" onClick={onCommuterIntake}>Mark commuter intake workflow reviewed</button>}<p className="saas-small-note">These are administrator configuration states only. They do not certify regulatory compliance, transportation availability, safety, or program outcomes.</p></section></>;
}

function MetricCard({ label, value, note }: { label: string; value: string; note: string }) { return <article className="saas-metric-card"><small>{label}</small><strong>{value}</strong><span>{note}</span></article>; }

function CrudPanel({ title, description, form, items }: { title: string; description: string; form: React.ReactNode; items: { title: string; meta: string; detail: string }[] }) {
  return <div className="saas-crud-layout"><section className="saas-panel"><span className="saas-kicker">CREATE / CONFIGURE</span><h2>{title}</h2><p>{description}</p><div className="saas-form-stack">{form}</div></section><section className="saas-panel"><div className="saas-panel-heading"><div><span className="saas-kicker">CURRENT RECORDS</span><h2>{items.length} {title.toLowerCase()}</h2></div></div><div className="saas-record-list">{items.length ? items.map((item) => <article key={`${item.title}-${item.meta}`}><strong>{item.title}</strong><span>{item.meta}</span><p>{item.detail}</p></article>) : <div className="saas-empty">No records configured yet.</div>}</div></section></div>;
}

function messageOf(reason: unknown) { return reason instanceof Error ? reason.message : "Something went wrong."; }
