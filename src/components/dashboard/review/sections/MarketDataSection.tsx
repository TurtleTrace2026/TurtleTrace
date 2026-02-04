import { useState, useEffect } from 'react';
import { TrendingUp, TrendingDown, Minus, RefreshCw, Settings, Check, Search, X } from 'lucide-react';
import { SectionCard } from '../shared/SectionCard';
import { RadioGroup } from '../shared/RadioGroup';
import { TextInput } from '../shared/TextInput';
import type { MarketReviewData } from '../../../../types/review';

interface IndexData {
  name: string;
  code: string;
  rawCode: string;  // 原始6位代码
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

// 默认显示的主要指数（用户首次使用时默认选中）
const DEFAULT_INDICES = [
  '000001',  // 上证指数
  '399001',  // 深证成指
  '399006',  // 创业板指
  '399300',  // 沪深300
  '000300',  // 上证50
  '399905',  // 中证500
];

const STORAGE_KEY = 'stock_app_display_indices';

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
    total?: number;
  };
}

// 从 localStorage 读取用户配置
function loadUserIndexConfig(availableCodes: string[]): string[] {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const savedCodes = JSON.parse(saved);
      // 过滤掉已不存在的指数代码
      return savedCodes.filter((code: string) => availableCodes.includes(code));
    }
  } catch (e) {
    console.error('读取指数配置失败:', e);
  }
  // 返回默认配置（主要指数）
  return DEFAULT_INDICES.filter(code => availableCodes.includes(code));
}

// 保存用户配置到 localStorage
function saveUserIndexConfig(codes: string[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(codes));
  } catch (e) {
    console.error('保存指数配置失败:', e);
  }
}

export function MarketDataSection({ data, onChange }: MarketDataSectionProps) {
  const [allIndices, setAllIndices] = useState<IndexData[]>([]);  // 所有获取到的指数数据
  const [selectedCodes, setSelectedCodes] = useState<Set<string>>(new Set(DEFAULT_INDICES));  // 用户选择的指数代码
  const [isLoading, setIsLoading] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showConfig, setShowConfig] = useState(false);  // 是否显示配置面板
  const [searchQuery, setSearchQuery] = useState('');  // 搜索关键词

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
        const indexData: IndexData[] = result.data.diff.map(item => ({
          name: item.f14,
          code: formatIndexCode(item.f12, item.f13),
          rawCode: item.f12.substring(0, 6),  // 保存原始代码用于过滤
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

        // 按代码排序，让相关指数排在一起
        indexData.sort((a, b) => a.rawCode.localeCompare(b.rawCode));

        setAllIndices(indexData);

        // 初始化用户配置（只在首次加载时）
        const availableCodes = indexData.map(idx => idx.rawCode);
        const userSelected = loadUserIndexConfig(availableCodes);
        setSelectedCodes(new Set(userSelected));

        setLastUpdate(Date.now());

        // 保存指数数据到 review
        saveIndicesDataToReview(indexData);
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

  // 保存指数数据到 review
  const saveIndicesDataToReview = (indices: IndexData[]) => {
    const currentData = data || { indices: [], keyStats: [], marketMood: 'neutral' as const };

    // 根据用户选择过滤要保存的指数
    const availableCodes = indices.map(idx => idx.rawCode);
    const userSelected = loadUserIndexConfig(availableCodes);
    const selectedSet = new Set(userSelected);

    const displayIndices = indices.filter(idx => selectedSet.has(idx.rawCode));

    // 转换为 MarketIndex 格式
    const marketIndices = displayIndices.map(idx => ({
      name: idx.name,
      code: idx.code,
      change: idx.change,
      changeAmount: idx.changeAmount,
      volume: idx.volume,
      amount: idx.amount,
    }));

    onChange({
      ...currentData,
      indices: marketIndices,
    } as MarketReviewData);
  };

  // 格式化指数代码 (将API返回的代码格式转换为标准格式)
  const formatIndexCode = (code: string, market: number): string => {
    const code6 = code.substring(0, 6);
    // market: 1=上海, 0=深圳
    const suffix = market === 1 ? 'SH' : 'SZ';
    return `${code6}.${suffix}`;
  };

  // 切换指数显示状态
  const toggleIndex = (code: string) => {
    const newSelected = new Set(selectedCodes);
    if (newSelected.has(code)) {
      newSelected.delete(code);
    } else {
      newSelected.add(code);
    }
    setSelectedCodes(newSelected);
    saveUserIndexConfig(Array.from(newSelected));
    // 保存更新后的指数数据
    saveIndicesDataToReview(allIndices);
  };

  // 全选/取消全选
  const toggleAll = () => {
    let newSelected: Set<string>;
    if (selectedCodes.size === allIndices.length) {
      // 取消全选 - 只保留默认选中的
      const defaultCodes = DEFAULT_INDICES.filter(code => allIndices.some(idx => idx.rawCode === code));
      newSelected = new Set(defaultCodes);
      saveUserIndexConfig(defaultCodes);
    } else {
      // 全选
      const allCodes = allIndices.map(idx => idx.rawCode);
      newSelected = new Set(allCodes);
      saveUserIndexConfig(allCodes);
    }
    setSelectedCodes(newSelected);
    // 保存更新后的指数数据
    saveIndicesDataToReview(allIndices);
  };

  // 恢复默认
  const resetToDefault = () => {
    const defaultCodes = DEFAULT_INDICES.filter(code => allIndices.some(idx => idx.rawCode === code));
    setSelectedCodes(new Set(defaultCodes));
    saveUserIndexConfig(defaultCodes);
    // 保存更新后的指数数据
    saveIndicesDataToReview(allIndices);
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

  // 根据用户选择过滤指数
  const displayIndices: IndexData[] = allIndices.length > 0
    ? allIndices.filter(idx => selectedCodes.has(idx.rawCode))
    : [];

  // 过滤配置面板中的指数
  const filteredConfigIndices = allIndices.filter(idx =>
    idx.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    idx.rawCode.includes(searchQuery)
  );

  const marketMood = data?.marketMood || 'neutral';
  const moodNote = data?.moodNote || '';

  // 计算整体市场状态
  const marketStatus = displayIndices.length > 0 ? {
    upCount: displayIndices.filter((i) => i.change > 0).length,
    downCount: displayIndices.filter((i) => i.change < 0).length,
    avgChange: displayIndices.reduce((sum, i) => sum + i.change, 0) / displayIndices.length,
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
            <h4 className="text-sm font-medium text-muted-foreground">
              主要指数
              <span className="ml-2 text-xs text-muted-foreground">({displayIndices.length}/{allIndices.length})</span>
            </h4>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowConfig(!showConfig)}
                className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                <Settings className="w-4 h-4" />
                配置
              </button>
              <button
                onClick={fetchAllIndices}
                disabled={isLoading}
                className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors disabled:opacity-50"
              >
                <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
                刷新
              </button>
            </div>
          </div>

          {/* 配置面板 */}
          {showConfig && (
            <div className="p-3 bg-accent/30 rounded-lg border">
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm font-medium">选择要显示的指数</span>
                <div className="flex items-center gap-2">
                  <button
                    onClick={resetToDefault}
                    className="text-xs px-2 py-1 bg-accent hover:bg-accent/60 rounded transition-colors"
                  >
                    恢复默认
                  </button>
                  <button
                    onClick={toggleAll}
                    className="text-xs px-2 py-1 bg-primary/10 hover:bg-primary/20 rounded transition-colors"
                  >
                    {selectedCodes.size === allIndices.length ? '取消全选' : '全选'}
                  </button>
                </div>
              </div>

              {/* 搜索框 */}
              <div className="relative mb-3">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="搜索指数名称或代码..."
                  className="w-full pl-9 pr-8 py-2 text-sm border rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-primary"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>

              {/* 指数列表 */}
              <div className="max-h-64 overflow-y-auto space-y-1 pr-1">
                {filteredConfigIndices.length === 0 ? (
                  <div className="text-center py-4 text-sm text-muted-foreground">
                    未找到匹配的指数
                  </div>
                ) : (
                  filteredConfigIndices.map((idx) => {
                    const isSelected = selectedCodes.has(idx.rawCode);
                    const isPositive = idx.change >= 0;
                    return (
                      <button
                        key={idx.code}
                        onClick={() => toggleIndex(idx.rawCode)}
                        className={`
                          w-full flex items-center justify-between px-3 py-2 rounded text-sm transition-colors
                          ${isSelected
                            ? 'bg-primary text-primary-foreground'
                            : 'bg-background hover:bg-accent'
                          }
                        `}
                      >
                        <div className="flex items-center gap-2 flex-1">
                          {isSelected && <Check className="w-4 h-4" />}
                          <span className="font-medium">{idx.name}</span>
                          <span className="text-xs opacity-70">({idx.rawCode})</span>
                        </div>
                        <div className={`text-xs font-medium ${isPositive ? 'text-red-500' : 'text-green-500'}`}>
                          {isPositive ? '+' : ''}{idx.change.toFixed(2)}%
                        </div>
                      </button>
                    );
                  })
                )}
              </div>

              <div className="mt-3 text-xs text-muted-foreground">
                已选择 {selectedCodes.size} / {allIndices.length} 个指数
              </div>
            </div>
          )}

          {error ? (
            <div className="text-center py-4 text-red-500 text-sm">
              {error}
            </div>
          ) : displayIndices.length === 0 ? (
            <div className="text-center py-4 text-muted-foreground text-sm">
              {isLoading ? '加载中...' : '请选择要显示的指数'}
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
              {displayIndices.map((idx) => {
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
