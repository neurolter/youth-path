import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import {
  orgStore,
  newId,
  type OrgEvent,
  type OrgApplication,
  type AppStatus,
} from "@/lib/organizer";
import {
  Eye,
  Heart,
  Inbox,
  Send,
  Lock,
  Unlock,
  ArrowLeft,
  Globe2,
} from "lucide-react";

export const Route = createFileRoute("/organizer/events/$eventId")({
  component: ManageEvent,
});

const STATUSES: AppStatus[] = ["submitted", "under_review", "accepted", "waitlisted", "rejected"];
const STATUS_LABEL: Record<AppStatus, string> = {
  submitted: "Submitted",
  under_review: "Under review",
  accepted: "Accepted",
  waitlisted: "Waitlisted",
  rejected: "Rejected",
};

function ManageEvent() {
  const { eventId } = Route.useParams();
  const navigate = useNavigate();
  const [tick, setTick] = useState(0);
  const refresh = () => setTick((t) => t + 1);

  const event = useMemo<OrgEvent | undefined>(
    () => orgStore.events().find((e) => e.id === eventId),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [eventId, tick],
  );
  const apps = useMemo<OrgApplication[]>(
    () => orgStore.apps().filter((a) => a.eventId === eventId),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [eventId, tick],
  );

  const [updateMsg, setUpdateMsg] = useState("");
  const [updateAudience, setUpdateAudience] = useState<AppStatus | "all">("all");
  const [hydrated, setHydrated] = useState(false);
  useEffect(() => setHydrated(true), []);

  if (!hydrated) return null;
  if (!event) {
    return (
      <div>
        <Link to="/organizer" className="text-sm text-primary underline">
          ← Back to dashboard
        </Link>
        <p className="mt-4 text-sm text-muted-foreground">Event not found.</p>
      </div>
    );
  }

  const setEvent = (patch: Partial<OrgEvent>) => {
    const all = orgStore.events();
    orgStore.setEvents(all.map((e) => (e.id === event.id ? { ...e, ...patch } : e)));
    refresh();
  };

  const setAppStatus = (id: string, s: AppStatus) => {
    const all = orgStore.apps();
    orgStore.setApps(all.map((a) => (a.id === id ? { ...a, status: s } : a)));
    refresh();
  };

  const sendUpdate = () => {
    if (!updateMsg.trim()) return;
    setEvent({
      updates: [
        ...event.updates,
        {
          id: newId(),
          sentAt: new Date().toISOString(),
          message: updateMsg.trim(),
          audience: updateAudience,
        },
      ],
    });
    setUpdateMsg("");
  };

  const countriesCount = apps.reduce<Record<string, number>>((acc, a) => {
    const c = a.applicantCountry || "Unknown";
    acc[c] = (acc[c] ?? 0) + 1;
    return acc;
  }, {});

  return (
    <div className="space-y-6">
      <Link to="/organizer" className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-3.5 w-3.5" /> Back to dashboard
      </Link>

      <div className="rounded-2xl border border-border bg-card p-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h1 className="text-xl font-semibold">{event.name}</h1>
            <p className="mt-1 text-xs text-muted-foreground">
              Status: <strong>{event.status}</strong> · {event.dates} · deadline{" "}
              {new Date(event.deadline).toLocaleDateString()}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            {event.status === "approved" && (
              <button
                onClick={() => setEvent({ status: "closed" })}
                className="inline-flex items-center gap-1.5 rounded-full border border-border px-3 py-1.5 text-xs hover:bg-secondary"
              >
                <Lock className="h-3.5 w-3.5" /> Close applications
              </button>
            )}
            {event.status === "closed" && (
              <button
                onClick={() => setEvent({ status: "approved" })}
                className="inline-flex items-center gap-1.5 rounded-full border border-border px-3 py-1.5 text-xs hover:bg-secondary"
              >
                <Unlock className="h-3.5 w-3.5" /> Reopen
              </button>
            )}
            {event.status === "draft" && (
              <button
                onClick={() => setEvent({ status: "pending" })}
                className="rounded-full bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground"
              >
                Submit for admin review
              </button>
            )}
            {event.status === "approved" && (
              <Link
                to="/opportunity/$id"
                params={{ id: `org_${event.id}` }}
                className="inline-flex items-center gap-1.5 rounded-full border border-border px-3 py-1.5 text-xs hover:bg-secondary"
              >
                <Globe2 className="h-3.5 w-3.5" /> View public page
              </Link>
            )}
          </div>
        </div>
      </div>

      <section className="grid gap-3 sm:grid-cols-4">
        <Stat icon={Eye} label="Views" value={event.views} />
        <Stat icon={Heart} label="Saves" value={event.saves} />
        <Stat icon={Inbox} label="Applications" value={apps.length} />
        <Stat icon={Globe2} label="Countries" value={Object.keys(countriesCount).length} />
      </section>

      {Object.keys(countriesCount).length > 0 && (
        <section className="rounded-2xl border border-border bg-card p-4">
          <h2 className="mb-2 text-sm font-semibold">Applicants by country</h2>
          <div className="flex flex-wrap gap-2 text-xs">
            {Object.entries(countriesCount)
              .sort((a, b) => b[1] - a[1])
              .map(([c, n]) => (
                <span key={c} className="rounded-full bg-secondary px-2.5 py-1">
                  {c} · {n}
                </span>
              ))}
          </div>
        </section>
      )}

      <section className="rounded-2xl border border-border bg-card p-4">
        <h2 className="mb-3 text-sm font-semibold">Send update to applicants</h2>
        <div className="grid gap-2 sm:grid-cols-[1fr_auto_auto]">
          <input
            value={updateMsg}
            onChange={(e) => setUpdateMsg(e.target.value)}
            placeholder="e.g. Your interview is scheduled for ..."
            className="rounded-md border border-border bg-transparent px-3 py-2 text-sm"
          />
          <select
            value={updateAudience}
            onChange={(e) => setUpdateAudience(e.target.value as AppStatus | "all")}
            className="rounded-md border border-border bg-transparent px-3 py-2 text-sm"
          >
            <option value="all">All applicants</option>
            {STATUSES.map((s) => (
              <option key={s} value={s}>{STATUS_LABEL[s]}</option>
            ))}
          </select>
          <button
            onClick={sendUpdate}
            className="inline-flex items-center justify-center gap-1.5 rounded-md bg-primary px-3 py-2 text-sm font-semibold text-primary-foreground"
          >
            <Send className="h-3.5 w-3.5" /> Send
          </button>
        </div>
        {event.updates.length > 0 && (
          <ul className="mt-3 space-y-2 text-xs">
            {event.updates.slice().reverse().map((u) => (
              <li key={u.id} className="rounded-lg bg-secondary/40 p-2">
                <div className="text-[10px] uppercase tracking-wide text-muted-foreground">
                  {new Date(u.sentAt).toLocaleString()} · to {u.audience === "all" ? "everyone" : STATUS_LABEL[u.audience]}
                </div>
                {u.message}
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="rounded-2xl border border-border bg-card p-4">
        <h2 className="mb-3 text-sm font-semibold">Applications ({apps.length})</h2>
        {apps.length === 0 ? (
          <p className="text-sm text-muted-foreground">No applications yet.</p>
        ) : (
          <ul className="space-y-3">
            {apps.map((a) => (
              <li key={a.id} className="rounded-xl border border-border bg-background p-3">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <div className="font-medium text-sm">{a.applicantName || "Anonymous applicant"}</div>
                    <div className="text-xs text-muted-foreground">
                      {a.applicantEmail || "—"} · {a.applicantCountry || "—"} · submitted{" "}
                      {new Date(a.submittedAt).toLocaleDateString()}
                    </div>
                  </div>
                  <select
                    value={a.status}
                    onChange={(e) => setAppStatus(a.id, e.target.value as AppStatus)}
                    className="rounded-md border border-border bg-transparent px-2 py-1 text-xs"
                  >
                    {STATUSES.map((s) => (
                      <option key={s} value={s}>{STATUS_LABEL[s]}</option>
                    ))}
                  </select>
                </div>
                <details className="mt-2 text-xs">
                  <summary className="cursor-pointer text-muted-foreground">View portfolio & answers</summary>
                  <div className="mt-2 grid gap-2 sm:grid-cols-2">
                    {Object.entries(a.portfolioSnapshot)
                      .filter(([, v]) => v)
                      .map(([k, v]) => (
                        <div key={k} className="rounded bg-secondary/40 p-2">
                          <div className="text-[10px] uppercase text-muted-foreground">{k}</div>
                          <div>{v}</div>
                        </div>
                      ))}
                  </div>
                  {Object.keys(a.answers).length > 0 && (
                    <div className="mt-3 space-y-2">
                      {Object.entries(a.answers).map(([q, v]) => (
                        <div key={q}>
                          <div className="text-[10px] uppercase text-muted-foreground">{q}</div>
                          <div className="rounded bg-secondary/40 p-2">{v}</div>
                        </div>
                      ))}
                    </div>
                  )}
                </details>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

function Stat({ icon: Icon, label, value }: { icon: typeof Eye; label: string; value: number }) {
  return (
    <div className="rounded-2xl border border-border bg-card p-4">
      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        <Icon className="h-3.5 w-3.5" /> {label}
      </div>
      <div className="mt-1 text-2xl font-semibold">{value}</div>
    </div>
  );
}
