/**
 * 数据源抽象层 - 类型定义
 */

/** 支持的市场类型 */
export type Market = 'a-share' | 'hk' | 'us' | 'cn-fund'

/** 股票基本信息 */
export interface StockInfo {
  symbol: string           // 股票代码，如 "600519.SH"
  name: string             // 股票名称
  market: Market           // 所属市场
  exchange?: string        // 交易所
}

/** 实时行情 */
export interface StockQuote {
  symbol: string
  name: string
  price: number
  change: number           // 涨跌额
  changePercent: number    // 涨跌幅
  open: number
  high: number
  low: number
  volume: number
  turnover?: number        // 成交额
  timestamp: number
}

/** 市场指数 */
export interface MarketIndex {
  symbol: string
  name: string
  price: number
  change: number
  changePercent: number
}

/** 新闻条目 */
export interface StockNews {
  id: string
  title: string
  source: string
  url: string
  publishTime: string
  summary?: string
  relatedSymbols: string[]
}

/** 数据源能力声明 */
export interface ProviderCapabilities {
  quote: boolean           // 实时行情
  search: boolean          // 股票搜索
  news: boolean            // 新闻资讯
  marketIndex: boolean     // 市场指数
  historical: boolean      // 历史数据
}

/** 数据源配置 */
export interface ProviderConfig {
  apiKey?: string
  apiSecret?: string
  baseUrl?: string
  timeout?: number
  retryCount?: number
}

/** 数据源接口 - 核心抽象 */
export interface StockDataProvider {
  /** 数据源标识 */
  readonly id: string

  /** 数据源名称 */
  readonly name: string

  /** 支持的市场 */
  readonly supportedMarkets: Market[]

  /** 数据源能力 */
  readonly capabilities: ProviderCapabilities

  /** 初始化（可选） */
  initialize?(config: ProviderConfig): Promise<void>

  /** 获取实时行情 */
  getQuote(symbol: string): Promise<StockQuote>

  /** 批量获取行情 */
  getQuotes(symbols: string[]): Promise<StockQuote[]>

  /** 搜索股票 */
  searchStock(keyword: string, market?: Market): Promise<StockInfo[]>

  /** 获取新闻 */
  getNews(symbols?: string[], limit?: number): Promise<StockNews[]>

  /** 获取市场指数 */
  getMarketIndex(market: Market): Promise<MarketIndex[]>

  /** 健康检查 */
  healthCheck?(): Promise<boolean>
}
