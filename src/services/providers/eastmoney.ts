/**
 * 数据源抽象层 - 东方财富实现
 * 提供A股市场实时行情、新闻等数据
 */

import type {
  StockDataProvider,
  StockQuote,
  StockInfo,
  StockNews,
  MarketIndex,
  Market,
  ProviderCapabilities,
} from './types'

/** 东方财富批量行情响应 */
interface EastMoneyBatchResponse {
  rc: number
  rt: number
  data: {
    f43: number
    f44: number
    f45: number
    f46: number
    f47: number
    f48: number
    f58: string
    f60: number
    f169: number
    f170: number
  }[]
}

/** 东方财富搜索响应 */
interface EastMoneySearchResponse {
  data: Array<{
    code: string
    name: string
    type: number
    marketCode: number
  }>
}

export class EastMoneyProvider implements StockDataProvider {
  readonly id = 'eastmoney'
  readonly name = '东方财富'
  readonly supportedMarkets: Market[] = ['a-share']

  readonly capabilities: ProviderCapabilities = {
    quote: true,
    search: true,
    news: true,
    marketIndex: true,
    historical: false,
  }

  private readonly baseUrl = 'https://push2.eastmoney.com'

  async getQuote(symbol: string): Promise<StockQuote> {
    const quotes = await this.getQuotes([symbol])
    if (quotes.length === 0) {
      throw new Error(`Failed to get quote for ${symbol}`)
    }
    return quotes[0]
  }

  async getQuotes(symbols: string[]): Promise<StockQuote[]> {
    if (symbols.length === 0) return []

    try {
      // 转换代码格式: 600519.SH -> 1.600519
      const secids = symbols.map(s => this.convertSymbolToSecId(s)).join(',')

      const url = `${this.baseUrl}/api/qt/ulist.np/get?` +
        `fltt=2&invt=2&fields=f43,f44,f45,f46,f47,f48,f58,f60,f169,f170` +
        `&secids=${secids}`

      const response = await fetch(url, {
        signal: this.createAbortSignal()
      })

      if (!response.ok) {
        throw new Error(`HTTP error: ${response.status}`)
      }

      const data: EastMoneyBatchResponse = await response.json()

      if (!data.data || data.data.length === 0) {
        return []
      }

      return data.data.map((item, index) => {
        const price = item.f43 / 100
        const change = item.f169 / 100
        const changePercent = item.f170 / 100

        return {
          symbol: symbols[index],
          name: item.f58,
          price: Number(price.toFixed(2)),
          change: Number(change.toFixed(2)),
          changePercent: Number(changePercent.toFixed(2)),
          open: Number((item.f46 / 100).toFixed(2)),
          high: Number((item.f44 / 100).toFixed(2)),
          low: Number((item.f45 / 100).toFixed(2)),
          volume: item.f47,
          turnover: item.f48,
          timestamp: Date.now(),
        }
      })
    } catch (error) {
      console.error('EastMoney getQuotes error:', error)
      throw error
    }
  }

  async searchStock(keyword: string, _market?: Market): Promise<StockInfo[]> {
    try {
      const url = `${this.baseUrl}/api/qt/suggest/get?` +
        `input=${encodeURIComponent(keyword)}` +
        `&type=14&count=20`

      const response = await fetch(url, {
        signal: this.createAbortSignal()
      })

      if (!response.ok) {
        return []
      }

      const text = await response.text()

      // 解析 JSONP 响应
      const jsonMatch = text.match(/\((.+)\)/)
      if (!jsonMatch) return []

      const data: EastMoneySearchResponse = JSON.parse(jsonMatch[1])
      if (!data.data) return []

      return data.data
        .filter((item) => this.isValidStock(item))
        .map((item) => ({
          symbol: this.normalizeSymbol(item.code, item.marketCode),
          name: item.name,
          market: 'a-share' as Market,
        }))
    } catch (error) {
      console.error('EastMoney searchStock error:', error)
      return []
    }
  }

  async getNews(_symbols?: string[], limit: number = 50): Promise<StockNews[]> {
    try {
      const timestamp = Date.now()
      const url = `https://np-weblist.eastmoney.com/comm/web/getFastNewsList?` +
        `client=web&biz=web_724&fastColumn=102&sortEnd=&pageSize=${limit}` +
        `&req_trace=${timestamp}&_=${timestamp}`

      const response = await fetch(url, {
        headers: { 'Accept': 'application/json' },
        signal: this.createAbortSignal()
      })

      if (!response.ok) {
        return []
      }

      const result: any = await response.json()

      // 尝试多种数据结构
      let newsList: any[] = []

      if (result?.data?.newsList && Array.isArray(result.data.newsList)) {
        newsList = result.data.newsList
      } else if (result?.data && Array.isArray(result.data)) {
        newsList = result.data
      } else if (result?.data && typeof result.data === 'object') {
        for (const key of Object.keys(result.data)) {
          if (Array.isArray(result.data[key])) {
            newsList = result.data[key]
            break
          }
        }
      }

      if (!Array.isArray(newsList) || newsList.length === 0) {
        return []
      }

      // 去重
      const seenIds = new Set<string>()

      return newsList
        .map((item: any, index: number): StockNews | null => {
          const publishTime = item.showTime || ''

          let uniqueId = item.id || `news_${index}_${publishTime}`
          if (seenIds.has(uniqueId)) {
            uniqueId = `${uniqueId}_${index}`
          }
          seenIds.add(uniqueId)

          return {
            id: uniqueId,
            title: item.title || '',
            source: item.source || '东方财富网',
            url: item.url || `https://fast.eastmoney.com/detail/${item.id || index}.html`,
            publishTime,
            summary: item.summary || item.ltext || item.content || '',
            relatedSymbols: item.stockCodes || [],
          }
        })
        .filter((item): item is StockNews => item !== null)
    } catch (error) {
      console.error('EastMoney getNews error:', error)
      return []
    }
  }

  async getMarketIndex(_market: Market): Promise<MarketIndex[]> {
    try {
      const indices = [
        { symbol: '000001.SH', name: '上证指数', secid: '1.000001' },
        { symbol: '399001.SZ', name: '深证成指', secid: '0.399001' },
        { symbol: '399006.SZ', name: '创业板指', secid: '0.399006' },
      ]

      const secids = indices.map(i => i.secid).join(',')
      const url = `${this.baseUrl}/api/qt/ulist.np/get?` +
        `fltt=2&fields=f43,f58,f169,f170&secids=${secids}`

      const response = await fetch(url, {
        signal: this.createAbortSignal()
      })

      if (!response.ok) {
        return []
      }

      const data = await response.json()

      if (!data.data) return []

      return data.data.map((item: any, index: number) => ({
        symbol: indices[index].symbol,
        name: indices[index].name,
        price: Number((item.f43 / 100).toFixed(2)),
        change: Number((item.f169 / 100).toFixed(2)),
        changePercent: Number((item.f170 / 100).toFixed(2)),
      }))
    } catch (error) {
      console.error('EastMoney getMarketIndex error:', error)
      return []
    }
  }

  async healthCheck(): Promise<boolean> {
    try {
      const url = `${this.baseUrl}/api/qt/ulist.np/get?fltt=2&fields=f43&secids=1.000001`
      const response = await fetch(url, { signal: this.createAbortSignal(5000) })
      return response.ok
    } catch {
      return false
    }
  }

  /** 转换股票代码格式 */
  private convertSymbolToSecId(symbol: string): string {
    // 600519.SH -> 1.600519
    // 000001.SZ -> 0.000001
    // 支持两种格式: 600519.SH 或 SH.600519
    let code = symbol
    let market = ''

    if (symbol.includes('.')) {
      const [symbolCode, suffix] = symbol.split('.')
      code = symbolCode
      market = suffix
    } else if (symbol.includes('SH') || symbol.includes('SZ')) {
      const parts = symbol.split(/(SH|SZ)/)
      code = parts[2] || parts[1] || symbol
      market = parts[1] || ''
    }

    // 上海股票: 前缀1, 深圳股票: 前缀0, 北交所: 前缀0
    let marketPrefix = '1'
    if (market === 'SZ' || market === 'BJ') {
      marketPrefix = '0'
    } else if (market === 'SH') {
      marketPrefix = '1'
    } else {
      // 根据代码判断
      if (code.startsWith('6')) {
        marketPrefix = '1'
      } else {
        marketPrefix = '0'
      }
    }

    return `${marketPrefix}.${code}`
  }

  /** 标准化股票代码 */
  private normalizeSymbol(code: string, marketCode: number): string {
    // marketCode: 1=上海, 0=深圳
    const suffix = marketCode === 1 ? 'SH' : 'SZ'

    // 移除可能的前缀
    let cleanCode = code
    if (code.startsWith('SH') || code.startsWith('SZ')) {
      cleanCode = code.substring(2)
    }

    return `${cleanCode}.${suffix}`
  }

  /** 验证是否为有效股票 */
  private isValidStock(item: { type: number; code: string }): boolean {
    // 过滤非股票（基金、债券等）
    const validTypes = [11, 12, 13, 14] // A股类型代码
    return validTypes.includes(item.type)
  }

  /** 创建 AbortSignal */
  private createAbortSignal(timeout: number = 10000): AbortSignal {
    const controller = new AbortController()
    setTimeout(() => controller.abort(), timeout)
    return controller.signal
  }
}
