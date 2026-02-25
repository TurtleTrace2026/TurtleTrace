import { cn } from '../../lib/utils'
import { TrendingUp, TrendingDown, Minus } from 'lucide-react'

interface PriceProps {
  value: number
  prevValue?: number
  currency?: string
  showIcon?: boolean
  size?: 'sm' | 'md' | 'lg' | 'xl'
  className?: string
  animate?: boolean
}

/**
 * 金融价格显示组件
 * 支持：价格格式化、涨跌色显示、变化图标、闪烁动画
 */
export function Price({
  value,
  prevValue,
  currency = '¥',
  showIcon = false,
  size = 'md',
  className,
  animate = true,
}: PriceProps) {
  const changed = prevValue !== undefined && value !== prevValue
  const direction = prevValue !== undefined
    ? (value > prevValue ? 'up' : value < prevValue ? 'down' : 'flat')
    : 'flat'

  const sizeClasses = {
    sm: 'text-sm',
    md: 'text-base',
    lg: 'text-lg',
    xl: 'text-xl',
  }

  const iconSize = {
    sm: 'h-3 w-3',
    md: 'h-4 w-4',
    lg: 'h-5 w-5',
    xl: 'h-6 w-6',
  }

  const colorClass = {
    up: 'text-up',
    down: 'text-down',
    flat: 'text-flat',
  }[direction]

  const animationClass = animate && changed ? {
    up: 'animate-flash-up',
    down: 'animate-flash-down',
    flat: '',
  }[direction] : ''

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 font-mono font-medium',
        sizeClasses[size],
        colorClass,
        animationClass,
        className
      )}
    >
      {showIcon && direction === 'up' && <TrendingUp className={iconSize[size]} />}
      {showIcon && direction === 'down' && <TrendingDown className={iconSize[size]} />}
      {showIcon && direction === 'flat' && <Minus className={iconSize[size]} />}
      <span className="tabular-nums">
        {currency}{value.toFixed(2)}
      </span>
    </span>
  )
}

interface PriceChangeProps {
  value: number
  prevValue: number
  showSign?: boolean
  size?: 'sm' | 'md' | 'lg'
  className?: string
  showPercent?: boolean
}

/**
 * 价格变化显示组件
 * 显示绝对变化和百分比变化
 */
export function PriceChange({
  value,
  prevValue,
  showSign = true,
  size = 'md',
  className,
  showPercent = true,
}: PriceChangeProps) {
  const change = value - prevValue
  const percent = prevValue !== 0 ? (change / prevValue) * 100 : 0
  const direction = change > 0 ? 'up' : change < 0 ? 'down' : 'flat'

  const sizeClasses = {
    sm: 'text-xs',
    md: 'text-sm',
    lg: 'text-base',
  }

  const colorClass = {
    up: 'text-up bg-up/10 px-2 py-0.5 rounded',
    down: 'text-down bg-down/10 px-2 py-0.5 rounded',
    flat: 'text-flat bg-flat/10 px-2 py-0.5 rounded',
  }[direction]

  return (
    <div className={cn('inline-flex items-center gap-2', className)}>
      <span className={cn('font-mono font-medium', sizeClasses[size], colorClass)}>
        {showSign && change > 0 && '+'}
        {change.toFixed(2)}
      </span>
      {showPercent && (
        <span className={cn('font-mono font-medium', sizeClasses[size], colorClass)}>
          ({showSign && percent > 0 ? '+' : ''}{percent.toFixed(2)}%)
        </span>
      )}
    </div>
  )
}
