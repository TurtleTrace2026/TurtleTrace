import type { StockQuote } from '../types'

// 模拟股票数据 - A股常见股票
const mockStockData: Record<string, {
  name: string
  basePrice: number
}> = {
  '600519.SH': { name: '贵州茅台', basePrice: 1680.50 },
  '000858.SZ': { name: '五粮液', basePrice: 142.30 },
  '600036.SH': { name: '招商银行', basePrice: 32.15 },
  '000001.SZ': { name: '平安银行', basePrice: 10.88 },
  '601318.SH': { name: '中国平安', basePrice: 42.50 },
  '000333.SZ': { name: '美的集团', basePrice: 68.20 },
  '600276.SH': { name: '恒瑞医药', basePrice: 45.30 },
  '300059.SZ': { name: '东方财富', basePrice: 15.60 },
  '600900.SH': { name: '长江电力', basePrice: 24.80 },
  '601012.SH': { name: '隆基绿能', basePrice: 22.40 },
  '002594.SZ': { name: '比亚迪', basePrice: 258.90 },
  '600887.SH': { name: '伊利股份', basePrice: 31.20 },
}

// 模拟价格波动（基于随机波动）
function simulatePrice(basePrice: number): { price: number; change: number; changePercent: number } {
  const changePercent = (Math.random() - 0.5) * 10 // -5% 到 +5% 波动
  const change = basePrice * (changePercent / 100)
  const price = basePrice + change
  return { price, change, changePercent }
}

// 获取股票实时行情（模拟）
export async function getStockQuote(symbol: string): Promise<StockQuote | null> {
  // 模拟网络延迟
  await new Promise(resolve => setTimeout(resolve, 100 + Math.random() * 200))

  const stockInfo = mockStockData[symbol]
  if (!stockInfo) {
    return null
  }

  const { price, change, changePercent } = simulatePrice(stockInfo.basePrice)

  return {
    symbol,
    name: stockInfo.name,
    price: Number(price.toFixed(2)),
    change: Number(change.toFixed(2)),
    changePercent: Number(changePercent.toFixed(2)),
    open: Number((price * (1 + (Math.random() - 0.5) * 0.02)).toFixed(2)),
    high: Number((price * (1 + Math.random() * 0.02)).toFixed(2)),
    low: Number((price * (1 - Math.random() * 0.02)).toFixed(2)),
    volume: Math.floor(Math.random() * 10000000) + 100000,
    timestamp: Date.now(),
  }
}

// 批量获取股票行情
export async function getStockQuotes(symbols: string[]): Promise<StockQuote[]> {
  const quotes = await Promise.all(
    symbols.map(symbol => getStockQuote(symbol))
  )
  return quotes.filter((q): q is StockQuote => q !== null)
}

// 根据代码获取股票名称
export function getStockName(symbol: string): string | null {
  return mockStockData[symbol]?.name || null
}

// 获取支持的股票列表
export function getSupportedStocks(): Array<{ symbol: string; name: string }> {
  return Object.entries(mockStockData).map(([symbol, info]) => ({
    symbol,
    name: info.name,
  }))
}
