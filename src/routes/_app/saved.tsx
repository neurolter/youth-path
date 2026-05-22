import { createFileRoute, Link } from "@tanstack/react-router";
import { allOpportunitiesData as opportunities } from "@/data/opportunities";
import { useLocalStorage } from "@/lib/store";
import { Heart, ShieldCheck, Trash2 } from "lucide-react";

export const Route = createFileRoute("/_app/saved")({
  component: Saved,
});

function Saved() {
  const [saved, setSaved] = useLocalStorage<string[]>("ym:saved", []);
  const items = saved
    .map((id) => opportunities.find((o) => o.id === id))
    .filter((o): o is NonNullable<typeof o> => Boolean(o));

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Saved</h1>
        <p className="text-sm text-muted-foreground">
          {items.length} opportunit{items.length === 1 ? "y" : "ies"} on your shortlist
        </p>
      </div>

      {items.length === 0 ? (
        <div className="grid place-items-center rounded-3xl border border-dashed border-border bg-card p-10 text-center">
          <Heart className="h-8 w-8 text-muted-foreground" />
          <h3 className="mt-3 font-semibold">No saved opportunities yet</h3>
          <p className="mt-1 max-w-xs text-sm text-muted-foreground">
            Swipe right on opportunities you love — they'll show up here.
          </p>
          <Link
            to="/discover"
            className="mt-4 rounded-full bg-foreground px-4 py-2 text-sm font-medium text-background"
          >
            Start discovering
          </Link>
        </div>
      ) : (
        <ul className="flex flex-col gap-3">
          {items.map((o) => (
            <li
              key={o.id}
              className="group flex gap-3 overflow-hidden rounded-2xl border border-border bg-card p-3 shadow-[var(--shadow-soft)]"
            >
              <Link
                to="/opportunity/$id"
                params={{ id: o.id }}
                className={`grid h-20 w-20 shrink-0 place-items-center rounded-xl bg-gradient-to-br ${o.cover} text-white`}
              >
                <span className="text-xs font-bold uppercase tracking-wide">
                  {o.type.slice(0, 4)}
                </span>
              </Link>
              <div className="flex min-w-0 flex-1 flex-col">
                <Link
                  to="/opportunity/$id"
                  params={{ id: o.id }}
                  className="truncate font-semibold leading-tight hover:underline"
                >
                  {o.name}
                </Link>
                <p className="truncate text-xs text-muted-foreground">
                  {o.organizer} · {o.country}
                </p>
                <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
                  {o.verified && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-success/15 px-2 py-0.5 text-[10px] font-semibold text-success">
                      <ShieldCheck className="h-3 w-3" /> Verified
                    </span>
                  )}
                  <span className="rounded-full bg-secondary px-2 py-0.5 text-[10px] font-medium text-secondary-foreground">
                    {o.dates}
                  </span>
                </div>
              </div>
              <button
                onClick={() => setSaved((s) => s.filter((id) => id !== o.id))}
                className="self-start rounded-full p-2 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                aria-label="Remove"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
