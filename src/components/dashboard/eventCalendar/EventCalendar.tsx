import { useState, useEffect, useMemo } from 'react';
import { Plus, Calendar, List, LayoutGrid, ChevronLeft, ChevronRight } from 'lucide-react';
import type { MarketEvent, EventFilter } from '../../../types/event';
import { eventService } from '../../../services/eventService';
import { MonthView } from './MonthView';
import { TimelineView } from './TimelineView';
import { KanbanView } from './KanbanView';
import { EventEditor } from './EventEditor';
import { EventCard } from './EventCard';
import { cn } from '../../../lib/utils';

type ViewType = 'month' | 'timeline' | 'kanban';

export function EventCalendar() {
  // 状态
  const [events, setEvents] = useState<MarketEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewType, setViewType] = useState<ViewType>('month');
  const [selectedDate, setSelectedDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [filter, setFilter] = useState<EventFilter>({});

  // 编辑器状态
  const [showEditor, setShowEditor] = useState(false);
  const [editingEvent, setEditingEvent] = useState<MarketEvent | null>(null);
  const [defaultDate, setDefaultDate] = useState<string | undefined>();

  // 加载事件
  useEffect(() => {
    loadEvents();
  }, []);

  const loadEvents = async () => {
    setLoading(true);
    try {
      const allEvents = await eventService.getAllEvents();
      setEvents(allEvents);
    } catch (error) {
      console.error('加载事件失败:', error);
    } finally {
      setLoading(false);
    }
  };

  // 应用筛选后的事件
  const filteredEvents = useMemo(() => {
    let result = [...events];

    if (filter.eventType && filter.eventType.length > 0) {
      result = result.filter(e => filter.eventType!.includes(e.eventType));
    }

    if (filter.importance && filter.importance.length > 0) {
      result = result.filter(e => filter.importance!.includes(e.importance));
    }

    if (filter.status && filter.status.length > 0) {
      result = result.filter(e => filter.status!.includes(e.status));
    }

    if (filter.tags && filter.tags.length > 0) {
      result = result.filter(e => filter.tags!.some(tag => e.tags.includes(tag)));
    }

    if (filter.dateRange) {
      result = result.filter(e =>
        e.date >= filter.dateRange!.start && e.date <= filter.dateRange!.end
      );
    }

    if (filter.search) {
      const searchLower = filter.search.toLowerCase();
      result = result.filter(e =>
        e.name.toLowerCase().includes(searchLower) ||
        e.preAnalysis?.expectation?.toLowerCase().includes(searchLower) ||
        e.postReview?.summary?.toLowerCase().includes(searchLower)
      );
    }

    return result;
  }, [events, filter]);

  // 获取选中日期的事件
  const selectedDateEvents = useMemo(() => {
    return events.filter(e => e.date === selectedDate);
  }, [events, selectedDate]);

  // 打开新建编辑器
  const handleAddEvent = (date?: string) => {
    setEditingEvent(null);
    setDefaultDate(date || selectedDate);
    setShowEditor(true);
  };

  // 打开编辑编辑器
  const handleEditEvent = (event: MarketEvent) => {
    setEditingEvent(event);
    setDefaultDate(undefined);
    setShowEditor(true);
  };

  // 保存完成
  const handleSaveComplete = () => {
    setShowEditor(false);
    setEditingEvent(null);
    loadEvents();
  };

  // 删除完成
  const handleDeleteComplete = () => {
    setShowEditor(false);
    setEditingEvent(null);
    loadEvents();
  };

  // 视图切换按钮配置
  const viewButtons: { type: ViewType; icon: typeof Calendar; label: string }[] = [
    { type: 'month', icon: Calendar, label: '月视图' },
    { type: 'timeline', icon: List, label: '时间线' },
    { type: 'kanban', icon: LayoutGrid, label: '看板' },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-muted-foreground">加载中...</div>
      </div>
    );
  }

  return (
    <div className="flex gap-4 h-full">
      {/* 主内容区 */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* 工具栏 */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            {viewButtons.map(btn => {
              const Icon = btn.icon;
              return (
                <button
                  key={btn.type}
                  onClick={() => setViewType(btn.type)}
                  className={cn(
                    "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors",
                    viewType === btn.type
                      ? "bg-primary text-primary-foreground"
                      : "bg-card border hover:bg-surface-hover"
                  )}
                >
                  <Icon className="h-4 w-4" />
                  {btn.label}
                </button>
              );
            })}
          </div>

          <button
            onClick={() => handleAddEvent()}
            className="flex items-center gap-1.5 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:opacity-90 transition-opacity"
          >
            <Plus className="h-4 w-4" />
            新建事件
          </button>
        </div>

        {/* 视图内容 */}
        <div className="flex-1 overflow-hidden">
          {viewType === 'month' && (
            <MonthView
              events={filteredEvents}
              selectedDate={selectedDate}
              onSelectDate={setSelectedDate}
              onAddEvent={handleAddEvent}
            />
          )}

          {viewType === 'timeline' && (
            <TimelineView
              events={filteredEvents}
              filter={filter}
              onFilterChange={setFilter}
              onSelectEvent={handleEditEvent}
            />
          )}

          {viewType === 'kanban' && (
            <KanbanView
              events={filteredEvents}
              onSelectEvent={handleEditEvent}
            />
          )}
        </div>
      </div>

      {/* 右侧详情面板 */}
      {viewType === 'month' && selectedDateEvents.length > 0 && (
        <div className="w-80 flex-shrink-0 border rounded-xl bg-card overflow-hidden">
          <div className="p-4 border-b bg-surface-hover/50">
            <h3 className="font-semibold">
              {new Date(selectedDate).toLocaleDateString('zh-CN', {
                month: 'long',
                day: 'numeric',
                weekday: 'long'
              })}
            </h3>
            <p className="text-sm text-muted-foreground mt-1">
              {selectedDateEvents.length}个事件
            </p>
          </div>
          <div className="p-3 space-y-3 max-h-[calc(100%-80px)] overflow-y-auto">
            {selectedDateEvents.map(event => (
              <EventCard
                key={event.id}
                event={event}
                onClick={() => handleEditEvent(event)}
                compact
              />
            ))}
          </div>
        </div>
      )}

      {/* 编辑器弹窗 */}
      {showEditor && (
        <EventEditor
          event={editingEvent}
          defaultDate={defaultDate}
          onSave={handleSaveComplete}
          onCancel={() => setShowEditor(false)}
          onDelete={editingEvent ? handleDeleteComplete : undefined}
        />
      )}
    </div>
  );
}
