import { useState, useEffect } from 'react';
import { Calendar, Trash2, Download, Edit, Share2 } from 'lucide-react';
import { reviewService } from '../../../services/reviewService';
import type { DailyReview } from '../../../types/review';
import { ReviewCalendar } from './ReviewCalendar';
import { ReviewShareDialog } from './ReviewShareDialog';

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
  const [shareReview, setShareReview] = useState<DailyReview | null>(null);

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
                    onClick={() => setShareReview(selectedReview)}
                    className="flex items-center gap-1 px-3 py-1.5 border rounded-md hover:bg-accent transition-colors text-sm"
                  >
                    <Share2 className="w-4 h-4" />
                    分享
                  </button>
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
                {/* 大盘指数 */}
                {selectedReview.marketData?.indices && selectedReview.marketData.indices.length > 0 && (
                  <div className="space-y-3">
                    <h4 className="font-semibold flex items-center gap-2">📊 大盘指数</h4>

                    {/* 指数列表 */}
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
                      {selectedReview.marketData.indices.map((idx, index) => {
                        const isPositive = idx.change >= 0;
                        const isFlat = Math.abs(idx.change) < 0.01;

                        return (
                          <div
                            key={index}
                            className="p-3 border rounded-lg bg-accent/30"
                          >
                            <div className="text-xs text-muted-foreground mb-1 truncate" title={idx.name}>
                              {idx.name}
                            </div>
                            <div className="text-sm mb-1">
                              {idx.code}
                            </div>
                            <div className={`text-sm font-medium ${
                              isFlat ? 'text-muted-foreground' : isPositive ? 'text-red-500' : 'text-green-500'
                            }`}>
                              {isFlat ? '0.00%' : `${isPositive ? '+' : ''}${idx.change.toFixed(2)}%`}
                            </div>
                            {idx.changeAmount !== undefined && (
                              <div className="text-xs text-muted-foreground">
                                {isPositive ? '+' : ''}{idx.changeAmount.toFixed(2)} 点
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>

                    {/* 市场情绪 */}
                    <div className="pt-2 border-t">
                      <div className="text-sm">
                        市场情绪: {selectedReview.marketData.marketMood === 'bullish' ? '看多📈' : selectedReview.marketData.marketMood === 'bearish' ? '看空📉' : '中性➡️'}
                      </div>
                      {selectedReview.marketData.moodNote && (
                        <div className="text-sm text-muted-foreground mt-1">{selectedReview.marketData.moodNote}</div>
                      )}
                    </div>
                  </div>
                )}

                {/* 持仓盈亏 */}
                {selectedReview.positionData && (
                  <div className="space-y-3">
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

                    {/* 个股明细 */}
                    {selectedReview.positionData.positions && selectedReview.positionData.positions.length > 0 && (
                      <div className="space-y-2">
                        <h5 className="text-sm font-medium text-muted-foreground">个股明细</h5>
                        <div className="space-y-2">
                          <div className="grid grid-cols-12 gap-2 text-sm text-muted-foreground px-3">
                            <div className="col-span-2">股票</div>
                            <div className="col-span-1 text-right">涨跌幅</div>
                            <div className="col-span-2 text-right">当日盈亏</div>
                            <div className="col-span-2 text-right">总盈亏</div>
                            <div className="col-span-1 text-right">持仓</div>
                            <div className="col-span-2 text-right">现价/成本</div>
                            <div className="col-span-2">备注</div>
                          </div>
                          {selectedReview.positionData.positions.map((pos) => {
                            const isPositive = pos.change >= 0;
                            const dailyProfitPositive = pos.dailyProfit >= 0;

                            return (
                              <div
                                key={pos.symbol}
                                className="grid grid-cols-12 gap-2 px-3 py-2 items-center border-b last:border-b-0 bg-accent/30"
                              >
                                <div className="col-span-2">
                                  <div className="font-medium">{pos.name}</div>
                                  <div className="text-xs text-muted-foreground">{pos.symbol}</div>
                                </div>
                                <div className={`col-span-1 text-right ${isPositive ? 'text-red-500' : 'text-green-500'}`}>
                                  {isPositive ? '+' : ''}{pos.change.toFixed(2)}%
                                </div>
                                <div className={`col-span-2 text-right font-medium ${dailyProfitPositive ? 'text-red-500' : 'text-green-500'}`}>
                                  {pos.dailyProfit >= 0 ? '+' : ''}¥{pos.dailyProfit.toFixed(2)}
                                </div>
                                <div className={`col-span-2 text-right text-sm ${pos.totalProfit >= 0 ? 'text-red-500' : 'text-green-500'}`}>
                                  {pos.totalProfit >= 0 ? '+' : ''}¥{pos.totalProfit.toFixed(2)}
                                </div>
                                <div className="col-span-1 text-right text-sm">
                                  {pos.quantity}
                                </div>
                                <div className="col-span-2 text-right text-sm">
                                  <div>¥{pos.currentPrice.toFixed(2)}</div>
                                  <div className="text-xs text-muted-foreground">¥{pos.costPrice.toFixed(2)}</div>
                                </div>
                                <div className="col-span-2 text-sm text-muted-foreground">
                                  {pos.note || '-'}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* 今日操作回顾 */}
                {selectedReview.operations && (
                  <div className="space-y-3">
                    <h4 className="font-semibold flex items-center gap-2">📝 今日操作回顾</h4>

                    {/* 交易记录 */}
                    {selectedReview.operations.transactions && selectedReview.operations.transactions.length > 0 && (
                      <div className="space-y-2">
                        <h5 className="text-sm font-medium text-muted-foreground">交易记录</h5>
                        <div className="space-y-2">
                          {selectedReview.operations.transactions.map((tx, index) => (
                            <div
                              key={index}
                              className="flex items-center justify-between px-3 py-2 bg-accent/30 rounded-lg"
                            >
                              <div className="flex items-center gap-3">
                                <span className={`px-2 py-1 text-xs font-medium rounded ${
                                  tx.type === 'buy' ? 'bg-red-100 text-red-600' : 'bg-green-100 text-green-600'
                                }`}>
                                  {tx.type === 'buy' ? '买入' : '卖出'}
                                </span>
                                <div>
                                  <div className="font-medium">{tx.name}</div>
                                  <div className="text-xs text-muted-foreground">{tx.symbol}</div>
                                </div>
                              </div>
                              <div className="text-right text-sm">
                                <div>¥{tx.price.toFixed(2)} × {tx.quantity}股</div>
                                <div className="text-muted-foreground">¥{tx.amount.toFixed(2)}</div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* 操作反思 */}
                    <div className="space-y-2 pt-2 border-t">
                      <h5 className="text-sm font-medium text-muted-foreground">操作反思</h5>
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

      {/* 分享对话框 */}
      {shareReview && (
        <ReviewShareDialog
          review={shareReview}
          isOpen={!!shareReview}
          onClose={() => setShareReview(null)}
        />
      )}
    </div>
  );
}
