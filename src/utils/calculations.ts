import type { Position, ProfitSummary, PositionProfit } from '../types'

// 计算单个持仓的盈亏
export function calculatePositionProfit(position: Position): PositionProfit {
  const cost = position.costPrice * position.quantity
  const value = position.currentPrice * position.quantity
  const profit = value - cost
  const profitPercent = cost > 0 ? (profit / cost) * 100 : 0

  return {
    symbol: position.symbol,
    name: position.name,
    cost,
    value,
    profit,
    profitPercent,
    quantity: position.quantity,
  }
}

// 计算总体收益汇总
export function calculateProfitSummary(positions: Position[]): ProfitSummary {
  let totalCost = 0
  let totalValue = 0

  const positionProfits: PositionProfit[] = positions.map(pos => {
    const profit = calculatePositionProfit(pos)
    totalCost += profit.cost
    totalValue += profit.value
    return profit
  })

  const totalProfit = totalValue - totalCost
  const totalProfitPercent = totalCost > 0 ? (totalProfit / totalCost) * 100 : 0

  return {
    totalCost,
    totalValue,
    totalProfit,
    totalProfitPercent,
    positions: positionProfits,
  }
}

// 计算持有收益率
export function calculateReturnRate(costPrice: number, currentPrice: number): number {
  if (costPrice <= 0) return 0
  return ((currentPrice - costPrice) / costPrice) * 100
}

// 格式化涨跌颜色类名
export function getChangeColorClass(value: number): string {
  if (value > 0) return 'text-red-500' // A股红涨绿跌
  if (value < 0) return 'text-green-500'
  return 'text-muted-foreground'
}

// 格式化涨跌背景类名
export function getChangeBgClass(value: number): string {
  if (value > 0) return 'bg-red-50 text-red-700 dark:bg-red-950 dark:text-red-400'
  if (value < 0) return 'bg-green-50 text-green-700 dark:bg-green-950 dark:text-green-400'
  return 'bg-muted text-muted-foreground'
}
