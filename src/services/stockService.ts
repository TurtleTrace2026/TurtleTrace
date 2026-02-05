import type { StockQuote } from '../types'

// 东方财富API返回的数据类型
interface EastMoneyResponse {
  data: {
    f43: number  // 最新价
    f44: number  // 最高价
    f45: number  // 最低价
    f46: number  // 开盘价
    f58: string  // 股票名称
    f60?: number // 昨收价（用于计算涨跌幅）
  } | null
}

// 将股票代码转换为东方财富API的secid格式
// 深圳股票(SZ): 0.{code}
// 上海股票(SH): 1.{code}
function convertSymbolToSecId(symbol: string): string {
  // 支持两种格式: 600519.SH 或 SH.600519
  let code = symbol
  let market = ''

  if (symbol.includes('.')) {
    const [symbolCode, suffix] = symbol.split('.')
    code = symbolCode
    market = suffix
  } else if (symbol.includes('SH') || symbol.includes('SZ')) {
    const parts = symbol.split(/(SH|SZ)/)
    code = parts[1]
    market = parts[0]
  }

  // 上海股票: 前缀1, 深圳股票: 前缀0
  const marketPrefix = market === 'SH' ? '1' : '0'
  return `${marketPrefix}.${code}`
}

// 从东方财富API获取股票实时行情
export async function getStockQuote(symbol: string): Promise<StockQuote | null> {
  try {
    const secId = convertSymbolToSecId(symbol)
    const url = `https://push2.eastmoney.com/api/qt/stock/get?fltt=2&invt=2&secid=${secId}&fields=f43,f44,f45,f46,f58,f60`

    const response = await fetch(url)
    if (!response.ok) {
      return null
    }

    const result: EastMoneyResponse = await response.json()

    if (!result.data || !result.data.f58) {
      return null
    }

    const { f43: price, f44: high, f45: low, f46: open, f58: name, f60: prevClose } = result.data

    // 计算涨跌幅
    const change = prevClose ? price - prevClose : 0
    const changePercent = prevClose ? (change / prevClose) * 100 : 0

    return {
      symbol,
      name,
      price: Number(price.toFixed(2)),
      change: Number(change.toFixed(2)),
      changePercent: Number(changePercent.toFixed(2)),
      open: Number(open.toFixed(2)),
      high: Number(high.toFixed(2)),
      low: Number(low.toFixed(2)),
      volume: 0, // API未返回成交量数据
      timestamp: Date.now(),
    }
  } catch (error) {
    console.error(`获取股票 ${symbol} 行情失败:`, error)
    return null
  }
}

// 批量获取股票行情
export async function getStockQuotes(symbols: string[]): Promise<StockQuote[]> {
  const quotes = await Promise.all(
    symbols.map(symbol => getStockQuote(symbol))
  )
  return quotes.filter((q): q is StockQuote => q !== null)
}

// 根据代码获取股票名称（需要调用API）
export async function getStockName(symbol: string): Promise<string | null> {
  const quote = await getStockQuote(symbol)
  return quote?.name || null
}

// 获取支持的股票列表（已废弃，请使用stockDatabase中的数据）
export function getSupportedStocks(): Array<{ symbol: string; name: string }> {
  return []
}
