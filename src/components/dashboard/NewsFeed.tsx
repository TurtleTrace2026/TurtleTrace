import { useEffect, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card'
import { Button } from '../ui/button'
import { Badge } from '../ui/badge'
import { Newspaper, RefreshCw, Clock, ExternalLink, Rss, Sparkles, Loader2, Settings, X } from 'lucide-react'
import type { NewsItem } from '../../types'
import { getMarketNews, formatNewsContent } from '../../services/newsService'
import { analyzeNews, type NewsAnalysis as NewsAnalysisType } from '../../services/aiService'
import { useAiConfig } from '../../hooks/useAiConfig'
import { NewsAnalysisComponent } from '../news/NewsAnalysis'
import { formatDistanceToNow } from 'date-fns'
import { zhCN } from 'date-fns/locale'

interface NewsFeedProps {
  symbols: string[]
}

// 解读结果缓存
const analysisCache = new Map<string, NewsAnalysisType>()

export function NewsFeed({ symbols: _symbols }: NewsFeedProps) {
  const [news, setNews] = useState<NewsItem[]>([])
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // AI解读相关状态
  const aiConfig = useAiConfig()
  const [analyzingId, setAnalyzingId] = useState<string | null>(null)
  const [analysisMap, setAnalysisMap] = useState<Map<string, NewsAnalysisType>>(new Map())
  const [analysisError, setAnalysisError] = useState<string | null>(null)

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
    // 尝试解析时间字符串并使用相对时间
    try {
      // 处理 "02-25 15:30" 格式
      const match = timeStr.match(/(\d{2})-(\d{2})\s+(\d{2}):(\d{2})/)
      if (match) {
        const [, month, day, hour, minute] = match
        const currentYear = new Date().getFullYear()
        const date = new Date(currentYear, parseInt(month) - 1, parseInt(day), parseInt(hour), parseInt(minute))
        const now = new Date()

        // 如果日期在未来，说明是去年的
        if (date > now) {
          date.setFullYear(date.getFullYear() - 1)
        }

        return formatDistanceToNow(date, { addSuffix: true, locale: zhCN })
      }
    } catch (e) {
      // 解析失败，返回原始字符串
    }
    return timeStr || '未知时间'
  }

  // 处理解读按钮点击
  const handleAnalyze = async (item: NewsItem, e: React.MouseEvent) => {
    e.stopPropagation()

    // 检查缓存
    const cacheKey = item.id
    if (analysisCache.has(cacheKey)) {
      setAnalysisMap(prev => new Map(prev).set(item.id, analysisCache.get(cacheKey)!))
      return
    }

    // 检查配置
    if (!aiConfig.isConfigured) {
      setAnalysisError('请先在设置中配置AI服务')
      return
    }

    setAnalyzingId(item.id)
    setAnalysisError(null)

    try {
      const result = await analyzeNews(
        [{ title: item.title || '', content: item.summary || '' }],
        aiConfig.endpoint,
        aiConfig.apiKey
      )

      // 缓存结果
      analysisCache.set(cacheKey, result)
      setAnalysisMap(prev => new Map(prev).set(item.id, result))
    } catch (err) {
      console.error('分析失败:', err)
      const message = err instanceof Error ? err.message : '解读失败，请稍后重试'
      setAnalysisError(message)
    } finally {
      setAnalyzingId(null)
    }
  }

  // 关闭解读结果
  const handleCloseAnalysis = (newsId: string, e: React.MouseEvent) => {
    e.stopPropagation()
    setAnalysisMap(prev => {
      const newMap = new Map(prev)
      newMap.delete(newsId)
      return newMap
    })
  }

  return (
    <Card className="overflow-hidden">
      <CardHeader className="border-b bg-surface/50">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-info/10 rounded-lg">
              <Rss className="h-5 w-5 text-info" />
            </div>
            <div>
              <CardTitle>实时快讯</CardTitle>
              <div className="flex items-center gap-2 mt-1 text-sm text-muted-foreground">
                <span>东方财富网7x24小时市场快讯</span>
                <Badge variant="outline" className="text-xs">
                  共 {news.length} 条
                </Badge>
                {aiConfig.isConfigured && (
                  <Badge variant="default" className="text-xs gap-1">
                    <Sparkles className="h-3 w-3" />
                    AI已配置
                  </Badge>
                )}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground hidden sm:inline">
              每 5 分钟自动刷新
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={loadNews}
              disabled={isRefreshing}
              className="gap-2"
            >
              <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline">刷新</span>
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-0">
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
          <div className="divide-y">
            {news.map((item, index) => {
              const isNew = index < 3 // 前3条标记为新
              const isAnalyzing = analyzingId === item.id
              const hasAnalysis = analysisMap.has(item.id)
              const analysis = analysisMap.get(item.id)

              return (
                <div
                  key={item.id}
                  className="group transition-all hover:bg-surface-hover border-l-2 border-transparent hover:border-primary"
                >
                  <div
                    className="p-4 cursor-pointer"
                    onClick={() => window.open('https://kuaixun.eastmoney.com/', '_blank')}
                  >
                    <div className="flex gap-3">
                      <div className="flex-1 min-w-0">
                        {/* 标题行 */}
                        <div className="flex items-start gap-2 mb-2">
                          <h4 className="font-medium leading-snug group-hover:text-primary transition-colors flex-1">
                            {item.title || '无标题'}
                          </h4>
                          {isNew && (
                            <Badge variant="default" className="text-xs shrink-0">
                              新
                            </Badge>
                          )}
                        </div>

                        {/* 摘要 */}
                        {item.summary ? (
                          <p className="text-sm text-muted-foreground leading-relaxed mb-3 line-clamp-2">
                            {formatNewsContent(item.summary)}
                          </p>
                        ) : (
                          <p className="text-xs text-muted-foreground/50 italic mb-3">
                            无摘要信息
                          </p>
                        )}

                        {/* 底部：时间 + 操作按钮 */}
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                            <Clock className="h-3 w-3" />
                            {formatPublishTime(item.publishTime)}
                          </div>

                          <div className="flex items-center gap-2">
                            {/* 解读按钮 */}
                            <Button
                              variant="outline"
                              size="sm"
                              className={`h-7 text-xs gap-1 ${hasAnalysis ? 'bg-primary/10 border-primary/30' : ''}`}
                              onClick={(e) => handleAnalyze(item, e)}
                              disabled={isAnalyzing || !aiConfig.isConfigured}
                              title={!aiConfig.isConfigured ? '请先在设置中配置AI' : 'AI智能解读'}
                            >
                              {isAnalyzing ? (
                                <>
                                  <Loader2 className="h-3 w-3 animate-spin" />
                                  解读中
                                </>
                              ) : hasAnalysis ? (
                                <>
                                  <Sparkles className="h-3 w-3 text-primary" />
                                  已解读
                                </>
                              ) : (
                                <>
                                  <Sparkles className="h-3 w-3" />
                                  解读
                                </>
                              )}
                            </Button>

                            {/* 查看详情 */}
                            <span className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1 text-xs text-info">
                              详情 <ExternalLink className="h-3 w-3" />
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* 解读结果展示 */}
                  {hasAnalysis && analysis && (
                    <div className="px-4 pb-4 relative">
                      {/* 关闭按钮 */}
                      <Button
                        variant="ghost"
                        size="sm"
                        className="absolute top-0 right-4 h-6 w-6 p-0"
                        onClick={(e) => handleCloseAnalysis(item.id, e)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                      <NewsAnalysisComponent analysis={analysis} />
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}

        {/* 未配置AI提示 */}
        {!aiConfig.isConfigured && news.length > 0 && (
          <div className="p-4 border-t bg-muted/30">
            <div className="flex items-center gap-3 text-sm text-muted-foreground">
              <Settings className="h-4 w-4" />
              <span>
                想要使用AI智能解读功能？
                请前往<strong className="text-foreground">设置</strong>页面配置AI服务地址和API Key
              </span>
            </div>
          </div>
        )}
      </CardContent>

      {/* 解读错误提示 */}
      {analysisError && (
        <div className="fixed bottom-4 right-4 bg-destructive text-destructive-foreground px-4 py-3 rounded-lg shadow-lg flex items-center gap-2 z-50">
          <span className="text-sm">{analysisError}</span>
          <Button
            variant="ghost"
            size="sm"
            className="h-6 w-6 p-0 text-destructive-foreground hover:bg-destructive-foreground/20"
            onClick={() => setAnalysisError(null)}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      )}
    </Card>
  )
}
