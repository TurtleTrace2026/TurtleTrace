// src/data/presetEventTags.ts

import type { EventTag } from '../types/event';

export const PRESET_EVENT_TAGS: EventTag[] = [
  // 影响方向
  { id: 'impact-positive', name: '利好', category: '影响方向', color: 'text-green-500', isPreset: true },
  { id: 'impact-negative', name: '利空', category: '影响方向', color: 'text-red-500', isPreset: true },
  { id: 'impact-neutral', name: '中性', category: '影响方向', color: 'text-gray-500', isPreset: true },
  { id: 'impact-uncertain', name: '不确定', category: '影响方向', color: 'text-orange-500', isPreset: true },

  // 影响范围
  { id: 'scope-stock', name: '个股', category: '影响范围', color: 'text-blue-500', isPreset: true },
  { id: 'scope-sector', name: '板块', category: '影响范围', color: 'text-purple-500', isPreset: true },
  { id: 'scope-market', name: '大盘', category: '影响范围', color: 'text-indigo-500', isPreset: true },
  { id: 'scope-global', name: '全球', category: '影响范围', color: 'text-amber-500', isPreset: true },

  // 地域
  { id: 'region-domestic', name: '国内', category: '地域', color: 'text-red-600', isPreset: true },
  { id: 'region-us', name: '美国', category: '地域', color: 'text-blue-600', isPreset: true },
  { id: 'region-europe', name: '欧洲', category: '地域', color: 'text-indigo-600', isPreset: true },
  { id: 'region-other', name: '其他', category: '地域', color: 'text-gray-600', isPreset: true },

  // 领域
  { id: 'domain-monetary', name: '货币政策', category: '领域', color: 'text-green-600', isPreset: true },
  { id: 'domain-fiscal', name: '财政政策', category: '领域', color: 'text-orange-600', isPreset: true },
  { id: 'domain-industrial', name: '产业政策', category: '领域', color: 'text-purple-600', isPreset: true },
  { id: 'domain-corporate', name: '公司事件', category: '领域', color: 'text-blue-600', isPreset: true },
  { id: 'domain-economic', name: '经济数据', category: '领域', color: 'text-yellow-600', isPreset: true },

  // 处理状态
  { id: 'status-watch', name: '需要关注', category: '处理状态', color: 'text-orange-500', isPreset: true },
  { id: 'status-action', name: '需要行动', category: '处理状态', color: 'text-red-500', isPreset: true },
  { id: 'status-done', name: '已处理', category: '处理状态', color: 'text-green-500', isPreset: true },
  { id: 'status-expired', name: '已过期', category: '处理状态', color: 'text-gray-400', isPreset: true },
];

/** 按分类获取标签 */
export const getTagsByCategory = (category: string): EventTag[] => {
  return PRESET_EVENT_TAGS.filter(tag => tag.category === category);
};

/** 获取所有分类 */
export const getTagCategories = (): string[] => {
  return [...new Set(PRESET_EVENT_TAGS.map(tag => tag.category))];
};

/** 根据ID获取标签 */
export const getTagById = (id: string): EventTag | undefined => {
  return PRESET_EVENT_TAGS.find(tag => tag.id === id);
};
