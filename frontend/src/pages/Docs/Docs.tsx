import {
  UserIcon,
  FolderIcon,
  PlayIcon,
  GitBranchIcon,
  CodeIcon,
  SearchIcon,
  MonitorIcon,
  TerminalIcon,
  SettingsIcon,
  DownloadIcon,
  ShieldIcon,
  MegaphoneIcon,
  GoogleIcon,
  GithubIcon,
  LinkedInIcon,
  EnvelopeIcon,
  PhoneIcon,
  CheckCircleIcon,
} from '../../components/Icons/Icons'
import Accordion from '../../components/Accordion/Accordion'
import HeroCanvas from '../../components/HeroCanvas/HeroCanvas'

const SECTIONS = [
  { id: 'getting-started', label: 'Getting Started' },
  { id: 'workspace', label: 'The Workspace' },
  { id: 'saving', label: 'Saving & Versions' },
  { id: 'templates', label: 'Templates' },
  { id: 'account', label: 'Account & Security' },
  { id: 'shortcuts', label: 'Shortcuts' },
  { id: 'feedback', label: 'Feedback' },
  { id: 'faq', label: 'FAQ' },
]

const GETTING_STARTED_STEPS = [
  {
    icon: UserIcon,
    title: 'Create your account',
    description:
      'Sign up with an email address or phone number, or continue with Google, GitHub, or LinkedIn — no credit card, nothing to install.',
  },
  {
    icon: FolderIcon,
    title: 'Create a project',
    description: 'Pick a template — Blank React + TypeScript or HTML + CSS + JavaScript — and name your project.',
  },
  {
    icon: PlayIcon,
    title: 'Build and run it',
    description: 'Edit files in the Playground, then hit Run to compile and preview your project instantly.',
  },
  {
    icon: GitBranchIcon,
    title: 'Update Project to save a version',
    description: 'When you’re happy with your changes, click Update Project to publish a version you can always come back to.',
  },
]

const WORKSPACE_PANELS = [
  {
    icon: FolderIcon,
    title: 'Explorer',
    description: 'A real file tree — create, rename, delete, and organize files and folders inside your project.',
  },
  {
    icon: SearchIcon,
    title: 'Search',
    description: 'Full-text search across every file in your project, with results that jump straight to the matching line.',
  },
  {
    icon: GitBranchIcon,
    title: 'Source Control',
    description: 'See exactly what changed since your last Update, review a Git-style diff per file, or discard changes you don’t want.',
  },
  {
    icon: CodeIcon,
    title: 'Editor',
    description: 'Monaco — the same editor behind VS Code — with multi-file tabs, syntax highlighting, and Quick Open (Ctrl/Cmd+P).',
  },
  {
    icon: MonitorIcon,
    title: 'Live Preview',
    description: 'Click Run to compile your project and preview it in a sandboxed frame, with real console output and error overlays.',
  },
  {
    icon: TerminalIcon,
    title: 'Log & Terminal',
    description: 'A collapsible bottom panel that mirrors your preview’s console output alongside a lightweight terminal.',
  },
]

const TEMPLATES = [
  {
    title: 'Blank React + TypeScript',
    description:
      'A minimal React + TypeScript starter. Import any npm package with a normal import statement (e.g. import axios from \'axios\') — it’s resolved automatically the moment you hit Run, no install step required.',
  },
  {
    title: 'HTML + CSS + JavaScript',
    description:
      'A plain index.html, style.css, and script.js — no build step at all. Use <script type="module"> to import packages straight from a URL (esm.sh, unpkg, or similar).',
  },
]

const ACCOUNT_ITEMS = [
  {
    icon: EnvelopeIcon,
    title: 'Email or phone',
    description: 'Sign up and log in with either an email address or a phone number — whichever you prefer.',
  },
  {
    icon: GoogleIcon,
    title: 'Google, GitHub & LinkedIn',
    description: 'Skip the password entirely and continue with any of these three providers.',
  },
  {
    icon: ShieldIcon,
    title: 'One identity, strictly enforced',
    description:
      'Your email, phone number, and username can each only ever belong to one account — this is checked across every signup path, including social login, so accounts never silently merge or duplicate.',
  },
]

const SHORTCUTS = [
  { keys: 'Ctrl / Cmd + S', action: 'Save the current file (auto-save is also on by default)' },
  { keys: 'Ctrl / Cmd + P', action: 'Quick Open — jump to any file by name' },
]

const FAQ_ITEMS = [
  {
    question: 'Is Hash Playground free to use?',
    answer: 'Yes. Creating an account, building projects, and everything documented on this page is free — no credit card required.',
  },
  {
    question: 'Is my code private?',
    answer:
      'Your projects live in your account and are only visible to you (and admins, for support purposes) unless you choose to export or share them yourself.',
  },
  {
    question: 'Can I use npm packages in my project?',
    answer:
      'In the React + TypeScript template, yes — any bare import is resolved automatically at Run time. In the HTML + CSS + JavaScript template, import packages by URL from inside a <script type="module">.',
  },
  {
    question: "What happens if I leave without clicking Update Project?",
    answer:
      'Hash Playground warns you before you navigate away with unpublished changes. If you leave anyway, a project that was never updated is discarded entirely, and an already-updated project reverts to its last published version.',
  },
  {
    question: 'Can I get my project out of Hash Playground?',
    answer:
      'Yes — Export downloads your project as a .zip. For the React template that includes a full, ready-to-run Vite scaffold (package.json, vite.config.ts, and so on); the HTML template exports as-is, ready to open in a browser or serve as static files.',
  },
]

function Docs() {
  return (
    <div className="relative min-h-full">
      <div className="fixed inset-0 -z-10">
        <div
          className="absolute inset-0 overflow-hidden opacity-30"
          style={{
            backgroundImage:
              'linear-gradient(to right, var(--border-panel) 1px, transparent 1px), linear-gradient(to bottom, var(--border-panel) 1px, transparent 1px)',
            backgroundSize: '28px 28px',
            maskImage: 'radial-gradient(circle, black, transparent 75%)',
            WebkitMaskImage: 'radial-gradient(circle, black, transparent 75%)',
          }}
        >
          <div className="grid-glow" aria-hidden="true" />
        </div>
        <HeroCanvas />
      </div>

      <div className="relative mx-auto max-w-4xl pb-16" style={{ paddingInline: '15px' }}>
      <div className="py-6 text-center">
        <p className="text-xs font-semibold uppercase tracking-widest text-[var(--color-primary)]">Documentation</p>
        <h1 className="mt-3 text-3xl font-bold sm:text-4xl">Everything you need to know</h1>
        <p className="mx-auto mt-4 max-w-xl text-sm text-[var(--color-muted)] sm:text-base">
          How Hash Playground works, from creating your first project to publishing versions and exporting your code.
        </p>
      </div>

      <nav
        aria-label="Documentation sections"
        className="sticky top-0 z-10 mb-8 flex flex-wrap justify-center gap-1.5 border-b border-[var(--border-panel)] bg-[var(--bg-app)]/95 py-3 backdrop-blur"
      >
        {SECTIONS.map((section) => (
          <a
            key={section.id}
            href={`#${section.id}`}
            className="rounded-full border border-[var(--border-panel)] px-3 py-1 text-xs font-medium text-[var(--color-muted)] transition-colors hover:border-[var(--color-primary)] hover:text-[var(--color-primary)]"
          >
            {section.label}
          </a>
        ))}
      </nav>

      <section id="getting-started" className="scroll-mt-20 py-6">
        <h2 className="text-2xl font-bold">Getting Started</h2>
        <p className="mt-2 text-sm text-[var(--color-muted)]">Four steps between you and a running project.</p>
        <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
          {GETTING_STARTED_STEPS.map((step, index) => (
            <div
              key={step.title}
              className="flex flex-col gap-3 rounded-lg border border-[var(--border-panel)] bg-[var(--bg-panel)] p-5"
            >
              <div className="flex items-center gap-3">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[var(--color-primary-strong)] text-white">
                  <step.icon className="h-5 w-5" />
                </span>
                <span className="text-xs font-semibold text-[var(--color-muted)]">Step {index + 1}</span>
              </div>
              <div>
                <h3 className="font-medium">{step.title}</h3>
                <p className="mt-1 text-sm text-[var(--color-muted)]">{step.description}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section id="workspace" className="scroll-mt-20 py-6">
        <h2 className="text-2xl font-bold">The Workspace</h2>
        <p className="mt-2 text-sm text-[var(--color-muted)]">
          The Playground is a full in-browser IDE, laid out in familiar panels.
        </p>
        <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {WORKSPACE_PANELS.map((panel) => (
            <div
              key={panel.title}
              className="flex flex-col gap-3 rounded-lg border border-[var(--border-panel)] bg-[var(--bg-panel)] p-5"
            >
              <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-[var(--color-primary-strong)] text-white">
                <panel.icon className="h-5 w-5" />
              </span>
              <div>
                <h3 className="font-medium">{panel.title}</h3>
                <p className="mt-1 text-sm text-[var(--color-muted)]">{panel.description}</p>
              </div>
            </div>
          ))}
        </div>
        <p className="mt-4 text-xs text-[var(--color-muted)]">
          On a phone or narrow screen, these panels are reached one at a time through a tab bar (Files / Search / Git /
          Editor / Preview) instead of side by side.
        </p>
      </section>

      <section id="saving" className="scroll-mt-20 py-6">
        <h2 className="text-2xl font-bold">Saving & Versions</h2>
        <div className="mt-6 flex flex-col gap-4">
          <div className="flex items-start gap-3 rounded-lg border border-[var(--border-panel)] bg-[var(--bg-panel)] p-5">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[var(--color-primary-strong)] text-white">
              <SettingsIcon className="h-4 w-4" />
            </span>
            <div>
              <h3 className="font-medium">Auto save vs. manual save</h3>
              <p className="mt-1 text-sm text-[var(--color-muted)]">
                By default, your edits save to your account about a second after you stop typing. Prefer full
                control? Switch to manual save in Playground settings and save explicitly with Ctrl/Cmd+S.
              </p>
            </div>
          </div>
          <div className="flex items-start gap-3 rounded-lg border border-[var(--border-panel)] bg-[var(--bg-panel)] p-5">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[var(--color-primary-strong)] text-white">
              <GitBranchIcon className="h-4 w-4" />
            </span>
            <div>
              <h3 className="font-medium">Update Project</h3>
              <p className="mt-1 text-sm text-[var(--color-muted)]">
                Saving keeps your latest edits, but publishing a version is a separate, deliberate step — click
                Update Project to record a version you can always return to, with a full diff against the one
                before it.
              </p>
            </div>
          </div>
          <div className="flex items-start gap-3 rounded-lg border border-[var(--border-panel)] bg-[var(--bg-panel)] p-5">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[var(--color-primary-strong)] text-white">
              <DownloadIcon className="h-4 w-4" />
            </span>
            <div>
              <h3 className="font-medium">Export</h3>
              <p className="mt-1 text-sm text-[var(--color-muted)]">
                Export downloads your project as a .zip at any time — a ready-to-run npm scaffold for the React
                template, or the raw files for the HTML template.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section id="templates" className="scroll-mt-20 py-6">
        <h2 className="text-2xl font-bold">Templates</h2>
        <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
          {TEMPLATES.map((template) => (
            <div
              key={template.title}
              className="rounded-lg border border-[var(--border-panel)] bg-[var(--bg-panel)] p-5"
            >
              <h3 className="font-medium">{template.title}</h3>
              <p className="mt-1 text-sm text-[var(--color-muted)]">{template.description}</p>
            </div>
          ))}
        </div>
      </section>

      <section id="account" className="scroll-mt-20 py-6">
        <h2 className="text-2xl font-bold">Account & Security</h2>
        <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
          {ACCOUNT_ITEMS.map((item) => (
            <div
              key={item.title}
              className="flex flex-col gap-3 rounded-lg border border-[var(--border-panel)] bg-[var(--bg-panel)] p-5"
            >
              <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-[var(--color-primary-strong)] text-white">
                <item.icon className="h-5 w-5" />
              </span>
              <div>
                <h3 className="font-medium">{item.title}</h3>
                <p className="mt-1 text-sm text-[var(--color-muted)]">{item.description}</p>
              </div>
            </div>
          ))}
        </div>
        <div className="mt-4 flex flex-wrap items-center gap-3 text-[var(--color-muted)]">
          <span className="flex items-center gap-1.5 text-xs">
            <EnvelopeIcon className="h-4 w-4" /> Email
          </span>
          <span className="flex items-center gap-1.5 text-xs">
            <PhoneIcon className="h-4 w-4" /> Phone
          </span>
          <span className="flex items-center gap-1.5 text-xs">
            <GoogleIcon className="h-4 w-4" /> Google
          </span>
          <span className="flex items-center gap-1.5 text-xs">
            <GithubIcon className="h-4 w-4" /> GitHub
          </span>
          <span className="flex items-center gap-1.5 text-xs">
            <LinkedInIcon className="h-4 w-4" /> LinkedIn
          </span>
        </div>
      </section>

      <section id="shortcuts" className="scroll-mt-20 py-6">
        <h2 className="text-2xl font-bold">Keyboard Shortcuts</h2>
        <div className="mt-6 overflow-hidden rounded-lg border border-[var(--border-panel)]">
          <table className="w-full text-left text-sm">
            <tbody>
              {SHORTCUTS.map((shortcut, index) => (
                <tr
                  key={shortcut.keys}
                  className={index !== SHORTCUTS.length - 1 ? 'border-b border-[var(--border-panel)]' : ''}
                >
                  <td className="w-48 bg-[var(--bg-panel)] px-4 py-3 font-mono text-xs font-medium">
                    {shortcut.keys}
                  </td>
                  <td className="px-4 py-3 text-[var(--color-muted)]">{shortcut.action}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section id="feedback" className="scroll-mt-20 py-6">
        <h2 className="text-2xl font-bold">Feedback</h2>
        <div className="mt-6 flex flex-col gap-3 rounded-lg border border-[var(--border-panel)] bg-[var(--bg-panel)] p-5 sm:flex-row sm:items-center">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-[var(--border-panel)]">
            <MegaphoneIcon className="h-5 w-5" />
          </span>
          <p className="text-sm text-[var(--color-muted)]">
            Found a bug, or have an idea for a feature? Click the megaphone icon in the navbar (next to the theme
            toggle, once you’re signed in) to send it straight to us, with an optional screenshot attached. You’ll
            see status updates on your submission as we work through it.
          </p>
        </div>
      </section>

      <section id="faq" className="scroll-mt-20 py-6">
        <h2 className="text-2xl font-bold">FAQ</h2>
        <div className="mt-6 flex flex-col divide-y divide-[var(--border-panel)] rounded-lg border border-[var(--border-panel)] bg-[var(--bg-panel)] px-2">
          {FAQ_ITEMS.map((item) => (
            <Accordion key={item.question} title={item.question} defaultOpen={false}>
              <p className="px-3 pb-3 text-sm text-[var(--color-muted)]">{item.answer}</p>
            </Accordion>
          ))}
        </div>
      </section>

      <div className="mt-4 flex items-center justify-center gap-2 text-xs text-[var(--color-muted)]">
        <CheckCircleIcon className="h-4 w-4 text-[var(--color-primary)]" />
        Still have questions? Use the feedback option above, or reach out from your account settings.
      </div>
      </div>
    </div>
  )
}

export default Docs
