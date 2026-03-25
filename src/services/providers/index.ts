/**
 * 数据源抽象层 - 导出入口
 */

import { providerRegistry } from './registry'
import { EastMoneyProvider } from './eastmoney'
import type { ProviderConfig } from './types'

export * from './types'

/**
 * 初始化数据源
 */
export function initializeProviders(
  configs?: Record<string, ProviderConfig>
): void {
  // 注册东方财富（立即实例化，A股默认）
  const eastmoney = new EastMoneyProvider()
  providerRegistry.register(eastmoney)

  // 应用配置
  if (configs) {
    for (const [id, config] of Object.entries(configs)) {
      providerRegistry.configure(id, config)
    }
  }

  // 设置默认数据源映射
  providerRegistry.setDefaultProvider('a-share', 'eastmoney')
}
