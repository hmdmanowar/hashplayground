import { usePersistentToggle } from './usePersistentToggle'
import { isMobileViewport } from '../../../lib/viewport'

export function useSidebarCollapsed() {
  const { value: collapsed, toggle, setValue } = usePersistentToggle('jarvis-sidebar-collapsed', isMobileViewport())
  return { collapsed, toggle, setCollapsed: setValue }
}
