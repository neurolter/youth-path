import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { orgStore, newId, type Organizer } from "@/lib/organizer";
import { ShieldCheck } from "lucide-react";

export const Route = createFileRoute("/organizer/register")({
  component: Register,
});

const ORG_TYPES = [
  "NGO",
  "University",
  "Embassy",
  "Company",
  "International organization",
  "Foundation",
  "Government",
  "Event organizer",
  "Other",
];

function Register() {
  const navigate = useNavigate();
  const [existing, setExisting] = useState<Organizer | null>(null);
  const [form, setForm] = useState({
    orgName: "",
    orgType: ORG_TYPES[0],
    website: "",
    officialEmail: "",
    country: "",
    contactPerson: "",
    proof: "",
  });

  useEffect(() => {
    const id = orgStore.currentOrgId();
    const m = orgStore.organizers().find((o) => o.id === id);
    if (m) {
      setExisting(m);
      setForm({
        orgName: m.orgName,
        orgType: m.orgType,
        website: m.website,
        officialEmail: m.officialEmail,
        country: m.country,
        contactPerson: m.contactPerson,
        proof: m.proof,
      });
    }
  }, []);

  const submit = () => {
    if (!form.orgName || !form.officialEmail || !form.country || !form.contactPerson) {
      alert("Please complete all required fields.");
      return;
    }
    const all = orgStore.organizers();
    if (existing) {
      const updated: Organizer = {
        ...existing,
        ...form,
        status: existing.status === "rejected" ? "pending" : existing.status,
      };
      orgStore.setOrganizers(all.map((o) => (o.id === existing.id ? updated : o)));
    } else {
      const o: Organizer = {
        id: newId(),
        ...form,
        status: "pending",
        createdAt: new Date().toISOString(),
      };
      orgStore.setOrganizers([...all, o]);
      orgStore.setCurrentOrgId(o.id);
    }
    navigate({ to: "/organizer" });
  };

  return (
    <div className="mx-auto max-w-2xl">
      <div className="mb-4 flex items-center gap-2">
        <ShieldCheck className="h-5 w-5 text-primary" />
        <h1 className="text-xl font-semibold">Organization verification</h1>
      </div>
      <p className="text-sm text-muted-foreground">
        Only verified organizers can publish public opportunities. Submit accurate information —
        admins will review before your events become visible to young leaders.
      </p>

      <div className="mt-6 grid gap-3 rounded-2xl border border-border bg-card p-5">
        <Field label="Organization name *">
          <input
            value={form.orgName}
            onChange={(e) => setForm({ ...form, orgName: e.target.value })}
            className="input"
          />
        </Field>
        <Field label="Organization type *">
          <select
            value={form.orgType}
            onChange={(e) => setForm({ ...form, orgType: e.target.value })}
            className="input"
          >
            {ORG_TYPES.map((t) => (
              <option key={t}>{t}</option>
            ))}
          </select>
        </Field>
        <Field label="Official website">
          <input
            value={form.website}
            onChange={(e) => setForm({ ...form, website: e.target.value })}
            placeholder="https://"
            className="input"
          />
        </Field>
        <Field label="Official email *">
          <input
            value={form.officialEmail}
            onChange={(e) => setForm({ ...form, officialEmail: e.target.value })}
            placeholder="contact@yourorg.org"
            className="input"
          />
        </Field>
        <Field label="Country *">
          <input
            value={form.country}
            onChange={(e) => setForm({ ...form, country: e.target.value })}
            className="input"
          />
        </Field>
        <Field label="Contact person *">
          <input
            value={form.contactPerson}
            onChange={(e) => setForm({ ...form, contactPerson: e.target.value })}
            className="input"
          />
        </Field>
        <Field label="Proof of legitimacy (link to registration, official page, or short note)">
          <textarea
            value={form.proof}
            onChange={(e) => setForm({ ...form, proof: e.target.value })}
            rows={3}
            className="input"
          />
        </Field>
        <button
          onClick={submit}
          className="mt-2 rounded-full bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground"
        >
          {existing ? "Update verification" : "Submit for review"}
        </button>
      </div>

      <style>{`
        .input { width: 100%; border: 1px solid hsl(var(--border)); background: transparent;
                 border-radius: 0.6rem; padding: 0.5rem 0.75rem; font-size: 0.875rem; }
      `}</style>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="grid gap-1">
      <span className="text-xs font-medium text-muted-foreground">{label}</span>
      {children}
    </label>
  );
}
