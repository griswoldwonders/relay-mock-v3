import { useCallback, useEffect, useMemo, useState } from "react";
import type { Cohort, DataSource, Organization, OrganizationSite, SaasSession, TdmProgram } from "./saasApi";
import {
  assignProgramCohort,
  assignProgramSite,
  assignSite,
  createInvitation,
  enrollCohortMember,
  generateMatchPreviews,
  getCorridorIntelligence,
  getMatchQueue,
  getMemberDirectory,
  importCommuteRecords,
  importRoster,
  listCohortMemberships,
  listIngestionRuns,
  listInvalidRows,
  listInvitations,
  listProgramCohorts,
  listProgramSites,
  listSiteAssignments,
  listTasks,
  removeCohortMember,
  removeProgramCohort,
  removeProgramSite,
  removeSiteAssignment,
  updateMember,
  updateTask,
  type CohortMembership,
  type CorridorSummary,
  type IngestionRun,
  type InvalidIngestionRow,
  type Invitation,
  type MatchQueueRow,
  type MemberDirectoryRow,
  type OperationalTask,
  type ProgramCohort,
  type ProgramSite,
  type SiteAssignment,
} from "./operationalApi";
import { COMMUTE_TEMPLATE, ROSTER_TEMPLATE, downloadCsvTemplate, normalizeCommuteRows, normalizeRosterRows, parseCsv, sha256Hex } from "./operationalCsv";
import "./operational-engine.css";

type OpsView = "members" | "assignments" | "imports" | "tasks" | "corridors" | "matches";
type Props = {
  session: SaasSession;
  organization: Organization;
  role: string;
  sites: OrganizationSite[];
  cohorts: Cohort[];
  programs: TdmProgram[];
  sources: DataSource[];
  onChanged?: () => void | Promise<void>;
};

const OPS_NAV: { id: OpsView; label: string }[] = [
  { id: "members", label: "Members" },
  { id: "assignments", label: "Assignments" },
  { id: "imports", label: "CSV + Provenance" },
  { id: "tasks", label: "Task Queue" },
  { id: "corridors", label: "Corridor Intelligence" },
  { id: "matches", label: "Match Previews" },
];

const MANAGE_ROLES = new Set(["owner", "admin", "program_admin", "tdm_manager"]);
const REVIEW_ROLES = new Set([...MANAGE_ROLES, "reviewer"]);

export default function OperationalEngine({ session, organization, role, sites, cohorts, programs, sources, onChanged }: Props) {
  const [view, setView] = useState<OpsView>("members");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [members, setMembers] = useState<MemberDirectoryRow[]>([]);
  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const [siteAssignments, setSiteAssignments] = useState<SiteAssignment[]>([]);
  const [cohortMemberships, setCohortMemberships] = useState<CohortMembership[]>([]);
  const [programSites, setProgramSites] = useState<ProgramSite[]>([]);
  const [programCohorts, setProgramCohorts] = useState<ProgramCohort[]>([]);
  const [runs, setRuns] = useState<IngestionRun[]>([]);
  const [invalidRows, setInvalidRows] = useState<InvalidIngestionRow[]>([]);
  const [tasks, setTasks] = useState<OperationalTask[]>([]);
  const [corridors, setCorridors] = useState<CorridorSummary[]>([]);
  const [matches, setMatches] = useState<MatchQueueRow[]>([]);
  const [selectedRun, setSelectedRun] = useState("");

  const canManage = MANAGE_ROLES.has(role);
  const canReview = REVIEW_ROLES.has(role);

  const loadAll = useCallback(async () => {
    setLoading(true); setError("");
    try {
      const [runRows, taskRows, corridorRows, matchRows] = await Promise.all([
        listIngestionRuns(session, organization.id),
        listTasks(session, organization.id),
        getCorridorIntelligence(session, organization.id, 3),
        getMatchQueue(session, organization.id),
      ]);
      setRuns(runRows); setTasks(taskRows); setCorridors(corridorRows); setMatches(matchRows);
      if (canManage) {
        const [memberRows, inviteRows, siteRows, cohortRows, pSites, pCohorts] = await Promise.all([
          getMemberDirectory(session, organization.id), listInvitations(session, organization.id), listSiteAssignments(session, organization.id), listCohortMemberships(session, organization.id), listProgramSites(session, organization.id), listProgramCohorts(session, organization.id),
        ]);
        setMembers(memberRows); setInvitations(inviteRows); setSiteAssignments(siteRows); setCohortMemberships(cohortRows); setProgramSites(pSites); setProgramCohorts(pCohorts);
      }
    } catch (reason) { setError(messageOf(reason)); }
    finally { setLoading(false); }
  }, [session, organization.id, canManage]);

  useEffect(() => { loadAll(); }, [loadAll]);

  async function changed(message: string) {
    setNotice(message); setError("");
    await loadAll();
    await onChanged?.();
  }

  return <section className="ops-shell">
    <header className="ops-header"><div><span className="ops-kicker">OPERATIONAL ENGINE · REAL TENANT DATA</span><h2>{organization.name}</h2><p>Governed membership, imports, task resolution, corridor intelligence, and explainable commuter-option previews.</p></div><div className="ops-role"><strong>{role.replaceAll("_", " ")}</strong><span>{canManage ? "management" : canReview ? "review" : "analysis"} permissions</span></div></header>
    <nav className="ops-nav">{OPS_NAV.map((item) => <button key={item.id} className={view === item.id ? "active" : ""} onClick={() => setView(item.id)}>{item.label}</button>)}</nav>
    {error && <div className="ops-alert error">{error}</div>}
    {notice && <div className="ops-alert notice">{notice}</div>}
    {loading ? <div className="ops-loading">Loading organization operations…</div> : <>
      {view === "members" && <MembersPanel {...{ session, organization, sites, cohorts, members, invitations, canManage, changed, setError }} />}
      {view === "assignments" && <AssignmentsPanel {...{ session, organization, sites, cohorts, programs, members, siteAssignments, cohortMemberships, programSites, programCohorts, canManage, changed, setError }} />}
      {view === "imports" && <ImportsPanel {...{ session, organization, sites, cohorts, sources, runs, selectedRun, invalidRows, setInvalidRows, setSelectedRun, canManage, changed, setError }} />}
      {view === "tasks" && <TasksPanel {...{ session, tasks, canReview, changed, setError }} />}
      {view === "corridors" && <CorridorPanel corridors={corridors} />}
      {view === "matches" && <MatchPanel {...{ session, organization, matches, canReview, changed, setError }} />}
    </>}
  </section>;
}

function MembersPanel({ session, organization, sites, cohorts, members, invitations, canManage, changed, setError }: any) {
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("analyst");
  const [siteId, setSiteId] = useState("");
  const [siteRole, setSiteRole] = useState("site_member");
  const [cohortId, setCohortId] = useState("");
  const [inviteLink, setInviteLink] = useState("");

  if (!canManage) return <LockedPanel title="Member management" text="Your role can analyze operational data but cannot invite or modify organization members." />;

  async function invite() {
    if (!email.trim()) return;
    try {
      const result = await createInvitation(session, organization.id, { email: email.trim(), role, siteId: siteId || null, siteRole: siteId ? siteRole : null, cohortId: cohortId || null, expiresDays: 7 });
      const url = new URL(window.location.href); url.search = ""; url.hash = ""; url.searchParams.set("invite", result.invite_token);
      setInviteLink(url.toString()); setEmail("");
      await changed("Invitation created. Share the one-time link with the invited account; automated invitation email is not connected yet.");
    } catch (reason) { setError(messageOf(reason)); }
  }

  return <div className="ops-two-col"><div className="ops-panel"><span className="ops-kicker">INSTITUTION INVITATIONS</span><h3>Invite a member</h3><p>Invitation tokens are generated once and stored only as hashes. The authenticated invitee must use the same email address.</p><div className="ops-form"><input value={email} type="email" placeholder="name@institution.org" onChange={(e) => setEmail(e.currentTarget.value)} /><select value={role} onChange={(e) => setRole(e.currentTarget.value)}>{["admin","program_admin","tdm_manager","sustainability_manager","site_manager","analyst","reviewer","participant"].map((item) => <option key={item} value={item}>{item.replaceAll("_"," ")}</option>)}</select><select value={siteId} onChange={(e) => setSiteId(e.currentTarget.value)}><option value="">No default site</option>{sites.map((site: OrganizationSite) => <option key={site.id} value={site.id}>{site.name}</option>)}</select>{siteId && <select value={siteRole} onChange={(e) => setSiteRole(e.currentTarget.value)}>{["site_member","site_manager","analyst","reviewer","participant"].map((item) => <option key={item} value={item}>{item.replaceAll("_"," ")}</option>)}</select>}<select value={cohortId} onChange={(e) => setCohortId(e.currentTarget.value)}><option value="">No default cohort</option>{cohorts.map((cohort: Cohort) => <option key={cohort.id} value={cohort.id}>{cohort.name}</option>)}</select><button onClick={invite}>Create one-time invite link</button></div>{inviteLink && <div className="ops-invite-link"><input readOnly value={inviteLink} /><button onClick={() => navigator.clipboard.writeText(inviteLink)}>Copy</button></div>}<div className="ops-list compact">{invitations.slice(0,12).map((invite: Invitation) => <article key={invite.id}><strong>{invite.invited_email}</strong><span>{invite.role.replaceAll("_"," ")} · {invite.status}</span><small>Expires {new Date(invite.expires_at).toLocaleString()}</small></article>)}</div></div><div className="ops-panel"><span className="ops-kicker">MEMBER DIRECTORY</span><h3>{members.length} authenticated members</h3><div className="ops-list">{members.map((member: MemberDirectoryRow) => <article key={member.user_id}><div><strong>{member.email}</strong><span>{member.site_count} site assignments · {member.cohort_count} cohorts</span></div><div className="ops-row-actions"><select value={member.role} onChange={async (e) => { try { await updateMember(session, organization.id, member.user_id, e.currentTarget.value, member.status); await changed("Member role updated."); } catch (reason) { setError(messageOf(reason)); } }}>{["owner","admin","program_admin","tdm_manager","sustainability_manager","site_manager","analyst","reviewer","participant"].map((item) => <option key={item} value={item}>{item.replaceAll("_"," ")}</option>)}</select><button onClick={async () => { try { await updateMember(session, organization.id, member.user_id, member.role, member.status === "active" ? "suspended" : "active"); await changed(`Member ${member.status === "active" ? "suspended" : "activated"}.`); } catch (reason) { setError(messageOf(reason)); } }}>{member.status === "active" ? "Suspend" : "Activate"}</button></div></article>)}</div></div></div>;
}

function AssignmentsPanel({ session, organization, sites, cohorts, programs, members, siteAssignments, cohortMemberships, programSites, programCohorts, canManage, changed, setError }: any) {
  const [memberId, setMemberId] = useState(""); const [siteId, setSiteId] = useState(""); const [siteRole, setSiteRole] = useState("site_member");
  const [cohortMemberId, setCohortMemberId] = useState(""); const [cohortId, setCohortId] = useState("");
  const [programId, setProgramId] = useState(""); const [programSiteId, setProgramSiteId] = useState(""); const [programCohortId, setProgramCohortId] = useState("");
  const memberEmail = (id: string) => members.find((m: MemberDirectoryRow) => m.user_id===id)?.email ?? `${id.slice(0,8)}…`;
  const siteName = (id: string) => sites.find((s: OrganizationSite) => s.id===id)?.name ?? "Unknown site";
  const cohortName = (id: string) => cohorts.find((c: Cohort) => c.id===id)?.name ?? "Unknown cohort";
  const programName = (id: string) => programs.find((p: TdmProgram) => p.id===id)?.name ?? "Unknown program";
  if (!canManage) return <LockedPanel title="Assignments" text="Site roles, cohort enrollment, and program scope can only be changed by organization management roles." />;
  return <div className="ops-stack"><div className="ops-three-col"><div className="ops-panel"><h3>Site-role assignment</h3><div className="ops-form"><select value={memberId} onChange={(e)=>setMemberId(e.currentTarget.value)}><option value="">Choose member</option>{members.map((m: MemberDirectoryRow)=><option key={m.user_id} value={m.user_id}>{m.email}</option>)}</select><select value={siteId} onChange={(e)=>setSiteId(e.currentTarget.value)}><option value="">Choose site</option>{sites.map((s: OrganizationSite)=><option key={s.id} value={s.id}>{s.name}</option>)}</select><select value={siteRole} onChange={(e)=>setSiteRole(e.currentTarget.value)}>{["site_member","site_manager","analyst","reviewer","participant"].map(x=><option key={x}>{x}</option>)}</select><button disabled={!memberId||!siteId} onClick={async()=>{try{await assignSite(session,organization.id,siteId,memberId,siteRole);await changed("Site-role assignment saved.");}catch(r){setError(messageOf(r));}}}>Assign site role</button></div></div><div className="ops-panel"><h3>Cohort enrollment</h3><div className="ops-form"><select value={cohortMemberId} onChange={(e)=>setCohortMemberId(e.currentTarget.value)}><option value="">Choose member</option>{members.map((m: MemberDirectoryRow)=><option key={m.user_id} value={m.user_id}>{m.email}</option>)}</select><select value={cohortId} onChange={(e)=>setCohortId(e.currentTarget.value)}><option value="">Choose cohort</option>{cohorts.map((c: Cohort)=><option key={c.id} value={c.id}>{c.name}</option>)}</select><button disabled={!cohortMemberId||!cohortId} onClick={async()=>{try{await enrollCohortMember(session,organization.id,cohortId,cohortMemberId);await changed("Authenticated member enrolled in cohort.");}catch(r){setError(messageOf(r));}}}>Enroll member</button></div></div><div className="ops-panel"><h3>Program scope</h3><div className="ops-form"><select value={programId} onChange={(e)=>setProgramId(e.currentTarget.value)}><option value="">Choose program</option>{programs.map((p: TdmProgram)=><option key={p.id} value={p.id}>{p.name}</option>)}</select><select value={programSiteId} onChange={(e)=>setProgramSiteId(e.currentTarget.value)}><option value="">Assign a site</option>{sites.map((s: OrganizationSite)=><option key={s.id} value={s.id}>{s.name}</option>)}</select><button disabled={!programId||!programSiteId} onClick={async()=>{try{await assignProgramSite(session,organization.id,programId,programSiteId);await changed("Program assigned to site.");}catch(r){setError(messageOf(r));}}}>Assign site</button><select value={programCohortId} onChange={(e)=>setProgramCohortId(e.currentTarget.value)}><option value="">Assign a cohort</option>{cohorts.map((c: Cohort)=><option key={c.id} value={c.id}>{c.name}</option>)}</select><button disabled={!programId||!programCohortId} onClick={async()=>{try{await assignProgramCohort(session,organization.id,programId,programCohortId);await changed("Program assigned to cohort.");}catch(r){setError(messageOf(r));}}}>Assign cohort</button></div></div></div><div className="ops-three-col"><AssignmentList title="Site roles" items={siteAssignments.map((x: SiteAssignment)=>({id:`${x.site_id}-${x.user_id}`,title:memberEmail(x.user_id),meta:`${siteName(x.site_id)} · ${x.role}`,remove:()=>removeSiteAssignment(session,x.site_id,x.user_id)}))} changed={changed} setError={setError}/><AssignmentList title="Cohort members" items={cohortMemberships.filter((x:CohortMembership)=>x.status==='active').map((x:CohortMembership)=>({id:`${x.cohort_id}-${x.user_id}`,title:memberEmail(x.user_id),meta:cohortName(x.cohort_id),remove:()=>removeCohortMember(session,x.cohort_id,x.user_id)}))} changed={changed} setError={setError}/><AssignmentList title="Program scope" items={[...programSites.map((x:ProgramSite)=>({id:`ps-${x.program_id}-${x.site_id}`,title:programName(x.program_id),meta:`Site · ${siteName(x.site_id)}`,remove:()=>removeProgramSite(session,x.program_id,x.site_id)})),...programCohorts.map((x:ProgramCohort)=>({id:`pc-${x.program_id}-${x.cohort_id}`,title:programName(x.program_id),meta:`Cohort · ${cohortName(x.cohort_id)}`,remove:()=>removeProgramCohort(session,x.program_id,x.cohort_id)}))]} changed={changed} setError={setError}/></div></div>;
}

function AssignmentList({title,items,changed,setError}:any){return <div className="ops-panel"><h3>{title}</h3><div className="ops-list compact">{items.length?items.map((item:any)=><article key={item.id}><div><strong>{item.title}</strong><span>{item.meta}</span></div><button onClick={async()=>{try{await item.remove();await changed("Assignment removed.");}catch(r){setError(messageOf(r));}}}>Remove</button></article>):<div className="ops-empty">No assignments yet.</div>}</div></div>}

function ImportsPanel({ session, organization, sites, cohorts, sources, runs, selectedRun, invalidRows, setInvalidRows, setSelectedRun, canManage, changed, setError }: any) {
  const [kind,setKind]=useState<"commute"|"roster">("commute"); const [file,setFile]=useState<File|null>(null); const [sourceId,setSourceId]=useState(""); const [siteId,setSiteId]=useState(""); const [cohortId,setCohortId]=useState(""); const [zoneConfirmed,setZoneConfirmed]=useState(false); const [busy,setBusy]=useState(false);
  const eligibleSources = sources.filter((s:DataSource)=>kind==="roster"?["roster_csv","manual"].includes(s.source_type):["survey_csv","manual","participant_intake"].includes(s.source_type));
  if(!canManage) return <LockedPanel title="CSV ingestion" text="Your role can inspect provenance and validation outcomes but cannot upload or alter source records." />;
  async function runImport(){if(!file||!cohortId||(kind==="commute"&&!zoneConfirmed))return;setBusy(true);try{const text=await file.text();const parsed=parseCsv(text);if(!parsed.length)throw new Error("CSV contains no data rows.");const hash=await sha256Hex(text);const result=kind==="roster"?await importRoster(session,organization.id,{cohortId,sourceId:sourceId||null,fileName:file.name,hash,rows:normalizeRosterRows(parsed),siteId:siteId||null}):await importCommuteRecords(session,organization.id,{sourceId:sourceId||null,fileName:file.name,hash,rows:normalizeCommuteRows(parsed),siteId:siteId||null,cohortId:cohortId||null});setFile(null);await changed(`${result.valid_row_count} rows accepted; ${result.invalid_row_count} require review.`);}catch(r){setError(messageOf(r));}finally{setBusy(false);}}
  return <div className="ops-two-col"><div className="ops-panel"><span className="ops-kicker">INGEST + PROVENANCE</span><h3>Upload controlled CSV</h3><p>Files are parsed in the browser; normalized rows and a SHA-256 provenance hash are persisted. Raw files are not stored by this workflow.</p><div className="ops-form"><select value={kind} onChange={(e)=>setKind(e.currentTarget.value as any)}><option value="commute">Commute survey / signal CSV</option><option value="roster">Cohort roster CSV</option></select><button className="ops-secondary" onClick={()=>downloadCsvTemplate(kind==="commute"?"relay-commute-template.csv":"relay-roster-template.csv",kind==="commute"?COMMUTE_TEMPLATE:ROSTER_TEMPLATE)}>Download template</button><select value={sourceId} onChange={(e)=>setSourceId(e.currentTarget.value)}><option value="">No registered source link</option>{eligibleSources.map((s:DataSource)=><option key={s.id} value={s.id}>{s.name}</option>)}</select><select value={siteId} onChange={(e)=>setSiteId(e.currentTarget.value)}><option value="">Organization-wide / no site</option>{sites.map((s:OrganizationSite)=><option key={s.id} value={s.id}>{s.name}</option>)}</select><select value={cohortId} onChange={(e)=>setCohortId(e.currentTarget.value)}><option value="">Choose cohort</option>{cohorts.map((c:Cohort)=><option key={c.id} value={c.id}>{c.name}</option>)}</select>{kind==="commute"&&<label className="ops-check"><input type="checkbox" checked={zoneConfirmed} onChange={(e)=>setZoneConfirmed(e.currentTarget.checked)}/><span>I confirm origin/destination values are approximate zones, not exact home addresses.</span></label>}<input type="file" accept=".csv,text/csv" onChange={(e)=>setFile(e.currentTarget.files?.[0]??null)}/><button disabled={!file||!cohortId||(kind==="commute"&&!zoneConfirmed)||busy} onClick={runImport}>{busy?"Importing…":"Validate and import"}</button></div></div><div className="ops-panel"><span className="ops-kicker">RUN HISTORY</span><h3>Latest ingestion runs</h3><div className="ops-list">{runs.length?runs.map((run:IngestionRun)=><article key={run.id} className={selectedRun===run.id?"selected":""}><div><strong>{run.file_name}</strong><span>{run.import_type.replaceAll("_"," ")} · {run.status}</span><small>{run.valid_row_count}/{run.row_count} valid · {run.invalid_row_count} invalid · hash {run.content_sha256.slice(0,10)}…</small></div>{run.invalid_row_count>0&&<button onClick={async()=>{try{setSelectedRun(run.id);setInvalidRows(await listInvalidRows(session,run.id));}catch(r){setError(messageOf(r));}}}>Review errors</button>}</article>):<div className="ops-empty">No ingestion runs yet.</div>}</div>{selectedRun&&<div className="ops-validation"><h4>Validation errors</h4>{invalidRows.length?invalidRows.map((row:InvalidIngestionRow)=><p key={row.id}><strong>Row {row.row_number}</strong> · {row.validation_errors.join("; ")}</p>):<p>No invalid rows returned.</p>}</div>}</div></div>;
}

function TasksPanel({session,tasks,canReview,changed,setError}:any){const open=tasks.filter((t:OperationalTask)=>!["resolved","dismissed"].includes(t.status));return <div className="ops-panel"><span className="ops-kicker">TASK QUEUE</span><h3>{open.length} active operational tasks</h3><p>Tasks are generated by data-quality and match-review workflows. Resolution is an administrative action, not an automatic program outcome.</p><div className="ops-list">{tasks.length?tasks.map((task:OperationalTask)=><article key={task.id}><div><strong>{task.title}</strong><span>{task.category.replaceAll("_"," ")} · {task.priority} · {task.status}</span><small>{task.detail??"No detail"}</small></div>{canReview&&!["resolved","dismissed"].includes(task.status)&&<div className="ops-row-actions"><button onClick={async()=>{try{await updateTask(session,task.id,"in_progress");await changed("Task moved to in progress.");}catch(r){setError(messageOf(r));}}}>In progress</button><button onClick={async()=>{try{await updateTask(session,task.id,"resolved");await changed("Task resolved.");}catch(r){setError(messageOf(r));}}}>Resolve</button><button onClick={async()=>{try{await updateTask(session,task.id,"dismissed");await changed("Task dismissed.");}catch(r){setError(messageOf(r));}}}>Dismiss</button></div>}</article>):<div className="ops-empty">No operational tasks yet.</div>}</div></div>}

function CorridorPanel({corridors}:{corridors:CorridorSummary[]}){return <div className="ops-panel"><span className="ops-kicker">REAL CORRIDOR INTELLIGENCE</span><h3>{corridors.length} reportable corridors</h3><p>Directional corridors are derived from imported and authenticated approximate-zone signals. Groups with fewer than three distinct signals are suppressed.</p><div className="ops-table"><div className="ops-table-head"><span>Corridor</span><span>Signals</span><span>Parking</span><span>Access Point</span><span>EV / hybrid</span><span>Days</span></div>{corridors.length?corridors.map(c=><div className="ops-table-row" key={`${c.origin_zone}-${c.destination_zone}`}><span><strong>{c.origin_zone} → {c.destination_zone}</strong><small>{c.imported_signal_count} imported · {c.authenticated_signal_count} authenticated</small></span><span>{c.signal_count}</span><span>{c.parking_pressure_count}<small>{c.average_parking_difficulty?`avg ${c.average_parking_difficulty}`:""}</small></span><span>{c.access_point_interest_count}</span><span>{c.ev_hybrid_interest_count}</span><span>{c.travel_days.map(dayName).join(", ")}</span></div>):<div className="ops-empty">No corridor currently meets the three-signal privacy threshold. Import or collect more commute signals.</div>}</div></div>}

function MatchPanel({session,organization,matches,canReview,changed,setError}:any){const [busy,setBusy]=useState(false);async function generate(){setBusy(true);try{const count=await generateMatchPreviews(session,organization.id,5);await changed(`${count} deterministic Match Preview${count===1?"":"s"} generated for administrative review.`);}catch(r){setError(messageOf(r));}finally{setBusy(false);}}return <div className="ops-panel"><div className="ops-panel-heading"><div><span className="ops-kicker">DETERMINISTIC MATCH PREVIEW ENGINE</span><h3>{matches.length} commuter options in queue</h3><p>The engine uses same approximate O/D zones, overlapping commute days, time-window compatibility, Access Point signals, EV/hybrid preference, and contribution compatibility. It does not perform live dispatch or guarantee transportation.</p></div>{canReview&&<button disabled={busy} onClick={generate}>{busy?"Generating…":"Generate Match Previews"}</button>}</div><div className="ops-match-grid">{matches.length?matches.map((match:MatchQueueRow)=><article key={match.id}><div className="ops-score"><strong>{match.compatibility_score==null?"—":Math.round(Number(match.compatibility_score))}</strong><span>compatibility</span></div><div><h4>{match.origin_zone} → {match.destination_zone}</h4><p>{match.status.replaceAll("_"," ")} · administrative review required</p><div className="ops-tags"><span>Time: {match.time_window_fit??"not scored"}</span><span>Contribution: {match.contribution_compatibility??"not reviewed"}</span><span>Vehicle: {match.ev_hybrid_indicator??"unspecified"}</span></div><small>{String(match.explanation?.route_basis??"Route basis unavailable")} · {String(match.explanation?.detour_estimate??"Detour not calculated")}</small></div></article>):<div className="ops-empty">No Match Previews exist yet. The engine requires active canonical commuter needs and planned routes in the same institution.</div>}</div></div>}

function LockedPanel({title,text}:{title:string;text:string}){return <div className="ops-panel"><span className="ops-kicker">READ-ONLY ROLE</span><h3>{title}</h3><p>{text}</p></div>}
function dayName(day:number){return ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"][day]??String(day)}
function messageOf(reason:unknown){return reason instanceof Error?reason.message:"Something went wrong."}
