import { useState, useEffect, useMemo } from 'react';
import { X, Search, Check, Calendar } from 'lucide-react';
import type { MarketEvent } from '../../../types/event';
import { eventService } from '../../../services/eventService';
import { cn } from '../../../lib/utils';

interface EventSelectorProps {
  isOpen: boolean;
  selectedEventIds: string[];
  onConfirm: (eventIds: string[]) => void;
  onClose: () => void;
  defaultDate?: string;
}

export function EventSelector({
  isOpen,
  selectedEventIds,
  onConfirm,
  onClose,
  defaultDate,
}: EventSelectorProps) {
  const [events, setEvents] = useState<MarketEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<Set<string>>(new Set(selectedEventIds));

  useEffect(() => {
    if (isOpen) {
      loadEvents();
      setSelected(new Set(selectedEventIds));
    }
  }, [isOpen, selectedEventIds]);

  const loadEvents = async () => {
    setLoading(true);
    try {
      const allEvents = await eventService.getAllEvents();
      // 按日期排序，最近的在前面
      allEvents.sort((a, b) => b.date.localeCompare(a.date));
      setEvents(allEvents);
    } catch (error) {
      console.error('加载事件失败:', error);
    } finally {
      setLoading(false);
    }
  };

  // 搜索过滤
  const filteredEvents = useMemo(() => {
    if (!search.trim()) return events;

    const searchLower = search.toLowerCase();
    return events.filter(e =>
      e.name.toLowerCase().includes(searchLower) ||
      e.preAnalysis?.expectation?.toLowerCase().includes(searchLower)
    );
  }, [events, search]);

  // 切换选中
  const toggleSelect = (eventId: string) => {
    setSelected(prev => {
      const next = new Set(prev);
      if (next.has(eventId)) {
        next.delete(eventId);
      } else {
        next.add(eventId);
      }
      return next;
    });
  };

  // 确认选择
  const handleConfirm = () => {
    onConfirm(Array.from(selected));
    onClose();
  };

  // 格式化日期
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return `${date.getMonth() + 1}/${date.getDate()}`;
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-card rounded-2xl w-full max-w-lg max-h-[80vh] overflow-hidden flex flex-col">
        {/* 头部 */}
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="text-lg font-semibold">选择关联事件</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-surface-hover rounded-lg transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* 搜索 */}
        <div className="p-4 border-b">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="搜索事件名称..."
              className="w-full pl-9 pr-3 py-2 text-sm border rounded-lg bg-background focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
            />
          </div>
        </div>

        {/* 事件列表 */}
        <div className="flex-1 overflow-y-auto p-4">
          {loading ? (
            <div className="text-center py-8 text-muted-foreground">
              加载中...
            </div>
          ) : filteredEvents.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Calendar className="h-10 w-10 mx-auto mb-2 opacity-30" />
              <p>{search ? '未找到匹配的事件' : '暂无事件'}</p>
            </div>
          ) : (
            <div className="space-y-2">
              {filteredEvents.map(event => {
                const isSelected = selected.has(event.id);
                const today = new Date().toISOString().split('T')[0];
                const isToday = event.date === today;
                const isPast = event.date < today;

                return (
                  <button
                    key={event.id}
                    onClick={() => toggleSelect(event.id)}
                    className={cn(
                      "w-full text-left p-3 rounded-lg border transition-all",
                      isSelected
                        ? "border-primary bg-primary/5"
                        : "hover:bg-surface-hover",
                      isPast && "opacity-60"
                    )}
                  >
                    <div className="flex items-start gap-3">
                      {/* 选中指示 */}
                      <div className={cn(
                        "w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0 mt-0.5",
                        isSelected
                          ? "border-primary bg-primary text-primary-foreground"
                          : "border-gray-300"
                      )}>
                        {isSelected && <Check className="h-3 w-3" />}
                      </div>

                      {/* 事件内容 */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-medium truncate">{event.name}</span>
                          {event.isBlackSwan && <span className="text-xs">🦢</span>}
                        </div>

                        <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                          <span className={cn(
                            "px-1.5 py-0.5 rounded",
                            isToday && "bg-primary/10 text-primary",
                            isPast && !isToday && "bg-gray-100 text-gray-600"
                          )}>
                            {isToday ? '今天' : formatDate(event.date)}
                          </span>
                          <span className={cn(
                            "px-1.5 py-0.5 rounded",
                            event.eventType === 'fixed' && "bg-blue-100 text-blue-700",
                            event.eventType === 'periodic' && "bg-orange-100 text-orange-700",
                            event.eventType === 'potential' && "bg-gray-100 text-gray-600"
                          )}>
                            {event.eventType === 'fixed' ? '固定' : event.eventType === 'periodic' ? '周期' : '潜在'}
                          </span>
                          <span className={cn(
                            event.importance === 'high' && "text-red-600",
                            event.importance === 'medium' && "text-yellow-600",
                            event.importance === 'low' && "text-gray-500"
                          )}>
                            {event.importance === 'high' ? '高优先级' : event.importance === 'medium' ? '中优先级' : '低优先级'}
                          </span>
                        </div>

                        {event.preAnalysis?.expectation && (
                          <p className="text-xs text-muted-foreground mt-1 line-clamp-1">
                            {event.preAnalysis.expectation}
                          </p>
                        )}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* 底部 */}
        <div className="flex items-center justify-between p-4 border-t bg-surface-hover/30">
          <span className="text-sm text-muted-foreground">
            已选择 {selected.size} 个事件
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 border rounded-lg hover:bg-surface-hover transition-colors"
            >
              取消
            </button>
            <button
              onClick={handleConfirm}
              className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:opacity-90 transition-opacity"
            >
              确认选择
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
