// AI服务类型定义

export type Direction = 'POSITIVE' | 'NEGATIVE' | 'NEUTRAL'
export type Level = 'HIGH' | 'MEDIUM' | 'LOW'
export type Sentiment = 'BULLISH' | 'BEARISH' | 'NEUTRAL'
export type TimeHorizon = 'SHORT_TERM' | 'MEDIUM_TERM' | 'LONG_TERM'
export type ExpectationGap = 'SUPERIOR' | 'IN_LINE' | 'INFERIOR'

export interface ImpactAnalysis {
  direction: Direction
  level: Level
  reasoning: string
}

export interface KeyFact {
  fact: string
  detail?: string
  value?: string
}

export interface NewsAnalysis {
  sentiment?: string
  summary: string
  entities: string[]
  event_type: string
  key_facts: KeyFact[]
  analysis: {
    fundamental_impact: ImpactAnalysis
    sentiment_impact: ImpactAnalysis
    expectation_gap: ExpectationGap
    expectation_reasoning: string
  }
  conclusion: {
    overall_sentiment: Sentiment
    overall_impact_level: Level
    time_horizon: TimeHorizon
    strategy_suggestion: string
    risk_factors: string[]
  }
}

export interface AnalyzeNewsResponse {
  success: boolean
  data: {
    analyses: NewsAnalysis[]
  }
}

export interface AiServiceError {
  code: string
  message: string
}

// 错误码映射
const ERROR_MESSAGES: Record<string, string> = {
  INVALID_API_KEY: 'API Key格式无效，请检查配置',
  API_KEY_INACTIVE: 'API Key已停用',
  API_KEY_EXPIRED: 'API Key已过期',
  FEATURE_NOT_AVAILABLE: '该功能需要升级会员',
  QUOTA_EXCEEDED: '本月配额已用完',
  DAILY_QUOTA_EXCEEDED: '今日请求次数已达上限',
}

/**
 * 分析新闻
 * @param news 新闻数组
 * @param endpoint AI服务地址
 * @param apiKey API密钥
 */
export async function analyzeNews(
  news: Array<{ title: string; content: string }>,
  endpoint: string,
  apiKey: string
): Promise<NewsAnalysis> {
  if (!endpoint || !apiKey) {
    throw new Error('请先在设置中配置AI服务')
  }

  try {
    // 拼接完整URL：endpoint + /api/v1/ai/news/analyze
    const url = endpoint.endsWith('/')
      ? `${endpoint}api/v1/ai/news/analyze`
      : `${endpoint}/api/v1/ai/news/analyze`

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
      },
      body: JSON.stringify({ news }),
    })

    if (!response.ok) {
      // 尝试解析错误信息
      let errorCode = 'UNKNOWN_ERROR'
      try {
        const errorData = await response.json()
        errorCode = errorData.code || errorData.error?.code || errorCode
      } catch {
        // 无法解析错误响应
      }

      // 根据HTTP状态码推断错误
      if (response.status === 401) {
        throw new Error(ERROR_MESSAGES[errorCode] || 'API Key验证失败')
      } else if (response.status === 403) {
        throw new Error(ERROR_MESSAGES[errorCode] || '无权限访问该功能')
      } else if (response.status === 429) {
        throw new Error(ERROR_MESSAGES[errorCode] || '请求过于频繁，请稍后重试')
      }

      throw new Error(ERROR_MESSAGES[errorCode] || `请求失败: ${response.status}`)
    }

    const result: AnalyzeNewsResponse = await response.json()

    if (!result.success || !result.data?.analyses?.[0]) {
      throw new Error('返回数据格式错误')
    }

    let analysisResult = result.data.analyses[0]

    // 处理 summary 是 JSON 字符串的情况（AI返回格式不一致）
    if (typeof analysisResult.summary === 'string' && analysisResult.summary.startsWith('{')) {
      console.log('检测到 summary 是 JSON 字符串，尝试解析...')
      try {
        const parsed = JSON.parse(analysisResult.summary)
        // 使用解析后的完整对象
        analysisResult = {
          summary: parsed.summary || analysisResult.summary,
          entities: parsed.entities || [],
          event_type: parsed.event_type || '',
          key_facts: parsed.key_facts || [],
          analysis: parsed.analysis || {},
          conclusion: parsed.conclusion || {},
        }
        console.log('解析成功:', analysisResult)
      } catch (e) {
        console.error('解析 summary JSON 失败:', e)
        // 解析失败，保持原样
      }
    }

    return analysisResult
  } catch (error) {
    if (error instanceof TypeError && error.message === 'Failed to fetch') {
      throw new Error('网络连接失败，请检查对接地址')
    }
    throw error
  }
}

/**
 * 获取AI配置
 */
export function getAiConfig(): { endpoint: string; apiKey: string } {
  return {
    endpoint: localStorage.getItem('ai-endpoint') || '',
    apiKey: localStorage.getItem('ai-api-key') || '',
  }
}
