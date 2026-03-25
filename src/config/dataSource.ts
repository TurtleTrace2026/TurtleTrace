/**
 * 数据源配置管理
 */

import type { Market } from '../services/providers/types'

/** 数据源配置项 */
export interface DataSourceProviderConfig {
  enabled: boolean
  apiKey?: string
  apiSecret?: string
  baseUrl?: string
}

/** 完整的数据源配置 */
export interface DataSourceConfig {
  version: string
  defaultMarket: Market
  currentProvider?: string
  providers: Record<string, DataSourceProviderConfig>
}

const STORAGE_KEY = 'turtletrace_datasource_config'

/** 默认配置 */
const DEFAULT_CONFIG: DataSourceConfig = {
  version: '1.0',
  defaultMarket: 'a-share',
  providers: {
    eastmoney: { enabled: true },
    yahoo: { enabled: false },
  }
}

/**
 * 加载数据源配置
 */
export function loadDataSourceConfig(): DataSourceConfig {
  try {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (saved) {
      const parsed = JSON.parse(saved)
      // 合并默认配置，确保新字段有默认值
      return {
        ...DEFAULT_CONFIG,
        ...parsed,
        providers: {
          ...DEFAULT_CONFIG.providers,
          ...parsed.providers,
        },
      }
    }
  } catch (e) {
    console.error('Failed to load datasource config:', e)
  }
  return { ...DEFAULT_CONFIG }
}

/**
 * 保存数据源配置
 */
export function saveDataSourceConfig(config: Partial<DataSourceConfig>): void {
  const currentConfig = loadDataSourceConfig()
  const newConfig: DataSourceConfig = {
    ...currentConfig,
    ...config,
    providers: {
      ...currentConfig.providers,
      ...config.providers,
    },
  }
  localStorage.setItem(STORAGE_KEY, JSON.stringify(newConfig))
}

/**
 * 重置数据源配置
 */
export function resetDataSourceConfig(): void {
  localStorage.removeItem(STORAGE_KEY)
}

/**
 * 获取指定数据源的配置
 */
export function getProviderConfig(providerId: string): DataSourceProviderConfig | undefined {
  const config = loadDataSourceConfig()
  return config.providers[providerId]
}

/**
 * 设置指定数据源的配置
 */
export function setProviderConfig(
  providerId: string,
  providerConfig: Partial<DataSourceProviderConfig>
): void {
  const config = loadDataSourceConfig()
  saveDataSourceConfig({
    ...config,
    providers: {
      ...config.providers,
      [providerId]: {
        ...config.providers[providerId],
        ...providerConfig,
      },
    },
  })
}

/**
 * 检查数据源是否启用
 */
export function isProviderEnabled(providerId: string): boolean {
  const config = getProviderConfig(providerId)
  return config?.enabled ?? false
}

/**
 * 获取默认市场
 */
export function getDefaultMarket(): Market {
  const config = loadDataSourceConfig()
  return config.defaultMarket
}

/**
 * 设置默认市场
 */
export function setDefaultMarket(market: Market): void {
  saveDataSourceConfig({ defaultMarket: market })
}

/**
 * 获取当前数据源
 */
export function getCurrentProvider(): string | undefined {
  const config = loadDataSourceConfig()
  return config.currentProvider
}

/**
 * 设置当前数据源
 */
export function setCurrentProvider(providerId: string): void {
  saveDataSourceConfig({ currentProvider: providerId })
}
