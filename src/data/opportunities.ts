export type FundingType = "free" | "paid" | "partial" | "fully-funded";
export type Format = "online" | "hybrid" | "in-person";

export interface Opportunity {
  id: string;
  name: string;
  organizer: string;
  verified: boolean;
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
  format: Format;
  language: string;
  applicationLink: string;
  shortDescription: string;
  description: string;
  benefits: string[];
  requiredDocuments: string[];
  tags: string[];
  cover: string; // gradient seed
}

const cover = (i: number) => {
  const palettes = [
    "from-rose-500 via-fuchsia-500 to-indigo-500",
    "from-amber-400 via-orange-500 to-rose-500",
    "from-emerald-400 via-teal-500 to-sky-600",
    "from-sky-400 via-indigo-500 to-purple-600",
    "from-pink-400 via-rose-500 to-orange-500",
    "from-violet-500 via-purple-500 to-fuchsia-500",
    "from-cyan-400 via-blue-500 to-indigo-600",
    "from-lime-400 via-emerald-500 to-teal-600",
  ];
  return palettes[i % palettes.length];
};

export const opportunities: Opportunity[] = [
  {
    id: "1",
    name: "One Young World Summit 2026",
    organizer: "One Young World",
    verified: true,
    country: "Germany",
    city: "Munich",
    region: "Europe",
    type: "Summit",
    industry: "Leadership",
    deadline: "2026-07-15",
    dates: "Oct 12–15, 2026",
    minAge: 18,
    maxAge: 30,
    funding: "fully-funded",
    format: "in-person",
    language: "English",
    applicationLink: "https://www.oneyoungworld.com",
    shortDescription: "The premier global forum for young leaders shaping the future.",
    description:
      "Join 2,000+ young leaders from 190+ countries for a transformative four-day summit featuring world leaders, activists, and changemakers. Workshops, plenaries, and networking with the global youth leadership community.",
    benefits: ["Travel & accommodation", "Mentorship", "Global network", "Certification"],
    requiredDocuments: ["CV", "Motivation letter", "Reference letter"],
    tags: ["Leadership", "SDGs", "Networking"],
    cover: cover(0),
  },
  {
    id: "2",
    name: "Yale Young Global Scholars",
    organizer: "Yale University",
    verified: true,
    country: "USA",
    city: "New Haven",
    region: "North America",
    type: "Fellowship",
    industry: "Academic",
    deadline: "2026-01-12",
    dates: "Summer 2026",
    minAge: 16,
    maxAge: 18,
    funding: "partial",
    format: "in-person",
    language: "English",
    applicationLink: "https://globalscholars.yale.edu",
    shortDescription: "An academic enrichment program for outstanding high schoolers.",
    description:
      "Two-week interdisciplinary academic program at Yale. Build skills in critical thinking, research, and leadership while joining a diverse cohort from 150+ countries.",
    benefits: ["Yale credentials", "Need-based aid", "Alumni network"],
    requiredDocuments: ["Transcripts", "Essays", "Recommendation"],
    tags: ["Academic", "Pre-college", "Research"],
    cover: cover(1),
  },
  {
    id: "3",
    name: "UN Youth Climate Forum",
    organizer: "United Nations",
    verified: true,
    country: "Kenya",
    city: "Nairobi",
    region: "Africa",
    type: "Forum",
    industry: "Climate",
    deadline: "2026-03-01",
    dates: "May 20–24, 2026",
    minAge: 18,
    maxAge: 28,
    funding: "fully-funded",
    format: "hybrid",
    language: "English",
    applicationLink: "https://www.un.org",
    shortDescription: "Co-create climate policy with the United Nations.",
    description:
      "Five days of negotiation simulations, expert panels, and policy drafting with UN officials. Outputs feed directly into the next COP.",
    benefits: ["Travel funded", "UN certificate", "Publication opportunity"],
    requiredDocuments: ["CV", "Policy brief (500 words)", "Video pitch"],
    tags: ["Climate", "Policy", "UN"],
    cover: cover(2),
  },
  {
    id: "4",
    name: "Singapore Global Youth Festival",
    organizer: "SG Youth Council",
    verified: true,
    country: "Singapore",
    city: "Singapore",
    region: "Asia",
    type: "Festival",
    industry: "Culture & Tech",
    deadline: "2026-02-20",
    dates: "Aug 5–9, 2026",
    minAge: 18,
    maxAge: 25,
    funding: "partial",
    format: "in-person",
    language: "English",
    applicationLink: "https://example.org",
    shortDescription: "A vibrant celebration of youth innovation across Asia-Pacific.",
    description:
      "Hackathons, cultural showcases, founder talks, and policy labs across five days in Singapore.",
    benefits: ["Accommodation", "Mentorship", "Pitch competition"],
    requiredDocuments: ["CV", "Project portfolio"],
    tags: ["Innovation", "Tech", "Asia"],
    cover: cover(3),
  },
  {
    id: "5",
    name: "Rhodes Scholarship",
    organizer: "Rhodes Trust",
    verified: true,
    country: "United Kingdom",
    city: "Oxford",
    region: "Europe",
    type: "Scholarship",
    industry: "Postgraduate",
    deadline: "2026-09-30",
    dates: "Oct 2027 intake",
    minAge: 19,
    maxAge: 25,
    funding: "fully-funded",
    format: "in-person",
    language: "English",
    applicationLink: "https://www.rhodeshouse.ox.ac.uk",
    shortDescription: "The world's most prestigious postgraduate scholarship at Oxford.",
    description:
      "Full funding for postgraduate study at the University of Oxford, plus stipend and travel. For young leaders with intellectual distinction and commitment to others.",
    benefits: ["Full tuition", "Stipend", "Lifelong network"],
    requiredDocuments: ["Transcripts", "Personal statement", "8 references"],
    tags: ["Scholarship", "Oxford", "Prestige"],
    cover: cover(4),
  },
  {
    id: "6",
    name: "Obama Foundation Leaders Program",
    organizer: "Obama Foundation",
    verified: true,
    country: "Multiple",
    city: "Various",
    region: "Global",
    type: "Fellowship",
    industry: "Civic Leadership",
    deadline: "2026-04-10",
    dates: "Sep 2026 – Jun 2027",
    minAge: 24,
    maxAge: 40,
    funding: "fully-funded",
    format: "hybrid",
    language: "English",
    applicationLink: "https://www.obama.org",
    shortDescription: "A 6-month leadership program for emerging civic leaders.",
    description:
      "Cohort-based leadership development including in-person convenings, virtual learning, and a hands-on community project.",
    benefits: ["Travel", "Coaching", "Project funding"],
    requiredDocuments: ["CV", "Essays", "Video"],
    tags: ["Civic", "Leadership", "Community"],
    cover: cover(5),
  },
  {
    id: "7",
    name: "World Youth Forum",
    organizer: "Govt. of Egypt",
    verified: true,
    country: "Egypt",
    city: "Sharm El-Sheikh",
    region: "Africa",
    type: "Forum",
    industry: "Diplomacy",
    deadline: "2026-08-30",
    dates: "Dec 2026",
    minAge: 18,
    maxAge: 35,
    funding: "fully-funded",
    format: "in-person",
    language: "English",
    applicationLink: "https://wyfegypt.com",
    shortDescription: "A platform for global youth dialogue with world leaders.",
    description:
      "Annual high-level forum bringing thousands of young people together with heads of state and policymakers.",
    benefits: ["Flights & hotel", "Cultural program", "World leader access"],
    requiredDocuments: ["Passport", "CV"],
    tags: ["Diplomacy", "Forum", "Global"],
    cover: cover(6),
  },
  {
    id: "8",
    name: "MIT Solve Global Challenge",
    organizer: "MIT Solve",
    verified: true,
    country: "USA",
    city: "Boston",
    region: "North America",
    type: "Competition",
    industry: "Innovation",
    deadline: "2026-05-15",
    dates: "Year-long program",
    minAge: 18,
    maxAge: 35,
    funding: "fully-funded",
    format: "hybrid",
    language: "English",
    applicationLink: "https://solve.mit.edu",
    shortDescription: "Funding & mentorship for tech-driven solutions to global challenges.",
    description:
      "Win up to $250K in prize funding plus a year-long support program from MIT's innovation community.",
    benefits: ["Funding", "MIT mentorship", "Demo Day"],
    requiredDocuments: ["Solution pitch", "Team CVs", "Video"],
    tags: ["Innovation", "Funding", "Tech"],
    cover: cover(7),
  },
];

export const REGIONS = ["All", "Africa", "Asia", "Europe", "North America", "South America", "Oceania", "Global"];
export const FUNDING: { value: FundingType | "all"; label: string }[] = [
  { value: "all", label: "All funding" },
  { value: "fully-funded", label: "Fully funded" },
  { value: "partial", label: "Partially funded" },
  { value: "free", label: "Free" },
  { value: "paid", label: "Paid" },
];
export const TYPES = ["All", "Summit", "Forum", "Fellowship", "Scholarship", "Festival", "Competition", "Conference"];
export const FORMATS: { value: Format | "all"; label: string }[] = [
  { value: "all", label: "Any format" },
  { value: "in-person", label: "In-person" },
  { value: "hybrid", label: "Hybrid" },
  { value: "online", label: "Online" },
];
