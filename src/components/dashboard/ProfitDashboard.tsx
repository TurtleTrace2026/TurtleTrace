import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card'
import { Button } from '../ui/button'
import { Badge } from '../ui/badge'
import { TrendingUp, TrendingDown, DollarSign, PieChart, Eye, EyeOff } from 'lucide-react'
import type { ProfitSummary } from '../../types'
import { formatCurrency, formatPercent } from '../../lib/utils'
import { getChangeBgClass } from '../../utils/calculations'

interface ProfitDashboardProps {
  summary: ProfitSummary
  showClearedPositions: boolean
  onToggleClearedPositions: () => void
  hasClearedPositions: boolean
}

export function ProfitDashboard({ summary, showClearedPositions, onToggleClearedPositions, hasClearedPositions }: ProfitDashboardProps) {
  const { totalCost, totalValue, totalProfit, totalProfitPercent, positions } = summary

  return (
    <div className="space-y-6">
      {/* 汇总卡片 */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>总持仓成本</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(totalCost)}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardDescription>总证券资产</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(totalValue)}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardDescription>总盈亏</CardDescription>
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold flex items-center gap-2 ${totalProfit >= 0 ? 'text-red-600' : 'text-green-600'}`}>
              {totalProfit >= 0 ? <TrendingUp className="h-5 w-5" /> : <TrendingDown className="h-5 w-5" />}
              {totalProfit >= 0 ? '+' : ''}{formatCurrency(totalProfit)}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardDescription>收益率</CardDescription>
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${getChangeBgClass(totalProfitPercent)} inline-flex px-3 py-1 rounded-full`}>
              {formatPercent(totalProfitPercent)}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 持仓明细 */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>持仓明细</CardTitle>
              <CardDescription>各股票的盈亏情况</CardDescription>
            </div>
            {hasClearedPositions && (
              <Button
                variant="outline"
                size="sm"
                onClick={onToggleClearedPositions}
              >
                {showClearedPositions ? (
                  <>
                    <EyeOff className="h-4 w-4 mr-1" />
                    隐藏已清仓
                  </>
                ) : (
                  <>
                    <Eye className="h-4 w-4 mr-1" />
                    显示已清仓
                  </>
                )}
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {positions.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <PieChart className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>暂无持仓数据</p>
            </div>
          ) : (
            <div className="space-y-2">
              <div className="grid grid-cols-12 gap-4 text-sm text-muted-foreground px-4 py-2">
                <div className="col-span-3">股票</div>
                <div className="col-span-2 text-right">持仓成本</div>
                <div className="col-span-2 text-right">证券价值</div>
                <div className="col-span-2 text-right">盈亏</div>
                <div className="col-span-2 text-right">收益率</div>
                <div className="col-span-1 text-right">占比</div>
              </div>

              {positions
                .sort((a, b) => b.profit - a.profit)
                .map((position) => {
                  const ratio = totalValue > 0 ? (position.value / totalValue) * 100 : 0

                  return (
                    <div
                      key={position.symbol}
                      className="grid grid-cols-12 gap-4 items-center px-4 py-3 rounded-lg hover:bg-muted/50 transition-colors"
                    >
                      <div className="col-span-3">
                        <div className="font-medium">{position.name}</div>
                        <div className="text-sm text-muted-foreground">{position.symbol}</div>
                      </div>
                      <div className="col-span-2 text-right text-muted-foreground">
                        {formatCurrency(position.cost)}
                      </div>
                      <div className="col-span-2 text-right font-medium">
                        {formatCurrency(position.value)}
                      </div>
                      <div className="col-span-2 text-right">
                        <span className={position.profit >= 0 ? 'text-red-600' : 'text-green-600'}>
                          {position.profit >= 0 ? '+' : ''}{formatCurrency(position.profit)}
                        </span>
                      </div>
                      <div className="col-span-2 text-right">
                        <Badge
                          variant={position.profitPercent >= 0 ? 'success' : 'danger'}
                          className="text-xs"
                        >
                          {formatPercent(position.profitPercent)}
                        </Badge>
                      </div>
                      <div className="col-span-1 text-right text-sm text-muted-foreground">
                        {ratio.toFixed(1)}%
                      </div>
                    </div>
                  )
                })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
