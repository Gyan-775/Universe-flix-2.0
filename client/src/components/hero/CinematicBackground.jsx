import { useEffect, useRef } from 'react'

export default function CinematicBackground() {
  const canvasRef = useRef(null)

  useEffect(() => {
    const canvas = canvasRef.current
    const context = canvas?.getContext('2d')
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (!canvas || !context || reduced) return undefined

    let animationFrame
    let particles = []
    let width = 0
    let height = 0

    const resize = () => {
      const ratio = Math.min(window.devicePixelRatio || 1, 2)
      width = window.innerWidth
      height = window.innerHeight
      canvas.width = width * ratio
      canvas.height = height * ratio
      canvas.style.width = `${width}px`
      canvas.style.height = `${height}px`
      context.setTransform(ratio, 0, 0, ratio, 0, 0)
      const count = Math.max(42, Math.min(100, Math.round(width * height / 18000)))
      particles = Array.from({ length: count }, () => ({
        x: Math.random() * width,
        y: Math.random() * height,
        vx: (Math.random() - 0.5) * 0.18,
        vy: (Math.random() - 0.5) * 0.18,
      }))
    }

    const draw = () => {
      context.clearRect(0, 0, width, height)
      particles.forEach((particle, index) => {
        particle.x += particle.vx
        particle.y += particle.vy
        if (particle.x < 0 || particle.x > width) particle.vx *= -1
        if (particle.y < 0 || particle.y > height) particle.vy *= -1
        context.fillStyle = 'rgba(145, 169, 255, .65)'
        context.fillRect(particle.x, particle.y, 1.4, 1.4)
        for (let next = index + 1; next < particles.length; next += 1) {
          const other = particles[next]
          const distance = Math.hypot(particle.x - other.x, particle.y - other.y)
          if (distance < 130) {
            context.strokeStyle = `rgba(100, 140, 255, ${0.14 * (1 - distance / 130)})`
            context.beginPath()
            context.moveTo(particle.x, particle.y)
            context.lineTo(other.x, other.y)
            context.stroke()
          }
        }
      })
      animationFrame = requestAnimationFrame(draw)
    }

    resize()
    draw()
    window.addEventListener('resize', resize)
    return () => {
      cancelAnimationFrame(animationFrame)
      window.removeEventListener('resize', resize)
    }
  }, [])

  return <canvas ref={canvasRef} className="cinematic-canvas" aria-hidden="true" />
}
