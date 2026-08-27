import { useEffect } from "react";
import {
  EnvelopeIcon,
  LinkedInIcon,
  GitBranchIcon,
  GraduationCapIcon,
  LayersIcon,
  TerminalIcon,
  CheckCircleIcon,
  ExternalLinkIcon,
} from "../../components/Icons/Icons";
import HeroCanvas from "../../components/HeroCanvas/HeroCanvas";

// Structured data (schema.org Person) — lets search engines understand this
// page as a person's profile rather than generic app content, which is what
// powers a knowledge-panel-style rich result. Injected on mount rather than
// living in index.html since it's specific to this one route.
const PERSON_JSON_LD = {
  "@context": "https://schema.org",
  "@type": "Person",
  name: "Md Manowar Hashmi",
  jobTitle: "UI / Frontend Developer",
  url: "https://hashplayground.in/portfolio",
  email: "mailto:hmdmanowar@gmail.com",
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
  sameAs: ["https://www.linkedin.com/in/md-manowar-hashmi-3a395815a/"],
};

const SECTIONS = [
  { id: "about", label: "About" },
  { id: "experience", label: "Experience" },
  { id: "build", label: "Featured Build" },
  { id: "education", label: "Education" },
  { id: "skills", label: "Skills" },
  { id: "contact", label: "Contact" },
];

const EXPERIENCE = [
  {
    role: "Member of Technical Staff – 1",
    company: "Alphastream.Ai",
    dates: "Aug 2022 – Present",
    location: "Bengaluru, Karnataka, India · On-site",
    current: true,
    bullets: [
      "Develop and maintain enterprise web applications with a focus on UI development, usability, and performance.",
      "Build responsive, reusable interfaces using React, TypeScript, JavaScript, HTML, and CSS/SCSS.",
      "Work on complex data-driven interfaces, reusable components, API integrations, and enterprise data grids.",
      "Improve UI consistency, accessibility, and responsiveness across the application.",
      "Collaborate with product, design, backend, and QA teams to deliver and refine features.",
    ],
    tags: ["React", "TypeScript", "JavaScript", "SCSS", "REST APIs", "Data Grids"],
  },
  {
    role: "Sr. Web Developer",
    company: "Ten X Branding",
    dates: "Mar 2021 – Jul 2022",
    location: "Hyderabad, Telangana, India",
    current: false,
    bullets: [
      "Developed responsive web applications using HTML, CSS, JavaScript, Bootstrap, and MVC.",
      "Built user-friendly interfaces based on business requirements and design specifications.",
      "Integrated APIs and dynamic data into production web applications.",
      "Improved existing applications for usability, responsiveness, and performance.",
    ],
    tags: ["JavaScript", "Bootstrap", "MVC", "API Integration"],
  },
  {
    role: "Web Developer",
    company: "KiranSoftech Pvt Ltd",
    dates: "Jul 2018 – Mar 2021",
    location: "Ranchi, Jharkhand, India",
    current: false,
    bullets: [
      "Developed responsive websites and web interfaces using HTML, CSS, JavaScript, and Bootstrap.",
      "Owned UI design, development, maintenance, and improvements across multiple client projects.",
      "Focused on responsive layouts, usability, and cross-browser compatibility.",
      "Translated client requirements and designs into functional interfaces.",
    ],
    tags: ["HTML", "CSS", "JavaScript", "Bootstrap"],
  },
];

const PROJECT_FEATURES = [
  "Monaco-powered multi-file editor with tabs, Quick Open, and a live sandboxed preview",
  "Instant npm package resolution at run time — no build or install step",
  "Git-style version history with per-file diffing and rollback",
  "Style-template scaffolding (Bootstrap / Tailwind), image uploads, one-click project export",
  "Google, GitHub & LinkedIn OAuth, plus email/phone auth with strict duplicate-account checks",
  "Role-based admin tools, including a request-and-approve workflow for admin-assisted updates",
];

const STACK = ["React 18", "TypeScript", "Vite", "Monaco Editor", "Fastify", "Prisma", "PostgreSQL", "Render"];

const SKILL_GROUPS = [
  { label: "Core Languages", skills: ["JavaScript (ES6+)", "TypeScript", "HTML5", "CSS3 / SCSS"] },
  { label: "Frameworks & Libraries", skills: ["React.js", "React Native", "Bootstrap"] },
  {
    label: "Practices & Focus",
    skills: [
      "Responsive & Accessible UI",
      "REST API Integration",
      "Component-driven Architecture",
      "Enterprise Data Grids",
      "Cross-browser Compatibility",
      "MVC",
    ],
  },
];

function Tag({ label, strong = false }: { label: string; strong?: boolean }) {
  return (
    <span
      className={`rounded-full border px-2.5 py-1 font-mono text-[11px] ${
        strong
          ? "border-[var(--color-primary)]/40 bg-[var(--color-primary-soft)] text-[var(--color-primary-strong)]"
          : "border-[var(--border-panel)] bg-[var(--bg-app)] text-[var(--color-muted)]"
      }`}
    >
      {label}
    </span>
  );
}

function Portfolio() {
  useEffect(() => {
    const script = document.createElement("script");
    script.type = "application/ld+json";
    script.text = JSON.stringify(PERSON_JSON_LD);
    document.head.appendChild(script);
    return () => {
      document.head.removeChild(script);
    };
  }, []);

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

      <div className="relative mx-auto max-w-4xl pb-16" style={{ paddingInline: "15px" }}>
        <div className="py-10 text-center">
          <p className="text-xs font-semibold uppercase tracking-widest text-[var(--color-primary)]">Portfolio</p>
          <h1 className="mt-3 text-3xl font-bold sm:text-4xl">Md Manowar Hashmi</h1>
          <p className="mx-auto mt-3 max-w-xl text-sm text-[var(--color-muted)] sm:text-base">
            UI / Frontend Developer building clean, responsive, data-driven interfaces — 8+ years turning specs and
            designs into interfaces people actually enjoy using.
          </p>

          <div className="mx-auto mt-6 flex max-w-xl flex-wrap items-center justify-center gap-2 rounded-full border border-[var(--border-panel)] bg-[var(--bg-panel)] px-4 py-2 font-mono text-xs text-[var(--color-muted)]">
            <span className="flex items-center gap-1.5">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" aria-hidden="true" />
              Open to good frontend work
            </span>
            <span className="text-[var(--border-panel)]">·</span>
            <span>Bengaluru, India</span>
            <span className="text-[var(--border-panel)]">·</span>
            <span>React · TypeScript · React Native</span>
            <span className="text-[var(--border-panel)]">·</span>
            <span>8+ yrs</span>
          </div>

          <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
            <a
              href="mailto:hmdmanowar@gmail.com"
              className="flex items-center gap-1.5 rounded-full bg-[var(--color-primary-strong)] px-4 py-2 text-sm font-medium text-white transition-colors hover:opacity-90"
            >
              <EnvelopeIcon className="h-3.5 w-3.5" />
              Email me
            </a>
            <a
              href="https://www.linkedin.com/in/md-manowar-hashmi-3a395815a/"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 rounded-full border border-[var(--border-panel)] bg-[var(--bg-panel)] px-4 py-2 text-sm font-medium transition-colors hover:border-[var(--color-primary)]"
            >
              <LinkedInIcon className="h-3.5 w-3.5" />
              LinkedIn
            </a>
            <a
              href="https://hashplayground.in"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 rounded-full border border-[var(--border-panel)] bg-[var(--bg-panel)] px-4 py-2 text-sm font-medium transition-colors hover:border-[var(--color-primary)]"
            >
              <ExternalLinkIcon className="h-3.5 w-3.5" />
              hashplayground.in
            </a>
          </div>
        </div>

        <nav
          aria-label="Portfolio sections"
          className="sticky top-0 z-10 mb-8 flex flex-wrap justify-center gap-1.5 border-b border-[var(--border-panel)] bg-[var(--bg-app)]/95 py-3 backdrop-blur"
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
          <h2 className="text-2xl font-bold">About</h2>
          <div className="mt-4 rounded-lg border border-[var(--border-panel)] bg-[var(--bg-panel)] p-5">
            <p className="text-sm text-[var(--color-muted)]">
              I'm a UI/Frontend developer with 8+ years of experience building responsive, user-friendly web
              applications — mainly with <span className="text-[var(--text-app)]">React, TypeScript, JavaScript, HTML and CSS/SCSS</span>,
              backed by REST APIs.
            </p>
            <p className="mt-3 text-sm text-[var(--color-muted)]">
              Over the years I've worked across different kinds of web projects, from building sites from scratch to
              developing and maintaining enterprise applications with complex, data-driven screens. I care most
              about clean UI, responsive design, performance, and keeping the experience consistent across a product
              — and I'm always looking for the next hard frontend problem to learn from.
            </p>
          </div>
        </section>

        <section id="experience" className="scroll-mt-20 py-6">
          <h2 className="text-2xl font-bold">Experience</h2>
          <div className="mt-4 flex flex-col gap-4">
            {EXPERIENCE.map((job) => (
              <div
                key={job.role + job.company}
                className={`rounded-lg border-l-2 bg-[var(--bg-panel)] p-5 ${
                  job.current ? "border-l-[var(--color-primary)]" : "border-l-[var(--border-panel)]"
                }`}
              >
                <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
                  <h3 className="font-semibold">
                    {job.role} <span className="font-normal text-[var(--color-muted)]">at</span>{" "}
                    <span className="text-[var(--color-primary-strong)]">{job.company}</span>
                  </h3>
                  <span className="font-mono text-xs text-[var(--color-muted)]">{job.dates}</span>
                </div>
                <p className="mt-1 text-xs text-[var(--color-muted)]">{job.location}</p>
                <ul className="mt-3 flex flex-col gap-1.5">
                  {job.bullets.map((bullet) => (
                    <li key={bullet} className="flex gap-2 text-sm text-[var(--color-muted)]">
                      <span className="text-[var(--border-panel)]">–</span>
                      <span>{bullet}</span>
                    </li>
                  ))}
                </ul>
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {job.tags.map((tag) => (
                    <Tag key={tag} label={tag} strong />
                  ))}
                </div>
              </div>
            ))}
          </div>
        </section>

        <section id="build" className="scroll-mt-20 py-6">
          <h2 className="text-2xl font-bold">Featured Build</h2>
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
                <h3 className="font-semibold">Hash Playground</h3>
              </div>
              <p className="mt-2 text-sm text-[var(--color-muted)]">
                A browser-based coding platform I designed and built end to end — write, run, and version React +
                TypeScript or HTML/CSS/JS projects entirely in the browser, no installs, no setup. React/TypeScript
                frontend, Fastify/Prisma/PostgreSQL backend, deployed and live.
              </p>
              <a
                href="https://hashplayground.in"
                target="_blank"
                rel="noopener noreferrer"
                className="mt-2 inline-flex items-center gap-1 text-xs font-medium text-[var(--color-primary-strong)] hover:underline"
              >
                Visit hashplayground.in
                <ExternalLinkIcon className="h-3 w-3" />
              </a>

              <ul className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-2">
                {PROJECT_FEATURES.map((feature) => (
                  <li key={feature} className="flex gap-2 text-sm text-[var(--color-muted)]">
                    <CheckCircleIcon className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[var(--color-primary)]" />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>

              <div className="mt-4 flex flex-wrap gap-1.5">
                {STACK.map((item) => (
                  <Tag key={item} label={item} />
                ))}
              </div>

              <p className="mt-4 border-t border-[var(--border-panel)] pt-3 text-xs italic text-[var(--color-muted)]">
                Designed and built solo — pairing with AI-assisted development tooling for backend work and
                iteration speed, while owning the UI, UX, and product decisions myself.
              </p>
            </div>
          </div>
        </section>

        <section id="education" className="scroll-mt-20 py-6">
          <h2 className="text-2xl font-bold">Education</h2>
          <div className="mt-4 flex items-start gap-3 rounded-lg border border-[var(--border-panel)] bg-[var(--bg-panel)] p-5">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[var(--color-primary-strong)] text-white">
              <GraduationCapIcon className="h-5 w-5" />
            </span>
            <div className="flex flex-1 flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
              <div>
                <h3 className="font-semibold">R.V.S. College of Engineering and Technology, Jamshedpur</h3>
                <p className="mt-1 text-sm text-[var(--color-muted)]">B.Tech, Computer Science Engineering</p>
              </div>
              <span className="font-mono text-xs text-[var(--color-muted)]">Sep 2014 – May 2018</span>
            </div>
          </div>
        </section>

        <section id="skills" className="scroll-mt-20 py-6">
          <h2 className="text-2xl font-bold">Skills</h2>
          <div className="mt-4 flex flex-col gap-4">
            {SKILL_GROUPS.map((group) => (
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
                href="mailto:hmdmanowar@gmail.com"
                className="flex items-center gap-1.5 rounded-full border border-[var(--border-panel)] bg-[var(--bg-app)] px-3 py-1.5 text-xs font-medium transition-colors hover:border-[var(--color-primary)]"
              >
                <EnvelopeIcon className="h-3.5 w-3.5" />
                hmdmanowar@gmail.com
              </a>
              <a
                href="https://www.linkedin.com/in/md-manowar-hashmi-3a395815a/"
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
    </div>
  );
}

export default Portfolio;
