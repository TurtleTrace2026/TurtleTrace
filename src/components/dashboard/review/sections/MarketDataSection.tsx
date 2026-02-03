import { useState, useEffect } from 'react';
import { TrendingUp, TrendingDown, Minus, RefreshCw } from 'lucide-react';
import { SectionCard } from '../shared/SectionCard';
import { RadioGroup } from '../shared/RadioGroup';
import { TextInput } from '../shared/TextInput';
import type { MarketReviewData } from '../../../../types/review';

interface IndexData {
  name: string;
  code: string;
  change: number;
  changeAmount: number;
  price: number;
  amount: number;
}

// 主要指数配置
const MAJOR_INDICES = [
  { code: '000001.SH', name: '上证指数' },
  { code: '399001.SZ', name: '深证成指' },
  { code: '399006.SZ', name: '创业板指' },
  { code: '399300.SZ', name: '沪深300' },
  { code: '000300.SH', name: '上证50' },
  { code: '399905.SZ', name: '中证500' },
];

// 市场情绪选项
const MOOD_OPTIONS = [
  { value: 'bullish', label: '看多', icon: '📈' },
  { value: 'neutral', label: '中性', icon: '➡️' },
  { value: 'bearish', label: '看空', icon: '📉' },
];

interface MarketDataSectionProps {
  data?: MarketReviewData;
  onChange: (data: MarketReviewData) => void;
}

export function MarketDataSection({ data, onChange }: MarketDataSectionProps) {
  const [indices, setIndices] = useState<IndexData[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<number | null>(null);

  // 获取单个指数数据
  const fetchIndex = async (code: string, name: string): Promise<IndexData | null> => {
    try {
      // 转换代码格式
      let marketCode = code;
      if (code.includes('.')) {
        const [c, suffix] = code.split('.');
        marketCode = suffix === 'SH' ? `1.${c}` : `0.${c}`;
      }

      const url = `https://push2.eastmoney.com/api/qt/stock/get?secid=${marketCode}&fields=f43,f44,f45,f46,f60,f162,f170,f171,f161,f166,f167,f168,f169`;
      const response = await fetch(url);
      const result = await response.json();

      if (result?.data) {
        const { f43: current, f60: change, f169: amount } = result.data;
        const prevClose = current - change;

        return {
          name,
          code,
          change: prevClose ? (change / prevClose) * 100 : 0,
          changeAmount: change || 0,
          price: current || 0,
          amount: amount || 0,
        };
      }
    } catch (error) {
      console.error(`获取指数 ${name} 数据失败:`, error);
    }
    return null;
  };

  // 获取所有指数数据
  const fetchAllIndices = async () => {
    setIsLoading(true);
    const results = await Promise.all(
      MAJOR_INDICES.map(idx => fetchIndex(idx.code, idx.name))
    );
    setIndices(results.filter((r): r is IndexData => r !== null));
    setLastUpdate(Date.now());
    setIsLoading(false);
  };

  // 初始化加载数据
  useEffect(() => {
    fetchAllIndices();
  }, []);

  // 自动刷新（每5分钟）
  useEffect(() => {
    const interval = setInterval(() => {
      fetchAllIndices();
    }, 5 * 60 * 1000);

    return () => clearInterval(interval);
  }, []);

  // 更新市场情绪
  const updateMarketMood = (mood: 'bullish' | 'bearish' | 'neutral') => {
    const currentData = data || { indices: [], keyStats: [], marketMood: 'neutral' as const };
    onChange({
      ...currentData,
      marketMood: mood,
    } as MarketReviewData);
  };

  // 更新情绪备注
  const updateMoodNote = (note: string) => {
    const currentData = data || { indices: [], keyStats: [], marketMood: 'neutral' as const };
    onChange({
      ...currentData,
      moodNote: note,
    } as MarketReviewData);
  };

  const displayIndices = indices.length > 0 ? indices : (data?.indices || []);
  const marketMood = data?.marketMood || 'neutral';
  const moodNote = data?.moodNote || '';

  return (
    <SectionCard title="大盘指数与关键数据" icon="📊">
      <div className="space-y-4">
        {/* 指数列表 */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-medium text-muted-foreground">主要指数</h4>
            <button
              onClick={fetchAllIndices}
              disabled={isLoading}
              className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
              刷新
            </button>
          </div>

          {displayIndices.length === 0 ? (
            <div className="text-center py-4 text-muted-foreground text-sm">
              暂无数据，点击刷新获取
            </div>
          ) : (
            <div className="grid grid-cols-3 md:grid-cols-6 gap-3">
              {displayIndices.map((idx: any) => {
                const isPositive = idx.change >= 0;
                const isFlat = Math.abs(idx.change) < 0.01;

                return (
                  <div
                    key={idx.code}
                    className="p-3 border rounded-lg hover:bg-accent/30 transition-colors"
                  >
                    <div className="text-xs text-muted-foreground mb-1">{idx.name}</div>
                    <div className="text-lg font-semibold mb-1">
                      {idx.price ? idx.price.toFixed(2) : '--'}
                    </div>
                    <div className={`flex items-center gap-1 text-sm ${
                      isFlat ? 'text-muted-foreground' : isPositive ? 'text-red-500' : 'text-green-500'
                    }`}>
                      {isFlat ? (
                        <Minus className="w-3 h-3" />
                      ) : isPositive ? (
                        <TrendingUp className="w-3 h-3" />
                      ) : (
                        <TrendingDown className="w-3 h-3" />
                      )}
                      <span>{isPositive ? '+' : ''}{idx.change.toFixed(2)}%</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* 市场情绪 */}
        <div className="space-y-3 pt-3 border-t">
          <h4 className="text-sm font-medium text-muted-foreground">市场情绪判断</h4>

          <RadioGroup
            options={MOOD_OPTIONS}
            value={marketMood}
            onChange={(value) => updateMarketMood(value as any)}
          />

          <TextInput
            value={moodNote}
            onChange={updateMoodNote}
            placeholder="记录今日市场观察和情绪判断..."
            multiline
            rows={2}
          />
        </div>

        {/* 更新时间 */}
        {lastUpdate && (
          <div className="text-xs text-muted-foreground text-right">
            更新时间: {new Date(lastUpdate).toLocaleTimeString('zh-CN')}
          </div>
        )}
      </div>
    </SectionCard>
  );
}
