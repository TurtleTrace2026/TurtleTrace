// 本地股票数据库服务
import stockDatabaseJson from '../data/stock-database.json'

const stockData = stockDatabaseJson as unknown[]

// 股票基本信息接口
export interface StockBasicInfo {
  ts_code: string      // 股票代码，如 "000001.SZ"
  symbol: string       // 股票简称代码，如 "000001"
  name: string         // 股票名称，如 "平安银行"
  area: string         // 地区
  industry: string     // 行业
  cnspell: string      // 拼音缩写
  market: string       // 市场（主板/创业板/科创板等）
  list_date: string    // 上市日期
  exchange: string     // 交易所
  list_status: string  // 上市状态 (L=上市, D=退市, P=暂停上市)
}

// 搜索结果
export interface SearchResult extends StockBasicInfo {
  matchType: 'code' | 'name' | 'pinyin'  // 匹配类型
}

// 数据库中所有股票的缓存
let allStocks: StockBasicInfo[] = []

// 初始化数据库
function initDatabase() {
  if (allStocks.length === 0) {
    allStocks = stockData as StockBasicInfo[]
    // 只返回上市状态的股票
    allStocks = allStocks.filter(s => s.list_status === 'L')
  }
}

// 搜索股票（支持代码、名称、拼音搜索）
export function searchStocks(query: string, limit: number = 20): SearchResult[] {
  initDatabase()

  if (!query || query.trim().length === 0) {
    return []
  }

  const q = query.trim().toLowerCase()

  // 按优先级搜索
  const results: SearchResult[] = []

  // 1. 精确匹配股票代码 (ts_code 或 symbol)
  for (const stock of allStocks) {
    if (stock.ts_code.toLowerCase() === q || stock.symbol === q) {
      results.push({ ...stock, matchType: 'code' })
    }
  }

  // 2. 精确匹配名称
  for (const stock of allStocks) {
    if (stock.name === query) {
      if (!results.find(r => r.ts_code === stock.ts_code)) {
        results.push({ ...stock, matchType: 'name' })
      }
    }
  }

  // 3. 前缀匹配代码
  for (const stock of allStocks) {
    if (stock.ts_code.toLowerCase().startsWith(q) || stock.symbol.startsWith(q)) {
      if (!results.find(r => r.ts_code === stock.ts_code)) {
        results.push({ ...stock, matchType: 'code' })
      }
    }
  }

  // 4. 前缀匹配拼音
  for (const stock of allStocks) {
    if (stock.cnspell.toLowerCase().startsWith(q)) {
      if (!results.find(r => r.ts_code === stock.ts_code)) {
        results.push({ ...stock, matchType: 'pinyin' })
      }
    }
  }

  // 5. 包含匹配名称
  for (const stock of allStocks) {
    if (stock.name.includes(query)) {
      if (!results.find(r => r.ts_code === stock.ts_code)) {
        results.push({ ...stock, matchType: 'name' })
      }
    }
  }

  // 6. 包含匹配拼音
  for (const stock of allStocks) {
    if (stock.cnspell.toLowerCase().includes(q)) {
      if (!results.find(r => r.ts_code === stock.ts_code)) {
        results.push({ ...stock, matchType: 'pinyin' })
      }
    }
  }

  // 按匹配类型和代码排序
  const sorted = results.sort((a, b) => {
    const matchTypeOrder = { code: 0, name: 1, pinyin: 2 }
    const typeDiff = matchTypeOrder[a.matchType] - matchTypeOrder[b.matchType]
    if (typeDiff !== 0) return typeDiff

    // 同类型按代码排序
    return a.ts_code.localeCompare(b.ts_code)
  })

  return sorted.slice(0, limit)
}

// 根据股票代码获取股票信息
export function getStockInfo(tsCode: string): StockBasicInfo | null {
  initDatabase()
  return allStocks.find(s => s.ts_code === tsCode || s.symbol === tsCode) || null
}

// 根据股票代码获取股票名称
export function getStockName(tsCode: string): string | null {
  const stock = getStockInfo(tsCode)
  return stock?.name || null
}

// 获取支持的股票列表（用于建议）
export function getPopularStocks(limit: number = 10): SearchResult[] {
  initDatabase()
  // 返回一些热门股票（这里简单按代码排序返回前几个）
  // 实际应用中可以根据市值、成交量等排序
  const popularCodes = [
    '600519.SH', // 贵州茅台
    '000858.SZ', // 五粮液
    '600036.SH', // 招商银行
    '000001.SZ', // 平安银行
    '601318.SH', // 中国平安
    '000333.SZ', // 美的集团
    '600276.SH', // 恒瑞医药
    '300059.SZ', // 东方财富
    '600900.SH', // 长江电力
    '002594.SZ', // 比亚迪
  ]

  const results: SearchResult[] = []
  for (const code of popularCodes) {
    const stock = getStockInfo(code)
    if (stock) {
      results.push({ ...stock, matchType: 'code' })
    }
  }

  return results.slice(0, limit)
}

// 按行业获取股票
export function getStocksByIndustry(industry: string, limit: number = 20): StockBasicInfo[] {
  initDatabase()
  return allStocks
    .filter(s => s.industry === industry)
    .slice(0, limit)
}

// 获取所有行业列表
export function getIndustries(): string[] {
  initDatabase()
  const industries = new Set(allStocks.map(s => s.industry))
  return Array.from(industries).sort()
}

// 获取数据库统计信息
export function getDatabaseStats() {
  initDatabase()
  const industries = getIndustries()
  const exchanges = new Set(allStocks.map(s => s.exchange))

  return {
    totalStocks: allStocks.length,
    industries: industries.length,
    exchanges: exchanges.size,
    exchangeList: Array.from(exchanges),
  }
}
