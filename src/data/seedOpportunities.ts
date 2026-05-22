// Large seeded mock dataset for Discover (frontend-only, deterministic).
// Designed to be swap-out-able for real backend data (Cloud / Supabase /
// crawlers / Firecrawl / RSS / AI extraction) — keep the shape stable.
import type { FundingType, Format, Opportunity } from "./opportunities";

// --- Deterministic PRNG (mulberry32) so the dataset is stable across reloads.
function mulberry32(a: number) {
  return function () {
    let t = (a += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const COUNTRIES_BY_REGION: Record<string, { country: string; cities: string[] }[]> = {
  Europe: [
    { country: "Germany", cities: ["Berlin", "Munich", "Hamburg"] },
    { country: "France", cities: ["Paris", "Lyon", "Strasbourg"] },
    { country: "United Kingdom", cities: ["London", "Oxford", "Edinburgh"] },
    { country: "Italy", cities: ["Rome", "Milan", "Florence"] },
    { country: "Spain", cities: ["Madrid", "Barcelona", "Valencia"] },
    { country: "Netherlands", cities: ["Amsterdam", "The Hague"] },
    { country: "Switzerland", cities: ["Geneva", "Zurich", "Bern"] },
    { country: "Sweden", cities: ["Stockholm", "Gothenburg"] },
    { country: "Belgium", cities: ["Brussels", "Antwerp"] },
    { country: "Portugal", cities: ["Lisbon", "Porto"] },
    { country: "Poland", cities: ["Warsaw", "Krakow"] },
    { country: "Austria", cities: ["Vienna", "Salzburg"] },
    { country: "Ireland", cities: ["Dublin"] },
    { country: "Denmark", cities: ["Copenhagen"] },
    { country: "Greece", cities: ["Athens"] },
  ],
  Asia: [
    { country: "Japan", cities: ["Tokyo", "Kyoto", "Osaka"] },
    { country: "South Korea", cities: ["Seoul", "Busan", "Jeju"] },
    { country: "Singapore", cities: ["Singapore"] },
    { country: "India", cities: ["New Delhi", "Mumbai", "Bangalore"] },
    { country: "Indonesia", cities: ["Jakarta", "Bali"] },
    { country: "Malaysia", cities: ["Kuala Lumpur"] },
    { country: "Thailand", cities: ["Bangkok", "Chiang Mai"] },
    { country: "Philippines", cities: ["Manila", "Cebu"] },
    { country: "Vietnam", cities: ["Hanoi", "Ho Chi Minh City"] },
    { country: "China", cities: ["Beijing", "Shanghai", "Shenzhen"] },
  ],
  "Latin America": [
    { country: "Brazil", cities: ["São Paulo", "Rio de Janeiro", "Brasília"] },
    { country: "Argentina", cities: ["Buenos Aires", "Córdoba"] },
    { country: "Mexico", cities: ["Mexico City", "Guadalajara"] },
    { country: "Chile", cities: ["Santiago", "Valparaíso"] },
    { country: "Colombia", cities: ["Bogotá", "Medellín"] },
    { country: "Peru", cities: ["Lima"] },
    { country: "Uruguay", cities: ["Montevideo"] },
    { country: "Costa Rica", cities: ["San José"] },
  ],
  Africa: [
    { country: "Kenya", cities: ["Nairobi", "Mombasa"] },
    { country: "Nigeria", cities: ["Lagos", "Abuja"] },
    { country: "South Africa", cities: ["Cape Town", "Johannesburg"] },
    { country: "Egypt", cities: ["Cairo", "Sharm El-Sheikh"] },
    { country: "Ghana", cities: ["Accra"] },
    { country: "Rwanda", cities: ["Kigali"] },
    { country: "Morocco", cities: ["Rabat", "Casablanca", "Marrakech"] },
    { country: "Senegal", cities: ["Dakar"] },
    { country: "Ethiopia", cities: ["Addis Ababa"] },
    { country: "Tunisia", cities: ["Tunis"] },
  ],
  "North America": [
    { country: "United States", cities: ["New York", "Washington D.C.", "San Francisco", "Boston", "Chicago"] },
    { country: "Canada", cities: ["Toronto", "Montreal", "Vancouver", "Ottawa"] },
  ],
  "Middle East": [
    { country: "United Arab Emirates", cities: ["Dubai", "Abu Dhabi"] },
    { country: "Qatar", cities: ["Doha"] },
    { country: "Jordan", cities: ["Amman"] },
    { country: "Israel", cities: ["Tel Aviv", "Jerusalem"] },
    { country: "Saudi Arabia", cities: ["Riyadh", "Jeddah"] },
    { country: "Turkey", cities: ["Istanbul", "Ankara"] },
    { country: "Lebanon", cities: ["Beirut"] },
    { country: "Oman", cities: ["Muscat"] },
  ],
  Oceania: [
    { country: "Australia", cities: ["Sydney", "Melbourne", "Canberra"] },
    { country: "New Zealand", cities: ["Auckland", "Wellington"] },
    { country: "Fiji", cities: ["Suva"] },
  ],
};

const ALL_REGIONS = Object.keys(COUNTRIES_BY_REGION);

const TYPES = [
  "Forum",
  "Congress",
  "Summit",
  "Festival",
  "Fellowship",
  "Scholarship",
  "Grant",
  "Youth Leadership Program",
  "Conference",
  "Exchange Program",
  "Model UN",
  "Innovation Challenge",
  "Peacebuilding Program",
  "Climate Program",
  "Diplomacy Program",
  "Entrepreneurship Program",
  "Public Policy Program",
  "Education Program",
  "AI & Technology Program",
];

const INDUSTRIES = [
  "Climate",
  "Peace & Security",
  "Diplomacy",
  "Entrepreneurship",
  "Public Policy",
  "Education",
  "AI & Technology",
  "Innovation",
  "Leadership",
  "Development",
  "Culture",
  "Human Rights",
  "Sustainability",
  "Global Health",
  "Gender Equality",
  "Economics",
  "Media & Journalism",
  "Arts",
  "Science & Research",
];

const FUNDINGS: FundingType[] = ["free", "paid", "partial", "fully-funded"];
const FORMATS: Format[] = ["online", "hybrid", "in-person"];

const LANGUAGE_BY_REGION: Record<string, string[]> = {
  Europe: ["English", "French", "German", "Spanish", "Italian"],
  Asia: ["English", "Mandarin", "Japanese", "Korean"],
  "Latin America": ["Spanish", "Portuguese", "English"],
  Africa: ["English", "French", "Arabic", "Portuguese"],
  "North America": ["English", "French", "Spanish"],
  "Middle East": ["English", "Arabic", "Turkish"],
  Oceania: ["English"],
};

const ORG_TEMPLATES = [
  (c: string, t: string) => `${c} Institute for ${t}`,
  (c: string) => `${c} Youth Council`,
  (c: string, t: string) => `${c} ${t} Foundation`,
  (_c: string, t: string) => `Global ${t} Network`,
  (_c: string, t: string) => `International ${t} Society`,
  (c: string) => `${c} Ministry of Youth Affairs`,
  (_c: string, t: string) => `United Nations ${t} Initiative`,
  (c: string) => `${c} Diplomatic Academy`,
  (c: string, t: string) => `University of ${c} — ${t} Centre`,
  (_c: string, t: string) => `OECD ${t} Programme`,
];

const COVERS = [
  "from-rose-500 via-fuchsia-500 to-indigo-500",
  "from-amber-400 via-orange-500 to-rose-500",
  "from-emerald-400 via-teal-500 to-sky-600",
  "from-sky-400 via-indigo-500 to-purple-600",
  "from-pink-400 via-rose-500 to-orange-500",
  "from-violet-500 via-purple-500 to-fuchsia-500",
  "from-cyan-400 via-blue-500 to-indigo-600",
  "from-lime-400 via-emerald-500 to-teal-600",
  "from-slate-500 via-slate-700 to-slate-900",
  "from-fuchsia-500 via-pink-500 to-amber-500",
];

const BENEFIT_POOL = [
  "Travel grant",
  "Accommodation",
  "Meals",
  "Certificate of participation",
  "Mentorship",
  "Networking",
  "Visa support",
  "Stipend",
  "Tuition coverage",
  "Pitch competition",
  "Cultural program",
  "Publication opportunity",
];
const DOC_POOL = [
  "CV",
  "Motivation letter",
  "Passport copy",
  "Recommendation letter",
  "Transcripts",
  "Essay",
  "Project proposal",
  "Video pitch",
  "Portfolio",
];

function pad(n: number) {
  return n.toString().padStart(2, "0");
}
function formatDates(start: Date, days: number) {
  const end = new Date(start.getTime() + days * 86400000);
  const months = [
    "Jan", "Feb", "Mar", "Apr", "May", "Jun",
    "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
  ];
  if (start.getMonth() === end.getMonth()) {
    return `${months[start.getMonth()]} ${start.getDate()}–${end.getDate()}, ${start.getFullYear()}`;
  }
  return `${months[start.getMonth()]} ${start.getDate()} – ${months[end.getMonth()]} ${end.getDate()}, ${start.getFullYear()}`;
}

function generate(count: number): Opportunity[] {
  const rand = mulberry32(20260522);
  const pick = <T>(arr: T[]): T => arr[Math.floor(rand() * arr.length)];
  const pickMany = <T>(arr: T[], n: number): T[] => {
    const copy = [...arr];
    const out: T[] = [];
    for (let i = 0; i < n && copy.length; i++) {
      const idx = Math.floor(rand() * copy.length);
      out.push(copy.splice(idx, 1)[0]);
    }
    return out;
  };

  const results: Opportunity[] = [];
  for (let i = 0; i < count; i++) {
    const region = pick(ALL_REGIONS);
    const place = pick(COUNTRIES_BY_REGION[region]);
    const country = place.country;
    const city = pick(place.cities);
    const type = pick(TYPES);
    const industry = pick(INDUSTRIES);
    const funding = pick(FUNDINGS);
    const format = pick(FORMATS);
    const language = pick(LANGUAGE_BY_REGION[region]);

    // Deadlines spread across ~3, ~6, ~12 months
    const buckets = [
      { max: 90, weight: 35 },
      { max: 180, weight: 35 },
      { max: 365, weight: 30 },
    ];
    const totalW = buckets.reduce((s, b) => s + b.weight, 0);
    let r = rand() * totalW;
    let chosen = buckets[0];
    for (const b of buckets) {
      if (r < b.weight) {
        chosen = b;
        break;
      }
      r -= b.weight;
    }
    const minDays = chosen === buckets[0] ? 7 : chosen === buckets[1] ? 90 : 180;
    const offset = Math.floor(minDays + rand() * (chosen.max - minDays));
    const deadlineDate = new Date(Date.now() + offset * 86400000);
    const eventStart = new Date(deadlineDate.getTime() + (14 + Math.floor(rand() * 60)) * 86400000);
    const eventDuration = 2 + Math.floor(rand() * 6);

    const minAge = pick([16, 18, 18, 20, 21, 24]);
    const maxAge = minAge + pick([10, 12, 15, 18, 25]);

    const organizer = pick(ORG_TEMPLATES)(city, industry);

    const year = eventStart.getFullYear();
    const name = `${city} ${type} on ${industry} ${year}`;

    // Trust score: 75% high quality (>=80), 25% medium-low to add realism.
    const trustScore =
      rand() < 0.75
        ? 80 + Math.floor(rand() * 21) // 80–100
        : 55 + Math.floor(rand() * 25); // 55–79
    const trustLevel: Opportunity["trustLevel"] =
      trustScore >= 80 ? "High" : trustScore >= 55 ? "Medium" : "Low";

    const benefits = pickMany(BENEFIT_POOL, 2 + Math.floor(rand() * 3));
    const documents = pickMany(DOC_POOL, 2 + Math.floor(rand() * 2));
    const tags = Array.from(new Set([industry, type, region, country])).slice(0, 4);

    const cover = COVERS[i % COVERS.length];

    const fundingBlurb: Record<FundingType, string> = {
      free: "Free to attend with all sessions open to selected youth.",
      paid: "Participants cover their own fees and travel.",
      partial: "Partial funding available for selected international delegates.",
      "fully-funded": "Travel, accommodation and meals fully covered for selected delegates.",
    };

    results.push({
      id: `seed_${i + 1}`,
      name,
      organizer,
      verified: trustScore >= 80,
      country,
      city,
      region,
      type,
      industry,
      deadline: deadlineDate.toISOString(),
      dates: formatDates(eventStart, eventDuration),
      minAge,
      maxAge,
      funding,
      format,
      language,
      applicationLink: `https://example.org/opportunities/${i + 1}-${type
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")}`,
      shortDescription: `${type} bringing together young leaders from ${region} and beyond around ${industry.toLowerCase()}.`,
      description: `Join a curated cohort of young changemakers in ${city}, ${country} for a ${eventDuration}-day ${type.toLowerCase()} focused on ${industry.toLowerCase()}. ${fundingBlurb[funding]} Sessions include keynotes, working groups, cultural exchange and a final policy or pitch output.`,
      benefits,
      requiredDocuments: documents,
      tags,
      cover,
      applyMode: trustScore >= 80 ? "assisted" : "external",
      trustScore,
      trustLevel,
    });
  }
  return results;
}

export const seededOpportunities: Opportunity[] = generate(320);

export const COUNTRIES_LIST = Array.from(
  new Set(
    Object.values(COUNTRIES_BY_REGION).flatMap((arr) => arr.map((c) => c.country)),
  ),
).sort();
