/**
 * 股票服务 - 兼容层
 * 保持与原有 API 不变，内部使用新的数据源抽象层
 * @deprecated 请直接使用 stockDataService
 */

import type { StockQuote, NewsItem } from '../types'
import { stockDataService } from './stockDataService'
import { searchStocks } from './stockDatabase'

// 初始化标记
let providersInitialized = false

/** 确保初始化数据源 */
async function ensureProvidersInitialized(): Promise<void> {
  if (!providersInitialized) {
    await stockDataService.initialize()
    providersInitialized = true
  }
}

// ============ 股票行情 API ============

/**
 * 获取单个股票行情
 * @deprecated 请使用 stockDataService.getQuote()
 */
export async function getStockQuote(symbol: string): Promise<StockQuote | null> {
  await ensureProvidersInitialized()

  try {
    const quote = await stockDataService.getQuote(symbol)
    return quote
  } catch (error) {
    console.error(`获取股票 ${symbol} 行情失败:`, error)
    return null
  }
}

/**
 * 批量获取股票行情
 * @deprecated 请使用 stockDataService.getQuotes()
 */
export async function getStockQuotes(symbols: string[]): Promise<StockQuote[]> {
  await ensureProvidersInitialized()

  if (symbols.length === 0) return []

  try {
    return await stockDataService.getQuotes(symbols)
  } catch (error) {
    console.error('批量获取股票行情失败:', error)
    return []
  }
}

/**
 * 根据代码获取股票名称
 * @deprecated 请使用 stockDatabase.getStockName()
 */
export async function getStockName(symbol: string): Promise<string | null> {
  // 优先使用本地数据库
  const localName = getStockNameFromLocal(symbol)
  if (localName) return localName

  // 降级到 API 获取
  const quote = await getStockQuote(symbol)
  return quote?.name || null
}

/**
 * 从本地数据库获取股票名称
 */
function getStockNameFromLocal(symbol: string): string | null {
  try {
    // 提取代码部分
    const code = symbol.split('.')[0]
    const stocks = searchStocks(code, 1)
    if (stocks.length > 0 && stocks[0].ts_code === symbol) {
      return stocks[0].name
    }
  } catch {
    // 忽略错误
  }
  return null
}

/**
 * 获取支持的股票列表
 * @deprecated 请使用 stockDatabase
 */
export function getSupportedStocks(): Array<{ symbol: string; name: string }> {
  return []
}

// ============ 新闻 API ============

/**
 * 获取市场新闻
 * @deprecated 请使用 stockDataService.getNews()
 */
export async function getMarketNews(): Promise<NewsItem[]> {
  await ensureProvidersInitialized()

  try {
    const news = await stockDataService.getNews()
    // 转换为 NewsItem 格式
    return news.map(item => ({
      id: item.id,
      title: item.title,
      source: item.source,
      url: item.url,
      publishTime: item.publishTime,
      summary: item.summary,
      relatedSymbols: item.relatedSymbols,
    }))
  } catch (error) {
    console.error('获取市场新闻失败:', error)
    return []
  }
}

/**
 * 获取股票相关新闻
 * @deprecated 请使用 stockDataService.getNews(symbols)
 */
export async function getStockNews(symbols: string[]): Promise<NewsItem[]> {
  await ensureProvidersInitialized()

  try {
    const news = await stockDataService.getNews(symbols)
    return news.map(item => ({
      id: item.id,
      title: item.title,
      source: item.source,
      url: item.url,
      publishTime: item.publishTime,
      summary: item.summary,
      relatedSymbols: item.relatedSymbols,
    }))
  } catch (error) {
    console.error('获取股票新闻失败:', error)
    return []
  }
}

/**
 * 格式化新闻内容，移除HTML标签
 */
export function formatNewsContent(content: string): string {
  if (!content) return ''
  return content
    .replace(/<[^>]*>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/\s+/g, ' ')
    .trim()
}
