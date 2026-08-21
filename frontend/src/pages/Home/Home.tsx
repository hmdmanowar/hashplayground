import HeroSection from '../../components/HeroSection/HeroSection'
import WhatIsSection from '../../components/WhatIsSection/WhatIsSection'
import FeatureGrid from '../../components/FeatureGrid/FeatureGrid'
import HowItWorks from '../../components/HowItWorks/HowItWorks'
import WorkspacePreview from '../../components/WorkspacePreview/WorkspacePreview'
import WhyHashPlayground from '../../components/WhyHashPlayground/WhyHashPlayground'
import FutureAISection from '../../components/FutureAISection/FutureAISection'
import LandingFooter from '../../components/LandingFooter/LandingFooter'

const CODE_PATTERN = encodeURIComponent(`
<svg xmlns='http://www.w3.org/2000/svg' width='160' height='160'>
  <text x='8' y='28' font-family='monospace' font-size='20' fill='#8697c4' opacity='0.16'>{ }</text>
  <text x='86' y='66' font-family='monospace' font-size='16' fill='#8697c4' opacity='0.13'>&lt;/&gt;</text>
  <text x='18' y='104' font-family='monospace' font-size='18' fill='#8697c4' opacity='0.11'>;</text>
  <text x='96' y='138' font-family='monospace' font-size='14' fill='#8697c4' opacity='0.13'>#</text>
</svg>
`)

function Home() {
  return (
    <div
      className="min-h-full"
      style={{
        backgroundImage: `url("data:image/svg+xml,${CODE_PATTERN}")`,
        backgroundSize: '160px 160px',
        backgroundRepeat: 'repeat',
      }}
    >
      <HeroSection />
      <WhatIsSection />
      <FeatureGrid />
      <HowItWorks />
      <WorkspacePreview />
      <WhyHashPlayground />
      <FutureAISection />
      <LandingFooter />
    </div>
  )
}

export default Home
