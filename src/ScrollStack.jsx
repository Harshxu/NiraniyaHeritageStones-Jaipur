import { useEffect, useRef } from 'react'

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value))
}

function ScrollStack({ children, className = '' }) {
  const containerRef = useRef(null)

  useEffect(() => {
    const container = containerRef.current
    if (!container) {
      return undefined
    }

    const items = Array.from(container.querySelectorAll(':scope > .scroll-stack-item'))
    if (items.length === 0) {
      return undefined
    }

    let rafId = 0

    const update = () => {
      const viewportHeight = window.innerHeight || 1
      const startLine = viewportHeight * 0.88
      const endLine = viewportHeight * 0.26
      const totalRange = Math.max(1, startLine - endLine)

      items.forEach((item, index) => {
        const rect = item.getBoundingClientRect()
        const progress = clamp((startLine - rect.top) / totalRange, 0, 1)
        const translateY = (1 - progress) * 34
        const scale = 0.94 + progress * 0.06
        const opacity = 0.28 + progress * 0.72
        const blur = (1 - progress) * 5

        item.style.transform = `translate3d(0, ${translateY}px, 0) scale(${scale})`
        item.style.opacity = `${opacity}`
        item.style.filter = `blur(${blur}px)`
        item.style.zIndex = `${index + 1}`
      })
    }

    const onScroll = () => {
      if (rafId) {
        return
      }
      rafId = window.requestAnimationFrame(() => {
        rafId = 0
        update()
      })
    }

    update()
    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('resize', onScroll)

    return () => {
      if (rafId) {
        window.cancelAnimationFrame(rafId)
      }
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('resize', onScroll)
    }
  }, [])

  return (
    <div ref={containerRef} className={`scroll-stack ${className}`.trim()}>
      {children}
    </div>
  )
}

function ScrollStackItem({ children, className = '' }) {
  return <div className={`scroll-stack-item ${className}`.trim()}>{children}</div>
}

export { ScrollStackItem }
export default ScrollStack
