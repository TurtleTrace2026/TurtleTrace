import { useState, useEffect } from 'react';
import { Save, Download, Calendar, FileEdit, CheckCircle, AlertCircle } from 'lucide-react';
import { Card } from '../../ui/card';
import { Badge } from '../../ui/badge';
import { reviewService } from '../../../services/reviewService';
import type { DailyReview } from '../../../types/review';
import { ReviewCalendar } from './ReviewCalendar';
import { MarketDataSection } from './sections/MarketDataSection';
import { PositionSection } from './sections/PositionSection';
import { OperationsSection } from './sections/OperationsSection';
import { SummarySection } from './sections/SummarySection';
import { cn } from '../../../lib/utils';

interface ReviewEditorProps {
  date: string;
  existingReview?: DailyReview;
  onSave?: (review: DailyReview) => void;
}

export function ReviewEditor({ date, existingReview, onSave }: ReviewEditorProps) {
  const [showCalendar, setShowCalendar] = useState(false);
  const [currentDate, setCurrentDate] = useState(date);
  const [review, setReview] = useState<Partial<DailyReview>>(() => {
    if (existingReview) {
      return existingReview;
    }
    return {
      id: date,
      date,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
  });
  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState('');
  const [allReviews, setAllReviews] = useState<DailyReview[]>([]);

  // 加载所有复盘记录
  useEffect(() => {
    reviewService.getAllReviews().then(setAllReviews);
  }, []);

  // 切换日期
  const handleDateChange = async (newDate: string) => {
    setCurrentDate(newDate);
    const existing = await reviewService.getReview(newDate);

    if (existing) {
      setReview(existing);
    } else {
      setReview({
        id: newDate,
        date: newDate,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      });
    }

    setShowCalendar(false);
  };

  // 更新复盘数据
  const updateReview = (updates: Partial<DailyReview>) => {
    setReview((prev: any) => ({
      ...prev,
      ...updates,
      updatedAt: Date.now(),
    }));
  };

  // 保存复盘
  const handleSave = async () => {
    setIsSaving(true);
    setSaveMessage('');

    const completeReview: DailyReview = {
      id: review.id || review.date!,
      date: review.date!,
      createdAt: (review as any).createdAt || Date.now(),
      updatedAt: Date.now(),
      marketData: review.marketData,
      positionData: review.positionData,
      operations: review.operations,
      summary: review.summary,
    };

    const success = await reviewService.saveReview(completeReview);

    if (success) {
      setSaveMessage('保存成功');
      setReview(completeReview);

      // 刷新复盘列表
      const reviews = await reviewService.getAllReviews();
      setAllReviews(reviews);

      onSave?.(completeReview);

      setTimeout(() => setSaveMessage(''), 3000);
    } else {
      setSaveMessage('保存失败');
      setTimeout(() => setSaveMessage(''), 3000);
    }

    setIsSaving(false);
  };

  // 导出为 PDF
  const handleExportPDF = async () => {
    await reviewService.exportToPDF(currentDate);
  };

  return (
    <div className="space-y-6">
      {/* 顶部工具栏 */}
      <Card className="p-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-info/10 rounded-lg">
                <FileEdit className="h-5 w-5 text-info" />
              </div>
              <div>
                <h2 className="text-xl font-bold">每日复盘</h2>
                <p className="text-sm text-muted-foreground">记录每日交易与心得</p>
              </div>
            </div>

            <button
              onClick={() => setShowCalendar(!showCalendar)}
              className={cn(
                "flex items-center gap-2 px-4 py-2 border rounded-lg transition-all font-mono",
                showCalendar ? "bg-primary/10 border-primary text-primary" : "hover:bg-surface-hover"
              )}
            >
              <Calendar className="h-4 w-4" />
              {currentDate}
            </button>
          </div>

          <div className="flex items-center gap-2">
            {saveMessage && (
              <Badge variant={saveMessage.includes('成功') ? 'default' : 'destructive'} className="gap-1.5">
                {saveMessage.includes('成功') ? (
                  <CheckCircle className="h-3 w-3" />
                ) : (
                  <AlertCircle className="h-3 w-3" />
                )}
                {saveMessage}
              </Badge>
            )}

            <button
              onClick={handleSave}
              disabled={isSaving}
              className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-all disabled:opacity-50 font-medium"
            >
              <Save className="h-4 w-4" />
              {isSaving ? '保存中...' : '保存'}
            </button>

            <button
              onClick={handleExportPDF}
              className="flex items-center gap-2 px-4 py-2 border rounded-lg hover:bg-surface-hover transition-all"
              title="导出为 PDF"
            >
              <Download className="h-4 w-4" />
              <span className="hidden sm:inline">PDF</span>
            </button>
          </div>
        </div>
      </Card>

      {/* 日历弹窗 */}
      {showCalendar && (
        <div className="relative z-50">
          <div className="border rounded-xl bg-card shadow-lg p-3">
            <ReviewCalendar
              reviews={allReviews}
              selectedDate={currentDate}
              onSelectDate={handleDateChange}
            />
          </div>
        </div>
      )}

      {/* 复盘板块 */}
      <div className="space-y-4">
        {/* 1️⃣ 大盘指数与关键数据 */}
        <MarketDataSection
          data={review.marketData}
          onChange={(marketData) => updateReview({ marketData })}
        />

        {/* 3️⃣ 持仓买卖情况 */}
        <PositionSection
          data={review.positionData}
          onChange={(positionData) => updateReview({ positionData })}
          date={currentDate}
        />

        {/* 6️⃣ 今日操作回顾与反思 */}
        <OperationsSection
          data={review.operations}
          onChange={(operations) => updateReview({ operations })}
          date={currentDate}
        />

        {/* 8️⃣ 总结感悟 */}
        <SummarySection
          value={review.summary || ''}
          onChange={(summary) => updateReview({ summary })}
        />
      </div>

      {/* 底部保存栏 */}
      <div className="sticky bottom-0 border-t bg-background/95 backdrop-blur-sm p-4 flex justify-center">
        <button
          onClick={handleSave}
          disabled={isSaving}
          className="flex items-center gap-2 px-8 py-3 bg-primary text-primary-foreground rounded-xl hover:bg-primary/90 transition-all disabled:opacity-50 text-lg font-medium shadow-sm"
        >
          <Save className="h-5 w-5" />
          {isSaving ? '保存中...' : '保存复盘'}
        </button>
      </div>
    </div>
  );
}
