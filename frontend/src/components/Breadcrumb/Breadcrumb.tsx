import { Link, useLocation } from 'react-router-dom'
import { getCrumbs } from '../../utils/breadcrumbs'
import { usePageTitleValue, usePageTitleSuffixValue } from '../../context/PageHeaderContext'

function Breadcrumb() {
  const location = useLocation()
  const titleOverride = usePageTitleValue()
  const titleSuffix = usePageTitleSuffixValue()
  if (location.pathname === '/') return null

  const crumbs = getCrumbs(location.pathname)
  const displayCrumbs = titleOverride ? [...crumbs, { label: titleOverride }] : crumbs
  const lastIndex = displayCrumbs.length - 1
  const title = displayCrumbs[lastIndex]?.label ?? ''

  return (
    <div className="mb-3">
      <nav aria-label="Breadcrumb" className="flex items-center gap-2 text-sm">
        {displayCrumbs.map((crumb, index) => {
          const isLast = index === lastIndex
          return (
            <span key={`${crumb.label}-${index}`} className="flex items-center gap-2">
              {index > 0 && (
                <span className="text-[var(--color-muted)]" aria-hidden="true">
                  /
                </span>
              )}
              {crumb.path && !isLast ? (
                <Link to={crumb.path} className="text-[var(--color-muted)] hover:text-[var(--color-primary)]">
                  {crumb.label}
                </Link>
              ) : (
                <span className={isLast ? 'font-medium text-[var(--color-muted)]' : 'text-[var(--color-muted)]'}>
                  {crumb.label}
                </span>
              )}
            </span>
          )
        })}
      </nav>
      <div className="flex items-center gap-2">
        <h1 className="text-xl font-semibold">{title}</h1>
        {titleSuffix}
      </div>
    </div>
  )
}

export default Breadcrumb
