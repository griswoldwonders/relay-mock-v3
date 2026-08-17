#!/usr/bin/env node
import { existsSync, readFileSync, readdirSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const localOnly = process.argv.includes("--local-only");
const deploymentPath = path.join(root, "DEPLOYMENT.json");

if (!existsSync(deploymentPath)) {
  console.error("DEPLOYMENT.json is missing.");
  process.exit(1);
}

const deployment = JSON.parse(readFileSync(deploymentPath, "utf8"));
const database = deployment.database ?? {};
const declaredRepoHead = database?.repo_migration_head?.path;
const migrationDir = path.join(root, "supabase", "migrations");
const migrations = readdirSync(migrationDir)
  .filter((name) => /^\d{14}_.+\.sql$/.test(name))
  .sort();
const latestRepoMigration = migrations.at(-1);

if (!latestRepoMigration) {
  console.error("No timestamped migrations found in supabase/migrations.");
  process.exit(1);
}

if (path.basename(declaredRepoHead ?? "") !== latestRepoMigration) {
  console.error("Repository migration-head drift detected.");
  console.error(`DEPLOYMENT.json: ${declaredRepoHead ?? "<missing>"}`);
  console.error(`Repository head: supabase/migrations/${latestRepoMigration}`);
  console.error("Apply/review the migration and update DEPLOYMENT.json in the same release before deployment.");
  process.exit(1);
}

console.log(`Repository migration head verified: ${latestRepoMigration}`);

if (localOnly) {
  console.log("Live database head check skipped by --local-only.");
  process.exit(0);
}

const restUrl = String(database.rest_url ?? "").replace(/\/$/, "");
const endpoint = database.live_head_endpoint;
const publishableKey = database.publishable_key;
const expected = database.live_migration_head ?? {};

if (!restUrl || !endpoint || !publishableKey || !expected.version || !expected.fingerprint) {
  console.error("DEPLOYMENT.json does not contain a complete live database-head contract.");
  process.exit(1);
}

let response;
try {
  response = await fetch(`${restUrl}${endpoint}`, {
    headers: {
      apikey: publishableKey,
      Accept: "application/json"
    },
    signal: AbortSignal.timeout(10000)
  });
} catch (error) {
  console.error(`Unable to reach live database migration-head endpoint: ${error.message}`);
  process.exit(1);
}

if (!response.ok) {
  const body = await response.text();
  console.error(`Live database migration-head endpoint returned HTTP ${response.status}.`);
  console.error(body.slice(0, 500));
  process.exit(1);
}

let payload;
try {
  payload = await response.json();
} catch (error) {
  console.error(`Live database migration-head endpoint returned invalid JSON: ${error.message}`);
  process.exit(1);
}

const observed = Array.isArray(payload) ? payload[0] : null;
if (!observed?.migration_version || !observed?.migration_fingerprint) {
  console.error("Live database migration-head endpoint did not return the expected fingerprint row.");
  process.exit(1);
}

if (observed.migration_version !== expected.version || observed.migration_fingerprint !== expected.fingerprint) {
  console.error("LIVE DATABASE MIGRATION DRIFT DETECTED.");
  console.error(`Expected version:    ${expected.version}`);
  console.error(`Observed version:    ${observed.migration_version}`);
  console.error(`Expected fingerprint:${expected.fingerprint}`);
  console.error(`Observed fingerprint:${observed.migration_fingerprint}`);
  console.error("Deployment is blocked. Reconcile Supabase migration history and update DEPLOYMENT.json only after the live migration is verified.");
  process.exit(1);
}

console.log(`Live database migration head verified: ${observed.migration_version} / ${observed.migration_fingerprint}`);
