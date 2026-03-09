# 消息日历功能实现计划

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** 构建一个消息日历功能，帮助投资者管理年度消息面事件，实现事前规划和事后复盘的完整闭环。

**Architecture:**
- 独立的消息日历模块，通过侧边栏导航入口
- 三种视图（月视图、时间线、看板）自由切换
- 与每日复盘联动，展示当天事件
- localStorage 存储，与现有架构保持一致

**Tech Stack:** React 19, TypeScript, Tailwind CSS, date-fns, lucide-react

---

## 阶段一：基础设施（类型、服务、预设数据）

### Task 1.1: 创建事件类型定义

**Files:**
- Create: `src/types/event.ts`

**Step 1: 创建事件类型文件**

```typescript
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
```

**Step 2: 在类型索引中导出**

修改 `src/types/index.ts`，添加：
```typescript
// 导出事件日历类型
export * from './event'
```

---

### Task 1.2: 创建预设标签数据

**Files:**
- Create: `src/data/presetEventTags.ts`

**Step 1: 创建预设标签数据**

```typescript
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
```

---

### Task 1.3: 创建事件服务

**Files:**
- Create: `src/services/eventService.ts`

**Step 1: 创建事件服务**

```typescript
// src/services/eventService.ts

import type { MarketEvent, EventFilter, RepeatRule } from '../types/event';
import { format, addDays, addWeeks, addMonths, addYears, isBefore, isAfter, parseISO } from 'date-fns';

const EVENTS_STORAGE_KEY = 'turtletrace_events';
const CUSTOM_TAGS_STORAGE_KEY = 'turtletrace_event_custom_tags';

/**
 * 消息事件服务
 */
class EventService {
  // ==================== 事件 CRUD ====================

  /** 获取所有事件 */
  async getAllEvents(): Promise<MarketEvent[]> {
    try {
      const data = localStorage.getItem(EVENTS_STORAGE_KEY);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.error('获取事件列表失败:', error);
      return [];
    }
  }

  /** 获取单个事件 */
  async getEvent(id: string): Promise<MarketEvent | null> {
    const events = await this.getAllEvents();
    return events.find(e => e.id === id) || null;
  }

  /** 保存事件 */
  async saveEvent(event: MarketEvent): Promise<boolean> {
    try {
      const events = await this.getAllEvents();
      const existingIndex = events.findIndex(e => e.id === event.id);

      const updatedEvent = { ...event, updatedAt: Date.now() };

      if (existingIndex >= 0) {
        events[existingIndex] = updatedEvent;
      } else {
        events.push(updatedEvent);
      }

      // 按日期排序
      events.sort((a, b) => a.date.localeCompare(b.date));

      localStorage.setItem(EVENTS_STORAGE_KEY, JSON.stringify(events));
      return true;
    } catch (error) {
      console.error('保存事件失败:', error);
      return false;
    }
  }

  /** 删除事件 */
  async deleteEvent(id: string): Promise<boolean> {
    try {
      const events = await this.getAllEvents();
      const filtered = events.filter(e => e.id !== id && e.parentEventId !== id);
      localStorage.setItem(EVENTS_STORAGE_KEY, JSON.stringify(filtered));
      return true;
    } catch (error) {
      console.error('删除事件失败:', error);
      return false;
    }
  }

  // ==================== 查询方法 ====================

  /** 按日期获取事件 */
  async getEventsByDate(date: string): Promise<MarketEvent[]> {
    const events = await this.getAllEvents();
    return events.filter(e => e.date === date);
  }

  /** 按日期范围获取事件 */
  async getEventsByRange(startDate: string, endDate: string): Promise<MarketEvent[]> {
    const events = await this.getAllEvents();
    return events.filter(e => e.date >= startDate && e.date <= endDate);
  }

  /** 按筛选条件获取事件 */
  async getEventsByFilter(filter: EventFilter): Promise<MarketEvent[]> {
    let events = await this.getAllEvents();

    if (filter.eventType && filter.eventType.length > 0) {
      events = events.filter(e => filter.eventType!.includes(e.eventType));
    }

    if (filter.importance && filter.importance.length > 0) {
      events = events.filter(e => filter.importance!.includes(e.importance));
    }

    if (filter.status && filter.status.length > 0) {
      events = events.filter(e => filter.status!.includes(e.status));
    }

    if (filter.tags && filter.tags.length > 0) {
      events = events.filter(e => filter.tags!.some(tag => e.tags.includes(tag)));
    }

    if (filter.dateRange) {
      events = events.filter(e =>
        e.date >= filter.dateRange!.start && e.date <= filter.dateRange!.end
      );
    }

    if (filter.search) {
      const searchLower = filter.search.toLowerCase();
      events = events.filter(e =>
        e.name.toLowerCase().includes(searchLower) ||
        e.preAnalysis?.expectation?.toLowerCase().includes(searchLower) ||
        e.postReview?.summary?.toLowerCase().includes(searchLower)
      );
    }

    return events;
  }

  /** 获取即将到来的事件 */
  async getUpcomingEvents(days: number = 7): Promise<MarketEvent[]> {
    const today = format(new Date(), 'yyyy-MM-dd');
    const futureDate = format(addDays(new Date(), days), 'yyyy-MM-dd');
    return this.getEventsByRange(today, futureDate);
  }

  // ==================== 重复事件处理 ====================

  /** 生成重复事件实例 */
  generateRepeatInstances(rule: RepeatRule, startDate: string, untilDate: string): string[] {
    const dates: string[] = [];
    let currentDate = parseISO(startDate);
    const end = parseISO(untilDate);
    let count = 0;

    while (isBefore(currentDate, end) || currentDate.getTime() === end.getTime()) {
      if (rule.endDate && isAfter(currentDate, parseISO(rule.endDate))) {
        break;
      }

      if (rule.count && count >= rule.count) {
        break;
      }

      dates.push(format(currentDate, 'yyyy-MM-dd'));
      count++;

      // 根据重复类型计算下一个日期
      switch (rule.type) {
        case 'daily':
          currentDate = addDays(currentDate, rule.interval);
          break;
        case 'weekly':
          currentDate = addWeeks(currentDate, rule.interval);
          break;
        case 'monthly':
          currentDate = addMonths(currentDate, rule.interval);
          break;
        case 'yearly':
          currentDate = addYears(currentDate, rule.interval);
          break;
        case 'custom':
          if (rule.weekdays && rule.weekdays.length > 0) {
            // 找下一个符合条件的周几
            currentDate = addDays(currentDate, 1);
            while (!rule.weekdays.includes(currentDate.getDay())) {
              currentDate = addDays(currentDate, 1);
            }
          } else if (rule.monthDay) {
            // 每月固定几号
            currentDate = addMonths(currentDate, 1);
          }
          break;
        default:
          return dates;
      }
    }

    return dates;
  }

  // ==================== 工具方法 ====================

  /** 创建新事件 */
  createEvent(data: Partial<MarketEvent>): MarketEvent {
    const now = Date.now();
    return {
      id: `event_${now}_${Math.random().toString(36).substr(2, 9)}`,
      name: data.name || '',
      date: data.date || format(new Date(), 'yyyy-MM-dd'),
      eventType: data.eventType || 'fixed',
      importance: data.importance || 'medium',
      isBlackSwan: data.isBlackSwan,
      relatedStocks: data.relatedStocks || [],
      relatedSectors: data.relatedSectors || [],
      tags: data.tags || [],
      status: data.status || 'pending',
      createdAt: now,
      updatedAt: now,
      ...data,
    };
  }

  /** 更新事件状态 */
  async updateEventStatus(id: string, status: MarketEvent['status']): Promise<boolean> {
    const event = await this.getEvent(id);
    if (!event) return false;
    return this.saveEvent({ ...event, status });
  }

  // ==================== 导出功能 ====================

  /** 导出事件数据 */
  async exportEvents(): Promise<string> {
    const events = await this.getAllEvents();
    return JSON.stringify(events, null, 2);
  }

  /** 导入事件数据 */
  async importEvents(jsonData: string): Promise<boolean> {
    try {
      const events = JSON.parse(jsonData);
      if (!Array.isArray(events)) return false;

      const existingEvents = await this.getAllEvents();
      const merged = [...existingEvents];

      for (const event of events) {
        const index = merged.findIndex(e => e.id === event.id);
        if (index >= 0) {
          merged[index] = event;
        } else {
          merged.push(event);
        }
      }

      localStorage.setItem(EVENTS_STORAGE_KEY, JSON.stringify(merged));
      return true;
    } catch (error) {
      console.error('导入事件失败:', error);
      return false;
    }
  }
}

// 单例导出
export const eventService = new EventService();
```

---

## 阶段二：核心组件开发

### Task 2.1: 创建事件卡片组件

**Files:**
- Create: `src/components/dashboard/eventCalendar/EventCard.tsx`

**实现要点:**
- 显示事件名称、日期、类型、重要程度
- 显示标签（使用预设标签的颜色）
- 支持黑天鹅标识（仅潜在事件）
- 点击可展开详情或进入编辑

---

### Task 2.2: 创建事件编辑器组件

**Files:**
- Create: `src/components/dashboard/eventCalendar/EventEditor.tsx`

**实现要点:**
- 表单包含所有字段
- 标签选择器（从预设标签中选择）
- 重复规则配置
- 事前分析/事后记录分区块显示

---

### Task 2.3: 创建标签选择器组件

**Files:**
- Create: `src/components/dashboard/eventCalendar/TagSelector.tsx`

**实现要点:**
- 按分类展示预设标签
- 支持多选
- 显示已选标签

---

### Task 2.4: 创建月视图组件

**Files:**
- Create: `src/components/dashboard/eventCalendar/MonthView.tsx`

**实现要点:**
- 参考 ReviewCalendar 的布局结构
- 在日期格子上显示事件指示点（不同类型不同颜色）
- 点击日期显示当日事件列表
- 支持月份导航

---

### Task 2.5: 创建时间线视图组件

**Files:**
- Create: `src/components/dashboard/eventCalendar/TimelineView.tsx`

**实现要点:**
- 按时间顺序列表展示
- 支持筛选（类型、标签、状态）
- 支持搜索
- 事件卡片展示完整信息

---

### Task 2.6: 创建看板视图组件

**Files:**
- Create: `src/components/dashboard/eventCalendar/KanbanView.tsx`

**实现要点:**
- 三列布局（固定日程/周期事件/潜在事件）
- 每列内按时间排序
- 事件卡片可点击进入详情

---

### Task 2.7: 创建主入口组件

**Files:**
- Create: `src/components/dashboard/eventCalendar/EventCalendar.tsx`

**实现要点:**
- 视图切换按钮（月视图/时间线/看板）
- 新增事件按钮
- 筛选器
- 整合三种视图组件

---

## 阶段三：与复盘功能联动

### Task 3.1: 创建今日事件组件

**Files:**
- Create: `src/components/dashboard/eventCalendar/TodayEvents.tsx`

**实现要点:**
- 显示指定日期的事件列表
- 简洁卡片样式
- 点击可查看详情或跳转

---

### Task 3.2: 创建事件选择器组件

**Files:**
- Create: `src/components/dashboard/eventCalendar/EventSelector.tsx`

**实现要点:**
- 弹窗形式
- 可选择非当天的事件关联到复盘
- 支持搜索和筛选

---

### Task 3.3: 集成到复盘编辑器

**Files:**
- Modify: `src/components/dashboard/review/ReviewEditor.tsx`

**实现要点:**
- 在复盘编辑器顶部添加"今日事件"区块
- 默认展示当天事件
- 提供手动选择其他事件的入口

---

## 阶段四：导航集成与优化

### Task 4.1: 添加侧边栏导航入口

**Files:**
- Modify: `src/App.tsx`

**实现要点:**
- 在 tabs 数组中添加消息日历入口
- 使用 CalendarDays 图标
- 在主内容区添加 EventCalendar 组件渲染

---

### Task 4.2: 数据导出集成

**Files:**
- Modify: `src/services/exportService.ts`

**实现要点:**
- 在导出功能中包含事件数据
- 在导入功能中处理事件数据

---

## 文件结构总览

```
src/
├── types/
│   └── event.ts                        # 事件类型定义
├── data/
│   └── presetEventTags.ts              # 预设标签数据
├── services/
│   └── eventService.ts                 # 事件服务
├── components/
│   └── dashboard/
│       └── eventCalendar/
│           ├── EventCalendar.tsx       # 主入口
│           ├── MonthView.tsx           # 月视图
│           ├── TimelineView.tsx        # 时间线视图
│           ├── KanbanView.tsx          # 看板视图
│           ├── EventCard.tsx           # 事件卡片
│           ├── EventEditor.tsx         # 事件编辑器
│           ├── EventDetail.tsx         # 事件详情
│           ├── TagSelector.tsx         # 标签选择器
│           ├── TodayEvents.tsx         # 今日事件组件
│           └── EventSelector.tsx       # 事件选择器
└── App.tsx                             # 添加导航入口
```

---

## 事件类型视觉标识

| 类型 | 名称 | 颜色 | 图标 |
|------|------|------|------|
| fixed | 固定日程 | 蓝色 (#3B82F6) | Pin |
| periodic | 周期事件 | 橙色 (#F97316) | RefreshCw |
| potential | 潜在事件 | 灰色 (#6B7280) | Zap |

**黑天鹅标识:** 潜在事件可额外标记 `isBlackSwan: true`，显示时添加天鹅图标 (🦢) 或特殊边框

---

## 开发顺序建议

1. **阶段一** → 基础设施完成后可独立测试
2. **阶段二 Task 2.4-2.6** → 可并行开发三种视图
3. **阶段二 Task 2.1-2.3** → 被视图组件依赖，需先完成
4. **阶段二 Task 2.7** → 整合所有组件
5. **阶段三** → 复盘联动
6. **阶段四** → 最终集成

---

## MVP 范围确认

### 第一期必须实现
- [x] 三种事件类型的基础 CRUD
- [x] 月视图 + 时间线视图
- [x] 预设标签系统
- [x] 与每日复盘的关联展示
- [x] 事前分析 + 事后记录字段
- [x] 事件重复机制

### 可后续迭代
- [ ] 看板视图
- [ ] 自定义标签创建
- [ ] 事件提醒功能
- [ ] 拖拽调整日期/类型
- [ ] 与持仓股票的自动关联
