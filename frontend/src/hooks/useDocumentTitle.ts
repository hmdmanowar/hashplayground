import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import { APP_NAME } from '../config/appConfig'
import { getCrumbs } from '../utils/breadcrumbs'

export function useDocumentTitle() {
  const location = useLocation()

  useEffect(() => {
    const crumbs = getCrumbs(location.pathname)
    const segments = (crumbs[0]?.path === '/' ? crumbs.slice(1) : crumbs).map((crumb) => crumb.label)
    document.title = [APP_NAME, ...segments].join(' | ')
  }, [location.pathname])
}
