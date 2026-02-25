import type { ReactNode } from 'react'
import { cn } from '../../lib/utils'

interface MetricCardProps {
  title: string
  value: string
  icon?: ReactNode
  valueClassName?: string
  highlight?: boolean
  trend?: 'up' | 'down' | 'neutral'
  subtitle?: string
}

/**
 * 指标卡片组件
 * 用于显示关键财务指标
 */
export function MetricCard({
  title,
  value,
  icon,
  valueClassName,
  highlight = false,
  trend,
  subtitle,
}: MetricCardProps) {
  return (
    <div className={cn(
      'relative rounded-lg border bg-card p-6 shadow-sm card-hover',
      highlight && 'border-primary/20'
    )}>
      <div className="flex items-center justify-between mb-2">
        <p className="text-sm text-muted-foreground">{title}</p>
        {icon && (
          <div className={cn(
            'p-2 rounded-md',
            trend === 'up' ? 'bg-up/10 text-up' :
            trend === 'down' ? 'bg-down/10 text-down' :
            'bg-muted text-muted-foreground'
          )}>
            {icon}
          </div>
        )}
      </div>
      <p className={cn(
        'text-2xl font-bold font-mono tabular-nums',
        valueClassName,
        !valueClassName && 'text-foreground'
      )}>
        {value}
      </p>
      {subtitle && (
        <p className="text-xs text-muted-foreground mt-1">{subtitle}</p>
      )}
    </div>
  )
}
