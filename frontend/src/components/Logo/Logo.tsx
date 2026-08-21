import { APP_NAME } from '../../config/appConfig'
import logoImage from '../../assets/logo.png'

function Logo() {
  return (
    <div className="flex items-center gap-2 text-xl font-bold">
      <img src={logoImage} alt="" className="h-8 w-8 shrink-0 rounded-lg" />
      <span>{APP_NAME}</span>
    </div>
  )
}

export default Logo
