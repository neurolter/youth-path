import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { orgStore, type Organizer, type OrgEvent } from "@/lib/organizer";
import {
  sourcesStore,
  simulateDailyImport,
  approveImport,
  rejectImport,
  type Source,
  type SourceType,
  type CredibilityTier,
  type SourceStatus,
} from "@/lib/sources";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  CheckCircle2,
  XCircle,
  ShieldCheck,
  ArrowLeft,
  RefreshCw,
  Trash2,
  PauseCircle,
  PlayCircle,
  Plus,
} from "lucide-react";

export const Route = createFileRoute("/admin")({
  component: AdminPage,
});

function AdminPage() {
  const [hydrated, setHydrated] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [tick, setTick] = useState(0);
  const refresh = () => setTick((t) => t + 1);

  useEffect(() => {
    setIsAdmin(orgStore.isAdmin());
    sourcesStore.ensureSeeded();
    setHydrated(true);
  }, []);

  if (!hydrated) return null;

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-background p-6">
        <div className="mx-auto max-w-md rounded-2xl border border-border bg-card p-6 text-center">
          <ShieldCheck className="mx-auto h-8 w-8 text-primary" />
          <h1 className="mt-2 text-lg font-semibold">Admin access</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Demo mode — enable admin to review organizers, events, and the import engine.
          </p>
          <button
            onClick={() => {
              orgStore.setIsAdmin(true);
              setIsAdmin(true);
            }}
            className="mt-4 rounded-full bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground"
          >
            Enable admin mode
          </button>
          <Link to="/" className="mt-3 block text-xs text-muted-foreground hover:text-foreground">
            Back home
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border/60 bg-background/80 px-5 py-3 backdrop-blur-xl">
        <div className="mx-auto flex max-w-6xl items-center justify-between">
          <Link to="/discover" className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground">
            <ArrowLeft className="h-3.5 w-3.5" /> Back to app
          </Link>
          <h1 className="text-lg font-semibold">Admin</h1>
          <button
            onClick={() => {
              orgStore.setIsAdmin(false);
              setIsAdmin(false);
            }}
            className="text-xs text-muted-foreground hover:text-destructive"
          >
            Exit admin
          </button>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-6">
        <Tabs defaultValue="review" className="w-full">
          <TabsList className="flex w-full flex-wrap gap-1">
            <TabsTrigger value="review">Review</TabsTrigger>
            <TabsTrigger value="sources">Sources</TabsTrigger>
            <TabsTrigger value="imported">Auto-imported</TabsTrigger>
            <TabsTrigger value="published">Auto-published</TabsTrigger>
            <TabsTrigger value="pending">Pending</TabsTrigger>
            <TabsTrigger value="rejected">Rejected</TabsTrigger>
            <TabsTrigger value="logs">Logs</TabsTrigger>
          </TabsList>

          <TabsContent value="review" className="mt-4">
            <OrganizerReview refresh={refresh} />
          </TabsContent>
          <TabsContent value="sources" className="mt-4">
            <SourcesPanel refresh={refresh} key={`s-${tick}`} />
          </TabsContent>
          <TabsContent value="imported" className="mt-4">
            <ImportsList filter="all" refresh={refresh} key={`i-${tick}`} />
          </TabsContent>
          <TabsContent value="published" className="mt-4">
            <ImportsList filter="auto-published" refresh={refresh} key={`p-${tick}`} />
          </TabsContent>
          <TabsContent value="pending" className="mt-4">
            <ImportsList filter="pending-review" refresh={refresh} key={`pe-${tick}`} />
          </TabsContent>
          <TabsContent value="rejected" className="mt-4">
            <ImportsList filter="rejected" refresh={refresh} key={`r-${tick}`} />
          </TabsContent>
          <TabsContent value="logs" className="mt-4">
            <LogsPanel key={`l-${tick}`} />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}

// ---------- Organizer & event review ----------

function OrganizerReview({ refresh }: { refresh: () => void }) {
  const organizers = orgStore.organizers();
  const events = orgStore.events();

  const setOrg = (id: string, patch: Partial<Organizer>) => {
    orgStore.setOrganizers(organizers.map((o) => (o.id === id ? { ...o, ...patch } : o)));
    refresh();
  };
  const setEvent = (id: string, patch: Partial<OrgEvent>) => {
    orgStore.setEvents(events.map((e) => (e.id === id ? { ...e, ...patch } : e)));
    refresh();
  };

  const pendingOrgs = organizers.filter((o) => o.status === "pending");
  const pendingEvents = events.filter((e) => e.status === "pending");

  return (
    <div className="space-y-8">
      <section>
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
          Pending organizers ({pendingOrgs.length})
        </h2>
        {pendingOrgs.length === 0 ? (
          <p className="text-sm text-muted-foreground">No organizers awaiting review.</p>
        ) : (
          <ul className="space-y-3">
            {pendingOrgs.map((o) => (
              <li key={o.id} className="rounded-2xl border border-border bg-card p-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="text-sm">
                    <div className="font-semibold">
                      {o.orgName}{" "}
                      <span className="ml-1 text-xs font-normal text-muted-foreground">
                        ({o.orgType})
                      </span>
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {o.contactPerson} · {o.officialEmail} · {o.country}
                    </div>
                    {o.website && (
                      <a href={o.website} target="_blank" rel="noreferrer" className="text-xs text-primary underline">
                        {o.website}
                      </a>
                    )}
                    {o.proof && <p className="mt-2 text-xs">Proof: {o.proof}</p>}
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setOrg(o.id, { status: "approved" })}
                      className="inline-flex items-center gap-1 rounded-full bg-success px-3 py-1.5 text-xs font-semibold text-success-foreground"
                    >
                      <CheckCircle2 className="h-3.5 w-3.5" /> Approve
                    </button>
                    <button
                      onClick={() => {
                        const reason = prompt("Reason for rejection?") || "";
                        setOrg(o.id, { status: "rejected", rejectionReason: reason });
                      }}
                      className="inline-flex items-center gap-1 rounded-full bg-destructive px-3 py-1.5 text-xs font-semibold text-destructive-foreground"
                    >
                      <XCircle className="h-3.5 w-3.5" /> Reject
                    </button>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section>
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
          Pending events ({pendingEvents.length})
        </h2>
        {pendingEvents.length === 0 ? (
          <p className="text-sm text-muted-foreground">No events awaiting review.</p>
        ) : (
          <ul className="space-y-3">
            {pendingEvents.map((e) => {
              const org = organizers.find((o) => o.id === e.organizerId);
              return (
                <li key={e.id} className="rounded-2xl border border-border bg-card p-4">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="text-sm">
                      <div className="font-semibold">{e.name}</div>
                      <div className="text-xs text-muted-foreground">
                        by {org?.orgName ?? "?"} · {e.city}, {e.country} · deadline{" "}
                        {new Date(e.deadline).toLocaleDateString()}
                      </div>
                      <p className="mt-2 text-xs">{e.shortDescription}</p>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => setEvent(e.id, { status: "approved" })}
                        disabled={org?.status !== "approved"}
                        title={org?.status !== "approved" ? "Approve organizer first" : ""}
                        className="inline-flex items-center gap-1 rounded-full bg-success px-3 py-1.5 text-xs font-semibold text-success-foreground disabled:opacity-50"
                      >
                        <CheckCircle2 className="h-3.5 w-3.5" /> Approve
                      </button>
                      <button
                        onClick={() => {
                          const reason = prompt("Reason for rejection?") || "";
                          setEvent(e.id, { status: "rejected", rejectionReason: reason });
                        }}
                        className="inline-flex items-center gap-1 rounded-full bg-destructive px-3 py-1.5 text-xs font-semibold text-destructive-foreground"
                      >
                        <XCircle className="h-3.5 w-3.5" /> Reject
                      </button>
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </div>
  );
}

// ---------- Sources management ----------

const SOURCE_TYPES: SourceType[] = ["website", "rss", "api", "crawler", "telegram", "organizer-feed"];
const TIERS: CredibilityTier[] = [1, 2, 3];

function SourcesPanel({ refresh }: { refresh: () => void }) {
  const sources = sourcesStore.list();
  const [adding, setAdding] = useState(false);
  const [running, setRunning] = useState(false);

  const runImport = () => {
    setRunning(true);
    setTimeout(() => {
      const r = simulateDailyImport();
      setRunning(false);
      alert(
        `Daily import complete:\n• ${r.totalPublished} auto-published\n• ${r.totalPending} pending review\n• ${r.totalRejected} rejected\n• ${r.totalDupes} duplicates merged`,
      );
      refresh();
    }, 600);
  };

  const update = (s: Source, patch: Partial<Source>) => {
    sourcesStore.upsert({ ...s, ...patch });
    refresh();
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-xs text-muted-foreground">
          {sources.length} sources · Daily crawl is simulated locally. Real backend cron can be wired later.
        </p>
        <div className="flex gap-2">
          <button
            onClick={() => setAdding(true)}
            className="inline-flex items-center gap-1 rounded-full border border-border bg-card px-3 py-1.5 text-xs font-semibold"
          >
            <Plus className="h-3.5 w-3.5" /> Add source
          </button>
          <button
            onClick={runImport}
            disabled={running}
            className="inline-flex items-center gap-1 rounded-full bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground disabled:opacity-60"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${running ? "animate-spin" : ""}`} />
            {running ? "Running…" : "Run daily import"}
          </button>
        </div>
      </div>

      {adding && (
        <NewSourceForm
          onCancel={() => setAdding(false)}
          onSave={(s) => {
            sourcesStore.upsert(s);
            setAdding(false);
            refresh();
          }}
        />
      )}

      <ul className="space-y-3">
        {sources.map((s) => (
          <li key={s.id} className="rounded-2xl border border-border bg-card p-4">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="min-w-0 text-sm">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-semibold">{s.name}</span>
                  <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] uppercase">
                    {s.type}
                  </span>
                  <span
                    className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                      s.tier === 1
                        ? "bg-success/20 text-success"
                        : s.tier === 2
                          ? "bg-primary/20 text-primary"
                          : "bg-muted text-muted-foreground"
                    }`}
                  >
                    Tier {s.tier}
                  </span>
                  <span className="text-[10px] text-muted-foreground">
                    {s.status} · every {s.frequencyHours}h · imported {s.importedCount}
                  </span>
                </div>
                <a href={s.url} target="_blank" rel="noreferrer" className="block truncate text-xs text-primary underline">
                  {s.url}
                </a>
                <div className="mt-1 text-[11px] text-muted-foreground">
                  {s.categoryFocus} · {s.regionFocus} · {s.language}
                  {s.lastCheckedAt && ` · last checked ${new Date(s.lastCheckedAt).toLocaleString()}`}
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                <label className="inline-flex items-center gap-1 text-[11px]">
                  <input
                    type="checkbox"
                    checked={s.autoPublish}
                    onChange={(e) => update(s, { autoPublish: e.target.checked })}
                  />
                  auto-publish
                </label>
                <select
                  value={s.tier}
                  onChange={(e) => update(s, { tier: Number(e.target.value) as CredibilityTier })}
                  className="rounded border border-border bg-background px-1 py-0.5 text-[11px]"
                >
                  {TIERS.map((t) => (
                    <option key={t} value={t}>
                      Tier {t}
                    </option>
                  ))}
                </select>
                <button
                  onClick={() =>
                    update(s, {
                      status: s.status === "active" ? "paused" : "active",
                    } as Partial<Source>)
                  }
                  className="inline-flex items-center gap-1 rounded-full border border-border px-2 py-1 text-[11px]"
                >
                  {s.status === "active" ? (
                    <>
                      <PauseCircle className="h-3 w-3" /> pause
                    </>
                  ) : (
                    <>
                      <PlayCircle className="h-3 w-3" /> activate
                    </>
                  )}
                </button>
                <button
                  onClick={() => update(s, { status: "blocked" as SourceStatus })}
                  className="rounded-full border border-border px-2 py-1 text-[11px] text-destructive"
                >
                  block
                </button>
                <button
                  onClick={() => {
                    if (confirm(`Remove ${s.name}?`)) {
                      sourcesStore.remove(s.id);
                      refresh();
                    }
                  }}
                  className="rounded-full border border-border px-2 py-1 text-[11px] text-destructive"
                >
                  <Trash2 className="h-3 w-3" />
                </button>
              </div>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}

function NewSourceForm({
  onCancel,
  onSave,
}: {
  onCancel: () => void;
  onSave: (s: Source) => void;
}) {
  const [form, setForm] = useState<Source>({
    id: `src_${Math.random().toString(36).slice(2, 8)}`,
    name: "",
    type: "website",
    url: "",
    tier: 2,
    frequencyHours: 24,
    importedCount: 0,
    autoPublish: false,
    categoryFocus: "",
    regionFocus: "Global",
    language: "English",
    status: "active",
  });
  const set = (p: Partial<Source>) => setForm((f) => ({ ...f, ...p }));

  return (
    <div className="rounded-2xl border border-border bg-card p-4">
      <div className="grid gap-2 sm:grid-cols-2">
        <input
          placeholder="Source name"
          value={form.name}
          onChange={(e) => set({ name: e.target.value })}
          className="rounded border border-border bg-background px-2 py-1.5 text-sm"
        />
        <input
          placeholder="URL"
          value={form.url}
          onChange={(e) => set({ url: e.target.value })}
          className="rounded border border-border bg-background px-2 py-1.5 text-sm"
        />
        <select
          value={form.type}
          onChange={(e) => set({ type: e.target.value as SourceType })}
          className="rounded border border-border bg-background px-2 py-1.5 text-sm"
        >
          {SOURCE_TYPES.map((t) => (
            <option key={t} value={t}>
              {t}
            </option>
          ))}
        </select>
        <select
          value={form.tier}
          onChange={(e) => set({ tier: Number(e.target.value) as CredibilityTier })}
          className="rounded border border-border bg-background px-2 py-1.5 text-sm"
        >
          {TIERS.map((t) => (
            <option key={t} value={t}>
              Tier {t}
            </option>
          ))}
        </select>
        <input
          placeholder="Category focus"
          value={form.categoryFocus}
          onChange={(e) => set({ categoryFocus: e.target.value })}
          className="rounded border border-border bg-background px-2 py-1.5 text-sm"
        />
        <input
          placeholder="Region focus"
          value={form.regionFocus}
          onChange={(e) => set({ regionFocus: e.target.value })}
          className="rounded border border-border bg-background px-2 py-1.5 text-sm"
        />
        <input
          placeholder="Language"
          value={form.language}
          onChange={(e) => set({ language: e.target.value })}
          className="rounded border border-border bg-background px-2 py-1.5 text-sm"
        />
        <input
          type="number"
          min={1}
          value={form.frequencyHours}
          onChange={(e) => set({ frequencyHours: Number(e.target.value) })}
          className="rounded border border-border bg-background px-2 py-1.5 text-sm"
          placeholder="Frequency (hours)"
        />
        <label className="inline-flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={form.autoPublish}
            onChange={(e) => set({ autoPublish: e.target.checked })}
          />
          Allow auto-publish
        </label>
      </div>
      <div className="mt-3 flex justify-end gap-2">
        <button onClick={onCancel} className="rounded-full border border-border px-3 py-1.5 text-xs">
          Cancel
        </button>
        <button
          disabled={!form.name || !form.url}
          onClick={() => onSave(form)}
          className="rounded-full bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground disabled:opacity-50"
        >
          Save source
        </button>
      </div>
    </div>
  );
}

// ---------- Imports list ----------

function ImportsList({
  filter,
  refresh,
}: {
  filter: "all" | "auto-published" | "pending-review" | "rejected";
  refresh: () => void;
}) {
  const items = useMemo(() => {
    const all = sourcesStore.imports();
    return filter === "all" ? all : all.filter((i) => i.status === filter);
  }, [filter]);
  const sources = sourcesStore.list();

  if (items.length === 0) {
    return <p className="text-sm text-muted-foreground">Nothing here yet. Run the daily import in Sources.</p>;
  }

  return (
    <ul className="space-y-3">
      {items.map((i) => {
        const src = sources.find((s) => s.id === i.sourceId);
        return (
          <li key={i.id} className="rounded-2xl border border-border bg-card p-4">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="min-w-0 text-sm">
                <div className="font-semibold">{i.data.name}</div>
                <div className="text-xs text-muted-foreground">
                  {i.data.organizer} · {i.data.city}, {i.data.country} · deadline{" "}
                  {new Date(i.data.deadline).toLocaleDateString()}
                </div>
                <div className="mt-1 flex flex-wrap gap-1 text-[10px]">
                  <span className="rounded-full bg-muted px-2 py-0.5">{src?.name ?? i.sourceId}</span>
                  <span className="rounded-full bg-muted px-2 py-0.5">Tier {i.data.tier}</span>
                  <span
                    className={`rounded-full px-2 py-0.5 font-semibold ${
                      i.trustLevel === "High"
                        ? "bg-success/20 text-success"
                        : i.trustLevel === "Medium"
                          ? "bg-primary/20 text-primary"
                          : "bg-destructive/20 text-destructive"
                    }`}
                  >
                    Trust {i.trustLevel} ({i.trustScore})
                  </span>
                  <span className="rounded-full bg-muted px-2 py-0.5">{i.status}</span>
                </div>
                {i.reviewNotes && <p className="mt-2 text-xs text-muted-foreground">⚠ {i.reviewNotes}</p>}
                {i.rejectionReason && <p className="mt-2 text-xs text-destructive">{i.rejectionReason}</p>}
                <p className="mt-2 text-xs">{i.data.shortDescription}</p>
                <a
                  href={i.data.applicationLink}
                  target="_blank"
                  rel="noreferrer"
                  className="text-xs text-primary underline"
                >
                  {i.data.applicationLink}
                </a>
              </div>
              {i.status === "pending-review" && (
                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      approveImport(i.id);
                      refresh();
                    }}
                    className="inline-flex items-center gap-1 rounded-full bg-success px-3 py-1.5 text-xs font-semibold text-success-foreground"
                  >
                    <CheckCircle2 className="h-3.5 w-3.5" /> Approve & publish
                  </button>
                  <button
                    onClick={() => {
                      const r = prompt("Reason?") || "Manual rejection";
                      rejectImport(i.id, r);
                      refresh();
                    }}
                    className="inline-flex items-center gap-1 rounded-full bg-destructive px-3 py-1.5 text-xs font-semibold text-destructive-foreground"
                  >
                    <XCircle className="h-3.5 w-3.5" /> Reject
                  </button>
                </div>
              )}
            </div>
          </li>
        );
      })}
    </ul>
  );
}

// ---------- Logs ----------

function LogsPanel() {
  const logs = sourcesStore.logs();
  const errors = sourcesStore.errors();
  const sources = sourcesStore.list();
  const nameOf = (id?: string) => sources.find((s) => s.id === id)?.name ?? id ?? "—";

  return (
    <div className="space-y-6">
      <section>
        <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
          Import logs
        </h2>
        {logs.length === 0 ? (
          <p className="text-sm text-muted-foreground">No imports yet.</p>
        ) : (
          <ul className="space-y-2">
            {logs.map((l) => (
              <li key={l.id} className="rounded-xl border border-border bg-card p-3 text-xs">
                <div className="flex flex-wrap justify-between gap-2">
                  <span className="font-semibold">{nameOf(l.sourceId)}</span>
                  <span className="text-muted-foreground">{new Date(l.startedAt).toLocaleString()}</span>
                </div>
                <div className="mt-1 text-muted-foreground">
                  found {l.found} · published {l.published} · pending {l.pending} · rejected {l.rejected} ·
                  duplicates {l.duplicates} · {l.durationMs}ms
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
      <section>
        <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
          Error logs
        </h2>
        {errors.length === 0 ? (
          <p className="text-sm text-muted-foreground">No errors recorded.</p>
        ) : (
          <ul className="space-y-2">
            {errors.map((e) => (
              <li key={e.id} className="rounded-xl border border-destructive/40 bg-destructive/5 p-3 text-xs">
                <div className="flex flex-wrap justify-between gap-2">
                  <span className="font-semibold capitalize">{e.kind}</span>
                  <span className="text-muted-foreground">{new Date(e.at).toLocaleString()}</span>
                </div>
                <div className="text-muted-foreground">{nameOf(e.sourceId)}</div>
                <div className="mt-1">{e.message}</div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
