export type PublicMetric = {
  key: string;
  label: string;
  value: string;
  source: string;
  sourceUrl: string;
  vintage: string;
  geography: string;
  evidenceClass: "official_estimate" | "official_observed";
  note?: string;
};

export const PASADENA_PUBLIC_METRICS: PublicMetric[] = [
  {
    key: "population_2025",
    label: "Population estimate",
    value: "135,804",
    source: "U.S. Census Bureau QuickFacts",
    sourceUrl: "https://www.census.gov/quickfacts/fact/table/pasadenacitycalifornia/PST045225",
    vintage: "July 1, 2025 population estimate",
    geography: "Pasadena city, California",
    evidenceClass: "official_estimate",
  },
  {
    key: "mean_commute_2024_1y",
    label: "Mean travel time to work",
    value: "29 min",
    source: "U.S. Census Bureau ACS 2024 1-Year via Census Reporter",
    sourceUrl: "https://censusreporter.org/profiles/16000US0656000-pasadena-ca/",
    vintage: "2024 ACS 1-Year",
    geography: "Pasadena city, California",
    evidenceClass: "official_estimate",
    note: "Workers age 16+; ACS estimate subject to sampling error.",
  },
  {
    key: "drive_alone",
    label: "Drive-alone share",
    value: "56%",
    source: "U.S. Census Bureau ACS 2024 1-Year via Census Reporter",
    sourceUrl: "https://censusreporter.org/profiles/16000US0656000-pasadena-ca/",
    vintage: "2024 ACS 1-Year",
    geography: "Pasadena city, California",
    evidenceClass: "official_estimate",
    note: "Universe: workers age 16+.",
  },
  {
    key: "carpool",
    label: "Carpool share",
    value: "5%",
    source: "U.S. Census Bureau ACS 2024 1-Year via Census Reporter",
    sourceUrl: "https://censusreporter.org/profiles/16000US0656000-pasadena-ca/",
    vintage: "2024 ACS 1-Year",
    geography: "Pasadena city, California",
    evidenceClass: "official_estimate",
  },
  {
    key: "transit",
    label: "Public-transit share",
    value: "6%",
    source: "U.S. Census Bureau ACS 2024 1-Year via Census Reporter",
    sourceUrl: "https://censusreporter.org/profiles/16000US0656000-pasadena-ca/",
    vintage: "2024 ACS 1-Year",
    geography: "Pasadena city, California",
    evidenceClass: "official_estimate",
  },
  {
    key: "work_home",
    label: "Worked from home",
    value: "25%",
    source: "U.S. Census Bureau ACS 2024 1-Year via Census Reporter",
    sourceUrl: "https://censusreporter.org/profiles/16000US0656000-pasadena-ca/",
    vintage: "2024 ACS 1-Year",
    geography: "Pasadena city, California",
    evidenceClass: "official_estimate",
  },
  {
    key: "walk",
    label: "Walked to work",
    value: "4%",
    source: "U.S. Census Bureau ACS 2024 1-Year via Census Reporter",
    sourceUrl: "https://censusreporter.org/profiles/16000US0656000-pasadena-ca/",
    vintage: "2024 ACS 1-Year",
    geography: "Pasadena city, California",
    evidenceClass: "official_estimate",
  },
  {
    key: "bike",
    label: "Bicycle share",
    value: "2%",
    source: "U.S. Census Bureau ACS 2024 1-Year via Census Reporter",
    sourceUrl: "https://censusreporter.org/profiles/16000US0656000-pasadena-ca/",
    vintage: "2024 ACS 1-Year",
    geography: "Pasadena city, California",
    evidenceClass: "official_estimate",
  },
  {
    key: "pwp_l2",
    label: "PWP Level 2 chargers",
    value: "116",
    source: "Pasadena Water and Power",
    sourceUrl: "https://pwp.cityofpasadena.net/ev-construction-infrastructure/",
    vintage: "Status as of March 12, 2026",
    geography: "PWP public charging sites, Pasadena",
    evidenceClass: "official_observed",
    note: "2 Level 2 chargers were reported offline at the cited update.",
  },
  {
    key: "pwp_fast",
    label: "PWP public fast chargers",
    value: "45",
    source: "Pasadena Water and Power",
    sourceUrl: "https://pwp.cityofpasadena.net/ev-construction-infrastructure/",
    vintage: "Status as of March 12, 2026",
    geography: "PWP public fast-charging sites, Pasadena",
    evidenceClass: "official_observed",
    note: "14 fast chargers were reported offline at the cited update.",
  },
];

export const PASADENA_SOURCE_REGISTRY = [
  {
    name: "U.S. Census Bureau — ACS 2024 1-Year",
    role: "Current Pasadena resident commute-mode and travel-time context",
    vintage: "2024",
    url: "https://data.census.gov/profile/Pasadena_city%2C_California?g=160XX00US0656000",
  },
  {
    name: "U.S. Census Bureau — QuickFacts",
    role: "Population and city-level demographic context",
    vintage: "2025 population estimate / 2020-2024 characteristics",
    url: "https://www.census.gov/quickfacts/fact/table/pasadenacitycalifornia/PST045225",
  },
  {
    name: "Pasadena Department of Transportation — Traffic Count Database",
    role: "City traffic-count source for future corridor-specific observed counts",
    vintage: "Current city-maintained database",
    url: "https://www.cityofpasadena.net/transportation/traffic-engineering-operations/",
  },
  {
    name: "Pasadena Water and Power — EV infrastructure status",
    role: "Observed City-owned/PWP public charging inventory and outage status",
    vintage: "March 12, 2026 status page",
    url: "https://pwp.cityofpasadena.net/ev-construction-infrastructure/",
  },
  {
    name: "California Energy Commission — ZEV statistics",
    role: "State vehicle-population, ZEV-sales, and charger datasets for future Pasadena extracts",
    vintage: "2026 published datasets",
    url: "https://www.energy.ca.gov/files/zev-and-infrastructure-stats-data",
  },
  {
    name: "U.S. Census Bureau LEHD/LODES",
    role: "Workforce origin-destination context for future Pasadena corridor analysis",
    vintage: "Most recent published LODES release",
    url: "https://lehd.ces.census.gov/data/lodes/",
  },
];
