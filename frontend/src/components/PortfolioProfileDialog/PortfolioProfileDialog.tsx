import { useEffect, useState } from "react";
import type { PortfolioProfile } from "../../services/portfolioService";
import StringListField from "../StringListField/StringListField";
import PortfolioSectionDialog from "../PortfolioSectionDialog/PortfolioSectionDialog";

interface PortfolioProfileDialogProps {
  open: boolean;
  profile: PortfolioProfile;
  onClose: () => void;
  onSave: (profile: PortfolioProfile) => Promise<void>;
}

function PortfolioProfileDialog({ open, profile, onClose, onSave }: PortfolioProfileDialogProps) {
  const [draft, setDraft] = useState<PortfolioProfile>(profile);

  useEffect(() => {
    if (open) setDraft(profile);
  }, [open, profile]);

  function update(patch: Partial<PortfolioProfile>) {
    setDraft((current) => ({ ...current, ...patch }));
  }

  async function handleSubmit() {
    if (!draft.name.trim() || !draft.title.trim() || !draft.tagline.trim() || !draft.email.trim()) {
      throw new Error("Name, title, tagline, and email are required.");
    }
    if (!draft.statusLabel.trim() || !draft.yearsLabel.trim()) {
      throw new Error("Status and years labels are required.");
    }
    await onSave(draft);
  }

  return (
    <PortfolioSectionDialog
      open={open}
      title="Edit Profile"
      onClose={onClose}
      onSubmit={handleSubmit}
      successMessage="Profile updated."
    >
      <div className="flex flex-col gap-2">
        <input
          value={draft.name}
          onChange={(e) => update({ name: e.target.value })}
          placeholder="Name"
          className="rounded-md border border-[var(--border-panel)] bg-[var(--bg-app)] px-2 py-1 text-sm"
        />
        <input
          value={draft.title}
          onChange={(e) => update({ title: e.target.value })}
          placeholder="Title (e.g. UI / Frontend Developer)"
          className="rounded-md border border-[var(--border-panel)] bg-[var(--bg-app)] px-2 py-1 text-sm"
        />
        <textarea
          value={draft.tagline}
          onChange={(e) => update({ tagline: e.target.value })}
          placeholder="Tagline"
          rows={2}
          className="rounded-md border border-[var(--border-panel)] bg-[var(--bg-app)] px-2 py-1 text-sm"
        />
        <input
          value={draft.location}
          onChange={(e) => update({ location: e.target.value })}
          placeholder="Location"
          className="rounded-md border border-[var(--border-panel)] bg-[var(--bg-app)] px-2 py-1 text-sm"
        />
        <input
          value={draft.email}
          onChange={(e) => update({ email: e.target.value })}
          placeholder="Email"
          className="rounded-md border border-[var(--border-panel)] bg-[var(--bg-app)] px-2 py-1 text-sm"
        />
        <input
          value={draft.linkedin}
          onChange={(e) => update({ linkedin: e.target.value })}
          placeholder="LinkedIn URL"
          className="rounded-md border border-[var(--border-panel)] bg-[var(--bg-app)] px-2 py-1 text-sm"
        />
        <input
          value={draft.website}
          onChange={(e) => update({ website: e.target.value })}
          placeholder="Website URL"
          className="rounded-md border border-[var(--border-panel)] bg-[var(--bg-app)] px-2 py-1 text-sm"
        />

        <div className="mt-2 border-t border-[var(--border-panel)] pt-3">
          <p className="mb-2 text-xs font-medium text-[var(--color-muted)]">Status pill (shown under the tagline)</p>
          <div className="flex flex-col gap-2">
            <input
              value={draft.statusLabel}
              onChange={(e) => update({ statusLabel: e.target.value })}
              placeholder="Status (e.g. Open to good frontend work)"
              className="rounded-md border border-[var(--border-panel)] bg-[var(--bg-app)] px-2 py-1 text-sm"
            />
            <input
              value={draft.yearsLabel}
              onChange={(e) => update({ yearsLabel: e.target.value })}
              placeholder="Years label (e.g. 8+ yrs)"
              className="rounded-md border border-[var(--border-panel)] bg-[var(--bg-app)] px-2 py-1 text-sm"
            />
            <StringListField
              label="Tech highlights"
              values={draft.techHighlights}
              onChange={(techHighlights) => update({ techHighlights })}
              placeholder="e.g. React"
            />
          </div>
        </div>
      </div>
    </PortfolioSectionDialog>
  );
}

export default PortfolioProfileDialog;
