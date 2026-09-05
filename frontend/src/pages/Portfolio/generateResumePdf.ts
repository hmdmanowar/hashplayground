import { jsPDF } from "jspdf";
import type { PortfolioContentData } from "../../services/portfolioService";

// Renders the same data shown on the Portfolio page into a resume-style PDF,
// so the download always matches whatever is currently on the page — there is
// no separate hardcoded resume copy to keep in sync. `content` is whatever the
// page currently has loaded (fetched from the backend, or the local JSON/const
// fallback), never a copy re-declared here.

const PAGE_WIDTH = 210; // A4, mm
const MARGIN = 12;
const CONTENT_WIDTH = PAGE_WIDTH - MARGIN * 2;
const LINE_HEIGHT = 4.6;
const COLOR_TEXT: [number, number, number] = [30, 32, 38];
const COLOR_MUTED: [number, number, number] = [95, 99, 110];
const COLOR_ACCENT: [number, number, number] = [37, 99, 235];
const COLOR_RULE: [number, number, number] = [210, 213, 219];

// Best-effort company favicon fetch for the Experience section — used purely
// as a visual nice-to-have next to a linked company name. Google's favicon
// endpoint has no CORS allowance for arbitrary origins, so this frequently
// can't read the image bytes back; any failure here just means the PDF omits
// the logo and falls back to plain (still linked) text, never a broken build.
async function loadFaviconDataUrl(companyUrl: string): Promise<string | null> {
  try {
    const response = await fetch(`https://www.google.com/s2/favicons?sz=64&domain_url=${encodeURIComponent(companyUrl)}`);
    if (!response.ok) return null;
    const blob = await response.blob();
    return await new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = () => resolve(typeof reader.result === "string" ? reader.result : null);
      reader.onerror = () => resolve(null);
      reader.readAsDataURL(blob);
    });
  } catch {
    return null;
  }
}

function createRenderer(doc: jsPDF) {
  let y = MARGIN;

  const pageBottom = 297 - MARGIN;

  function ensureSpace(height: number) {
    if (y + height > pageBottom) {
      doc.addPage();
      y = MARGIN;
    }
  }

  function setColor(color: [number, number, number]) {
    doc.setTextColor(color[0], color[1], color[2]);
  }

  function text(value: string, options: { size?: number; bold?: boolean; italic?: boolean; color?: [number, number, number]; x?: number } = {}) {
    const { size = 10, bold = false, italic = false, color = COLOR_TEXT, x = MARGIN } = options;
    doc.setFont("helvetica", bold ? "bold" : italic ? "italic" : "normal");
    doc.setFontSize(size);
    setColor(color);
    doc.text(value, x, y);
  }

  function paragraph(value: string, options: { size?: number; color?: [number, number, number]; gap?: number } = {}) {
    const { size = 9.5, color = COLOR_MUTED, gap = LINE_HEIGHT } = options;
    doc.setFont("helvetica", "normal");
    doc.setFontSize(size);
    setColor(color);
    const lines = doc.splitTextToSize(value, CONTENT_WIDTH) as string[];
    ensureSpace(lines.length * gap);
    doc.text(lines, MARGIN, y);
    y += lines.length * gap;
  }

  function bullet(value: string) {
    const indent = 4.5;
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9.5);
    setColor(COLOR_MUTED);
    const lines = doc.splitTextToSize(value, CONTENT_WIDTH - indent) as string[];
    ensureSpace(lines.length * LINE_HEIGHT);
    setColor(COLOR_MUTED);
    doc.text("•", MARGIN, y);
    setColor(COLOR_MUTED);
    doc.text(lines, MARGIN + indent, y);
    y += lines.length * LINE_HEIGHT;
  }

  function sectionHeading(label: string) {
    ensureSpace(10);
    y += 3;
    text(label.toUpperCase(), { size: 11.5, bold: true, color: COLOR_TEXT });
    y += 1.5;
    doc.setDrawColor(COLOR_RULE[0], COLOR_RULE[1], COLOR_RULE[2]);
    doc.setLineWidth(0.4);
    doc.line(MARGIN, y, MARGIN + CONTENT_WIDTH, y);
    y += 5;
  }

  // Header contact line: email and location as plain text, LinkedIn as an
  // actual clickable link — drawn as separate runs (rather than one joined
  // string) so the link annotation can sit precisely over just that segment.
  function contactLine(email: string, linkedinUrl: string, location: string) {
    const size = 8.5;
    const separator = "   |   ";
    doc.setFont("helvetica", "normal");
    doc.setFontSize(size);
    let x = MARGIN;

    setColor(COLOR_MUTED);
    doc.text(email, x, y);
    x += doc.getTextWidth(email) + doc.getTextWidth(separator);

    const linkedinLabel = linkedinUrl.replace(/^https:\/\/(www\.)?/, "");
    setColor(COLOR_MUTED);
    doc.text(linkedinLabel, x, y);
    doc.link(x, y - 3, doc.getTextWidth(linkedinLabel), 3.6, { url: linkedinUrl });
    x += doc.getTextWidth(linkedinLabel) + doc.getTextWidth(separator);

    setColor(COLOR_MUTED);
    doc.text(location, x, y);
  }

  function row(left: string, right: string, options: { leftBold?: boolean; size?: number; url?: string } = {}) {
    const { leftBold = true, size = 10, url } = options;
    ensureSpace(LINE_HEIGHT + 1);
    doc.setFont("helvetica", leftBold ? "bold" : "normal");
    doc.setFontSize(size);
    setColor(url ? COLOR_ACCENT : COLOR_TEXT);
    doc.text(left, MARGIN, y);
    if (url) {
      doc.link(MARGIN, y - 3.4, doc.getTextWidth(left), 4.2, { url });
    }
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8.5);
    setColor(COLOR_MUTED);
    doc.text(right, MARGIN + CONTENT_WIDTH, y, { align: "right" });
    y += LINE_HEIGHT;
  }

  // Experience-entry header line: bold role, an optional small company-logo
  // image, and a linked company name, with the dates right-aligned — kept as
  // its own function since it mixes an image with two differently-styled
  // text runs on one baseline, which the generic `row()` can't express.
  function experienceHeader(role: string, company: string, companyUrl: string | undefined, logoDataUrl: string | null, dates: string) {
    const logoSize = 3.6;
    ensureSpace(LINE_HEIGHT + 1);
    let x = MARGIN;

    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    setColor(COLOR_TEXT);
    const prefix = `${role} — `;
    doc.text(prefix, x, y);
    x += doc.getTextWidth(prefix);

    if (logoDataUrl) {
      try {
        doc.addImage(logoDataUrl, x, y - logoSize + 0.9, logoSize, logoSize);
        x += logoSize + 1.3;
      } catch {
        // Malformed/undecodable image data — skip it, company text still renders.
      }
    }

    setColor(companyUrl ? COLOR_ACCENT : COLOR_TEXT);
    doc.text(company, x, y);
    if (companyUrl) {
      doc.link(x, y - 3.4, doc.getTextWidth(company), 4.2, { url: companyUrl });
    }

    doc.setFont("helvetica", "normal");
    doc.setFontSize(8.5);
    setColor(COLOR_MUTED);
    doc.text(dates, MARGIN + CONTENT_WIDTH, y, { align: "right" });

    y += LINE_HEIGHT;
  }

  function tagRow(labels: string[]) {
    const gap = 3.6;
    const paddingX = 2.6;
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    ensureSpace(6.6);
    let x = MARGIN;
    const rowHeight = 6.4;
    for (const label of labels) {
      const width = doc.getTextWidth(label) + paddingX * 2;
      if (x + width > MARGIN + CONTENT_WIDTH) {
        x = MARGIN;
        y += rowHeight;
        ensureSpace(rowHeight);
      }
      doc.setDrawColor(COLOR_RULE[0], COLOR_RULE[1], COLOR_RULE[2]);
      doc.setFillColor(246, 247, 249);
      doc.roundedRect(x, y - 3.6, width, 4.6, 1.2, 1.2, "FD");
      setColor(COLOR_MUTED);
      doc.text(label, x + paddingX, y - 0.3);
      x += width + gap;
    }
    y += rowHeight;
  }

  function spacer(amount = 3) {
    y += amount;
  }

  return { text, paragraph, bullet, sectionHeading, row, contactLine, experienceHeader, tagRow, spacer, get y() { return y; }, set y(value: number) { y = value; } };
}

export async function buildResumePdf(content: PortfolioContentData): Promise<jsPDF> {
  const { profile, summaryParagraphs, experience, project, education, skillGroups } = content;

  // Fetch every company logo up front (in parallel) rather than per-entry —
  // a sequential await per job would otherwise serialize several network
  // round trips and make the download button feel sluggish.
  const experienceLogos = await Promise.all(
    experience.map((job) => (job.companyUrl ? loadFaviconDataUrl(job.companyUrl) : Promise.resolve(null))),
  );

  const doc = new jsPDF({ unit: "mm", format: "a4" });
  const r = createRenderer(doc);

  r.text(profile.name, { size: 19, bold: true });
  r.y += 6;
  r.text(profile.title, { size: 11, color: COLOR_ACCENT });
  r.y += 5.5;

  r.contactLine(profile.email, profile.linkedin, profile.location);
  r.y += 4;

  r.sectionHeading("Summary");
  summaryParagraphs.forEach((paragraph) => r.paragraph(paragraph));
  r.spacer(1);

  r.sectionHeading("Experience");
  experience.forEach((job, index) => {
    if (index > 0) r.spacer(3);
    r.experienceHeader(job.role, job.company, job.companyUrl, experienceLogos[index], job.dates);
    r.paragraph(job.location, { size: 8.5, gap: 4 });
    r.spacer(1);
    job.bullets.forEach((bullet) => r.bullet(bullet));
    r.spacer(1.5);
    r.tagRow(job.tags);
  });
  r.spacer(1);

  r.sectionHeading("Featured Project");
  r.row(project.name, project.url.replace("https://", ""), { url: project.url });
  r.paragraph(project.description);
  r.spacer(0.5);
  project.features.forEach((feature) => r.bullet(feature));
  r.spacer(1);
  r.tagRow(project.stack);
  r.spacer(1);

  r.sectionHeading("Education");
  education.forEach((entry) => {
    r.row(entry.school, entry.dates);
    r.paragraph(entry.degree, { size: 8.5, gap: 4 });
    r.spacer(1);
  });

  r.sectionHeading("Skills");
  skillGroups.forEach((group) => {
    r.text(group.label, { size: 9, bold: true, color: COLOR_TEXT });
    r.y += 4.5;
    r.spacer(1);
    r.tagRow(group.skills);
    r.spacer(1.5);
  });

  return doc;
}

export async function downloadResumePdf(content: PortfolioContentData): Promise<void> {
  const doc = await buildResumePdf(content);
  const fileName = `${content.profile.name.replace(/\s+/g, "-")}-Resume.pdf`;
  doc.save(fileName);
}
