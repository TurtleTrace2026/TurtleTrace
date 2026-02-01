import { useState } from 'react'
import { Button } from '../ui/button'
import { Input } from '../ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card'
import { Badge } from '../ui/badge'
import { Plus, Trash2, RefreshCw } from 'lucide-react'
import type { Position } from '../../types'
import { getStockQuote, getSupportedStocks } from '../../services/stockService'
import { formatCurrency, formatPercent } from '../../lib/utils'
import { getChangeColorClass } from '../../utils/calculations'

interface PositionManagerProps {
  positions: Position[]
  onPositionsChange: (positions: Position[]) => void
}

export function PositionManager({ positions, onPositionsChange }: PositionManagerProps) {
  const [showAddForm, setShowAddForm] = useState(false)
  const [symbol, setSymbol] = useState('')
  const [costPrice, setCostPrice] = useState('')
  const [quantity, setQuantity] = useState('')
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [error, setError] = useState('')

  // 添加持仓
  const handleAddPosition = async () => {
    setError('')

    if (!symbol || !costPrice || !quantity) {
      setError('请填写完整信息')
      return
    }

    const cost = parseFloat(costPrice)
    const qty = parseFloat(quantity)

    if (isNaN(cost) || cost <= 0 || isNaN(qty) || qty <= 0) {
      setError('成本价和数量必须大于0')
      return
    }

    // 检查是否已存在该股票
    const existing = positions.find(p => p.symbol === symbol)
    if (existing) {
      setError('该股票已在持仓列表中')
      return
    }

    // 获取当前股价
    const quote = await getStockQuote(symbol)
    if (!quote) {
      setError(`未找到股票代码: ${symbol}，请检查代码是否正确`)
      return
    }

    const newPosition: Position = {
      id: `${symbol}-${Date.now()}`,
      symbol,
      name: quote.name,
      costPrice: cost,
      quantity: qty,
      currentPrice: quote.price,
      changePercent: quote.changePercent,
    }

    onPositionsChange([...positions, newPosition])

    // 重置表单
    setSymbol('')
    setCostPrice('')
    setQuantity('')
    setShowAddForm(false)
  }

  // 删除持仓
  const handleDeletePosition = (id: string) => {
    onPositionsChange(positions.filter(p => p.id !== id))
  }

  // 刷新所有股价
  const handleRefreshPrices = async () => {
    setIsRefreshing(true)
    try {
      const symbols = positions.map(p => p.symbol)
      const quotes = await getStockQuote(symbols[0]) // 逐个获取

      // 批量更新
      const updatedPositions = await Promise.all(
        positions.map(async (pos) => {
          const quote = await getStockQuote(pos.symbol)
          return quote
            ? {
                ...pos,
                currentPrice: quote.price,
                changePercent: quote.changePercent,
              }
            : pos
        })
      )

      onPositionsChange(updatedPositions)
    } finally {
      setIsRefreshing(false)
    }
  }

  // 获取股票列表建议
  const supportedStocks = getSupportedStocks()
  const filteredStocks = symbol
    ? supportedStocks.filter(s =>
        s.symbol.includes(symbol.toUpperCase()) || s.name.includes(symbol)
      )
    : supportedStocks.slice(0, 5)

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>持仓管理</CardTitle>
            <CardDescription>
              管理您的股票持仓，添加或删除股票
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

            <div className="space-y-2">
              <label className="text-sm text-muted-foreground">股票代码</label>
              <Input
                placeholder="如: 600519.SH"
                value={symbol}
                onChange={(e) => setSymbol(e.target.value)}
                list="stock-suggestions"
              />
              <datalist id="stock-suggestions">
                {filteredStocks.map(stock => (
                  <option key={stock.symbol} value={stock.symbol}>
                    {stock.name} ({stock.symbol})
                  </option>
                ))}
              </datalist>
              {symbol && filteredStocks.length > 0 && (
                <div className="text-xs text-muted-foreground">
                  建议股票: {filteredStocks.slice(0, 3).map(s => `${s.name}(${s.symbol})`).join(', ')}
                </div>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm text-muted-foreground">成本价</label>
                <Input
                  type="number"
                  step="0.01"
                  placeholder="如: 1680.50"
                  value={costPrice}
                  onChange={(e) => setCostPrice(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm text-muted-foreground">持仓数量</label>
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
              <Button
                variant="ghost"
                onClick={() => {
                  setShowAddForm(false)
                  setError('')
                  setSymbol('')
                  setCostPrice('')
                  setQuantity('')
                }}
              >
                取消
              </Button>
            </div>
          </div>
        )}

        {positions.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <p>暂无持仓数据</p>
            <p className="text-sm mt-2">点击上方"添加持仓"按钮添加您的第一只股票</p>
          </div>
        ) : (
          <div className="space-y-2">
            <div className="grid grid-cols-12 gap-4 text-sm text-muted-foreground px-4 py-2">
              <div className="col-span-3">股票</div>
              <div className="col-span-2 text-right">成本价</div>
              <div className="col-span-2 text-right">现价</div>
              <div className="col-span-2 text-right">涨跌幅</div>
              <div className="col-span-2 text-right">市值</div>
              <div className="col-span-1"></div>
            </div>
            {positions.map(position => (
              <div
                key={position.id}
                className="grid grid-cols-12 gap-4 items-center px-4 py-3 rounded-lg hover:bg-muted/50 transition-colors"
              >
                <div className="col-span-3">
                  <div className="font-medium">{position.name}</div>
                  <div className="text-sm text-muted-foreground">{position.symbol}</div>
                </div>
                <div className="col-span-2 text-right">
                  {formatCurrency(position.costPrice)}
                </div>
                <div className="col-span-2 text-right">
                  {formatCurrency(position.currentPrice)}
                </div>
                <div className="col-span-2 text-right">
                  <Badge
                    variant={position.changePercent >= 0 ? 'success' : 'danger'}
                  >
                    {formatPercent(position.changePercent)}
                  </Badge>
                </div>
                <div className="col-span-2 text-right font-medium">
                  {formatCurrency(position.currentPrice * position.quantity)}
                </div>
                <div className="col-span-1 text-right">
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
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
