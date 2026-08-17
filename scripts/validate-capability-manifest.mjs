#!/usr/bin/env node
import { createHash } from "node:crypto";
import { existsSync, readFileSync, readdirSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const failures = [];
const warnings = [];

function fail(message) { failures.push(message); }
function warn(message) { warnings.push(message); }
function readJson(relativePath) {
  const filePath = path.join(root, relativePath);
  if (!existsSync(filePath)) {
    fail(`${relativePath} is missing`);
    return null;
  }
  try {
    return JSON.parse(readFileSync(filePath, "utf8"));
  } catch (error) {
    fail(`${relativePath} is not valid JSON: ${error.message}`);
    return null;
  }
}

const deployment = readJson("DEPLOYMENT.json");
if (!deployment) {
  console.error(failures.join("\n"));
  process.exit(1);
}

const manifestPath = deployment?.source_of_truth?.capability_manifest;
if (typeof manifestPath !== "string" || !manifestPath) fail("DEPLOYMENT.json must identify source_of_truth.capability_manifest");
const manifest = manifestPath ? readJson(manifestPath) : null;

if (deployment.schema_version !== "relay-deployment-v1") fail("DEPLOYMENT.json schema_version must be relay-deployment-v1");
if (deployment.environment !== "production") fail("DEPLOYMENT.json environment must be production");
if (deployment.product_state !== "research_beta") fail("DEPLOYMENT.json product_state must remain research_beta until explicitly changed by an audited release");

const database = deployment.database ?? {};
if (database.project_ref !== "dzrqrqfxcihvufvyctbt") fail("DEPLOYMENT.json points at an unexpected Supabase project_ref");
if (!String(database.publishable_key ?? "").startsWith("sb_publishable_")) fail("DEPLOYMENT.json must contain the public Supabase publishable key used by the deployment-head check");

const repoHeadPath = database?.repo_migration_head?.path;
if (typeof repoHeadPath !== "string" || !repoHeadPath) {
  fail("DEPLOYMENT.json must define database.repo_migration_head.path");
} else {
  const repoHeadFullPath = path.join(root, repoHeadPath);
  if (!existsSync(repoHeadFullPath)) fail(`Declared repository migration head does not exist: ${repoHeadPath}`);

  const migrationDir = path.join(root, "supabase", "migrations");
  const migrations = readdirSync(migrationDir)
    .filter((name) => /^\d{14}_.+\.sql$/.test(name))
    .sort();
  const latest = migrations.at(-1);
  if (!latest) fail("No timestamped Supabase migrations were found");
  if (latest && path.basename(repoHeadPath) !== latest) {
    fail(`Repository migration drift: DEPLOYMENT.json declares ${path.basename(repoHeadPath)} but latest migration is ${latest}`);
  }
  const declaredVersion = String(database?.repo_migration_head?.version ?? "");
  const filenameVersion = path.basename(repoHeadPath).slice(0, 14);
  if (declaredVersion !== filenameVersion) fail(`Repository migration version mismatch: ${declaredVersion} != ${filenameVersion}`);
}

const liveHead = database.live_migration_head ?? {};
if (!/^\d{14}$/.test(String(liveHead.version ?? ""))) fail("database.live_migration_head.version must be a 14-digit migration version");
if (typeof liveHead.name !== "string" || !liveHead.name) fail("database.live_migration_head.name is required");
if (!/^[a-f0-9]{32}$/.test(String(liveHead.fingerprint ?? ""))) fail("database.live_migration_head.fingerprint must be an md5 checksum");
if (liveHead.version && liveHead.name) {
  const calculated = createHash("md5").update(`${liveHead.version}:${liveHead.name}`).digest("hex");
  if (calculated !== liveHead.fingerprint) fail("Stored live migration fingerprint does not match live_migration_head.version:name");
}

if (database?.rule2202_persistence?.applied !== true) fail("Rule 2202 persistence cannot be promoted unless DEPLOYMENT.json records the migration as applied");
if (deployment?.verification?.rule2202_rls_enabled !== true) fail("Rule 2202 persistence cannot be promoted without verified RLS");
if (deployment?.verification?.rule2202_authenticated_rollback_smoke?.passed !== true) fail("Rule 2202 persistence cannot be promoted without an authenticated rollback smoke test");
if (deployment?.verification?.rule2202_authenticated_rollback_smoke?.post_rollback_smoke_rows !== 0) fail("Rule 2202 rollback smoke test left synthetic rows behind");

if (manifest) {
  if (manifest.schema_version !== "relay-current-state-v1") fail("Capability manifest schema_version must be relay-current-state-v1");
  if (manifest.product_state !== deployment.product_state) fail("Capability manifest and DEPLOYMENT.json disagree on product_state");
  if (manifest?.authority?.supabase?.project_ref !== database.project_ref) fail("Capability manifest and DEPLOYMENT.json disagree on Supabase project_ref");

  const expectedObservedHead = `${liveHead.version}:${liveHead.name}`;
  if (manifest?.authority?.supabase?.observed_migration_head !== expectedObservedHead) {
    fail(`Capability manifest migration head is stale: expected ${expectedObservedHead}`);
  }
  if (manifest?.authority?.supabase?.rule2202_persistence_migration_applied !== true) fail("Capability manifest still reports Rule 2202 persistence as unapplied");

  const states = new Set(Array.isArray(manifest.states) ? manifest.states : []);
  const requiredStates = [
    "LIVE_REACHABLE", "LIVE_PERSISTED", "BACKEND_LIVE_UI_DORMANT", "SPECIAL_VIEW",
    "PROTOTYPE_SESSION", "CODE_ONLY", "SCHEMA_ONLY_BLUEPRINT", "NOT_IMPLEMENTED", "DEPLOYMENT_UNVERIFIED"
  ];
  for (const state of requiredStates) if (!states.has(state)) fail(`Capability manifest is missing state ${state}`);

  const capabilities = Array.isArray(manifest.capabilities) ? manifest.capabilities : [];
  const ids = new Set();
  for (const capability of capabilities) {
    if (!capability?.id || typeof capability.id !== "string") { fail("Every capability must have a string id"); continue; }
    if (ids.has(capability.id)) fail(`Duplicate capability id: ${capability.id}`);
    ids.add(capability.id);
    if (!states.has(capability.state)) fail(`${capability.id} uses unknown state ${capability.state}`);
    if (!capability.surface) fail(`${capability.id} is missing surface`);
    if (capability.state === "LIVE_PERSISTED" && (!Array.isArray(capability.evidence) || capability.evidence.length === 0)) {
      fail(`${capability.id} is LIVE_PERSISTED without evidence references`);
    }
  }

  const rule2202 = capabilities.find((item) => item.id === "rule2202_persistence");
  const promotedState = deployment?.promotion_gates?.rule2202_persistence?.state;
  if (!rule2202) fail("Capability manifest is missing rule2202_persistence");
  else if (rule2202.state !== promotedState) fail(`Rule 2202 promotion mismatch: manifest=${rule2202.state}, DEPLOYMENT=${promotedState}`);

  const p0Gaps = new Set(Array.isArray(manifest.p0_gaps) ? manifest.p0_gaps : []);
  if (p0Gaps.has("rule2202_schema_deployment_drift")) fail("Resolved Rule 2202 schema drift is still listed as a P0 gap");

  const forbiddenClaims = new Set(Array.isArray(manifest.forbidden_live_claims) ? manifest.forbidden_live_claims : []);
  for (const claim of ["live dispatch", "guaranteed transportation", "automatic AQMD filing", "live routing/detour calculation", "integrated commuter-to-admin production workflow"]) {
    if (!forbiddenClaims.has(claim)) fail(`Capability manifest lost required forbidden live claim: ${claim}`);
  }
}

if (deployment?.institutional_runtime?.hosting_deployment_sha_verified !== true) {
  warn("Hosting deployment SHA remains unverified; source-of-truth claims must retain DEPLOYMENT_UNVERIFIED for exact hosting provenance.");
}

for (const message of warnings) console.warn(`WARN: ${message}`);
if (failures.length) {
  console.error("Source-of-truth validation failed:\n");
  for (const message of failures) console.error(`- ${message}`);
  process.exit(1);
}

console.log("Capability manifest and deployment contract are internally consistent.");
