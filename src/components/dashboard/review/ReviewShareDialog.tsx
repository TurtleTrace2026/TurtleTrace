import { useState, useRef } from 'react';
import { X, Share2, Check } from 'lucide-react';
import { cn } from '../../../lib/utils';
import type { DailyReview } from '../../../types/review';
import TurtleTraceLogo from '../../../assets/TurtleTraceLogo.png';

interface ReviewShareDialogProps {
  review: DailyReview;
  isOpen: boolean;
  onClose: () => void;
}

// 社交平台配置
const SOCIAL_PLATFORMS = [
  {
    id: 'weibo',
    name: '微博',
    icon: '🔴',
    color: 'bg-red-500',
    getUrl: (text: string) => {
      return `https://service.weibo.com/share/share.php?title=${encodeURIComponent(text)}&rl=1`;
    }
  },
  {
    id: 'wechat',
    name: '朋友圈',
    icon: '💬',
    color: 'bg-green-500',
    action: 'qrcode' as const
  },
  {
    id: 'copy',
    name: '复制链接',
    icon: '🔗',
    color: 'bg-blue-500',
    action: 'copy' as const
  }
];

export function ReviewShareDialog({ review, isOpen, onClose }: ReviewShareDialogProps) {
  const [copied, setCopied] = useState(false);
  const shareCardRef = useRef<HTMLDivElement>(null);

  if (!isOpen) return null;

  // 生成分享文案
  const generateShareText = () => {
    const date = new Date(review.date);
    const dateStr = `${date.getMonth() + 1}月${date.getDate()}日`;

    let text = `📝 ${dateStr} 每日复盘\n\n`;

    // 市场情绪
    if (review.marketData?.marketMood) {
      const moodText = review.marketData.marketMood === 'bullish' ? '看多📈' : review.marketData.marketMood === 'bearish' ? '看空📉' : '中性➡️';
      text += `市场情绪：${moodText}\n`;
    }

    // 持仓盈亏
    if (review.positionData?.dailySummary) {
      const { totalProfit, winCount, lossCount, winRate } = review.positionData.dailySummary;
      const isPositive = totalProfit >= 0;
      text += `\n💼 持仓盈亏\n`;
      text += `当日盈亏：${isPositive ? '+' : ''}¥${totalProfit.toFixed(2)}\n`;
      text += `盈利 ${winCount} / 亏损 ${lossCount} / 胜率 ${(winRate * 100).toFixed(1)}%\n`;

      // 最佳表现股票
      if (review.positionData.positions && review.positionData.positions.length > 0) {
        const bestStock = [...review.positionData.positions].sort((a, b) => b.dailyProfit - a.dailyProfit)[0];
        if (bestStock.dailyProfit > 0) {
          text += `🏆 最佳表现：${bestStock.name} +¥${bestStock.dailyProfit.toFixed(2)}\n`;
        }
      }
    }

    // 操作反思
    if (review.operations?.reflection) {
      if (review.operations.reflection.whatWorked) {
        text += `\n✅ ${review.operations.reflection.whatWorked}\n`;
      }
      if (review.operations.reflection.lessons) {
        text += `💡 ${review.operations.reflection.lessons}\n`;
      }
    }

    // 总结
    if (review.summary) {
      const shortSummary = review.summary.slice(0, 50);
      text += `\n💭 ${shortSummary}${review.summary.length > 50 ? '...' : ''}\n`;
    }

    text += `\n🐢 来自「龟迹复盘」——个人投资组合复盘工具`;

    return text;
  };

  // 处理平台分享
  const handleShare = async (platform: typeof SOCIAL_PLATFORMS[0]) => {
    const shareText = generateShareText();

    if (platform.action === 'copy') {
      await navigator.clipboard.writeText(shareText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      return;
    }

    if (platform.action === 'qrcode') {
      alert('请截图保存上方图片，分享到微信朋友圈');
      return;
    }

    if (platform.getUrl) {
      const url = platform.getUrl(shareText);
      window.open(url, '_blank', 'width=600,height=400');
    }
  };

  // 格式化日期
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('zh-CN', { month: 'long', day: 'numeric', weekday: 'short' });
  };

  // 获取盈亏颜色类
  const getProfitColor = (value: number) => {
    return value >= 0 ? 'text-up' : 'text-down';
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-background rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        {/* 头部 */}
        <div className="sticky top-0 bg-background border-b px-6 py-4 flex items-center justify-between z-10 rounded-t-xl">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-primary/10 rounded-lg">
              <Share2 className="h-5 w-5 text-primary" />
            </div>
            <h2 className="text-lg font-semibold">分享复盘</h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-surface-hover rounded-lg transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* 分享卡片预览 */}
          <div className="flex justify-center">
            <div
              ref={shareCardRef}
              className="w-full max-w-md bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 rounded-2xl p-6 shadow-xl"
            >
              {/* Logo 和标题 */}
              <div className="flex items-center gap-3 mb-6">
                <img src={TurtleTraceLogo} alt="龟迹复盘" className="h-10 w-auto" />
                <div>
                  <div className="font-bold text-lg">龟迹复盘</div>
                  <div className="text-xs text-muted-foreground">每日投资复盘</div>
                </div>
              </div>

              {/* 日期 */}
              <div className="text-center mb-4">
                <div className="text-2xl font-bold">{formatDate(review.date)}</div>
                <div className="text-xs text-muted-foreground mt-1">
                  创建于 {new Date(review.createdAt).toLocaleDateString('zh-CN')}
                </div>
              </div>

              {/* 市场情绪 */}
              {review.marketData?.marketMood && (
                <div className="bg-white dark:bg-slate-800 rounded-xl p-4 mb-4 shadow-sm">
                  <div className="text-xs text-muted-foreground mb-2">市场情绪</div>
                  <div className="text-lg font-semibold">
                    {review.marketData.marketMood === 'bullish' ? '看多📈' : review.marketData.marketMood === 'bearish' ? '看空📉' : '中性➡️'}
                  </div>
                  {review.marketData.moodNote && (
                    <div className="text-sm text-muted-foreground mt-2">{review.marketData.moodNote}</div>
                  )}
                </div>
              )}

              {/* 持仓盈亏 */}
              {review.positionData && (
                <div className="bg-white dark:bg-slate-800 rounded-xl p-4 mb-4 shadow-sm">
                  <div className="text-xs text-muted-foreground mb-3">持仓盈亏</div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="text-center">
                      <div className={cn("text-2xl font-bold font-mono tabular-nums", getProfitColor(review.positionData.dailySummary.totalProfit))}>
                        {review.positionData.dailySummary.totalProfit >= 0 ? '+' : ''}¥{review.positionData.dailySummary.totalProfit.toFixed(0)}
                      </div>
                      <div className="text-xs text-muted-foreground">当日盈亏</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold font-mono tabular-nums">
                        {(review.positionData.dailySummary.winRate * 100).toFixed(0)}%
                      </div>
                      <div className="text-xs text-muted-foreground">胜率</div>
                    </div>
                  </div>
                </div>
              )}

              {/* 操作反思 */}
              {review.operations?.reflection && (
                <div className="bg-white dark:bg-slate-800 rounded-xl p-4 mb-4 shadow-sm">
                  <div className="text-xs text-muted-foreground mb-2">操作反思</div>
                  {review.operations.reflection.whatWorked && (
                    <div className="text-sm mb-2">
                      <span className="text-up">✓ </span>
                      {review.operations.reflection.whatWorked.slice(0, 40)}
                      {review.operations.reflection.whatWorked.length > 40 ? '...' : ''}
                    </div>
                  )}
                  {review.operations.reflection.lessons && (
                    <div className="text-sm">
                      <span className="text-yellow-500">💡 </span>
                      {review.operations.reflection.lessons.slice(0, 40)}
                      {review.operations.reflection.lessons.length > 40 ? '...' : ''}
                    </div>
                  )}
                </div>
              )}

              {/* 总结 */}
              {review.summary && (
                <div className="bg-white dark:bg-slate-800 rounded-xl p-4 mb-4 shadow-sm">
                  <div className="text-xs text-muted-foreground mb-2">总结感悟</div>
                  <div className="text-sm whitespace-pre-wrap line-clamp-3">
                    {review.summary}
                  </div>
                </div>
              )}

              {/* 底部标语 */}
              <div className="text-center text-xs text-muted-foreground pt-2">
                用「龟迹复盘」记录投资之路 🐢
              </div>
            </div>
          </div>

          {/* 平台分享按钮 */}
          <div className="grid grid-cols-3 gap-4">
            {SOCIAL_PLATFORMS.map((platform) => (
              <button
                key={platform.id}
                onClick={() => handleShare(platform)}
                className={cn("flex flex-col items-center gap-2 p-4 rounded-lg text-white hover:opacity-90 transition-opacity", platform.color)}
              >
                <span className="text-2xl">{platform.icon}</span>
                <span className="text-sm font-medium">
                  {copied && platform.id === 'copy' ? (
                    <span className="flex items-center gap-1">
                      <Check className="h-4 w-4" />
                      已复制
                    </span>
                  ) : (
                    platform.name
                  )}
                </span>
              </button>
            ))}
          </div>

          {/* 提示文字 */}
          <p className="text-xs text-center text-muted-foreground">
            点击上方按钮分享到对应平台，或直接截图保存
          </p>
        </div>
      </div>
    </div>
  );
}
