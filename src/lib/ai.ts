// Client-side "AI" memory, preferences, answer library, and feedback.
// Uses heuristic transforms — no backend model required for MVP.
import type { Portfolio } from "./store";

export const ANSWER_CATEGORIES = [
  "Motivation",
  "Leadership",
  "Social impact",
  "Academic background",
  "Professional experience",
  "Personal challenges",
  "Future goals",
  "Short bio",
  "Long bio",
  "Video script",
  "Interview answer",
] as const;
export type AnswerCategory = (typeof ANSWER_CATEGORIES)[number];

export const TONES = [
  "Inspiring",
  "Formal",
  "Conversational",
  "Professional",
  "Emotional",
  "Concise",
] as const;
export type Tone = (typeof TONES)[number];

export const LENGTHS = ["Short", "Medium", "Long"] as const;
export type Length = (typeof LENGTHS)[number];

export interface AIPreferences {
  tone: Tone;
  length: Length;
  language: string;
  emphasize: string;          // achievements/themes to emphasize
  avoid: string;              // things never to mention
  storyThemes: string;        // recurring narrative themes
  reuseSavedAnswers: boolean;
  learnFromEdits: boolean;
}

export const defaultPreferences: AIPreferences = {
  tone: "Inspiring",
  length: "Medium",
  language: "English",
  emphasize: "",
  avoid: "",
  storyThemes: "",
  reuseSavedAnswers: true,
  learnFromEdits: true,
};

export interface SavedAnswer {
  id: string;
  category: AnswerCategory;
  title: string;
  text: string;
  language: string;
  tone: Tone;
  createdAt: string;
  forEvent?: string;
}

export type FeedbackTag =
  | "use_style"
  | "more_formal"
  | "more_personal"
  | "too_generic"
  | "too_long"
  | "too_short"
  | "not_accurate"
  | "saved";

export interface AnswerFeedback {
  id: string;
  category: AnswerCategory;
  tag: FeedbackTag;
  snippet: string;        // first 200 chars of the answer for context
  createdAt: string;
}

export interface EditMemory {
  id: string;
  category: AnswerCategory;
  before: string;
  after: string;
  createdAt: string;
}

// ---------- Storage keys ----------
export const KEYS = {
  prefs: "ym:ai:prefs",
  library: "ym:ai:library",
  feedback: "ym:ai:feedback",
  edits: "ym:ai:edits",
};

export function newId() {
  return Math.random().toString(36).slice(2, 10);
}

// ---------- Writing profile ----------
// Derived snapshot used by the generator. Pure function so the UI can show it.
export interface WritingProfile {
  identity: string;
  strengths: string[];
  themes: string[];
  preferredTone: Tone;
  preferredLength: Length;
  preferredLanguage: string;
  emphasize: string;
  avoid: string;
  topFeedback: FeedbackTag[];
}

export function buildWritingProfile(
  portfolio: Portfolio,
  prefs: AIPreferences,
  feedback: AnswerFeedback[],
): WritingProfile {
  const strengths = [
    portfolio.leadership,
    portfolio.socialImpact,
    portfolio.awards,
    portfolio.internationalExperience,
  ]
    .map((s) => s?.split(/[.\n]/)[0]?.trim())
    .filter((s): s is string => !!s && s.length > 4)
    .slice(0, 4);

  const themes = [
    ...(prefs.storyThemes ? prefs.storyThemes.split(",").map((t) => t.trim()) : []),
    ...(portfolio.causes ? portfolio.causes.split(",").map((t) => t.trim()) : []),
  ]
    .filter(Boolean)
    .slice(0, 6);

  const counts = new Map<FeedbackTag, number>();
  for (const f of feedback) counts.set(f.tag, (counts.get(f.tag) ?? 0) + 1);
  const topFeedback = [...counts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([t]) => t);

  return {
    identity:
      [portfolio.fullName, portfolio.country].filter(Boolean).join(" · ") ||
      "Young leader",
    strengths,
    themes,
    preferredTone: prefs.tone,
    preferredLength: prefs.length,
    preferredLanguage: prefs.language,
    emphasize: prefs.emphasize,
    avoid: prefs.avoid,
    topFeedback,
  };
}

// ---------- Heuristic generator ----------
// NOTE: This is a deterministic, portfolio-grounded writer. It never invents
// experiences — it falls back to "[add ... in your portfolio]" placeholders
// the UI surfaces to the user.

const LENGTH_TARGETS: Record<Length, number> = { Short: 2, Medium: 4, Long: 7 };

export function generateAnswer(opts: {
  category: AnswerCategory;
  portfolio: Portfolio;
  prefs: AIPreferences;
  feedback: AnswerFeedback[];
  library: SavedAnswer[];
  eventName: string;
  organizer: string;
}): { text: string; missing: string[]; reusedFromLibrary?: string } {
  const { category, portfolio, prefs, library, eventName, organizer } = opts;
  const missing: string[] = [];
  const grab = (label: string, value: string) => {
    if (!value?.trim()) {
      missing.push(label);
      return `[add ${label.toLowerCase()} in your portfolio]`;
    }
    return value.trim();
  };

  // Try to reuse a saved answer of the same category as a seed.
  let seed: string | undefined;
  let reusedFromLibrary: string | undefined;
  if (prefs.reuseSavedAnswers) {
    const candidate = library
      .filter((s) => s.category === category)
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt))[0];
    if (candidate) {
      seed = candidate.text;
      reusedFromLibrary = candidate.title || candidate.id;
    }
  }

  const name = grab("Full name", portfolio.fullName);
  const country = grab("Country", portfolio.country);

  let sentences: string[] = [];

  switch (category) {
    case "Motivation":
      sentences = [
        `I am ${name}, from ${country}, applying to ${eventName} hosted by ${organizer}.`,
        `${grab("Motivation", portfolio.motivation)}`,
        `My work in ${grab("Areas of interest", portfolio.interests)} prepares me to contribute meaningfully.`,
        `Looking ahead, I am committed to ${grab("Career goals", portfolio.goals)}.`,
      ];
      break;
    case "Leadership":
      sentences = [
        `${grab("Leadership experience", portfolio.leadership)}`,
        `This taught me to align diverse people around a shared purpose.`,
        `I would bring that practice to ${eventName}.`,
      ];
      break;
    case "Social impact":
      sentences = [
        `${grab("Social impact experience", portfolio.socialImpact)}`,
        `It reinforced the causes I care about: ${grab("Causes", portfolio.causes)}.`,
        `${eventName} is the natural next step on that path.`,
      ];
      break;
    case "Academic background":
      sentences = [
        `${grab("Education", portfolio.education)}`,
        `My academic focus aligns with ${grab("Areas of interest", portfolio.interests)}.`,
      ];
      break;
    case "Professional experience":
      sentences = [
        `${grab("Work experience", portfolio.workExperience)}`,
        `I bring practical skills in ${grab("Skills", portfolio.skills)}.`,
      ];
      break;
    case "Personal challenges":
      sentences = [
        `${grab("A difficult moment", portfolio.challenges)}`,
        `That experience shaped how I lead under pressure today.`,
      ];
      break;
    case "Future goals":
      sentences = [
        `${grab("Career goals", portfolio.goals)}`,
        `${eventName} accelerates this trajectory by exposing me to a global cohort.`,
      ];
      break;
    case "Short bio":
      sentences = [
        `${name}, ${country}. Working at the intersection of ${grab("Areas of interest", portfolio.interests)}.`,
        `Driven by ${grab("Career goals", portfolio.goals).split(".")[0]}.`,
      ];
      break;
    case "Long bio":
      sentences = [
        `${name}, based in ${country}, focused on ${grab("Areas of interest", portfolio.interests)}.`,
        `${grab("Leadership experience", portfolio.leadership)}`,
        `${grab("Social impact experience", portfolio.socialImpact)}`,
        `Committed to ${grab("Career goals", portfolio.goals)}.`,
      ];
      break;
    case "Video script":
      sentences = [
        `Hi, I'm ${name} from ${country}.`,
        `I'm applying to ${eventName} because ${grab("Motivation", portfolio.motivation)}`,
        `In my work I've ${grab("Leadership experience", portfolio.leadership).split(".")[0]}.`,
        `Thank you for considering my application.`,
      ];
      break;
    case "Interview answer":
      sentences = [
        `Thank you for the question.`,
        `${grab("Motivation", portfolio.motivation)}`,
        `Concretely, ${grab("Leadership experience", portfolio.leadership).split(".")[0]}.`,
      ];
      break;
  }

  // If we reused a saved seed, prepend it lightly.
  if (seed) sentences = [seed, ...sentences.slice(1)];

  // Apply length preference.
  const target = LENGTH_TARGETS[prefs.length];
  sentences = sentences.slice(0, target);

  let text = sentences.join(" ");

  // Emphasize hooks.
  if (prefs.emphasize.trim()) {
    text += ` In particular, I would highlight ${prefs.emphasize.trim()}.`;
  }

  text = applyTone(text, prefs.tone);
  return { text: text.trim(), missing, reusedFromLibrary };
}

// ---------- Refinement transforms (chat-style actions) ----------
export type RefineAction =
  | "shorter"
  | "longer"
  | "more_formal"
  | "more_emotional"
  | "more_inspiring"
  | "more_concise"
  | "more_professional"
  | "more_natural"
  | "leadership_focus"
  | "impact_focus"
  | "personal_story"
  | "avoid_exaggeration"
  | "fix_grammar"
  | "translate"
  | "adapt_event"
  | "variation";

export interface RefineContext {
  language?: string;
  eventName?: string;
  portfolio?: Portfolio;
}

export function refineAnswer(
  text: string,
  action: RefineAction,
  ctx: RefineContext = {},
): string {
  switch (action) {
    case "shorter":
    case "more_concise": {
      const s = splitSentences(text);
      return s.slice(0, Math.max(1, Math.ceil(s.length / 2))).join(" ");
    }
    case "longer": {
      return (
        text +
        (ctx.portfolio?.goals
          ? ` Looking ahead, I want to ${ctx.portfolio.goals.split(".")[0]}.`
          : " I am eager to contribute, learn, and bring lessons back to my community.")
      );
    }
    case "more_formal":
      return applyTone(text, "Formal");
    case "more_emotional":
      return applyTone(text, "Emotional");
    case "more_inspiring":
      return applyTone(text, "Inspiring");
    case "more_professional":
      return applyTone(text, "Professional");
    case "more_natural":
      return text
        .replace(/\bI am\b/g, "I'm")
        .replace(/\bdo not\b/g, "don't")
        .replace(/\bit is\b/g, "it's");
    case "leadership_focus":
      return (
        text +
        (ctx.portfolio?.leadership
          ? ` From a leadership angle, ${ctx.portfolio.leadership.split(".")[0]}.`
          : " From a leadership angle, I focus on aligning teams around shared purpose.")
      );
    case "impact_focus":
      return (
        text +
        (ctx.portfolio?.socialImpact
          ? ` In terms of impact, ${ctx.portfolio.socialImpact.split(".")[0]}.`
          : " In terms of impact, I prioritise measurable outcomes for the communities I serve.")
      );
    case "personal_story":
      return (
        text +
        (ctx.portfolio?.challenges
          ? ` On a personal note, ${ctx.portfolio.challenges.split(".")[0]}.`
          : " On a personal note, this work matters to me because of the people it serves.")
      );
    case "avoid_exaggeration":
      return text
        .replace(/\b(amazing|incredible|revolutionary|world-class|the best)\b/gi, "meaningful")
        .replace(/!+/g, ".");
    case "fix_grammar":
      return text
        .replace(/\s+/g, " ")
        .replace(/\s+([.,;:!?])/g, "$1")
        .replace(/\.{2,}/g, ".")
        .trim();
    case "translate":
      return `[${ctx.language ?? "Other language"}] ${text}`;
    case "adapt_event":
      return ctx.eventName
        ? text.replace(/\bthis (program|opportunity|event)\b/gi, ctx.eventName) +
            ` ${ctx.eventName} aligns with my goals.`
        : text;
    case "variation":
      return shuffleSentences(text);
  }
}

function applyTone(text: string, tone: Tone): string {
  switch (tone) {
    case "Formal":
    case "Professional":
      return text.replace(/\bI'm\b/g, "I am").replace(/\bit's\b/g, "it is");
    case "Inspiring":
      return text.endsWith(".") ? text + " I'm ready to take the next step." : text + ".";
    case "Emotional":
      return text + " This work is deeply personal to me.";
    case "Concise":
      return splitSentences(text).slice(0, 3).join(" ");
    case "Conversational":
      return text.replace(/\bI am\b/g, "I'm");
  }
}

function splitSentences(text: string): string[] {
  return text
    .split(/(?<=[.!?])\s+/)
    .map((s) => s.trim())
    .filter(Boolean);
}

function shuffleSentences(text: string): string {
  const s = splitSentences(text);
  if (s.length < 2) return text;
  const [first, ...rest] = s;
  return [...rest, first].join(" ");
}
