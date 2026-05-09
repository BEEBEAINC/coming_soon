import { useRef, useEffect } from 'react'

export default function HeroImage() {
  const imgRef = useRef<HTMLDivElement>(null)
  const glowRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const img = imgRef.current
    const glow = glowRef.current
    if (!img || !glow) return

    let rafId: number
    let time = 0

    const animate = () => {
      time += 0.015
      const floatY = Math.sin(time) * 8
      const floatRotate = Math.sin(time * 0.5) * 1.5
      const scale = 1 + Math.sin(time * 0.7) * 0.015

      img.style.transform = `translateY(${floatY}px) rotate(${floatRotate}deg) scale(${scale})`

      // Pulsing glow
      const glowOpacity = 0.15 + Math.sin(time * 1.2) * 0.08
      const glowSpread = 60 + Math.sin(time * 0.8) * 20
      glow.style.opacity = String(glowOpacity)
      glow.style.filter = `blur(${glowSpread}px)`

      rafId = requestAnimationFrame(animate)
    }

    rafId = requestAnimationFrame(animate)
    return () => cancelAnimationFrame(rafId)
  }, [])

  return (
    <div className="hero-image-container">
      <div ref={glowRef} className="hero-image-glow" />
      <div ref={imgRef} className="hero-image-wrapper">
        <img
          src="/beebea_produt_image.webp"
          alt="BEEBEA Product"
          className="hero-image"
        />
      </div>
    </div>
  )
}
