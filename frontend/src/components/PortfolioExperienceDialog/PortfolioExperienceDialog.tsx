import { useEffect, useState } from "react";
import type { PortfolioExperienceEntry } from "../../services/portfolioService";
import StringListField from "../StringListField/StringListField";
import PortfolioSectionDialog from "../PortfolioSectionDialog/PortfolioSectionDialog";
import { PlusIcon, TrashIcon, ChevronDownIcon } from "../Icons/Icons";

interface PortfolioExperienceDialogProps {
  open: boolean;
  experience: PortfolioExperienceEntry[];
  onClose: () => void;
  onSave: (experience: PortfolioExperienceEntry[]) => Promise<void>;
}

const BLANK_ENTRY: PortfolioExperienceEntry = {
  role: "",
  company: "",
  companyUrl: "",
  dates: "",
  location: "",
  current: false,
  bullets: [],
  tags: [],
};

function PortfolioExperienceDialog({ open, experience, onClose, onSave }: PortfolioExperienceDialogProps) {
  const [entries, setEntries] = useState<PortfolioExperienceEntry[]>(experience);
  // Parallel to `entries` by index — kept in sync on add/remove below so
  // collapsing one entry doesn't shift onto the wrong one.
  const [expanded, setExpanded] = useState<boolean[]>(() => experience.map(() => false));

  // Reset the local draft to the latest saved content each time the dialog opens.
  useEffect(() => {
    if (open) {
      setEntries(experience);
      setExpanded(experience.map(() => false));
    }
  }, [open, experience]);

  function updateEntry(index: number, patch: Partial<PortfolioExperienceEntry>) {
    setEntries((current) => current.map((entry, i) => (i === index ? { ...entry, ...patch } : entry)));
  }

  function removeEntry(index: number) {
    setEntries((current) => current.filter((_, i) => i !== index));
    setExpanded((current) => current.filter((_, i) => i !== index));
  }

  function addEntry() {
    setEntries((current) => [...current, { ...BLANK_ENTRY }]);
    setExpanded((current) => [...current, true]);
  }

  function toggleExpanded(index: number) {
    setExpanded((current) => current.map((value, i) => (i === index ? !value : value)));
  }

  async function handleSubmit() {
    if (entries.some((entry) => !entry.role.trim() || !entry.company.trim())) {
      throw new Error("Every entry needs at least a role and a company.");
    }
    await onSave(entries);
  }

  return (
    <PortfolioSectionDialog
      open={open}
      title="Edit Experience"
      onClose={onClose}
      onSubmit={handleSubmit}
      successMessage="Experience section updated."
    >
      <div className="flex flex-col gap-5">
        {entries.map((entry, index) => {
          const isOpen = expanded[index] ?? false;
          const summary = entry.role.trim() && entry.company.trim() ? `${entry.role} — ${entry.company}` : "New entry";
          return (
            <div key={index} className="rounded-lg border border-[var(--border-panel)] bg-[var(--bg-app)]">
              <div className="flex items-center gap-2 p-4">
                <button
                  type="button"
                  onClick={() => toggleExpanded(index)}
                  aria-expanded={isOpen}
                  className="flex flex-1 cursor-pointer items-center gap-2 text-left"
                >
                  <ChevronDownIcon
                    className={`h-4 w-4 shrink-0 text-[var(--color-muted)] transition-transform ${isOpen ? "rotate-180" : ""}`}
                  />
                  <span className="flex-1 truncate text-sm font-medium">{summary}</span>
                  {entry.dates && (
                    <span className="hidden shrink-0 font-mono text-xs text-[var(--color-muted)] sm:inline">
                      {entry.dates}
                    </span>
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => removeEntry(index)}
                  aria-label="Remove this experience entry"
                  className="shrink-0 cursor-pointer text-[var(--color-muted)] hover:text-red-500"
                >
                  <TrashIcon className="h-4 w-4" />
                </button>
              </div>

              {isOpen && (
                <div className="border-t border-[var(--border-panel)] p-4">
                  <div className="grid flex-1 grid-cols-1 gap-2 sm:grid-cols-2">
                    <input
                      value={entry.role}
                      onChange={(e) => updateEntry(index, { role: e.target.value })}
                      placeholder="Role"
                      className="rounded-md border border-[var(--border-panel)] bg-[var(--bg-panel)] px-2 py-1 text-sm"
                    />
                    <input
                      value={entry.company}
                      onChange={(e) => updateEntry(index, { company: e.target.value })}
                      placeholder="Company"
                      className="rounded-md border border-[var(--border-panel)] bg-[var(--bg-panel)] px-2 py-1 text-sm"
                    />
                    <input
                      value={entry.companyUrl ?? ""}
                      onChange={(e) => updateEntry(index, { companyUrl: e.target.value })}
                      placeholder="Company URL (e.g. https://company.com)"
                      className="rounded-md border border-[var(--border-panel)] bg-[var(--bg-panel)] px-2 py-1 text-sm"
                    />
                    <input
                      value={entry.dates}
                      onChange={(e) => updateEntry(index, { dates: e.target.value })}
                      placeholder="Dates (e.g. Aug 2022 – Present)"
                      className="rounded-md border border-[var(--border-panel)] bg-[var(--bg-panel)] px-2 py-1 text-sm"
                    />
                    <input
                      value={entry.location}
                      onChange={(e) => updateEntry(index, { location: e.target.value })}
                      placeholder="Location"
                      className="rounded-md border border-[var(--border-panel)] bg-[var(--bg-panel)] px-2 py-1 text-sm"
                    />
                  </div>

                  <label className="mt-2 flex items-center gap-1.5 text-xs text-[var(--color-muted)]">
                    <input
                      type="checkbox"
                      checked={entry.current}
                      onChange={(e) => updateEntry(index, { current: e.target.checked })}
                    />
                    Current role
                  </label>

                  <div className="mt-3 grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <StringListField
                      label="Bullets"
                      values={entry.bullets}
                      onChange={(bullets) => updateEntry(index, { bullets })}
                      placeholder="Describe an accomplishment…"
                      multiline
                    />
                    <StringListField
                      label="Tags"
                      values={entry.tags}
                      onChange={(tags) => updateEntry(index, { tags })}
                      placeholder="e.g. React"
                    />
                  </div>
                </div>
              )}
            </div>
          );
        })}

        <button
          type="button"
          onClick={addEntry}
          className="flex cursor-pointer items-center justify-center gap-1.5 rounded-lg border border-dashed border-[var(--border-panel)] py-2.5 text-sm font-medium text-[var(--color-muted)] hover:border-[var(--color-primary)] hover:text-[var(--color-primary)]"
        >
          <PlusIcon className="h-4 w-4" />
          Add experience entry
        </button>
      </div>
    </PortfolioSectionDialog>
  );
}

export default PortfolioExperienceDialog;
