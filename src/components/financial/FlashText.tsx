import { useState, useEffect } from 'react'
import { cn } from '../../lib/utils'

interface FlashTextProps {
  value: number
  prevValue?: number
  formatFn?: (value: number) => string
  className?: string
  duration?: number
}

/**
 * 价格闪烁文本组件
 * 当价格变化时显示闪烁效果
 */
export function FlashText({
  value,
  prevValue: externalPrevValue,
  formatFn = (v) => v.toFixed(2),
  className,
  duration = 500,
}: FlashTextProps) {
  const [internalPrevValue, setInternalPrevValue] = useState(value)
  const [flashDirection, setFlashDirection] = useState<'up' | 'down' | null>(null)

  // 使用外部传入的 prevValue 或内部维护的值
  const prevValue = externalPrevValue !== undefined ? externalPrevValue : internalPrevValue

  useEffect(() => {
    if (value !== prevValue) {
      setFlashDirection(value > prevValue ? 'up' : 'down')
      setInternalPrevValue(value)

      // 动画结束后清除闪烁状态
      const timer = setTimeout(() => {
        setFlashDirection(null)
      }, duration)

      return () => clearTimeout(timer)
    }
  }, [value, prevValue, duration])

  const colorClass = flashDirection === 'up' ? 'text-up' : flashDirection === 'down' ? 'text-down' : ''

  return (
    <span
      className={cn(
        'inline-block transition-all duration-200 font-mono',
        colorClass,
        flashDirection && (flashDirection === 'up' ? 'animate-flash-up' : 'animate-flash-down'),
        className
      )}
    >
      {formatFn(value)}
    </span>
  )
}

interface AnimatedNumberProps {
  value: number
  duration?: number
  decimals?: number
  className?: string
}

/**
 * 数字滚动动画组件
 */
export function AnimatedNumber({
  value,
  duration = 500,
  decimals = 2,
  className,
}: AnimatedNumberProps) {
  const [displayValue, setDisplayValue] = useState(value)

  useEffect(() => {
    const startValue = displayValue
    const endValue = value
    const difference = endValue - startValue
    const startTime = performance.now()

    const animate = (currentTime: number) => {
      const elapsed = currentTime - startTime
      const progress = Math.min(elapsed / duration, 1)

      // 使用 easeOutQuart 缓动函数
      const easeOut = 1 - Math.pow(1 - progress, 4)
      const currentValue = startValue + difference * easeOut

      setDisplayValue(currentValue)

      if (progress < 1) {
        requestAnimationFrame(animate)
      }
    }

    requestAnimationFrame(animate)
  }, [value, duration, displayValue])

  return (
    <span className={cn('font-mono tabular-nums', className)}>
      {displayValue.toFixed(decimals)}
    </span>
  )
}
