import { useState } from 'react'
import { Button } from '../../ui/button'
import { X, Loader2, Sparkles } from 'lucide-react'
import type { DailyReview } from '../../../types/review'
import { analyzeDailyReview } from '../../../services/dailyReviewAIService'
import type { DailyReviewAnalysis } from '../../../services/dailyReviewAIService'
import { DailyReviewAnalysisCard } from './DailyReviewAnalysisCard'
import { useAiConfig } from '../../../hooks/useAiConfig'

interface DailyReviewAnalysisDialogProps {
  review: DailyReview
  onClose: () => void
}

export function DailyReviewAnalysisDialog({ review, onClose }: DailyReviewAnalysisDialogProps) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [analysis, setAnalysis] = useState<DailyReviewAnalysis | null>(null)

  const aiConfig = useAiConfig()

  const handleAnalyze = async () => {
    if (!aiConfig.isConfigured) {
      setError('请先在设置中配置AI服务')
      return
    }

    setLoading(true)
    setError(null)

    try {
      const result = await analyzeDailyReview(review, aiConfig.endpoint, aiConfig.apiKey)
      setAnalysis(result)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '生成评价失败，请稍后重试'
      setError(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={onClose}>
      <div
        className="bg-card rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* 头部 */}
        <div className="p-4 border-b flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-lg">
              <Sparkles className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h3 className="text-lg font-semibold">AI 复盘评价</h3>
              <p className="text-sm text-muted-foreground">{review.date} 复盘分析</p>
            </div>
          </div>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* 内容区 */}
        <div className="flex-1 overflow-y-auto p-4">
          {!analysis && !loading && !error && (
            <div className="text-center py-12">
              <Sparkles className="h-16 w-16 mx-auto mb-4 text-primary/30" />
              <p className="text-muted-foreground mb-6">
                点击下方按钮，AI 将为您分析今日的复盘数据
                <br />提供市场分析、持仓评估、操作复盘和投资建议
              </p>
              <Button onClick={handleAnalyze} disabled={!aiConfig.isConfigured}>
                <Sparkles className="h-4 w-4 mr-2" />
                生成AI评价
              </Button>
              {!aiConfig.isConfigured && (
                <p className="text-xs text-muted-foreground mt-2">
                  请先在设置中配置AI服务
                </p>
              )}
            </div>
          )}

          {loading && (
            <div className="flex flex-col items-center justify-center py-12">
              <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
              <p className="text-muted-foreground">正在分析复盘数据...</p>
              <p className="text-xs text-muted-foreground mt-1">这可能需要几秒钟</p>
            </div>
          )}

          {error && (
            <div className="text-center py-12">
              <p className="text-destructive mb-4">{error}</p>
              <Button variant="outline" onClick={handleAnalyze}>
                重试
              </Button>
            </div>
          )}

          {analysis && (
            <DailyReviewAnalysisCard analysis={analysis} />
          )}
        </div>

        {/* 底部按钮 */}
        {analysis && (
          <div className="p-4 border-t flex justify-end gap-2 shrink-0">
            <Button variant="outline" onClick={onClose}>
              关闭
            </Button>
            <Button onClick={handleAnalyze}>
              重新生成
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}
