import { Link } from 'react-router-dom'
import { APP_NAME } from '../../config/appConfig'
import logoImage from '../../assets/logo.png'

function Logo({ hideLabelOnMobile = false }: { hideLabelOnMobile?: boolean }) {
  return (
    <Link to="/" className="flex items-center gap-2 text-xl font-bold">
      <img src={logoImage} alt="" className="h-8 w-8 shrink-0 rounded-lg" />
      <span className={hideLabelOnMobile ? 'hidden sm:inline' : undefined}>{APP_NAME}</span>
    </Link>
  )
}

export default Logo
