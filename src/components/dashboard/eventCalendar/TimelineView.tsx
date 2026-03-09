import { useMemo } from 'react';
import { Calendar, Search, Filter } from 'lucide-react';
import type { MarketEvent, EventFilter, EventType, EventImportance } from '../../../types/event';
import { EventCard } from './EventCard';
import { cn } from '../../../lib/utils';

interface TimelineViewProps {
  events: MarketEvent[];
  filter: EventFilter;
  onFilterChange: (filter: EventFilter) => void;
  onSelectEvent: (event: MarketEvent) => void;
}

export function TimelineView({ events, filter, onFilterChange, onSelectEvent }: TimelineViewProps) {
  // 按日期分组事件
  const groupedEvents = useMemo(() => {
    const sorted = [...events].sort((a, b) => a.date.localeCompare(b.date));
    const groups = new Map<string, MarketEvent[]>();

    for (const event of sorted) {
      const existing = groups.get(event.date) || [];
      existing.push(event);
      groups.set(event.date, existing);
    }

    return Array.from(groups.entries()).sort((a, b) => a[0].localeCompare(b[0]));
  }, [events]);

  // 格式化日期显示
  const formatDateDisplay = (dateStr: string) => {
    const date = new Date(dateStr);
    const today = new Date();
    const todayStr = today.toISOString().split('T')[0];
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().split('T')[0];
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowStr = tomorrow.toISOString().split('T')[0];

    const weekDay = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'][date.getDay()];

    if (dateStr === todayStr) {
      return `今天 · ${date.getMonth() + 1}月${date.getDate()}日 ${weekDay}`;
    }
    if (dateStr === yesterdayStr) {
      return `昨天 · ${date.getMonth() + 1}月${date.getDate()}日 ${weekDay}`;
    }
    if (dateStr === tomorrowStr) {
      return `明天 · ${date.getMonth() + 1}月${date.getDate()}日 ${weekDay}`;
    }

    return `${date.getFullYear()}年${date.getMonth() + 1}月${date.getDate()}日 ${weekDay}`;
  };

  const todayStr = new Date().toISOString().split('T')[0];

  return (
    <div className="space-y-4">
      {/* 筛选工具栏 */}
      <div className="flex items-center gap-3 p-3 bg-card border rounded-xl">
        {/* 搜索框 */}
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            value={filter.search || ''}
            onChange={e => onFilterChange({ ...filter, search: e.target.value })}
            placeholder="搜索事件..."
            className="w-full pl-9 pr-3 py-2 text-sm border rounded-lg bg-background focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
          />
        </div>

        {/* 事件类型筛选 */}
        <select
          value={filter.eventType?.[0] || ''}
          onChange={e => onFilterChange({
            ...filter,
            eventType: e.target.value ? [e.target.value as EventType] : undefined
          })}
          className="px-3 py-2 text-sm border rounded-lg bg-background"
        >
          <option value="">全部类型</option>
          <option value="fixed">固定日程</option>
          <option value="periodic">周期事件</option>
          <option value="potential">潜在事件</option>
        </select>

        {/* 重要程度筛选 */}
        <select
          value={filter.importance?.[0] || ''}
          onChange={e => onFilterChange({
            ...filter,
            importance: e.target.value ? [e.target.value as EventImportance] : undefined
          })}
          className="px-3 py-2 text-sm border rounded-lg bg-background"
        >
          <option value="">全部重要度</option>
          <option value="high">高</option>
          <option value="medium">中</option>
          <option value="low">低</option>
        </select>
      </div>

      {/* 事件数量统计 */}
      <div className="text-sm text-muted-foreground">
        共 {events.length} 个事件
      </div>

      {/* 时间线列表 */}
      {groupedEvents.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          <Calendar className="h-12 w-12 mx-auto mb-3 opacity-50" />
          <p>暂无事件</p>
          <p className="text-sm mt-1">点击右上角"新建事件"添加</p>
        </div>
      ) : (
        <div className="space-y-6">
          {groupedEvents.map(([date, dayEvents]) => {
            const isToday = date === todayStr;
            const isPast = date < todayStr;

            return (
              <div key={date}>
                {/* 日期标题 */}
                <div className={cn(
                  "flex items-center gap-2 mb-3 sticky top-0 bg-background py-2 z-10",
                  isToday && "text-primary font-semibold"
                )}>
                  <div className={cn(
                    "w-3 h-3 rounded-full",
                    isToday ? "bg-primary" : isPast ? "bg-muted-foreground/30" : "bg-blue-400"
                  )} />
                  <span className="text-sm font-medium">
                    {formatDateDisplay(date)}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {dayEvents.length}个事件
                  </span>
                </div>

                {/* 事件列表 */}
                <div className="ml-1.5 pl-4 border-l-2 border-muted space-y-3">
                  {dayEvents.map(event => (
                    <EventCard
                      key={event.id}
                      event={event}
                      onClick={() => onSelectEvent(event)}
                    />
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
