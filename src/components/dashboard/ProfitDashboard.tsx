import { Card } from '../ui/card'
import { Button } from '../ui/button'
import { Badge } from '../ui/badge'
import { TrendingUp, TrendingDown, PieChart, Eye, EyeOff, Wallet, Share2, DollarSign, Scale } from 'lucide-react'
import type { ProfitSummary, PositionProfit } from '../../types'
import { formatCurrency, formatPercent } from '../../lib/utils'
import { cn } from '../../lib/utils'
import { ShareDialog } from './ShareDialog'
import { StockShareDialog } from './StockShareDialog'
import { ClearedProfitShareDialog } from './ClearedProfitShareDialog'
import { useState } from 'react'

interface ProfitDashboardProps {
  summary: ProfitSummary
  showClearedPositions: boolean
  onToggleClearedPositions: () => void
  hasClearedPositions: boolean
  showClearedProfitCard: boolean
  onToggleClearedProfitCard: () => void
}

export function ProfitDashboard({
  summary,
  showClearedPositions,
  onToggleClearedPositions,
  hasClearedPositions,
  showClearedProfitCard,
  onToggleClearedProfitCard
}: ProfitDashboardProps) {
  const { totalCost, totalValue, totalProfit, totalProfitPercent, positions, clearedProfit } = summary
  const [shareDialogOpen, setShareDialogOpen] = useState(false)
  const [stockSharePosition, setStockSharePosition] = useState<PositionProfit | null>(null)
  const [clearedProfitDialogOpen, setClearedProfitDialogOpen] = useState(false)

  return (
    <div className="space-y-6">
      {/* 顶部操作栏 */}
      <Card className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-primary/10 rounded-lg">
              <Scale className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h2 className="text-xl font-bold">收益总览</h2>
              <p className="text-sm text-muted-foreground">实时查看持仓盈亏情况</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* 清仓股票收益开关 */}
            {clearedProfit && (
              <Button
                variant="outline"
                size="sm"
                onClick={onToggleClearedProfitCard}
                className="gap-2"
              >
                {showClearedProfitCard ? (
                  <>
                    <EyeOff className="h-4 w-4" />
                    隐藏清仓收益
                  </>
                ) : (
                  <>
                    <Wallet className="h-4 w-4" />
                    显示清仓收益
                  </>
                )}
              </Button>
            )}

            <Button
              variant="default"
              size="sm"
              onClick={() => setShareDialogOpen(true)}
              className="gap-2"
            >
              <Share2 className="h-4 w-4" />
              分享收益
            </Button>
          </div>
        </div>
      </Card>

      {/* 分享对话框 */}
      <ShareDialog
        summary={summary}
        isOpen={shareDialogOpen}
        onClose={() => setShareDialogOpen(false)}
      />

      {/* 汇总卡片 */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-5 border-l-4 border-l-muted">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm text-muted-foreground">总持仓成本</span>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </div>
          <div className="text-2xl font-bold font-mono tabular-nums">{formatCurrency(totalCost)}</div>
        </Card>

        <Card className="p-5 border-l-4 border-l-muted">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm text-muted-foreground">总证券资产</span>
            <Wallet className="h-4 w-4 text-muted-foreground" />
          </div>
          <div className="text-2xl font-bold font-mono tabular-nums">{formatCurrency(totalValue)}</div>
        </Card>

        <Card className={cn("p-5 border-l-4", totalProfit >= 0 ? "border-l-up bg-up/5" : "border-l-down bg-down/5")}>
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm text-muted-foreground">总盈亏</span>
            <div className={cn("p-1.5 rounded-lg", totalProfit >= 0 ? "bg-up/20 text-up" : "bg-down/20 text-down")}>
              {totalProfit >= 0 ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />}
            </div>
          </div>
          <div className={cn("text-2xl font-bold font-mono tabular-nums flex items-center gap-2", totalProfit >= 0 ? 'text-up' : 'text-down')}>
            {totalProfit >= 0 ? '+' : ''}{formatCurrency(totalProfit)}
          </div>
        </Card>

        <Card className={cn("p-5 border-l-4", totalProfitPercent >= 0 ? "border-l-up bg-up/5" : "border-l-down bg-down/5")}>
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm text-muted-foreground">收益率</span>
            <div className={cn("p-1.5 rounded-lg", totalProfitPercent >= 0 ? "bg-up/20 text-up" : "bg-down/20 text-down")}>
              <TrendingUp className={cn("h-4 w-4", totalProfitPercent < 0 && "rotate-180")} />
            </div>
          </div>
          <div className={cn("text-2xl font-bold font-mono tabular-nums", totalProfitPercent >= 0 ? 'text-up' : 'text-down')}>
            {formatPercent(totalProfitPercent)}
          </div>
        </Card>
      </div>

      {/* 清仓股票收益卡片 */}
      {clearedProfit && showClearedProfitCard && (
        <Card className={cn("overflow-hidden", clearedProfit.totalProfit >= 0 ? "border-up/30 bg-up/5" : "border-down/30 bg-down/5")}>
          <div className="border-b bg-surface/50 p-5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className={cn("p-2 rounded-lg", clearedProfit.totalProfit >= 0 ? "bg-up/20 text-up" : "bg-down/20 text-down")}>
                  <Wallet className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-lg font-bold">已清仓股票收益</h3>
                  <p className="text-sm text-muted-foreground mt-0.5">已清仓 {clearedProfit.count} 只股票的总收益情况</p>
                </div>
              </div>

              <div className="flex items-center gap-4">
                <div className="text-right">
                  <div className={cn("text-3xl font-bold font-mono tabular-nums", clearedProfit.totalProfit >= 0 ? 'text-up' : 'text-down')}>
                    {clearedProfit.totalProfit >= 0 ? '+' : ''}{formatCurrency(clearedProfit.totalProfit)}
                  </div>
                  <div className={cn("text-sm font-medium mt-1 px-3 py-1 rounded-full inline-flex", clearedProfit.totalProfitPercent >= 0 ? "bg-up/20 text-up" : "bg-down/20 text-down")}>
                    {formatPercent(clearedProfit.totalProfitPercent)}
                  </div>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setClearedProfitDialogOpen(true)}
                  className="shrink-0"
                >
                  <Share2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>

          <div className="p-5">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-5">
              <div className="bg-surface/50 p-3 rounded-lg border">
                <div className="text-sm text-muted-foreground mb-1">总买入金额</div>
                <div className="text-lg font-semibold font-mono tabular-nums">{formatCurrency(clearedProfit.totalBuyAmount)}</div>
              </div>
              <div className="bg-surface/50 p-3 rounded-lg border">
                <div className="text-sm text-muted-foreground mb-1">总卖出金额</div>
                <div className="text-lg font-semibold font-mono tabular-nums">{formatCurrency(clearedProfit.totalSellAmount)}</div>
              </div>
              <div className="bg-surface/50 p-3 rounded-lg border">
                <div className="text-sm text-muted-foreground mb-1">已清仓数量</div>
                <div className="text-lg font-semibold font-mono tabular-nums">{clearedProfit.count} 只</div>
              </div>
            </div>

            {/* 清仓股票明细 */}
            <div className="space-y-2">
              <div className="grid grid-cols-12 gap-3 text-xs text-muted-foreground px-4 py-2.5 bg-surface/50 rounded-t-lg font-medium">
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
                    className="grid grid-cols-12 gap-3 items-center px-4 py-3 rounded-lg border-b last:border-b-0 bg-surface/30 hover:bg-surface/50 transition-colors"
                  >
                    <div className="col-span-3">
                      <div className="font-medium">{position.name}</div>
                      <div className="text-sm text-muted-foreground font-mono text-xs">{position.symbol}</div>
                    </div>
                    <div className="col-span-3 text-right text-muted-foreground font-mono text-sm">
                      {formatCurrency(position.buyAmount)}
                    </div>
                    <div className="col-span-3 text-right font-medium font-mono text-sm">
                      {formatCurrency(position.sellAmount)}
                    </div>
                    <div className="col-span-2 text-right font-mono text-sm">
                      <span className={position.profit >= 0 ? 'text-up' : 'text-down'}>
                        {position.profit >= 0 ? '+' : ''}{formatCurrency(position.profit)}
                      </span>
                    </div>
                    <div className="col-span-1 text-right">
                      <Badge
                        variant={position.profitPercent >= 0 ? 'default' : 'secondary'}
                        className={cn("text-xs font-medium", position.profitPercent >= 0 ? "bg-up/20 text-up hover:bg-up/30" : "bg-down/20 text-down hover:bg-down/30")}
                      >
                        {formatPercent(position.profitPercent)}
                      </Badge>
                    </div>
                  </div>
                ))}
            </div>
          </div>
        </Card>
      )}

      {/* 持仓明细 */}
      <Card className="overflow-hidden">
        <div className="border-b bg-surface/50 p-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-lg">
                <PieChart className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h3 className="text-lg font-bold">持仓明细</h3>
                <p className="text-sm text-muted-foreground mt-0.5">各股票的盈亏情况</p>
              </div>
            </div>

            {hasClearedPositions && (
              <Button
                variant="outline"
                size="sm"
                onClick={onToggleClearedPositions}
                className="gap-2"
              >
                {showClearedPositions ? (
                  <>
                    <EyeOff className="h-4 w-4" />
                    隐藏已清仓
                  </>
                ) : (
                  <>
                    <Eye className="h-4 w-4" />
                    显示已清仓
                  </>
                )}
              </Button>
            )}
          </div>
        </div>

        <div className="p-5">
          {positions.length === 0 ? (
            <div className="text-center py-16 text-muted-foreground">
              <div className="p-4 bg-muted/20 rounded-full w-20 h-20 mx-auto mb-4 flex items-center justify-center">
                <PieChart className="h-10 w-10 opacity-50" />
              </div>
              <p className="text-lg font-medium mb-1">暂无持仓数据</p>
              <p className="text-sm">添加持仓后即可查看盈亏分析</p>
            </div>
          ) : (
            <div className="space-y-2">
              <div className="grid grid-cols-12 gap-3 text-xs text-muted-foreground px-4 py-2.5 bg-surface/50 rounded-t-lg font-medium">
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
                  const hasNextPrice = position.nextHigh !== undefined
                  const nextHighPositive = (position.nextHigh || 0) >= position.currentPrice

                  return (
                    <div
                      key={position.symbol}
                      className="grid grid-cols-12 gap-3 items-center px-4 py-3 rounded-lg border-b last:border-b-0 bg-surface/30 hover:bg-surface/50 transition-colors group"
                    >
                      <div className="col-span-3">
                        <div className="relative">
                          <div className="font-medium">{position.name}</div>
                          <div className="text-sm text-muted-foreground font-mono text-xs">{position.symbol}</div>
                          {/* 悬停时显示次日预测价 */}
                          <div className="absolute left-0 top-full mt-2 z-50 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 bg-popover border rounded-xl shadow-lg p-3 text-xs min-w-[200px]">
                            {hasNextPrice ? (
                              <>
                                <div className="text-center text-muted-foreground mb-3 font-medium border-b pb-2">次日预测价</div>
                                <div className="grid grid-cols-2 gap-x-4 gap-y-2">
                                  <div className="flex justify-between gap-2">
                                    <span className="text-muted-foreground">最高</span>
                                    <span className={cn("font-mono font-medium", nextHighPositive ? 'text-up' : 'text-down')}>
                                      ¥{(position.nextHigh || 0).toFixed(2)}
                                    </span>
                                  </div>
                                  <div className="flex justify-between gap-2">
                                    <span className="text-muted-foreground">最低</span>
                                    <span className={cn("font-mono font-medium", !nextHighPositive ? 'text-up' : 'text-down')}>
                                      ¥{(position.nextLow || 0).toFixed(2)}
                                    </span>
                                  </div>
                                  <div className="flex justify-between gap-2">
                                    <span className="text-muted-foreground">次高</span>
                                    <span className={cn("font-mono font-medium", nextHighPositive ? 'text-up' : 'text-down')}>
                                      ¥{(position.nextSecondaryHigh || 0).toFixed(2)}
                                    </span>
                                  </div>
                                  <div className="flex justify-between gap-2">
                                    <span className="text-muted-foreground">次低</span>
                                    <span className={cn("font-mono font-medium", !nextHighPositive ? 'text-up' : 'text-down')}>
                                      ¥{(position.nextSecondaryLow || 0).toFixed(2)}
                                    </span>
                                  </div>
                                </div>
                              </>
                            ) : (
                              <div className="text-center text-muted-foreground py-2">
                                刷新价格后显示
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="col-span-2 text-right text-muted-foreground font-mono text-sm">
                        {formatCurrency(position.cost)}
                      </div>
                      <div className="col-span-2 text-right font-medium font-mono text-sm">
                        {formatCurrency(position.value)}
                      </div>
                      <div className="col-span-2 text-right font-mono text-sm">
                        <span className={position.profit >= 0 ? 'text-up' : 'text-down'}>
                          {position.profit >= 0 ? '+' : ''}{formatCurrency(position.profit)}
                        </span>
                      </div>
                      <div className="col-span-2 text-right">
                        <Badge
                          variant={position.profitPercent >= 0 ? 'default' : 'secondary'}
                          className={cn("text-xs font-medium", position.profitPercent >= 0 ? "bg-up/20 text-up hover:bg-up/30" : "bg-down/20 text-down hover:bg-down/30")}
                        >
                          {formatPercent(position.profitPercent)}
                        </Badge>
                      </div>
                      <div className="col-span-1 text-center">
                        <button
                          onClick={() => setStockSharePosition(position)}
                          className="p-2 hover:bg-surface-hover rounded-lg transition-all opacity-0 group-hover:opacity-100"
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
        </div>
      </Card>

      {/* 个股分享对话框 */}
      {stockSharePosition && (
        <StockShareDialog
          position={stockSharePosition}
          isOpen={!!stockSharePosition}
          onClose={() => setStockSharePosition(null)}
        />
      )}

      {/* 清仓收益分享对话框 */}
      {clearedProfit && clearedProfitDialogOpen && (
        <ClearedProfitShareDialog
          clearedProfit={clearedProfit}
          isOpen={clearedProfitDialogOpen}
          onClose={() => setClearedProfitDialogOpen(false)}
        />
      )}
    </div>
  )
}
