import { useState, useRef, useEffect } from 'react'
import { Button } from '../ui/button'
import { Input } from '../ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card'
import { Badge } from '../ui/badge'
import { Plus, Trash2, RefreshCw, Search, TrendingUp, TrendingDown, X, ChevronDown, Eye, EyeOff } from 'lucide-react'
import type { Position, Transaction, TransactionType } from '../../types'
import { getStockQuote } from '../../services/stockService'
import { searchStocks, getPopularStocks, type SearchResult } from '../../services/stockDatabase'
import { formatCurrency, formatPercent } from '../../lib/utils'

interface PositionManagerProps {
  positions: Position[]
  onPositionsChange: (positions: Position[]) => void
}

// 计算最新成本价
function calculateCostPrice(totalBuyAmount: number, totalSellAmount: number, quantity: number): number {
  if (quantity <= 0) return 0
  return (totalBuyAmount - totalSellAmount) / quantity
}

export function PositionManager({ positions, onPositionsChange }: PositionManagerProps) {
  const [showAddForm, setShowAddForm] = useState(false)
  const [symbol, setSymbol] = useState('')
  const [costPrice, setCostPrice] = useState('')
  const [quantity, setQuantity] = useState('')
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [error, setError] = useState('')
  const [searchResults, setSearchResults] = useState<SearchResult[]>([])
  const [showSearchResults, setShowSearchResults] = useState(false)
  const [selectedStock, setSelectedStock] = useState<SearchResult | null>(null)
  const [showClearedPositions, setShowClearedPositions] = useState(false)  // 是否显示已清仓股票
  const searchContainerRef = useRef<HTMLDivElement>(null)

  // 交易弹窗状态
  const [tradeDialog, setTradeDialog] = useState<{
    position: Position | null
    type: TransactionType
    show: boolean
  }>({ position: null, type: 'buy', show: false })
  const [tradePrice, setTradePrice] = useState('')
  const [tradeQuantity, setTradeQuantity] = useState('')

  // 交易历史记录展开状态
  const [expandedTransactions, setExpandedTransactions] = useState<Set<string>>(new Set())

  // 点击外部关闭搜索结果
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(event.target as Node)) {
        setShowSearchResults(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // 搜索股票
  useEffect(() => {
    if (symbol) {
      const results = searchStocks(symbol, 10)
      setSearchResults(results)
      setShowSearchResults(true)
    } else {
      // 显示热门股票
      const popular = getPopularStocks(10)
      setSearchResults(popular)
      setShowSearchResults(false)
    }
  }, [symbol])

  // 选择股票
  const handleSelectStock = (stock: SearchResult) => {
    setSelectedStock(stock)
    setSymbol(stock.ts_code)
    setShowSearchResults(false)
  }

  // 添加持仓（首次买入）
  const handleAddPosition = async () => {
    setError('')

    if (!symbol || !costPrice || !quantity) {
      setError('请填写完整信息')
      return
    }

    const cost = parseFloat(costPrice)
    const qty = parseFloat(quantity)

    if (isNaN(cost) || cost <= 0 || isNaN(qty) || qty <= 0) {
      setError('价格和数量必须大于0')
      return
    }

    // 检查是否已存在该股票
    const existing = positions.find(p => p.symbol === symbol)
    if (existing) {
      setError('该股票已在持仓列表中，请使用买入功能加仓')
      return
    }

    // 获取当前股价
    const quote = await getStockQuote(symbol)
    if (!quote) {
      setError(`未找到股票代码: ${symbol}，请检查代码是否正确`)
      return
    }

    const buyAmount = cost * qty
    const transaction: Transaction = {
      id: `${symbol}-${Date.now()}`,
      type: 'buy',
      price: cost,
      quantity: qty,
      amount: buyAmount,
      timestamp: Date.now(),
    }

    const newPosition: Position = {
      id: `${symbol}-${Date.now()}`,
      symbol,
      name: quote.name,
      costPrice: cost,
      quantity: qty,
      currentPrice: quote.price,
      changePercent: cost > 0 ? ((quote.price - cost) / cost) * 100 : 0, // 基于成本价计算涨跌幅
      transactions: [transaction],
      totalBuyAmount: buyAmount,
      totalSellAmount: 0,
    }

    onPositionsChange([...positions, newPosition])

    // 重置表单
    setSymbol('')
    setCostPrice('')
    setQuantity('')
    setSelectedStock(null)
    setShowAddForm(false)
  }

  // 删除持仓
  const handleDeletePosition = (id: string) => {
    onPositionsChange(positions.filter(p => p.id !== id))
  }

  // 打开交易弹窗
  const handleOpenTradeDialog = (position: Position, type: TransactionType) => {
    setTradeDialog({ position, type, show: true })
    setTradePrice('')
    setTradeQuantity('')
    setError('')
  }

  // 关闭交易弹窗
  const handleCloseTradeDialog = () => {
    setTradeDialog({ position: null, type: 'buy', show: false })
    setTradePrice('')
    setTradeQuantity('')
    setError('')
  }

  // 执行交易（买入/卖出）
  const handleExecuteTrade = async () => {
    setError('')
    const { position, type } = tradeDialog

    if (!position) return

    const price = parseFloat(tradePrice)
    const qty = parseFloat(tradeQuantity)

    if (isNaN(price) || price <= 0 || isNaN(qty) || qty <= 0) {
      setError('价格和数量必须大于0')
      return
    }

    // 卖出时检查数量是否足够
    if (type === 'sell' && qty > position.quantity) {
      setError('卖出数量不能超过持仓数量')
      return
    }

    const amount = price * qty
    const transaction: Transaction = {
      id: `${position.symbol}-${Date.now()}`,
      type,
      price,
      quantity: qty,
      amount,
      timestamp: Date.now(),
    }

    // 更新持仓数据
    const updatedPositions = positions.map(p => {
      if (p.id !== position.id) return p

      const newTransactions = [...p.transactions, transaction]
      const newTotalBuyAmount = type === 'buy' ? p.totalBuyAmount + amount : p.totalBuyAmount
      const newTotalSellAmount = type === 'sell' ? p.totalSellAmount + amount : p.totalSellAmount
      const newQuantity = type === 'buy' ? p.quantity + qty : p.quantity - qty
      const newCostPrice = calculateCostPrice(newTotalBuyAmount, newTotalSellAmount, newQuantity)

      return {
        ...p,
        transactions: newTransactions,
        totalBuyAmount: newTotalBuyAmount,
        totalSellAmount: newTotalSellAmount,
        quantity: newQuantity,
        costPrice: newCostPrice,
      }
    })

    // 如果卖出后数量为0，可以选择删除该持仓或保留记录
    // 这里保留记录，用户可以手动删除
    onPositionsChange(updatedPositions)
    handleCloseTradeDialog()
  }

  // 刷新所有股价
  const handleRefreshPrices = async () => {
    setIsRefreshing(true)
    try {
      const updatedPositions = await Promise.all(
        positions.map(async (pos) => {
          const quote = await getStockQuote(pos.symbol)
          if (quote) {
            // 基于最新成本价计算涨跌幅
            const changePercent = pos.costPrice > 0
              ? ((quote.price - pos.costPrice) / pos.costPrice) * 100
              : 0
            return {
              ...pos,
              currentPrice: quote.price,
              changePercent,
            }
          }
          return pos
        })
      )

      onPositionsChange(updatedPositions)
    } finally {
      setIsRefreshing(false)
    }
  }

  // 取消添加
  const handleCancel = () => {
    setShowAddForm(false)
    setError('')
    setSymbol('')
    setCostPrice('')
    setQuantity('')
    setSelectedStock(null)
  }

  // 切换交易历史展开状态
  const toggleTransactions = (positionId: string) => {
    setExpandedTransactions(prev => {
      const newSet = new Set(prev)
      if (newSet.has(positionId)) {
        newSet.delete(positionId)
      } else {
        newSet.add(positionId)
      }
      return newSet
    })
  }

  // 计算交易汇总
  const getTransactionSummary = (position: Position) => {
    const transactions = position.transactions || []
    const buyTransactions = transactions.filter(t => t.type === 'buy')
    const sellTransactions = transactions.filter(t => t.type === 'sell')

    const totalBuyQty = buyTransactions.reduce((sum, t) => sum + t.quantity, 0)
    const totalSellQty = sellTransactions.reduce((sum, t) => sum + t.quantity, 0)
    const totalBuyAmount = buyTransactions.reduce((sum, t) => sum + t.amount, 0)
    const totalSellAmount = sellTransactions.reduce((sum, t) => sum + t.amount, 0)

    return {
      totalBuyQty,
      totalSellQty,
      totalBuyAmount,
      totalSellAmount,
      buyCount: buyTransactions.length,
      sellCount: sellTransactions.length,
    }
  }

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>持仓管理</CardTitle>
              <CardDescription>
                管理您的股票持仓，支持买入加仓和卖出减仓
              </CardDescription>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleRefreshPrices}
                disabled={isRefreshing || positions.length === 0}
              >
                <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
                刷新价格
              </Button>
              {positions.some(p => p.quantity <= 0) && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowClearedPositions(!showClearedPositions)}
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
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowAddForm(!showAddForm)}
              >
                <Plus className="h-4 w-4" />
                添加持仓
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {showAddForm && (
            <div className="mb-6 p-4 border rounded-lg bg-muted/50 space-y-4">
              <h4 className="font-medium">添加新持仓</h4>

              {/* 股票搜索 */}
              <div className="space-y-2" ref={searchContainerRef}>
                <label className="text-sm text-muted-foreground">股票代码/名称</label>
                <div className="relative">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="输入股票代码、名称或拼音搜索..."
                      value={symbol}
                      onChange={(e) => setSymbol(e.target.value)}
                      className="pl-9"
                    />
                  </div>

                  {/* 搜索结果下拉框 */}
                  {(showSearchResults || !symbol) && searchResults.length > 0 && (
                    <div className="absolute z-10 w-full mt-1 bg-background border rounded-md shadow-lg max-h-60 overflow-y-auto">
                      {searchResults.map((stock) => (
                        <button
                          key={stock.ts_code}
                          type="button"
                          onClick={() => handleSelectStock(stock)}
                          className="w-full px-3 py-2 text-left hover:bg-muted transition-colors border-b last:border-b-0"
                        >
                          <div className="flex items-center justify-between">
                            <div>
                              <div className="font-medium">{stock.name}</div>
                              <div className="text-xs text-muted-foreground">
                                {stock.ts_code} · {stock.industry}
                              </div>
                            </div>
                            <Badge variant="outline" className="text-xs">
                              {stock.market}
                            </Badge>
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {selectedStock && (
                  <div className="text-xs text-muted-foreground bg-background p-2 rounded border">
                    已选择: <span className="font-medium">{selectedStock.name}</span>
                    ({selectedStock.ts_code}) · {selectedStock.industry}
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm text-muted-foreground">买入价格</label>
                  <Input
                    type="number"
                    step="0.01"
                    placeholder="如: 1680.50"
                    value={costPrice}
                    onChange={(e) => setCostPrice(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm text-muted-foreground">买入数量</label>
                  <Input
                    type="number"
                    step="100"
                    placeholder="如: 100"
                    value={quantity}
                    onChange={(e) => setQuantity(e.target.value)}
                  />
                </div>
              </div>

              {error && (
                <div className="text-sm text-destructive">
                  {error}
                </div>
              )}

              <div className="flex gap-2">
                <Button onClick={handleAddPosition}>确认添加</Button>
                <Button variant="ghost" onClick={handleCancel}>
                  取消
                </Button>
              </div>
            </div>
          )}

          {positions.filter(p => showClearedPositions || p.quantity > 0).length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <p>{showClearedPositions ? '暂无持仓记录' : '暂无持仓数据'}</p>
              <p className="text-sm mt-2">
                {showClearedPositions
                  ? '点击上方"添加持仓"按钮添加您的第一只股票'
                  : '所有股票已清仓，点击"显示已清仓"查看历史记录'}
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {positions.filter(p => showClearedPositions || p.quantity > 0).map(position => {
                const summary = getTransactionSummary(position)
                const isExpanded = expandedTransactions.has(position.id)

                return (
                  <div key={position.id} className="border rounded-lg overflow-hidden">
                    {/* 持仓头部 */}
                    <div className="p-4 space-y-3">
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="font-medium text-lg">{position.name}</div>
                          <div className="text-sm text-muted-foreground">{position.symbol}</div>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleOpenTradeDialog(position, 'buy')}
                            className="text-green-600 hover:text-green-700 hover:bg-green-50"
                          >
                            <TrendingUp className="h-4 w-4 mr-1" />
                            买入
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleOpenTradeDialog(position, 'sell')}
                            disabled={position.quantity <= 0}
                            className="text-red-600 hover:text-red-700 hover:bg-red-50"
                          >
                            <TrendingDown className="h-4 w-4 mr-1" />
                            卖出
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDeletePosition(position.id)}
                            className="h-8 w-8 text-destructive hover:text-destructive"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>

                      {/* 持仓信息网格 */}
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                        <div>
                          <div className="text-muted-foreground">持仓数量</div>
                          <div className="font-medium">{position.quantity}</div>
                        </div>
                        <div>
                          <div className="text-muted-foreground">最新成本</div>
                          <div className="font-medium">{formatCurrency(position.costPrice)}</div>
                        </div>
                        <div>
                          <div className="text-muted-foreground">当前价格</div>
                          <div className="font-medium">{formatCurrency(position.currentPrice)}</div>
                        </div>
                        <div>
                          <div className="text-muted-foreground">涨跌幅</div>
                          <Badge
                            variant={position.changePercent >= 0 ? 'success' : 'danger'}
                          >
                            {formatPercent(position.changePercent)}
                          </Badge>
                        </div>
                      </div>

                      {/* 市值和盈亏 */}
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm pt-2 border-t">
                        <div>
                          <div className="text-muted-foreground">持仓市值</div>
                          <div className="font-medium">{formatCurrency(position.currentPrice * position.quantity)}</div>
                        </div>
                        <div>
                          <div className="text-muted-foreground">持仓成本</div>
                          <div className="font-medium">{formatCurrency(position.costPrice * position.quantity)}</div>
                        </div>
                        <div>
                          <div className="text-muted-foreground">浮动盈亏</div>
                          <div className={`font-medium ${(position.currentPrice - position.costPrice) * position.quantity >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                            {formatCurrency((position.currentPrice - position.costPrice) * position.quantity)}
                            <span className="ml-2">
                              {formatPercent(((position.currentPrice - position.costPrice) / position.costPrice) * 100)}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* 交易汇总 */}
                      <div className="text-xs text-muted-foreground pt-2 border-t">
                        买入{summary.buyCount}笔 · 卖出{summary.sellCount}笔 ·
                        累计买入 {summary.totalBuyQty}股 · 累计卖出 {summary.totalSellQty}股
                      </div>

                      {/* 展开/收起交易历史 */}
                      {(position.transactions?.length || 0) > 0 && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => toggleTransactions(position.id)}
                          className="w-full justify-center text-muted-foreground"
                        >
                          {isExpanded ? (
                            <>收起交易记录 <ChevronDown className="h-4 w-4 ml-1 rotate-180" /></>
                          ) : (
                            <>查看交易记录 ({position.transactions.length}) <ChevronDown className="h-4 w-4 ml-1" /></>
                          )}
                        </Button>
                      )}
                    </div>

                    {/* 交易历史 */}
                    {isExpanded && (position.transactions?.length || 0) > 0 && (
                      <div className="border-t bg-muted/30 p-4 space-y-2">
                        <div className="text-sm font-medium">交易历史</div>
                        {(position.transactions || []).slice().reverse().map(transaction => (
                          <div key={transaction.id} className="flex items-center justify-between text-sm py-2 border-b last:border-b-0">
                            <div className="flex items-center gap-3">
                              <Badge
                                variant={transaction.type === 'buy' ? 'success' : 'danger'}
                                className="text-xs"
                              >
                                {transaction.type === 'buy' ? '买入' : '卖出'}
                              </Badge>
                              <span className="text-muted-foreground">
                                {new Date(transaction.timestamp).toLocaleString('zh-CN')}
                              </span>
                            </div>
                            <div className="flex items-center gap-4">
                              <span>{formatCurrency(transaction.price)} × {transaction.quantity}</span>
                              <span className="font-medium">{formatCurrency(transaction.amount)}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* 交易弹窗 */}
      {tradeDialog.show && tradeDialog.position && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-md">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>
                  {tradeDialog.type === 'buy' ? '买入' : '卖出'} {tradeDialog.position.name}
                </CardTitle>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleCloseTradeDialog}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
              <CardDescription>
                当前持仓: {tradeDialog.position.quantity}股 ·
                当前成本: {formatCurrency(tradeDialog.position.costPrice)}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm text-muted-foreground">
                  {tradeDialog.type === 'buy' ? '买入' : '卖出'}价格
                </label>
                <Input
                  type="number"
                  step="0.01"
                  placeholder="如: 1680.50"
                  value={tradePrice}
                  onChange={(e) => setTradePrice(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm text-muted-foreground">
                  {tradeDialog.type === 'buy' ? '买入' : '卖出'}数量
                </label>
                {tradeDialog.type === 'sell' && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setTradeQuantity(tradeDialog.position?.quantity.toString() || '')}
                    className="w-full mb-2"
                  >
                    清仓（全部卖出 {tradeDialog.position?.quantity}股）
                  </Button>
                )}
                <Input
                  type="number"
                  step="100"
                  placeholder="如: 100"
                  value={tradeQuantity}
                  onChange={(e) => setTradeQuantity(e.target.value)}
                />
              </div>

              {/* 交易预览 */}
              {tradePrice && tradeQuantity && (
                <div className="p-3 bg-muted/50 rounded-md space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">交易金额</span>
                    <span className="font-medium">
                      {formatCurrency(parseFloat(tradePrice) * parseFloat(tradeQuantity))}
                    </span>
                  </div>
                  {tradeDialog.type === 'buy' && (
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">交易后持仓</span>
                      <span className="font-medium">
                        {tradeDialog.position.quantity + parseFloat(tradeQuantity || '0')}股
                      </span>
                    </div>
                  )}
                  {tradeDialog.type === 'sell' && (
                    <>
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">交易后持仓</span>
                        <span className="font-medium">
                          {tradeDialog.position.quantity - parseFloat(tradeQuantity || '0')}股
                        </span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">实现盈亏</span>
                        <span className={`font-medium ${parseFloat(tradePrice) >= tradeDialog.position.costPrice ? 'text-green-600' : 'text-red-600'}`}>
                          {formatCurrency((parseFloat(tradePrice) - tradeDialog.position.costPrice) * parseFloat(tradeQuantity || '0'))}
                        </span>
                      </div>
                    </>
                  )}
                </div>
              )}

              {error && (
                <div className="text-sm text-destructive">
                  {error}
                </div>
              )}

              <div className="flex gap-2">
                <Button
                  onClick={handleExecuteTrade}
                  className={tradeDialog.type === 'buy' ? 'bg-green-600 hover:bg-green-700' : 'bg-red-600 hover:bg-red-700'}
                >
                  确认{tradeDialog.type === 'buy' ? '买入' : '卖出'}
                </Button>
                <Button variant="ghost" onClick={handleCloseTradeDialog}>
                  取消
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </>
  )
}
