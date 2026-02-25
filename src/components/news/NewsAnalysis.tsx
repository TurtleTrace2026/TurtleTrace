import { Badge } from '../ui/badge'
import {
  TrendingUp,
  TrendingDown,
  Minus,
  AlertTriangle,
  Lightbulb,
  Target,
  Building2,
  Clock,
  ChevronDown,
  ChevronUp,
  Info
} from 'lucide-react'
import type { NewsAnalysis, Direction, Sentiment, Level, TimeHorizon, ExpectationGap } from '../../services/aiService'
import { useState } from 'react'

interface NewsAnalysisProps {
  analysis: NewsAnalysis
  onClose?: () => void
}

// 默认配置（用于空值兜底）
const defaultDirectionConfig = { label: '中性', color: 'text-muted-foreground bg-muted', icon: Minus }
const defaultSentimentConfig = { label: '中性', color: 'text-muted-foreground', icon: Minus }
const defaultLevelConfig = { label: '未知', color: 'bg-muted text-muted-foreground' }
const defaultTimeHorizonConfig = { label: '未知' }
const defaultExpectationConfig = { label: '未知', color: 'text-muted-foreground' }

// 方向样式映射
const directionConfig: Record<Direction, { label: string; color: string; icon: typeof TrendingUp }> = {
  POSITIVE: { label: '利好', color: 'text-up bg-up/10', icon: TrendingUp },
  NEGATIVE: { label: '利空', color: 'text-down bg-down/10', icon: TrendingDown },
  NEUTRAL: { label: '中性', color: 'text-muted-foreground bg-muted', icon: Minus },
}

// 综合情感样式映射
const sentimentConfig: Record<Sentiment, { label: string; color: string; icon: typeof TrendingUp }> = {
  BULLISH: { label: '看涨', color: 'text-up', icon: TrendingUp },
  BEARISH: { label: '看跌', color: 'text-down', icon: TrendingDown },
  NEUTRAL: { label: '中性', color: 'text-muted-foreground', icon: Minus },
}

// 影响程度样式映射
const levelConfig: Record<Level, { label: string; color: string }> = {
  HIGH: { label: '高', color: 'bg-up/20 text-up' },
  MEDIUM: { label: '中', color: 'bg-yellow-500/20 text-yellow-600' },
  LOW: { label: '低', color: 'bg-muted text-muted-foreground' },
}

// 时间周期映射
const timeHorizonConfig: Record<TimeHorizon, { label: string }> = {
  SHORT_TERM: { label: '短期' },
  MEDIUM_TERM: { label: '中期' },
  LONG_TERM: { label: '长期' },
}

// 预期差映射
const expectationGapConfig: Record<ExpectationGap, { label: string; color: string }> = {
  SUPERIOR: { label: '超预期', color: 'text-up' },
  IN_LINE: { label: '符合预期', color: 'text-muted-foreground' },
  INFERIOR: { label: '不及预期', color: 'text-down' },
}

// 安全获取配置的辅助函数
function getDirectionConfig(direction?: Direction) {
  return direction ? (directionConfig[direction] ?? defaultDirectionConfig) : defaultDirectionConfig
}

function getSentimentConfig(sentiment?: Sentiment) {
  return sentiment ? (sentimentConfig[sentiment] ?? defaultSentimentConfig) : defaultSentimentConfig
}

function getLevelConfig(level?: Level) {
  return level ? (levelConfig[level] ?? defaultLevelConfig) : defaultLevelConfig
}

function getTimeHorizonConfig(timeHorizon?: TimeHorizon) {
  return timeHorizon ? (timeHorizonConfig[timeHorizon] ?? defaultTimeHorizonConfig) : defaultTimeHorizonConfig
}

function getExpectationConfig(expectation?: ExpectationGap) {
  return expectation ? (expectationGapConfig[expectation] ?? defaultExpectationConfig) : defaultExpectationConfig
}

export function NewsAnalysisComponent({ analysis }: NewsAnalysisProps) {
  const [showKeyFacts, setShowKeyFacts] = useState(true)

  // 数据现在是扁平结构
  const analysisData = analysis?.analysis
  const conclusionData = analysis?.conclusion

  // 获取配置（带空值保护）
  const fundamentalImpact = analysisData?.fundamental_impact
  const sentimentImpact = analysisData?.sentiment_impact

  const fundamentalDir = getDirectionConfig(fundamentalImpact?.direction)
  const sentimentDir = getDirectionConfig(sentimentImpact?.direction)
  const fundamentalLevel = getLevelConfig(fundamentalImpact?.level)
  const sentimentLevel = getLevelConfig(sentimentImpact?.level)

  const overallSentiment = getSentimentConfig(conclusionData?.overall_sentiment)
  const impactLevel = getLevelConfig(conclusionData?.overall_impact_level)
  const timeHorizon = getTimeHorizonConfig(conclusionData?.time_horizon)
  const expectation = getExpectationConfig(analysisData?.expectation_gap)

  const FundamentalIcon = fundamentalDir.icon
  const SentimentIcon = sentimentDir.icon
  const OverallIcon = overallSentiment.icon

  return (
    <div className="mt-4 p-4 bg-surface/50 rounded-xl border space-y-4">
      {/* 核心摘要 */}
      <div className="space-y-2">
        <div className="flex items-center gap-2 text-sm font-medium">
          <Info className="h-4 w-4 text-primary" />
          <span>核心摘要</span>
        </div>
        <p className="text-sm text-foreground/90 leading-relaxed pl-6">
          {analysis?.summary || '暂无摘要'}
        </p>
      </div>

      {/* 涉及标的/行业 */}
      {analysis?.entities && analysis.entities.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-sm font-medium">
            <Building2 className="h-4 w-4 text-primary" />
            <span>涉及标的/行业</span>
          </div>
          <div className="flex flex-wrap gap-2 pl-6">
            {analysis.entities.map((entity, index) => (
              <Badge key={index} variant="outline" className="text-xs">
                {entity}
              </Badge>
            ))}
          </div>
        </div>
      )}

      {/* 事件类型 */}
      {analysis?.event_type && (
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-sm font-medium">
            <Target className="h-4 w-4 text-primary" />
            <span>事件类型</span>
          </div>
          <div className="pl-6">
            <Badge variant="secondary" className="text-xs">
              {analysis.event_type}
            </Badge>
          </div>
        </div>
      )}

      {/* 影响分析 */}
      <div className="space-y-2">
        <div className="flex items-center gap-2 text-sm font-medium">
          <Target className="h-4 w-4 text-primary" />
          <span>影响分析</span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pl-6">
          {/* 基本面影响 */}
          <div className="p-3 rounded-lg bg-background/50 border">
            <div className="flex items-center gap-2 mb-2">
              <FundamentalIcon className={`h-4 w-4 ${fundamentalDir.color.split(' ')[0]}`} />
              <span className="text-sm font-medium">基本面影响</span>
            </div>
            <div className="flex items-center gap-2 mb-2">
              <Badge className={`${fundamentalDir.color} text-xs`}>
                {fundamentalDir.label}
              </Badge>
              <Badge className={`${fundamentalLevel.color} text-xs`}>
                程度: {fundamentalLevel.label}
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed">
              {fundamentalImpact?.reasoning || '暂无分析'}
            </p>
          </div>

          {/* 情绪影响 */}
          <div className="p-3 rounded-lg bg-background/50 border">
            <div className="flex items-center gap-2 mb-2">
              <SentimentIcon className={`h-4 w-4 ${sentimentDir.color.split(' ')[0]}`} />
              <span className="text-sm font-medium">情绪影响</span>
            </div>
            <div className="flex items-center gap-2 mb-2">
              <Badge className={`${sentimentDir.color} text-xs`}>
                {sentimentDir.label}
              </Badge>
              <Badge className={`${sentimentLevel.color} text-xs`}>
                程度: {sentimentLevel.label}
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed">
              {sentimentImpact?.reasoning || '暂无分析'}
            </p>
          </div>
        </div>

        {/* 预期差 */}
        <div className="pl-6 mt-3">
          <div className="p-3 rounded-lg bg-background/50 border">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-sm font-medium">预期差:</span>
              <span className={`text-sm font-medium ${expectation.color}`}>
                {expectation.label}
              </span>
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed">
              {analysisData?.expectation_reasoning || '暂无分析'}
            </p>
          </div>
        </div>
      </div>

      {/* 结论与建议 */}
      <div className="space-y-2">
        <div className="flex items-center gap-2 text-sm font-medium">
          <Lightbulb className="h-4 w-4 text-primary" />
          <span>结论与建议</span>
        </div>
        <div className="pl-6 space-y-3">
          {/* 综合判断 */}
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-sm text-muted-foreground">综合判断:</span>
            <div className={`flex items-center gap-1 ${overallSentiment.color}`}>
              <OverallIcon className="h-4 w-4" />
              <span className="text-sm font-medium">{overallSentiment.label}</span>
            </div>
            <span className="text-muted-foreground">|</span>
            <span className="text-sm text-muted-foreground">影响程度:</span>
            <Badge className={`${impactLevel.color} text-xs`}>
              {impactLevel.label}
            </Badge>
            <span className="text-muted-foreground">|</span>
            <div className="flex items-center gap-1 text-sm text-muted-foreground">
              <Clock className="h-3 w-3" />
              <span>{timeHorizon.label}</span>
            </div>
          </div>

          {/* 操作建议 */}
          {conclusionData?.strategy_suggestion && (
            <div className="p-3 rounded-lg bg-primary/5 border border-primary/20">
              <p className="text-sm leading-relaxed">
                <span className="font-medium text-primary">操作建议: </span>
                {conclusionData.strategy_suggestion}
              </p>
            </div>
          )}

          {/* 风险因素 */}
          {conclusionData?.risk_factors && conclusionData.risk_factors.length > 0 && (
            <div className="p-3 rounded-lg bg-down/5 border border-down/20">
              <div className="flex items-center gap-2 mb-2">
                <AlertTriangle className="h-4 w-4 text-down" />
                <span className="text-sm font-medium text-down">风险因素</span>
              </div>
              <ul className="space-y-1">
                {conclusionData.risk_factors.map((risk, index) => (
                  <li key={index} className="text-xs text-muted-foreground flex items-start gap-2">
                    <span className="text-down mt-0.5">•</span>
                    {risk}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>

      {/* 关键事实 */}
      {analysis?.key_facts && analysis.key_facts.length > 0 && (
        <div className="space-y-2">
          <button
            onClick={() => setShowKeyFacts(!showKeyFacts)}
            className="flex items-center gap-2 text-sm font-medium hover:text-primary transition-colors"
          >
            <Info className="h-4 w-4 text-primary" />
            <span>关键事实</span>
            {showKeyFacts ? (
              <ChevronUp className="h-4 w-4 text-muted-foreground" />
            ) : (
              <ChevronDown className="h-4 w-4 text-muted-foreground" />
            )}
          </button>
          {showKeyFacts && (
            <div className="pl-6 space-y-2">
              {analysis.key_facts.map((fact, index) => (
                <div key={index} className="flex items-start gap-2 text-sm">
                  <span className="text-primary font-medium shrink-0">•</span>
                  <span className="font-medium">{fact.fact}</span>
                  {(fact.detail || fact.value) && (
                    <span className="text-muted-foreground">- {fact.detail || fact.value}</span>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
