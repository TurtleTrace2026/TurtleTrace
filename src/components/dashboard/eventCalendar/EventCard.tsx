import { Pin, RefreshCw, Zap, Calendar, AlertCircle } from 'lucide-react';
import type { MarketEvent, EventType, EventImportance } from '../../../types/event';
import { getTagById } from '../../../data/presetEventTags';
import { cn } from '../../../lib/utils';

interface EventCardProps {
  event: MarketEvent;
  onClick?: () => void;
  compact?: boolean;
}

// 事件类型配置
const eventTypeConfig: Record<EventType, { icon: typeof Pin; label: string; color: string }> = {
  fixed: { icon: Pin, label: '固定日程', color: 'text-blue-500' },
  periodic: { icon: RefreshCw, label: '周期事件', color: 'text-orange-500' },
  potential: { icon: Zap, label: '潜在事件', color: 'text-gray-500' },
};

// 重要程度配置
const importanceConfig: Record<EventImportance, { label: string; badge: string }> = {
  high: { label: '高', badge: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' },
  medium: { label: '中', badge: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400' },
  low: { label: '低', badge: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400' },
};

export function EventCard({ event, onClick, compact = false }: EventCardProps) {
  const typeConfig = eventTypeConfig[event.eventType];
  const impConfig = importanceConfig[event.importance];
  const TypeIcon = typeConfig.icon;

  // 格式化日期显示
  const formatDateDisplay = (dateStr: string) => {
    const date = new Date(dateStr);
    return `${date.getMonth() + 1}月${date.getDate()}日`;
  };

  // 获取标签信息
  const tags = event.tags.map(tagId => getTagById(tagId)).filter(Boolean);

  if (compact) {
    return (
      <button
        onClick={onClick}
        className={cn(
          "w-full text-left p-2 rounded-lg border bg-card hover:bg-surface-hover transition-colors",
          event.isBlackSwan && "border-amber-400 dark:border-amber-600"
        )}
      >
        <div className="flex items-center gap-2">
          <TypeIcon className={cn("h-3.5 w-3.5 flex-shrink-0", typeConfig.color)} />
          <span className="text-sm font-medium truncate">{event.name}</span>
          {event.isBlackSwan && <span className="text-xs">🦢</span>}
        </div>
      </button>
    );
  }

  return (
    <div
      onClick={onClick}
      className={cn(
        "border rounded-xl bg-card overflow-hidden transition-all cursor-pointer",
        "hover:shadow-md hover:border-primary/30",
        event.isBlackSwan && "ring-2 ring-amber-400 dark:ring-amber-600"
      )}
    >
      {/* 头部 */}
      <div className="p-4 border-b bg-surface-hover/50">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <TypeIcon className={cn("h-4 w-4 flex-shrink-0", typeConfig.color)} />
            <h4 className="font-medium truncate">{event.name}</h4>
            {event.isBlackSwan && (
              <span className="text-sm flex-shrink-0" title="黑天鹅事件">🦢</span>
            )}
          </div>
          <span className={cn("text-xs px-2 py-0.5 rounded-full flex-shrink-0", impConfig.badge)}>
            {impConfig.label}
          </span>
        </div>

        {/* 日期信息 */}
        <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
          <div className="flex items-center gap-1">
            <Calendar className="h-3.5 w-3.5" />
            <span>{formatDateDisplay(event.date)}</span>
            {event.endDate && (
              <span> - {formatDateDisplay(event.endDate)}</span>
            )}
          </div>
          <span className={cn("text-xs", typeConfig.color)}>{typeConfig.label}</span>
        </div>
      </div>

      {/* 标签 */}
      {tags.length > 0 && (
        <div className="px-4 py-2 flex flex-wrap gap-1.5 border-b">
          {tags.slice(0, 5).map(tag => (
            <span
              key={tag!.id}
              className={cn("text-xs px-2 py-0.5 rounded-full bg-muted", tag!.color)}
            >
              {tag!.name}
            </span>
          ))}
          {tags.length > 5 && (
            <span className="text-xs text-muted-foreground">+{tags.length - 5}</span>
          )}
        </div>
      )}

      {/* 预期影响 */}
      {event.preAnalysis?.expectation && (
        <div className="px-4 py-3">
          <p className="text-sm text-muted-foreground line-clamp-2">
            {event.preAnalysis.expectation}
          </p>
        </div>
      )}

      {/* 状态指示 */}
      <div className="px-4 py-2 border-t bg-surface-hover/30 flex items-center justify-between">
        <div className="flex items-center gap-2">
          {event.status === 'completed' && (
            <span className="text-xs text-green-600 dark:text-green-400">已完成复盘</span>
          )}
          {event.status === 'ongoing' && (
            <span className="text-xs text-blue-600 dark:text-blue-400">进行中</span>
          )}
          {event.status === 'pending' && (
            <span className="text-xs text-muted-foreground">待处理</span>
          )}
        </div>

        {/* 相关股票 */}
        {event.relatedStocks && event.relatedStocks.length > 0 && (
          <div className="text-xs text-muted-foreground">
            {event.relatedStocks.slice(0, 3).join(', ')}
            {event.relatedStocks.length > 3 && ` +${event.relatedStocks.length - 3}`}
          </div>
        )}
      </div>
    </div>
  );
}

// 迷你事件指示点（用于日历视图）
export function EventDot({ event }: { event: MarketEvent }) {
  const typeConfig = eventTypeConfig[event.eventType];

  return (
    <div
      className={cn(
        "w-1.5 h-1.5 rounded-full flex-shrink-0",
        event.eventType === 'fixed' && "bg-blue-500",
        event.eventType === 'periodic' && "bg-orange-500",
        event.eventType === 'potential' && "bg-gray-400",
        event.isBlackSwan && "ring-2 ring-amber-400"
      )}
      title={event.name}
    />
  );
}
