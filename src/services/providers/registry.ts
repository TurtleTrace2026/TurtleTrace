/**
 * 数据源抽象层 - 注册中心
 * 管理所有数据源提供商的注册和获取
 */

import type { StockDataProvider, Market, ProviderConfig } from './types'

type ProviderFactory = () => StockDataProvider

class ProviderRegistry {
  private providers: Map<string, StockDataProvider> = new Map()
  private factories: Map<string, ProviderFactory> = new Map()
  private defaultProviders: Map<Market, string> = new Map()
  private configs: Map<string, ProviderConfig> = new Map()

  private static instance: ProviderRegistry

  static getInstance(): ProviderRegistry {
    if (!ProviderRegistry.instance) {
      ProviderRegistry.instance = new ProviderRegistry()
    }
    return ProviderRegistry.instance
  }

  /** 注册数据源工厂（延迟实例化） */
  registerFactory(id: string, factory: ProviderFactory): void {
    this.factories.set(id, factory)
  }

  /** 直接注册数据源实例 */
  register(provider: StockDataProvider): void {
    this.providers.set(provider.id, provider)

    // 设置为支持市场的默认数据源
    for (const market of provider.supportedMarkets) {
      if (!this.defaultProviders.has(market)) {
        this.defaultProviders.set(market, provider.id)
      }
    }
  }

  /** 注销数据源 */
  unregister(providerId: string): void {
    this.providers.delete(providerId)
    this.factories.delete(providerId)

    // 清除默认数据源映射
    for (const [market, id] of this.defaultProviders) {
      if (id === providerId) {
        this.defaultProviders.delete(market)
      }
    }
  }

  /** 设置默认数据源 */
  setDefaultProvider(market: Market, providerId: string): void {
    this.defaultProviders.set(market, providerId)
  }

  /** 配置数据源 */
  configure(providerId: string, config: ProviderConfig): void {
    this.configs.set(providerId, config)
  }

  /** 获取数据源（延迟加载） */
  async getProvider(providerId: string): Promise<StockDataProvider> {
    // 优先返回已实例化的
    if (this.providers.has(providerId)) {
      return this.providers.get(providerId)!
    }

    // 使用工厂创建
    if (this.factories.has(providerId)) {
      const factory = this.factories.get(providerId)!
      const provider = factory()

      // 应用配置
      const config = this.configs.get(providerId)
      if (config && provider.initialize) {
        await provider.initialize(config)
      }

      this.providers.set(providerId, provider)
      return provider
    }

    throw new Error(`Provider not found: ${providerId}`)
  }

  /** 获取指定市场的默认数据源 */
  async getProviderForMarket(market: Market): Promise<StockDataProvider> {
    const providerId = this.defaultProviders.get(market)
    if (!providerId) {
      throw new Error(`No provider registered for market: ${market}`)
    }
    return this.getProvider(providerId)
  }

  /** 检查数据源是否存在 */
  hasProvider(providerId: string): boolean {
    return this.providers.has(providerId) || this.factories.has(providerId)
  }

  /** 获取所有已注册的数据源 */
  getRegisteredProviders(): Array<{ id: string; name: string; markets: Market[] }> {
    const result: Array<{ id: string; name: string; markets: Market[] }> = []
    const added = new Set<string>()

    // 从已实例化的获取
    for (const [id, provider] of this.providers) {
      if (!added.has(id)) {
        result.push({
          id,
          name: provider.name,
          markets: [...provider.supportedMarkets]
        })
        added.add(id)
      }
    }

    // 从工厂获取（不实例化）
    for (const [id] of this.factories) {
      if (!added.has(id)) {
        result.push({ id, name: id, markets: [] })
        added.add(id)
      }
    }

    return result
  }

  /** 获取市场的默认数据源ID */
  getDefaultProviderId(market: Market): string | undefined {
    return this.defaultProviders.get(market)
  }

  /** 清除所有缓存的数据源实例 */
  clearCache(): void {
    this.providers.clear()
  }
}

export const providerRegistry = ProviderRegistry.getInstance()
