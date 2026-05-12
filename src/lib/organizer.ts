// Frontend-only organizer + admin store (localStorage). No backend yet.
import type { FundingType, Format, Opportunity } from "@/data/opportunities";

export type OrgStatus = "pending" | "approved" | "rejected";
export type EventStatus = "draft" | "pending" | "approved" | "rejected" | "closed";
export type AppStatus = "submitted" | "under_review" | "accepted" | "waitlisted" | "rejected";

export interface Organizer {
  id: string;
  orgName: string;
  orgType: string; // NGO, University, Embassy, Company, Intl Org, Foundation, Other
  website: string;
  officialEmail: string;
  country: string;
  contactPerson: string;
  proof: string; // free-text URL or note
  status: OrgStatus;
  createdAt: string;
  rejectionReason?: string;
}

export interface AppQuestion {
  id: string;
  label: string;
  required: boolean;
  type: "short" | "long";
}

export interface OrgEvent {
  id: string;
  organizerId: string;
  name: string;
  shortDescription: string;
  description: string;
  country: string;
  city: string;
  region: string;
  type: string;
  industry: string;
  language: string;
  dates: string;
  deadline: string;
  minAge: number;
  maxAge: number;
  funding: FundingType;
  cost?: string;
  format: Format;
  applicationLink: string;
  benefits: string[];
  requiredDocuments: string[];
  manualSteps: string[];
  tags: string[];
  cover: string;
  easyApply: boolean;
  questions: AppQuestion[];
  status: EventStatus;
  createdAt: string;
  rejectionReason?: string;
  views: number;
  saves: number;
  updates: { id: string; sentAt: string; message: string; audience: AppStatus | "all" }[];
}

export interface OrgApplication {
  id: string;
  eventId: string;
  organizerId: string;
  applicantName: string;
  applicantEmail: string;
  applicantCountry: string;
  portfolioSnapshot: Record<string, string>;
  answers: Record<string, string>;
  status: AppStatus;
  submittedAt: string;
}

const KEYS = {
  organizers: "ym:organizers",
  events: "ym:org-events",
  apps: "ym:org-applications",
  currentOrg: "ym:current-organizer-id",
  isAdmin: "ym:is-admin",
} as const;

function read<T>(k: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = localStorage.getItem(k);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}
function write<T>(k: string, v: T) {
  if (typeof window === "undefined") return;
  localStorage.setItem(k, JSON.stringify(v));
}

export const orgStore = {
  organizers: () => read<Organizer[]>(KEYS.organizers, []),
  setOrganizers: (v: Organizer[]) => write(KEYS.organizers, v),
  events: () => read<OrgEvent[]>(KEYS.events, []),
  setEvents: (v: OrgEvent[]) => write(KEYS.events, v),
  apps: () => read<OrgApplication[]>(KEYS.apps, []),
  setApps: (v: OrgApplication[]) => write(KEYS.apps, v),
  currentOrgId: () => read<string | null>(KEYS.currentOrg, null),
  setCurrentOrgId: (v: string | null) => write(KEYS.currentOrg, v),
  isAdmin: () => read<boolean>(KEYS.isAdmin, false),
  setIsAdmin: (v: boolean) => write(KEYS.isAdmin, v),
  KEYS,
};

export function newId() {
  return Math.random().toString(36).slice(2, 10);
}

/** Convert an approved org event into the shared Opportunity shape used by Discover. */
export function eventToOpportunity(e: OrgEvent, organizer?: Organizer): Opportunity {
  return {
    id: `org_${e.id}`,
    name: e.name,
    organizer: organizer?.orgName ?? "Verified organizer",
    verified: true,
    country: e.country,
    city: e.city,
    region: e.region,
    type: e.type,
    industry: e.industry,
    deadline: e.deadline,
    dates: e.dates,
    minAge: e.minAge,
    maxAge: e.maxAge,
    funding: e.funding,
    format: e.format,
    language: e.language,
    applicationLink: e.applicationLink || "",
    shortDescription: e.shortDescription,
    description: e.description,
    benefits: e.benefits,
    requiredDocuments: e.requiredDocuments,
    manualSteps: e.manualSteps,
    tags: e.tags,
    cover: e.cover,
    applyMode: e.easyApply ? "easy" : "assisted",
  };
}

export function getPublicOrgOpportunities(): Opportunity[] {
  const orgs = orgStore.organizers();
  return orgStore
    .events()
    .filter((e) => e.status === "approved")
    .map((e) => eventToOpportunity(e, orgs.find((o) => o.id === e.organizerId)));
}

export function findOrgEventByOpportunityId(id: string): OrgEvent | undefined {
  if (!id.startsWith("org_")) return undefined;
  return orgStore.events().find((e) => `org_${e.id}` === id);
}
