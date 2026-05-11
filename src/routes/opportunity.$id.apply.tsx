import { createFileRoute, Link, notFound, useNavigate } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { opportunities, resolveApplyMode, type Opportunity } from "@/data/opportunities";
import { emptyPortfolio, useLocalStorage, type Portfolio } from "@/lib/store";
import {
  ArrowLeft,
  CheckCircle2,
  AlertTriangle,
  Sparkles,
  Send,
  ShieldCheck,
} from "lucide-react";

export const Route = createFileRoute("/opportunity/$id/apply")({
  component: EasyApply,
  loader: ({ params }): Opportunity => {
    const o = opportunities.find((x) => x.id === params.id);
    if (!o) throw notFound();
    return o;
  },
  notFoundComponent: () => (
    <div className="grid min-h-screen place-items-center p-6 text-center">
      <Link to="/discover" className="text-sm text-primary underline">
        Back to discovery
      </Link>
    </div>
  ),
  errorComponent: ({ error }) => (
    <div className="grid min-h-screen place-items-center p-6 text-center">
      <p className="text-sm text-destructive">{error.message}</p>
    </div>
  ),
});

interface SubmittedApp {
  opportunityId: string;
  submittedAt: string;
  motivation: string;
}

function EasyApply() {
  const o = Route.useLoaderData();
  const navigate = useNavigate();
  const [portfolio] = useLocalStorage<Portfolio>("ym:portfolio", emptyPortfolio);
  const [submitted, setSubmitted] = useLocalStorage<SubmittedApp[]>("ym:submissions", []);

  const mode = resolveApplyMode(o);

  const aiDraft = useMemo(() => {
    const name = portfolio.fullName || "I";
    const country = portfolio.country || "my country";
    const motivation = portfolio.motivation?.trim() ||
      `joining ${o.name} would help me grow as a young leader and contribute to my community.`;
    const leadership = portfolio.leadership?.trim() || "leading youth-led initiatives";
    return `My name is ${name}, from ${country}. I am applying to ${o.name} because ${motivation} Through ${leadership}, I have learned to organize people around shared goals, and I am ready to bring that energy to ${o.organizer}.`;
  }, [portfolio, o]);

  const [motivation, setMotivation] = useState(aiDraft);
  const [confirmAccurate, setConfirmAccurate] = useState(false);
  const [confirmReviewed, setConfirmReviewed] = useState(false);
  const [docs, setDocs] = useState<Record<string, boolean>>({});
  const allDocs = o.requiredDocuments.every((d) => docs[d]);
  const canSubmit = confirmAccurate && confirmReviewed && allDocs && motivation.trim().length > 30;

  const alreadySubmitted = submitted.some((s) => s.opportunityId === o.id);

  if (mode !== "easy") {
    return (
      <div className="mx-auto max-w-2xl p-6">
        <div className="rounded-2xl border border-warning/40 bg-warning/10 p-5 text-sm">
          <div className="mb-2 flex items-center gap-2 font-semibold">
            <AlertTriangle className="h-4 w-4 text-warning" /> Easy Apply unavailable
          </div>
          This opportunity is hosted by an external organizer. Please use{" "}
          <Link to="/opportunity/$id" params={{ id: o.id }} className="text-primary underline">
            Assisted Apply
          </Link>{" "}
          and submit on the official website.
        </div>
      </div>
    );
  }

  const handleSubmit = () => {
    if (!canSubmit) return;
    setSubmitted((prev) => [
      { opportunityId: o.id, submittedAt: new Date().toISOString(), motivation },
      ...prev.filter((s) => s.opportunityId !== o.id),
    ]);
    navigate({ to: "/opportunity/$id/apply", params: { id: o.id } });
  };

  if (alreadySubmitted) {
    const sub = submitted.find((s) => s.opportunityId === o.id)!;
    return (
      <div className="mx-auto max-w-2xl p-6 pb-24">
        <Link
          to="/opportunity/$id"
          params={{ id: o.id }}
          className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-3.5 w-3.5" /> Back to opportunity
        </Link>
        <div className="mt-4 rounded-3xl border border-success/40 bg-success/10 p-6 text-center">
          <CheckCircle2 className="mx-auto h-10 w-10 text-success" />
          <h1 className="mt-3 text-2xl font-semibold">Application submitted</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Submitted {new Date(sub.submittedAt).toLocaleDateString()} to {o.organizer}.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl p-4 pb-24 sm:p-6">
      <Link
        to="/opportunity/$id"
        params={{ id: o.id }}
        className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-3.5 w-3.5" /> Back to opportunity
      </Link>

      <div className="mt-3 flex items-center gap-2">
        <span className="inline-flex items-center gap-1 rounded-full bg-primary/15 px-2.5 py-1 text-[11px] font-semibold text-primary">
          <ShieldCheck className="h-3 w-3" /> Verified · Easy Apply
        </span>
      </div>
      <h1 className="mt-2 text-2xl font-semibold tracking-tight">{o.name}</h1>
      <p className="text-sm text-muted-foreground">by {o.organizer}</p>

      <section className="mt-6 rounded-2xl border border-border bg-card p-4">
        <h2 className="text-sm font-semibold">Your details (from portfolio)</h2>
        <div className="mt-3 grid gap-2 text-sm sm:grid-cols-2">
          <Field label="Full name" value={portfolio.fullName} />
          <Field label="Email" value={portfolio.email} />
          <Field label="Country" value={portfolio.country} />
          <Field label="Nationality" value={portfolio.nationality} />
          <Field label="Passport name" value={portfolio.passportFullName} />
          <Field label="Passport number" value={portfolio.passportNumber} />
        </div>
        <Link
          to="/portfolio"
          className="mt-3 inline-block text-xs text-primary underline"
        >
          Edit portfolio
        </Link>
      </section>

      <section className="mt-4 rounded-2xl border border-border bg-card p-4">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold">Motivation answer</h2>
          <span className="inline-flex items-center gap-1 text-[11px] text-muted-foreground">
            <Sparkles className="h-3 w-3" /> AI draft — review & edit
          </span>
        </div>
        <textarea
          value={motivation}
          onChange={(e) => setMotivation(e.target.value)}
          rows={8}
          className="mt-2 w-full rounded-xl border border-border bg-background p-3 text-sm"
        />
        <p className="mt-1 text-[11px] text-muted-foreground">
          {motivation.trim().length} characters
        </p>
      </section>

      <section className="mt-4 rounded-2xl border border-border bg-card p-4">
        <h2 className="text-sm font-semibold">Required documents</h2>
        <ul className="mt-2 space-y-2">
          {o.requiredDocuments.map((d) => (
            <li key={d} className="flex items-start gap-2 text-sm">
              <input
                type="checkbox"
                checked={!!docs[d]}
                onChange={(e) => setDocs((p) => ({ ...p, [d]: e.target.checked }))}
                className="mt-1 h-4 w-4 accent-[color:var(--primary)]"
              />
              <span>I have {d}</span>
            </li>
          ))}
        </ul>
      </section>

      {o.manualSteps && o.manualSteps.length > 0 && (
        <section className="mt-4 rounded-2xl border border-warning/40 bg-warning/10 p-4">
          <h2 className="text-sm font-semibold">Steps you must complete yourself</h2>
          <ul className="mt-2 list-disc space-y-1 pl-5 text-sm">
            {o.manualSteps.map((s) => (
              <li key={s}>{s}</li>
            ))}
          </ul>
          <p className="mt-2 text-[11px] text-muted-foreground">
            YouthMatch does not pay, sign, record videos, or post on your behalf.
          </p>
        </section>
      )}

      <section className="mt-4 rounded-2xl border border-border bg-card p-4 space-y-2">
        <label className="flex items-start gap-2 text-sm">
          <input
            type="checkbox"
            checked={confirmReviewed}
            onChange={(e) => setConfirmReviewed(e.target.checked)}
            className="mt-1 h-4 w-4 accent-[color:var(--primary)]"
          />
          I have reviewed every field and AI-generated answer above.
        </label>
        <label className="flex items-start gap-2 text-sm">
          <input
            type="checkbox"
            checked={confirmAccurate}
            onChange={(e) => setConfirmAccurate(e.target.checked)}
            className="mt-1 h-4 w-4 accent-[color:var(--primary)]"
          />
          I confirm the information is accurate and authorise YouthMatch to submit
          this application to {o.organizer} on my behalf.
        </label>
      </section>

      <button
        onClick={handleSubmit}
        disabled={!canSubmit}
        className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-full bg-[image:var(--gradient-primary)] px-5 py-3 text-sm font-semibold text-primary-foreground shadow-[var(--shadow-glow)] disabled:cursor-not-allowed disabled:opacity-50"
      >
        <Send className="h-4 w-4" /> Submit application
      </button>
      {!canSubmit && (
        <p className="mt-2 text-center text-[11px] text-muted-foreground">
          Tick every box, write a motivation (30+ chars), and confirm review to enable submit.
        </p>
      )}
    </div>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl bg-secondary px-3 py-2">
      <div className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
        {label}
      </div>
      <div className="mt-0.5 text-sm font-medium">
        {value || <span className="text-muted-foreground">— missing —</span>}
      </div>
    </div>
  );
}
