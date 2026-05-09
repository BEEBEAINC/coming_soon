import { useEffect, useRef } from 'react'
import FaultyTerminal from './components/FaultyTerminal'
import HeroImage from './components/HeroImage'
import FuzzyText from './components/FuzzyText'
import GrainOverlay from './components/GrainOverlay'
import Vignette from './components/Vignette'
import './App.css'
import ShinyText from "./components/ShinyText.tsx";

function App() {
  const logoRef = useRef<HTMLDivElement>(null)
  const heroRef = useRef<HTMLDivElement>(null)
  const fuzzyRef = useRef<HTMLDivElement>(null)
  const taglineRef = useRef<HTMLParagraphElement>(null)
  const shinyRef = useRef<HTMLSpanElement>(null)
  const footerRef = useRef<HTMLElement>(null)

  useEffect(() => {
    const els = [logoRef.current, heroRef.current, fuzzyRef.current, taglineRef.current, shinyRef.current, footerRef.current]
    els.forEach((el, i) => {
      if (!el) return
      el.style.opacity = '0'
      el.style.transform = 'translateY(24px)'
      el.style.animation = `fadeInUp 1s ease-out ${0.2 + i * 0.25}s forwards`
    })
  }, [])

  return (
    <>
      <div className="terminal-bg">
        <FaultyTerminal
          scale={.8}
          tint="#cd3aff"
          digitSize={1.3}
          curvature={0.6}
          scanlineIntensity={.3}
          glitchAmount={1}
          flickerAmount={1}
          mouseReact={true}
          mouseStrength={0.2}
          timeScale={0.6}
          pageLoadAnimation={true}
        />
      </div>
      <GrainOverlay />
      <Vignette />

      <main className="content">
        <div className="logo-wrap" ref={logoRef}>
          <img
            src="/src/assets/beebea_logo.svg"
            alt="BEEBEA"
            className="logo-svg"
          />
          <span className="logo-text">beebea.planet</span>
        </div>

        <div className="hero-wrap" ref={heroRef}>
          <HeroImage />
        </div>

        <div className="fuzzy-wrap" ref={fuzzyRef}>
          <FuzzyText className="tagline">coming.soon</FuzzyText>
        </div>

        <p className="tagline" ref={taglineRef}>
          Custom Collectable Merchandise for Artists, Musicians, Streamers, &amp; Creatives
        </p>

        <span className="shiny-text" ref={shinyRef}>
            <ShinyText
                disabled={false}
                speed={9}
                text="Launching 2026"
                className="font-audiowide text-2xl sm:text-3xl"
                color="#7b9dcf"
                shineColor="#2fa0d0"
                spread={100}
            />
        </span>
      </main>

      <footer className="footer" ref={footerRef}>
        <a href="mailto:hello@beebea.planet">hello@beebea.planet</a>
        <span className="footer-dot" />
        <span className="footer-company">BEEBEA INC.</span>
      </footer>
    </>
  )
}

export default App
