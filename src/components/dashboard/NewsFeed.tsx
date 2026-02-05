import { useEffect, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card'
import { Button } from '../ui/button'
import { Newspaper, RefreshCw, Clock, ExternalLink } from 'lucide-react'
import type { NewsItem } from '../../types'
import { getMarketNews, formatNewsContent } from '../../services/newsService'

interface NewsFeedProps {
  symbols: string[]
}

export function NewsFeed({ symbols: _symbols }: NewsFeedProps) {
  const [news, setNews] = useState<NewsItem[]>([])
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const loadNews = async () => {
    setIsRefreshing(true)
    setError(null)
    try {
      console.log('开始加载新闻...')
      const marketNews = await getMarketNews()
      console.log('获取到的新闻数据:', marketNews)
      console.log('新闻数量:', marketNews.length)

      if (!Array.isArray(marketNews)) {
        console.error('返回的不是数组:', typeof marketNews, marketNews)
        setError('数据格式错误')
        setNews([])
        return
      }

      // 调试：查看第一条新闻的summary字段
      if (marketNews.length > 0) {
        console.log('第一条新闻完整数据:', marketNews[0])
        console.log('第一条新闻summary:', marketNews[0].summary)
      }

      setNews(marketNews)
    } catch (err) {
      console.error('加载新闻失败:', err)
      setError('加载失败，请重试')
      setNews([])
    } finally {
      setIsRefreshing(false)
    }
  }

  useEffect(() => {
    loadNews()
  }, [])

  // 自动刷新：每5分钟刷新一次
  useEffect(() => {
    const interval = setInterval(() => {
      loadNews()
    }, 5 * 60 * 1000)
    return () => clearInterval(interval)
  }, [])

  const formatPublishTime = (timeStr: string) => {
    // 直接返回原始时间字符串
    return timeStr || '未知时间'
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>实时快讯</CardTitle>
            <CardDescription>
              东方财富网7x24小时市场快讯 · 共{news.length}条
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground">自动刷新</span>
            <Button
              variant="outline"
              size="sm"
              onClick={loadNews}
              disabled={isRefreshing}
            >
              <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {isRefreshing ? (
          <div className="text-center py-16 text-muted-foreground">
            <RefreshCw className="h-12 w-12 mx-auto mb-4 animate-spin text-primary" />
            <p>正在加载快讯...</p>
          </div>
        ) : error ? (
          <div className="text-center py-16 text-muted-foreground">
            <Newspaper className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p className="text-destructive">{error}</p>
            <Button variant="outline" size="sm" onClick={loadNews} className="mt-4">
              重试
            </Button>
          </div>
        ) : news.length === 0 ? (
          <div className="text-center py-16 text-muted-foreground">
            <Newspaper className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>暂无快讯</p>
            <Button variant="outline" size="sm" onClick={loadNews} className="mt-4">
              点击刷新获取最新资讯
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            {news.map(item => {
              return (
                <div
                  key={item.id}
                  className="group p-4 rounded-lg border transition-all hover:shadow-md cursor-pointer border-border hover:border-primary/30"
                  onClick={() => window.open('https://kuaixun.eastmoney.com/', '_blank')}
                >
                  {/* 标题 */}
                  <h4 className="font-medium leading-snug mb-3 group-hover:text-primary transition-colors">
                    {item.title || '无标题'}
                  </h4>

                  {/* 摘要 */}
                  {item.summary ? (
                    <p className="text-sm text-muted-foreground leading-relaxed mb-3">
                      {formatNewsContent(item.summary)}
                    </p>
                  ) : (
                    <p className="text-xs text-muted-foreground/50 italic mb-3">
                      无摘要信息
                    </p>
                  )}

                  {/* 时间 */}
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <Clock className="h-3 w-3" />
                    {formatPublishTime(item.publishTime)}
                    <span className="ml-auto opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1">
                      查看详情 <ExternalLink className="h-3 w-3" />
                    </span>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
