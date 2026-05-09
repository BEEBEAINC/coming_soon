import { useRef, useMemo, useEffect } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import * as THREE from 'three'

const PARTICLE_COUNT = 1800

const colorPalette = [
  new THREE.Color('#0010a8'),
  new THREE.Color('#3b509d'),
  new THREE.Color('#4f46e5'),
  new THREE.Color('#6366f1'),
  new THREE.Color('#8b5cf6'),
  new THREE.Color('#a5b4fc'),
  new THREE.Color('#c7d2fe'),
  new THREE.Color('#e9a4f3'),
]

function Particles() {
  const meshRef = useRef<THREE.Points>(null)
  const materialRef = useRef<THREE.ShaderMaterial>(null)
  const mouseRef = useRef({ x: 0, y: 0 })
  const timeRef = useRef(0)

  const { positions, colors, sizes, velocities, originalPositions } = useMemo(() => {
    const positions = new Float32Array(PARTICLE_COUNT * 3)
    const originalPositions = new Float32Array(PARTICLE_COUNT * 3)
    const colors = new Float32Array(PARTICLE_COUNT * 3)
    const sizes = new Float32Array(PARTICLE_COUNT)
    const velocities: {
      vx: number
      vy: number
      vz: number
      noiseOffset: number
      speed: number
    }[] = []

    for (let i = 0; i < PARTICLE_COUNT; i++) {
      const i3 = i * 3

      // Random 3D cloud distribution — no spiral, just scattered space
      const x = (Math.random() - 0.5) * 60
      const y = (Math.random() - 0.5) * 40
      const z = (Math.random() - 0.5) * 30

      positions[i3] = x
      positions[i3 + 1] = y
      positions[i3 + 2] = z

      originalPositions[i3] = x
      originalPositions[i3 + 1] = y
      originalPositions[i3 + 2] = z

      const color = colorPalette[Math.floor(Math.random() * colorPalette.length)]
      colors[i3] = color.r
      colors[i3 + 1] = color.g
      colors[i3 + 2] = color.b

      sizes[i] = Math.random() * 1.8 + 0.3

      velocities.push({
        vx: (Math.random() - 0.5) * 0.008,
        vy: (Math.random() - 0.5) * 0.008,
        vz: (Math.random() - 0.5) * 0.004,
        noiseOffset: Math.random() * 1000,
        speed: Math.random() * 0.3 + 0.1,
      })
    }

    return { positions, colors, sizes, velocities, originalPositions }
  }, [])

  const geometry = useMemo(() => {
    const geo = new THREE.BufferGeometry()
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3))
    geo.setAttribute('color', new THREE.BufferAttribute(colors, 3))
    geo.setAttribute('size', new THREE.BufferAttribute(sizes, 1))
    return geo
  }, [positions, colors, sizes])

  const shaderMaterial = useMemo(
    () =>
      new THREE.ShaderMaterial({
        uniforms: {
          uTime: { value: 0 },
          uPixelRatio: { value: Math.min(window.devicePixelRatio, 2) },
          uMouse: { value: new THREE.Vector2(0, 0) },
        },
        vertexShader: `
          attribute float size;
          attribute vec3 color;
          varying vec3 vColor;
          uniform float uTime;
          uniform float uPixelRatio;
          uniform vec2 uMouse;

          void main() {
            vColor = color;
            vec3 pos = position;

            // Subtle wave distortion based on time
            float wave = sin(uTime * 0.5 + pos.x * 0.1 + pos.y * 0.1) * 0.3;
            pos.z += wave;

            // Mouse repulsion
            float dist = distance(pos.xy, uMouse * 20.0);
            float repel = smoothstep(8.0, 0.0, dist) * 2.0;
            pos.xy += normalize(pos.xy - uMouse * 20.0 + 0.001) * repel;

            vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
            gl_PointSize = size * uPixelRatio * (180.0 / -mvPosition.z);
            gl_Position = projectionMatrix * mvPosition;
          }
        `,
        fragmentShader: `
          varying vec3 vColor;

          void main() {
            float dist = length(gl_PointCoord - vec2(0.5));
            if (dist > 0.5) discard;
            float alpha = 1.0 - smoothstep(0.0, 0.5, dist);
            alpha = pow(alpha, 2.0);
            gl_FragColor = vec4(vColor, alpha * 0.5);
          }
        `,
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
      }),
    []
  )

  useEffect(() => {
    const onMouseMove = (e: MouseEvent) => {
      mouseRef.current.x = (e.clientX / window.innerWidth) * 2 - 1
      mouseRef.current.y = -(e.clientY / window.innerHeight) * 2 + 1
    }
    window.addEventListener('mousemove', onMouseMove)
    return () => window.removeEventListener('mousemove', onMouseMove)
  }, [])

  useFrame(() => {
    if (!meshRef.current || !materialRef.current) return
    timeRef.current += 0.008

    const posArray = geometry.attributes.position.array as Float32Array

    for (let i = 0; i < PARTICLE_COUNT; i++) {
      const i3 = i * 3
      const v = velocities[i]

      // Organic flowing noise-like movement
      const t = timeRef.current * v.speed + v.noiseOffset
      posArray[i3] = originalPositions[i3] + Math.sin(t * 0.7) * 2 + v.vx * Math.sin(t * 2) * 3
      posArray[i3 + 1] = originalPositions[i3 + 1] + Math.cos(t * 0.5) * 1.5 + v.vy * Math.cos(t * 1.5) * 2
      posArray[i3 + 2] = originalPositions[i3 + 2] + Math.sin(t * 0.3) * 1
    }

    geometry.attributes.position.needsUpdate = true

    // Very slow gentle rotation
    meshRef.current.rotation.z += 0.00005

    materialRef.current.uniforms.uTime.value = timeRef.current
    materialRef.current.uniforms.uMouse.value.set(mouseRef.current.x, mouseRef.current.y)
  })

  return (
    <points ref={meshRef} geometry={geometry} material={shaderMaterial}>
      <primitive object={shaderMaterial} ref={materialRef} attach="material" />
    </points>
  )
}

export default function ParticleField() {
  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 0,
        pointerEvents: 'none',
      }}
    >
      <Canvas
        camera={{ position: [0, 0, 35], fov: 60, near: 0.1, far: 1000 }}
        gl={{ antialias: true, alpha: true }}
        style={{ width: '100%', height: '100%' }}
      >
        <Particles />
      </Canvas>
    </div>
  )
}
