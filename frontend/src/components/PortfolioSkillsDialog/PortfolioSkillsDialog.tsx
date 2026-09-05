import { useEffect, useState } from "react";
import type { PortfolioSkillGroup } from "../../services/portfolioService";
import StringListField from "../StringListField/StringListField";
import PortfolioSectionDialog from "../PortfolioSectionDialog/PortfolioSectionDialog";
import { PlusIcon, TrashIcon } from "../Icons/Icons";

interface PortfolioSkillsDialogProps {
  open: boolean;
  skillGroups: PortfolioSkillGroup[];
  onClose: () => void;
  onSave: (skillGroups: PortfolioSkillGroup[]) => Promise<void>;
}

const BLANK_GROUP: PortfolioSkillGroup = { label: "", skills: [] };

function PortfolioSkillsDialog({ open, skillGroups, onClose, onSave }: PortfolioSkillsDialogProps) {
  const [groups, setGroups] = useState<PortfolioSkillGroup[]>(skillGroups);

  useEffect(() => {
    if (open) setGroups(skillGroups);
  }, [open, skillGroups]);

  function updateGroup(index: number, patch: Partial<PortfolioSkillGroup>) {
    setGroups((current) => current.map((group, i) => (i === index ? { ...group, ...patch } : group)));
  }

  function removeGroup(index: number) {
    setGroups((current) => current.filter((_, i) => i !== index));
  }

  function addGroup() {
    setGroups((current) => [...current, { ...BLANK_GROUP }]);
  }

  async function handleSubmit() {
    if (groups.some((group) => !group.label.trim())) {
      throw new Error("Every skill group needs a label.");
    }
    await onSave(groups);
  }

  return (
    <PortfolioSectionDialog
      open={open}
      title="Edit Skills"
      onClose={onClose}
      onSubmit={handleSubmit}
      successMessage="Skills section updated."
    >
      <div className="flex flex-col gap-4">
        {groups.map((group, index) => (
          <div key={index} className="rounded-lg border border-[var(--border-panel)] bg-[var(--bg-app)] p-4">
            <div className="flex items-start gap-2">
              <input
                value={group.label}
                onChange={(e) => updateGroup(index, { label: e.target.value })}
                placeholder="Group label (e.g. Core Languages)"
                className="flex-1 rounded-md border border-[var(--border-panel)] bg-[var(--bg-panel)] px-2 py-1 text-sm font-medium"
              />
              <button
                type="button"
                onClick={() => removeGroup(index)}
                aria-label="Remove this skill group"
                className="shrink-0 cursor-pointer text-[var(--color-muted)] hover:text-red-500"
              >
                <TrashIcon className="h-4 w-4" />
              </button>
            </div>
            <div className="mt-3">
              <StringListField
                label="Badges"
                values={group.skills}
                onChange={(skills) => updateGroup(index, { skills })}
                placeholder="e.g. TypeScript"
              />
            </div>
          </div>
        ))}

        <button
          type="button"
          onClick={addGroup}
          className="flex cursor-pointer items-center justify-center gap-1.5 rounded-lg border border-dashed border-[var(--border-panel)] py-2.5 text-sm font-medium text-[var(--color-muted)] hover:border-[var(--color-primary)] hover:text-[var(--color-primary)]"
        >
          <PlusIcon className="h-4 w-4" />
          Add skill group
        </button>
      </div>
    </PortfolioSectionDialog>
  );
}

export default PortfolioSkillsDialog;
