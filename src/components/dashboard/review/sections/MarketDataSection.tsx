import { useState, useEffect } from 'react';
import { TrendingUp, TrendingDown, Minus, RefreshCw } from 'lucide-react';
import { SectionCard } from '../shared/SectionCard';
import { RadioGroup } from '../shared/RadioGroup';
import { TextInput } from '../shared/TextInput';
import type { MarketReviewData } from '../../../../types/review';

interface IndexData {
  name: string;
  code: string;
  change: number;        // 涨跌幅 (%)
  changeAmount: number;  // 涨跌点数
  price: number;         // 当前点位
  open: number;          // 开盘价
  high: number;          // 最高价
  low: number;           // 最低价
  prevClose: number;     // 昨收价
  volume: number;        // 成交量
  amount: number;        // 成交额
}

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

// API响应数据类型
interface EastMoneyIndexItem {
  f12: string;  // 指数代码
  f13: number;  // 市场标识 (1=上海, 0=深圳)
  f14: string;  // 指数名称
  f2: number;   // 当前指数
  f3: number;   // 涨跌幅
  f4: number;   // 涨跌点数
  f15: number;  // 最高
  f16: number;  // 最低
  f17: number;  // 开盘
  f18: number;  // 昨收
  f5: number;   // 成交量
  f6: number;   // 成交额
}

interface EastMoneyResponse {
  data?: {
    diff?: EastMoneyIndexItem[];
  };
}

export function MarketDataSection({ data, onChange }: MarketDataSectionProps) {
  const [indices, setIndices] = useState<IndexData[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  // 获取所有指数数据（一次性获取）
  const fetchAllIndices = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const url = 'https://push2.eastmoney.com/api/qt/clist/get?np=1&fltt=1&invt=2&fs=b:MK0010&fields=f12,f13,f14,f1,f2,f4,f3,f152,f5,f6,f18,f17,f15,f16&fid=&pn=1&pz=50&po=1&ut=fa5fd1943c7b386f172d6893dbfba10b&dect=1&wbp2u=|0|0|0|web';

      const response = await fetch(url);
      const result: EastMoneyResponse = await response.json();

      if (result?.data?.diff) {
        // 转换数据，注意字段需要除以100（左移2位）
        const indexData: IndexData[] = result.data.diff
          .filter(item => {
            // 只保留主要指数
            const majorCodes = ['000001', '399001', '399006', '399300', '000300', '399905'];
            const code = item.f12.substring(0, 6);
            return majorCodes.includes(code);
          })
          .map(item => ({
            name: item.f14,
            code: formatIndexCode(item.f12, item.f13),
            change: item.f3 / 100,          // 涨跌幅 (%)
            changeAmount: item.f4 / 100,     // 涨跌点数
            price: item.f2 / 100,            // 当前点位
            open: item.f17 / 100,            // 开盘
            high: item.f15 / 100,            // 最高
            low: item.f16 / 100,             // 最低
            prevClose: item.f18 / 100,       // 昨收
            volume: item.f5,
            amount: item.f6,
          }));

        setIndices(indexData);
        setLastUpdate(Date.now());
      } else {
        setError('获取数据失败');
      }
    } catch (err) {
      console.error('获取指数数据失败:', err);
      setError('网络请求失败');
    } finally {
      setIsLoading(false);
    }
  };

  // 格式化指数代码 (将API返回的代码格式转换为标准格式)
  const formatIndexCode = (code: string, market: number): string => {
    const code6 = code.substring(0, 6);
    // market: 1=上海, 0=深圳
    const suffix = market === 1 ? 'SH' : 'SZ';
    return `${code6}.${suffix}`;
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

  // 计算整体市场状态
  const marketStatus = displayIndices.length > 0 ? {
    upCount: displayIndices.filter((i: any) => i.change > 0).length,
    downCount: displayIndices.filter((i: any) => i.change < 0).length,
    avgChange: displayIndices.reduce((sum: number, i: any) => sum + i.change, 0) / displayIndices.length,
  } : null;

  return (
    <SectionCard title="大盘指数与关键数据" icon="📊">
      <div className="space-y-4">
        {/* 市场概览 */}
        {marketStatus && (
          <div className="flex items-center gap-4 p-3 bg-accent/50 rounded-lg text-sm">
            <div>
              <span className="text-muted-foreground">涨/跌: </span>
              <span className="font-medium text-red-500">{marketStatus.upCount}</span>
              <span className="text-muted-foreground"> / </span>
              <span className="font-medium text-green-500">{marketStatus.downCount}</span>
            </div>
            <div>
              <span className="text-muted-foreground">平均涨跌: </span>
              <span className={`font-medium ${marketStatus.avgChange >= 0 ? 'text-red-500' : 'text-green-500'}`}>
                {marketStatus.avgChange >= 0 ? '+' : ''}{marketStatus.avgChange.toFixed(2)}%
              </span>
            </div>
          </div>
        )}

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

          {error ? (
            <div className="text-center py-4 text-red-500 text-sm">
              {error}
            </div>
          ) : displayIndices.length === 0 ? (
            <div className="text-center py-4 text-muted-foreground text-sm">
              {isLoading ? '加载中...' : '暂无数据，点击刷新获取'}
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
              {displayIndices.map((idx: any) => {
                const isPositive = idx.change >= 0;
                const isFlat = Math.abs(idx.change) < 0.01;

                return (
                  <div
                    key={idx.code}
                    className="p-3 border rounded-lg hover:bg-accent/30 transition-colors cursor-default"
                  >
                    <div className="text-xs text-muted-foreground mb-1 truncate" title={idx.name}>
                      {idx.name}
                    </div>
                    <div className="text-lg font-bold mb-1">
                      {idx.price?.toFixed(2) || '--'}
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
                      <span>{isPositive ? '+' : ''}{idx.change?.toFixed(2) || '0.00'}%</span>
                    </div>
                    {/* 显示高开低收 */}
                    <div className="mt-2 text-xs text-muted-foreground space-y-0.5">
                      <div className="flex justify-between">
                        <span>最高: {idx.high?.toFixed(2) || '--'}</span>
                        <span>最低: {idx.low?.toFixed(2) || '--'}</span>
                      </div>
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
