import { Link, Outlet, useLocation } from "@tanstack/react-router";
import { Compass, Heart, Sparkles, User, Globe2 } from "lucide-react";

const tabs = [
  { to: "/discover", label: "Discover", icon: Compass },
  { to: "/saved", label: "Saved", icon: Heart },
  { to: "/assistant", label: "AI Coach", icon: Sparkles },
  { to: "/portfolio", label: "Profile", icon: User },
];

export function AppLayout() {
  const location = useLocation();

  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground">
      <header className="sticky top-0 z-30 border-b border-border/60 bg-background/80 backdrop-blur-xl">
        <div className="mx-auto flex w-full max-w-2xl items-center justify-between px-5 py-3">
          <Link to="/" className="flex items-center gap-2">
            <span className="grid h-8 w-8 place-items-center rounded-xl bg-[image:var(--gradient-primary)] text-primary-foreground shadow-[var(--shadow-soft)]">
              <Globe2 className="h-4 w-4" />
            </span>
            <span className="text-lg font-semibold tracking-tight">YouthMatch</span>
          </Link>
          <Link
            to="/portfolio"
            className="rounded-full border border-border bg-card px-3 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground"
          >
            My profile
          </Link>
        </div>
      </header>

      <main className="mx-auto w-full max-w-2xl flex-1 px-4 pb-28 pt-4">
        <Outlet />
      </main>

      <nav className="fixed bottom-0 left-0 right-0 z-30 border-t border-border/60 bg-background/90 backdrop-blur-xl">
        <div className="mx-auto flex w-full max-w-2xl items-stretch justify-between px-2 py-2">
          {tabs.map((t) => {
            const active =
              location.pathname === t.to ||
              (t.to !== "/" && location.pathname.startsWith(t.to));
            const Icon = t.icon;
            return (
              <Link
                key={t.to}
                to={t.to}
                className={`flex flex-1 flex-col items-center gap-1 rounded-xl py-2 text-xs font-medium transition-colors ${
                  active ? "text-primary" : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <Icon className={`h-5 w-5 ${active ? "scale-110" : ""} transition-transform`} />
                {t.label}
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
