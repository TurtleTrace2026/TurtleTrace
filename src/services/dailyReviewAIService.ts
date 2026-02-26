import type { DailyReview } from '../types/review'

// 复盘分析响应类型定义
export interface DailyReviewAnalysis {
  marketAnalysis?: {
    trend?: 'BULLISH' | 'BEARISH' | 'NEUTRAL'
    summary?: string
    keyPoints?: string[]
    volumeAnalysis?: string
  }
  positionAnalysis?: {
    overallAssessment?: string
    winners?: Array<{
      name: string
      change: string
    }>
    losers?: Array<{
      name: string
      change: string
    }>
    riskAlerts?: string[]
    diversificationScore?: number
  }
  operationReview?: {
    overallRating?: number
    goodMoves?: string[]
    improvements?: string[]
    emotionalCheck?: {
      score?: number
      analysis?: string
    }
  }
  conclusion?: {
    dayRating?: number
    overallRating?: number
    summary?: string
    tomorrowSuggestions?: Array<{
      name: string
      reason: string
    }>
  }
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
 * 调用AI服务分析每日复盘
 * @param review 每日复盘数据
 * @param endpoint API端点地址
 * @param apiKey API密钥
 * @returns 分析结果
 */
export async function analyzeDailyReview(
  review: DailyReview,
  endpoint: string,
  apiKey: string
): Promise<DailyReviewAnalysis> {
  if (!endpoint || !apiKey) {
    throw new Error('请先在设置中配置AI服务')
  }

  try {
    // 拼接完整URL：endpoint + /api/v1/ai/review/evaluate-daily
    const url = endpoint.endsWith('/')
      ? `${endpoint}api/v1/ai/review/evaluate-daily`
      : `${endpoint}/api/v1/ai/review/evaluate-daily`

    console.log('请求URL:', url)

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
      },
      body: JSON.stringify(review),
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

    const result = await response.json()
    console.log('API响应:', result)

    // 处理不同的响应格式
    // 格式1: { code: 200, message: '', data: {...} }
    // 格式2: { success: true, data: {...} }
    // 格式3: 直接返回分析结果 {...}

    let analysisData: DailyReviewAnalysis

    if (result.code !== undefined) {
      // 格式1
      if (result.code !== 200) {
        throw new Error(result.message || '分析失败')
      }
      analysisData = result.data
    } else if (result.success !== undefined) {
      // 格式2
      if (!result.success) {
        throw new Error(result.message || '分析失败')
      }
      analysisData = result.data
    } else if (result.marketAnalysis || result.positionAnalysis || result.operationReview || result.conclusion) {
      // 格式3: 直接返回分析结果
      analysisData = result
    } else {
      console.error('未知的响应格式:', result)
      throw new Error('返回数据格式错误')
    }

    console.log('解析后的分析数据:', analysisData)
    return analysisData
  } catch (error) {
    if (error instanceof TypeError && error.message === 'Failed to fetch') {
      throw new Error('网络连接失败，请检查对接地址')
    }
    throw error
  }
}
