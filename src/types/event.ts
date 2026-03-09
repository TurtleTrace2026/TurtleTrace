// src/types/event.ts

/** 事件类型 */
export type EventType = 'fixed' | 'periodic' | 'potential';

/** 事件重要程度 */
export type EventImportance = 'high' | 'medium' | 'low';

/** 事件状态 */
export type EventStatus = 'pending' | 'ongoing' | 'completed';

/** 重复规则类型 */
export type RepeatType = 'none' | 'daily' | 'weekly' | 'monthly' | 'yearly' | 'custom';

/** 重复规则 */
export interface RepeatRule {
  type: RepeatType;
  interval: number;           // 间隔（如每2周 = weekly + interval: 2）
  endDate?: string;           // 重复结束日期
  count?: number;             // 重复次数
  weekdays?: number[];        // 自定义：周几 (0-6, 0=周日)
  monthDay?: number;          // 自定义：每月几号
}

/** 消息事件 */
export interface MarketEvent {
  id: string;                           // 唯一ID
  name: string;                         // 事件名称
  date: string;                         // 事件日期 YYYY-MM-DD
  endDate?: string;                     // 结束日期（跨日事件）
  eventType: EventType;                 // 事件类型

  // 重要程度
  importance: EventImportance;

  // 黑天鹅标识（仅潜在事件使用）
  isBlackSwan?: boolean;

  // 相关性
  relatedStocks?: string[];             // 相关股票代码
  relatedSectors?: string[];            // 相关板块

  // 标签
  tags: string[];                       // 标签ID数组

  // 事前分析
  preAnalysis?: {
    expectation: string;                // 预期影响
    strategy: string;                   // 应对策略
    createdAt: number;                  // 创建时间戳
    updatedAt?: number;                 // 更新时间戳
  };

  // 事后记录
  postReview?: {
    actualImpact: string;               // 实际影响
    summary: string;                    // 复盘总结
    lessons: string;                    // 经验教训
    completedAt: number;                // 完成时间戳
  };

  // 状态
  status: EventStatus;

  // 重复规则
  repeatRule?: RepeatRule;
  parentEventId?: string;               // 如果是重复生成的实例，指向原始事件

  // 元数据
  createdAt: number;
  updatedAt: number;
}

/** 事件标签 */
export interface EventTag {
  id: string;
  name: string;
  category: string;                     // 标签分类
  color: string;                        // 标签颜色 (Tailwind class 或 hex)
  isPreset: boolean;                    // 是否预设标签
}

/** 事件筛选条件 */
export interface EventFilter {
  eventType?: EventType[];
  importance?: EventImportance[];
  status?: EventStatus[];
  tags?: string[];
  dateRange?: {
    start: string;
    end: string;
  };
  search?: string;
}
