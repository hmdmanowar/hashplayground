import Breadcrumb from '../Breadcrumb/Breadcrumb'
import { usePageHeaderActionsValue } from '../../context/PageHeaderContext'

function Header() {
  const actions = usePageHeaderActionsValue()

  return (
    <header className="flex items-start justify-between gap-3">
      <Breadcrumb />
      {actions && <div className="flex items-center">{actions}</div>}
    </header>
  )
}

export default Header
