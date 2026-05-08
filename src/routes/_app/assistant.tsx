import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { opportunities } from "@/data/opportunities";
import { emptyPortfolio, useLocalStorage, type Portfolio } from "@/lib/store";
import { Sparkles, Copy, Wand2, AlertTriangle } from "lucide-react";

export const Route = createFileRoute("/_app/assistant")({
  component: Assistant,
});

const TEMPLATES = [
  { id: "motivation", label: "Motivation answer" },
  { id: "shortBio", label: "Short bio" },
  { id: "longBio", label: "Long bio" },
  { id: "leadership", label: "Leadership story" },
  { id: "impact", label: "Social impact" },
] as const;
type TemplateId = (typeof TEMPLATES)[number]["id"];

const TONES = ["Inspiring", "Formal", "Concise", "Conversational"] as const;

function generate(
  template: TemplateId,
  tone: string,
  p: Portfolio,
  eventName: string,
): { text: string; missing: string[] } {
  const missing: string[] = [];
  const need = (label: string, value: string) => {
    if (!value?.trim()) missing.push(label);
    return value?.trim() || `[add ${label.toLowerCase()} in your portfolio]`;
  };

  const name = need("Full name", p.fullName);
  const country = need("Country", p.country);
  const motivation = need("Motivation", p.motivation);
  const leadership = need("Leadership experience", p.leadership);
  const impact = need("Social impact experience", p.socialImpact);
  const goals = need("Career goals", p.goals);
  const interests = need("Areas of interest", p.interests);

  const intro = `${name}, based in ${country}`;

  let text = "";
  switch (template) {
    case "motivation":
      text = `As ${intro}, I'm applying to ${eventName} because ${motivation}. The opportunity directly aligns with my work in ${interests}, and the chance to engage with a global cohort would accelerate my goal to ${goals}. I'm particularly drawn to the program's focus on rigorous discussion and action-oriented outcomes.`;
      break;
    case "shortBio":
      text = `${intro}. Working at the intersection of ${interests}, with experience in ${leadership.split(".")[0]}. Driven by ${goals.split(".")[0]}.`;
      break;
    case "longBio":
      text = `${intro}, focused on ${interests}. Over the past years I've built experience through ${leadership}. My work in social impact includes ${impact}. Looking ahead, I'm committed to ${goals}.`;
      break;
    case "leadership":
      text = `One leadership experience that shaped me: ${leadership}. The biggest lesson was learning to align a diverse team around a shared purpose — a skill I would bring to ${eventName}.`;
      break;
    case "impact":
      text = `My social impact journey: ${impact}. This has reinforced why I'm pursuing ${goals}, and why ${eventName} is the natural next step in my path.`;
      break;
  }

  // Tone hint
  if (tone === "Concise") text = text.split(". ").slice(0, 3).join(". ") + ".";
  if (tone === "Formal") text = text.replace(/I'm/g, "I am").replace(/it's/g, "it is");
  if (tone === "Inspiring") text = `✨ ${text}`;

  return { text, missing };
}

function Assistant() {
  const [portfolio] = useLocalStorage<Portfolio>("ym:portfolio", emptyPortfolio);
  const [saved] = useLocalStorage<string[]>("ym:saved", []);
  const [eventId, setEventId] = useState<string>(saved[0] ?? opportunities[0].id);
  const [template, setTemplate] = useState<TemplateId>("motivation");
  const [tone, setTone] = useState<string>("Inspiring");
  const event = useMemo(
    () => opportunities.find((o) => o.id === eventId) ?? opportunities[0],
    [eventId],
  );

  const result = useMemo(
    () => generate(template, tone, portfolio, event.name),
    [template, tone, portfolio, event.name],
  );
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    await navigator.clipboard.writeText(result.text);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <div className="flex flex-col gap-5">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">AI Application Coach</h1>
        <p className="text-sm text-muted-foreground">
          Drafts use only your portfolio. Always review before submitting.
        </p>
      </div>

      <div className="rounded-2xl border border-border bg-card p-4 shadow-[var(--shadow-soft)]">
        <label className="block text-xs font-medium uppercase tracking-wide text-muted-foreground">
          Tailoring for
        </label>
        <select
          value={eventId}
          onChange={(e) => setEventId(e.target.value)}
          className="mt-1.5 w-full rounded-xl border border-input bg-background px-3 py-2 text-sm outline-none focus:border-ring"
        >
          {opportunities.map((o) => (
            <option key={o.id} value={o.id}>
              {o.name} — {o.organizer}
            </option>
          ))}
        </select>

        <div className="mt-4 space-y-3">
          <Chips
            label="What to write"
            options={TEMPLATES.map((t) => t.label)}
            value={TEMPLATES.find((t) => t.id === template)?.label ?? "Motivation answer"}
            onChange={(label) =>
              setTemplate(TEMPLATES.find((t) => t.label === label)?.id ?? "motivation")
            }
          />
          <Chips label="Tone" options={[...TONES]} value={tone} onChange={setTone} />
        </div>
      </div>

      <div className="rounded-2xl border border-border bg-card p-5 shadow-[var(--shadow-soft)]">
        <div className="mb-3 flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm font-semibold">
            <Sparkles className="h-4 w-4 text-primary" /> Draft
          </div>
          <button
            onClick={copy}
            className="inline-flex items-center gap-1.5 rounded-full bg-secondary px-3 py-1.5 text-xs font-medium text-secondary-foreground hover:bg-muted"
          >
            <Copy className="h-3.5 w-3.5" /> {copied ? "Copied!" : "Copy"}
          </button>
        </div>
        <p className="whitespace-pre-wrap text-sm leading-relaxed text-foreground/90">
          {result.text}
        </p>
        {result.missing.length > 0 && (
          <div className="mt-4 flex gap-2 rounded-xl border border-warning/40 bg-warning/10 p-3 text-xs text-foreground/80">
            <AlertTriangle className="h-4 w-4 shrink-0 text-warning" />
            <span>
              To strengthen this answer, complete in your portfolio:{" "}
              <strong>{result.missing.join(", ")}</strong>.
            </span>
          </div>
        )}
        <p className="mt-4 text-[11px] leading-relaxed text-muted-foreground">
          <Wand2 className="mr-1 inline h-3 w-3" />
          YouthMatch helps you prepare materials. You are responsible for
          reviewing, editing, confirming accuracy, and submitting your final
          application.
        </p>
      </div>
    </div>
  );
}

function Chips({
  label,
  options,
  value,
  onChange,
}: {
  label: string;
  options: string[];
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div>
      <p className="mb-1.5 text-xs font-medium uppercase tracking-wide text-muted-foreground">
        {label}
      </p>
      <div className="flex flex-wrap gap-1.5">
        {options.map((opt) => {
          const active = opt === value;
          return (
            <button
              key={opt}
              onClick={() => onChange(opt)}
              className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                active
                  ? "bg-foreground text-background"
                  : "bg-secondary text-secondary-foreground hover:bg-muted"
              }`}
            >
              {opt}
            </button>
          );
        })}
      </div>
    </div>
  );
}
