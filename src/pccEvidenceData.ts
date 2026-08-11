export type EvidenceClass = "official_estimate" | "institution_supplied" | "participant_reported" | "relay_observed" | "relay_modeled" | "unavailable";

export type EvidenceMetric = {
  key: string;
  label: string;
  value: number | null;
  unit: string;
  formatted?: string;
  evidenceClass: EvidenceClass;
  source: string;
  sourceUrl: string;
  vintage: string;
  geography: string;
  sampleSize: number | null;
  refreshedAt: string;
  methodology: string;
  limitations: string[];
  comparability: "high" | "medium" | "low" | "context_only" | "not_comparable";
};

export type PasadenaAcsContext = {
  status: "loading" | "ready" | "unavailable";
  metrics: EvidenceMetric[];
  message?: string;
};

const ACS_BASE = "https://api.census.gov/data/2024/acs/acs5";
const PASADENA_GEO = "Pasadena city, California (place 56000; state 06)";

function metric(partial: Omit<EvidenceMetric, "refreshedAt">): EvidenceMetric {
  return { ...partial, refreshedAt: new Date().toISOString() };
}

export const pccInstitutionalMetrics: EvidenceMetric[] = [
  metric({ key: "pcc_participant_count", label: "PCC participant cohort", value: null, unit: "participants", evidenceClass: "institution_supplied", source: "PCC institutional records or approved Relay Rider cohort import", sourceUrl: "", vintage: "Awaiting institutional import", geography: "PCC participating cohort", sampleSize: null, methodology: "Count unique eligible participant records after tenant-scoped validation.", limitations: ["No verified PCC institutional dataset is connected yet."], comparability: "high" }),
  metric({ key: "pcc_weekly_vmt_baseline", label: "PCC baseline weekly VMT", value: null, unit: "mi/week", evidenceClass: "institution_supplied", source: "PCC commute records / baseline survey", sourceUrl: "", vintage: "Awaiting institutional import", geography: "PCC participating cohort", sampleSize: null, methodology: "Participant commute distance and commute-day records; occupancy treatment must be documented and versioned.", limitations: ["Do not substitute ACS or LODES for PCC-specific VMT."], comparability: "high" }),
  metric({ key: "pcc_current_weekly_vmt", label: "Current observed weekly VMT", value: null, unit: "mi/week", evidenceClass: "participant_reported", source: "Relay Rider participant observation records", sourceUrl: "", vintage: "No live observation window locked", geography: "PCC participating cohort", sampleSize: null, methodology: "Current day-specific commute observations compared with the locked cohort baseline.", limitations: ["No current PCC observation period has been ingested yet."], comparability: "high" }),
  metric({ key: "pcc_modeled_co2e_difference", label: "Modeled emissions difference", value: null, unit: "kg CO2e/week", evidenceClass: "relay_modeled", source: "Derived from verified VMT difference using a versioned emissions methodology", sourceUrl: "https://ww2.arb.ca.gov/our-work/programs/msei/on-road-emfac", vintage: "Methodology not yet run", geography: "PCC participating cohort", sampleSize: null, methodology: "VMT difference × applicable CARB EMFAC2025 emission-rate assumptions. AQMD Rule 2202 factors are stored separately for compliance-support use.", limitations: ["Modeled only; not a certified emissions reduction or carbon offset.", "Requires verified VMT inputs and documented vehicle/fuel assumptions."], comparability: "high" }),
];

export const sourceRegistry = [
  { id: "acs_2024_5y", agency: "U.S. Census Bureau", dataset: "2024 ACS 5-Year", role: "Pasadena contextual commute baseline", url: "https://www.census.gov/data/developers/data-sets/acs-5year.html", evidenceClass: "official_estimate" as const },
  { id: "lodes_2023", agency: "U.S. Census Bureau LEHD", dataset: "LODES 8.x / 2023", role: "Workforce origin-destination context", url: "https://lehd.ces.census.gov/data/lodes/", evidenceClass: "official_estimate" as const },
  { id: "emfac2025", agency: "California Air Resources Board", dataset: "EMFAC2025", role: "Modeled on-road emissions methodology", url: "https://ww2.arb.ca.gov/our-work/programs/msei/on-road-emfac", evidenceClass: "relay_modeled" as const },
  { id: "aqmd_2202_2026", agency: "South Coast AQMD", dataset: "Rule 2202 2026 Emission Factors & Methodology", role: "Rule 2202 compliance-support reference", url: "https://www.aqmd.gov/home/programs/business/r2202-forms-guidelines", evidenceClass: "official_estimate" as const },
];

export async function fetchPasadenaAcsContext(apiKey?: string): Promise<PasadenaAcsContext> {
  try {
    const suffix = apiKey ? `&key=${encodeURIComponent(apiKey)}` : "";
    const [metaRes, dataRes] = await Promise.all([
      fetch(`${ACS_BASE}/groups/B08301.json`),
      fetch(`${ACS_BASE}?get=NAME,group(B08301)&for=place:56000&in=state:06${suffix}`),
    ]);
    if (!metaRes.ok || !dataRes.ok) throw new Error(`Census API returned ${metaRes.status}/${dataRes.status}`);
    const meta = await metaRes.json();
    const rows = await dataRes.json();
    const headers: string[] = rows[0];
    const values: string[] = rows[1];
    const row = Object.fromEntries(headers.map((h, i) => [h, values[i]]));
    const variables = meta.variables as Record<string, { label?: string; concept?: string }>;

    const findEstimate = (needle: string) => {
      const entry = Object.entries(variables).find(([key, value]) => key.endsWith("E") && value.label?.toLowerCase().includes(needle.toLowerCase()));
      if (!entry) return null;
      const raw = Number(row[entry[0]]);
      return Number.isFinite(raw) && raw >= 0 ? raw : null;
    };

    const total = findEstimate("Estimate!!Total:") ?? findEstimate("Total:");
    const driveAlone = findEstimate("Drove alone");
    const carpool = findEstimate("Carpooled");
    const transit = findEstimate("Public transportation");
    const walk = findEstimate("Walked");
    const bike = findEstimate("Bicycle");
    const wfh = findEstimate("Worked from home");
    const pct = (n: number | null) => total && n != null ? (n / total) * 100 : null;

    const common = {
      evidenceClass: "official_estimate" as const,
      source: "U.S. Census Bureau, 2024 ACS 5-Year, Table B08301",
      sourceUrl: "https://data.census.gov/table/ACSDT5Y2024.B08301",
      vintage: "2024 ACS 5-Year",
      geography: PASADENA_GEO,
      sampleSize: total,
      methodology: "Residence-based ACS estimate for workers age 16+; percentages calculated from published B08301 estimates.",
      limitations: ["ACS survey estimate; margins of error apply.", "Pasadena residents are contextual and are not a PCC commuter cohort."],
      comparability: "context_only" as const,
    };

    return { status: "ready", metrics: [
      metric({ key: "pasadena_drive_alone", label: "Pasadena drive-alone share", value: pct(driveAlone), formatted: pct(driveAlone) == null ? undefined : `${pct(driveAlone)!.toFixed(1)}%`, unit: "%", ...common }),
      metric({ key: "pasadena_carpool", label: "Pasadena carpool share", value: pct(carpool), formatted: pct(carpool) == null ? undefined : `${pct(carpool)!.toFixed(1)}%`, unit: "%", ...common }),
      metric({ key: "pasadena_transit", label: "Pasadena public-transit share", value: pct(transit), formatted: pct(transit) == null ? undefined : `${pct(transit)!.toFixed(1)}%`, unit: "%", ...common }),
      metric({ key: "pasadena_walk_bike", label: "Pasadena walk/bike share", value: pct((walk ?? 0) + (bike ?? 0)), formatted: pct((walk ?? 0) + (bike ?? 0)) == null ? undefined : `${pct((walk ?? 0) + (bike ?? 0))!.toFixed(1)}%`, unit: "%", ...common }),
      metric({ key: "pasadena_wfh", label: "Pasadena work-from-home share", value: pct(wfh), formatted: pct(wfh) == null ? undefined : `${pct(wfh)!.toFixed(1)}%`, unit: "%", ...common }),
    ] };
  } catch (error) {
    return { status: "unavailable", metrics: [], message: error instanceof Error ? error.message : "Unable to load Census context." };
  }
}
