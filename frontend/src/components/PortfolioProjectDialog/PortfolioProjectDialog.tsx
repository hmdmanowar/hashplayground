import { useEffect, useState } from "react";
import type { PortfolioProject } from "../../services/portfolioService";
import StringListField from "../StringListField/StringListField";
import PortfolioSectionDialog from "../PortfolioSectionDialog/PortfolioSectionDialog";

interface PortfolioProjectDialogProps {
  open: boolean;
  project: PortfolioProject;
  onClose: () => void;
  onSave: (project: PortfolioProject) => Promise<void>;
}

function PortfolioProjectDialog({ open, project, onClose, onSave }: PortfolioProjectDialogProps) {
  const [draft, setDraft] = useState<PortfolioProject>(project);

  useEffect(() => {
    if (open) setDraft(project);
  }, [open, project]);

  function update(patch: Partial<PortfolioProject>) {
    setDraft((current) => ({ ...current, ...patch }));
  }

  async function handleSubmit() {
    if (!draft.name.trim() || !draft.url.trim() || !draft.description.trim()) {
      throw new Error("Name, URL, and description are required.");
    }
    await onSave(draft);
  }

  return (
    <PortfolioSectionDialog
      open={open}
      title="Edit Featured Build"
      onClose={onClose}
      onSubmit={handleSubmit}
      successMessage="Featured Build section updated."
    >
      <div className="flex flex-col gap-4">
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          <input
            value={draft.name}
            onChange={(e) => update({ name: e.target.value })}
            placeholder="Project name"
            className="rounded-md border border-[var(--border-panel)] bg-[var(--bg-app)] px-2 py-1 text-sm"
          />
          <input
            value={draft.url}
            onChange={(e) => update({ url: e.target.value })}
            placeholder="URL"
            className="rounded-md border border-[var(--border-panel)] bg-[var(--bg-app)] px-2 py-1 text-sm"
          />
        </div>
        <textarea
          value={draft.description}
          onChange={(e) => update({ description: e.target.value })}
          placeholder="Description"
          rows={3}
          className="rounded-md border border-[var(--border-panel)] bg-[var(--bg-app)] px-2 py-1 text-sm"
        />
        <textarea
          value={draft.note}
          onChange={(e) => update({ note: e.target.value })}
          placeholder="Closing note (e.g. how it was built)"
          rows={2}
          className="rounded-md border border-[var(--border-panel)] bg-[var(--bg-app)] px-2 py-1 text-sm"
        />
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <StringListField label="Features" values={draft.features} onChange={(features) => update({ features })} placeholder="A feature highlight…" multiline />
          <StringListField label="Stack" values={draft.stack} onChange={(stack) => update({ stack })} placeholder="e.g. React 18" />
        </div>
      </div>
    </PortfolioSectionDialog>
  );
}

export default PortfolioProjectDialog;
