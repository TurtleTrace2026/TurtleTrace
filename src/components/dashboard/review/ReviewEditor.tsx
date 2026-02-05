import { useState, useEffect } from 'react';
import { Save, Download, Calendar } from 'lucide-react';
import { reviewService } from '../../../services/reviewService';
import type { DailyReview } from '../../../types/review';
import { ReviewCalendar } from './ReviewCalendar';
import { MarketDataSection } from './sections/MarketDataSection';
import { PositionSection } from './sections/PositionSection';
import { OperationsSection } from './sections/OperationsSection';
import { SummarySection } from './sections/SummarySection';

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

  // 导出为 Markdown
  const handleExportMarkdown = async () => {
    const markdown = await reviewService.exportToMarkdown(currentDate);
    if (!markdown) return;

    const blob = new Blob([markdown], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `复盘-${currentDate}.md`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // 导出为 PDF
  const handleExportPDF = async () => {
    await reviewService.exportToPDF(currentDate);
  };

  return (
    <div className="space-y-6">
      {/* 顶部工具栏 */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <h2 className="text-2xl font-bold">每日复盘</h2>

          <button
            onClick={() => setShowCalendar(!showCalendar)}
            className="flex items-center gap-2 px-4 py-2 border rounded-md hover:bg-accent transition-colors"
          >
            <Calendar className="h-4 w-4" />
            {currentDate}
          </button>
        </div>

        <div className="flex items-center gap-2">
          {saveMessage && (
            <span className={`text-sm ${saveMessage.includes('成功') ? 'text-green-600' : 'text-red-600'}`}>
              {saveMessage}
            </span>
          )}

          <button
            onClick={handleSave}
            disabled={isSaving}
            className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors disabled:opacity-50"
          >
            <Save className="h-4 w-4" />
            {isSaving ? '保存中...' : '保存'}
          </button>

          {/* <button
            onClick={handleExportMarkdown}
            className="flex items-center gap-2 px-4 py-2 border rounded-md hover:bg-accent transition-colors"
            title="导出为 Markdown"
          >
            <Download className="h-4 w-4" />
            MD
          </button> */}

          <button
            onClick={handleExportPDF}
            className="flex items-center gap-2 px-4 py-2 border rounded-md hover:bg-accent transition-colors"
            title="导出为 PDF"
          >
            <Download className="h-4 w-4" />
            PDF
          </button>
        </div>
      </div>

      {/* 日历弹窗 */}
      {showCalendar && (
        <div className="absolute z-50 mt-2">
          <div className="border rounded-lg bg-background shadow-lg p-2">
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
      <div className="sticky bottom-0 border-t bg-background/95 backdrop-blur p-4 flex justify-center">
        <button
          onClick={handleSave}
          disabled={isSaving}
          className="flex items-center gap-2 px-8 py-3 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50 text-lg font-medium"
        >
          <Save className="h-5 w-5" />
          {isSaving ? '保存中...' : '保存复盘'}
        </button>
      </div>
    </div>
  );
}
