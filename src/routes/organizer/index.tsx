import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { orgStore, type Organizer, type OrgEvent } from "@/lib/organizer";
import {
  ShieldCheck,
  ShieldAlert,
  Plus,
  Eye,
  Heart,
  Inbox,
  AlertTriangle,
  CheckCircle2,
  Clock,
  XCircle,
} from "lucide-react";

export const Route = createFileRoute("/organizer/")({
  component: Dashboard,
});

function statusBadge(s: string) {
  const map: Record<string, { cls: string; icon: typeof CheckCircle2; label: string }> = {
    approved: { cls: "bg-success/15 text-success", icon: CheckCircle2, label: "Approved" },
    pending: { cls: "bg-warning/15 text-warning", icon: Clock, label: "Pending review" },
    rejected: { cls: "bg-destructive/15 text-destructive", icon: XCircle, label: "Rejected" },
    draft: { cls: "bg-muted text-muted-foreground", icon: Clock, label: "Draft" },
    closed: { cls: "bg-muted text-muted-foreground", icon: XCircle, label: "Closed" },
  };
  const m = map[s] ?? map.draft;
  const I = m.icon;
  return (
    <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold ${m.cls}`}>
      <I className="h-3 w-3" /> {m.label}
    </span>
  );
}

function Dashboard() {
  const [hydrated, setHydrated] = useState(false);
  const [me, setMe] = useState<Organizer | null>(null);
  const [events, setEvents] = useState<OrgEvent[]>([]);

  useEffect(() => {
    const id = orgStore.currentOrgId();
    const orgs = orgStore.organizers();
    const m = orgs.find((o) => o.id === id) ?? null;
    setMe(m);
    setEvents(orgStore.events().filter((e) => e.organizerId === m?.id));
    setHydrated(true);
  }, []);

  if (!hydrated) return null;

  const apps = me ? orgStore.apps().filter((a) => a.organizerId === me.id) : [];

  if (!me) {
    return (
      <div className="rounded-2xl border border-border bg-card p-6">
        <div className="flex items-start gap-3">
          <ShieldAlert className="mt-0.5 h-5 w-5 text-warning" />
          <div>
            <h2 className="text-lg font-semibold">Become a verified organizer</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Universities, NGOs, embassies, companies, foundations and event teams can publish
              opportunities directly inside YouthMatch. Submit your verification to get started —
              admins will review and approve before your events go public.
            </p>
            <Link
              to="/organizer/register"
              className="mt-4 inline-flex items-center gap-2 rounded-full bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground"
            >
              <ShieldCheck className="h-4 w-4" /> Submit verification
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-border bg-card p-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-semibold">{me.orgName}</h1>
              {statusBadge(me.status)}
            </div>
            <p className="mt-1 text-sm text-muted-foreground">
              {me.orgType} · {me.country} · {me.officialEmail}
            </p>
          </div>
          <Link
            to="/organizer/events/new"
            className="inline-flex items-center gap-2 rounded-full bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground disabled:opacity-50"
          >
            <Plus className="h-4 w-4" /> New event
          </Link>
        </div>
        {me.status === "pending" && (
          <p className="mt-3 flex items-center gap-2 rounded-xl bg-warning/10 p-3 text-xs text-warning">
            <AlertTriangle className="h-4 w-4" />
            Your account is awaiting admin approval. You can draft events but they cannot be
            published until your organization is approved.
          </p>
        )}
        {me.status === "rejected" && (
          <p className="mt-3 rounded-xl bg-destructive/10 p-3 text-xs text-destructive">
            Verification rejected: {me.rejectionReason || "no reason provided"}.
          </p>
        )}
      </div>

      <section>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
            Your events
          </h2>
          <span className="text-xs text-muted-foreground">{events.length} total</span>
        </div>
        {events.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
            No events yet. Create your first event to start receiving applications.
          </div>
        ) : (
          <ul className="space-y-3">
            {events.map((e) => {
              const evApps = apps.filter((a) => a.eventId === e.id);
              return (
                <li
                  key={e.id}
                  className="rounded-2xl border border-border bg-card p-4 transition-colors hover:border-primary/40"
                >
                  <Link
                    to="/organizer/events/$eventId"
                    params={{ eventId: e.id }}
                    className="block"
                  >
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold">{e.name}</h3>
                          {statusBadge(e.status)}
                        </div>
                        <p className="mt-1 text-xs text-muted-foreground">
                          {e.dates} · {e.city}, {e.country} · deadline{" "}
                          {new Date(e.deadline).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="flex items-center gap-3 text-xs text-muted-foreground">
                        <span className="inline-flex items-center gap-1">
                          <Eye className="h-3.5 w-3.5" /> {e.views}
                        </span>
                        <span className="inline-flex items-center gap-1">
                          <Heart className="h-3.5 w-3.5" /> {e.saves}
                        </span>
                        <span className="inline-flex items-center gap-1">
                          <Inbox className="h-3.5 w-3.5" /> {evApps.length}
                        </span>
                      </div>
                    </div>
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </div>
  );
}
