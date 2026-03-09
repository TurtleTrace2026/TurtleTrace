import { useState, useEffect } from 'react';
import { Calendar, ChevronRight, ExternalLink, Plus } from 'lucide-react';
import type { MarketEvent } from '../../../types/event';
import { eventService } from '../../../services/eventService';
import { EventCard } from './EventCard';
import { cn } from '../../../lib/utils';

interface TodayEventsProps {
  date: string;
  onEventClick?: (event: MarketEvent) => void;
  onAddEvent?: () => void;
  onViewAll?: () => void;
  className?: string;
}

export function TodayEvents({
  date,
  onEventClick,
  onAddEvent,
  onViewAll,
  className,
}: TodayEventsProps) {
  const [events, setEvents] = useState<MarketEvent[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadEvents();
  }, [date]);

  const loadEvents = async () => {
    setLoading(true);
    try {
      const dayEvents = await eventService.getEventsByDate(date);
      setEvents(dayEvents);
    } catch (error) {
      console.error('加载事件失败:', error);
    } finally {
      setLoading(false);
    }
  };

  // 格式化日期显示
  const formatDateDisplay = (dateStr: string) => {
    const date = new Date(dateStr);
    const today = new Date();
    const todayStr = today.toISOString().split('T')[0];

    if (dateStr === todayStr) {
      return '今天';
    }

    return `${date.getMonth() + 1}月${date.getDate()}日`;
  };

  // 按重要程度排序
  const sortedEvents = [...events].sort((a, b) => {
    const importanceOrder = { high: 0, medium: 1, low: 2 };
    return importanceOrder[a.importance] - importanceOrder[b.importance];
  });

  if (loading) {
    return (
      <div className={cn("p-4", className)}>
        <div className="text-sm text-muted-foreground">加载事件...</div>
      </div>
    );
  }

  return (
    <div className={cn("border rounded-xl bg-card overflow-hidden", className)}>
      {/* 头部 */}
      <div className="flex items-center justify-between p-3 border-b bg-surface-hover/50">
        <div className="flex items-center gap-2">
          <Calendar className="h-4 w-4 text-primary" />
          <span className="font-medium text-sm">
            {formatDateDisplay(date)}的事件
          </span>
          {events.length > 0 && (
            <span className="text-xs bg-primary/10 text-primary px-1.5 py-0.5 rounded-full">
              {events.length}
            </span>
          )}
        </div>

        <div className="flex items-center gap-1">
          {onAddEvent && (
            <button
              onClick={onAddEvent}
              className="p-1.5 hover:bg-surface-hover rounded-lg transition-colors"
              title="添加事件"
            >
              <Plus className="h-4 w-4 text-muted-foreground" />
            </button>
          )}
          {onViewAll && (
            <button
              onClick={onViewAll}
              className="p-1.5 hover:bg-surface-hover rounded-lg transition-colors"
              title="查看全部"
            >
              <ExternalLink className="h-4 w-4 text-muted-foreground" />
            </button>
          )}
        </div>
      </div>

      {/* 事件列表 */}
      <div className="p-3">
        {events.length === 0 ? (
          <div className="text-center py-4 text-muted-foreground">
            <Calendar className="h-8 w-8 mx-auto mb-2 opacity-30" />
            <p className="text-sm">暂无事件</p>
            {onAddEvent && (
              <button
                onClick={onAddEvent}
                className="text-sm text-primary hover:underline mt-1"
              >
                添加事件
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-2">
            {sortedEvents.map(event => (
              <button
                key={event.id}
                onClick={() => onEventClick?.(event)}
                className="w-full text-left group"
              >
                <div className={cn(
                  "flex items-center gap-2 p-2 rounded-lg border hover:bg-surface-hover transition-colors",
                  event.isBlackSwan && "border-amber-400"
                )}>
                  {/* 事件类型指示 */}
                  <div className={cn(
                    "w-2 h-2 rounded-full flex-shrink-0",
                    event.eventType === 'fixed' && "bg-blue-500",
                    event.eventType === 'periodic' && "bg-orange-500",
                    event.eventType === 'potential' && "bg-gray-400"
                  )} />

                  {/* 事件信息 */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1">
                      <span className="text-sm font-medium truncate">{event.name}</span>
                      {event.isBlackSwan && <span className="text-xs">🦢</span>}
                    </div>
                    {event.preAnalysis?.expectation && (
                      <p className="text-xs text-muted-foreground truncate mt-0.5">
                        {event.preAnalysis.expectation}
                      </p>
                    )}
                  </div>

                  {/* 重要程度 */}
                  <span className={cn(
                    "text-xs px-1.5 py-0.5 rounded flex-shrink-0",
                    event.importance === 'high' && "bg-red-100 text-red-700",
                    event.importance === 'medium' && "bg-yellow-100 text-yellow-700",
                    event.importance === 'low' && "bg-gray-100 text-gray-600"
                  )}>
                    {event.importance === 'high' ? '高' : event.importance === 'medium' ? '中' : '低'}
                  </span>

                  <ChevronRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
