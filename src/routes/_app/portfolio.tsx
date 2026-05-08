import { createFileRoute } from "@tanstack/react-router";
import { emptyPortfolio, useLocalStorage, type Portfolio } from "@/lib/store";
import { Upload, Save, Sparkles } from "lucide-react";
import { useState } from "react";

export const Route = createFileRoute("/_app/portfolio")({
  component: PortfolioPage,
});

const SECTIONS: {
  title: string;
  fields: { key: keyof Portfolio; label: string; long?: boolean; placeholder?: string }[];
}[] = [
  {
    title: "Basics",
    fields: [
      { key: "fullName", label: "Full name" },
      { key: "age", label: "Age" },
      { key: "country", label: "Country of residence" },
      { key: "nationality", label: "Nationality" },
      { key: "email", label: "Email" },
    ],
  },
  {
    title: "Background",
    fields: [
      { key: "education", label: "Education", long: true, placeholder: "Degrees, institutions, dates…" },
      { key: "workExperience", label: "Work experience", long: true },
      { key: "volunteerExperience", label: "Volunteer experience", long: true },
      { key: "leadership", label: "Leadership experience", long: true },
      { key: "awards", label: "Awards & recognitions", long: true },
    ],
  },
  {
    title: "Skills & languages",
    fields: [
      { key: "languages", label: "Languages", placeholder: "English (C2), Spanish (B2)…" },
      { key: "skills", label: "Skills", placeholder: "Public speaking, research, design…" },
      { key: "interests", label: "Areas of interest" },
    ],
  },
  {
    title: "Story & impact",
    fields: [
      { key: "socialImpact", label: "Social impact experience", long: true },
      { key: "internationalExperience", label: "International experience", long: true },
      { key: "motivation", label: "Why international opportunities matter to you", long: true },
      { key: "challenges", label: "A difficult moment & how you overcame it", long: true },
      { key: "causes", label: "Causes you care about" },
      { key: "goals", label: "Career & life aspirations", long: true },
    ],
  },
];

function PortfolioPage() {
  const [portfolio, setPortfolio] = useLocalStorage<Portfolio>("ym:portfolio", emptyPortfolio);
  const [savedFlash, setSavedFlash] = useState(false);

  const update = (key: keyof Portfolio, value: string) =>
    setPortfolio((p) => ({ ...p, [key]: value }));

  const flash = () => {
    setSavedFlash(true);
    setTimeout(() => setSavedFlash(false), 1200);
  };

  const completion = (() => {
    const keys = Object.keys(emptyPortfolio) as (keyof Portfolio)[];
    const filled = keys.filter((k) => portfolio[k]?.trim().length).length;
    return Math.round((filled / keys.length) * 100);
  })();

  return (
    <div className="flex flex-col gap-5">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Your portfolio</h1>
        <p className="text-sm text-muted-foreground">
          Tell your story once — the AI Coach will tailor it for every application.
        </p>
      </div>

      {/* Progress + CV upload */}
      <div className="grid gap-3 md:grid-cols-2">
        <div className="rounded-2xl border border-border bg-card p-4 shadow-[var(--shadow-soft)]">
          <div className="mb-2 flex items-center justify-between text-sm">
            <span className="font-medium">Profile completion</span>
            <span className="text-muted-foreground">{completion}%</span>
          </div>
          <div className="h-2 w-full overflow-hidden rounded-full bg-secondary">
            <div
              className="h-full rounded-full bg-[image:var(--gradient-primary)] transition-all"
              style={{ width: `${completion}%` }}
            />
          </div>
          <p className="mt-2 text-xs text-muted-foreground">
            Aim for 80%+ to unlock the strongest AI-generated answers.
          </p>
        </div>
        <label className="flex cursor-pointer flex-col items-start gap-2 rounded-2xl border border-dashed border-border bg-card p-4 transition-colors hover:bg-secondary">
          <div className="flex items-center gap-2 text-sm font-medium">
            <Upload className="h-4 w-4" /> Upload CV (PDF)
          </div>
          <p className="text-xs text-muted-foreground">
            We'll extract your experience and pre-fill fields. You'll review before saving.
          </p>
          <input
            type="file"
            accept="application/pdf"
            className="hidden"
            onChange={() => alert("CV parsing will run on the backend in a future release.")}
          />
        </label>
      </div>

      {/* Sections */}
      {SECTIONS.map((section) => (
        <section
          key={section.title}
          className="rounded-2xl border border-border bg-card p-5 shadow-[var(--shadow-soft)]"
        >
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
            {section.title}
          </h2>
          <div className="grid gap-3 md:grid-cols-2">
            {section.fields.map((f) => (
              <label key={f.key} className={`flex flex-col gap-1.5 text-sm ${f.long ? "md:col-span-2" : ""}`}>
                <span className="font-medium">{f.label}</span>
                {f.long ? (
                  <textarea
                    value={portfolio[f.key]}
                    onChange={(e) => update(f.key, e.target.value)}
                    placeholder={f.placeholder}
                    rows={3}
                    className="resize-y rounded-xl border border-input bg-background px-3 py-2 text-sm outline-none transition-colors focus:border-ring"
                  />
                ) : (
                  <input
                    value={portfolio[f.key]}
                    onChange={(e) => update(f.key, e.target.value)}
                    placeholder={f.placeholder}
                    className="rounded-xl border border-input bg-background px-3 py-2 text-sm outline-none transition-colors focus:border-ring"
                  />
                )}
              </label>
            ))}
          </div>
        </section>
      ))}

      <div className="sticky bottom-24 flex justify-center">
        <button
          onClick={flash}
          className="inline-flex items-center gap-2 rounded-full bg-[image:var(--gradient-primary)] px-5 py-3 text-sm font-semibold text-primary-foreground shadow-[var(--shadow-glow)] transition-transform hover:-translate-y-0.5"
        >
          {savedFlash ? <Sparkles className="h-4 w-4" /> : <Save className="h-4 w-4" />}
          {savedFlash ? "Saved!" : "Save portfolio"}
        </button>
      </div>
    </div>
  );
}
