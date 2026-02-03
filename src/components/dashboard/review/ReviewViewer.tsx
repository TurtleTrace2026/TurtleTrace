import { useState, useEffect } from 'react';
import { Calendar, Trash2, Download, Edit } from 'lucide-react';
import { reviewService } from '../../../services/reviewService';
import type { DailyReview } from '../../../types/review';
import { ReviewCalendar } from './ReviewCalendar';

interface ReviewViewerProps {
  onEditDate: (date: string) => void;
}

export function ReviewViewer({ onEditDate }: ReviewViewerProps) {
  const [reviews, setReviews] = useState<DailyReview[]>([]);
  const [selectedDate, setSelectedDate] = useState(() => {
    const today = new Date();
    return `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
  });
  const [selectedReview, setSelectedReview] = useState<DailyReview | null>(null);
  const [showCalendar, setShowCalendar] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // 加载所有复盘记录
  useEffect(() => {
    loadReviews();
  }, []);

  // 加载复盘记录
  const loadReviews = async () => {
    const data = await reviewService.getAllReviews();
    setReviews(data);
  };

  // 选择日期
  const handleSelectDate = async (date: string) => {
    setSelectedDate(date);
    const review = await reviewService.getReview(date);
    setSelectedReview(review);
    setShowCalendar(false);
  };

  // 删除复盘
  const handleDelete = async () => {
    if (!selectedReview || !confirm(`确定要删除 ${selectedReview.date} 的复盘记录吗？`)) {
      return;
    }

    setIsDeleting(true);
    const success = await reviewService.deleteReview(selectedReview.date);
    if (success) {
      setSelectedReview(null);
      await loadReviews();
    }
    setIsDeleting(false);
  };

  // 导出为 Markdown
  const handleExportMarkdown = async () => {
    if (!selectedReview) return;
    const markdown = await reviewService.exportToMarkdown(selectedReview.date);
    if (!markdown) return;

    const blob = new Blob([markdown], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `复盘-${selectedReview.date}.md`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // 导出为 PDF
  const handleExportPDF = async () => {
    if (!selectedReview) return;
    await reviewService.exportToPDF(selectedReview.date);
  };

  // 获取有复盘记录的日期列表
  const reviewDates = reviews.map(r => r.date).sort((a, b) => b.localeCompare(a));

  return (
    <div className="space-y-6">
      {/* 顶部工具栏 */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <h2 className="text-2xl font-bold">历史复盘</h2>

          <button
            onClick={() => setShowCalendar(!showCalendar)}
            className="flex items-center gap-2 px-4 py-2 border rounded-md hover:bg-accent transition-colors"
          >
            <Calendar className="h-4 w-4" />
            {selectedDate}
          </button>

          <span className="text-sm text-muted-foreground">
            共 {reviews.length} 条复盘记录
          </span>
        </div>
      </div>

      {/* 日历弹窗 */}
      {showCalendar && (
        <div className="absolute z-50 mt-2">
          <div className="border rounded-lg bg-background shadow-lg p-2">
            <ReviewCalendar
              reviews={reviews}
              selectedDate={selectedDate}
              onSelectDate={handleSelectDate}
            />
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* 左侧：日期列表 */}
        <div className="lg:col-span-1">
          <div className="border rounded-lg bg-card p-4">
            <h3 className="font-semibold mb-3">复盘日期</h3>
            <div className="space-y-1 max-h-[500px] overflow-y-auto">
              {reviewDates.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground text-sm">
                  暂无复盘记录
                </div>
              ) : (
                reviewDates.map(date => (
                  <button
                    key={date}
                    onClick={() => handleSelectDate(date)}
                    className={`w-full text-left px-3 py-2 rounded-md transition-colors ${
                      selectedDate === date
                        ? 'bg-primary text-primary-foreground'
                        : 'hover:bg-accent'
                    }`}
                  >
                    <div className="font-medium">{date}</div>
                    <div className="text-xs opacity-70">
                      {reviews.find(r => r.date === date)?.summary?.slice(0, 20) || '无总结'}
                    </div>
                  </button>
                ))
              )}
            </div>
          </div>
        </div>

        {/* 右侧：复盘内容 */}
        <div className="lg:col-span-3">
          {!selectedReview ? (
            <div className="border rounded-lg bg-card p-12 text-center">
              <div className="text-muted-foreground mb-4">选择一个日期查看复盘</div>
              {selectedDate && !reviews.find(r => r.date === selectedDate) && (
                <button
                  onClick={() => onEditDate(selectedDate)}
                  className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
                >
                  创建该日复盘
                </button>
              )}
            </div>
          ) : (
            <div className="border rounded-lg bg-card">
              {/* 复盘头部 */}
              <div className="border-b p-4 flex items-center justify-between">
                <div>
                  <h3 className="text-xl font-bold">{selectedReview.date} 复盘</h3>
                  <div className="text-sm text-muted-foreground mt-1">
                    创建于 {new Date(selectedReview.createdAt).toLocaleString('zh-CN')}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => onEditDate(selectedReview.date)}
                    className="flex items-center gap-1 px-3 py-1.5 border rounded-md hover:bg-accent transition-colors text-sm"
                  >
                    <Edit className="w-4 h-4" />
                    编辑
                  </button>
                  <button
                    onClick={handleExportMarkdown}
                    className="flex items-center gap-1 px-3 py-1.5 border rounded-md hover:bg-accent transition-colors text-sm"
                  >
                    <Download className="w-4 h-4" />
                    MD
                  </button>
                  <button
                    onClick={handleExportPDF}
                    className="flex items-center gap-1 px-3 py-1.5 border rounded-md hover:bg-accent transition-colors text-sm"
                  >
                    <Download className="w-4 h-4" />
                    PDF
                  </button>
                  <button
                    onClick={handleDelete}
                    disabled={isDeleting}
                    className="flex items-center gap-1 px-3 py-1.5 border border-red-200 text-red-600 rounded-md hover:bg-red-50 transition-colors text-sm disabled:opacity-50"
                  >
                    <Trash2 className="w-4 h-4" />
                    删除
                  </button>
                </div>
              </div>

              {/* 复盘内容 */}
              <div className="p-6 space-y-6 max-h-[600px] overflow-y-auto">
                {/* 市场情绪 */}
                {selectedReview.marketData && (
                  <div className="space-y-2">
                    <h4 className="font-semibold flex items-center gap-2">📊 大盘指数</h4>
                    <div className="text-sm">
                      市场情绪: {selectedReview.marketData.marketMood === 'bullish' ? '看多📈' : selectedReview.marketData.marketMood === 'bearish' ? '看空📉' : '中性➡️'}
                    </div>
                    {selectedReview.marketData.moodNote && (
                      <div className="text-sm text-muted-foreground">{selectedReview.marketData.moodNote}</div>
                    )}
                  </div>
                )}

                {/* 持仓盈亏 */}
                {selectedReview.positionData && (
                  <div className="space-y-2">
                    <h4 className="font-semibold flex items-center gap-2">💼 持仓盈亏</h4>
                    <div className="grid grid-cols-4 gap-4 text-center p-3 bg-accent/50 rounded-lg">
                      <div>
                        <div className="text-xs text-muted-foreground">当日盈亏</div>
                        <div className={`text-lg font-bold ${selectedReview.positionData.dailySummary.totalProfit >= 0 ? 'text-red-500' : 'text-green-500'}`}>
                          {selectedReview.positionData.dailySummary.totalProfit >= 0 ? '+' : ''}¥{selectedReview.positionData.dailySummary.totalProfit.toFixed(2)}
                        </div>
                      </div>
                      <div>
                        <div className="text-xs text-muted-foreground">盈利</div>
                        <div className="text-lg font-bold text-red-500">{selectedReview.positionData.dailySummary.winCount}</div>
                      </div>
                      <div>
                        <div className="text-xs text-muted-foreground">亏损</div>
                        <div className="text-lg font-bold text-green-500">{selectedReview.positionData.dailySummary.lossCount}</div>
                      </div>
                      <div>
                        <div className="text-xs text-muted-foreground">胜率</div>
                        <div className="text-lg font-bold">{(selectedReview.positionData.dailySummary.winRate * 100).toFixed(1)}%</div>
                      </div>
                    </div>
                  </div>
                )}

                {/* 操作反思 */}
                {selectedReview.operations && (
                  <div className="space-y-2">
                    <h4 className="font-semibold flex items-center gap-2">📝 操作反思</h4>
                    {selectedReview.operations.reflection.whatWorked && (
                      <div className="text-sm">
                        <span className="text-green-600 font-medium">✓ 做得好的地方: </span>
                        {selectedReview.operations.reflection.whatWorked}
                      </div>
                    )}
                    {selectedReview.operations.reflection.whatFailed && (
                      <div className="text-sm">
                        <span className="text-red-600 font-medium">✗ 需要改进: </span>
                        {selectedReview.operations.reflection.whatFailed}
                      </div>
                    )}
                    {selectedReview.operations.reflection.lessons && (
                      <div className="text-sm">
                        <span className="text-yellow-600 font-medium">💡 经验教训: </span>
                        {selectedReview.operations.reflection.lessons}
                      </div>
                    )}
                  </div>
                )}

                {/* 总结感悟 */}
                {selectedReview.summary && (
                  <div className="space-y-2">
                    <h4 className="font-semibold flex items-center gap-2">💭 总结感悟</h4>
                    <div className="text-sm whitespace-pre-wrap bg-accent/50 rounded-lg p-4">
                      {selectedReview.summary}
                    </div>
                  </div>
                )}

                {/* 如果没有任何内容 */}
                {!selectedReview.marketData && !selectedReview.positionData && !selectedReview.operations && !selectedReview.summary && (
                  <div className="text-center py-8 text-muted-foreground">
                    该复盘记录暂无内容
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
