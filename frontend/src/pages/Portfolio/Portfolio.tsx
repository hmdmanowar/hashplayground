import { useEffect, useState } from "react";
import {
  EnvelopeIcon,
  LinkedInIcon,
  GitBranchIcon,
  GraduationCapIcon,
  LayersIcon,
  TerminalIcon,
  CheckCircleIcon,
  ExternalLinkIcon,
  DownloadIcon,
  PencilIcon,
  BuildingIcon,
} from "../../components/Icons/Icons";
import HeroCanvas from "../../components/HeroCanvas/HeroCanvas";
import { downloadResumePdf } from "./generateResumePdf";
import { useIsTopAdmin } from "../../hooks/useIsTopAdmin";
import { getPortfolioContent, updatePortfolioContent, type PortfolioContentData } from "../../services/portfolioService";
import PortfolioExperienceDialog from "../../components/PortfolioExperienceDialog/PortfolioExperienceDialog";
import PortfolioAboutDialog from "../../components/PortfolioAboutDialog/PortfolioAboutDialog";
import PortfolioProjectDialog from "../../components/PortfolioProjectDialog/PortfolioProjectDialog";
import PortfolioSkillsDialog from "../../components/PortfolioSkillsDialog/PortfolioSkillsDialog";
import PortfolioProfileDialog from "../../components/PortfolioProfileDialog/PortfolioProfileDialog";
import DEFAULT_CONTENT from "./portfolioDefaults.json";

const CONTENT: PortfolioContentData = DEFAULT_CONTENT;

const SECTIONS = [
  { id: "about", label: "About" },
  { id: "experience", label: "Experience" },
  { id: "build", label: "Featured Build" },
  { id: "education", label: "Education" },
  { id: "skills", label: "Skills" },
  { id: "contact", label: "Contact" },
];

function Tag({ label }: { label: string }) {
  return (
    <span className="rounded-full border border-[var(--chip-border)] bg-[var(--chip-bg)] px-2.5 py-1 font-mono text-[11px] text-[var(--color-muted)]">
      {label}
    </span>
  );
}

function SkeletonBlock({ className = "" }: { className?: string }) {
  return <div className={`animate-pulse rounded-lg bg-[var(--bg-panel)] ${className}`} aria-hidden="true" />;
}

// Shown in place of the real sections while the initial content fetch is in
// flight, sized to roughly match each section's real height — this replaces
// the previous "flash the bundled defaults, then swap for the fetched data"
// behavior, which could visibly jump the page height once the real content
// (of a different length) arrived.
function PortfolioSkeleton() {
  return (
    <div className="relative mx-auto max-w-4xl pb-16" style={{ paddingInline: "15px" }}>
      <div className="py-10 text-center">
        <SkeletonBlock className="mx-auto h-3 w-20" />
        <SkeletonBlock className="mx-auto mt-4 h-8 w-72 max-w-full" />
        <SkeletonBlock className="mx-auto mt-4 h-4 w-full max-w-xl" />
        <SkeletonBlock className="mx-auto mt-2 h-4 w-2/3 max-w-xl" />
        <SkeletonBlock className="mx-auto mt-6 h-9 w-full max-w-xl rounded-full" />
        <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
          <SkeletonBlock className="h-10 w-28 rounded-full" />
          <SkeletonBlock className="h-10 w-28 rounded-full" />
          <SkeletonBlock className="h-10 w-36 rounded-full" />
          <SkeletonBlock className="h-10 w-36 rounded-full" />
        </div>
      </div>

      <div className="mb-8 flex flex-wrap justify-center gap-1.5 border-b border-[var(--border-panel)] py-3">
        {SECTIONS.map((section) => (
          <SkeletonBlock key={section.id} className="h-6 w-20 rounded-full" />
        ))}
      </div>

      <div className="py-6">
        <SkeletonBlock className="h-7 w-28" />
        <SkeletonBlock className="mt-4 h-24 w-full" />
      </div>

      <div className="py-6">
        <SkeletonBlock className="h-7 w-36" />
        <div className="mt-4 flex flex-col gap-4">
          <SkeletonBlock className="h-44 w-full" />
          <SkeletonBlock className="h-44 w-full" />
          <SkeletonBlock className="h-32 w-full" />
        </div>
      </div>

      <div className="py-6">
        <SkeletonBlock className="h-7 w-44" />
        <SkeletonBlock className="mt-4 h-72 w-full" />
      </div>

      <div className="py-6">
        <SkeletonBlock className="h-7 w-32" />
        <SkeletonBlock className="mt-4 h-20 w-full" />
      </div>

      <div className="py-6">
        <SkeletonBlock className="h-7 w-20" />
        <div className="mt-4 flex flex-col gap-4">
          <SkeletonBlock className="h-16 w-full" />
          <SkeletonBlock className="h-16 w-full" />
          <SkeletonBlock className="h-16 w-full" />
        </div>
      </div>

      <div className="py-6">
        <SkeletonBlock className="h-7 w-28" />
        <SkeletonBlock className="mt-4 h-20 w-full" />
      </div>
    </div>
  );
}

function Portfolio() {
  const [content, setContent] = useState<PortfolioContentData>(CONTENT);
  const [isLoading, setIsLoading] = useState(true);
  const [downloading, setDownloading] = useState(false);
  const [editingExperience, setEditingExperience] = useState(false);
  const [editingAbout, setEditingAbout] = useState(false);
  const [editingProject, setEditingProject] = useState(false);
  const [editingSkills, setEditingSkills] = useState(false);
  const [editingProfile, setEditingProfile] = useState(false);
  const isTopAdmin = useIsTopAdmin();
  const { profile, summaryParagraphs, experience, project, education, skillGroups } = content;

  useEffect(() => {
    getPortfolioContent()
      .then((result) => {
        if (result.data) setContent(result.data);
      })
      .catch(() => {
        // Backend unreachable or no content saved yet — keep showing the
        // bundled defaults (portfolioDefaults.json) rather than an error.
      })
      .finally(() => setIsLoading(false));
  }, []);

  const handleDownloadResume = async () => {
    if (downloading) return;
    setDownloading(true);
    try {
      await downloadResumePdf(content);
    } finally {
      setDownloading(false);
    }
  };

  const handleSaveExperience = async (updatedExperience: PortfolioContentData["experience"]) => {
    const result = await updatePortfolioContent({ ...content, experience: updatedExperience });
    if (result.data) setContent(result.data);
  };

  const handleSaveAbout = async (updatedSummaryParagraphs: string[]) => {
    const result = await updatePortfolioContent({ ...content, summaryParagraphs: updatedSummaryParagraphs });
    if (result.data) setContent(result.data);
  };

  const handleSaveProject = async (updatedProject: PortfolioContentData["project"]) => {
    const result = await updatePortfolioContent({ ...content, project: updatedProject });
    if (result.data) setContent(result.data);
  };

  const handleSaveSkills = async (updatedSkillGroups: PortfolioContentData["skillGroups"]) => {
    const result = await updatePortfolioContent({ ...content, skillGroups: updatedSkillGroups });
    if (result.data) setContent(result.data);
  };

  const handleSaveProfile = async (updatedProfile: PortfolioContentData["profile"]) => {
    const result = await updatePortfolioContent({ ...content, profile: updatedProfile });
    if (result.data) setContent(result.data);
  };

  useEffect(() => {
    // Structured data (schema.org Person) — lets search engines understand this
    // page as a person's profile rather than generic app content, which is what
    // powers a knowledge-panel-style rich result. Injected on mount rather than
    // living in index.html since it's specific to this one route.
    const personJsonLd = {
      "@context": "https://schema.org",
      "@type": "Person",
      name: profile.name,
      jobTitle: profile.title,
      url: `${profile.website}/portfolio`,
      email: `mailto:${profile.email}`,
      address: {
        "@type": "PostalAddress",
        addressLocality: "Bengaluru",
        addressRegion: "Karnataka",
        addressCountry: "IN",
      },
      worksFor: {
        "@type": "Organization",
        name: "Alphastream.Ai",
      },
      alumniOf: {
        "@type": "CollegeOrUniversity",
        name: "R.V.S. College of Engineering and Technology, Jamshedpur",
      },
      knowsAbout: ["React", "TypeScript", "JavaScript", "React Native", "HTML5", "CSS3", "REST APIs"],
      sameAs: [profile.linkedin],
    };

    const script = document.createElement("script");
    script.type = "application/ld+json";
    script.text = JSON.stringify(personJsonLd);
    document.head.appendChild(script);
    return () => {
      document.head.removeChild(script);
    };
  }, [profile]);

  return (
    <div className="relative min-h-full">
      <div className="fixed inset-0 -z-10">
        <div
          className="absolute inset-0 overflow-hidden opacity-30"
          style={{
            backgroundImage:
              "linear-gradient(to right, var(--border-panel) 1px, transparent 1px), linear-gradient(to bottom, var(--border-panel) 1px, transparent 1px)",
            backgroundSize: "28px 28px",
            maskImage: "radial-gradient(circle, black, transparent 75%)",
            WebkitMaskImage: "radial-gradient(circle, black, transparent 75%)",
          }}
        >
          <div className="grid-glow" aria-hidden="true" />
        </div>
        <HeroCanvas />
      </div>

      {isLoading ? (
        <PortfolioSkeleton />
      ) : (
      <div className="relative mx-auto max-w-4xl pb-16" style={{ paddingInline: "15px" }}>
        <div className="relative py-10 text-center">
          {/* {isTopAdmin && (
            <button
              type="button"
              onClick={() => setEditingProfile(true)}
              aria-label="Edit profile"
              className="absolute right-0 top-8 flex cursor-pointer items-center gap-1.5 rounded-full border border-[var(--border-panel)] bg-[var(--bg-panel)] px-3 py-1.5 text-xs font-medium text-[var(--color-muted)] transition-colors hover:border-[var(--color-primary)] hover:text-[var(--color-primary)]"
            >
              <PencilIcon className="h-3.5 w-3.5" />
              Edit
            </button>
          )} */}
          <p className="text-xs font-semibold uppercase tracking-widest text-[var(--color-primary)]">Portfolio</p>
          <h1 className="mt-3 text-3xl font-bold sm:text-4xl">{profile.name}</h1>
          <p className="mx-auto mt-3 max-w-xl text-sm text-[var(--color-muted)] sm:text-base">{profile.tagline}</p>

          <div className="mx-auto mt-6 flex max-w-xl flex-wrap items-center justify-center gap-2 rounded-full border border-[var(--border-panel)] bg-[var(--bg-panel)] px-4 py-2 font-mono text-xs text-[var(--color-muted)]">
            <span className="flex items-center gap-1.5">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" aria-hidden="true" />
              {profile.statusLabel}
            </span>
            <span className="text-[var(--border-panel)]">·</span>
            <span>{profile.location}</span>
            <span className="text-[var(--border-panel)]">·</span>
            <span>{profile.techHighlights.join(" · ")}</span>
            <span className="text-[var(--border-panel)]">·</span>
            <span>{profile.yearsLabel}</span>
            {isTopAdmin && (
              <>
                <span className="text-[var(--border-panel)]">·</span>
                <button
                  type="button"
                  onClick={() => setEditingProfile(true)}
                  aria-label="Edit profile"
                  className="flex cursor-pointer items-center gap-1 text-[var(--color-muted)] hover:text-[var(--color-primary)]"
                >
                  <PencilIcon className="h-3 w-3" />
                  Edit
                </button>
              </>
            )}
          </div>

          <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
            <a
              href={`mailto:${profile.email}`}
              className="flex items-center gap-1.5 rounded-full bg-[var(--color-primary-strong)] px-4 py-2 text-sm font-medium text-white transition-colors hover:opacity-90"
            >
              <EnvelopeIcon className="h-3.5 w-3.5" />
              Email me
            </a>
            <a
              href={profile.linkedin}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 rounded-full border border-[var(--border-panel)] bg-[var(--bg-panel)] px-4 py-2 text-sm font-medium transition-colors hover:border-[var(--color-primary)]"
            >
              <LinkedInIcon className="h-3.5 w-3.5" />
              LinkedIn
            </a>
            <a
              href={profile.website}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 rounded-full border border-[var(--border-panel)] bg-[var(--bg-panel)] px-4 py-2 text-sm font-medium transition-colors hover:border-[var(--color-primary)]"
            >
              <ExternalLinkIcon className="h-3.5 w-3.5" />
              hashplayground.in
            </a>
            <button
              type="button"
              onClick={handleDownloadResume}
              disabled={downloading}
              className="cursor-pointer flex items-center gap-1.5 rounded-full border border-[var(--border-panel)] bg-[var(--bg-panel)] px-4 py-2 text-sm font-medium transition-colors hover:border-[var(--color-primary)] disabled:cursor-wait disabled:opacity-60"
            >
              <DownloadIcon className="h-3.5 w-3.5" />
              {downloading ? "Preparing…" : "Download Resume"}
            </button>
          </div>
        </div>

        <nav
          aria-label="Portfolio sections"
          className="sticky top-0 z-10 mb-8 flex flex-wrap justify-center gap-1.5 border-b border-[var(--border-panel)] py-3 backdrop-blur"
        >
          {SECTIONS.map((section) => (
            <button
              key={section.id}
              type="button"
              onClick={() =>
                document.getElementById(section.id)?.scrollIntoView({ behavior: "smooth", block: "start" })
              }
              className="cursor-pointer rounded-full border border-[var(--border-panel)] px-3 py-1 text-xs font-medium text-[var(--color-muted)] transition-colors hover:border-[var(--color-primary)] hover:text-[var(--color-primary)]"
            >
              {section.label}
            </button>
          ))}
        </nav>

        <section id="about" className="scroll-mt-20 py-6">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-2xl font-bold">About</h2>
            {isTopAdmin && (
              <button
                type="button"
                onClick={() => setEditingAbout(true)}
                className="flex cursor-pointer items-center gap-1.5 rounded-full border border-[var(--border-panel)] bg-[var(--bg-panel)] px-3 py-1.5 text-xs font-medium text-[var(--color-muted)] transition-colors hover:border-[var(--color-primary)] hover:text-[var(--color-primary)]"
              >
                <PencilIcon className="h-3.5 w-3.5" />
                Edit
              </button>
            )}
          </div>
          <div className="mt-4 rounded-lg border border-[var(--border-panel)] bg-[var(--bg-panel)] p-5">
            {summaryParagraphs.map((paragraph, index) => (
              <p key={paragraph} className={`text-sm text-[var(--color-muted)] ${index > 0 ? "mt-3" : ""}`}>
                {paragraph}
              </p>
            ))}
          </div>
        </section>

        <section id="experience" className="scroll-mt-20 py-6">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-2xl font-bold">Experience</h2>
            {isTopAdmin && (
              <button
                type="button"
                onClick={() => setEditingExperience(true)}
                className="flex cursor-pointer items-center gap-1.5 rounded-full border border-[var(--border-panel)] bg-[var(--bg-panel)] px-3 py-1.5 text-xs font-medium text-[var(--color-muted)] transition-colors hover:border-[var(--color-primary)] hover:text-[var(--color-primary)]"
              >
                <PencilIcon className="h-3.5 w-3.5" />
                Edit
              </button>
            )}
          </div>
          <div className="mt-4 flex flex-col gap-4">
            {experience.map((job) => (
              <div
                key={job.role + job.company}
                className={`rounded-lg border-l-2 bg-[var(--bg-panel)] p-5 ${
                  job.current ? "border-l-[var(--color-primary)]" : "border-l-[var(--border-panel)]"
                }`}
              >
                <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
                  <h3 className="flex flex-wrap items-center gap-1.5 font-semibold">
                    {job.role} <span className="font-normal text-[var(--color-muted)]">at</span>
                    {job.companyUrl ? (
                      <img
                        src={`https://www.google.com/s2/favicons?sz=32&domain_url=${encodeURIComponent(job.companyUrl)}`}
                        alt=""
                        aria-hidden="true"
                        className="h-3.5 w-3.5 shrink-0 rounded-sm"
                      />
                    ) : (
                      <BuildingIcon className="h-3.5 w-3.5 shrink-0 text-[var(--color-primary-strong)]" />
                    )}
                    {job.companyUrl ? (
                      <a
                        href={job.companyUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[var(--color-primary-strong)] hover:underline"
                      >
                        {job.company}
                      </a>
                    ) : (
                      <span className="text-[var(--color-primary-strong)]">{job.company}</span>
                    )}
                  </h3>
                  <span className="font-mono text-xs text-[var(--color-muted)]">{job.dates}</span>
                </div>
                <p className="mt-1 text-xs text-[var(--color-muted)]">{job.location}</p>
                <ul className="mt-3 flex flex-col gap-1.5">
                  {job.bullets.map((bullet) => (
                    <li key={bullet} className="flex gap-2 text-sm text-[var(--color-muted)]">
                      <span className="text-[var(--color-primary)]">•</span>
                      <span>{bullet}</span>
                    </li>
                  ))}
                </ul>
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {job.tags.map((tag) => (
                    <Tag key={tag} label={tag} />
                  ))}
                </div>
              </div>
            ))}
          </div>
        </section>

        <section id="build" className="scroll-mt-20 py-6">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-2xl font-bold">Featured Build</h2>
            {isTopAdmin && (
              <button
                type="button"
                onClick={() => setEditingProject(true)}
                className="flex cursor-pointer items-center gap-1.5 rounded-full border border-[var(--border-panel)] bg-[var(--bg-panel)] px-3 py-1.5 text-xs font-medium text-[var(--color-muted)] transition-colors hover:border-[var(--color-primary)] hover:text-[var(--color-primary)]"
              >
                <PencilIcon className="h-3.5 w-3.5" />
                Edit
              </button>
            )}
          </div>
          <div className="mt-4 overflow-hidden rounded-lg border border-[var(--border-panel)] bg-[var(--bg-panel)]">
            <div className="flex items-center gap-2 border-b border-[var(--border-panel)] bg-[var(--bg-app)] px-4 py-2.5">
              <span className="flex gap-1.5" aria-hidden="true">
                <span className="h-2.5 w-2.5 rounded-full bg-red-400" />
                <span className="h-2.5 w-2.5 rounded-full bg-amber-400" />
                <span className="h-2.5 w-2.5 rounded-full bg-emerald-400" />
              </span>
              <span className="flex-1 truncate rounded border border-[var(--border-panel)] bg-[var(--bg-panel)] px-2.5 py-1 font-mono text-xs text-[var(--color-muted)]">
                hashplayground.in
              </span>
            </div>

            <div className="p-5">
              <div className="flex items-center gap-2">
                <TerminalIcon className="h-4 w-4 text-[var(--color-primary)]" />
                <h3 className="font-semibold">{project.name}</h3>
              </div>
              <p className="mt-2 text-sm text-[var(--color-muted)]">{project.description}</p>
              <a
                href={project.url}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-2 inline-flex items-center gap-1 text-xs font-medium text-[var(--color-primary-strong)] hover:underline"
              >
                Visit hashplayground.in
                <ExternalLinkIcon className="h-3 w-3" />
              </a>

              <ul className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-2">
                {project.features.map((feature) => (
                  <li key={feature} className="flex gap-2 text-sm text-[var(--color-muted)]">
                    <CheckCircleIcon className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[var(--color-primary)]" />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>

              <div className="mt-4 flex flex-wrap gap-1.5">
                {project.stack.map((item) => (
                  <Tag key={item} label={item} />
                ))}
              </div>

              <p className="mt-4 border-t border-[var(--border-panel)] pt-3 text-xs italic text-[var(--color-muted)]">
                {project.note}
              </p>
            </div>
          </div>
        </section>

        <section id="education" className="scroll-mt-20 py-6">
          <h2 className="text-2xl font-bold">Education</h2>
          <div className="mt-4 flex flex-col gap-4">
            {education.map((entry) => (
              <div
                key={entry.school}
                className="flex items-start gap-3 rounded-lg border border-[var(--border-panel)] bg-[var(--bg-panel)] p-5"
              >
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[var(--color-primary-strong)] text-white">
                  <GraduationCapIcon className="h-5 w-5" />
                </span>
                <div className="flex flex-1 flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
                  <div>
                    <h3 className="font-semibold">{entry.school}</h3>
                    <p className="mt-1 text-sm text-[var(--color-muted)]">{entry.degree}</p>
                  </div>
                  <span className="font-mono text-xs text-[var(--color-muted)]">{entry.dates}</span>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section id="skills" className="scroll-mt-20 py-6">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-2xl font-bold">Skills</h2>
            {isTopAdmin && (
              <button
                type="button"
                onClick={() => setEditingSkills(true)}
                className="flex cursor-pointer items-center gap-1.5 rounded-full border border-[var(--border-panel)] bg-[var(--bg-panel)] px-3 py-1.5 text-xs font-medium text-[var(--color-muted)] transition-colors hover:border-[var(--color-primary)] hover:text-[var(--color-primary)]"
              >
                <PencilIcon className="h-3.5 w-3.5" />
                Edit
              </button>
            )}
          </div>
          <div className="mt-4 flex flex-col gap-4">
            {skillGroups.map((group) => (
              <div key={group.label} className="rounded-lg border border-[var(--border-panel)] bg-[var(--bg-panel)] p-5">
                <div className="flex items-center gap-2">
                  <LayersIcon className="h-4 w-4 text-[var(--color-primary)]" />
                  <span className="text-xs font-semibold uppercase tracking-wide text-[var(--color-muted)]">
                    {group.label}
                  </span>
                </div>
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {group.skills.map((skill) => (
                    <Tag key={skill} label={skill} />
                  ))}
                </div>
              </div>
            ))}
          </div>
        </section>

        <section id="contact" className="scroll-mt-20 py-6">
          <h2 className="text-2xl font-bold">Contact</h2>
          <div className="mt-4 flex flex-col gap-3 rounded-lg border border-[var(--border-panel)] bg-[var(--bg-panel)] p-5 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-[var(--border-panel)]">
                <GitBranchIcon className="h-5 w-5" />
              </span>
              <p className="text-sm text-[var(--color-muted)]">
                Bengaluru, Karnataka, India — always open to a good frontend problem.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <a
                href={`mailto:${profile.email}`}
                className="flex items-center gap-1.5 rounded-full border border-[var(--border-panel)] bg-[var(--bg-app)] px-3 py-1.5 text-xs font-medium transition-colors hover:border-[var(--color-primary)]"
              >
                <EnvelopeIcon className="h-3.5 w-3.5" />
                {profile.email}
              </a>
              <a
                href={profile.linkedin}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 rounded-full border border-[var(--border-panel)] bg-[var(--bg-app)] px-3 py-1.5 text-xs font-medium transition-colors hover:border-[var(--color-primary)]"
              >
                <LinkedInIcon className="h-3.5 w-3.5" />
                LinkedIn
              </a>
            </div>
          </div>
        </section>
      </div>
      )}

      {isTopAdmin && (
        <>
          <PortfolioExperienceDialog
            open={editingExperience}
            experience={experience}
            onClose={() => setEditingExperience(false)}
            onSave={handleSaveExperience}
          />
          <PortfolioAboutDialog
            open={editingAbout}
            summaryParagraphs={summaryParagraphs}
            onClose={() => setEditingAbout(false)}
            onSave={handleSaveAbout}
          />
          <PortfolioProjectDialog
            open={editingProject}
            project={project}
            onClose={() => setEditingProject(false)}
            onSave={handleSaveProject}
          />
          <PortfolioSkillsDialog
            open={editingSkills}
            skillGroups={skillGroups}
            onClose={() => setEditingSkills(false)}
            onSave={handleSaveSkills}
          />
          <PortfolioProfileDialog
            open={editingProfile}
            profile={profile}
            onClose={() => setEditingProfile(false)}
            onSave={handleSaveProfile}
          />
        </>
      )}
    </div>
  );
}

export default Portfolio;
