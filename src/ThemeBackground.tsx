import RealisticNature from './RealisticNature'
import { useEffect, useRef } from 'react'
import * as THREE from 'three'

export type Theme =
  | 'light'
  | 'dark'
  | 'earthy'
  | 'nature'
  | 'sunshine'
  | 'blue-sky'
  | 'ocean'

type SceneTheme = Exclude<Theme, 'light' | 'dark'>

const palettes: Record<
  SceneTheme,
  {
    sky: string
    ground: string
    hill: string
    accent: string
    water: string
  }
> = {
  earthy: {
    sky: '#e9dfcb',
    ground: '#c5b18b',
    hill: '#858763',
    accent: '#666e45',
    water: '#a5b6a0',
  },
  nature: {
    sky: '#dce9dc',
    ground: '#8fa98a',
    hill: '#52765c',
    accent: '#294e3c',
    water: '#83b8ac',
  },
  sunshine: {
    sky: '#fff0c6',
    ground: '#e5cd86',
    hill: '#c6b56c',
    accent: '#a69555',
    water: '#c9d4ad',
  },
  'blue-sky': {
    sky: '#d8edf9',
    ground: '#b9d9e5',
    hill: '#8bb8ce',
    accent: '#6595b2',
    water: '#a4d4e9',
  },
  ocean: {
    sky: '#123a53',
    ground: '#164f62',
    hill: '#1c6472',
    accent: '#298b91',
    water: '#237e91',
  },
}

function StylizedThemeBackground({
      theme,
}: {
  theme: Theme
}) {
  const hostRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const host = hostRef.current

    if (!host || theme === 'light' || theme === 'dark') {
      return
    }

    const palette = palettes[theme]
    const scene = new THREE.Scene()

    scene.background = new THREE.Color(palette.sky)
    scene.fog = new THREE.Fog(palette.sky, 18, 65)

    let renderer: THREE.WebGLRenderer

    try {
      renderer = new THREE.WebGLRenderer({
        antialias: true,
        alpha: false,
        powerPreference: 'low-power',
      })
    } catch {
      // The CSS theme remains available without WebGL.
      return
    }

    renderer.setPixelRatio(
      Math.min(window.devicePixelRatio, 1.5)
    )

    renderer.outputColorSpace = THREE.SRGBColorSpace
    host.appendChild(renderer.domElement)

    const camera = new THREE.PerspectiveCamera(
      45,
      1,
      0.1,
      100
    )

    camera.position.set(0, 7, 18)
    camera.lookAt(0, 0, -8)

    scene.add(new THREE.HemisphereLight('#ffffff', palette.ground, 2))

    const sunlight = new THREE.DirectionalLight('#fff7e5', 2.2)
    sunlight.position.set(-8, 14, 5)
    scene.add(sunlight)

    const materials: THREE.Material[] = []
    const geometries: THREE.BufferGeometry[] = []

    function material(color: string, roughness = 0.9) {
      const result = new THREE.MeshStandardMaterial({
        color,
        roughness,
      })

      materials.push(result)
      return result
    }

    function mesh(
      geometry: THREE.BufferGeometry,
      surface: THREE.Material
    ) {
      geometries.push(geometry)

      const result = new THREE.Mesh(geometry, surface)
      scene.add(result)

      return result
    }

    const ground = mesh(
      new THREE.PlaneGeometry(120, 120),
      material(palette.ground)
    )

    ground.rotation.x = -Math.PI / 2
    ground.position.set(0, -1.1, -15)

    // Rounded hills give the landscape depth.
    if (theme !== 'ocean') {
      const hillMaterial = material(palette.hill)

      for (let index = 0; index < 9; index += 1) {
        const hill = mesh(
          new THREE.SphereGeometry(1, 24, 16),
          hillMaterial
        )

        hill.position.set(
          (index - 4) * 6,
          -1.5,
          -15 - (index % 3) * 6
        )

        hill.scale.set(
          5 + (index % 3),
          2.5 + (index % 2),
          5
        )
      }
    }

    // Nature adds small sculpted trees along the riverbank.
    if (theme === 'nature') {
      const trunkMaterial = material('#725b45')
      const leafMaterial = material(palette.accent)

      for (let index = 0; index < 16; index += 1) {
        const side = index % 2 === 0 ? -1 : 1
        const x = side * (5.5 + (index % 3) * 1.4)
        const z = 2 - Math.floor(index / 2) * 3
        const height = 1.8 + (index % 3) * 0.4

        const trunk = mesh(
          new THREE.CylinderGeometry(0.12, 0.18, height, 7),
          trunkMaterial
        )

        trunk.position.set(x, height / 2 - 0.9, z)

        const leaves = mesh(
          new THREE.ConeGeometry(1.1, height * 1.8, 9),
          leafMaterial
        )

        leaves.position.set(x, height - 0.2, z)
      }
    }

    // A gently moving water surface.
    const waterGeometry = new THREE.PlaneGeometry(
      theme === 'ocean' ? 100 : 8,
      100,
      44,
      70
    )

    const water = mesh(
      waterGeometry,
      material(palette.water, 0.3)
    )

    water.rotation.x = -Math.PI / 2
    water.position.set(0, -0.8, -20)

    const positions = waterGeometry.getAttribute('position')
    const original = Float32Array.from(positions.array)

    // Soft cloud clusters.
    const clouds: THREE.Group[] = []
    const cloudMaterial = material(
      theme === 'ocean' ? '#547c8b' : '#fffdf4'
    )

    for (let index = 0; index < 5; index += 1) {
      const cloud = new THREE.Group()

      for (let puff = 0; puff < 3; puff += 1) {
        const geometry = new THREE.SphereGeometry(1, 16, 12)
        geometries.push(geometry)

        const sphere = new THREE.Mesh(
          geometry,
          cloudMaterial
        )

        sphere.position.set(
          puff * 1.1,
          puff === 1 ? 0.3 : 0,
          0
        )

        sphere.scale.set(1.5, 0.65, 0.8)
        cloud.add(sphere)
      }

      cloud.position.set(
        -18 + index * 8,
        8 + (index % 2) * 2,
        -22 - index * 3
      )

      scene.add(cloud)
      clouds.push(cloud)
    }

    if (theme === 'sunshine') {
      const sunGeometry = new THREE.SphereGeometry(2.4, 24, 16)
      const sunMaterial = new THREE.MeshBasicMaterial({
        color: '#ffdc82',
      })

      materials.push(sunMaterial)
      const sun = mesh(sunGeometry, sunMaterial)
      sun.position.set(-11, 11, -30)
    }

    function resize() {
      if (!host) return

      const width = Math.max(host.clientWidth, 1)
      const height = Math.max(host.clientHeight, 1)

      renderer.setSize(width, height, false)
      camera.aspect = width / height
      camera.updateProjectionMatrix()
      renderer.render(scene, camera)
    }

    const observer = new ResizeObserver(resize)
    observer.observe(host)

    const motionPreference = window.matchMedia(
      '(prefers-reduced-motion: reduce)'
    )

    let elapsed = 0
    let previousTime = 0
    let previousFrame = 0

    function animate(time: number) {
      if (time - previousFrame < 33) return
      previousFrame = time

      if (previousTime) {
        elapsed += Math.min((time - previousTime) / 1000, 0.1)
      }

      previousTime = time

      for (let index = 0; index < positions.count; index += 1) {
        const x = original[index * 3]
        const y = original[index * 3 + 1]

        const wave =
          Math.sin(x * 1.5 + elapsed * 0.65) * 0.07 +
          Math.cos(y * 0.8 + elapsed * 0.8) * 0.06

        positions.setZ(index, wave)
      }

      positions.needsUpdate = true
      waterGeometry.computeVertexNormals()

      clouds.forEach((cloud, index) => {
        cloud.position.x =
          -18 + index * 8 + Math.sin(elapsed * 0.04 + index) * 2
      })

      renderer.render(scene, camera)
    }

    function updateAnimation() {
      previousTime = 0

      if (motionPreference.matches || document.hidden) {
        renderer.setAnimationLoop(null)
        renderer.render(scene, camera)
      } else {
        renderer.setAnimationLoop(animate)
      }
    }

    motionPreference.addEventListener('change', updateAnimation)
    document.addEventListener('visibilitychange', updateAnimation)

    resize()
    updateAnimation()

    return () => {
      observer.disconnect()
      motionPreference.removeEventListener(
        'change',
        updateAnimation
      )
      document.removeEventListener(
        'visibilitychange',
        updateAnimation
      )

      renderer.setAnimationLoop(null)

      geometries.forEach((geometry) => geometry.dispose())
      materials.forEach((surface) => surface.dispose())

      renderer.dispose()
      renderer.domElement.remove()
    }
  }, [theme])

  if (theme === 'light' || theme === 'dark') return null

  return (
    <div
      ref={hostRef}
      className="theme-scene"
      aria-hidden="true"
    />
  )
}

export default function ThemeBackground({
  theme,
}: {
  theme: Theme
}) {
  if (theme === 'nature') {
    return <RealisticNature />
  }

  return <StylizedThemeBackground theme={theme} />
}