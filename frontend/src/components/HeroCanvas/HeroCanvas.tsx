import { useEffect, useRef } from 'react'
import * as THREE from 'three'

const PARTICLE_COUNT = 220

// A quiet WebGL backdrop for the hero — a drifting particle field, nudged
// by cursor position. Skips mounting entirely under prefers-reduced-motion
// or if WebGL is unavailable, rather than trying to render a static
// fallback frame.
function HeroCanvas() {
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const container = containerRef.current
    if (!container) return
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return

    let renderer: THREE.WebGLRenderer
    try {
      renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true })
    } catch {
      return
    }

    const scene = new THREE.Scene()
    const camera = new THREE.PerspectiveCamera(50, 1, 0.1, 100)
    camera.position.z = 18

    const setSize = () => {
      const { clientWidth, clientHeight } = container
      if (clientWidth === 0 || clientHeight === 0) return
      renderer.setSize(clientWidth, clientHeight)
      camera.aspect = clientWidth / clientHeight
      camera.updateProjectionMatrix()
    }
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    setSize()
    container.appendChild(renderer.domElement)

    const particleGeometry = new THREE.BufferGeometry()
    const positions = new Float32Array(PARTICLE_COUNT * 3)
    for (let i = 0; i < PARTICLE_COUNT; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 40
      positions[i * 3 + 1] = (Math.random() - 0.5) * 22
      positions[i * 3 + 2] = (Math.random() - 0.5) * 20 - 5
    }
    particleGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3))
    const particleMaterial = new THREE.PointsMaterial({
      color: 0x7091e6,
      size: 0.12,
      transparent: true,
      opacity: 0.55,
    })
    const particles = new THREE.Points(particleGeometry, particleMaterial)
    scene.add(particles)

    let mouseX = 0
    let mouseY = 0
    const handlePointerMove = (event: PointerEvent) => {
      const rect = container.getBoundingClientRect()
      mouseX = ((event.clientX - rect.left) / rect.width) * 2 - 1
      mouseY = ((event.clientY - rect.top) / rect.height) * 2 - 1
    }
    window.addEventListener('pointermove', handlePointerMove)

    let frameId: number
    function animate() {
      particles.rotation.y += 0.0006
      camera.position.x += (mouseX * 1.5 - camera.position.x) * 0.02
      camera.position.y += (-mouseY * 1 - camera.position.y) * 0.02
      camera.lookAt(0, 0, 0)
      renderer.render(scene, camera)
      frameId = requestAnimationFrame(animate)
    }
    animate()

    window.addEventListener('resize', setSize)

    return () => {
      cancelAnimationFrame(frameId)
      window.removeEventListener('resize', setSize)
      window.removeEventListener('pointermove', handlePointerMove)
      particleGeometry.dispose()
      particleMaterial.dispose()
      renderer.dispose()
      container.removeChild(renderer.domElement)
    }
  }, [])

  return <div ref={containerRef} className="pointer-events-none absolute inset-0" aria-hidden="true" />
}

export default HeroCanvas
