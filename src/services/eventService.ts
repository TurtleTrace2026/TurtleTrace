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
      ...data,  // 先 spread 传入的数据
      id: `event_${now}_${Math.random().toString(36).substr(2, 9)}`,  // 后设置 id，确保唯一性
      name: data.name || '',
      date: data.date || format(new Date(), 'yyyy-MM-dd'),
      eventType: data.eventType || 'fixed',
      importance: data.importance || 'medium',
      status: data.status || 'pending',
      createdAt: data.createdAt || now,
      updatedAt: now,
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
