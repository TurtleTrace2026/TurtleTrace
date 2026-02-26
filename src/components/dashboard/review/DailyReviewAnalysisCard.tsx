import { Badge } from '../../ui/badge'
import {
  TrendingUp,
  TrendingDown,
  Minus,
  AlertTriangle,
  Lightbulb,
  Target,
  Star,
  Eye,
  ChevronDown,
  ChevronUp,
  BarChart3
} from 'lucide-react'
import type { DailyReviewAnalysis } from '../../../services/dailyReviewAIService'
import { useState } from 'react'

interface DailyReviewAnalysisCardProps {
  analysis: DailyReviewAnalysis
}

// 趋势配置
const trendConfig = {
  BULLISH: { label: '看涨', color: 'text-up', icon: TrendingUp, bg: 'bg-up/10' },
  BEARISH: { label: '看跌', color: 'text-down', icon: TrendingDown, bg: 'bg-down/10' },
  NEUTRAL: { label: '震荡', color: 'text-muted-foreground', icon: Minus, bg: 'bg-muted' },
}

// 评分颜色
const getScoreColor = (score: number) => {
  if (score >= 8) return 'text-up'
  if (score >= 5) return 'text-yellow-500'
  return 'text-down'
}

export function DailyReviewAnalysisCard({ analysis }: DailyReviewAnalysisCardProps) {
  const [expandedSections, setExpandedSections] = useState({
    market: true,
    position: true,
    operation: true,
    conclusion: true,
  })

  const toggleSection = (section: keyof typeof expandedSections) => {
    setExpandedSections(prev => ({ ...prev, [section]: !prev[section] }))
  }

  const marketTrend = trendConfig[analysis.marketAnalysis?.trend || 'NEUTRAL']
  const TrendIcon = marketTrend.icon

  return (
    <div className="mt-4 p-4 bg-gradient-to-br from-primary/5 to-primary/10 rounded-xl border border-primary/20 space-y-4">
      {/* 标题 */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="p-2 bg-primary/20 rounded-lg">
            <Star className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h3 className="font-bold text-primary">AI 复盘评价</h3>
            <p className="text-xs text-muted-foreground">智能分析报告</p>
          </div>
        </div>
        <Badge variant="default" className="gap-1">
          <Star className="h-3 w-3" />
          {analysis.conclusion?.dayRating || '-'}/10
        </Badge>
      </div>

      {/* 1. 市场分析 */}
      <div className="space-y-2">
        <button
          onClick={() => toggleSection('market')}
          className="flex items-center gap-2 text-sm font-semibold w-full text-left"
        >
          <BarChart3 className="h-4 w-4 text-primary" />
          <span>市场分析</span>
          {expandedSections.market ? <ChevronUp className="h-4 w-4 ml-auto" /> : <ChevronDown className="h-4 w-4 ml-auto" />}
        </button>
        {expandedSections.market && (
          <div className="p-3 bg-blue-50/10 rounded-lg border border-blue-100">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-sm font-medium">趋势判断:</span>
              <Badge className={`${marketTrend.bg} ${marketTrend.color}`}>
                <TrendIcon className="h-3 w-3" />
                {marketTrend.label}
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground mb-3">
              {analysis.marketAnalysis?.summary}
            </p>
            {analysis.marketAnalysis?.keyPoints && analysis.marketAnalysis.keyPoints.length > 0 && (
              <div className="mt-2">
                <h5 className="text-sm font-medium">关键点:</h5>
                <ul className="space-y-1">
                  {analysis.marketAnalysis.keyPoints.map((point, index) => (
                    <li key={index} className="flex items-start gap-2 text-sm">
                      <span className="text-primary font-medium">•</span>
                      {point}
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {analysis.marketAnalysis?.volumeAnalysis && (
              <div className="mt-2 p-2 bg-surface/50 rounded border text-sm">
                <span className="font-medium">成交量:</span>{' '}
                {analysis.marketAnalysis.volumeAnalysis}
              </div>
            )}
          </div>
        )}
      </div>

      {/* 2. 持仓分析 */}
      {analysis.positionAnalysis && (
        <div className="space-y-2">
          <button
            onClick={() => toggleSection('position')}
            className="flex items-center gap-2 text-sm font-semibold w-full text-left"
          >
            <Target className="h-4 w-4 text-primary" />
            <span>持仓分析</span>
            {expandedSections.position ? <ChevronUp className="h-4 w-4 ml-auto" /> : <ChevronDown className="h-4 w-4 ml-auto" />}
          </button>
          {expandedSections.position && (
            <div className="p-3 bg-purple-50/10 rounded-lg border border-purple-100">
              <p className="text-sm text-muted-foreground mb-3">
                {analysis.positionAnalysis.overallAssessment}
              </p>

              {/* 表现较好 */}
              {analysis.positionAnalysis.winners && analysis.positionAnalysis.winners.length > 0 && (
                <div className="mt-3">
                  <h5 className="text-sm font-medium text-green-600 flex items-center gap-1">
                    <TrendingUp className="h-3 w-3" />
                    表现较好
                  </h5>
                  <div className="space-y-1 mt-2">
                    {analysis.positionAnalysis.winners.map((item, index) => (
                      <div key={index} className="flex items-center justify-between p-2 rounded bg-green-50/30 border border-green-100">
                        <span className="font-medium text-sm">{item.name}</span>
                        <Badge variant="outline" className="text-green-600">{item.change}</Badge>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* 表现欠佳 */}
              {analysis.positionAnalysis.losers && analysis.positionAnalysis.losers.length > 0 && (
                <div className="mt-3">
                  <h5 className="text-sm font-medium text-red-600 flex items-center gap-1">
                    <TrendingDown className="h-3 w-3" />
                    表现欠佳
                  </h5>
                  <div className="space-y-1 mt-2">
                    {analysis.positionAnalysis.losers.map((item, index) => (
                      <div key={index} className="flex items-center justify-between p-2 rounded bg-red-50/30 border border-red-100">
                        <span className="font-medium text-sm">{item.name}</span>
                        <Badge variant="outline" className="text-red-600">{item.change}</Badge>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* 风险预警 */}
              {analysis.positionAnalysis.riskAlerts && analysis.positionAnalysis.riskAlerts.length > 0 && (
                <div className="mt-3">
                  <h5 className="text-sm font-medium text-amber-600 flex items-center gap-1">
                    <AlertTriangle className="h-3 w-3" />
                    风险预警
                  </h5>
                  <ul className="space-y-1 mt-2">
                    {analysis.positionAnalysis.riskAlerts.map((alert, index) => (
                      <li key={index} className="text-sm text-amber-600 flex items-start gap-2">
                        <span className="font-medium">•</span>
                        {alert}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* 分散化评分 */}
              {analysis.positionAnalysis.diversificationScore !== undefined && (
                <div className="mt-3 flex items-center gap-2 p-2 bg-surface/50 rounded border">
                  <span className="text-sm font-medium">分散化评分:</span>
                  <span className={`text-lg font-bold ${getScoreColor(analysis.positionAnalysis.diversificationScore)}`}>
                    {analysis.positionAnalysis.diversificationScore}
                  </span>
                  <span className="text-xs text-muted-foreground">/10</span>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* 3. 操作复盘 */}
      {analysis.operationReview && (
        <div className="space-y-2">
          <button
            onClick={() => toggleSection('operation')}
            className="flex items-center gap-2 text-sm font-semibold w-full text-left"
          >
            <Lightbulb className="h-4 w-4 text-primary" />
            <span>操作复盘</span>
            {expandedSections.operation ? <ChevronUp className="h-4 w-4 ml-auto" /> : <ChevronDown className="h-4 w-4 ml-auto" />}
          </button>
          {expandedSections.operation && (
            <div className="p-3 bg-orange-50/10 rounded-lg border border-orange-100">
              {/* 操作评分 */}
              {analysis.operationReview.overallRating !== undefined && (
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-sm font-medium">操作评分:</span>
                  <span className={`text-xl font-bold ${getScoreColor(analysis.operationReview.overallRating)}`}>
                    {analysis.operationReview.overallRating}
                  </span>
                  <span className="text-xs text-muted-foreground">/10</span>
                </div>
              )}

              {/* 做得好的 */}
              {analysis.operationReview.goodMoves && analysis.operationReview.goodMoves.length > 0 && (
                <div className="mt-2">
                  <h5 className="text-sm font-medium text-green-600">✓ 做得好的地方</h5>
                  <ul className="space-y-1 mt-1">
                    {analysis.operationReview.goodMoves.map((item, index) => (
                      <li key={index} className="text-sm flex items-start gap-2">
                        <span className="text-green-500">•</span>
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* 需要改进 */}
              {analysis.operationReview.improvements && analysis.operationReview.improvements.length > 0 && (
                <div className="mt-2">
                  <h5 className="text-sm font-medium text-amber-600">⚠ 需要改进</h5>
                  <ul className="space-y-1 mt-1">
                    {analysis.operationReview.improvements.map((item, index) => (
                      <li key={index} className="text-sm flex items-start gap-2">
                        <span className="text-amber-500">•</span>
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* 情绪管理 */}
              {analysis.operationReview.emotionalCheck && (
                <div className="mt-3 p-2 bg-yellow-50/10 rounded border">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-sm font-medium">情绪管理:</span>
                    {analysis.operationReview.emotionalCheck.score !== undefined && (
                      <>
                        <span className={`text-lg font-bold ${getScoreColor(analysis.operationReview.emotionalCheck.score)}`}>
                          {analysis.operationReview.emotionalCheck.score}
                        </span>
                        <span className="text-xs text-muted-foreground">/10</span>
                      </>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {analysis.operationReview.emotionalCheck.analysis}
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* 4. 结论与建议 */}
      {analysis.conclusion && (
        <div className="space-y-2">
          <button
            onClick={() => toggleSection('conclusion')}
            className="flex items-center gap-2 text-sm font-semibold w-full text-left"
          >
            <Star className="h-4 w-4 text-primary" />
            <span>结论与建议</span>
            {expandedSections.conclusion ? <ChevronUp className="h-4 w-4 ml-auto" /> : <ChevronDown className="h-4 w-4 ml-auto" />}
          </button>
          {expandedSections.conclusion && (
            <div className="p-3 bg-emerald-50/10 rounded-lg border border-emerald-100">
              {/* 今日评分 */}
              {analysis.conclusion.dayRating !== undefined && (
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-sm font-medium">今日评分:</span>
                  <span className={`text-xl font-bold ${getScoreColor(analysis.conclusion.dayRating)}`}>
                    {analysis.conclusion.dayRating}
                  </span>
                  <span className="text-xs text-muted-foreground">/10</span>
                </div>
              )}

              {/* 总体评分 */}
              {analysis.conclusion.overallRating !== undefined && (
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-sm font-medium">总体评分:</span>
                  <span className={`text-lg font-bold ${getScoreColor(analysis.conclusion.overallRating)}`}>
                    {analysis.conclusion.overallRating}
                  </span>
                  <span className="text-xs text-muted-foreground">/10</span>
                </div>
              )}

              {/* 总结 */}
              {analysis.conclusion.summary && (
                <p className="text-sm text-muted-foreground mb-2">
                  {analysis.conclusion.summary}
                </p>
              )}

              {/* 明日建议 */}
              {analysis.conclusion.tomorrowSuggestions && analysis.conclusion.tomorrowSuggestions.length > 0 && (
                <div className="mt-3">
                  <h5 className="text-sm font-medium flex items-center gap-1">
                    <Eye className="h-3 w-3 text-primary" />
                    明日建议
                  </h5>
                  <ul className="space-y-1">
                    {analysis.conclusion.tomorrowSuggestions.map((item, index) => (
                      <li key={index} className="text-sm flex items-start gap-2">
                        <span className="font-medium">{item.name}</span>
                        <span className="text-xs text-muted-foreground">{item.reason}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
