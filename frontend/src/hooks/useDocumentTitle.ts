import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import { APP_NAME } from '../config/appConfig'
import { getCrumbs } from '../utils/breadcrumbs'
import { SEO_ROUTES, DEFAULT_SEO_DESCRIPTION } from '../config/seo'

function setMetaDescription(content: string) {
  document.querySelector('meta[name="description"]')?.setAttribute('content', content)
}

export function useDocumentTitle() {
  const location = useLocation()

  useEffect(() => {
    const seoEntry = SEO_ROUTES[location.pathname]
    if (seoEntry) {
      document.title = seoEntry.title
      setMetaDescription(seoEntry.description)
      return
    }

    const crumbs = getCrumbs(location.pathname)
    const segments = (crumbs[0]?.path === '/' ? crumbs.slice(1) : crumbs).map((crumb) => crumb.label)
    document.title = [APP_NAME, ...segments].join(' | ')
    setMetaDescription(DEFAULT_SEO_DESCRIPTION)
  }, [location.pathname])
}
