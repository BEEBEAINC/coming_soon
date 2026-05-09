export default function Vignette() {
  return (
    <div
      className="vignette"
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 6,
        pointerEvents: 'none',
        background: `radial-gradient(
          ellipse at center,
          transparent 0%,
          transparent 0%,
          rgb(0, 16, 168, 0.5) 100%
        )`,
      }}
    />
  )
}
