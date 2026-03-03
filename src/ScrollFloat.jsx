import { useEffect, useMemo, useRef } from 'react'

function mapEase(ease) {
  if (typeof ease !== 'string') {
    return 'ease'
  }

  const normalized = ease.trim().toLowerCase()
  if (normalized.startsWith('back.inout')) {
    return 'cubic-bezier(0.68, -0.55, 0.265, 1.55)'
  }
  if (normalized === 'power2.out') {
    return 'cubic-bezier(0.22, 1, 0.36, 1)'
  }
  if (normalized === 'power2.inout') {
    return 'cubic-bezier(0.45, 0, 0.55, 1)'
  }
  return ease
}

function rootMarginFromScrollEnd(scrollEnd) {
  if (typeof scrollEnd !== 'string') {
    return '0px 0px -20% 0px'
  }

  const minusMatch = scrollEnd.match(/bottom-=\s*(\d+)%/)
  if (minusMatch) {
    return `0px 0px -${minusMatch[1]}% 0px`
  }

  return '0px 0px -20% 0px'
}

function ScrollFloat({
  children,
  animationDuration = 1,
  ease = 'back.inOut(2)',
  scrollStart = 'center bottom+=50%',
  scrollEnd = 'bottom bottom-=40%',
  stagger = 0.03,
  className = '',
}) {
  const containerRef = useRef(null)
  const timeoutIdsRef = useRef([])
  const textUnits = useMemo(() => {
    if (typeof children === 'string' || typeof children === 'number') {
      return String(children).split(/(\s+)/)
    }
    return null
  }, [children])

  useEffect(() => {
    const container = containerRef.current
    if (!container) {
      return undefined
    }

    const easing = mapEase(ease)
    const duration = Math.max(0.1, Number(animationDuration) || 1)
    const step = Math.max(0, Number(stagger) || 0)
    const isTextMode = Array.isArray(textUnits)
    const targets = isTextMode
      ? Array.from(container.querySelectorAll('[data-scroll-float-token="true"]'))
      : [container]

    targets.forEach((target) => {
      target.style.opacity = '0'
      target.style.filter = 'blur(10px)'
      target.style.transform = 'translate3d(0, 18px, 0) scale(0.985)'
      target.style.willChange = 'opacity, transform, filter'
      target.style.transition = `opacity ${duration}s ${easing}, transform ${duration}s ${easing}, filter ${duration}s ${easing}`
    })

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) {
          return
        }

        targets.forEach((target, index) => {
          const timeoutId = window.setTimeout(() => {
            target.style.opacity = '1'
            target.style.filter = 'blur(0px)'
            target.style.transform = 'translate3d(0, 0, 0) scale(1)'
          }, step * 1000 * index)

          timeoutIdsRef.current.push(timeoutId)
        })

        observer.unobserve(container)
      },
      {
        root: null,
        threshold: 0.14,
        rootMargin: rootMarginFromScrollEnd(scrollEnd),
      },
    )

    observer.observe(container)

    return () => {
      observer.disconnect()
      timeoutIdsRef.current.forEach((id) => window.clearTimeout(id))
      timeoutIdsRef.current = []
    }
  }, [animationDuration, ease, scrollStart, scrollEnd, stagger, textUnits])

  if (Array.isArray(textUnits)) {
    return (
      <span ref={containerRef} className={className} style={{ display: 'inline-block' }}>
        {textUnits.map((token, index) => {
          if (/^\s+$/.test(token)) {
            return (
              <span key={`space-${index}`} style={{ whiteSpace: 'pre' }}>
                {token}
              </span>
            )
          }

          return (
            <span
              key={`token-${index}`}
              data-scroll-float-token="true"
              style={{ display: 'inline-block', whiteSpace: 'pre' }}
            >
              {token}
            </span>
          )
        })}
      </span>
    )
  }

  return (
    <div ref={containerRef} className={className}>
      {children}
    </div>
  )
}

export default ScrollFloat
