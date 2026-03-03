import { useMemo, useState } from 'react'

function ShinyText({
  text,
  speed = 2,
  delay = 0,
  color = '#b5b5b5',
  shineColor = '#ffffff',
  spread = 120,
  direction = 'left',
  yoyo = false,
  pauseOnHover = false,
  disabled = false,
  className = '',
}) {
  const [isHovered, setIsHovered] = useState(false)

  const gradientAngle = direction === 'left' || direction === 'right' ? '100deg' : '0deg'
  const safeSpread = Math.max(20, Number(spread) || 120)
  const shineStart = Math.max(0, 50 - safeSpread / 100)
  const shineEnd = Math.min(100, 50 + safeSpread / 100)
  const baseDirection = direction === 'left' ? 'normal' : 'reverse'
  const animationDirection = yoyo
    ? baseDirection === 'normal'
      ? 'alternate'
      : 'alternate-reverse'
    : baseDirection

  const style = useMemo(
    () => ({
      '--shiny-color': color,
      '--shiny-shine': shineColor,
      '--shiny-angle': gradientAngle,
      '--shiny-start': `${shineStart}%`,
      '--shiny-end': `${shineEnd}%`,
      '--shiny-speed': `${Math.max(0.2, Number(speed) || 2)}s`,
      '--shiny-delay': `${Math.max(0, Number(delay) || 0)}s`,
      '--shiny-direction': animationDirection,
      '--shiny-state': pauseOnHover && isHovered ? 'paused' : 'running',
    }),
    [color, shineColor, gradientAngle, shineStart, shineEnd, speed, delay, animationDirection, pauseOnHover, isHovered],
  )

  if (disabled) {
    return (
      <span className={className} style={{ color }}>
        {text}
      </span>
    )
  }

  return (
    <span
      className={`shiny-text ${className}`.trim()}
      style={style}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {text}
    </span>
  )
}

export default ShinyText
