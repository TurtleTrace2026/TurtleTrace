import { cn } from '../../lib/utils'
import { TrendingUp, TrendingDown } from 'lucide-react'

interface MiniChartProps {
  data: number[]
  width?: number
  height?: number
  showArea?: boolean
  className?: string
}

/**
 * 迷你折线图组件 (Sparkline)
 * 用于显示价格趋势
 */
export function MiniChart({
  data,
  width = 80,
  height = 32,
  showArea = false,
  className,
}: MiniChartProps) {
  if (!data || data.length < 2) {
    return (
      <div
        className={cn('inline-flex items-center justify-center bg-muted/20 rounded', className)}
        style={{ width, height }}
      >
        <span className="text-xs text-muted-foreground">--</span>
      </div>
    )
  }

  const min = Math.min(...data)
  const max = Math.max(...data)
  const range = max - min || 1
  const first = data[0]
  const last = data[data.length - 1]
  const isUp = last >= first

  // 生成 SVG 路径
  const points = data.map((value, index) => {
    const x = (index / (data.length - 1)) * width
    const y = height - ((value - min) / range) * height
    return `${x},${y}`
  })

  const linePath = points.join(' L ')
  const areaPath = `${linePath} L ${width},${height} L 0,${height} Z`

  const strokeColor = isUp ? 'hsl(var(--up-primary))' : 'hsl(var(--down-primary))'
  const fillColor = isUp ? 'hsl(var(--up-background))' : 'hsl(var(--down-background))'

  return (
    <svg
      width={width}
      height={height}
      className={cn('inline-block overflow-visible', className)}
      viewBox={`0 0 ${width} ${height}`}
    >
      {showArea && (
        <path
          d={`M ${areaPath}`}
          fill={fillColor}
          stroke="none"
        />
      )}
      <path
        d={`M ${linePath}`}
        fill="none"
        stroke={strokeColor}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        vectorEffect="non-scaling-stroke"
      />
    </svg>
  )
}

interface MiniTrendProps {
  value: number
  prevValue: number
  data?: number[]
  showChart?: boolean
  size?: 'sm' | 'md'
  className?: string
}

/**
 * 迷你趋势指示器
 * 显示方向图标 + 可选的迷你图表
 */
export function MiniTrend({
  value,
  prevValue,
  data,
  showChart = true,
  size = 'sm',
  className,
}: MiniTrendProps) {
  const isUp = value >= prevValue
  const change = ((value - prevValue) / prevValue) * 100
  const Icon = isUp ? TrendingUp : TrendingDown

  const iconSize = {
    sm: 'h-3 w-3',
    md: 'h-4 w-4',
  }[size]

  const colorClass = isUp ? 'text-up' : 'text-down'

  return (
    <div className={cn('inline-flex items-center gap-1.5', className)}>
      {showChart && data ? (
        <MiniChart data={data} width={48} height={20} showArea />
      ) : (
        <Icon className={cn(iconSize, colorClass)} />
      )}
      <span className={cn('font-mono text-xs font-medium', colorClass)}>
        {isUp ? '+' : ''}{change.toFixed(2)}%
      </span>
    </div>
  )
}

interface ProgressBarProps {
  value: number
  min: number
  max: number
  showLabel?: boolean
  label?: string
  color?: 'up' | 'down' | 'neutral'
  size?: 'sm' | 'md'
  className?: string
}

/**
 * 进度条组件
 * 用于显示持仓比例、盈亏比例等
 */
export function ProgressBar({
  value,
  min,
  max,
  showLabel = false,
  label,
  color,
  size = 'sm',
  className,
}: ProgressBarProps) {
  const range = max - min || 1
  const percentage = ((value - min) / range) * 100

  const height = {
    sm: 'h-1.5',
    md: 'h-2',
  }[size]

  const colorClass = {
    up: 'bg-up',
    down: 'bg-down',
    neutral: 'bg-primary',
  }[color || (percentage >= 50 ? 'up' : 'down')]

  return (
    <div className={cn('flex items-center gap-2', className)}>
      <div className={cn('flex-1 bg-muted rounded-full overflow-hidden', height)}>
        <div
          className={cn(height, colorClass, 'transition-all duration-500 rounded-full')}
          style={{ width: `${Math.min(100, Math.max(0, percentage))}%` }}
        />
      </div>
      {showLabel && (
        <span className="text-xs text-muted-foreground font-mono min-w-[3rem] text-right">
          {label || `${percentage.toFixed(1)}%`}
        </span>
      )}
    </div>
  )
}
