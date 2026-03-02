const WELCOME_COMPLETED_KEY = 'welcome-completed'

/**
 * 检查是否已完成欢迎向导
 */
export function isWelcomeCompleted(): boolean {
  return localStorage.getItem(WELCOME_COMPLETED_KEY) === 'true'
}

/**
 * 标记欢迎向导已完成
 */
export function markWelcomeCompleted(): void {
  localStorage.setItem(WELCOME_COMPLETED_KEY, 'true')
}

/**
 * 重置欢迎向导状态（用于测试或设置中重新触发）
 */
export function resetWelcomeStatus(): void {
  localStorage.removeItem(WELCOME_COMPLETED_KEY)
}
