import { useState, useEffect } from 'react';
import { Calendar, Trash2, Download, Edit, Share2, FileText, TrendingUp, TrendingDown, Minus, Sparkles, Loader2, Image } from 'lucide-react';
import { Card } from '../../ui/card';
import { Badge } from '../../ui/badge';
import { Button } from '../../ui/button';
import { reviewService } from '../../../services/reviewService';
import type { DailyReview } from '../../../types/review';
import type { Position, ProfitSummary } from '../../../types';
import { ReviewCalendar } from './ReviewCalendar';
import { ReviewShareDialog } from './ReviewShareDialog';
import { DailyReviewAnalysisDialog } from './DailyReviewAnalysisDialog';
import { EnhancedShareDialog } from '../../share';
import { cn } from '../../../lib/utils';

interface ReviewViewerProps {
  onEditDate: (date: string) => void;
  positions?: Position[];
  profitSummary?: ProfitSummary;
}

export function ReviewViewer({ onEditDate, positions = [], profitSummary }: ReviewViewerProps) {
  const [reviews, setReviews] = useState<DailyReview[]>([]);
  const [selectedDate, setSelectedDate] = useState(() => {
    const today = new Date();
    return `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
  });
  const [selectedReview, setSelectedReview] = useState<DailyReview | null>(null);
  const [showCalendar, setShowCalendar] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [shareReview, setShareReview] = useState<DailyReview | null>(null);
  const [enhancedShareOpen, setEnhancedShareOpen] = useState(false);
  const [analysisReview, setAnalysisReview] = useState<DailyReview | null>(null);

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
      <Card className="p-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-info/10 rounded-lg">
                <FileText className="h-5 w-5 text-info" />
              </div>
              <div>
                <h2 className="text-xl font-bold">历史复盘</h2>
                <p className="text-sm text-muted-foreground">
                  共 {reviews.length} 条复盘记录
                </p>
              </div>
            </div>

            <button
              onClick={() => setShowCalendar(!showCalendar)}
              className={cn(
                "flex items-center gap-2 px-4 py-2 border rounded-lg transition-all",
                showCalendar ? "bg-primary/10 border-primary text-primary" : "hover:bg-surface-hover"
              )}
            >
              <Calendar className="h-4 w-4" />
              <span className="font-mono">{selectedDate}</span>
            </button>
          </div>

          <Badge variant="outline" className="text-sm px-3 py-1">
            {reviews.length} 条记录
          </Badge>
        </div>
      </Card>

      {/* 日历弹窗 */}
      {showCalendar && (
        <div className="relative z-50">
          <div className="border rounded-xl bg-card shadow-lg p-3">
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
          <Card className="p-4 h-fit">
            <h3 className="font-semibold mb-3 flex items-center gap-2">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              复盘日期
            </h3>
            <div className="space-y-1 max-h-[500px] overflow-y-auto scrollbar-thin">
              {reviewDates.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground text-sm">
                  暂无复盘记录
                </div>
              ) : (
                reviewDates.map(date => {
                  const review = reviews.find(r => r.date === date);
                  const hasProfit = review?.positionData?.dailySummary?.totalProfit ?? 0;
                  const profitColor = hasProfit >= 0 ? 'text-up' : 'text-down';

                  return (
                    <button
                      key={date}
                      onClick={() => handleSelectDate(date)}
                      className={cn(
                        "w-full text-left px-3 py-2.5 rounded-lg transition-all border",
                        selectedDate === date
                          ? 'bg-primary text-primary-foreground border-primary'
                          : 'hover:bg-surface-hover border-transparent'
                      )}
                    >
                      <div className="font-medium font-mono">{date}</div>
                      <div className={cn("text-xs mt-1 truncate", selectedDate === date ? "opacity-80" : "text-muted-foreground")}>
                        {review?.summary?.slice(0, 20) || '无总结'}
                      </div>
                      {review?.positionData && (
                        <div className={cn("text-xs mt-1 font-mono", selectedDate === date ? "" : profitColor)}>
                          {hasProfit >= 0 ? '+' : ''}¥{hasProfit.toFixed(2)}
                        </div>
                      )}
                    </button>
                  );
                })
              )}
            </div>
          </Card>
        </div>

        {/* 右侧：复盘内容 */}
        <div className="lg:col-span-3">
          {!selectedReview ? (
            <Card className="p-12 text-center">
              <FileText className="h-16 w-16 mx-auto mb-4 text-muted-foreground/30" />
              <p className="text-muted-foreground mb-4">选择一个日期查看复盘</p>
              {selectedDate && !reviews.find(r => r.date === selectedDate) && (
                <button
                  onClick={() => onEditDate(selectedDate)}
                  className="px-6 py-2.5 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors font-medium"
                >
                  创建该日复盘
                </button>
              )}
            </Card>
          ) : (
            <Card className="overflow-hidden">
              {/* 复盘头部 */}
              <div className="border-b bg-surface/50 p-4 flex items-center justify-between">
                <div>
                  <h3 className="text-xl font-bold flex items-center gap-2">
                    {selectedReview.date} 复盘
                    <Badge variant="outline" className="text-xs">每日</Badge>
                  </h3>
                  <div className="text-sm text-muted-foreground mt-1">
                    创建于 {new Date(selectedReview.createdAt).toLocaleString('zh-CN')}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setAnalysisReview(selectedReview)}
                    className="flex items-center gap-1.5 px-3 py-2 rounded-lg hover:bg-primary/10 transition-colors text-sm text-primary"
                    title="AI评价"
                  >
                    <Sparkles className="w-4 h-4" />
                    <span className="hidden sm:inline">AI评价</span>
                  </button>
                  <button
                    onClick={() => setShareReview(selectedReview)}
                    className="flex items-center gap-1.5 px-3 py-2 rounded-lg hover:bg-surface-hover transition-colors text-sm"
                    title="分享复盘"
                  >
                    <Share2 className="w-4 h-4" />
                    <span className="hidden sm:inline">分享</span>
                  </button>
                  <button
                    onClick={() => setEnhancedShareOpen(true)}
                    className="flex items-center gap-1.5 px-3 py-2 rounded-lg hover:bg-primary/10 transition-colors text-sm text-primary"
                    title="生成分享图片"
                  >
                    <Image className="w-4 h-4" />
                    <span className="hidden sm:inline">图片分享</span>
                  </button>
                  <button
                    onClick={() => onEditDate(selectedReview.date)}
                    className="flex items-center gap-1.5 px-3 py-2 rounded-lg hover:bg-surface-hover transition-colors text-sm"
                    title="编辑复盘"
                  >
                    <Edit className="w-4 h-4" />
                    <span className="hidden sm:inline">编辑</span>
                  </button>
                  <button
                    onClick={handleExportMarkdown}
                    className="flex items-center gap-1.5 px-3 py-2 rounded-lg hover:bg-surface-hover transition-colors text-sm"
                    title="导出为 Markdown"
                  >
                    <Download className="w-4 h-4" />
                    <span className="hidden sm:inline">MD</span>
                  </button>
                  <button
                    onClick={handleExportPDF}
                    className="flex items-center gap-1.5 px-3 py-2 rounded-lg hover:bg-surface-hover transition-colors text-sm"
                    title="导出为 PDF"
                  >
                    <Download className="w-4 h-4" />
                    <span className="hidden sm:inline">PDF</span>
                  </button>
                  <button
                    onClick={handleDelete}
                    disabled={isDeleting}
                    className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-destructive hover:bg-destructive/10 transition-colors text-sm disabled:opacity-50"
                    title="删除复盘"
                  >
                    <Trash2 className="w-4 h-4" />
                    <span className="hidden sm:inline">删除</span>
                  </button>
                </div>
              </div>

              {/* 复盘内容 */}
              <div className="p-6 space-y-6 max-h-[600px] overflow-y-auto scrollbar-thin">
                {/* 大盘指数 */}
                {selectedReview.marketData?.indices && selectedReview.marketData.indices.length > 0 && (
                  <div className="space-y-3">
                    <h4 className="font-semibold flex items-center gap-2">📊 大盘指数</h4>

                    {/* 指数列表 */}
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
                      {selectedReview.marketData.indices.map((idx, index) => {
                        const isPositive = idx.change >= 0;
                        const isFlat = Math.abs(idx.change) < 0.01;
                        const trendColor = isFlat ? 'text-flat' : isPositive ? 'text-up' : 'text-down';
                        const trendBg = isFlat ? 'bg-flat/10' : isPositive ? 'bg-up/10' : 'bg-down/10';
                        const TrendIcon = isFlat ? Minus : isPositive ? TrendingUp : TrendingDown;

                        return (
                          <div
                            key={index}
                            className={cn("p-3 rounded-lg border transition-all", trendBg)}
                          >
                            <div className="text-xs text-muted-foreground mb-1 truncate" title={idx.name}>
                              {idx.name}
                            </div>
                            <div className="text-sm mb-1 font-mono">
                              {idx.code}
                            </div>
                            <div className={cn("text-sm font-medium flex items-center gap-1", trendColor)}>
                              <TrendIcon className="h-3 w-3" />
                              {isFlat ? '0.00%' : `${isPositive ? '+' : ''}${idx.change.toFixed(2)}%`}
                            </div>
                            {idx.changeAmount !== undefined && (
                              <div className="text-xs text-muted-foreground font-mono">
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
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                      <div className={cn("text-center p-4 rounded-lg border", selectedReview.positionData.dailySummary.totalProfit >= 0 ? "bg-up/5 border-up/20" : "bg-down/5 border-down/20")}>
                        <div className="text-xs text-muted-foreground mb-1">当日盈亏</div>
                        <div className={cn("text-lg font-bold font-mono", selectedReview.positionData.dailySummary.totalProfit >= 0 ? 'text-up' : 'text-down')}>
                          {selectedReview.positionData.dailySummary.totalProfit >= 0 ? '+' : ''}¥{selectedReview.positionData.dailySummary.totalProfit.toFixed(2)}
                        </div>
                      </div>
                      <div className="text-center p-4 rounded-lg border bg-surface/50">
                        <div className="text-xs text-muted-foreground mb-1">盈利</div>
                        <div className="text-lg font-bold font-mono text-up">{selectedReview.positionData.dailySummary.winCount}</div>
                      </div>
                      <div className="text-center p-4 rounded-lg border bg-surface/50">
                        <div className="text-xs text-muted-foreground mb-1">亏损</div>
                        <div className="text-lg font-bold font-mono text-down">{selectedReview.positionData.dailySummary.lossCount}</div>
                      </div>
                      <div className="text-center p-4 rounded-lg border bg-surface/50">
                        <div className="text-xs text-muted-foreground mb-1">胜率</div>
                        <div className="text-lg font-bold font-mono">{(selectedReview.positionData.dailySummary.winRate * 100).toFixed(1)}%</div>
                      </div>
                    </div>

                    {/* 个股明细 */}
                    {selectedReview.positionData.positions && selectedReview.positionData.positions.length > 0 && (
                      <div className="space-y-2">
                        <h5 className="text-sm font-medium text-muted-foreground">个股明细</h5>
                        <div className="space-y-2">
                          <div className="grid grid-cols-12 gap-2 text-sm text-muted-foreground px-3 py-2 bg-surface/50 rounded-t-lg font-medium">
                            <div className="col-span-2">股票</div>
                            <div className="col-span-1 text-right">涨跌幅</div>
                            <div className="col-span-1 text-right">当日盈亏</div>
                            <div className="col-span-1 text-right">总盈亏</div>
                            <div className="col-span-1 text-right">持仓</div>
                            <div className="col-span-1 text-right">现价/成本</div>
                            <div className="col-span-3 text-center">次日预测价</div>
                            <div className="col-span-2">备注</div>
                          </div>
                          {selectedReview.positionData.positions.map((pos) => {
                            const isPositive = pos.change >= 0;
                            const dailyProfitPositive = pos.dailyProfit >= 0;
                            const totalProfitPositive = pos.totalProfit >= 0;
                            const nextHighPositive = (pos.nextHigh || 0) >= pos.currentPrice;

                            return (
                              <div
                                key={pos.symbol}
                                className="grid grid-cols-12 gap-2 px-3 py-2.5 items-center border-b last:border-b-0 bg-surface/30 hover:bg-surface/50 transition-colors"
                              >
                                <div className="col-span-2">
                                  <div className="font-medium">{pos.name}</div>
                                  <div className="text-xs text-muted-foreground font-mono">{pos.symbol}</div>
                                </div>
                                <div className={cn("col-span-1 text-right font-mono text-sm", isPositive ? 'text-up' : 'text-down')}>
                                  {isPositive ? '+' : ''}{pos.change.toFixed(2)}%
                                </div>
                                <div className={cn("col-span-1 text-right font-medium font-mono text-sm", dailyProfitPositive ? 'text-up' : 'text-down')}>
                                  {pos.dailyProfit >= 0 ? '+' : ''}¥{pos.dailyProfit.toFixed(2)}
                                </div>
                                <div className={cn("col-span-1 text-right text-sm font-mono", totalProfitPositive ? 'text-up' : 'text-down')}>
                                  {pos.totalProfit >= 0 ? '+' : ''}¥{pos.totalProfit.toFixed(2)}
                                </div>
                                <div className="col-span-1 text-right text-sm font-mono">
                                  {pos.quantity}
                                </div>
                                <div className="col-span-1 text-right text-sm font-mono">
                                  <div>¥{pos.currentPrice.toFixed(2)}</div>
                                  <div className="text-xs text-muted-foreground">¥{pos.costPrice.toFixed(2)}</div>
                                </div>
                                <div className="col-span-3 text-center">
                                  <div className="grid grid-cols-4 gap-1 text-xs font-mono">
                                    <div>
                                      <div className="text-muted-foreground">最高</div>
                                      <div className={cn("font-medium", nextHighPositive ? 'text-up' : 'text-down')}>
                                        ¥{(pos.nextHigh || 0).toFixed(2)}
                                      </div>
                                    </div>
                                    <div>
                                      <div className="text-muted-foreground">最低</div>
                                      <div className={cn("font-medium", !nextHighPositive ? 'text-up' : 'text-down')}>
                                        ¥{(pos.nextLow || 0).toFixed(2)}
                                      </div>
                                    </div>
                                    <div>
                                      <div className="text-muted-foreground">次高</div>
                                      <div className={cn("font-medium", nextHighPositive ? 'text-up' : 'text-down')}>
                                        ¥{(pos.nextSecondaryHigh || 0).toFixed(2)}
                                      </div>
                                    </div>
                                    <div>
                                      <div className="text-muted-foreground">次低</div>
                                      <div className={cn("font-medium", !nextHighPositive ? 'text-up' : 'text-down')}>
                                        ¥{(pos.nextSecondaryLow || 0).toFixed(2)}
                                      </div>
                                    </div>
                                  </div>
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
                              className={cn(
                                "flex items-center justify-between px-4 py-3 rounded-lg border transition-all",
                                tx.type === 'buy' ? 'bg-up/5 border-up/20' : 'bg-down/5 border-down/20'
                              )}
                            >
                              <div className="flex items-center gap-3">
                                <span className={cn(
                                  "px-2.5 py-1 text-xs font-medium rounded-md",
                                  tx.type === 'buy' ? 'bg-up/20 text-up' : 'bg-down/20 text-down'
                                )}>
                                  {tx.type === 'buy' ? '买入' : '卖出'}
                                </span>
                                <div>
                                  <div className="font-medium">{tx.name}</div>
                                  <div className="text-xs text-muted-foreground font-mono">{tx.symbol}</div>
                                </div>
                              </div>
                              <div className="text-right text-sm font-mono">
                                <div>¥{tx.price.toFixed(2)} × {tx.quantity}股</div>
                                <div className="text-muted-foreground">¥{tx.amount.toFixed(2)}</div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* 操作反思 */}
                    <div className="space-y-3 pt-3 border-t">
                      <h5 className="text-sm font-medium text-muted-foreground">操作反思</h5>
                      {selectedReview.operations.reflection.whatWorked && (
                        <div className="flex gap-2 text-sm p-3 bg-success/10 rounded-lg border border-success/20">
                          <span className="text-success font-medium shrink-0">✓ 做得好的:</span>
                          <span className="text-muted-foreground">{selectedReview.operations.reflection.whatWorked}</span>
                        </div>
                      )}
                      {selectedReview.operations.reflection.whatFailed && (
                        <div className="flex gap-2 text-sm p-3 bg-destructive/10 rounded-lg border border-destructive/20">
                          <span className="text-destructive font-medium shrink-0">✗ 需要改进:</span>
                          <span className="text-muted-foreground">{selectedReview.operations.reflection.whatFailed}</span>
                        </div>
                      )}
                      {selectedReview.operations.reflection.lessons && (
                        <div className="flex gap-2 text-sm p-3 bg-warning/10 rounded-lg border border-warning/20">
                          <span className="text-warning font-medium shrink-0">💡 经验教训:</span>
                          <span className="text-muted-foreground">{selectedReview.operations.reflection.lessons}</span>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* 总结感悟 */}
                {selectedReview.summary && (
                  <div className="space-y-2">
                    <h4 className="font-semibold flex items-center gap-2">💭 总结感悟</h4>
                    <div className="text-sm whitespace-pre-wrap bg-surface/50 rounded-lg p-4 border">
                      {selectedReview.summary}
                    </div>
                  </div>
                )}

                {/* 如果没有任何内容 */}
                {!selectedReview.marketData && !selectedReview.positionData && !selectedReview.operations && !selectedReview.summary && (
                  <div className="text-center py-12 text-muted-foreground">
                    <FileText className="h-12 w-12 mx-auto mb-3 opacity-30" />
                    该复盘记录暂无内容
                  </div>
                )}
              </div>
            </Card>
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

      {/* AI评价弹窗 */}
      {analysisReview && (
        <DailyReviewAnalysisDialog
          review={analysisReview}
          onClose={() => setAnalysisReview(null)}
        />
      )}

      {/* 增强版分享弹窗 */}
      <EnhancedShareDialog
        isOpen={enhancedShareOpen}
        onClose={() => setEnhancedShareOpen(false)}
        dailyReview={selectedReview || undefined}
        positions={positions}
        profitSummary={profitSummary}
      />
    </div>
  );
}
