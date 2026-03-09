import { useState, useEffect } from 'react';
import { X, Save, Trash2, ChevronDown, ChevronRight, AlertTriangle } from 'lucide-react';
import type { MarketEvent, EventType, EventImportance, EventStatus, RepeatType } from '../../../types/event';
import { eventService } from '../../../services/eventService';
import { TagSelector } from './TagSelector';
import { cn } from '../../../lib/utils';

interface EventEditorProps {
  event?: MarketEvent | null;
  defaultDate?: string;
  onSave: () => void;
  onCancel: () => void;
  onDelete?: () => void;
}

export function EventEditor({ event, defaultDate, onSave, onCancel, onDelete }: EventEditorProps) {
  const [formData, setFormData] = useState<Partial<MarketEvent>>(() => {
    if (event) {
      return { ...event };
    }
    return {
      name: '',
      date: defaultDate || new Date().toISOString().split('T')[0],
      eventType: 'fixed',
      importance: 'medium',
      status: 'pending',
      tags: [],
      relatedStocks: [],
      relatedSectors: [],
      isBlackSwan: false,
    };
  });

  const [showPreAnalysis, setShowPreAnalysis] = useState(!!event?.preAnalysis);
  const [showPostReview, setShowPostReview] = useState(!!event?.postReview);
  const [showRepeat, setShowRepeat] = useState(!!event?.repeatRule);
  const [loading, setLoading] = useState(false);

  // 事前分析数据
  const [preAnalysis, setPreAnalysis] = useState({
    expectation: event?.preAnalysis?.expectation || '',
    strategy: event?.preAnalysis?.strategy || '',
  });

  // 事后记录数据
  const [postReview, setPostReview] = useState({
    actualImpact: event?.postReview?.actualImpact || '',
    summary: event?.postReview?.summary || '',
    lessons: event?.postReview?.lessons || '',
  });

  // 重复规则数据
  const [repeatRule, setRepeatRule] = useState({
    type: event?.repeatRule?.type || 'none' as RepeatType,
    interval: event?.repeatRule?.interval || 1,
    endDate: event?.repeatRule?.endDate || '',
  });

  // 更新表单字段
  const updateField = <K extends keyof MarketEvent>(field: K, value: MarketEvent[K]) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  // 保存事件
  const handleSave = async () => {
    if (!formData.name?.trim()) {
      alert('请输入事件名称');
      return;
    }

    setLoading(true);
    try {
      const eventData: MarketEvent = {
        id: event?.id || '',
        name: formData.name || '',
        date: formData.date || new Date().toISOString().split('T')[0],
        endDate: formData.endDate,
        eventType: formData.eventType || 'fixed',
        importance: formData.importance || 'medium',
        status: formData.status || 'pending',
        tags: formData.tags || [],
        relatedStocks: formData.relatedStocks || [],
        relatedSectors: formData.relatedSectors || [],
        isBlackSwan: formData.isBlackSwan,
        createdAt: event?.createdAt || Date.now(),
        updatedAt: Date.now(),
      };

      // 添加事前分析
      if (showPreAnalysis && (preAnalysis.expectation || preAnalysis.strategy)) {
        eventData.preAnalysis = {
          expectation: preAnalysis.expectation,
          strategy: preAnalysis.strategy,
          createdAt: event?.preAnalysis?.createdAt || Date.now(),
          updatedAt: Date.now(),
        };
      }

      // 添加事后记录
      if (showPostReview && (postReview.actualImpact || postReview.summary || postReview.lessons)) {
        eventData.postReview = {
          actualImpact: postReview.actualImpact,
          summary: postReview.summary,
          lessons: postReview.lessons,
          completedAt: Date.now(),
        };
      }

      // 添加重复规则
      if (showRepeat && repeatRule.type !== 'none') {
        eventData.repeatRule = {
          type: repeatRule.type,
          interval: repeatRule.interval,
          endDate: repeatRule.endDate || undefined,
        };
      }

      // 创建或更新
      if (event) {
        await eventService.saveEvent(eventData);
      } else {
        const newEvent = eventService.createEvent(eventData);
        await eventService.saveEvent(newEvent);
      }

      onSave();
    } catch (error) {
      console.error('保存事件失败:', error);
      alert('保存失败，请重试');
    } finally {
      setLoading(false);
    }
  };

  // 删除事件
  const handleDelete = async () => {
    if (!event || !onDelete) return;

    if (!confirm('确定要删除这个事件吗？此操作不可恢复。')) return;

    setLoading(true);
    try {
      await eventService.deleteEvent(event.id);
      onDelete();
    } catch (error) {
      console.error('删除事件失败:', error);
      alert('删除失败，请重试');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-card rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* 头部 */}
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="text-lg font-semibold">
            {event ? '编辑事件' : '新建事件'}
          </h2>
          <button
            onClick={onCancel}
            className="p-2 hover:bg-surface-hover rounded-lg transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* 表单内容 */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {/* 基本信息 */}
          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium mb-1">
                事件名称 <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.name || ''}
                onChange={e => updateField('name', e.target.value)}
                className="w-full px-3 py-2 border rounded-lg bg-background focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
                placeholder="输入事件名称"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium mb-1">开始日期</label>
                <input
                  type="date"
                  value={formData.date || ''}
                  onChange={e => updateField('date', e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg bg-background focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">结束日期（可选）</label>
                <input
                  type="date"
                  value={formData.endDate || ''}
                  onChange={e => updateField('endDate', e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg bg-background focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="block text-sm font-medium mb-1">事件类型</label>
                <select
                  value={formData.eventType || 'fixed'}
                  onChange={e => updateField('eventType', e.target.value as EventType)}
                  className="w-full px-3 py-2 border rounded-lg bg-background focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
                >
                  <option value="fixed">固定日程</option>
                  <option value="periodic">周期事件</option>
                  <option value="potential">潜在事件</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">重要程度</label>
                <select
                  value={formData.importance || 'medium'}
                  onChange={e => updateField('importance', e.target.value as EventImportance)}
                  className="w-full px-3 py-2 border rounded-lg bg-background focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
                >
                  <option value="high">高</option>
                  <option value="medium">中</option>
                  <option value="low">低</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">状态</label>
                <select
                  value={formData.status || 'pending'}
                  onChange={e => updateField('status', e.target.value as EventStatus)}
                  className="w-full px-3 py-2 border rounded-lg bg-background focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
                >
                  <option value="pending">待处理</option>
                  <option value="ongoing">进行中</option>
                  <option value="completed">已完成</option>
                </select>
              </div>
            </div>

            {/* 黑天鹅标识（仅潜在事件） */}
            {formData.eventType === 'potential' && (
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.isBlackSwan || false}
                  onChange={e => updateField('isBlackSwan', e.target.checked)}
                  className="w-4 h-4 rounded border-gray-300 text-primary focus:ring-primary"
                />
                <span className="text-sm">标记为黑天鹅事件 🦢</span>
              </label>
            )}
          </div>

          {/* 标签选择 */}
          <div>
            <label className="block text-sm font-medium mb-2">标签</label>
            <TagSelector
              selectedTags={formData.tags || []}
              onChange={tags => updateField('tags', tags)}
            />
          </div>

          {/* 相关股票/板块 */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium mb-1">相关股票</label>
              <input
                type="text"
                value={formData.relatedStocks?.join(', ') || ''}
                onChange={e => updateField('relatedStocks', e.target.value.split(',').map(s => s.trim()).filter(Boolean))}
                className="w-full px-3 py-2 border rounded-lg bg-background focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
                placeholder="用逗号分隔多个股票代码"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">相关板块</label>
              <input
                type="text"
                value={formData.relatedSectors?.join(', ') || ''}
                onChange={e => updateField('relatedSectors', e.target.value.split(',').map(s => s.trim()).filter(Boolean))}
                className="w-full px-3 py-2 border rounded-lg bg-background focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
                placeholder="用逗号分隔多个板块名称"
              />
            </div>
          </div>

          {/* 重复规则 */}
          <div className="border rounded-lg">
            <button
              type="button"
              onClick={() => setShowRepeat(!showRepeat)}
              className="w-full flex items-center justify-between p-3 hover:bg-surface-hover transition-colors"
            >
              <span className="font-medium">重复规则</span>
              {showRepeat ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
            </button>
            {showRepeat && (
              <div className="px-3 pb-3 space-y-3 border-t">
                <div className="grid grid-cols-2 gap-3 pt-3">
                  <div>
                    <label className="block text-sm mb-1">重复类型</label>
                    <select
                      value={repeatRule.type}
                      onChange={e => setRepeatRule(prev => ({ ...prev, type: e.target.value as RepeatType }))}
                      className="w-full px-3 py-2 border rounded-lg bg-background text-sm"
                    >
                      <option value="none">不重复</option>
                      <option value="daily">每天</option>
                      <option value="weekly">每周</option>
                      <option value="monthly">每月</option>
                      <option value="yearly">每年</option>
                    </select>
                  </div>
                  {repeatRule.type !== 'none' && (
                    <>
                      <div>
                        <label className="block text-sm mb-1">间隔</label>
                        <input
                          type="number"
                          min={1}
                          value={repeatRule.interval}
                          onChange={e => setRepeatRule(prev => ({ ...prev, interval: parseInt(e.target.value) || 1 }))}
                          className="w-full px-3 py-2 border rounded-lg bg-background text-sm"
                        />
                      </div>
                      <div className="col-span-2">
                        <label className="block text-sm mb-1">结束日期（可选）</label>
                        <input
                          type="date"
                          value={repeatRule.endDate}
                          onChange={e => setRepeatRule(prev => ({ ...prev, endDate: e.target.value }))}
                          className="w-full px-3 py-2 border rounded-lg bg-background text-sm"
                        />
                      </div>
                    </>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* 事前分析 */}
          <div className="border rounded-lg">
            <button
              type="button"
              onClick={() => setShowPreAnalysis(!showPreAnalysis)}
              className="w-full flex items-center justify-between p-3 hover:bg-surface-hover transition-colors"
            >
              <span className="font-medium">事前分析</span>
              {showPreAnalysis ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
            </button>
            {showPreAnalysis && (
              <div className="px-3 pb-3 space-y-3 border-t">
                <div className="pt-3">
                  <label className="block text-sm mb-1">预期影响</label>
                  <textarea
                    value={preAnalysis.expectation}
                    onChange={e => setPreAnalysis(prev => ({ ...prev, expectation: e.target.value }))}
                    className="w-full px-3 py-2 border rounded-lg bg-background text-sm resize-none focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
                    rows={3}
                    placeholder="分析该事件可能带来的影响..."
                  />
                </div>
                <div>
                  <label className="block text-sm mb-1">应对策略</label>
                  <textarea
                    value={preAnalysis.strategy}
                    onChange={e => setPreAnalysis(prev => ({ ...prev, strategy: e.target.value }))}
                    className="w-full px-3 py-2 border rounded-lg bg-background text-sm resize-none focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
                    rows={3}
                    placeholder="计划如何应对该事件..."
                  />
                </div>
              </div>
            )}
          </div>

          {/* 事后记录 */}
          <div className="border rounded-lg">
            <button
              type="button"
              onClick={() => setShowPostReview(!showPostReview)}
              className="w-full flex items-center justify-between p-3 hover:bg-surface-hover transition-colors"
            >
              <span className="font-medium">事后记录</span>
              {showPostReview ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
            </button>
            {showPostReview && (
              <div className="px-3 pb-3 space-y-3 border-t">
                <div className="pt-3">
                  <label className="block text-sm mb-1">实际影响</label>
                  <textarea
                    value={postReview.actualImpact}
                    onChange={e => setPostReview(prev => ({ ...prev, actualImpact: e.target.value }))}
                    className="w-full px-3 py-2 border rounded-lg bg-background text-sm resize-none focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
                    rows={3}
                    placeholder="记录事件的实际影响..."
                  />
                </div>
                <div>
                  <label className="block text-sm mb-1">复盘总结</label>
                  <textarea
                    value={postReview.summary}
                    onChange={e => setPostReview(prev => ({ ...prev, summary: e.target.value }))}
                    className="w-full px-3 py-2 border rounded-lg bg-background text-sm resize-none focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
                    rows={3}
                    placeholder="总结本次事件的应对情况..."
                  />
                </div>
                <div>
                  <label className="block text-sm mb-1">经验教训</label>
                  <textarea
                    value={postReview.lessons}
                    onChange={e => setPostReview(prev => ({ ...prev, lessons: e.target.value }))}
                    className="w-full px-3 py-2 border rounded-lg bg-background text-sm resize-none focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
                    rows={3}
                    placeholder="记录从中学到的经验..."
                  />
                </div>
              </div>
            )}
          </div>
        </div>

        {/* 底部操作 */}
        <div className="flex items-center justify-between p-4 border-t bg-surface-hover/30">
          <div>
            {event && onDelete && (
              <button
                onClick={handleDelete}
                disabled={loading}
                className="flex items-center gap-2 px-4 py-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
              >
                <Trash2 className="h-4 w-4" />
                删除
              </button>
            )}
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={onCancel}
              disabled={loading}
              className="px-4 py-2 border rounded-lg hover:bg-surface-hover transition-colors"
            >
              取消
            </button>
            <button
              onClick={handleSave}
              disabled={loading}
              className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:opacity-90 transition-opacity"
            >
              <Save className="h-4 w-4" />
              {loading ? '保存中...' : '保存'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
