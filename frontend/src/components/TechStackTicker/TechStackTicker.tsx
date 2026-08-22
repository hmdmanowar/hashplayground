// Simplified, recognizable marks in each technology's real brand color —
// not pixel-exact logo reproductions, but close enough to read at a glance.
// Kept separate from the monochrome UI icon set in Icons.tsx since these are
// third-party brand marks, not this app's own iconography.

function ReactMark() {
  return (
    <svg viewBox="0 0 40 40" className="h-6 w-6">
      <circle cx="20" cy="20" r="3" fill="#61DAFB" />
      <g fill="none" stroke="#61DAFB" strokeWidth="2">
        <ellipse cx="20" cy="20" rx="16" ry="6.5" />
        <ellipse cx="20" cy="20" rx="16" ry="6.5" transform="rotate(60 20 20)" />
        <ellipse cx="20" cy="20" rx="16" ry="6.5" transform="rotate(120 20 20)" />
      </g>
    </svg>
  )
}

function TypeScriptMark() {
  return (
    <svg viewBox="0 0 40 40" className="h-6 w-6">
      <rect width="40" height="40" rx="6" fill="#3178C6" />
      <text x="20" y="27" textAnchor="middle" fontFamily="ui-sans-serif, system-ui" fontSize="16" fontWeight="700" fill="#fff">
        TS
      </text>
    </svg>
  )
}

function TailwindMark() {
  return (
    <svg viewBox="0 0 40 40" className="h-6 w-6">
      <path
        fill="#38BDF8"
        d="M20 12c-4.4 0-7.2 2.2-8.3 6.5 1.7-2.2 3.6-3 5.8-2.5 1.3.3 2.2 1.2 3.2 2.2 1.7 1.7 3.6 3.6 7.8 3.6 4.4 0 7.2-2.2 8.3-6.5-1.7 2.2-3.6 3-5.8 2.5-1.3-.3-2.2-1.2-3.2-2.2C26.1 13.9 24.2 12 20 12Z"
      />
      <path
        fill="#38BDF8"
        d="M11.7 21.8c-4.4 0-7.2 2.2-8.3 6.5 1.7-2.2 3.6-3 5.8-2.5 1.3.3 2.2 1.2 3.2 2.2 1.7 1.7 3.6 3.6 7.8 3.6 4.4 0 7.2-2.2 8.3-6.5-1.7 2.2-3.6 3-5.8 2.5-1.3-.3-2.2-1.2-3.2-2.2-1.7-1.7-3.6-3.6-7.8-3.6Z"
      />
    </svg>
  )
}

function ViteMark() {
  return (
    <svg viewBox="0 0 40 40" className="h-6 w-6">
      <defs>
        <linearGradient id="vite-a" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#41D1FF" />
          <stop offset="1" stopColor="#BD34FE" />
        </linearGradient>
        <linearGradient id="vite-b" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#FFEA83" />
          <stop offset="1" stopColor="#FFA800" />
        </linearGradient>
      </defs>
      <path fill="url(#vite-a)" d="M36 6 20.5 34.5a.6.6 0 0 1-1.05 0L11 20l9-2 2-9 14-3Z" />
      <path fill="url(#vite-b)" d="M22.5 2.5 13 15l5.5 1.2L16.5 25 27 12l-5-1 .5-8.5Z" />
    </svg>
  )
}

function NodeMark() {
  return (
    <svg viewBox="0 0 40 40" className="h-6 w-6">
      <path
        fill="none"
        stroke="#339933"
        strokeWidth="2.5"
        strokeLinejoin="round"
        d="M20 4 34 12v16L20 36 6 28V12Z"
      />
      <text x="20" y="24" textAnchor="middle" fontFamily="ui-sans-serif, system-ui" fontSize="10" fontWeight="700" fill="#339933">
        JS
      </text>
    </svg>
  )
}

function FastifyMark() {
  return (
    <svg viewBox="0 0 40 40" className="h-6 w-6">
      <circle cx="20" cy="20" r="18" fill="none" stroke="#000" strokeOpacity="0.15" strokeWidth="2" />
      <path fill="#000" d="M22 6 12 22h6l-2 12 12-16h-6l2-12Z" />
    </svg>
  )
}

function PrismaMark() {
  return (
    <svg viewBox="0 0 40 40" className="h-6 w-6">
      <path fill="#5A67D8" d="M19 3.3a1.2 1.2 0 0 1 1.9-.2l14 15a1.2 1.2 0 0 1 .1 1.6l-9 11.5a1.2 1.2 0 0 1-1.8.1L6 15a1.2 1.2 0 0 1 0-1.7Z" />
      <path fill="#fff" fillOpacity="0.9" d="m20 6 12 13-8 10L14 16Z" />
    </svg>
  )
}

function PostgresMark() {
  return (
    <svg viewBox="0 0 40 40" className="h-6 w-6">
      <rect width="40" height="40" rx="6" fill="#336791" />
      <text x="20" y="27" textAnchor="middle" fontFamily="ui-sans-serif, system-ui" fontSize="14" fontWeight="700" fill="#fff">
        Pg
      </text>
    </svg>
  )
}

function MonacoMark() {
  return (
    <svg viewBox="0 0 40 40" className="h-6 w-6">
      <rect width="40" height="40" rx="6" fill="#007ACC" />
      <path fill="#fff" d="M12 12 20 20l-8 8v-4l4-4-4-4Zm10 0h6v3h-4v10h4v3h-6Z" />
    </svg>
  )
}

const TECHNOLOGIES = [
  { name: 'React', Mark: ReactMark },
  { name: 'TypeScript', Mark: TypeScriptMark },
  { name: 'Tailwind CSS', Mark: TailwindMark },
  { name: 'Vite', Mark: ViteMark },
  { name: 'Monaco Editor', Mark: MonacoMark },
  { name: 'Node.js', Mark: NodeMark },
  { name: 'Fastify', Mark: FastifyMark },
  { name: 'Prisma', Mark: PrismaMark },
  { name: 'PostgreSQL', Mark: PostgresMark },
]

function Badge({ name, Mark }: { name: string; Mark: () => React.JSX.Element }) {
  return (
    <div className="flex shrink-0 items-center gap-2 rounded-full border border-[var(--border-panel)] bg-[var(--bg-panel)] px-4 py-2">
      <Mark />
      <span className="whitespace-nowrap text-sm font-medium">{name}</span>
    </div>
  )
}

function TechStackTicker() {
  return (
    <div className="mx-auto max-w-6xl py-6">
      <p className="text-center text-xs font-semibold uppercase tracking-widest text-[var(--color-primary)]">
        Built with the real thing
      </p>
      <div className="mt-5 overflow-hidden [mask-image:linear-gradient(to_right,transparent,black_8%,black_92%,transparent)]">
        <div className="tech-marquee-track flex w-max gap-3">
          {[...TECHNOLOGIES, ...TECHNOLOGIES].map((tech, index) => (
            <Badge key={`${tech.name}-${index}`} name={tech.name} Mark={tech.Mark} />
          ))}
        </div>
      </div>
    </div>
  )
}

export default TechStackTicker
