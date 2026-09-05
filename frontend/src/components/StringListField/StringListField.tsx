import { PlusIcon, TrashIcon } from "../Icons/Icons";

interface StringListFieldProps {
  label: string;
  values: string[];
  onChange: (values: string[]) => void;
  placeholder?: string;
  multiline?: boolean;
}

// Reusable add/edit/remove-row editor for a list of plain strings — used for
// experience bullets/tags today, and reusable later for skill badges,
// project features/stack, etc. without duplicating this UI each time.
function StringListField({ label, values, onChange, placeholder, multiline = false }: StringListFieldProps) {
  function updateAt(index: number, value: string) {
    onChange(values.map((entry, i) => (i === index ? value : entry)));
  }

  function removeAt(index: number) {
    onChange(values.filter((_, i) => i !== index));
  }

  function addRow() {
    onChange([...values, ""]);
  }

  const InputTag = multiline ? "textarea" : "input";

  return (
    <div>
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-[var(--color-muted)]">{label}</span>
        <button
          type="button"
          onClick={addRow}
          className="flex cursor-pointer items-center gap-1 text-xs font-medium text-[var(--color-primary-strong)] hover:underline"
        >
          <PlusIcon className="h-3 w-3" />
          Add
        </button>
      </div>
      <div className="mt-1.5 flex flex-col gap-1.5">
        {values.map((value, index) => (
          <div key={index} className="flex items-start gap-1.5">
            <InputTag
              value={value}
              onChange={(event) => updateAt(index, event.target.value)}
              placeholder={placeholder}
              rows={multiline ? 2 : undefined}
              className="min-w-0 flex-1 rounded-md border border-[var(--border-panel)] bg-[var(--bg-app)] px-2 py-1 text-xs"
            />
            <button
              type="button"
              onClick={() => removeAt(index)}
              aria-label={`Remove ${label} item`}
              className="mt-0.5 shrink-0 cursor-pointer text-[var(--color-muted)] hover:text-red-500"
            >
              <TrashIcon className="h-3.5 w-3.5" />
            </button>
          </div>
        ))}
        {values.length === 0 && <p className="text-xs italic text-[var(--color-muted)]">None yet.</p>}
      </div>
    </div>
  );
}

export default StringListField;
