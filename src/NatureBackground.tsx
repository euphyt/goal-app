import { useEffect, useId, useRef, useState } from 'react'
import './NatureBackground.css'

export default function NatureBackground() {
  const svgRef = useRef<SVGSVGElement>(null)
  const [paused, setPaused] = useState(false)
  const [reducedMotion, setReducedMotion] = useState(false)
  const [imageFailed, setImageFailed] = useState(false)

  const id = useId().replace(/:/g, '')
  const maskId = `${id}-water-mask`
  const rippleId = `${id}-ripples`
  const featherId = `${id}-feather`

  useEffect(() => {
    const preference = window.matchMedia(
      '(prefers-reduced-motion: reduce)'
    )

    function updatePreference() {
      setReducedMotion(preference.matches)
    }

    updatePreference()
    preference.addEventListener('change', updatePreference)

    return () => {
      preference.removeEventListener('change', updatePreference)
    }
  }, [])

  const motionStopped = paused || reducedMotion

  useEffect(() => {
    if (motionStopped) {
      svgRef.current?.pauseAnimations()
    } else {
      svgRef.current?.unpauseAnimations()
    }
  }, [motionStopped])

  return (
    <>
      <div className="nature-background" aria-hidden="true">
        <svg
          ref={svgRef}
          viewBox="0 0 736 1308"
          preserveAspectRatio="xMidYMid slice"
          className="nature-scene"
        >
          <defs>
            <filter
              id={rippleId}
              x="-5%"
              y="-5%"
              width="110%"
              height="110%"
              colorInterpolationFilters="sRGB"
            >
              <feTurbulence
                type="fractalNoise"
                baseFrequency="0.012 0.07"
                numOctaves="1"
                seed="8"
                result="waterNoise"
              >
                <animate
                  attributeName="baseFrequency"
                  values="0.012 0.07;0.015 0.085;0.012 0.07"
                  dur="12s"
                  repeatCount="indefinite"
                />
              </feTurbulence>

              <feDisplacementMap
                in="SourceGraphic"
                in2="waterNoise"
                scale="4"
                xChannelSelector="R"
                yChannelSelector="G"
              />
            </filter>

            <filter id={featherId}>
              <feGaussianBlur stdDeviation="5" />
            </filter>

            <mask
              id={maskId}
              maskUnits="userSpaceOnUse"
              x="0"
              y="0"
              width="736"
              height="1308"
              style={{ maskType: 'luminance' }}
            >
              <rect width="736" height="1308" fill="black" />

              {/* White reveals the animated river layer. */}
              <path
                d="
                  M 330 690
                  L 420 690
                  L 470 760
                  L 560 820
                  L 580 920
                  L 570 1020
                  L 530 1130
                  L 520 1308
                  L 220 1308
                  L 250 1160
                  L 215 1070
                  L 190 960
                  L 220 850
                  L 270 760
                  Z
                "
                fill="white"
                filter={`url(#${featherId})`}
              />

              {/* Black protects both swans and nearby edges. */}
              <ellipse
                cx="330"
                cy="905"
                rx="68"
                ry="42"
                fill="black"
                filter={`url(#${featherId})`}
              />
              <ellipse
                cx="437"
                cy="945"
                rx="93"
                ry="70"
                fill="black"
                filter={`url(#${featherId})`}
              />
            </mask>
          </defs>

          {/* Original scene stays still. */}
          <image
            href="/themes/nature.jpg"
            width="736"
            height="1308"
            onError={() => setImageFailed(true)}
          />

          {/* Distortion happens first, then the river mask clips it. */}
          {!motionStopped && !imageFailed && (
            <g mask={`url(#${maskId})`}>
              <image
                href="/themes/nature.jpg"
                width="736"
                height="1308"
                filter={`url(#${rippleId})`}
              />
            </g>
          )}
        </svg>

        <div className="nature-shade" />
      </div>

      <button
        type="button"
        className="nature-motion-button"
        onClick={() => setPaused(!paused)}
        disabled={reducedMotion || imageFailed}
        aria-pressed={motionStopped}
      >
        {imageFailed
          ? 'Background image unavailable'
          : reducedMotion
            ? 'Motion off · device preference'
            : paused
              ? 'Play water'
              : 'Pause water'}
      </button>
    </>
  )
}