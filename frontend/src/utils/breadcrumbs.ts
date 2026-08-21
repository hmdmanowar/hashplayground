export interface Crumb {
  label: string
  path?: string
}

export function getCrumbs(pathname: string): Crumb[] {
  if (pathname === '/login') return [{ label: 'Login', path: '/login' }]
  if (pathname === '/signup') return [{ label: 'Sign up', path: '/signup' }]
  if (pathname === '/dashboard') return [{ label: 'Project Dashboard', path: '/dashboard' }]
  if (pathname === '/admin') return [{ label: 'Admin Dashboard', path: '/admin' }]
  if (pathname === '/projects/new')
    return [{ label: 'Project Dashboard', path: '/dashboard' }, { label: 'Create Project', path: '/projects/new' }]
  if (pathname === '/settings') return [{ label: 'Account Settings', path: '/settings' }]
  if (/^\/projects\/[^/]+$/.test(pathname))
    return [{ label: 'Project Dashboard', path: '/dashboard' }, { label: 'Playground' }]
  return [{ label: 'Home', path: '/' }]
}
