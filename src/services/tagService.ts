import type { EmotionTag, ReasonTag } from '../types'

const EMOTION_TAGS_KEY = 'stock-emotion-tags'
const REASON_TAGS_KEY = 'stock-reason-tags'

// 默认情绪标签
const DEFAULT_EMOTION_TAGS: EmotionTag[] = [
  { id: '1', name: '冲动追高', color: 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300' },
  { id: '2', name: '恐慌割肉', color: 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300' },
  { id: '3', name: '理性建仓', color: 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300' },
  { id: '4', name: '波段操作', color: 'bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300' },
  { id: '5', name: '价值投资', color: 'bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-300' },
  { id: '6', name: '止损离场', color: 'bg-orange-100 text-orange-700 dark:bg-orange-900 dark:text-orange-300' },
  { id: '7', name: '止盈落袋', color: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900 dark:text-emerald-300' },
  { id: '8', name: '抄底博反弹', color: 'bg-cyan-100 text-cyan-700 dark:bg-cyan-900 dark:text-cyan-300' },
]

// 默认交易原因标签
const DEFAULT_REASON_TAGS: ReasonTag[] = [
  { id: '1', name: '财报利好', color: 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300' },
  { id: '2', name: '政策利好', color: 'bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300' },
  { id: '3', name: '技术突破', color: 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300' },
  { id: '4', name: '板块轮动', color: 'bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-300' },
  { id: '5', name: '分红除权', color: 'bg-cyan-100 text-cyan-700 dark:bg-cyan-900 dark:text-cyan-300' },
  { id: '6', name: '止损', color: 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300' },
  { id: '7', name: '止盈', color: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900 dark:text-emerald-300' },
  { id: '8', name: '资金需求', color: 'bg-orange-100 text-orange-700 dark:bg-orange-900 dark:text-orange-300' },
  { id: '9', name: '市场恐慌', color: 'bg-slate-100 text-slate-700 dark:bg-slate-900 dark:text-slate-300' },
  { id: '10', name: '市场过热', color: 'bg-rose-100 text-rose-700 dark:bg-rose-900 dark:text-rose-300' },
]

// 获取可用的颜色样式
const COLOR_OPTIONS = [
  'bg-gray-100 text-gray-700 dark:bg-gray-900 dark:text-gray-300',
  'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300',
  'bg-orange-100 text-orange-700 dark:bg-orange-900 dark:text-orange-300',
  'bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-300',
  'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300',
  'bg-emerald-100 text-emerald-700 dark:bg-emerald-900 dark:text-emerald-300',
  'bg-teal-100 text-teal-700 dark:bg-teal-900 dark:text-teal-300',
  'bg-cyan-100 text-cyan-700 dark:bg-cyan-900 dark:text-cyan-300',
  'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300',
  'bg-indigo-100 text-indigo-700 dark:bg-indigo-900 dark:text-indigo-300',
  'bg-violet-100 text-violet-700 dark:bg-violet-900 dark:text-violet-300',
  'bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300',
  'bg-pink-100 text-pink-700 dark:bg-pink-900 dark:text-pink-300',
  'bg-rose-100 text-rose-700 dark:bg-rose-900 dark:text-rose-300',
  'bg-slate-100 text-slate-700 dark:bg-slate-900 dark:text-slate-300',
]

// 获取情绪标签
export function getEmotionTags(): EmotionTag[] {
  const saved = localStorage.getItem(EMOTION_TAGS_KEY)
  if (saved) {
    try {
      return JSON.parse(saved)
    } catch (e) {
      console.error('Failed to load emotion tags:', e)
    }
  }
  return DEFAULT_EMOTION_TAGS
}

// 保存情绪标签
export function saveEmotionTags(tags: EmotionTag[]): void {
  localStorage.setItem(EMOTION_TAGS_KEY, JSON.stringify(tags))
}

// 添加情绪标签
export function addEmotionTag(name: string): EmotionTag {
  const tags = getEmotionTags()
  const newTag: EmotionTag = {
    id: Date.now().toString(),
    name,
    color: COLOR_OPTIONS[tags.length % COLOR_OPTIONS.length],
  }
  saveEmotionTags([...tags, newTag])
  return newTag
}

// 删除情绪标签
export function deleteEmotionTag(id: string): void {
  const tags = getEmotionTags().filter(t => t.id !== id)
  saveEmotionTags(tags)
}

// 获取交易原因标签
export function getReasonTags(): ReasonTag[] {
  const saved = localStorage.getItem(REASON_TAGS_KEY)
  if (saved) {
    try {
      return JSON.parse(saved)
    } catch (e) {
      console.error('Failed to load reason tags:', e)
    }
  }
  return DEFAULT_REASON_TAGS
}

// 保存交易原因标签
export function saveReasonTags(tags: ReasonTag[]): void {
  localStorage.setItem(REASON_TAGS_KEY, JSON.stringify(tags))
}

// 添加交易原因标签
export function addReasonTag(name: string): ReasonTag {
  const tags = getReasonTags()
  const newTag: ReasonTag = {
    id: Date.now().toString(),
    name,
    color: COLOR_OPTIONS[tags.length % COLOR_OPTIONS.length],
  }
  saveReasonTags([...tags, newTag])
  return newTag
}

// 删除交易原因标签
export function deleteReasonTag(id: string): void {
  const tags = getReasonTags().filter(t => t.id !== id)
  saveReasonTags(tags)
}

// 获取所有颜色选项
export function getColorOptions(): string[] {
  return COLOR_OPTIONS
}
