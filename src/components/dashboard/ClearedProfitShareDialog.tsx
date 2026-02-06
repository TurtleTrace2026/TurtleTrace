import { useState, useRef } from 'react';
import { X, Share2, Image as ImageIcon, Check } from 'lucide-react';
import type { ClearedProfit } from '../../types';
import { formatCurrency, formatPercent } from '../../lib/utils';
import TurtleTraceLogo from '../../assets/TurtleTraceLogo.png';

interface ClearedProfitShareDialogProps {
  clearedProfit: ClearedProfit;
  isOpen: boolean;
  onClose: () => void;
}

// 分享模板类型
type ClearedShareTemplate = 'amount' | 'rate' | 'both';

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
    id: 'amount' as ClearedShareTemplate,
    name: '收益额',
    icon: '💰'
  },
  {
    id: 'rate' as ClearedShareTemplate,
    name: '收益率',
    icon: '📈'
  },
  {
    id: 'both' as ClearedShareTemplate,
    name: '盈亏与收益率',
    icon: '📊'
  }
];

export function ClearedProfitShareDialog({ clearedProfit, isOpen, onClose }: ClearedProfitShareDialogProps) {
  const [imageGenerated, setImageGenerated] = useState(false);
  const [copied, setCopied] = useState(false);
  const [imageUrl, setImageUrl] = useState<string>('');
  const [selectedTemplate, setSelectedTemplate] = useState<ClearedShareTemplate>('both');
  const shareCardRef = useRef<HTMLDivElement>(null);

  if (!isOpen) return null;

  // 生成分享文案
  const generateShareText = () => {
    const today = new Date();
    const dateStr = `${today.getMonth() + 1}月${today.getDate()}日`;
    const isPositive = clearedProfit.totalProfit >= 0;

    let text = `📈 ${dateStr} 已清仓股票收益\n\n`;
    text += `共清仓 ${clearedProfit.count} 只股票\n`;

    if (selectedTemplate === 'amount') {
      text += `💰 总盈亏：${isPositive ? '+' : ''}${formatCurrency(clearedProfit.totalProfit)}\n`;
      text += `总买入：${formatCurrency(clearedProfit.totalBuyAmount)}\n`;
      text += `总卖出：${formatCurrency(clearedProfit.totalSellAmount)}\n`;
    } else if (selectedTemplate === 'rate') {
      text += `📊 收益率：${isPositive ? '+' : ''}${formatPercent(clearedProfit.totalProfitPercent)}\n`;
    } else {
      text += `💰 总盈亏：${isPositive ? '+' : ''}${formatCurrency(clearedProfit.totalProfit)}\n`;
      text += `📊 收益率：${isPositive ? '+' : ''}${formatPercent(clearedProfit.totalProfitPercent)}\n`;
    }

    // 显示最佳表现的股票
    const bestStock = [...clearedProfit.positions].sort((a, b) => b.profit - a.profit)[0];
    if (bestStock.profit > 0) {
      text += `🏆 最佳表现：${bestStock.name} +${formatCurrency(bestStock.profit)}\n`;
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
  const handleTemplateChange = (template: ClearedShareTemplate) => {
    setSelectedTemplate(template);
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
    if (clearedProfit.totalProfitPercent >= 20) return '🔥 收益爆表';
    if (clearedProfit.totalProfitPercent >= 10) return '🚀 表现优秀';
    if (clearedProfit.totalProfitPercent >= 5) return '📈 稳步增长';
    if (clearedProfit.totalProfitPercent >= 0) return '💪 小有收获';
    if (clearedProfit.totalProfitPercent >= -5) return '🌱 持续学习';
    return '🛡️ 坚持持有';
  };

  const profitLevel = getProfitLevel();
  const isPositive = clearedProfit.totalProfit >= 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-background rounded-lg shadow-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        {/* 头部 */}
        <div className="sticky top-0 bg-background border-b px-6 py-4 flex items-center justify-between z-10">
          <div className="flex items-center gap-2">
            <Share2 className="h-5 w-5 text-primary" />
            <h2 className="text-lg font-semibold">分享已清仓收益</h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-accent rounded-md transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* 模板选择器 */}
          <div className="flex justify-center">
            <div className="inline-flex bg-muted p-1 rounded-lg">
              {SHARE_TEMPLATES.map((template) => (
                <button
                  key={template.id}
                  onClick={() => handleTemplateChange(template.id)}
                  className={`flex items-center gap-2 px-3 py-2 rounded-md transition-all ${
                    selectedTemplate === template.id
                      ? 'bg-background text-foreground shadow-sm'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  <span>{template.icon}</span>
                  <span className="text-sm font-medium">{template.name}</span>
                </button>
              ))}
            </div>
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
                  <div className="text-xs text-muted-foreground">已清仓股票收益</div>
                </div>
              </div>

              {/* 收益等级 */}
              <div className="text-center mb-4">
                <div className="text-2xl mb-2">{profitLevel}</div>
                <div className="text-xs text-muted-foreground">
                  已清仓 {clearedProfit.count} 只股票
                </div>
              </div>

              {/* 核心数据 - 根据模板显示不同内容 */}
              <div className="bg-white dark:bg-slate-800 rounded-xl p-4 mb-4 shadow-sm">
                {selectedTemplate === 'amount' && (
                  <>
                    <div className="text-center mb-4">
                      <div className="text-sm text-muted-foreground mb-2">总盈亏</div>
                      <div className={`text-4xl font-bold ${isPositive ? 'text-red-500' : 'text-green-500'}`}>
                        {isPositive ? '+' : ''}{formatCurrency(clearedProfit.totalProfit)}
                      </div>
                    </div>
                    <div className="flex justify-between text-sm border-t pt-3">
                      <div className="text-center">
                        <div className="text-muted-foreground">总买入</div>
                        <div className="font-semibold mt-1">{formatCurrency(clearedProfit.totalBuyAmount)}</div>
                      </div>
                      <div className="text-center">
                        <div className="text-muted-foreground">总卖出</div>
                        <div className="font-semibold mt-1">{formatCurrency(clearedProfit.totalSellAmount)}</div>
                      </div>
                    </div>
                  </>
                )}

                {selectedTemplate === 'rate' && (
                  <div className="text-center">
                    <div className="text-sm text-muted-foreground mb-2">收益率</div>
                    <div className={`text-4xl font-bold ${isPositive ? 'text-red-500' : 'text-green-500'}`}>
                      {isPositive ? '+' : ''}{formatPercent(clearedProfit.totalProfitPercent)}
                    </div>
                  </div>
                )}

                {selectedTemplate === 'both' && (
                  <>
                    <div className="text-center mb-4">
                      <div className="text-sm text-muted-foreground mb-2">总盈亏</div>
                      <div className={`text-3xl font-bold ${isPositive ? 'text-red-500' : 'text-green-500'}`}>
                        {isPositive ? '+' : ''}{formatCurrency(clearedProfit.totalProfit)}
                      </div>
                    </div>
                    <div className="text-center">
                      <div className="text-sm text-muted-foreground mb-1">收益率</div>
                      <div className={`text-2xl font-bold ${isPositive ? 'text-red-500' : 'text-green-500'}`}>
                        {isPositive ? '+' : ''}{formatPercent(clearedProfit.totalProfitPercent)}
                      </div>
                    </div>
                  </>
                )}
              </div>

              {/* 最佳表现股票 */}
              {clearedProfit.positions.length > 0 && (
                <div className="bg-white dark:bg-slate-800 rounded-xl p-4 mb-4 shadow-sm">
                  <div className="text-xs text-muted-foreground mb-2">
                    最佳表现
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {[...clearedProfit.positions]
                      .sort((a, b) => b.profit - a.profit)
                      .slice(0, 3)
                      .map((pos) => {
                        const posPositive = pos.profit >= 0;
                        return (
                          <div
                            key={pos.symbol}
                            className={`px-2 py-1 rounded text-xs font-medium ${
                              posPositive
                                ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                                : 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                            }`}
                          >
                            {pos.name} {posPositive ? '+' : ''}{formatCurrency(pos.profit)}
                          </div>
                        );
                      })}
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
