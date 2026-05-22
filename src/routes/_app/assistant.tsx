import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { allOpportunitiesData as opportunities } from "@/data/opportunities";
import { emptyPortfolio, useLocalStorage, type Portfolio } from "@/lib/store";
import {
  ANSWER_CATEGORIES,
  LENGTHS,
  TONES,
  buildWritingProfile,
  defaultPreferences,
  generateAnswer,
  newId,
  refineAnswer,
  type AIPreferences,
  type AnswerCategory,
  type AnswerFeedback,
  type EditMemory,
  type FeedbackTag,
  type Length,
  type RefineAction,
  type SavedAnswer,
  type Tone,
  KEYS,
} from "@/lib/ai";
import {
  AlertTriangle,
  BookMarked,
  Brain,
  Copy,
  MessageCircle,
  Save,
  Sparkles,
  Trash2,
  Wand2,
} from "lucide-react";

export const Route = createFileRoute("/_app/assistant")({
  component: Assistant,
});

type TabId = "generate" | "library" | "memory";

const REFINE_ACTIONS: { id: RefineAction; label: string }[] = [
  { id: "shorter", label: "Shorter" },
  { id: "longer", label: "Longer" },
  { id: "more_formal", label: "More formal" },
  { id: "more_emotional", label: "More emotional" },
  { id: "more_inspiring", label: "More inspiring" },
  { id: "more_concise", label: "More concise" },
  { id: "more_professional", label: "More professional" },
  { id: "more_natural", label: "More natural" },
  { id: "leadership_focus", label: "+ Leadership focus" },
  { id: "impact_focus", label: "+ Social impact focus" },
  { id: "personal_story", label: "+ Personal story" },
  { id: "avoid_exaggeration", label: "Avoid exaggeration" },
  { id: "fix_grammar", label: "Fix grammar" },
  { id: "translate", label: "Translate" },
  { id: "adapt_event", label: "Adapt to event" },
  { id: "variation", label: "New variation" },
];

const FEEDBACK_OPTIONS: { id: FeedbackTag; label: string }[] = [
  { id: "use_style", label: "Use this style again" },
  { id: "more_formal", label: "Make it more formal" },
  { id: "more_personal", label: "Make it more personal" },
  { id: "too_generic", label: "Too generic" },
  { id: "too_long", label: "Too long" },
  { id: "too_short", label: "Too short" },
  { id: "not_accurate", label: "Not accurate" },
  { id: "saved", label: "Save this version" },
];

function Assistant() {
  const [tab, setTab] = useState<TabId>("generate");
  const [portfolio] = useLocalStorage<Portfolio>("ym:portfolio", emptyPortfolio);
  const [prefs, setPrefs] = useLocalStorage<AIPreferences>(KEYS.prefs, defaultPreferences);
  const [library, setLibrary] = useLocalStorage<SavedAnswer[]>(KEYS.library, []);
  const [feedback, setFeedback] = useLocalStorage<AnswerFeedback[]>(KEYS.feedback, []);
  const [edits, setEdits] = useLocalStorage<EditMemory[]>(KEYS.edits, []);

  return (
    <div className="flex flex-col gap-5">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">AI Application Coach</h1>
        <p className="text-sm text-muted-foreground">
          Drafts grounded in your portfolio and personal writing profile. Always
          editable. Never invents experiences.
        </p>
      </div>

      <div className="flex gap-1 rounded-full border border-border bg-card p-1 text-xs font-medium">
        <TabBtn active={tab === "generate"} onClick={() => setTab("generate")} icon={<Sparkles className="h-3.5 w-3.5" />}>
          Generate
        </TabBtn>
        <TabBtn active={tab === "library"} onClick={() => setTab("library")} icon={<BookMarked className="h-3.5 w-3.5" />}>
          Library ({library.length})
        </TabBtn>
        <TabBtn active={tab === "memory"} onClick={() => setTab("memory")} icon={<Brain className="h-3.5 w-3.5" />}>
          Memory
        </TabBtn>
      </div>

      {tab === "generate" && (
        <GenerateTab
          portfolio={portfolio}
          prefs={prefs}
          library={library}
          feedback={feedback}
          onSaveToLibrary={(item) => setLibrary((p) => [item, ...p])}
          onFeedback={(f) => setFeedback((p) => [f, ...p].slice(0, 200))}
          onEdit={(e) => prefs.learnFromEdits && setEdits((p) => [e, ...p].slice(0, 100))}
        />
      )}

      {tab === "library" && (
        <LibraryTab library={library} onDelete={(id) => setLibrary((p) => p.filter((s) => s.id !== id))} />
      )}

      {tab === "memory" && (
        <MemoryTab
          portfolio={portfolio}
          prefs={prefs}
          setPrefs={setPrefs}
          feedback={feedback}
          edits={edits}
          onClearEdits={() => setEdits([])}
          onClearFeedback={() => setFeedback([])}
        />
      )}
    </div>
  );
}

// ============================================================
// Generate tab
// ============================================================

function GenerateTab(props: {
  portfolio: Portfolio;
  prefs: AIPreferences;
  library: SavedAnswer[];
  feedback: AnswerFeedback[];
  onSaveToLibrary: (s: SavedAnswer) => void;
  onFeedback: (f: AnswerFeedback) => void;
  onEdit: (e: EditMemory) => void;
}) {
  const { portfolio, prefs, library, feedback, onSaveToLibrary, onFeedback, onEdit } = props;
  const [eventId, setEventId] = useState(opportunities[0].id);
  const [category, setCategory] = useState<AnswerCategory>("Motivation");
  const [versions, setVersions] = useState<{ text: string; missing: string[]; reusedFromLibrary?: string }[]>([]);
  const [active, setActive] = useState(0);
  const [draftText, setDraftText] = useState("");
  const [originalText, setOriginalText] = useState("");
  const [savedFlash, setSavedFlash] = useState(false);

  const event = useMemo(
    () => opportunities.find((o) => o.id === eventId) ?? opportunities[0],
    [eventId],
  );

  const handleGenerate = (count = 1) => {
    const out = Array.from({ length: count }, () =>
      generateAnswer({
        category,
        portfolio,
        prefs,
        feedback,
        library,
        eventName: event.name,
        organizer: event.organizer,
      }),
    );
    setVersions(out);
    setActive(0);
    setDraftText(out[0].text);
    setOriginalText(out[0].text);
  };

  const switchVersion = (i: number) => {
    setActive(i);
    setDraftText(versions[i].text);
    setOriginalText(versions[i].text);
  };

  const refine = (action: RefineAction) => {
    const language = action === "translate" ? prompt("Language?", prefs.language) ?? prefs.language : undefined;
    const next = refineAnswer(draftText, action, {
      portfolio,
      eventName: event.name,
      language,
    });
    setDraftText(next);
  };

  const commitEdit = () => {
    if (draftText !== originalText) {
      onEdit({
        id: newId(),
        category,
        before: originalText,
        after: draftText,
        createdAt: new Date().toISOString(),
      });
      setOriginalText(draftText);
    }
  };

  const giveFeedback = (tag: FeedbackTag) => {
    onFeedback({
      id: newId(),
      category,
      tag,
      snippet: draftText.slice(0, 200),
      createdAt: new Date().toISOString(),
    });
    if (tag === "saved") saveToLibrary();
  };

  const saveToLibrary = () => {
    if (!draftText.trim()) return;
    commitEdit();
    onSaveToLibrary({
      id: newId(),
      category,
      title: `${category} — ${event.name}`,
      text: draftText,
      language: prefs.language,
      tone: prefs.tone,
      createdAt: new Date().toISOString(),
      forEvent: event.name,
    });
    setSavedFlash(true);
    setTimeout(() => setSavedFlash(false), 1500);
  };

  const copy = async () => {
    await navigator.clipboard.writeText(draftText);
  };

  const current = versions[active];

  return (
    <>
      <section className="rounded-2xl border border-border bg-card p-4 shadow-[var(--shadow-soft)]">
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

        <label className="mt-3 block text-xs font-medium uppercase tracking-wide text-muted-foreground">
          Answer type
        </label>
        <div className="mt-1.5 flex flex-wrap gap-1.5">
          {ANSWER_CATEGORIES.map((c) => (
            <button
              key={c}
              onClick={() => setCategory(c)}
              className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                c === category
                  ? "bg-foreground text-background"
                  : "bg-secondary text-secondary-foreground hover:bg-muted"
              }`}
            >
              {c}
            </button>
          ))}
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          <button
            onClick={() => handleGenerate(1)}
            className="inline-flex items-center gap-1.5 rounded-full bg-[image:var(--gradient-primary)] px-4 py-2 text-xs font-semibold text-primary-foreground shadow-[var(--shadow-glow)]"
          >
            <Sparkles className="h-3.5 w-3.5" /> Generate
          </button>
          <button
            onClick={() => handleGenerate(3)}
            className="inline-flex items-center gap-1.5 rounded-full border border-border bg-card px-4 py-2 text-xs font-medium hover:bg-secondary"
          >
            <Wand2 className="h-3.5 w-3.5" /> 3 variations
          </button>
        </div>
      </section>

      {versions.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-border bg-card p-6 text-center text-sm text-muted-foreground">
          Pick an answer type and press <strong>Generate</strong>. Your portfolio, saved answers, and preferences shape the result.
        </p>
      ) : (
        <>
          {versions.length > 1 && (
            <div className="flex gap-1.5">
              {versions.map((_, i) => (
                <button
                  key={i}
                  onClick={() => switchVersion(i)}
                  className={`flex-1 rounded-full px-3 py-1.5 text-xs font-medium ${
                    i === active ? "bg-foreground text-background" : "bg-secondary text-secondary-foreground"
                  }`}
                >
                  Version {i + 1}
                </button>
              ))}
            </div>
          )}

          <section className="rounded-2xl border border-border bg-card p-5 shadow-[var(--shadow-soft)]">
            <div className="mb-3 flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm font-semibold">
                <Sparkles className="h-4 w-4 text-primary" /> Draft (editable)
              </div>
              <div className="flex items-center gap-1.5">
                <button onClick={copy} className="rounded-full bg-secondary px-3 py-1.5 text-xs hover:bg-muted">
                  <Copy className="mr-1 inline h-3 w-3" /> Copy
                </button>
                <button
                  onClick={saveToLibrary}
                  className="rounded-full bg-[image:var(--gradient-primary)] px-3 py-1.5 text-xs font-semibold text-primary-foreground"
                >
                  <Save className="mr-1 inline h-3 w-3" /> {savedFlash ? "Saved!" : "Save to library"}
                </button>
              </div>
            </div>

            <textarea
              value={draftText}
              onChange={(e) => setDraftText(e.target.value)}
              onBlur={commitEdit}
              rows={Math.max(6, Math.min(16, Math.ceil(draftText.length / 80)))}
              className="w-full resize-y rounded-xl border border-border bg-background p-3 text-sm leading-relaxed"
            />
            <p className="mt-1 text-[11px] text-muted-foreground">
              {draftText.trim().split(/\s+/).filter(Boolean).length} words · You stay in control. Edit anything.
            </p>

            {current?.reusedFromLibrary && (
              <p className="mt-2 text-[11px] text-muted-foreground">
                <BookMarked className="mr-1 inline h-3 w-3" /> Adapted from your saved answer: {current.reusedFromLibrary}
              </p>
            )}

            {current?.missing && current.missing.length > 0 && (
              <div className="mt-3 flex gap-2 rounded-xl border border-warning/40 bg-warning/10 p-3 text-xs text-foreground/80">
                <AlertTriangle className="h-4 w-4 shrink-0 text-warning" />
                <span>
                  The AI didn't invent anything for: <strong>{current.missing.join(", ")}</strong>. Add this to your portfolio for stronger answers.
                </span>
              </div>
            )}
          </section>

          <section className="rounded-2xl border border-border bg-card p-4">
            <div className="mb-2 flex items-center gap-2 text-sm font-semibold">
              <MessageCircle className="h-4 w-4 text-primary" /> Ask the assistant
            </div>
            <p className="mb-3 text-xs text-muted-foreground">
              Tap any action to refine the draft above. Re-tap to layer changes.
            </p>
            <div className="flex flex-wrap gap-1.5">
              {REFINE_ACTIONS.map((a) => (
                <button
                  key={a.id}
                  onClick={() => refine(a.id)}
                  className="rounded-full bg-secondary px-3 py-1.5 text-xs font-medium text-secondary-foreground hover:bg-muted"
                >
                  {a.label}
                </button>
              ))}
            </div>
          </section>

          <section className="rounded-2xl border border-border bg-card p-4">
            <div className="mb-2 text-sm font-semibold">Feedback (helps future drafts)</div>
            <div className="flex flex-wrap gap-1.5">
              {FEEDBACK_OPTIONS.map((f) => (
                <button
                  key={f.id}
                  onClick={() => giveFeedback(f.id)}
                  className="rounded-full border border-border bg-card px-3 py-1.5 text-xs font-medium hover:bg-secondary"
                >
                  {f.label}
                </button>
              ))}
            </div>
          </section>
        </>
      )}
    </>
  );
}

// ============================================================
// Library tab
// ============================================================

function LibraryTab({
  library,
  onDelete,
}: {
  library: SavedAnswer[];
  onDelete: (id: string) => void;
}) {
  const grouped = useMemo(() => {
    const m = new Map<AnswerCategory, SavedAnswer[]>();
    for (const a of library) {
      const arr = m.get(a.category) ?? [];
      arr.push(a);
      m.set(a.category, arr);
    }
    return m;
  }, [library]);

  if (library.length === 0) {
    return (
      <p className="rounded-2xl border border-dashed border-border bg-card p-6 text-center text-sm text-muted-foreground">
        No saved answers yet. Use <strong>Save to library</strong> from the Generate tab to build a reusable bank.
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      {ANSWER_CATEGORIES.filter((c) => grouped.has(c)).map((c) => (
        <section key={c} className="rounded-2xl border border-border bg-card p-4">
          <h3 className="mb-2 text-sm font-semibold">{c}</h3>
          <div className="space-y-2">
            {grouped.get(c)!.map((a) => (
              <div key={a.id} className="rounded-xl border border-border bg-background p-3 text-sm">
                <div className="mb-1 flex items-center justify-between gap-2 text-[11px] text-muted-foreground">
                  <span>{a.title}</span>
                  <button
                    onClick={() => onDelete(a.id)}
                    className="rounded-full p-1 text-muted-foreground hover:bg-secondary hover:text-destructive"
                    aria-label="Delete"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
                <p className="whitespace-pre-wrap text-foreground/90">{a.text}</p>
                <p className="mt-2 text-[10px] text-muted-foreground">
                  {a.tone} · {a.language} · {new Date(a.createdAt).toLocaleDateString()}
                </p>
              </div>
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}

// ============================================================
// Memory tab
// ============================================================

function MemoryTab({
  portfolio,
  prefs,
  setPrefs,
  feedback,
  edits,
  onClearEdits,
  onClearFeedback,
}: {
  portfolio: Portfolio;
  prefs: AIPreferences;
  setPrefs: (updater: (p: AIPreferences) => AIPreferences) => void;
  feedback: AnswerFeedback[];
  edits: EditMemory[];
  onClearEdits: () => void;
  onClearFeedback: () => void;
}) {
  const profile = useMemo(
    () => buildWritingProfile(portfolio, prefs, feedback),
    [portfolio, prefs, feedback],
  );
  const update = <K extends keyof AIPreferences>(key: K, value: AIPreferences[K]) =>
    setPrefs((p) => ({ ...p, [key]: value }));

  return (
    <div className="flex flex-col gap-4">
      <section className="rounded-2xl border border-border bg-card p-4">
        <h3 className="text-sm font-semibold">Your writing profile</h3>
        <p className="mt-1 text-xs text-muted-foreground">
          Derived from your portfolio, preferences, and feedback. The AI uses this to keep your voice consistent.
        </p>
        <dl className="mt-3 grid gap-2 text-sm sm:grid-cols-2">
          <Row k="Identity" v={profile.identity} />
          <Row k="Preferred tone" v={profile.preferredTone} />
          <Row k="Preferred length" v={profile.preferredLength} />
          <Row k="Preferred language" v={profile.preferredLanguage} />
          <Row k="Strengths" v={profile.strengths.join(" · ") || "—"} />
          <Row k="Recurring themes" v={profile.themes.join(", ") || "—"} />
          <Row k="Emphasize" v={profile.emphasize || "—"} />
          <Row k="Never mention" v={profile.avoid || "—"} />
          <Row k="Top feedback signals" v={profile.topFeedback.join(", ") || "—"} />
        </dl>
      </section>

      <section className="rounded-2xl border border-border bg-card p-4">
        <h3 className="text-sm font-semibold">AI Memory & Preferences</h3>
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          <Field label="Preferred tone">
            <select
              value={prefs.tone}
              onChange={(e) => update("tone", e.target.value as Tone)}
              className="w-full rounded-xl border border-input bg-background px-3 py-2 text-sm"
            >
              {TONES.map((t) => <option key={t}>{t}</option>)}
            </select>
          </Field>
          <Field label="Preferred length">
            <select
              value={prefs.length}
              onChange={(e) => update("length", e.target.value as Length)}
              className="w-full rounded-xl border border-input bg-background px-3 py-2 text-sm"
            >
              {LENGTHS.map((l) => <option key={l}>{l}</option>)}
            </select>
          </Field>
          <Field label="Preferred language">
            <input
              value={prefs.language}
              onChange={(e) => update("language", e.target.value)}
              className="w-full rounded-xl border border-input bg-background px-3 py-2 text-sm"
            />
          </Field>
          <Field label="Key achievements to emphasize" full>
            <textarea
              value={prefs.emphasize}
              onChange={(e) => update("emphasize", e.target.value)}
              rows={2}
              className="w-full rounded-xl border border-input bg-background px-3 py-2 text-sm"
              placeholder="e.g. founded a youth NGO reaching 5,000 students"
            />
          </Field>
          <Field label="Things the AI should never mention" full>
            <textarea
              value={prefs.avoid}
              onChange={(e) => update("avoid", e.target.value)}
              rows={2}
              className="w-full rounded-xl border border-input bg-background px-3 py-2 text-sm"
              placeholder="Topics, jobs, or stories to leave out"
            />
          </Field>
          <Field label="Recurring personal story themes" full>
            <textarea
              value={prefs.storyThemes}
              onChange={(e) => update("storyThemes", e.target.value)}
              rows={2}
              className="w-full rounded-xl border border-input bg-background px-3 py-2 text-sm"
              placeholder="e.g. resilience, bridging cultures, youth participation"
            />
          </Field>
        </div>

        <div className="mt-4 space-y-2 text-sm">
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={prefs.reuseSavedAnswers}
              onChange={(e) => update("reuseSavedAnswers", e.target.checked)}
              className="h-4 w-4 accent-[color:var(--primary)]"
            />
            Allow the AI to reuse my saved answers as a starting point (always adapted to the event)
          </label>
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={prefs.learnFromEdits}
              onChange={(e) => update("learnFromEdits", e.target.checked)}
              className="h-4 w-4 accent-[color:var(--primary)]"
            />
            Let the AI learn from edits I make to generated answers
          </label>
        </div>
      </section>

      <section className="rounded-2xl border border-border bg-card p-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold">Activity</h3>
          <div className="flex gap-1.5 text-[11px]">
            <button onClick={onClearFeedback} className="rounded-full bg-secondary px-2.5 py-1 hover:bg-muted">
              Clear feedback ({feedback.length})
            </button>
            <button onClick={onClearEdits} className="rounded-full bg-secondary px-2.5 py-1 hover:bg-muted">
              Clear edits ({edits.length})
            </button>
          </div>
        </div>
        <p className="mt-2 text-xs text-muted-foreground">
          {feedback.length} feedback signal{feedback.length === 1 ? "" : "s"} and {edits.length} edit{edits.length === 1 ? "" : "s"} recorded. Used to refine future drafts. Stored only on this device.
        </p>
      </section>

      <p className="text-[11px] leading-relaxed text-muted-foreground">
        <Wand2 className="mr-1 inline h-3 w-3" /> The AI never invents achievements, awards, education, work history, or stories. If something is missing, complete your portfolio first.
      </p>
    </div>
  );
}

// ============================================================
// UI helpers
// ============================================================

function TabBtn({
  active,
  onClick,
  icon,
  children,
}: {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={`flex flex-1 items-center justify-center gap-1.5 rounded-full px-3 py-1.5 transition-colors ${
        active ? "bg-foreground text-background" : "text-muted-foreground hover:text-foreground"
      }`}
    >
      {icon}
      {children}
    </button>
  );
}

function Row({ k, v }: { k: string; v: string }) {
  return (
    <div className="rounded-xl bg-secondary px-3 py-2">
      <div className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">{k}</div>
      <div className="mt-0.5 text-sm font-medium">{v}</div>
    </div>
  );
}

function Field({ label, full, children }: { label: string; full?: boolean; children: React.ReactNode }) {
  return (
    <label className={`flex flex-col gap-1.5 text-sm ${full ? "sm:col-span-2" : ""}`}>
      <span className="text-xs font-medium text-muted-foreground">{label}</span>
      {children}
    </label>
  );
}
