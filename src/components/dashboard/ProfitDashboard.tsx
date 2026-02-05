import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card'
import { Button } from '../ui/button'
import { Badge } from '../ui/badge'
import { TrendingUp, TrendingDown, PieChart, Eye, EyeOff, Wallet, Share2 } from 'lucide-react'
import type { ProfitSummary, PositionProfit } from '../../types'
import { formatCurrency, formatPercent } from '../../lib/utils'
import { getChangeBgClass } from '../../utils/calculations'
import { ShareDialog } from './ShareDialog'
import { StockShareDialog } from './StockShareDialog'
import { useState } from 'react'

interface ProfitDashboardProps {
  summary: ProfitSummary
  showClearedPositions: boolean
  onToggleClearedPositions: () => void
  hasClearedPositions: boolean
  showClearedProfitCard: boolean
  onToggleClearedProfitCard: () => void
}

export function ProfitDashboard({ summary, showClearedPositions, onToggleClearedPositions, hasClearedPositions, showClearedProfitCard, onToggleClearedProfitCard }: ProfitDashboardProps) {
  const { totalCost, totalValue, totalProfit, totalProfitPercent, positions, clearedProfit } = summary
  const [shareDialogOpen, setShareDialogOpen] = useState(false)
  const [stockSharePosition, setStockSharePosition] = useState<PositionProfit | null>(null)

  return (
    <div className="space-y-6">
      {/* 顶部操作栏 */}
      <div className="flex justify-between items-center">
        {/* 分享按钮 */}
        <Button
          variant="outline"
          size="sm"
          onClick={() => setShareDialogOpen(true)}
          className="flex items-center gap-2"
        >
          <Share2 className="h-4 w-4" />
          分享收益
        </Button>

        {/* 清仓股票收益开关 */}
        {clearedProfit && (
          <Button
            variant="outline"
            size="sm"
            onClick={onToggleClearedProfitCard}
          >
            {showClearedProfitCard ? (
              <>
                <EyeOff className="h-4 w-4 mr-1" />
                隐藏清仓收益
              </>
            ) : (
              <>
                <Wallet className="h-4 w-4 mr-1" />
                显示清仓收益
              </>
            )}
          </Button>
        )}
      </div>

      {/* 分享对话框 */}
      <ShareDialog
        summary={summary}
        isOpen={shareDialogOpen}
        onClose={() => setShareDialogOpen(false)}
      />
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

      {/* 清仓股票收益卡片 */}
      {clearedProfit && showClearedProfitCard && (
        <Card className={clearedProfit.totalProfit >= 0 ? 'border-red-200 bg-red-50/50 dark:border-red-900 dark:bg-red-950/20' : 'border-green-200 bg-green-50/50 dark:border-green-900 dark:bg-green-950/20'}>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Wallet className="h-5 w-5" />
                  已清仓股票收益
                </CardTitle>
                <CardDescription>已清仓 {clearedProfit.count} 只股票的总收益情况</CardDescription>
              </div>
              <div className="text-right">
                <div className={`text-3xl font-bold ${clearedProfit.totalProfit >= 0 ? 'text-red-600' : 'text-green-600'}`}>
                  {clearedProfit.totalProfit >= 0 ? '+' : ''}{formatCurrency(clearedProfit.totalProfit)}
                </div>
                <div className={`text-sm font-medium mt-1 ${getChangeBgClass(clearedProfit.totalProfitPercent)} inline-flex px-2 py-1 rounded-full`}>
                  {formatPercent(clearedProfit.totalProfitPercent)}
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-4 mb-4">
              <div>
                <div className="text-sm text-muted-foreground">总买入金额</div>
                <div className="text-lg font-semibold">{formatCurrency(clearedProfit.totalBuyAmount)}</div>
              </div>
              <div>
                <div className="text-sm text-muted-foreground">总卖出金额</div>
                <div className="text-lg font-semibold">{formatCurrency(clearedProfit.totalSellAmount)}</div>
              </div>
              <div>
                <div className="text-sm text-muted-foreground">已清仓数量</div>
                <div className="text-lg font-semibold">{clearedProfit.count} 只</div>
              </div>
            </div>

            {/* 清仓股票明细 */}
            <div className="space-y-2">
              <div className="grid grid-cols-12 gap-4 text-sm text-muted-foreground px-4 py-2">
                <div className="col-span-3">股票</div>
                <div className="col-span-3 text-right">买入金额</div>
                <div className="col-span-3 text-right">卖出金额</div>
                <div className="col-span-2 text-right">盈亏</div>
                <div className="col-span-1 text-right">收益率</div>
              </div>

              {clearedProfit.positions
                .sort((a, b) => b.profit - a.profit)
                .map((position) => (
                  <div
                    key={position.symbol}
                    className="grid grid-cols-12 gap-4 items-center px-4 py-3 rounded-lg hover:bg-muted/50 transition-colors"
                  >
                    <div className="col-span-3">
                      <div className="font-medium">{position.name}</div>
                      <div className="text-sm text-muted-foreground">{position.symbol}</div>
                    </div>
                    <div className="col-span-3 text-right text-muted-foreground">
                      {formatCurrency(position.buyAmount)}
                    </div>
                    <div className="col-span-3 text-right font-medium">
                      {formatCurrency(position.sellAmount)}
                    </div>
                    <div className="col-span-2 text-right">
                      <span className={position.profit >= 0 ? 'text-red-600' : 'text-green-600'}>
                        {position.profit >= 0 ? '+' : ''}{formatCurrency(position.profit)}
                      </span>
                    </div>
                    <div className="col-span-1 text-right">
                      <Badge
                        variant={position.profitPercent >= 0 ? 'success' : 'danger'}
                        className="text-xs"
                      >
                        {formatPercent(position.profitPercent)}
                      </Badge>
                    </div>
                  </div>
                ))}
            </div>
          </CardContent>
        </Card>
      )}

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
                <div className="col-span-1 text-center">操作</div>
              </div>

              {positions
                .sort((a, b) => b.profit - a.profit)
                .map((position) => {
                  return (
                    <div
                      key={position.symbol}
                      className="grid grid-cols-12 gap-4 items-center px-4 py-3 rounded-lg hover:bg-muted/50 transition-colors group"
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
                      <div className="col-span-1 text-center">
                        <button
                          onClick={() => setStockSharePosition(position)}
                          className="p-1.5 hover:bg-accent rounded-md transition-colors opacity-0 group-hover:opacity-100"
                          title="分享"
                        >
                          <Share2 className="h-4 w-4 text-muted-foreground hover:text-foreground" />
                        </button>
                      </div>
                    </div>
                  )
                })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* 个股分享对话框 */}
      {stockSharePosition && (
        <StockShareDialog
          position={stockSharePosition}
          isOpen={!!stockSharePosition}
          onClose={() => setStockSharePosition(null)}
        />
      )}
    </div>
  )
}
