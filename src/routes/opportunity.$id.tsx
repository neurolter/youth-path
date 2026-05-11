import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { opportunities, resolveApplyMode, type Opportunity } from "@/data/opportunities";
import { useLocalStorage } from "@/lib/store";
import {
  ArrowLeft,
  ShieldCheck,
  MapPin,
  Calendar,
  Clock,
  GraduationCap,
  Globe2,
  CheckCircle2,
  ExternalLink,
  Heart,
  Sparkles,
  AlertTriangle,
  FileEdit,
  CreditCard,
} from "lucide-react";

export const Route = createFileRoute("/opportunity/$id")({
  component: Details,
  notFoundComponent: () => (
    <div className="grid min-h-screen place-items-center bg-background p-6 text-center">
      <div>
        <h1 className="text-xl font-semibold">Opportunity not found</h1>
        <Link to="/discover" className="mt-3 inline-block text-sm text-primary underline">
          Back to discovery
        </Link>
      </div>
    </div>
  ),
  errorComponent: ({ error }) => (
    <div className="grid min-h-screen place-items-center bg-background p-6 text-center">
      <p className="text-sm text-destructive">{error.message}</p>
    </div>
  ),
  loader: ({ params }): Opportunity => {
    const o = opportunities.find((x) => x.id === params.id);
    if (!o) throw notFound();
    return o;
  },
});

function daysUntil(iso: string) {
  return Math.max(0, Math.ceil((new Date(iso).getTime() - Date.now()) / 86400000));
}

function Details() {
  const o = Route.useLoaderData();
  const [saved, setSaved] = useLocalStorage<string[]>("ym:saved", []);
  const isSaved = saved.includes(o.id);
  const days = daysUntil(o.deadline);

  const toggleSave = () =>
    setSaved((s) => (s.includes(o.id) ? s.filter((id) => id !== o.id) : [o.id, ...s]));

  return (
    <div className="min-h-screen bg-background pb-20">
      <div className={`relative bg-gradient-to-br ${o.cover} px-5 pb-12 pt-5 text-white`}>
        <Link
          to="/discover"
          className="inline-flex items-center gap-1.5 rounded-full bg-white/20 px-3 py-1.5 text-xs font-medium backdrop-blur"
        >
          <ArrowLeft className="h-3.5 w-3.5" /> Back
        </Link>
        <div className="mx-auto mt-6 max-w-2xl">
          <div className="flex flex-wrap items-center gap-2">
            {o.verified && (
              <span className="inline-flex items-center gap-1 rounded-full bg-white/25 px-2.5 py-1 text-[11px] font-semibold backdrop-blur">
                <ShieldCheck className="h-3 w-3" /> Verified organizer
              </span>
            )}
            <span className="rounded-full bg-black/30 px-2.5 py-1 text-[11px] font-semibold backdrop-blur">
              {o.type}
            </span>
            <span className="rounded-full bg-black/30 px-2.5 py-1 text-[11px] font-semibold backdrop-blur capitalize">
              {o.funding.replace("-", " ")}
            </span>
          </div>
          <h1 className="mt-4 text-3xl font-semibold leading-tight md:text-4xl">{o.name}</h1>
          <p className="mt-1.5 text-sm text-white/85">by {o.organizer}</p>
        </div>
      </div>

      <div className="mx-auto -mt-8 max-w-2xl px-4">
        <div className="rounded-3xl border border-border bg-card p-5 shadow-[var(--shadow-card)]">
          <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
            <Stat icon={MapPin} label="Location" value={`${o.city}, ${o.country}`} />
            <Stat icon={Calendar} label="Dates" value={o.dates} />
            <Stat
              icon={Clock}
              label="Deadline"
              value={days === 0 ? "Today" : `${days} days`}
              highlight={days <= 14}
            />
            <Stat icon={GraduationCap} label="Ages" value={`${o.minAge}–${o.maxAge}`} />
          </div>

          <div className="mt-5 flex flex-wrap gap-2">
            <a
              href={o.applicationLink}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1.5 rounded-full bg-[image:var(--gradient-primary)] px-4 py-2 text-sm font-semibold text-primary-foreground shadow-[var(--shadow-glow)] hover:-translate-y-0.5"
            >
              Apply now <ExternalLink className="h-3.5 w-3.5" />
            </a>
            <button
              onClick={toggleSave}
              className={`inline-flex items-center gap-1.5 rounded-full border px-4 py-2 text-sm font-medium transition-colors ${
                isSaved
                  ? "border-transparent bg-primary/10 text-primary"
                  : "border-border bg-card hover:bg-secondary"
              }`}
            >
              <Heart className={`h-4 w-4 ${isSaved ? "fill-current" : ""}`} />
              {isSaved ? "Saved" : "Save"}
            </button>
            <Link
              to="/assistant"
              className="inline-flex items-center gap-1.5 rounded-full border border-border bg-card px-4 py-2 text-sm font-medium hover:bg-secondary"
            >
              <Sparkles className="h-4 w-4" /> Draft my answers
            </Link>
          </div>
        </div>

        <Section title="About">
          <p className="text-sm leading-relaxed text-foreground/85">{o.description}</p>
        </Section>

        <Section title="What you get">
          <ul className="grid gap-2 md:grid-cols-2">
            {o.benefits.map((b: string) => (
              <li
                key={b}
                className="flex items-start gap-2 rounded-xl bg-secondary px-3 py-2 text-sm"
              >
                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-success" /> {b}
              </li>
            ))}
          </ul>
        </Section>

        <Section title="Required documents & actions">
          <ul className="space-y-2">
            {o.requiredDocuments.map((d: string) => (
              <li
                key={d}
                className="flex items-start gap-2 rounded-xl border border-border bg-card px-3 py-2 text-sm"
              >
                <input
                  type="checkbox"
                  className="mt-1 h-4 w-4 accent-[color:var(--primary)]"
                />
                {d}
              </li>
            ))}
          </ul>
        </Section>

        <Section title="Details">
          <div className="grid gap-2 text-sm md:grid-cols-2">
            <KV k="Region" v={o.region} icon={Globe2} />
            <KV k="Format" v={o.format} icon={MapPin} />
            <KV k="Industry" v={o.industry} icon={GraduationCap} />
            <KV k="Language" v={o.language} icon={Globe2} />
          </div>
        </Section>

        <div className="mt-6 flex gap-2 rounded-2xl border border-warning/40 bg-warning/10 p-4 text-xs leading-relaxed text-foreground/80">
          <AlertTriangle className="h-4 w-4 shrink-0 text-warning" />
          YouthMatch helps you prepare application materials. You are responsible
          for reviewing, editing, confirming accuracy, completing external
          requirements (payments, videos, recommendations), and submitting your
          final application.
        </div>
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mt-6">
      <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
        {title}
      </h2>
      {children}
    </section>
  );
}

function Stat({
  icon: Icon,
  label,
  value,
  highlight,
}: {
  icon: React.ElementType;
  label: string;
  value: string;
  highlight?: boolean;
}) {
  return (
    <div
      className={`rounded-xl px-3 py-2 ${
        highlight ? "bg-warning/15" : "bg-secondary"
      }`}
    >
      <div className="flex items-center gap-1.5 text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
        <Icon className="h-3 w-3" /> {label}
      </div>
      <div className="mt-1 text-sm font-semibold">{value}</div>
    </div>
  );
}

function KV({ k, v, icon: Icon }: { k: string; v: string; icon: React.ElementType }) {
  return (
    <div className="flex items-center gap-2 rounded-xl bg-secondary px-3 py-2">
      <Icon className="h-4 w-4 text-muted-foreground" />
      <span className="text-xs text-muted-foreground">{k}:</span>
      <span className="text-xs font-medium capitalize">{v}</span>
    </div>
  );
}
