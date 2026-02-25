import { useState, useRef } from 'react';
import { X, Share2, Image as ImageIcon, Check } from 'lucide-react';
import { cn } from '../../lib/utils';
import type { PositionProfit } from '../../types';
import { formatCurrency, formatPercent } from '../../lib/utils';
import TurtleTraceLogo from '../../assets/TurtleTraceLogo.png';

interface StockShareDialogProps {
  position: PositionProfit;
  isOpen: boolean;
  onClose: () => void;
}

// 分享模板类型
type StockShareTemplate = 'amount' | 'rate' | 'both';

// 社交平台配置
const SOCIAL_PLATFORMS = [
  {
    id: 'weibo',
    name: '微博',
    icon: '🔴',
    color: 'bg-red-500',
    getUrl: (text: string, imgUrl: string) => {
      return `https://service.weibo.com/share/share.php?title=${encodeURIComponent(text)}&pic=${encodeURIComponent(imgUrl)}&rl=1`;
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

// 分享模板配置
const SHARE_TEMPLATES = [
  {
    id: 'amount' as StockShareTemplate,
    name: '收益额',
    description: '总盈亏',
    icon: '💰'
  },
  {
    id: 'rate' as StockShareTemplate,
    name: '收益率',
    description: '收益率',
    icon: '📈'
  },
  {
    id: 'both' as StockShareTemplate,
    name: '盈亏与收益率',
    description: '全部展示',
    icon: '📊'
  }
];

export function StockShareDialog({ position, isOpen, onClose }: StockShareDialogProps) {
  const [imageGenerated, setImageGenerated] = useState(false);
  const [copied, setCopied] = useState(false);
  const [imageUrl, setImageUrl] = useState<string>('');
  const [selectedTemplate, setSelectedTemplate] = useState<StockShareTemplate>('both');
  const [showQuantity, setShowQuantity] = useState(false);
  const shareCardRef = useRef<HTMLDivElement>(null);

  if (!isOpen) return null;

  // 生成分享文案
  const generateShareText = () => {
    const today = new Date();
    const dateStr = `${today.getMonth() + 1}月${today.getDate()}日`;
    const isPositive = position.profit >= 0;

    let text = `📈 ${dateStr} ${position.name}(${position.symbol})\n\n`;

    if (selectedTemplate === 'amount') {
      text += `💰 总盈亏：${isPositive ? '+' : ''}${formatCurrency(position.profit)}\n`;
    } else if (selectedTemplate === 'rate') {
      text += `📊 收益率：${isPositive ? '+' : ''}${formatPercent(position.profitPercent)}\n`;
    } else {
      text += `💰 总盈亏：${isPositive ? '+' : ''}${formatCurrency(position.profit)}\n`;
      text += `📊 收益率：${isPositive ? '+' : ''}${formatPercent(position.profitPercent)}\n`;
    }

    if (showQuantity) {
      text += `📦 持仓数量：${position.quantity} 股\n`;
    }

    text += `\n🐢 来自「龟迹复盘」——个人投资组合复盘工具`;

    return text;
  };

  // 生成分享图片
  const generateImage = async () => {
    if (imageGenerated) return;

    try {
      const html2canvas = (await import('html2canvas')).default;

      if (shareCardRef.current) {
        const canvas = await html2canvas(shareCardRef.current, {
          scale: 2,
          backgroundColor: '#ffffff',
          useCORS: true,
          logging: false
        });

        const url = canvas.toDataURL('image/png');
        setImageUrl(url);
        setImageGenerated(true);
      }
    } catch (error) {
      console.error('生成图片失败:', error);
      setImageGenerated(true);
    }
  };

  // 切换模板时重置图片生成状态
  const handleTemplateChange = (template: StockShareTemplate) => {
    setSelectedTemplate(template);
    setImageGenerated(false);
    setImageUrl('');
  };

  // 切换持仓数量显示时重置图片生成状态
  const handleToggleQuantity = () => {
    setShowQuantity(!showQuantity);
    setImageGenerated(false);
    setImageUrl('');
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
      const url = platform.getUrl(shareText, imageUrl);
      window.open(url, '_blank', 'width=600,height=400');
    }
  };

  // 计算收益等级
  const getProfitLevel = () => {
    if (position.profitPercent >= 20) return '🔥 收益爆表';
    if (position.profitPercent >= 10) return '🚀 表现优秀';
    if (position.profitPercent >= 5) return '📈 稳步增长';
    if (position.profitPercent >= 0) return '💪 小有收获';
    if (position.profitPercent >= -5) return '🌱 持续学习';
    return '🛡️ 坚持持有';
  };

  const profitLevel = getProfitLevel();
  const isPositive = position.profit >= 0;

  // 从 PositionProfit 计算成本价和现价
  const costPrice = position.quantity > 0 ? position.cost / position.quantity : 0;
  const currentPrice = position.quantity > 0 ? position.value / position.quantity : 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-background rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        {/* 头部 */}
        <div className="sticky top-0 bg-background border-b px-6 py-4 flex items-center justify-between z-10 rounded-t-xl">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-primary/10 rounded-lg">
              <Share2 className="h-5 w-5 text-primary" />
            </div>
            <h2 className="text-lg font-semibold">分享 {position.name}</h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-surface-hover rounded-lg transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* 模板选择器 */}
          <div className="flex justify-center">
            <div className="inline-flex bg-surface p-1 rounded-lg border">
              {SHARE_TEMPLATES.map((template) => (
                <button
                  key={template.id}
                  onClick={() => handleTemplateChange(template.id)}
                  className={cn(
                    "flex items-center gap-2 px-3 py-2 rounded-md transition-all",
                    selectedTemplate === template.id
                      ? 'bg-primary text-primary-foreground shadow-sm'
                      : 'text-muted-foreground hover:text-foreground hover:bg-surface-hover'
                  )}
                >
                  <span>{template.icon}</span>
                  <span className="text-sm font-medium">{template.name}</span>
                </button>
              ))}
            </div>
          </div>

          {/* 选项设置 */}
          <div className="flex justify-center">
            <label className="flex items-center gap-2 text-sm text-muted-foreground cursor-pointer hover:text-foreground">
              <input
                type="checkbox"
                checked={showQuantity}
                onChange={handleToggleQuantity}
                className="w-4 h-4 rounded border-gray-300 text-primary focus:ring-primary"
              />
              显示持仓数量
            </label>
          </div>

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
                  <div className="text-xs text-muted-foreground">个人投资组合复盘</div>
                </div>
              </div>

              {/* 股票信息 */}
              <div className="text-center mb-4">
                <div className="text-2xl font-bold mb-1">{position.name}</div>
                <div className="text-sm text-muted-foreground">{position.symbol}</div>
                <div className="text-xs text-muted-foreground mt-1">
                  {new Date().toLocaleDateString('zh-CN', { month: 'long', day: 'numeric' })}
                </div>
              </div>

              {/* 收益等级 */}
              <div className="text-center mb-4">
                <div className="text-2xl">{profitLevel}</div>
              </div>

              {/* 核心数据 - 根据模板显示不同内容 */}
              <div className="bg-white dark:bg-slate-800 rounded-xl p-4 mb-4 shadow-sm">
                {/* 成本价和现价 - 所有模板都显示 */}
                <div className="flex justify-between items-center mb-4 pb-4 border-b">
                  <div className="text-center">
                    <div className="text-xs text-muted-foreground mb-1">成本价</div>
                    <div className="text-lg font-semibold font-mono tabular-nums">¥{costPrice.toFixed(2)}</div>
                  </div>
                  <div className="text-center">
                    <div className="text-xs text-muted-foreground mb-1">最新价</div>
                    <div className={cn("text-lg font-semibold font-mono tabular-nums", isPositive ? 'text-up' : 'text-down')}>
                      ¥{currentPrice.toFixed(2)}
                    </div>
                  </div>
                </div>

                {/* 根据模板显示不同盈亏信息 */}
                {selectedTemplate === 'amount' && (
                  <div className="text-center">
                    <div className="text-sm text-muted-foreground mb-2">总盈亏</div>
                    <div className={cn("text-4xl font-bold font-mono tabular-nums", isPositive ? 'text-up' : 'text-down')}>
                      {isPositive ? '+' : ''}{formatCurrency(position.profit)}
                    </div>
                  </div>
                )}

                {selectedTemplate === 'rate' && (
                  <div className="text-center">
                    <div className="text-sm text-muted-foreground mb-2">收益率</div>
                    <div className={cn("text-4xl font-bold font-mono tabular-nums", isPositive ? 'text-up' : 'text-down')}>
                      {isPositive ? '+' : ''}{formatPercent(position.profitPercent)}
                    </div>
                  </div>
                )}

                {selectedTemplate === 'both' && (
                  <div className="grid grid-cols-2 gap-4">
                    <div className="text-center">
                      <div className="text-xs text-muted-foreground mb-1">总盈亏</div>
                      <div className={cn("text-2xl font-bold font-mono tabular-nums", isPositive ? 'text-up' : 'text-down')}>
                        {isPositive ? '+' : ''}{formatCurrency(position.profit)}
                      </div>
                    </div>
                    <div className="text-center">
                      <div className="text-xs text-muted-foreground mb-1">收益率</div>
                      <div className={cn("text-2xl font-bold font-mono tabular-nums", isPositive ? 'text-up' : 'text-down')}>
                        {isPositive ? '+' : ''}{formatPercent(position.profitPercent)}
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* 持仓数量 - 可选显示 */}
              {showQuantity && (
                <div className="bg-white dark:bg-slate-800 rounded-xl p-4 mb-4 shadow-sm">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">持仓数量</span>
                    <span className="text-lg font-semibold">{position.quantity} 股</span>
                  </div>
                </div>
              )}

              {/* 底部标语 */}
              <div className="text-center text-xs text-muted-foreground">
                用「龟迹复盘」记录投资之路 🐢
              </div>
            </div>
          </div>

          {/* 生成图片按钮 */}
          {!imageGenerated && (
            <div className="flex justify-center">
              <button
                onClick={generateImage}
                className="flex items-center gap-2 px-6 py-3 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
              >
                <ImageIcon className="h-5 w-5" />
                生成分享图片
              </button>
            </div>
          )}

          {/* 平台分享按钮 */}
          <div className="grid grid-cols-3 gap-4">
            {SOCIAL_PLATFORMS.map((platform) => (
              <button
                key={platform.id}
                onClick={() => handleShare(platform)}
                className={`flex flex-col items-center gap-2 p-4 rounded-lg ${platform.color} text-white hover:opacity-90 transition-opacity`}
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
