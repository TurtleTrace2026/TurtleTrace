import { useMemo } from 'react';
import { Pin, RefreshCw, Zap } from 'lucide-react';
import type { MarketEvent, EventType } from '../../../types/event';
import { EventCard } from './EventCard';
import { cn } from '../../../lib/utils';

interface KanbanViewProps {
  events: MarketEvent[];
  onSelectEvent: (event: MarketEvent) => void;
}

// 看板列配置
const columns: { type: EventType; title: string; icon: typeof Pin; color: string }[] = [
  { type: 'fixed', title: '固定日程', icon: Pin, color: 'text-blue-500' },
  { type: 'periodic', title: '周期事件', icon: RefreshCw, color: 'text-orange-500' },
  { type: 'potential', title: '潜在事件', icon: Zap, color: 'text-gray-500' },
];

export function KanbanView({ events, onSelectEvent }: KanbanViewProps) {
  // 按类型分组事件
  const eventsByType = useMemo(() => {
    const map = new Map<EventType, MarketEvent[]>();

    for (const col of columns) {
      map.set(col.type, []);
    }

    // 按日期排序后分组
    const sorted = [...events].sort((a, b) => a.date.localeCompare(b.date));
    for (const event of sorted) {
      const existing = map.get(event.eventType) || [];
      existing.push(event);
      map.set(event.eventType, existing);
    }

    return map;
  }, [events]);

  // 格式化日期显示
  const formatDateShort = (dateStr: string) => {
    const date = new Date(dateStr);
    return `${date.getMonth() + 1}/${date.getDate()}`;
  };

  const todayStr = new Date().toISOString().split('T')[0];

  return (
    <div className="grid grid-cols-3 gap-4 h-full">
      {columns.map(column => {
        const columnEvents = eventsByType.get(column.type) || [];
        const Icon = column.icon;

        // 统计
        const upcomingCount = columnEvents.filter(e => e.date >= todayStr).length;
        const pastCount = columnEvents.filter(e => e.date < todayStr).length;

        return (
          <div key={column.type} className="flex flex-col bg-card border rounded-xl overflow-hidden">
            {/* 列标题 */}
            <div className="p-3 border-b bg-surface-hover/50">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Icon className={cn("h-4 w-4", column.color)} />
                  <span className="font-medium">{column.title}</span>
                </div>
                <span className="text-sm text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
                  {columnEvents.length}
                </span>
              </div>
              {columnEvents.length > 0 && (
                <div className="text-xs text-muted-foreground mt-1">
                  {upcomingCount > 0 && <span className="text-green-600">{upcomingCount}个即将到来</span>}
                  {upcomingCount > 0 && pastCount > 0 && <span> · </span>}
                  {pastCount > 0 && <span>{pastCount}个已过期</span>}
                </div>
              )}
            </div>

            {/* 事件列表 */}
            <div className="flex-1 overflow-y-auto p-3 space-y-3">
              {columnEvents.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground text-sm">
                  <Icon className={cn("h-8 w-8 mx-auto mb-2 opacity-30", column.color)} />
                  <p>暂无{column.title}</p>
                </div>
              ) : (
                columnEvents.map(event => (
                  <div
                    key={event.id}
                    onClick={() => onSelectEvent(event)}
                    className="cursor-pointer"
                  >
                    <div className={cn(
                      "p-3 rounded-lg border bg-background hover:border-primary/30 hover:shadow-sm transition-all",
                      event.date < todayStr && "opacity-60",
                      event.isBlackSwan && "ring-2 ring-amber-400"
                    )}>
                      {/* 日期标签 */}
                      <div className="flex items-center justify-between mb-2">
                        <span className={cn(
                          "text-xs px-2 py-0.5 rounded-full",
                          event.date === todayStr
                            ? "bg-primary text-primary-foreground"
                            : event.date > todayStr
                              ? "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400"
                              : "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400"
                        )}>
                          {event.date === todayStr
                            ? "今天"
                            : formatDateShort(event.date)}
                        </span>
                        {event.isBlackSwan && (
                          <span className="text-sm">🦢</span>
                        )}
                      </div>

                      {/* 事件名称 */}
                      <h4 className="font-medium text-sm line-clamp-2">{event.name}</h4>

                      {/* 标签预览 */}
                      {event.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-2">
                          {event.tags.slice(0, 2).map(tagId => (
                            <span
                              key={tagId}
                              className="text-xs px-1.5 py-0.5 bg-muted rounded"
                            >
                              {tagId.split('-').pop()}
                            </span>
                          ))}
                          {event.tags.length > 2 && (
                            <span className="text-xs text-muted-foreground">+{event.tags.length - 2}</span>
                          )}
                        </div>
                      )}

                      {/* 状态指示 */}
                      {event.status === 'completed' && (
                        <div className="mt-2 text-xs text-green-600 flex items-center gap-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-green-500" />
                          已完成复盘
                        </div>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
