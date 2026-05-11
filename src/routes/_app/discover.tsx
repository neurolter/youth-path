import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { opportunities, REGIONS, FUNDING, TYPES, type Opportunity } from "@/data/opportunities";
import { useLocalStorage } from "@/lib/store";
import {
  Heart,
  X,
  Eye,
  ShieldCheck,
  MapPin,
  Calendar,
  GraduationCap,
  Sparkles,
  Filter,
  Clock,
} from "lucide-react";

export const Route = createFileRoute("/_app/discover")({
  component: Discover,
});

function daysUntil(iso: string) {
  const ms = new Date(iso).getTime() - Date.now();
  return Math.max(0, Math.ceil(ms / (1000 * 60 * 60 * 24)));
}

function fundingLabel(f: Opportunity["funding"]) {
  return { free: "Free", paid: "Paid", partial: "Partially funded", "fully-funded": "Fully funded" }[f];
}

function Discover() {
  const [saved, setSaved] = useLocalStorage<string[]>("ym:saved", []);
  const [skipped, setSkipped] = useLocalStorage<string[]>("ym:skipped", []);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [region, setRegion] = useState("All");
  const [funding, setFunding] = useState<string>("all");
  const [type, setType] = useState("All");
  const [deadlineSoon, setDeadlineSoon] = useState(false);

  const queue = useMemo(() => {
    return opportunities.filter((o) => {
      if (saved.includes(o.id) || skipped.includes(o.id)) return false;
      if (region !== "All" && o.region !== region) return false;
      if (funding !== "all" && o.funding !== funding) return false;
      if (type !== "All" && o.type !== type) return false;
      if (deadlineSoon && daysUntil(o.deadline) > 30) return false;
      return true;
    });
  }, [saved, skipped, region, funding, type, deadlineSoon]);

  const top = queue[0];

  const handleSave = () => top && setSaved((s) => [top.id, ...s]);
  const handleSkip = () => top && setSkipped((s) => [top.id, ...s]);
  const reset = () => {
    setSaved([]);
    setSkipped([]);
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Discover</h1>
          <p className="text-sm text-muted-foreground">
            {queue.length} opportunit{queue.length === 1 ? "y" : "ies"} waiting
          </p>
        </div>
        <button
          onClick={() => setFiltersOpen((v) => !v)}
          className="inline-flex items-center gap-1.5 rounded-full border border-border bg-card px-3 py-2 text-xs font-medium hover:bg-secondary"
        >
          <Filter className="h-3.5 w-3.5" /> Filters
        </button>
      </div>

      {filtersOpen && (
        <div className="space-y-3 rounded-2xl border border-border bg-card p-4 shadow-[var(--shadow-soft)]">
          <FilterRow label="Region" options={REGIONS} value={region} onChange={setRegion} />
          <FilterRow
            label="Funding"
            options={FUNDING.map((f) => f.label)}
            valueLabels={FUNDING.map((f) => f.label)}
            value={FUNDING.find((f) => f.value === funding)?.label ?? "All funding"}
            onChange={(label) =>
              setFunding(FUNDING.find((f) => f.label === label)?.value ?? "all")
            }
          />
          <FilterRow label="Type" options={TYPES} value={type} onChange={setType} />
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={deadlineSoon}
              onChange={(e) => setDeadlineSoon(e.target.checked)}
              className="h-4 w-4 accent-[color:var(--primary)]"
            />
            <Clock className="h-4 w-4 text-muted-foreground" /> Deadline within 30 days
          </label>
        </div>
      )}

      <div className="relative h-[min(72vh,560px)] min-h-[460px]">
        {queue.slice(0, 3).reverse().map((o, i, arr) => {
          const depth = arr.length - 1 - i;
          const isTop = depth === 0;
          return (
            <div
              key={o.id}
              className="absolute inset-0 origin-top transition-all"
              style={{
                transform: `translateY(${depth * 12}px) scale(${1 - depth * 0.04})`,
                zIndex: 10 - depth,
                opacity: depth === 2 ? 0.6 : 1,
              }}
            >
              <SwipeCard opportunity={o} interactive={isTop} />
            </div>
          );
        })}

        {!top && (
          <div className="grid h-full place-items-center rounded-3xl border border-dashed border-border bg-card p-8 text-center">
            <div>
              <Sparkles className="mx-auto h-8 w-8 text-muted-foreground" />
              <h3 className="mt-3 text-lg font-semibold">You're all caught up!</h3>
              <p className="mt-1 text-sm text-muted-foreground">
                Adjust your filters or reset to swipe through opportunities again.
              </p>
              <button
                onClick={reset}
                className="mt-4 rounded-full bg-foreground px-4 py-2 text-sm font-medium text-background"
              >
                Reset queue
              </button>
            </div>
          </div>
        )}
      </div>

      {top && (
        <div className="flex flex-col items-center gap-2">
          <div className="flex items-center justify-center gap-4">
            <ActionBtn onClick={handleSkip} variant="muted" label="Not for me">
              <X className="h-6 w-6" />
            </ActionBtn>
            <Link
              to="/opportunity/$id"
              params={{ id: top.id }}
              className="grid h-12 w-12 place-items-center rounded-full border border-border bg-card text-foreground shadow-[var(--shadow-soft)] transition-transform hover:-translate-y-0.5"
              aria-label="View details"
            >
              <Eye className="h-5 w-5" />
            </Link>
            <ActionBtn onClick={handleSave} variant="primary" label="Interested">
              <Heart className="h-7 w-7 fill-current" />
            </ActionBtn>
          </div>
          <p className="text-center text-[11px] text-muted-foreground">
            Swiping right saves the opportunity. Open it to apply.
          </p>
        </div>
      )}
    </div>
  );
}

function FilterRow({
  label,
  options,
  value,
  onChange,
}: {
  label: string;
  options: string[];
  valueLabels?: string[];
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

function ActionBtn({
  children,
  onClick,
  variant,
  label,
}: {
  children: React.ReactNode;
  onClick: () => void;
  variant: "muted" | "primary";
  label: string;
}) {
  const cls =
    variant === "primary"
      ? "h-16 w-16 bg-[image:var(--gradient-primary)] text-primary-foreground shadow-[var(--shadow-glow)]"
      : "h-12 w-12 bg-card text-muted-foreground border border-border shadow-[var(--shadow-soft)]";
  return (
    <button
      onClick={onClick}
      aria-label={label}
      className={`grid place-items-center rounded-full transition-transform hover:-translate-y-0.5 active:scale-95 ${cls}`}
    >
      {children}
    </button>
  );
}

export function SwipeCard({
  opportunity,
  interactive = true,
}: {
  opportunity: Opportunity;
  interactive?: boolean;
}) {
  const days = daysUntil(opportunity.deadline);
  return (
    <div
      className={`flex h-full w-full flex-col overflow-hidden rounded-3xl bg-card shadow-[var(--shadow-card)] ${
        interactive ? "" : "pointer-events-none"
      }`}
    >
      <div
        className={`relative h-44 sm:h-56 bg-gradient-to-br ${opportunity.cover} p-4 sm:p-5 text-white`}
      >
        <div className="flex items-center justify-between">
          {opportunity.verified && (
            <span className="inline-flex items-center gap-1 rounded-full bg-white/25 px-2.5 py-1 text-[11px] font-semibold backdrop-blur">
              <ShieldCheck className="h-3 w-3" /> Verified
            </span>
          )}
          <span className="rounded-full bg-black/30 px-2.5 py-1 text-[11px] font-semibold backdrop-blur">
            {fundingLabel(opportunity.funding)}
          </span>
        </div>
        <div className="absolute bottom-5 left-5 right-5">
          <p className="text-xs font-medium uppercase tracking-wide opacity-90">
            {opportunity.type} · {opportunity.industry}
          </p>
          <h2 className="mt-1 text-xl sm:text-2xl font-semibold leading-tight drop-shadow-sm line-clamp-2">
            {opportunity.name}
          </h2>
        </div>
      </div>

      <div className="flex flex-1 flex-col gap-4 p-5">
        <p className="text-sm text-foreground/80">{opportunity.shortDescription}</p>

        <div className="grid grid-cols-2 gap-3 text-sm">
          <Info icon={MapPin} label={`${opportunity.city}, ${opportunity.country}`} />
          <Info icon={Calendar} label={opportunity.dates} />
          <Info
            icon={GraduationCap}
            label={`Ages ${opportunity.minAge}–${opportunity.maxAge}`}
          />
          <Info
            icon={Clock}
            label={days === 0 ? "Closes today" : `${days}d to deadline`}
            highlight={days <= 14}
          />
        </div>

        <div className="flex flex-wrap gap-1.5">
          {opportunity.tags.map((t) => (
            <span
              key={t}
              className="rounded-full bg-secondary px-2.5 py-1 text-[11px] font-medium text-secondary-foreground"
            >
              {t}
            </span>
          ))}
        </div>

        <div className="mt-auto flex items-center justify-between border-t border-border pt-3 text-xs text-muted-foreground">
          <span>by {opportunity.organizer}</span>
          <span>{opportunity.format}</span>
        </div>
      </div>
    </div>
  );
}

function Info({
  icon: Icon,
  label,
  highlight,
}: {
  icon: React.ElementType;
  label: string;
  highlight?: boolean;
}) {
  return (
    <div
      className={`flex items-center gap-2 rounded-xl px-3 py-2 ${
        highlight ? "bg-warning/15 text-warning-foreground" : "bg-secondary text-foreground"
      }`}
    >
      <Icon className="h-4 w-4 shrink-0 opacity-70" />
      <span className="truncate text-xs font-medium">{label}</span>
    </div>
  );
}
