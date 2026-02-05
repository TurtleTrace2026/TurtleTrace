import { useState, useRef } from 'react';
import { X, Share2, Image as ImageIcon, Check } from 'lucide-react';
import type { ProfitSummary } from '../../types';
import { formatCurrency, formatPercent } from '../../lib/utils';
import TurtleTraceLogo from '../../assets/TurtleTraceLogo.png';

interface ShareDialogProps {
  summary: ProfitSummary;
  isOpen: boolean;
  onClose: () => void;
}

// 分享模板类型
type ShareTemplate = 'full' | 'privacy';

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
    id: 'full' as ShareTemplate,
    name: '完整版',
    description: '展示全部数据',
    icon: '📊'
  },
  {
    id: 'privacy' as ShareTemplate,
    name: '隐私版',
    description: '隐藏金额数据',
    icon: '🔒'
  }
];

export function ShareDialog({ summary, isOpen, onClose }: ShareDialogProps) {
  const [imageGenerated, setImageGenerated] = useState(false);
  const [copied, setCopied] = useState(false);
  const [imageUrl, setImageUrl] = useState<string>('');
  const [selectedTemplate, setSelectedTemplate] = useState<ShareTemplate>('full');
  const shareCardRef = useRef<HTMLDivElement>(null);

  if (!isOpen) return null;

  const { totalCost, totalValue, totalProfit, totalProfitPercent, positions, clearedProfit } = summary;

  // 计算综合收益（包含清仓）
  const totalProfitWithCleared = totalProfit + (clearedProfit?.totalProfit || 0);
  const totalCostWithCleared = totalCost + (clearedProfit?.totalBuyAmount || 0);
  const totalProfitPercentWithCleared = totalCostWithCleared > 0
    ? (totalProfitWithCleared / totalCostWithCleared) * 100
    : totalProfitPercent;

  // 生成分享文案
  const generateShareText = () => {
    const today = new Date();
    const dateStr = `${today.getMonth() + 1}月${today.getDate()}日`;

    let text = `📈 ${dateStr} 我的投资收益\n\n`;

    if (selectedTemplate === 'full') {
      text += `💰 总资产：${formatCurrency(totalValue)}\n`;
      text += `📊 今日盈亏：${totalProfit >= 0 ? '+' : ''}${formatCurrency(totalProfit)} (${formatPercent(totalProfitPercent)})\n`;
    } else {
      text += `📊 收益率：${formatPercent(totalProfitPercent)}\n`;
      if (positions.length > 0) {
        const profitCount = positions.filter(p => p.profit > 0).length;
        text += `🎯 盈利股票：${profitCount}/${positions.length}\n`;
      }
    }

    if (positions.length > 0) {
      const bestStock = positions.sort((a, b) => b.profitPercent - a.profitPercent)[0];
      if (bestStock.profitPercent > 0) {
        text += `🏆 最佳表现：${bestStock.name} +${formatPercent(bestStock.profitPercent)}\n`;
      }
    }

    if (clearedProfit && selectedTemplate === 'full') {
      text += `✅ 已清仓收益：${clearedProfit.totalProfit >= 0 ? '+' : ''}${formatCurrency(clearedProfit.totalProfit)}\n`;
    }

    text += `\n🐢 来自「龟迹复盘」——个人投资组合复盘工具`;

    return text;
  };

  // 生成分享图片
  const generateImage = async () => {
    if (imageGenerated) return;

    try {
      // 动态导入 html2canvas
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
      // 即使图片生成失败，也允许继续分享文本
      setImageGenerated(true);
    }
  };

  // 切换模板时重置图片生成状态
  const handleTemplateChange = (template: ShareTemplate) => {
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
      // 微信朋友圈，显示二维码提示
      alert('请截图保存上方图片，分享到微信朋友圈');
      return;
    }

    // 微博等支持URL跳转的平台
    if (platform.getUrl) {
      const url = platform.getUrl(shareText, imageUrl);
      window.open(url, '_blank', 'width=600,height=400');
    }
  };

  // 计算收益等级文案
  const getProfitLevel = () => {
    if (totalProfitPercentWithCleared >= 20) return '🔥 收益爆表';
    if (totalProfitPercentWithCleared >= 10) return '🚀 表现优秀';
    if (totalProfitPercentWithCleared >= 5) return '📈 稳步增长';
    if (totalProfitPercentWithCleared >= 0) return '💪 小有收获';
    if (totalProfitPercentWithCleared >= -5) return '🌱 持续学习';
    return '🛡️ 坚持持有';
  };

  const profitLevel = getProfitLevel();
  const isPositive = totalProfitWithCleared >= 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-background rounded-lg shadow-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        {/* 头部 */}
        <div className="sticky top-0 bg-background border-b px-6 py-4 flex items-center justify-between z-10">
          <div className="flex items-center gap-2">
            <Share2 className="h-5 w-5 text-primary" />
            <h2 className="text-lg font-semibold">分享我的收益</h2>
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
                  className={`flex items-center gap-2 px-4 py-2 rounded-md transition-all ${
                    selectedTemplate === template.id
                      ? 'bg-background text-foreground shadow-sm'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  <span>{template.icon}</span>
                  <span className="text-sm font-medium">{template.name}</span>
                  <span className="text-xs text-muted-foreground hidden sm:inline">{template.description}</span>
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
                  <div className="text-xs text-muted-foreground">个人投资组合复盘</div>
                </div>
              </div>

              {/* 收益等级 */}
              <div className="text-center mb-4">
                <div className="text-3xl mb-2">{profitLevel}</div>
                <div className="text-xs text-muted-foreground">
                  {new Date().toLocaleDateString('zh-CN', { month: 'long', day: 'numeric' })}
                </div>
              </div>

              {/* 核心数据 - 根据模板显示不同内容 */}
              {selectedTemplate === 'full' ? (
                <div className="bg-white dark:bg-slate-800 rounded-xl p-4 mb-4 shadow-sm">
                  <div className="text-center mb-4">
                    <div className="text-sm text-muted-foreground mb-1">总资产</div>
                    <div className="text-3xl font-bold">{formatCurrency(totalValue)}</div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="text-center">
                      <div className="text-xs text-muted-foreground mb-1">总盈亏</div>
                      <div className={`text-xl font-bold ${isPositive ? 'text-red-500' : 'text-green-500'}`}>
                        {isPositive ? '+' : ''}{formatCurrency(totalProfitWithCleared)}
                      </div>
                    </div>
                    <div className="text-center">
                      <div className="text-xs text-muted-foreground mb-1">收益率</div>
                      <div className={`text-xl font-bold ${isPositive ? 'text-red-500' : 'text-green-500'}`}>
                        {isPositive ? '+' : ''}{formatPercent(totalProfitPercentWithCleared)}
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="bg-white dark:bg-slate-800 rounded-xl p-4 mb-4 shadow-sm">
                  <div className="text-center mb-4">
                    <div className="text-sm text-muted-foreground mb-2">收益率</div>
                    <div className={`text-4xl font-bold ${isPositive ? 'text-red-500' : 'text-green-500'}`}>
                      {isPositive ? '+' : ''}{formatPercent(totalProfitPercentWithCleared)}
                    </div>
                  </div>

                  {positions.length > 0 && (
                    <div className="flex justify-center gap-6 mt-4 pt-4 border-t">
                      <div className="text-center">
                        <div className="text-xs text-muted-foreground mb-1">持仓数量</div>
                        <div className="text-xl font-bold">{positions.length}</div>
                      </div>
                      <div className="text-center">
                        <div className="text-xs text-muted-foreground mb-1">盈利股票</div>
                        <div className="text-xl font-bold text-red-500">
                          {positions.filter(p => p.profit > 0).length}
                        </div>
                      </div>
                      <div className="text-center">
                        <div className="text-xs text-muted-foreground mb-1">亏损股票</div>
                        <div className="text-xl font-bold text-green-500">
                          {positions.filter(p => p.profit < 0).length}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* 持仓概览 */}
              {positions.length > 0 && (
                <div className="bg-white dark:bg-slate-800 rounded-xl p-4 mb-4 shadow-sm">
                  <div className="text-xs text-muted-foreground mb-2">
                    持仓 {positions.length} 只
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {positions
                      .sort((a, b) => b.profit - a.profit)
                      .slice(0, 4)
                      .map((pos) => (
                        <div
                          key={pos.symbol}
                          className={`px-2 py-1 rounded text-xs font-medium ${
                            pos.profitPercent >= 0
                              ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                              : 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                          }`}
                        >
                          {pos.name} {pos.profitPercent >= 0 ? '+' : ''}{formatPercent(pos.profitPercent)}
                        </div>
                      ))}
                    {positions.length > 4 && (
                      <div className="px-2 py-1 rounded text-xs bg-slate-100 text-slate-600">
                        +{positions.length - 4}
                      </div>
                    )}
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
