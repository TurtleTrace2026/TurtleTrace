import type { NewsItem } from '../types'

// 获取东方财富实时快讯
export async function getMarketNews(): Promise<NewsItem[]> {
  try {
    const timestamp = Date.now()
    const url = `https://np-weblist.eastmoney.com/comm/web/getFastNewsList?client=web&biz=web_724&fastColumn=102&sortEnd=&pageSize=50&req_trace=${timestamp}&_=${timestamp}`

    const response = await fetch(url, {
      headers: {
        'Accept': 'application/json',
      },
    })

    if (!response.ok) {
      return []
    }

    const result: any = await response.json()

    // 尝试多种数据结构
    let newsList: any[] = []

    // 结构1: { code: '1', data: { newsList: [...] } }
    if (result?.data?.newsList && Array.isArray(result.data.newsList)) {
      newsList = result.data.newsList
    }
    // 结构2: { data: [...] } - data 直接是数组
    else if (result?.data && Array.isArray(result.data)) {
      newsList = result.data
    }
    // 结构3: data 是对象但有不同的键名
    else if (result?.data && typeof result.data === 'object') {
      // 尝试找到数组字段
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

    // 使用 Set 去重，避免重复ID
    const seenIds = new Set<string>()

    // 转换为 NewsItem 格式
    return newsList.map((item: any, index: number): NewsItem => {
      // 直接使用 showTime 原始值
      const publishTime = item.showTime || ''

      // 确保ID唯一：使用原ID，如果重复则添加索引后缀
      let uniqueId = item.id || `news_${index}_${publishTime}`
      if (seenIds.has(uniqueId)) {
        uniqueId = `${uniqueId}_${index}`
      }
      seenIds.add(uniqueId)

      return {
        id: uniqueId,
        title: item.title || '',
        source: '东方财富网',
        url: item.url || `https://fast.eastmoney.com/detail/${item.id || index}.html`,
        publishTime,
        summary: item.summary || item.ltext || item.content || '',
        relatedSymbols: item.stockCodes || [],
      }
    })
  } catch (error) {
    return []
  }
}

// 获取股票相关新闻（复用市场快讯）
export async function getStockNews(_symbols: string[]): Promise<NewsItem[]> {
  return getMarketNews()
}

// 格式化新闻内容，移除HTML标签
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
