// Frontend-only automated opportunity import system (localStorage).
// Designed so the same shape can later be swapped for a real backend (Cloud + cron).
import type { FundingType, Format, Opportunity } from "@/data/opportunities";

export type SourceType =
  | "website"
  | "rss"
  | "api"
  | "crawler"
  | "telegram"
  | "organizer-feed";
export type CredibilityTier = 1 | 2 | 3;
export type SourceStatus = "active" | "paused" | "blocked";
export type ImportStatus =
  | "auto-published"
  | "pending-review"
  | "rejected"
  | "expired";
export type TrustLevel = "High" | "Medium" | "Low";

export interface Source {
  id: string;
  name: string;
  type: SourceType;
  url: string;
  tier: CredibilityTier;
  frequencyHours: number;
  lastCheckedAt?: string;
  importedCount: number;
  autoPublish: boolean;
  categoryFocus: string;
  regionFocus: string;
  language: string;
  status: SourceStatus;
  notes?: string;
}

/** A raw record produced by a source crawler (still un-normalized). */
export interface RawCrawlItem {
  title: string;
  organizer: string;
  officialWebsite?: string;
  applicationLink: string;
  country: string;
  city: string;
  region: string;
  type: string;
  industry: string;
  deadline: string; // ISO
  dates: string;
  minAge: number;
  maxAge: number;
  funding: FundingType;
  cost?: string;
  format: Format;
  language: string;
  shortDescription: string;
  description: string;
  benefits: string[];
  requiredDocuments: string[];
  requiredActions?: string[];
  /** Heuristic flags the simulated crawler can attach. */
  flags?: {
    brokenLink?: boolean;
    unrealisticClaims?: boolean;
    paymentUnclear?: boolean;
    missingFields?: boolean;
    suspicious?: boolean;
  };
}

export interface ImportedOpportunity {
  id: string;
  sourceId: string;
  importedAt: string;
  trustScore: number;
  trustLevel: TrustLevel;
  status: ImportStatus;
  rejectionReason?: string;
  reviewNotes?: string;
  /** Normalized opportunity (matches the Discover shape). */
  data: Opportunity & {
    sourceName: string;
    sourceType: SourceType;
    tier: CredibilityTier;
    lastUpdated: string;
  };
}

export interface ImportLog {
  id: string;
  sourceId: string;
  startedAt: string;
  found: number;
  published: number;
  pending: number;
  rejected: number;
  duplicates: number;
  durationMs: number;
}
export interface ErrorLog {
  id: string;
  sourceId?: string;
  at: string;
  kind: "crawler" | "broken-link" | "extraction" | "duplicate" | "missing-fields";
  message: string;
}

const KEYS = {
  sources: "ym:sources",
  imports: "ym:imported-opportunities",
  logs: "ym:import-logs",
  errors: "ym:error-logs",
  seeded: "ym:sources-seeded",
} as const;

function read<T>(k: string, fb: T): T {
  if (typeof window === "undefined") return fb;
  try {
    const raw = localStorage.getItem(k);
    return raw ? (JSON.parse(raw) as T) : fb;
  } catch {
    return fb;
  }
}
function write<T>(k: string, v: T) {
  if (typeof window === "undefined") return;
  localStorage.setItem(k, JSON.stringify(v));
}
function uid() {
  return Math.random().toString(36).slice(2, 10);
}

// ---------- Seed sources ----------

const SEED_SOURCES: Source[] = [
  {
    id: "src_un",
    name: "UN Careers & Opportunities",
    type: "website",
    url: "https://careers.un.org",
    tier: 1,
    frequencyHours: 24,
    importedCount: 0,
    autoPublish: true,
    categoryFocus: "Diplomacy, Policy",
    regionFocus: "Global",
    language: "English",
    status: "active",
  },
  {
    id: "src_unesco",
    name: "UNESCO Youth Programmes",
    type: "website",
    url: "https://www.unesco.org/en/youth",
    tier: 1,
    frequencyHours: 24,
    importedCount: 0,
    autoPublish: true,
    categoryFocus: "Education, Culture",
    regionFocus: "Global",
    language: "English",
    status: "active",
  },
  {
    id: "src_worldbank",
    name: "World Bank Youth Programs",
    type: "website",
    url: "https://www.worldbank.org/en/about/careers/programs-and-internships",
    tier: 1,
    frequencyHours: 24,
    importedCount: 0,
    autoPublish: true,
    categoryFocus: "Development, Economics",
    regionFocus: "Global",
    language: "English",
    status: "active",
  },
  {
    id: "src_scorner",
    name: "Scholarships Corner",
    type: "rss",
    url: "https://scholarshipscorner.website/feed",
    tier: 2,
    frequencyHours: 12,
    importedCount: 0,
    autoPublish: true,
    categoryFocus: "Scholarships, Fellowships",
    regionFocus: "Global",
    language: "English",
    status: "active",
  },
  {
    id: "src_ocorners",
    name: "Opportunities Corners",
    type: "rss",
    url: "https://opportunitiescorners.com/feed",
    tier: 2,
    frequencyHours: 12,
    importedCount: 0,
    autoPublish: true,
    categoryFocus: "Conferences, Exchanges",
    regionFocus: "Global",
    language: "English",
    status: "active",
  },
  {
    id: "src_tg_global",
    name: "Global Youth Opps (Telegram)",
    type: "telegram",
    url: "https://t.me/global_youth_opps",
    tier: 3,
    frequencyHours: 6,
    importedCount: 0,
    autoPublish: false,
    categoryFocus: "Mixed",
    regionFocus: "Global",
    language: "Mixed",
    status: "active",
  },
];

/** Pre-built fake crawl payloads keyed by source. Used by simulateDailyImport(). */
const FAKE_PAYLOADS: Record<string, RawCrawlItem[]> = {
  src_un: [
    {
      title: "UN Youth Climate Summit 2026",
      organizer: "United Nations",
      officialWebsite: "https://www.un.org/youthenvoy",
      applicationLink: "https://www.un.org/youthenvoy/climate-summit-apply",
      country: "United States",
      city: "New York",
      region: "North America",
      type: "Summit",
      industry: "Climate",
      deadline: new Date(Date.now() + 45 * 86400000).toISOString(),
      dates: "Sep 18-20, 2026",
      minAge: 18,
      maxAge: 30,
      funding: "fully-funded",
      format: "in-person",
      language: "English",
      shortDescription: "Three-day summit for young climate leaders at UN HQ.",
      description:
        "The UN Youth Climate Summit gathers 500 youth leaders to shape global climate policy. Fully funded travel, accommodation and meals.",
      benefits: ["Travel grant", "Accommodation", "UN certificate"],
      requiredDocuments: ["CV", "Motivation letter", "Passport copy"],
    },
  ],
  src_unesco: [
    {
      title: "UNESCO Youth Forum on Cultural Heritage",
      organizer: "UNESCO",
      officialWebsite: "https://www.unesco.org/en/youth",
      applicationLink: "https://en.unesco.org/youth-forum-apply",
      country: "France",
      city: "Paris",
      region: "Europe",
      type: "Forum",
      industry: "Culture",
      deadline: new Date(Date.now() + 30 * 86400000).toISOString(),
      dates: "Nov 4-7, 2026",
      minAge: 18,
      maxAge: 28,
      funding: "fully-funded",
      format: "in-person",
      language: "English",
      shortDescription: "Forum on protecting cultural heritage led by young experts.",
      description:
        "UNESCO invites 200 young heritage advocates to Paris for a four-day forum on intangible cultural heritage.",
      benefits: ["Flights covered", "UNESCO mentor"],
      requiredDocuments: ["CV", "Project pitch"],
    },
  ],
  src_worldbank: [
    {
      title: "World Bank Youth Summit 2026",
      organizer: "World Bank Group",
      officialWebsite: "https://www.worldbank.org/youthsummit",
      applicationLink: "https://www.worldbank.org/youthsummit/apply",
      country: "United States",
      city: "Washington DC",
      region: "North America",
      type: "Summit",
      industry: "Development",
      deadline: new Date(Date.now() + 60 * 86400000).toISOString(),
      dates: "May 12-13, 2026",
      minAge: 18,
      maxAge: 35,
      funding: "partial",
      format: "hybrid",
      language: "English",
      shortDescription: "Flagship youth summit on global development priorities.",
      description:
        "The World Bank Youth Summit convenes thousands of young leaders to debate the most pressing development challenges.",
      benefits: ["Partial travel grant", "Networking with WB experts"],
      requiredDocuments: ["CV"],
    },
  ],
  src_scorner: [
    {
      title: "Chevening Scholarships 2026/27",
      organizer: "UK Foreign, Commonwealth & Development Office",
      officialWebsite: "https://www.chevening.org",
      applicationLink: "https://www.chevening.org/apply",
      country: "United Kingdom",
      city: "Various",
      region: "Europe",
      type: "Scholarship",
      industry: "Education",
      deadline: new Date(Date.now() + 90 * 86400000).toISOString(),
      dates: "Sep 2026 - Sep 2027",
      minAge: 21,
      maxAge: 40,
      funding: "fully-funded",
      format: "in-person",
      language: "English",
      shortDescription: "Fully funded UK master's scholarship for future leaders.",
      description:
        "Chevening offers fully funded one-year master's degrees at any UK university for emerging leaders.",
      benefits: ["Tuition", "Stipend", "Flights"],
      requiredDocuments: ["CV", "Essays", "References"],
    },
  ],
  src_ocorners: [
    {
      title: "Global Youth Entrepreneurship Bootcamp",
      organizer: "Youth Biz Network",
      applicationLink: "https://opportunitiescorners.com/apply/yb-bootcamp",
      country: "Online",
      city: "Online",
      region: "Global",
      type: "Bootcamp",
      industry: "Entrepreneurship",
      deadline: new Date(Date.now() + 20 * 86400000).toISOString(),
      dates: "Aug 1-15, 2026",
      minAge: 18,
      maxAge: 30,
      funding: "free",
      format: "online",
      language: "English",
      shortDescription: "Two-week online bootcamp for young founders.",
      description: "Hands-on bootcamp with mentors from the global startup ecosystem.",
      benefits: ["Mentorship", "Certificate"],
      requiredDocuments: ["Pitch deck"],
      flags: { missingFields: false },
    },
  ],
  src_tg_global: [
    {
      title: "Mystery Global Leadership Retreat (LIMITED SEATS!)",
      organizer: "Unknown Repost Page",
      applicationLink: "https://bit.ly/mystery-retreat",
      country: "Unknown",
      city: "TBD",
      region: "Global",
      type: "Retreat",
      industry: "Leadership",
      deadline: new Date(Date.now() + 5 * 86400000).toISOString(),
      dates: "TBD",
      minAge: 16,
      maxAge: 35,
      funding: "paid",
      format: "in-person",
      language: "English",
      shortDescription: "Guaranteed acceptance for all applicants. Limited!!!",
      description:
        "Pay registration fee for guaranteed acceptance and visa support. Act fast!",
      benefits: ["Certificate"],
      requiredDocuments: ["Payment"],
      flags: { unrealisticClaims: true, paymentUnclear: true, suspicious: true },
    },
  ],
};

// ---------- Store ----------

export const sourcesStore = {
  list: () => read<Source[]>(KEYS.sources, []),
  setAll: (v: Source[]) => write(KEYS.sources, v),
  upsert: (s: Source) => {
    const all = sourcesStore.list();
    const i = all.findIndex((x) => x.id === s.id);
    if (i >= 0) all[i] = s;
    else all.unshift(s);
    sourcesStore.setAll(all);
  },
  remove: (id: string) =>
    sourcesStore.setAll(sourcesStore.list().filter((s) => s.id !== id)),

  imports: () => read<ImportedOpportunity[]>(KEYS.imports, []),
  setImports: (v: ImportedOpportunity[]) => write(KEYS.imports, v),

  logs: () => read<ImportLog[]>(KEYS.logs, []),
  setLogs: (v: ImportLog[]) => write(KEYS.logs, v),

  errors: () => read<ErrorLog[]>(KEYS.errors, []),
  setErrors: (v: ErrorLog[]) => write(KEYS.errors, v),

  ensureSeeded: () => {
    if (typeof window === "undefined") return;
    if (localStorage.getItem(KEYS.seeded)) return;
    if (sourcesStore.list().length === 0) sourcesStore.setAll(SEED_SOURCES);
    localStorage.setItem(KEYS.seeded, "1");
  },
  KEYS,
};

// ---------- Logic: trust score, dedupe, expiry, link check ----------

export function computeTrustScore(item: RawCrawlItem, source: Source): number {
  let score = 0;
  // Source tier weight
  score += source.tier === 1 ? 45 : source.tier === 2 ? 30 : 10;
  // Organizer clarity
  if (item.organizer && item.organizer.length > 2) score += 8;
  if (item.officialWebsite) score += 8;
  // Application link present + not obviously broken/shortened
  if (item.applicationLink && !item.flags?.brokenLink) score += 10;
  if (item.applicationLink && /bit\.ly|tinyurl/i.test(item.applicationLink)) score -= 10;
  // Deadline clarity
  if (item.deadline && new Date(item.deadline).getTime() > Date.now()) score += 8;
  // Location clarity
  if (item.country && item.country !== "Unknown" && item.city && item.city !== "TBD") score += 6;
  // Cost transparency
  if (item.funding === "free" || item.funding === "fully-funded") score += 6;
  else if (item.cost && item.cost.length > 0) score += 4;
  else if (item.funding === "paid") score -= 8;
  // Penalties
  if (item.flags?.unrealisticClaims) score -= 25;
  if (item.flags?.paymentUnclear) score -= 15;
  if (item.flags?.suspicious) score -= 20;
  if (item.flags?.missingFields) score -= 10;
  if (item.flags?.brokenLink) score -= 30;
  return Math.max(0, Math.min(100, score));
}

export function trustLevel(score: number): TrustLevel {
  if (score >= 80) return "High";
  if (score >= 55) return "Medium";
  return "Low";
}

function similar(a: string, b: string) {
  const norm = (s: string) => s.toLowerCase().replace(/[^a-z0-9 ]/g, "").trim();
  return norm(a) === norm(b);
}

function findDuplicate(item: RawCrawlItem, existing: ImportedOpportunity[]) {
  return existing.find(
    (x) =>
      similar(x.data.name, item.title) ||
      (item.applicationLink && x.data.applicationLink === item.applicationLink),
  );
}

export function isExpired(iso: string) {
  return new Date(iso).getTime() < Date.now();
}

function toOpportunity(
  item: RawCrawlItem,
  source: Source,
): ImportedOpportunity["data"] {
  const palettes = [
    "from-rose-500 via-fuchsia-500 to-indigo-500",
    "from-emerald-400 via-teal-500 to-sky-600",
    "from-sky-400 via-indigo-500 to-purple-600",
    "from-amber-400 via-orange-500 to-rose-500",
  ];
  const cover = palettes[Math.floor(Math.random() * palettes.length)];
  return {
    id: `imp_${uid()}`,
    name: item.title,
    organizer: item.organizer,
    verified: source.tier === 1,
    country: item.country,
    city: item.city,
    region: item.region,
    type: item.type,
    industry: item.industry,
    deadline: item.deadline,
    dates: item.dates,
    minAge: item.minAge,
    maxAge: item.maxAge,
    funding: item.funding,
    format: item.format,
    language: item.language,
    applicationLink: item.applicationLink,
    shortDescription: item.shortDescription,
    description: item.description,
    benefits: item.benefits,
    requiredDocuments: item.requiredDocuments,
    manualSteps: item.requiredActions,
    tags: [item.industry, item.type, item.region],
    cover,
    applyMode: source.tier === 1 ? "assisted" : "external",
    sourceName: source.name,
    sourceType: source.type,
    tier: source.tier,
    lastUpdated: new Date().toISOString(),
  };
}

/** Run a simulated daily import across all active sources. */
export function simulateDailyImport() {
  sourcesStore.ensureSeeded();
  const sources = sourcesStore.list();
  const imports = sourcesStore.imports();
  const logs = sourcesStore.logs();
  const errors = sourcesStore.errors();
  const now = new Date().toISOString();

  // 1. Expire old auto-published items.
  for (const imp of imports) {
    if (imp.status === "auto-published" && isExpired(imp.data.deadline)) {
      imp.status = "expired";
    }
  }

  let totalPublished = 0;
  let totalPending = 0;
  let totalRejected = 0;
  let totalDupes = 0;

  for (const source of sources) {
    if (source.status !== "active") continue;
    const started = Date.now();
    const payload = FAKE_PAYLOADS[source.id] ?? [];
    let published = 0;
    let pending = 0;
    let rejected = 0;
    let duplicates = 0;

    for (const item of payload) {
      // Dedupe
      const dupe = findDuplicate(item, imports);
      if (dupe) {
        dupe.data.lastUpdated = now;
        if (item.deadline && new Date(item.deadline) > new Date(dupe.data.deadline)) {
          dupe.data.deadline = item.deadline;
        }
        duplicates++;
        totalDupes++;
        continue;
      }

      const score = computeTrustScore(item, source);
      const level = trustLevel(score);
      const data = toOpportunity(item, source);

      // Link & expiry guardrails
      if (item.flags?.brokenLink || !item.applicationLink) {
        errors.unshift({
          id: uid(),
          sourceId: source.id,
          at: now,
          kind: "broken-link",
          message: `Broken application link for "${item.title}"`,
        });
        imports.unshift({
          id: data.id,
          sourceId: source.id,
          importedAt: now,
          trustScore: score,
          trustLevel: level,
          status: "rejected",
          rejectionReason: "Broken or missing application link",
          data,
        });
        rejected++;
        totalRejected++;
        continue;
      }
      if (isExpired(item.deadline)) {
        imports.unshift({
          id: data.id,
          sourceId: source.id,
          importedAt: now,
          trustScore: score,
          trustLevel: level,
          status: "expired",
          rejectionReason: "Deadline already passed",
          data,
        });
        continue;
      }

      const canAutoPublish =
        source.autoPublish &&
        (source.tier === 1 || source.tier === 2) &&
        score >= 80 &&
        !item.flags?.unrealisticClaims &&
        !item.flags?.paymentUnclear &&
        !item.flags?.suspicious;

      imports.unshift({
        id: data.id,
        sourceId: source.id,
        importedAt: now,
        trustScore: score,
        trustLevel: level,
        status: canAutoPublish ? "auto-published" : "pending-review",
        reviewNotes: canAutoPublish
          ? undefined
          : describeFailureReasons(item, source, score),
        data,
      });

      if (canAutoPublish) {
        published++;
        totalPublished++;
      } else {
        pending++;
        totalPending++;
      }
    }

    source.lastCheckedAt = now;
    source.importedCount += payload.length;

    logs.unshift({
      id: uid(),
      sourceId: source.id,
      startedAt: now,
      found: payload.length,
      published,
      pending,
      rejected,
      duplicates,
      durationMs: Date.now() - started,
    });
  }

  sourcesStore.setAll(sources);
  sourcesStore.setImports(imports);
  sourcesStore.setLogs(logs.slice(0, 200));
  sourcesStore.setErrors(errors.slice(0, 200));
  return { totalPublished, totalPending, totalRejected, totalDupes };
}

function describeFailureReasons(item: RawCrawlItem, source: Source, score: number) {
  const reasons: string[] = [];
  if (source.tier === 3) reasons.push("Tier 3 source — manual review required");
  if (score < 80) reasons.push(`Trust score ${score} below auto-publish threshold (80)`);
  if (item.flags?.unrealisticClaims) reasons.push("Unrealistic claims detected");
  if (item.flags?.paymentUnclear) reasons.push("Payment terms unclear");
  if (item.flags?.suspicious) reasons.push("Suspicious content");
  if (item.flags?.missingFields) reasons.push("Required fields missing");
  return reasons.join("; ");
}

/** Public-facing list of imports that should appear in Discover. */
export function getAutoPublishedOpportunities(): (Opportunity & {
  sourceName: string;
  tier: CredibilityTier;
  trustLevel: TrustLevel;
  lastUpdated: string;
})[] {
  return sourcesStore
    .imports()
    .filter((i) => i.status === "auto-published" && !isExpired(i.data.deadline))
    .map((i) => ({
      ...i.data,
      trustLevel: i.trustLevel,
    }));
}

/** Approve a pending item from the admin UI. */
export function approveImport(id: string) {
  const all = sourcesStore.imports();
  sourcesStore.setImports(
    all.map((i) => (i.id === id ? { ...i, status: "auto-published" } : i)),
  );
}
export function rejectImport(id: string, reason: string) {
  const all = sourcesStore.imports();
  sourcesStore.setImports(
    all.map((i) =>
      i.id === id ? { ...i, status: "rejected", rejectionReason: reason } : i,
    ),
  );
}
