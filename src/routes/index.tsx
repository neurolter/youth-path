import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, Compass, Heart, Sparkles, ShieldCheck, Globe2 } from "lucide-react";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "YouthMatch — Swipe. Match. Apply. Lead globally." },
      {
        name: "description",
        content:
          "Discover international forums, summits, fellowships, and scholarships for young leaders. Build your portfolio and let AI craft tailored applications.",
      },
      { property: "og:title", content: "YouthMatch — Tinder for global youth opportunities" },
      {
        property: "og:description",
        content:
          "Swipe through verified global opportunities, save the ones you love, and apply with AI-crafted answers.",
      },
    ],
  }),
  component: Landing,
});

function Landing() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Nav */}
      <header className="mx-auto flex w-full max-w-6xl items-center justify-between px-6 py-5">
        <div className="flex items-center gap-2">
          <span className="grid h-9 w-9 place-items-center rounded-xl bg-[image:var(--gradient-primary)] text-primary-foreground shadow-[var(--shadow-soft)]">
            <Globe2 className="h-5 w-5" />
          </span>
          <span className="text-lg font-semibold tracking-tight">YouthMatch</span>
        </div>
        <Link
          to="/discover"
          className="rounded-full bg-foreground px-4 py-2 text-sm font-medium text-background transition-opacity hover:opacity-90"
        >
          Open app
        </Link>
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div
          className="absolute inset-0 -z-10 opacity-90"
          style={{ background: "var(--gradient-hero)" }}
        />
        <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_30%_20%,white_0%,transparent_55%)] opacity-40" />
        <div className="mx-auto grid max-w-6xl gap-10 px-6 py-20 text-primary-foreground md:grid-cols-2 md:py-28">
          <div className="flex flex-col justify-center">
            <span className="inline-flex w-fit items-center gap-2 rounded-full border border-white/30 bg-white/10 px-3 py-1 text-xs font-medium backdrop-blur">
              <Sparkles className="h-3.5 w-3.5" /> For young leaders 16–35
            </span>
            <h1 className="mt-5 text-4xl font-semibold leading-[1.05] tracking-tight md:text-6xl">
              Swipe. Match. <br />
              Apply. Lead globally.
            </h1>
            <p className="mt-5 max-w-md text-base text-white/85 md:text-lg">
              Discover verified international forums, summits, fellowships, and
              scholarships — and apply with AI-crafted answers tailored to your
              story.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                to="/discover"
                className="inline-flex items-center gap-2 rounded-full bg-white px-5 py-3 text-sm font-semibold text-foreground shadow-[var(--shadow-glow)] transition-transform hover:-translate-y-0.5"
              >
                Start swiping <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                to="/portfolio"
                className="inline-flex items-center gap-2 rounded-full border border-white/40 bg-white/10 px-5 py-3 text-sm font-semibold backdrop-blur transition-colors hover:bg-white/20"
              >
                Build my portfolio
              </Link>
            </div>
            <div className="mt-8 flex items-center gap-5 text-xs text-white/80">
              <span className="inline-flex items-center gap-1.5">
                <ShieldCheck className="h-4 w-4" /> Verified organizers
              </span>
              <span>•</span>
              <span>190+ countries</span>
              <span>•</span>
              <span>Free to use</span>
            </div>
          </div>

          {/* Floating preview card */}
          <div className="relative hidden md:block">
            <div className="absolute left-6 top-10 h-[420px] w-72 rotate-[-6deg] rounded-3xl bg-white/10 backdrop-blur-md ring-1 ring-white/20" />
            <div className="absolute right-2 top-2 h-[440px] w-72 rotate-[4deg] rounded-3xl bg-white p-5 text-foreground shadow-2xl">
              <div className="h-40 rounded-2xl bg-gradient-to-br from-rose-500 via-fuchsia-500 to-indigo-500" />
              <div className="mt-4 flex items-center gap-2">
                <span className="inline-flex items-center gap-1 rounded-full bg-success/15 px-2 py-0.5 text-[10px] font-semibold text-success">
                  <ShieldCheck className="h-3 w-3" /> Verified
                </span>
                <span className="text-[10px] text-muted-foreground">Munich, DE</span>
              </div>
              <h3 className="mt-2 text-lg font-semibold leading-tight">
                One Young World Summit 2026
              </h3>
              <p className="mt-1 text-xs text-muted-foreground">
                4-day global forum. Fully funded for selected delegates.
              </p>
              <div className="mt-3 flex flex-wrap gap-1.5">
                {["Leadership", "Fully funded", "Ages 18–30"].map((t) => (
                  <span
                    key={t}
                    className="rounded-full bg-secondary px-2 py-0.5 text-[10px] font-medium text-secondary-foreground"
                  >
                    {t}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="mx-auto grid max-w-6xl gap-4 px-6 py-16 md:grid-cols-3">
        {[
          {
            icon: Compass,
            title: "Discover by swiping",
            text: "Card-based interface to browse curated, verified opportunities in seconds.",
          },
          {
            icon: Heart,
            title: "Save & organize",
            text: "Build a shortlist with deadlines, requirements, and benefits at a glance.",
          },
          {
            icon: Sparkles,
            title: "Apply with AI",
            text: "Tailored motivation answers, bios, and essays drafted from your portfolio.",
          },
        ].map((f) => (
          <div
            key={f.title}
            className="rounded-2xl border border-border bg-card p-6 shadow-[var(--shadow-soft)]"
          >
            <div className="grid h-10 w-10 place-items-center rounded-xl bg-secondary text-secondary-foreground">
              <f.icon className="h-5 w-5" />
            </div>
            <h3 className="mt-4 font-semibold">{f.title}</h3>
            <p className="mt-1 text-sm text-muted-foreground">{f.text}</p>
          </div>
        ))}
      </section>

      <footer className="border-t border-border py-8 text-center text-xs text-muted-foreground">
        © {new Date().getFullYear()} YouthMatch · Built for young leaders worldwide
      </footer>
    </div>
  );
}
