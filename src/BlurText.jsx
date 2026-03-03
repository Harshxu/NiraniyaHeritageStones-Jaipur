import { memo, useEffect, useMemo, useRef, useState } from 'react'

const offsetByDirection = {
  top: 'translate3d(0, 18px, 0)',
  bottom: 'translate3d(0, -18px, 0)',
  left: 'translate3d(18px, 0, 0)',
  right: 'translate3d(-18px, 0, 0)',
}

function BlurText({
  text,
  delay = 200,
  startDelay = 0,
  animateBy = 'words',
  direction = 'top',
  forceAnimation = false,
  onAnimationComplete,
  className = '',
  unitClassName = '',
  as = 'h1',
}) {
  const units = useMemo(() => {
    if (!text) {
      return []
    }
    return animateBy === 'letters' ? Array.from(text) : text.trim().split(/\s+/)
  }, [animateBy, text])
  const [isVisible, setIsVisible] = useState(false)
  const startAnimationTimeoutRef = useRef(0)
  const animationCompleteTimeoutRef = useRef(0)
  const revealRafIdRef = useRef(0)
  const normalizedDelay = Math.max(0, Number(delay) || 0)
  const normalizedStartDelay = Math.max(0, Number(startDelay) || 0)
  const prefersReducedMotion =
    typeof window !== 'undefined' &&
    typeof window.matchMedia === 'function' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches
  const skipMotion = prefersReducedMotion && !forceAnimation

  useEffect(() => {
    window.clearTimeout(startAnimationTimeoutRef.current)
    window.clearTimeout(animationCompleteTimeoutRef.current)
    window.cancelAnimationFrame(revealRafIdRef.current)
    setIsVisible(skipMotion)

    if (!skipMotion) {
      startAnimationTimeoutRef.current = window.setTimeout(() => {
        revealRafIdRef.current = window.requestAnimationFrame(() => {
          setIsVisible(true)
        })
      }, normalizedStartDelay)
    }

    if (typeof onAnimationComplete === 'function') {
      const totalAnimationMs = skipMotion
        ? normalizedStartDelay
        : normalizedStartDelay + normalizedDelay * Math.max(0, units.length - 1) + 460
      animationCompleteTimeoutRef.current = window.setTimeout(() => {
        onAnimationComplete()
      }, totalAnimationMs)
    }

    return () => {
      window.clearTimeout(startAnimationTimeoutRef.current)
      window.clearTimeout(animationCompleteTimeoutRef.current)
      window.cancelAnimationFrame(revealRafIdRef.current)
    }
  }, [normalizedDelay, normalizedStartDelay, onAnimationComplete, skipMotion, units.length])

  if (!text) {
    return null
  }

  const hiddenTransform = offsetByDirection[direction] || offsetByDirection.top
  const Component = as

  return (
    <Component className={className} aria-label={text}>
      {units.map((unit, index) => {
        const isWordMode = animateBy !== 'letters'
        const content = isWordMode && index < units.length - 1 ? `${unit}\u00A0` : unit

        return (
          <span
            key={`${unit}-${index}`}
            className={unitClassName}
            style={{
              display: 'inline-block',
              whiteSpace: 'pre',
              opacity: isVisible ? 1 : 0,
              filter: isVisible ? 'blur(0px)' : 'blur(12px)',
              transform: isVisible ? 'translate3d(0, 0, 0)' : hiddenTransform,
              transition: skipMotion
                ? 'none'
                : 'opacity 460ms ease, filter 460ms ease, transform 460ms ease',
              transitionDelay: skipMotion ? '0ms' : `${normalizedDelay * index}ms`,
            }}
          >
            {content}
          </span>
        )
      })}
    </Component>
  )
}

export default memo(BlurText)
