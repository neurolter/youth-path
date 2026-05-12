import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { orgStore, newId, type OrgEvent, type AppQuestion } from "@/lib/organizer";
import { Plus, Trash2 } from "lucide-react";

export const Route = createFileRoute("/organizer/events/new")({
  component: NewEvent,
});

const REGIONS = ["Africa", "Asia", "Europe", "North America", "Latin America", "Oceania", "Online"];
const TYPES = ["Summit", "Forum", "Conference", "Fellowship", "Festival", "Training", "Scholarship", "Workshop"];
const FUNDING = [
  { v: "free", l: "Free" },
  { v: "paid", l: "Paid" },
  { v: "partial", l: "Partially funded" },
  { v: "fully-funded", l: "Fully funded" },
];
const FORMATS = [
  { v: "in-person", l: "In-person" },
  { v: "online", l: "Online" },
  { v: "hybrid", l: "Hybrid" },
];

function NewEvent() {
  const navigate = useNavigate();
  const [orgId, setOrgId] = useState<string | null>(null);
  const [hydrated, setHydrated] = useState(false);
  const [form, setForm] = useState({
    name: "",
    shortDescription: "",
    description: "",
    country: "",
    city: "",
    region: REGIONS[0],
    type: TYPES[0],
    industry: "Leadership",
    language: "English",
    dates: "",
    deadline: "",
    minAge: 18,
    maxAge: 30,
    funding: "fully-funded",
    cost: "",
    format: "in-person",
    applicationLink: "",
    benefits: "",
    requiredDocuments: "Passport, CV, Motivation letter",
    manualSteps: "",
    tags: "",
    easyApply: true,
  });
  const [questions, setQuestions] = useState<AppQuestion[]>([
    { id: newId(), label: "Why do you want to join?", required: true, type: "long" },
  ]);

  useEffect(() => {
    setOrgId(orgStore.currentOrgId());
    setHydrated(true);
  }, []);

  if (!hydrated) return null;
  if (!orgId) {
    return (
      <p className="rounded-2xl border border-border bg-card p-6 text-sm">
        You must register as an organizer first.
      </p>
    );
  }

  const me = orgStore.organizers().find((o) => o.id === orgId);
  const isApproved = me?.status === "approved";

  const splitList = (s: string) =>
    s.split(",").map((x) => x.trim()).filter(Boolean);

  const save = (status: "draft" | "pending") => {
    if (!form.name || !form.deadline || !form.country) {
      alert("Please fill name, country and deadline.");
      return;
    }
    if (status === "pending" && !isApproved) {
      alert("Your organization must be approved by admins before you can submit events for publication.");
      return;
    }
    const e: OrgEvent = {
      id: newId(),
      organizerId: orgId,
      name: form.name,
      shortDescription: form.shortDescription,
      description: form.description,
      country: form.country,
      city: form.city,
      region: form.region,
      type: form.type,
      industry: form.industry,
      language: form.language,
      dates: form.dates,
      deadline: form.deadline,
      minAge: Number(form.minAge),
      maxAge: Number(form.maxAge),
      funding: form.funding as OrgEvent["funding"],
      cost: form.cost,
      format: form.format as OrgEvent["format"],
      applicationLink: form.applicationLink,
      benefits: splitList(form.benefits),
      requiredDocuments: splitList(form.requiredDocuments),
      manualSteps: splitList(form.manualSteps),
      tags: splitList(form.tags),
      cover: "from-sky-400 via-indigo-500 to-purple-600",
      easyApply: form.easyApply,
      questions,
      status,
      createdAt: new Date().toISOString(),
      views: 0,
      saves: 0,
      updates: [],
    };
    orgStore.setEvents([...orgStore.events(), e]);
    navigate({ to: "/organizer/events/$eventId", params: { eventId: e.id } });
  };

  const addQ = () =>
    setQuestions((qs) => [
      ...qs,
      { id: newId(), label: "", required: false, type: "short" },
    ]);
  const updateQ = (id: string, patch: Partial<AppQuestion>) =>
    setQuestions((qs) => qs.map((q) => (q.id === id ? { ...q, ...patch } : q)));
  const removeQ = (id: string) => setQuestions((qs) => qs.filter((q) => q.id !== id));

  return (
    <div className="mx-auto max-w-3xl space-y-5">
      <h1 className="text-xl font-semibold">Create event</h1>
      {!isApproved && (
        <p className="rounded-xl bg-warning/10 p-3 text-xs text-warning">
          Your organization is not yet approved. You can save drafts; submitting for publication
          requires admin approval of your organization.
        </p>
      )}

      <Section title="Basics">
        <Grid>
          <Field label="Event name *">
            <input className="input" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          </Field>
          <Field label="Type">
            <select className="input" value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}>
              {TYPES.map((t) => <option key={t}>{t}</option>)}
            </select>
          </Field>
          <Field label="Short description">
            <input className="input" value={form.shortDescription} onChange={(e) => setForm({ ...form, shortDescription: e.target.value })} />
          </Field>
          <Field label="Industry / Area">
            <input className="input" value={form.industry} onChange={(e) => setForm({ ...form, industry: e.target.value })} />
          </Field>
        </Grid>
        <Field label="Full description">
          <textarea className="input" rows={4} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
        </Field>
      </Section>

      <Section title="Location & dates">
        <Grid>
          <Field label="Country *">
            <input className="input" value={form.country} onChange={(e) => setForm({ ...form, country: e.target.value })} />
          </Field>
          <Field label="City">
            <input className="input" value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} />
          </Field>
          <Field label="Region">
            <select className="input" value={form.region} onChange={(e) => setForm({ ...form, region: e.target.value })}>
              {REGIONS.map((r) => <option key={r}>{r}</option>)}
            </select>
          </Field>
          <Field label="Format">
            <select className="input" value={form.format} onChange={(e) => setForm({ ...form, format: e.target.value })}>
              {FORMATS.map((f) => <option key={f.v} value={f.v}>{f.l}</option>)}
            </select>
          </Field>
          <Field label="Dates (e.g. Oct 12–15, 2026)">
            <input className="input" value={form.dates} onChange={(e) => setForm({ ...form, dates: e.target.value })} />
          </Field>
          <Field label="Application deadline *">
            <input type="date" className="input" value={form.deadline} onChange={(e) => setForm({ ...form, deadline: e.target.value })} />
          </Field>
          <Field label="Language">
            <input className="input" value={form.language} onChange={(e) => setForm({ ...form, language: e.target.value })} />
          </Field>
        </Grid>
      </Section>

      <Section title="Eligibility & funding">
        <Grid>
          <Field label="Min age">
            <input type="number" className="input" value={form.minAge} onChange={(e) => setForm({ ...form, minAge: Number(e.target.value) })} />
          </Field>
          <Field label="Max age">
            <input type="number" className="input" value={form.maxAge} onChange={(e) => setForm({ ...form, maxAge: Number(e.target.value) })} />
          </Field>
          <Field label="Funding">
            <select className="input" value={form.funding} onChange={(e) => setForm({ ...form, funding: e.target.value })}>
              {FUNDING.map((f) => <option key={f.v} value={f.v}>{f.l}</option>)}
            </select>
          </Field>
          <Field label="Cost (if any)">
            <input className="input" value={form.cost} onChange={(e) => setForm({ ...form, cost: e.target.value })} placeholder="e.g. €250 participation fee" />
          </Field>
        </Grid>
      </Section>

      <Section title="Application setup">
        <Field label="Required documents (comma separated)">
          <input className="input" value={form.requiredDocuments} onChange={(e) => setForm({ ...form, requiredDocuments: e.target.value })} />
        </Field>
        <Field label="Required actions outside the platform (payments, video, posts, signatures...)">
          <input className="input" value={form.manualSteps} onChange={(e) => setForm({ ...form, manualSteps: e.target.value })} />
        </Field>
        <Field label="Benefits (comma separated)">
          <input className="input" value={form.benefits} onChange={(e) => setForm({ ...form, benefits: e.target.value })} />
        </Field>
        <Field label="Tags (comma separated)">
          <input className="input" value={form.tags} onChange={(e) => setForm({ ...form, tags: e.target.value })} />
        </Field>
        <Field label="External application link (used if Easy Apply is off)">
          <input className="input" value={form.applicationLink} onChange={(e) => setForm({ ...form, applicationLink: e.target.value })} placeholder="https://" />
        </Field>
        <label className="mt-2 flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={form.easyApply}
            onChange={(e) => setForm({ ...form, easyApply: e.target.checked })}
          />
          Allow Easy Apply inside YouthMatch (managed application form)
        </label>
      </Section>

      <Section title="Custom application questions">
        <ul className="space-y-2">
          {questions.map((q) => (
            <li key={q.id} className="rounded-xl border border-border bg-secondary/30 p-3">
              <div className="flex gap-2">
                <input
                  className="input flex-1"
                  placeholder="Question"
                  value={q.label}
                  onChange={(e) => updateQ(q.id, { label: e.target.value })}
                />
                <select
                  className="input w-32"
                  value={q.type}
                  onChange={(e) => updateQ(q.id, { type: e.target.value as "short" | "long" })}
                >
                  <option value="short">Short</option>
                  <option value="long">Long</option>
                </select>
                <button
                  onClick={() => removeQ(q.id)}
                  className="rounded-md p-2 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
              <label className="mt-2 inline-flex items-center gap-2 text-xs text-muted-foreground">
                <input
                  type="checkbox"
                  checked={q.required}
                  onChange={(e) => updateQ(q.id, { required: e.target.checked })}
                />
                Required
              </label>
            </li>
          ))}
        </ul>
        <button
          onClick={addQ}
          className="mt-2 inline-flex items-center gap-1.5 rounded-full border border-border px-3 py-1.5 text-xs hover:bg-secondary"
        >
          <Plus className="h-3.5 w-3.5" /> Add question
        </button>
      </Section>

      <div className="flex gap-2">
        <button
          onClick={() => save("draft")}
          className="rounded-full border border-border px-4 py-2 text-sm hover:bg-secondary"
        >
          Save as draft
        </button>
        <button
          onClick={() => save("pending")}
          disabled={!isApproved}
          className="rounded-full bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground disabled:opacity-50"
        >
          Submit for admin review
        </button>
      </div>

      <style>{`
        .input { width: 100%; border: 1px solid hsl(var(--border)); background: transparent;
                 border-radius: 0.6rem; padding: 0.5rem 0.75rem; font-size: 0.875rem; }
      `}</style>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-2xl border border-border bg-card p-5">
      <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted-foreground">{title}</h2>
      <div className="space-y-3">{children}</div>
    </section>
  );
}
function Grid({ children }: { children: React.ReactNode }) {
  return <div className="grid gap-3 sm:grid-cols-2">{children}</div>;
}
function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="grid gap-1">
      <span className="text-xs font-medium text-muted-foreground">{label}</span>
      {children}
    </label>
  );
}
