import { useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { createProject, type StyleTemplate } from '../../services/projectService'
import { REACT_TEMPLATE, HTML_TEMPLATE } from '../../constants/projectTemplates'
import {
  CodeIcon,
  MonitorIcon,
  ClipboardListIcon,
  GridIcon,
  PlugIcon,
  FormIcon,
  TableIcon,
  UserIcon,
} from '../../components/Icons/Icons'
import Accordion from '../../components/Accordion/Accordion'
import { BootstrapMark, NoneMark, TailwindMark } from '../../components/BrandMarks/BrandMarks'

const AVAILABLE_TEMPLATES = [
  { label: REACT_TEMPLATE, icon: CodeIcon },
  { label: HTML_TEMPLATE, icon: MonitorIcon },
]

const FUTURE_TEMPLATES = [
  { label: 'Todo App', icon: ClipboardListIcon },
  { label: 'Dashboard', icon: GridIcon },
  { label: 'API Example', icon: PlugIcon },
  { label: 'Forms', icon: FormIcon },
  { label: 'Data Table', icon: TableIcon },
]

const STYLE_OPTIONS: { value: StyleTemplate; label: string; description: string; Mark: () => JSX.Element }[] = [
  { value: 'none', label: 'None', description: 'Plain CSS, no framework', Mark: NoneMark },
  { value: 'bootstrap', label: 'Bootstrap', description: 'Component classes, via CDN', Mark: BootstrapMark },
  { value: 'tailwind', label: 'Tailwind CSS', description: 'Utility-first, via CDN', Mark: TailwindMark },
]

type Step = 'name' | 'description' | 'template' | 'style' | 'done'

function CreateProject() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [template, setTemplate] = useState(REACT_TEMPLATE)
  const [styleTemplate, setStyleTemplate] = useState<StyleTemplate>('none')
  const [activeStep, setActiveStep] = useState<Step>('name')
  const [error, setError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  if (!user) return null

  const currentUser = user
  const profileComplete = Boolean(currentUser.name?.trim() && currentUser.email?.trim())

  if (!profileComplete) {
    return (
      <div className="mx-auto flex max-w-md flex-col items-center gap-3 rounded-lg border border-dashed border-[var(--border-panel)] bg-[var(--bg-panel)] px-6 py-16 text-center">
        <span className="flex h-12 w-12 items-center justify-center rounded-full bg-[var(--color-primary-strong)] text-white">
          <UserIcon className="h-6 w-6" />
        </span>
        <h2 className="text-lg font-medium">Complete your profile first</h2>
        <p className="max-w-sm text-sm text-[var(--color-muted)]">
          Add your name and email in Account Settings before creating a project.
        </p>
        <Link
          to="/settings"
          className="mt-2 cursor-pointer rounded-full bg-[var(--color-primary-strong)] px-4 py-2 text-sm font-medium text-white transition-colors hover:opacity-90"
        >
          Go to Account Settings
        </Link>
      </div>
    )
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()

    if (!name.trim()) {
      setError('Project name is required')
      setActiveStep('name')
      return
    }

    setIsSubmitting(true)
    try {
      await createProject({
        name: name.trim(),
        description: description.trim() || undefined,
        template,
        styleTemplate,
      })
      navigate('/dashboard')
    } catch (err) {
      setIsSubmitting(false)
      setError(err instanceof Error ? err.message : 'Could not create this project')
    }
  }

  const styleLabel = STYLE_OPTIONS.find((option) => option.value === styleTemplate)?.label ?? 'None'

  return (
    <div className="mx-auto max-w-2xl">
      <form
        className="flex flex-col gap-2 rounded-lg border border-[var(--border-panel)] bg-[var(--bg-panel)] p-3"
        onSubmit={handleSubmit}
      >
        <Accordion
          open={activeStep === 'name'}
          onToggle={() => setActiveStep('name')}
          title={
            <span className="flex min-w-0 items-center gap-2">
              Project name
              {activeStep !== 'name' && name && (
                <span className="truncate text-xs font-normal text-[var(--color-muted)]">— {name}</span>
              )}
            </span>
          }
        >
          <div className="flex flex-col gap-3 px-3 pb-3">
            <input
              id="project-name"
              className="rounded-lg border border-[var(--border-panel)] bg-[var(--bg-app)] px-3 py-2 text-sm transition-colors"
              placeholder="My new project"
              value={name}
              onChange={(event) => setName(event.target.value)}
              autoFocus
            />
            <div>
              <button
                type="button"
                disabled={!name.trim()}
                onClick={() => setActiveStep('description')}
                className="cursor-pointer rounded-full bg-[var(--color-primary-strong)] px-4 py-1.5 text-xs font-medium text-white transition-colors hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Continue
              </button>
            </div>
          </div>
        </Accordion>

        <Accordion
          open={activeStep === 'description'}
          onToggle={() => setActiveStep('description')}
          title={
            <span className="flex min-w-0 items-center gap-2">
              Description
              {activeStep !== 'description' && (
                <span className="truncate text-xs font-normal text-[var(--color-muted)]">
                  — {description.trim() || 'Skipped'}
                </span>
              )}
            </span>
          }
        >
          <div className="flex flex-col gap-3 px-3 pb-3">
            <textarea
              id="project-description"
              className="rounded-lg border border-[var(--border-panel)] bg-[var(--bg-app)] px-3 py-2 text-sm transition-colors"
              placeholder="What are you building?"
              rows={3}
              value={description}
              onChange={(event) => setDescription(event.target.value)}
            />
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setActiveStep('template')}
                className="cursor-pointer rounded-full bg-[var(--color-primary-strong)] px-4 py-1.5 text-xs font-medium text-white transition-colors hover:opacity-90"
              >
                Continue
              </button>
              <button
                type="button"
                onClick={() => setActiveStep('template')}
                className="cursor-pointer text-xs text-[var(--color-muted)] hover:text-[var(--color-primary)]"
              >
                Skip
              </button>
            </div>
          </div>
        </Accordion>

        <Accordion
          open={activeStep === 'template'}
          onToggle={() => setActiveStep('template')}
          title={
            <span className="flex min-w-0 items-center gap-2">
              Template
              {activeStep !== 'template' && (
                <span className="truncate text-xs font-normal text-[var(--color-muted)]">— {template}</span>
              )}
            </span>
          }
        >
          <div className="flex flex-col gap-3 px-3 pb-3">
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              {AVAILABLE_TEMPLATES.map((option) => (
                <button
                  key={option.label}
                  type="button"
                  onClick={() => {
                    setTemplate(option.label)
                    setActiveStep('style')
                  }}
                  className={`flex cursor-pointer flex-col items-center gap-2 rounded-lg border-2 bg-[var(--bg-app)] p-4 text-center transition-colors ${
                    template === option.label
                      ? 'border-[var(--color-primary)]'
                      : 'border-transparent hover:border-[var(--border-panel)]'
                  }`}
                >
                  <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-[var(--color-primary-strong)] text-white">
                    <option.icon className="h-5 w-5" />
                  </span>
                  <span className="text-xs font-medium">{option.label}</span>
                </button>
              ))}
              {FUTURE_TEMPLATES.map((option) => (
                <div
                  key={option.label}
                  className="flex flex-col items-center gap-2 rounded-lg border border-[var(--border-panel)] bg-[var(--bg-app)] p-4 text-center opacity-50"
                >
                  <span className="flex h-9 w-9 items-center justify-center rounded-lg border border-[var(--border-panel)] text-[var(--color-muted)]">
                    <option.icon className="h-5 w-5" />
                  </span>
                  <span className="text-xs font-medium">{option.label}</span>
                  <span className="text-[10px] text-[var(--color-muted)]">Coming soon</span>
                </div>
              ))}
            </div>
            <p className="text-xs text-[var(--color-muted)]">
              More templates &mdash; including interview-prep challenges &mdash; are coming soon.
            </p>
            <div>
              <button
                type="button"
                onClick={() => setActiveStep('style')}
                className="cursor-pointer rounded-full bg-[var(--color-primary-strong)] px-4 py-1.5 text-xs font-medium text-white transition-colors hover:opacity-90"
              >
                Continue
              </button>
            </div>
          </div>
        </Accordion>

        <Accordion
          open={activeStep === 'style'}
          onToggle={() => setActiveStep('style')}
          title={
            <span className="flex min-w-0 items-center gap-2">
              Style Template
              {activeStep !== 'style' && (
                <span className="truncate text-xs font-normal text-[var(--color-muted)]">— {styleLabel}</span>
              )}
            </span>
          }
        >
          <div className="flex flex-col gap-3 px-3 pb-3">
            <div className="grid grid-cols-3 gap-3">
              {STYLE_OPTIONS.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => {
                    setStyleTemplate(option.value)
                    setActiveStep('done')
                  }}
                  className={`flex cursor-pointer flex-col items-center gap-2 rounded-lg border-2 bg-[var(--bg-app)] p-4 text-center transition-colors ${
                    styleTemplate === option.value
                      ? 'border-[var(--color-primary)]'
                      : 'border-transparent hover:border-[var(--border-panel)]'
                  }`}
                >
                  <option.Mark />
                  <span className="text-xs font-medium">{option.label}</span>
                  <span className="text-[10px] text-[var(--color-muted)]">{option.description}</span>
                </button>
              ))}
            </div>
            <p className="text-xs text-[var(--color-muted)]">
              Applied to your project's starter files automatically — you can remove it later like any other file.
            </p>
          </div>
        </Accordion>

        {error && <p className="text-sm text-red-500">{error}</p>}

        <div className="flex items-center gap-3 px-3 pt-2">
          <button
            type="submit"
            disabled={isSubmitting}
            className="cursor-pointer rounded-full bg-[var(--color-primary-strong)] px-5 py-2.5 text-sm font-medium text-white transition-colors hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isSubmitting ? 'Creating…' : 'Create project'}
          </button>
          <Link to="/dashboard" className="text-sm text-[var(--color-muted)] hover:text-[var(--color-primary)]">
            Cancel
          </Link>
        </div>
      </form>
    </div>
  )
}

export default CreateProject
