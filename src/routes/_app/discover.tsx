import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  allOpportunitiesData,
  REGIONS,
  COUNTRIES,
  FUNDING,
  TYPES,
  FORMATS,
  LANGUAGES,
  AREAS,
  type Opportunity,
} from "@/data/opportunities";
import { useLocalStorage } from "@/lib/store";
import { getPublicOrgOpportunities, orgStore } from "@/lib/organizer";
import { getAutoPublishedOpportunities, isExpired } from "@/lib/sources";
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
  Search,
  LayoutGrid,
  Layers,
  Gauge,
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

const PAGE_SIZE = 18;

function Discover() {
  const [saved, setSaved] = useLocalStorage<string[]>("ym:saved", []);
  const [skipped, setSkipped] = useLocalStorage<string[]>("ym:skipped", []);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [mode, setMode] = useState<"feed" | "swipe">("feed");

  const [search, setSearch] = useState("");
  const [region, setRegion] = useState("All");
  const [country, setCountry] = useState("All");
  const [funding, setFunding] = useState<string>("all");
  const [type, setType] = useState("All");
  const [language, setLanguage] = useState("All");
  const [area, setArea] = useState("All");
  const [format, setFormat] = useState<string>("all");
  const [deadlineSoon, setDeadlineSoon] = useState(false);
  const [age, setAge] = useState<string>("");
  const [minTrust, setMinTrust] = useState<number>(0);

  // Merge static seed + crawler-imported + organizer-published. Replace
  // later with backend fetch (Cloud / Supabase). Shape is stable.
  const allOpportunities = useMemo(() => {
    const fromClient =
      typeof window === "undefined"
        ? []
        : [...getAutoPublishedOpportunities(), ...getPublicOrgOpportunities()];
    const merged = [...fromClient, ...allOpportunitiesData];
    // De-dupe by id, prefer first occurrence (client-side overrides).
    const seen = new Set<string>();
    const out: Opportunity[] = [];
    for (const o of merged) {
      if (seen.has(o.id)) continue;
      seen.add(o.id);
      if (!isExpired(o.deadline)) out.push(o);
    }
    return out;
  }, []);

  const totalAvailable = allOpportunities.length;

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    const ageNum = age ? parseInt(age, 10) : NaN;
    return allOpportunities.filter((o) => {
      if (region !== "All" && o.region !== region) return false;
      if (country !== "All" && o.country !== country) return false;
      if (funding !== "all" && o.funding !== funding) return false;
      if (type !== "All" && o.type !== type) return false;
      if (language !== "All" && o.language !== language) return false;
      if (area !== "All" && o.industry !== area) return false;
      if (format !== "all" && o.format !== format) return false;
      if (deadlineSoon && daysUntil(o.deadline) > 30) return false;
      if (!isNaN(ageNum) && (ageNum < o.minAge || ageNum > o.maxAge)) return false;
      if (minTrust > 0 && (o.trustScore ?? 100) < minTrust) return false;
      if (q) {
        const hay = `${o.name} ${o.organizer} ${o.industry} ${o.country} ${o.city} ${o.tags.join(" ")}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [allOpportunities, search, region, country, funding, type, language, area, format, deadlineSoon, age, minTrust]);

  // Feed (filtered) shows everything matching — pagination ignores save/skip
  // so the user can browse the whole catalogue.
  const swipeQueue = useMemo(
    () => filtered.filter((o) => !saved.includes(o.id) && !skipped.includes(o.id)),
    [filtered, saved, skipped],
  );

  const top = swipeQueue[0];

  const handleSave = (o: Opportunity) => {
    setSaved((s) => (s.includes(o.id) ? s : [o.id, ...s]));
    if (o.id.startsWith("org_")) {
      const evId = o.id.slice(4);
      const all = orgStore.events();
      orgStore.setEvents(all.map((e) => (e.id === evId ? { ...e, saves: e.saves + 1 } : e)));
    }
  };
  const handleSkip = (o: Opportunity) => setSkipped((s) => (s.includes(o.id) ? s : [o.id, ...s]));
  const resetQueue = () => {
    setSaved([]);
    setSkipped([]);
  };

  const clearFilters = () => {
    setSearch("");
    setRegion("All");
    setCountry("All");
    setFunding("all");
    setType("All");
    setLanguage("All");
    setArea("All");
    setFormat("all");
    setDeadlineSoon(false);
    setAge("");
    setMinTrust(0);
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Discover</h1>
          <p className="text-sm text-muted-foreground">
            {filtered.length} of {totalAvailable} opportunities
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="inline-flex rounded-full border border-border bg-card p-0.5 text-xs">
            <button
              onClick={() => setMode("feed")}
              className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 ${
                mode === "feed" ? "bg-foreground text-background" : "text-muted-foreground"
              }`}
            >
              <LayoutGrid className="h-3.5 w-3.5" /> Feed
            </button>
            <button
              onClick={() => setMode("swipe")}
              className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 ${
                mode === "swipe" ? "bg-foreground text-background" : "text-muted-foreground"
              }`}
            >
              <Layers className="h-3.5 w-3.5" /> Swipe
            </button>
          </div>
          <button
            onClick={() => setFiltersOpen((v) => !v)}
            className="inline-flex items-center gap-1.5 rounded-full border border-border bg-card px-3 py-2 text-xs font-medium hover:bg-secondary"
          >
            <Filter className="h-3.5 w-3.5" /> Filters
          </button>
        </div>
      </div>

      <div className="relative">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search opportunities, organizers, countries…"
          className="w-full rounded-full border border-border bg-card py-2.5 pl-9 pr-3 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
        />
      </div>

      {filtersOpen && (
        <div className="space-y-3 rounded-2xl border border-border bg-card p-4 shadow-[var(--shadow-soft)]">
          <FilterRow label="Region" options={REGIONS} value={region} onChange={setRegion} />
          <FilterRow label="Country" options={COUNTRIES} value={country} onChange={setCountry} scroll />
          <FilterRow label="Sphere / Industry" options={AREAS} value={area} onChange={setArea} scroll />
          <FilterRow label="Event type" options={TYPES} value={type} onChange={setType} scroll />
          <FilterRow label="Language" options={LANGUAGES} value={language} onChange={setLanguage} scroll />
          <FilterRow
            label="Funding"
            options={FUNDING.map((f) => f.label)}
            value={FUNDING.find((f) => f.value === funding)?.label ?? "All funding"}
            onChange={(label) =>
              setFunding(FUNDING.find((f) => f.label === label)?.value ?? "all")
            }
          />
          <FilterRow
            label="Format"
            options={FORMATS.map((f) => f.label)}
            value={FORMATS.find((f) => f.value === format)?.label ?? "Any format"}
            onChange={(label) =>
              setFormat(FORMATS.find((f) => f.label === label)?.value ?? "all")
            }
          />
          <div className="flex flex-wrap items-end gap-4">
            <div>
              <p className="mb-1.5 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Eligibility (your age)
              </p>
              <input
                type="number"
                min={10}
                max={60}
                value={age}
                onChange={(e) => setAge(e.target.value)}
                placeholder="e.g. 22"
                className="w-28 rounded-full border border-border bg-background px-3 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-ring"
              />
            </div>
            <div className="flex-1 min-w-[180px]">
              <p className="mb-1.5 flex items-center gap-1 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                <Gauge className="h-3 w-3" /> Min trust score: {minTrust}
              </p>
              <input
                type="range"
                min={0}
                max={100}
                step={5}
                value={minTrust}
                onChange={(e) => setMinTrust(parseInt(e.target.value, 10))}
                className="w-full accent-[color:var(--primary)]"
              />
            </div>
          </div>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={deadlineSoon}
              onChange={(e) => setDeadlineSoon(e.target.checked)}
              className="h-4 w-4 accent-[color:var(--primary)]"
            />
            <Clock className="h-4 w-4 text-muted-foreground" /> Deadline within 30 days
          </label>
          <div className="flex justify-end pt-1">
            <button
              onClick={clearFilters}
              className="rounded-full border border-border bg-secondary px-3 py-1 text-xs font-medium text-secondary-foreground hover:bg-muted"
            >
              Clear filters
            </button>
          </div>
        </div>
      )}

      {mode === "feed" ? (
        <FeedView
          items={filtered}
          totalAvailable={totalAvailable}
          saved={saved}
          onSave={handleSave}
          onClearFilters={clearFilters}
        />
      ) : (
        <SwipeView
          queue={swipeQueue}
          top={top}
          onSave={() => top && handleSave(top)}
          onSkip={() => top && handleSkip(top)}
          onReset={resetQueue}
        />
      )}
    </div>
  );
}

// ---------- FEED ----------

function FeedView({
  items,
  totalAvailable,
  saved,
  onSave,
  onClearFilters,
}: {
  items: Opportunity[];
  totalAvailable: number;
  saved: string[];
  onSave: (o: Opportunity) => void;
  onClearFilters: () => void;
}) {
  const [visible, setVisible] = useState(PAGE_SIZE);
  useEffect(() => {
    setVisible(PAGE_SIZE);
  }, [items]);

  const sentinelRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (visible >= items.length) return;
    const el = sentinelRef.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          setVisible((v) => Math.min(items.length, v + PAGE_SIZE));
        }
      },
      { rootMargin: "400px" },
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [visible, items.length]);

  if (items.length === 0) {
    return (
      <EmptyState
        title={totalAvailable === 0 ? "No opportunities available right now" : "No matches"}
        subtitle={
          totalAvailable === 0
            ? "Check back soon — new opportunities are imported daily."
            : "Try adjusting your filters or search terms."
        }
        action={
          totalAvailable === 0 ? undefined : (
            <button
              onClick={onClearFilters}
              className="mt-4 rounded-full bg-foreground px-4 py-2 text-sm font-medium text-background"
            >
              Clear filters
            </button>
          )
        }
      />
    );
  }

  return (
    <div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {items.slice(0, visible).map((o) => (
          <FeedCard
            key={o.id}
            opportunity={o}
            saved={saved.includes(o.id)}
            onSave={() => onSave(o)}
          />
        ))}
      </div>
      {visible < items.length && (
        <div ref={sentinelRef} className="grid place-items-center py-6 text-xs text-muted-foreground">
          Loading more…
        </div>
      )}
      {visible >= items.length && items.length > PAGE_SIZE && (
        <p className="py-6 text-center text-xs text-muted-foreground">
          You've reached the end of {items.length} results.
        </p>
      )}
    </div>
  );
}

function FeedCard({
  opportunity,
  saved,
  onSave,
}: {
  opportunity: Opportunity;
  saved: boolean;
  onSave: () => void;
}) {
  const days = daysUntil(opportunity.deadline);
  return (
    <div className="flex flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-[var(--shadow-soft)] transition-transform hover:-translate-y-0.5">
      <Link to="/opportunity/$id" params={{ id: opportunity.id }} className="block">
        <div className={`relative h-28 bg-gradient-to-br ${opportunity.cover} p-3 text-white`}>
          <div className="flex items-center justify-between">
            {opportunity.verified ? (
              <span className="inline-flex items-center gap-1 rounded-full bg-white/25 px-2 py-0.5 text-[10px] font-semibold backdrop-blur">
                <ShieldCheck className="h-3 w-3" /> Verified
              </span>
            ) : (
              <span />
            )}
            <span className="rounded-full bg-black/30 px-2 py-0.5 text-[10px] font-semibold backdrop-blur">
              {fundingLabel(opportunity.funding)}
            </span>
          </div>
        </div>
      </Link>
      <div className="flex flex-1 flex-col gap-2 p-4">
        <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
          {opportunity.type} · {opportunity.industry}
        </p>
        <Link
          to="/opportunity/$id"
          params={{ id: opportunity.id }}
          className="line-clamp-2 text-sm font-semibold leading-snug hover:underline"
        >
          {opportunity.name}
        </Link>
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-muted-foreground">
          <span className="inline-flex items-center gap-1">
            <MapPin className="h-3 w-3" />
            {opportunity.city}, {opportunity.country}
          </span>
          <span className="inline-flex items-center gap-1">
            <Clock className="h-3 w-3" />
            {days === 0 ? "Closes today" : `${days}d left`}
          </span>
        </div>
        <div className="mt-auto flex items-center justify-between pt-2">
          <span className="rounded-full bg-secondary px-2 py-0.5 text-[10px] font-medium text-secondary-foreground">
            {opportunity.region}
          </span>
          <div className="flex items-center gap-1">
            {opportunity.trustScore != null && (
              <span className="rounded-full border border-border px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
                Trust {opportunity.trustScore}
              </span>
            )}
            <button
              onClick={onSave}
              aria-label={saved ? "Saved" : "Save"}
              className={`grid h-7 w-7 place-items-center rounded-full transition-colors ${
                saved
                  ? "bg-[image:var(--gradient-primary)] text-primary-foreground"
                  : "bg-secondary text-muted-foreground hover:bg-muted"
              }`}
            >
              <Heart className={`h-3.5 w-3.5 ${saved ? "fill-current" : ""}`} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ---------- SWIPE ----------

function SwipeView({
  queue,
  top,
  onSave,
  onSkip,
  onReset,
}: {
  queue: Opportunity[];
  top: Opportunity | undefined;
  onSave: () => void;
  onSkip: () => void;
  onReset: () => void;
}) {
  return (
    <>
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
          <EmptyState
            title="You're all caught up!"
            subtitle="Adjust your filters or reset to swipe through opportunities again."
            action={
              <button
                onClick={onReset}
                className="mt-4 rounded-full bg-foreground px-4 py-2 text-sm font-medium text-background"
              >
                Reset queue
              </button>
            }
          />
        )}
      </div>
      {top && (
        <div className="flex flex-col items-center gap-2">
          <div className="flex items-center justify-center gap-4">
            <ActionBtn onClick={onSkip} variant="muted" label="Not for me">
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
            <ActionBtn onClick={onSave} variant="primary" label="Interested">
              <Heart className="h-7 w-7 fill-current" />
            </ActionBtn>
          </div>
          <p className="text-center text-[11px] text-muted-foreground">
            Swiping right saves the opportunity. Open it to apply.
          </p>
        </div>
      )}
    </>
  );
}

// ---------- UI helpers ----------

function EmptyState({
  title,
  subtitle,
  action,
}: {
  title: string;
  subtitle: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="grid place-items-center rounded-3xl border border-dashed border-border bg-card p-10 text-center">
      <div>
        <Sparkles className="mx-auto h-8 w-8 text-muted-foreground" />
        <h3 className="mt-3 text-lg font-semibold">{title}</h3>
        <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p>
        {action}
      </div>
    </div>
  );
}

function FilterRow({
  label,
  options,
  value,
  onChange,
  scroll,
}: {
  label: string;
  options: string[];
  value: string;
  onChange: (v: string) => void;
  scroll?: boolean;
}) {
  return (
    <div>
      <p className="mb-1.5 text-xs font-medium uppercase tracking-wide text-muted-foreground">
        {label}
      </p>
      <div
        className={`flex flex-wrap gap-1.5 ${scroll ? "max-h-24 overflow-y-auto" : ""}`}
      >
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
          <Info icon={GraduationCap} label={`Ages ${opportunity.minAge}–${opportunity.maxAge}`} />
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
