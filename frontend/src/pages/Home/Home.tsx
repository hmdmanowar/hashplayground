import HeroSection from '../../components/HeroSection/HeroSection'
import HeroCanvas from '../../components/HeroCanvas/HeroCanvas'
import TechStackTicker from '../../components/TechStackTicker/TechStackTicker'
import WhatIsSection from '../../components/WhatIsSection/WhatIsSection'
import FeatureGrid from '../../components/FeatureGrid/FeatureGrid'
import HowItWorks from '../../components/HowItWorks/HowItWorks'
import WorkspacePreview from '../../components/WorkspacePreview/WorkspacePreview'
import WhyHashPlayground from '../../components/WhyHashPlayground/WhyHashPlayground'
import RoadmapSection from '../../components/RoadmapSection/RoadmapSection'
import LandingFooter from '../../components/LandingFooter/LandingFooter'

function Home() {
  return (
    <div className="min-h-full">
      <div className="fixed inset-0 -z-10">
        <div
          className="absolute inset-0 overflow-hidden opacity-30"
          style={{
            backgroundImage:
              'linear-gradient(to right, var(--border-panel) 1px, transparent 1px), linear-gradient(to bottom, var(--border-panel) 1px, transparent 1px)',
            backgroundSize: '28px 28px',
            maskImage: 'radial-gradient(circle, black, transparent 75%)',
            WebkitMaskImage: 'radial-gradient(circle, black, transparent 75%)',
          }}
        >
          <div className="grid-glow" aria-hidden="true" />
        </div>
        <HeroCanvas />
      </div>
      <div className="relative" style={{ paddingInline: '15px' }}>
        <HeroSection />
        <TechStackTicker />
        <WhatIsSection />
        <FeatureGrid />
        <HowItWorks />
        <WorkspacePreview />
        <WhyHashPlayground />
        <RoadmapSection />
        <LandingFooter />
      </div>
    </div>
  )
}

export default Home
