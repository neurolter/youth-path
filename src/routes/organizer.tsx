import { createFileRoute, Link, Outlet, useLocation } from "@tanstack/react-router";
import { Building2, LayoutDashboard, ShieldCheck, Plus } from "lucide-react";

export const Route = createFileRoute("/organizer")({
  component: OrganizerLayout,
});

function OrganizerLayout() {
  const loc = useLocation();
  const tabs = [
    { to: "/organizer", label: "Dashboard", icon: LayoutDashboard, exact: true },
    { to: "/organizer/register", label: "Verification", icon: ShieldCheck },
    { to: "/organizer/events/new", label: "New event", icon: Plus },
    { to: "/admin", label: "Admin", icon: Building2 },
  ];
  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="sticky top-0 z-30 border-b border-border/60 bg-background/80 backdrop-blur-xl">
        <div className="mx-auto flex w-full max-w-5xl items-center justify-between gap-3 px-5 py-3">
          <Link to="/" className="flex items-center gap-2">
            <span className="grid h-8 w-8 place-items-center rounded-xl bg-[image:var(--gradient-primary)] text-primary-foreground">
              <Building2 className="h-4 w-4" />
            </span>
            <span className="text-lg font-semibold">Organizer Console</span>
          </Link>
          <Link to="/discover" className="text-xs text-muted-foreground hover:text-foreground">
            Back to app
          </Link>
        </div>
        <nav className="mx-auto flex w-full max-w-5xl gap-1 overflow-x-auto px-3 pb-2 text-sm">
          {tabs.map((t) => {
            const active = t.exact
              ? loc.pathname === t.to
              : loc.pathname.startsWith(t.to);
            const Icon = t.icon;
            return (
              <Link
                key={t.to}
                to={t.to}
                className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 ${
                  active
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:bg-secondary hover:text-foreground"
                }`}
              >
                <Icon className="h-3.5 w-3.5" />
                {t.label}
              </Link>
            );
          })}
        </nav>
      </header>
      <main className="mx-auto w-full max-w-5xl px-4 py-6">
        <Outlet />
      </main>
    </div>
  );
}
