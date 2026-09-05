import { useEffect, useState } from "react";
import StringListField from "../StringListField/StringListField";
import PortfolioSectionDialog from "../PortfolioSectionDialog/PortfolioSectionDialog";

interface PortfolioAboutDialogProps {
  open: boolean;
  summaryParagraphs: string[];
  onClose: () => void;
  onSave: (summaryParagraphs: string[]) => Promise<void>;
}

function PortfolioAboutDialog({ open, summaryParagraphs, onClose, onSave }: PortfolioAboutDialogProps) {
  const [paragraphs, setParagraphs] = useState<string[]>(summaryParagraphs);

  useEffect(() => {
    if (open) setParagraphs(summaryParagraphs);
  }, [open, summaryParagraphs]);

  async function handleSubmit() {
    const cleaned = paragraphs.map((p) => p.trim()).filter(Boolean);
    if (cleaned.length === 0) throw new Error("Add at least one paragraph.");
    await onSave(cleaned);
  }

  return (
    <PortfolioSectionDialog open={open} title="Edit About" onClose={onClose} onSubmit={handleSubmit} successMessage="About section updated.">
      <StringListField label="Paragraphs" values={paragraphs} onChange={setParagraphs} placeholder="Write a paragraph…" multiline />
    </PortfolioSectionDialog>
  );
}

export default PortfolioAboutDialog;
