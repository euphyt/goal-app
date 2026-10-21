import { useEffect, useRef } from 'react'
import * as THREE from 'three'
import { Reflector } from 'three/addons/objects/Reflector.js'

function createRandom(seed: number) {
  let value = seed

  return () => {
    value = (value * 1664525 + 1013904223) >>> 0
    return value / 4294967296
  }
}

function surfaceNoise(x: number, y: number) {
  return (
    Math.sin(x * 0.73 + y * 0.21) * 0.48 +
    Math.sin(x * 1.91 - y * 0.47) * 0.25 +
    Math.cos(x * 4.13 + y * 1.17) * 0.13 +
    Math.sin(x * 8.23 - y * 2.31) * 0.07
  )
}

function cliffX(side: number, y: number, z: number) {
  return (
    side *
    (
      9.3 +
      y * 0.055 +
      Math.sin(z * 0.14) * 1.8 +
      surfaceNoise(z * 0.4, y * 0.5) * 1.2
    )
  )
}

function createRockTexture() {
  const canvas = document.createElement('canvas')
  canvas.width = 512
  canvas.height = 512

  const context = canvas.getContext('2d')!
  const image = context.createImageData(512, 512)
  const random = createRandom(84)

  for (let y = 0; y < 512; y += 1) {
    for (let x = 0; x < 512; x += 1) {
      const index = (y * 512 + x) * 4

      const broad = surfaceNoise(x * 0.035, y * 0.025)
      const grain = random() * 24
      const layers = Math.sin(y * 0.5 + Math.sin(x * 0.03)) * 9
      const cracks =
        Math.sin(x * 0.16 + Math.sin(y * 0.02)) > 0.97
          ? -30
          : 0

      const shade = 95 + broad * 28 + grain + layers + cracks

      image.data[index] = shade * 0.91
      image.data[index + 1] = shade
      image.data[index + 2] = shade * 0.86
      image.data[index + 3] = 255
    }
  }

  context.putImageData(image, 0, 0)

  const texture = new THREE.CanvasTexture(canvas)
  texture.colorSpace = THREE.SRGBColorSpace
  texture.wrapS = THREE.RepeatWrapping
  texture.wrapT = THREE.RepeatWrapping
  texture.repeat.set(5, 4)

  return texture
}

function createLeafTexture() {
  const canvas = document.createElement('canvas')
  canvas.width = 256
  canvas.height = 512

  const context = canvas.getContext('2d')!

  const gradient = context.createLinearGradient(0, 0, 256, 512)
  gradient.addColorStop(0, '#648a45')
  gradient.addColorStop(0.45, '#355d32')
  gradient.addColorStop(1, '#193e2b')

  context.fillStyle = gradient
  context.fillRect(0, 0, 256, 512)

  const random = createRandom(92)

  for (let index = 0; index < 1800; index += 1) {
    context.fillStyle = `rgba(175, 192, 98, ${random() * 0.1})`
    context.fillRect(
      random() * 256,
      random() * 512,
      1 + random() * 3,
      1 + random() * 3
    )
  }

  // Central vein.
  context.strokeStyle = '#a2b96b'
  context.lineWidth = 3
  context.beginPath()
  context.moveTo(128, 512)
  context.lineTo(128, 0)
  context.stroke()

  // Branching veins.
  for (let index = 1; index <= 10; index += 1) {
    const y = index * 44

    for (const side of [-1, 1]) {
      context.strokeStyle = 'rgba(173, 193, 116, 0.7)'
      context.lineWidth = 1.3
      context.beginPath()
      context.moveTo(128, y)
      context.quadraticCurveTo(
        128 + side * 62,
        y - 20,
        128 + side * 126,
        y - 75
      )
      context.stroke()
    }
  }

  const texture = new THREE.CanvasTexture(canvas)
  texture.colorSpace = THREE.SRGBColorSpace
  return texture
}

function createMistTexture() {
  const canvas = document.createElement('canvas')
  canvas.width = 128
  canvas.height = 128

  const context = canvas.getContext('2d')!
  const gradient = context.createRadialGradient(
    64, 64, 0,
    64, 64, 64
  )

  gradient.addColorStop(0, 'rgba(236, 240, 226, 0.65)')
  gradient.addColorStop(0.4, 'rgba(236, 240, 226, 0.25)')
  gradient.addColorStop(1, 'rgba(236, 240, 226, 0)')

  context.fillStyle = gradient
  context.fillRect(0, 0, 128, 128)

  const texture = new THREE.CanvasTexture(canvas)
  texture.colorSpace = THREE.SRGBColorSpace
  return texture
}

const waterfallVertex = `
  varying vec2 vUv;
  varying float vDistance;

  void main() {
    vUv = uv;

    vec4 viewPosition = modelViewMatrix * vec4(position, 1.0);
    vDistance = length(viewPosition.xyz);

    gl_Position = projectionMatrix * viewPosition;
  }
`

const waterfallFragment = `
  varying vec2 vUv;
  varying float vDistance;

  void main() {
    float center = abs(vUv.x - 0.5) * 2.0;

    float strands =
      sin(vUv.x * 96.0 + sin(vUv.y * 31.0) * 2.0) * 0.5 + 0.5;

    float fine =
      sin(vUv.x * 211.0 + vUv.y * 43.0) * 0.5 + 0.5;

    float edge = 1.0 - smoothstep(0.3, 1.0, center);

    float opacity =
      edge * (0.27 + strands * 0.38 + fine * 0.16);

    vec3 color = mix(
      vec3(0.68, 0.77, 0.73),
      vec3(0.95, 0.98, 0.93),
      strands
    );

    float mist = smoothstep(25.0, 100.0, vDistance);
    color = mix(color, vec3(0.68, 0.73, 0.67), mist * 0.6);

    gl_FragColor = vec4(color, opacity);

    #include <tonemapping_fragment>
    #include <colorspace_fragment>
  }
`

const poolShader = {
  uniforms: {
    color: { value: new THREE.Color('#526c49') },
    tDiffuse: { value: null },
    textureMatrix: { value: new THREE.Matrix4() },
  },

  vertexShader: `
    uniform mat4 textureMatrix;

    varying vec4 vReflection;
    varying vec2 vSurface;

    void main() {
      vReflection = textureMatrix * vec4(position, 1.0);
      vSurface = position.xy;

      gl_Position =
        projectionMatrix *
        modelViewMatrix *
        vec4(position, 1.0);
    }
  `,

  fragmentShader: `
    uniform sampler2D tDiffuse;
    uniform vec3 color;

    varying vec4 vReflection;
    varying vec2 vSurface;

    void main() {
      vec4 projected = vReflection;

      // Fixed ripples: detailed, but not animated.
      projected.x +=
        sin(vSurface.y * 12.0 + vSurface.x * 1.8) *
        0.0007 * projected.w;

      projected.y +=
        sin(vSurface.y * 21.0) *
        0.00035 * projected.w;

      vec3 reflection = texture2DProj(tDiffuse, projected).rgb;

      float ripple =
        sin(vSurface.y * 32.0 + sin(vSurface.x * 1.3)) *
        0.009;

      vec3 water = mix(
        vec3(0.055, 0.105, 0.065),
        reflection * color,
        0.68
      );

      gl_FragColor = vec4(water + ripple, 1.0);

      #include <tonemapping_fragment>
      #include <colorspace_fragment>
    }
  `,
}

export default function RealisticNature() {
  const hostRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const host = hostRef.current
    if (!host) return

    const random = createRandom(147)
    const scene = new THREE.Scene()

    scene.background = new THREE.Color('#b9bdb7')
    scene.fog = new THREE.FogExp2('#b9bdb7', 0.013)

    let renderer: THREE.WebGLRenderer

    try {
      renderer = new THREE.WebGLRenderer({
        antialias: true,
        powerPreference: 'low-power',
      })
    } catch {
      return
    }

    renderer.setPixelRatio(
      Math.min(window.devicePixelRatio, 1.5)
    )
    renderer.outputColorSpace = THREE.SRGBColorSpace
    renderer.toneMapping = THREE.ACESFilmicToneMapping
    renderer.toneMappingExposure = 1.1

    host.appendChild(renderer.domElement)

    const camera = new THREE.PerspectiveCamera(
      53,
      1,
      0.1,
      180
    )

    camera.position.set(0, 5.5, 23)
    camera.lookAt(0, 14, -27)

    // Diffuse, cloudy lighting.
    scene.add(
      new THREE.HemisphereLight(
        '#e4e8df',
        '#263322',
        2.1
      )
    )

    const daylight = new THREE.DirectionalLight('#fff5dc', 1.8)
    daylight.position.set(-15, 40, 12)
    scene.add(daylight)

    const geometries = new Set<THREE.BufferGeometry>()
    const materials = new Set<THREE.Material>()
    const textures = new Set<THREE.Texture>()

    function geometry<T extends THREE.BufferGeometry>(value: T) {
      geometries.add(value)
      return value
    }

    function material<T extends THREE.Material>(value: T) {
      materials.add(value)
      return value
    }

    const rockTexture = createRockTexture()
    const leafTexture = createLeafTexture()
    const mistTexture = createMistTexture()

    textures.add(rockTexture)
    textures.add(leafTexture)
    textures.add(mistTexture)

    rockTexture.anisotropy = Math.min(
      4,
      renderer.capabilities.getMaxAnisotropy()
    )

    const cliffMaterial = material(
      new THREE.MeshStandardMaterial({
        color: '#7e8472',
        map: rockTexture,
        bumpMap: rockTexture,
        bumpScale: 0.3,
        roughness: 1,
        side: THREE.DoubleSide,
      })
    )

    // Two long, uneven cliff walls.
    for (const side of [-1, 1]) {
      const wall = geometry(
        new THREE.PlaneGeometry(1, 1, 100, 85)
      )

      const positions = wall.getAttribute('position')
      const uv = wall.getAttribute('uv')

      for (let index = 0; index < positions.count; index += 1) {
        const u = uv.getX(index)
        const v = uv.getY(index)

        const z = 7 - u * 85
        const height =
          (side === -1 ? 42 : 46) +
          Math.sin(u * 11) * 5 +
          Math.sin(u * 27) * 2

        const y = v * height - 1
        const x = cliffX(side, y, z)

        positions.setXYZ(index, x, y, z)
      }

      wall.computeVertexNormals()
      scene.add(new THREE.Mesh(wall, cliffMaterial))
    }

    // Distant mountain closing the valley.
    const mountainGeometry = geometry(
      new THREE.ConeGeometry(18, 49, 55, 35)
    )

    const mountainPositions =
      mountainGeometry.getAttribute('position')

    for (
      let index = 0;
      index < mountainPositions.count;
      index += 1
    ) {
      const x = mountainPositions.getX(index)
      const y = mountainPositions.getY(index)
      const z = mountainPositions.getZ(index)
      const roughness = surfaceNoise(x * 0.6, y * 0.4)

      mountainPositions.setXYZ(
        index,
        x + roughness * 1.1,
        y,
        z + roughness
      )
    }

    mountainGeometry.computeVertexNormals()

    const mountainMaterial = material(
      new THREE.MeshStandardMaterial({
        color: '#68775a',
        map: rockTexture,
        roughness: 1,
      })
    )

    const mountain = new THREE.Mesh(
      mountainGeometry,
      mountainMaterial
    )

    mountain.position.set(-1, 23, -82)
    mountain.scale.z = 0.65
    scene.add(mountain)

    // Dense vegetation clinging to the cliffs.
    const foliageGeometry = geometry(
      new THREE.IcosahedronGeometry(1, 1)
    )

    const foliageMaterial = material(
      new THREE.MeshStandardMaterial({
        color: '#ffffff',
        roughness: 1,
      })
    )

    const foliageCount = 7000

    const vegetation = new THREE.InstancedMesh(
      foliageGeometry,
      foliageMaterial,
      foliageCount
    )

    vegetation.frustumCulled = false

    const transform = new THREE.Object3D()
    const foliageColor = new THREE.Color()

    for (let index = 0; index < foliageCount; index += 1) {
      const side = index % 2 ? -1 : 1
      const z = 5 - random() * 80
      const y = 1 + random() * 40

      const exposedRock =
        Math.sin(z * 0.25 + y * 0.16) > 0.72 &&
        y > 12

      const scale = exposedRock
        ? 0.08 + random() * 0.12
        : 0.25 + random() * 0.7

      transform.position.set(
        cliffX(side, y, z) - side * 0.35,
        y,
        z
      )

      transform.scale.set(
        scale * 0.8,
        scale * (0.75 + random()),
        scale
      )

      transform.rotation.set(
        random() * Math.PI,
        random() * Math.PI,
        random() * Math.PI
      )

      transform.updateMatrix()
      vegetation.setMatrixAt(index, transform.matrix)

      foliageColor.setHSL(
        0.23 + random() * 0.09,
        0.2 + random() * 0.2,
        0.11 + random() * 0.13
      )

      vegetation.setColorAt(index, foliageColor)
    }

    scene.add(vegetation)

    // Far shoreline and dense plants at the water's edge.
    const shoreGeometry = geometry(
      new THREE.SphereGeometry(1, 28, 14)
    )

    const shoreMaterial = material(
      new THREE.MeshStandardMaterial({
        color: '#354b25',
        roughness: 1,
      })
    )

    for (let index = 0; index < 36; index += 1) {
      const shore = new THREE.Mesh(
        shoreGeometry,
        shoreMaterial
      )

      shore.position.set(
        -14 + index * 0.8,
        -0.2 + random() * 0.35,
        -15 - Math.sin(index * 0.12) * 2
      )

      shore.scale.set(
        1.2,
        0.6 + random() * 0.7,
        1.1
      )

      scene.add(shore)
    }

    // Curved waterfall ribbons.
    const waterfallMaterial = material(
      new THREE.ShaderMaterial({
        vertexShader: waterfallVertex,
        fragmentShader: waterfallFragment,
        transparent: true,
        depthWrite: false,
        side: THREE.DoubleSide,
      })
    )

    function addWaterfall(
      top: THREE.Vector3,
      bottom: THREE.Vector3,
      width: number
    ) {
      const rows = 100
      const columns = 8

      const ribbon = geometry(
        new THREE.PlaneGeometry(
          1,
          1,
          columns,
          rows
        )
      )

      const positions = ribbon.getAttribute('position')
      const uv = ribbon.getAttribute('uv')

      for (let index = 0; index < positions.count; index += 1) {
        const u = uv.getX(index)
        const t = 1 - uv.getY(index)

        const center = new THREE.Vector3().lerpVectors(
          top,
          bottom,
          t
        )

        center.x +=
          Math.sin(t * 8) * width * 0.13 +
          Math.sin(t * 19) * width * 0.06

        center.z += Math.sin(t * Math.PI) * 0.5

        const spread =
          width * (0.55 + t * 0.8) *
          (1 + Math.sin(t * 17) * 0.1)

        positions.setXYZ(
          index,
          center.x + (u - 0.5) * spread,
          center.y,
          center.z
        )
      }

      ribbon.computeVertexNormals()

      scene.add(
        new THREE.Mesh(ribbon, waterfallMaterial)
      )

      // Soft spray gathering at the foot.
      for (let index = 0; index < 8; index += 1) {
        const sprayMaterial = material(
          new THREE.SpriteMaterial({
            map: mistTexture,
            transparent: true,
            opacity: 0.15 + random() * 0.14,
            depthWrite: false,
          })
        )

        const spray = new THREE.Sprite(sprayMaterial)

        spray.position.set(
          bottom.x + (random() - 0.5) * 3,
          bottom.y + random() * 2,
          bottom.z + random() * 2
        )

        const size = 2 + random() * 3
        spray.scale.set(size, size * 1.3, 1)
        scene.add(spray)
      }
    }

    // Tall waterfall on the far right.
    addWaterfall(
      new THREE.Vector3(9.1, 36, -35),
      new THREE.Vector3(7.7, 1, -29),
      0.75
    )

    // Broader waterfall closer to the center.
    addWaterfall(
      new THREE.Vector3(7.1, 27, -23),
      new THREE.Vector3(4.9, 0.8, -18),
      1.05
    )

    // Smaller waterfall deeper in the valley.
    addWaterfall(
      new THREE.Vector3(-2.7, 16.5, -48),
      new THREE.Vector3(-3.2, 0.8, -43),
      0.65
    )

    // A dark ledge behind the smaller waterfall.
    const ledge = new THREE.Mesh(
      geometry(new THREE.BoxGeometry(7, 17, 4)),
      cliffMaterial
    )

    ledge.position.set(-2.5, 7, -51)
    scene.add(ledge)

    // Reflective, olive-green pool.
    const poolGeometry = geometry(
      new THREE.PlaneGeometry(52, 65)
    )

    const pool = new Reflector(poolGeometry, {
      clipBias: 0.003,
      textureWidth: 768,
      textureHeight: 768,
      color: 0x526c49,
      multisample: 0,
      shader: poolShader,
    })

    pool.rotation.x = -Math.PI / 2
    pool.position.set(0, 0, 5)
    scene.add(pool)

    // A leaning tree on the left.
    const barkMaterial = material(
      new THREE.MeshStandardMaterial({
        color: '#343b27',
        roughness: 1,
      })
    )

    const treeCurve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(-11, 0, -9),
      new THREE.Vector3(-10.2, 4, -10),
      new THREE.Vector3(-7.6, 7.3, -11),
      new THREE.Vector3(-6.2, 10, -12),
    ])

    scene.add(
      new THREE.Mesh(
        geometry(
          new THREE.TubeGeometry(
            treeCurve,
            24,
            0.13,
            7,
            false
          )
        ),
        barkMaterial
      )
    )

    const crownMaterial = material(
      new THREE.MeshStandardMaterial({
        color: '#627841',
        roughness: 1,
      })
    )

    for (let index = 0; index < 65; index += 1) {
      const crown = new THREE.Mesh(
        foliageGeometry,
        crownMaterial
      )

      crown.position.set(
        -6.5 + (random() - 0.5) * 5,
        9.4 + random() * 2.1,
        -12 + (random() - 0.5) * 3
      )

      crown.scale.set(
        0.6 + random() * 0.7,
        0.3 + random() * 0.4,
        0.5 + random() * 0.6
      )

      scene.add(crown)
    }

    // Large, curved elephant-ear leaves.
    const leafMaterial = material(
      new THREE.MeshStandardMaterial({
        map: leafTexture,
        roughness: 0.47,
        metalness: 0,
        side: THREE.DoubleSide,
        color: '#d3e2b0',
      })
    )

    function addLeaf(
      x: number,
      y: number,
      z: number,
      length: number,
      angle: number,
      yellow = false
    ) {
      const leafGeometry = geometry(
        new THREE.PlaneGeometry(1, 1, 30, 40)
      )

      const positions = leafGeometry.getAttribute('position')
      const uv = leafGeometry.getAttribute('uv')

      for (let index = 0; index < positions.count; index += 1) {
        const across = uv.getX(index) * 2 - 1
        const t = uv.getY(index)

        const outline =
          Math.pow(Math.sin(Math.PI * t), 0.7) *
          (0.8 + 0.2 * t)

        const width = length * 0.4 * outline

        positions.setXYZ(
          index,
          across * width,
          t * length,
          Math.sin(t * Math.PI) * length * 0.1 -
            across * across * length * 0.065
        )
      }

      leafGeometry.computeVertexNormals()

      const surface = yellow
        ? material(
            new THREE.MeshStandardMaterial({
              map: leafTexture,
              color: '#e1d768',
              roughness: 0.58,
              side: THREE.DoubleSide,
            })
          )
        : leafMaterial

      const leaf = new THREE.Mesh(leafGeometry, surface)

      leaf.position.set(x, y, z)
      leaf.rotation.set(-0.08, angle * 0.2, angle)
      scene.add(leaf)

      const stemCurve = new THREE.CatmullRomCurve3([
        new THREE.Vector3(x, y - 1.5, z - 0.15),
        new THREE.Vector3(x - 0.1, y - 0.5, z),
        new THREE.Vector3(x, y + 0.2, z),
      ])

      const stemMaterial = material(
        new THREE.MeshStandardMaterial({
          color: '#526d32',
          roughness: 0.8,
        })
      )

      scene.add(
        new THREE.Mesh(
          geometry(
            new THREE.TubeGeometry(
              stemCurve,
              10,
              0.035,
              5,
              false
            )
          ),
          stemMaterial
        )
      )
    }

    addLeaf(-2.6, -0.9, 14, 4.1, 0.28)
    addLeaf(-3.5, 0.1, 12.2, 3.9, -0.16)
    addLeaf(-1.6, -1.1, 15, 3.1, 0.7)
    addLeaf(3.4, -0.4, 13.1, 3.5, -0.42, true)
    addLeaf(0.4, -0.7, 13.3, 2.9, -1.03, true)
    addLeaf(-4.6, -0.7, 10, 4.7, 0.12)
    addLeaf(4.7, -1, 12.5, 3.6, -0.3)

    // Low plants on the foreground bank.
    const lowPlantMaterial = material(
      new THREE.MeshStandardMaterial({
        color: '#365026',
        roughness: 1,
      })
    )

    for (let index = 0; index < 75; index += 1) {
      const plant = new THREE.Mesh(
        foliageGeometry,
        lowPlantMaterial
      )

      const side = index % 2 ? -1 : 1

      plant.position.set(
        side * (3 + random() * 7),
        -0.1 + random() * 0.5,
        8 + random() * 9
      )

      plant.scale.set(
        0.3 + random() * 0.5,
        0.4 + random() * 0.8,
        0.4 + random() * 0.5
      )

      scene.add(plant)
    }

    // Render only when the viewport changes.
    function renderScene() {
      if (!host) return

      const width = Math.max(host.clientWidth, 1)
      const height = Math.max(host.clientHeight, 1)

      renderer.setSize(width, height, false)

      camera.aspect = width / height

      // Wider screens retain a tall slice of the valley.
      camera.fov = width > height ? 48 : 56
      camera.updateProjectionMatrix()

      renderer.render(scene, camera)
    }

    let resizeFrame = 0

    const observer = new ResizeObserver(() => {
      window.cancelAnimationFrame(resizeFrame)
      resizeFrame = window.requestAnimationFrame(renderScene)
    })

    observer.observe(host)
    renderScene()

    function restoreContext(event: Event) {
      event.preventDefault()
    }

    renderer.domElement.addEventListener(
      'webglcontextlost',
      restoreContext
    )
    renderer.domElement.addEventListener(
      'webglcontextrestored',
      renderScene
    )

    return () => {
      observer.disconnect()
      window.cancelAnimationFrame(resizeFrame)

      renderer.domElement.removeEventListener(
        'webglcontextlost',
        restoreContext
      )
      renderer.domElement.removeEventListener(
        'webglcontextrestored',
        renderScene
      )

      pool.dispose()
      vegetation.dispose()

      geometries.forEach((value) => value.dispose())
      materials.forEach((value) => value.dispose())
      textures.forEach((value) => value.dispose())

      renderer.dispose()
      renderer.domElement.remove()
    }
  }, [])

  return (
    <div
      ref={hostRef}
      className="theme-scene waterfall-nature"
      aria-hidden="true"
    />
  )
}