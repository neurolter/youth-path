import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { orgStore, type Organizer, type OrgEvent } from "@/lib/organizer";
import { CheckCircle2, XCircle, ShieldCheck, ArrowLeft } from "lucide-react";

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
            Demo mode — enable admin to review organizers and events.
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
    <div className="min-h-screen bg-background">
      <header className="border-b border-border/60 bg-background/80 px-5 py-3 backdrop-blur-xl">
        <div className="mx-auto flex max-w-5xl items-center justify-between">
          <Link to="/discover" className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground">
            <ArrowLeft className="h-3.5 w-3.5" /> Back to app
          </Link>
          <h1 className="text-lg font-semibold">Admin review</h1>
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

      <main className="mx-auto max-w-5xl space-y-8 px-4 py-6">
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
                      <div className="font-semibold">{o.orgName} <span className="ml-1 text-xs font-normal text-muted-foreground">({o.orgType})</span></div>
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
      </main>
    </div>
  );
}
