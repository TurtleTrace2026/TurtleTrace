/**
 * 统一数据服务层
 * 提供统一的股票数据访问接口，屏蔽底层数据源差异
 */

import { providerRegistry } from './providers/registry'
import type { Market, StockQuote, StockInfo, StockNews, MarketIndex } from './providers/types'

class StockDataService {
  private currentMarket: Market = 'a-share'
  private currentProviderId: string | null = null
  private initialized = false

  /** 初始化服务 */
  async initialize(): Promise<void> {
    if (this.initialized) return

    // 延迟导入避免循环依赖
    const { initializeProviders } = await import('./providers')
    const { loadDataSourceConfig } = await import('../config/dataSource')

    const config = loadDataSourceConfig()
    initializeProviders(config.providers)

    this.initialized = true
  }

  /** 设置当前市场 */
  setMarket(market: Market): void {
    this.currentMarket = market
    this.currentProviderId = null // 重置，使用市场默认
  }

  /** 获取当前市场 */
  getMarket(): Market {
    return this.currentMarket
  }

  /** 设置指定数据源 */
  setProvider(providerId: string): void {
    this.currentProviderId = providerId
  }

  /** 获取当前数据源ID */
  getCurrentProviderId(): string | null {
    return this.currentProviderId
  }

  /** 获取当前数据源 */
  private async getProvider() {
    await this.initialize()

    if (this.currentProviderId) {
      return providerRegistry.getProvider(this.currentProviderId)
    }
    return providerRegistry.getProviderForMarket(this.currentMarket)
  }

  /** 获取单个股票行情 */
  async getQuote(symbol: string): Promise<StockQuote> {
    const provider = await this.getProvider()
    return provider.getQuote(symbol)
  }

  /** 批量获取行情 */
  async getQuotes(symbols: string[]): Promise<StockQuote[]> {
    if (symbols.length === 0) return []

    await this.initialize()
    const provider = await this.getProvider()

    try {
      // 优先使用批量接口
      return await provider.getQuotes(symbols)
    } catch (error) {
      console.warn('Batch quote failed, falling back to individual requests:', error)

      // 降级为逐个获取
      const results = await Promise.allSettled(
        symbols.map(s => provider.getQuote(s))
      )
      return results
        .filter((r): r is PromiseFulfilledResult<StockQuote> => r.status === 'fulfilled')
        .map(r => r.value)
    }
  }

  /** 搜索股票 */
  async searchStock(keyword: string, market?: Market): Promise<StockInfo[]> {
    await this.initialize()
    const provider = await this.getProvider()
    return provider.searchStock(keyword, market ?? this.currentMarket)
  }

  /** 获取新闻 */
  async getNews(symbols?: string[], limit: number = 50): Promise<StockNews[]> {
    await this.initialize()
    const provider = await this.getProvider()

    if (!provider.capabilities.news) {
      console.warn(`Provider ${provider.id} does not support news`)
      return []
    }

    return provider.getNews(symbols, limit)
  }

  /** 获取市场指数 */
  async getMarketIndex(market?: Market): Promise<MarketIndex[]> {
    await this.initialize()
    const targetMarket = market ?? this.currentMarket
    const provider = await providerRegistry.getProviderForMarket(targetMarket)

    if (!provider.capabilities.marketIndex) {
      return []
    }

    return provider.getMarketIndex(targetMarket)
  }

  /** 获取可用数据源列表 */
  getAvailableProviders() {
    return providerRegistry.getRegisteredProviders()
  }

  /** 检查服务是否已初始化 */
  isInitialized(): boolean {
    return this.initialized
  }

  /** 重置服务状态 */
  reset(): void {
    this.initialized = false
    this.currentMarket = 'a-share'
    this.currentProviderId = null
    providerRegistry.clearCache()
  }
}

// 单例导出
export const stockDataService = new StockDataService()

// 类型导出
export type { Market, StockQuote, StockInfo, StockNews, MarketIndex }
