import { useEffect, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card'
import { Button } from '../ui/button'
import { Newspaper, ExternalLink, RefreshCw } from 'lucide-react'
import type { NewsItem } from '../../types'
import { getStockNews, getMarketNews } from '../../services/newsService'
import { formatDate } from '../../lib/utils'

interface NewsFeedProps {
  symbols: string[]
}

export function NewsFeed({ symbols }: NewsFeedProps) {
  const [news, setNews] = useState<NewsItem[]>([])
  const [isRefreshing, setIsRefreshing] = useState(false)

  const loadNews = async () => {
    setIsRefreshing(true)
    try {
      const [stockNews, marketNews] = await Promise.all([
        symbols.length > 0 ? getStockNews(symbols) : [],
        getMarketNews(),
      ])
      setNews([...stockNews, ...marketNews].slice(0, 20))
    } finally {
      setIsRefreshing(false)
    }
  }

  useEffect(() => {
    loadNews()
  }, [symbols])

  const formatPublishTime = (timestamp: number) => {
    const now = Date.now()
    const diff = now - timestamp
    const hours = Math.floor(diff / 3600000)

    if (hours < 1) {
      const minutes = Math.floor(diff / 60000)
      return `${minutes}分钟前`
    } else if (hours < 24) {
      return `${hours}小时前`
    } else {
      return formatDate(new Date(timestamp))
    }
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>新闻快讯</CardTitle>
            <CardDescription>
              {symbols.length > 0
                ? `与持仓股票相关的最新财经资讯`
                : '添加持仓后查看相关新闻'}
            </CardDescription>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={loadNews}
            disabled={isRefreshing || symbols.length === 0}
          >
            <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {symbols.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <Newspaper className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>暂无新闻</p>
            <p className="text-sm mt-2">添加持仓后将显示相关股票新闻</p>
          </div>
        ) : news.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <p>加载中...</p>
          </div>
        ) : (
          <div className="space-y-4">
            {news.map(item => (
              <div
                key={item.id}
                className="p-4 rounded-lg border hover:bg-muted/50 transition-colors cursor-pointer"
                onClick={() => window.open(item.url, '_blank')}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <h4 className="font-medium mb-2 line-clamp-2 hover:text-primary transition-colors">
                      {item.title}
                    </h4>
                    {item.summary && (
                      <p className="text-sm text-muted-foreground line-clamp-2">
                        {item.summary}
                      </p>
                    )}
                  </div>
                  <ExternalLink className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                </div>
                <div className="flex items-center gap-4 mt-3 text-xs text-muted-foreground">
                  <span>{item.source}</span>
                  <span>•</span>
                  <span>{formatPublishTime(item.publishTime)}</span>
                  {item.relatedSymbols.length > 0 && (
                    <>
                      <span>•</span>
                      <span className="text-primary">
                        {item.relatedSymbols.join(', ')}
                      </span>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
