import { useState, useEffect } from 'react'

interface AiConfig {
  endpoint: string
  apiKey: string
  isConfigured: boolean
}

/**
 * AI配置Hook
 * 从localStorage读取AI配置，统一管理配置状态
 */
export function useAiConfig(): AiConfig {
  const [config, setConfig] = useState<AiConfig>({
    endpoint: '',
    apiKey: '',
    isConfigured: false,
  })

  useEffect(() => {
    const endpoint = localStorage.getItem('ai-endpoint') || ''
    const apiKey = localStorage.getItem('ai-api-key') || ''
    setConfig({
      endpoint,
      apiKey,
      isConfigured: !!(endpoint && apiKey),
    })
  }, [])

  return config
}
