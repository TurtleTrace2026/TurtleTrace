import { useState, useEffect } from 'react';
import { TrendingUp, TrendingDown, Minus, RefreshCw, Settings, Check, Search, X, ChevronDown, ChevronUp } from 'lucide-react';
import { cn } from '../../../../lib/utils';
import { SectionCard } from '../shared/SectionCard';
import { RadioGroup } from '../shared/RadioGroup';
import { TextInput } from '../shared/TextInput';
import type { MarketReviewData, SectorRotationData } from '../../../../types/review';

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

// 板块轮动数据类型（内部使用）
interface SectorData {
  name: string;           // 板块名称
  change: number;         // 今日涨幅 (%)
  mainNetInflow: number;  // 主力净流入（元）
  mainNetRatio: number;   // 主力净占比 (%)
  // 详细数据
  superLargeNetInflow: number;   // 超大单净流入
  superLargeNetRatio: number;    // 超大单净占比
  largeNetInflow: number;        // 大单净流入
  largeNetRatio: number;         // 大单净占比
  mediumNetInflow: number;       // 中单净流入
  mediumNetRatio: number;        // 中单净占比
  smallNetInflow: number;        // 小单净流入
  smallNetRatio: number;         // 小单净占比
  topStock: string;              // 主力净流入最大股
}

// 板块轮动 API 响应类型
interface EastMoneySectorItem {
  f3: number;    // 今日涨幅
  f14: string;   // 板块名称
  f62: number;   // 主力净流入
  f184: number;  // 主力净占比
  f66: number;   // 超大单净流入
  f69: number;   // 超大单净占比
  f72: number;   // 大单净流入
  f75: number;   // 大单净占比
  f78: number;   // 中单净流入
  f81: number;   // 中单净占比
  f84: number;   // 小单净流入
  f87: number;   // 小单净占比
  f204: string;  // 主力净流入最大股
}

interface EastMoneySectorResponse {
  data?: {
    diff?: EastMoneySectorItem[];
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

  // 板块轮动相关状态
  const [sectorData, setSectorData] = useState<SectorData[]>([]);
  const [sectorLoading, setSectorLoading] = useState(false);
  const [sectorError, setSectorError] = useState<string | null>(null);
  const [showAllSectors, setShowAllSectors] = useState(false);  // 是否显示全部板块
  const [expandedSector, setExpandedSector] = useState<string | null>(null);  // 展开的板块名称

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

  // 获取板块轮动数据
  const fetchSectorRotation = async () => {
    setSectorLoading(true);
    setSectorError(null);

    try {
      const url = 'https://push2.eastmoney.com/api/qt/clist/get?fid=f3&po=1&pz=50&pn=1&np=1&fltt=2&invt=2&ut=8dec03ba335b81bf4ebdf7b29ec27d15&fs=m:90+s:4&fields=f3,f14,f62,f184,f66,f69,f72,f75,f78,f81,f84,f87,f204';

      const response = await fetch(url);
      const result: EastMoneySectorResponse = await response.json();

      if (result?.data?.diff) {
        // 转换数据，按涨幅降序排序
        const sectors: SectorData[] = result.data.diff
          .map(item => ({
            name: item.f14,
            change: item.f3,
            mainNetInflow: item.f62,
            mainNetRatio: item.f184,
            superLargeNetInflow: item.f66,
            superLargeNetRatio: item.f69,
            largeNetInflow: item.f72,
            largeNetRatio: item.f75,
            mediumNetInflow: item.f78,
            mediumNetRatio: item.f81,
            smallNetInflow: item.f84,
            smallNetRatio: item.f87,
            topStock: item.f204 || '',
          }))
          .sort((a, b) => b.change - a.change);

        setSectorData(sectors);

        // 保存板块数据到 review
        saveSectorDataToReview(sectors);
      } else {
        setSectorError('获取板块数据失败');
      }
    } catch (err) {
      console.error('获取板块数据失败:', err);
      setSectorError('网络请求失败');
    } finally {
      setSectorLoading(false);
    }
  };

  // 保存板块数据到 review
  const saveSectorDataToReview = (sectors: SectorData[]) => {
    const currentData = data || { indices: [], keyStats: [], marketMood: 'neutral' as const };

    // 转换为 SectorRotationData 格式
    const sectorRotationData: SectorRotationData[] = sectors.map(s => ({
      name: s.name,
      change: s.change,
      mainNetInflow: s.mainNetInflow,
      mainNetRatio: s.mainNetRatio,
      superLargeNetInflow: s.superLargeNetInflow,
      superLargeNetRatio: s.superLargeNetRatio,
      largeNetInflow: s.largeNetInflow,
      largeNetRatio: s.largeNetRatio,
      mediumNetInflow: s.mediumNetInflow,
      mediumNetRatio: s.mediumNetRatio,
      smallNetInflow: s.smallNetInflow,
      smallNetRatio: s.smallNetRatio,
      topStock: s.topStock,
    }));

    onChange({
      ...currentData,
      sectorRotation: sectorRotationData,
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

  // 格式化金额（元 -> 亿/万）
  const formatAmount = (value: number): string => {
    if (Math.abs(value) >= 1e8) {
      return (value / 1e8).toFixed(2) + '亿';
    } else if (Math.abs(value) >= 1e4) {
      return (value / 1e4).toFixed(2) + '万';
    }
    return value.toFixed(2);
  };

  // 初始化加载数据
  useEffect(() => {
    fetchAllIndices();
    fetchSectorRotation();
  }, []);

  // 自动刷新（每5分钟）
  useEffect(() => {
    const interval = setInterval(() => {
      fetchAllIndices();
      fetchSectorRotation();
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
          <div className="flex items-center gap-4 p-3 bg-surface/50 rounded-lg border text-sm">
            <div>
              <span className="text-muted-foreground">涨/跌: </span>
              <span className="font-medium text-up">{marketStatus.upCount}</span>
              <span className="text-muted-foreground"> / </span>
              <span className="font-medium text-down">{marketStatus.downCount}</span>
            </div>
            <div>
              <span className="text-muted-foreground">平均涨跌: </span>
              <span className={cn("font-medium font-mono tabular-nums", marketStatus.avgChange >= 0 ? 'text-up' : 'text-down')}>
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
                <RefreshCw className={cn("w-4 h-4", isLoading && 'animate-spin')} />
                刷新
              </button>
            </div>
          </div>

          {/* 配置面板 */}
          {showConfig && (
            <div className="p-3 bg-surface/50 rounded-lg border">
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm font-medium">选择要显示的指数</span>
                <div className="flex items-center gap-2">
                  <button
                    onClick={resetToDefault}
                    className="text-xs px-2 py-1 bg-surface hover:bg-surface-hover border rounded transition-colors"
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
                  className="w-full pl-9 pr-8 py-2 text-sm border rounded-lg bg-surface focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary"
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
                        className={cn(
                          "w-full flex items-center justify-between px-3 py-2 rounded text-sm transition-colors",
                          isSelected
                            ? 'bg-primary text-primary-foreground'
                            : 'bg-surface hover:bg-surface-hover'
                        )}
                      >
                        <div className="flex items-center gap-2 flex-1">
                          {isSelected && <Check className="w-4 h-4" />}
                          <span className="font-medium">{idx.name}</span>
                          <span className="text-xs opacity-70">({idx.rawCode})</span>
                        </div>
                        <div className={cn("text-xs font-medium font-mono tabular-nums", isPositive ? 'text-up' : 'text-down')}>
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
            <div className="text-center py-4 text-down text-sm">
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
                    className={cn(
                      "p-3 border rounded-lg transition-colors cursor-default",
                      isPositive ? "border-up/30 bg-up/5 hover:bg-up/10" : "border-down/30 bg-down/5 hover:bg-down/10"
                    )}
                  >
                    <div className="text-xs text-muted-foreground mb-1 truncate" title={idx.name}>
                      {idx.name}
                    </div>
                    <div className="text-lg font-bold font-mono tabular-nums mb-1">
                      {idx.price?.toFixed(2) || '--'}
                    </div>
                    <div className={cn("flex items-center gap-1 text-sm", isFlat ? 'text-flat' : isPositive ? 'text-up' : 'text-down')}>
                      {isFlat ? (
                        <Minus className="w-3 h-3" />
                      ) : isPositive ? (
                        <TrendingUp className="w-3 h-3" />
                      ) : (
                        <TrendingDown className="w-3 h-3" />
                      )}
                      <span className="font-mono tabular-nums">{isPositive ? '+' : ''}{idx.change?.toFixed(2) || '0.00'}%</span>
                    </div>
                    {/* 显示高开低收 */}
                    <div className="mt-2 text-xs text-muted-foreground space-y-0.5">
                      <div className="flex justify-between font-mono tabular-nums">
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

        {/* 板块轮动 */}
        <div className="space-y-3 pt-3 border-t">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-medium text-muted-foreground">
              板块轮动
              <span className="ml-2 text-xs text-muted-foreground">({sectorData.length})</span>
            </h4>
            <button
              onClick={fetchSectorRotation}
              disabled={sectorLoading}
              className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors disabled:opacity-50"
            >
              <RefreshCw className={cn("w-4 h-4", sectorLoading && 'animate-spin')} />
              刷新
            </button>
          </div>

          {sectorError ? (
            <div className="text-center py-4 text-down text-sm">
              {sectorError}
            </div>
          ) : sectorData.length === 0 ? (
            <div className="text-center py-4 text-muted-foreground text-sm">
              {sectorLoading ? '加载中...' : '暂无板块数据'}
            </div>
          ) : (
            <div className="border rounded-lg overflow-hidden">
              {/* 表头 */}
              <div className="grid grid-cols-4 gap-2 px-3 py-2 bg-surface/50 text-xs text-muted-foreground font-medium">
                <div>板块名称</div>
                <div className="text-right">涨幅</div>
                <div className="text-right">主力净流入</div>
                <div className="text-right">主力净占比</div>
              </div>
              {/* 数据行 */}
              {(showAllSectors ? sectorData : sectorData.slice(0, 10)).map((sector) => {
                const isExpanded = expandedSector === sector.name;
                const isPositive = sector.change >= 0;

                return (
                  <div key={sector.name} className="border-t">
                    {/* 主行 */}
                    <div
                      className={cn(
                        "grid grid-cols-4 gap-2 px-3 py-2 cursor-pointer hover:bg-surface/50 transition-colors",
                        isExpanded && "bg-surface/30"
                      )}
                      onClick={() => setExpandedSector(isExpanded ? null : sector.name)}
                    >
                      <div className="flex items-center gap-1">
                        {isExpanded ? (
                          <ChevronUp className="w-3 h-3 text-muted-foreground" />
                        ) : (
                          <ChevronDown className="w-3 h-3 text-muted-foreground" />
                        )}
                        <span className="text-sm truncate">{sector.name}</span>
                      </div>
                      <div className={cn(
                        "text-right text-sm font-mono tabular-nums",
                        isPositive ? "text-up" : "text-down"
                      )}>
                        {isPositive ? '+' : ''}{sector.change.toFixed(2)}%
                      </div>
                      <div className={cn(
                        "text-right text-sm font-mono tabular-nums",
                        sector.mainNetInflow >= 0 ? "text-up" : "text-down"
                      )}>
                        {sector.mainNetInflow >= 0 ? '+' : ''}{formatAmount(sector.mainNetInflow)}
                      </div>
                      <div className={cn(
                        "text-right text-sm font-mono tabular-nums",
                        sector.mainNetRatio >= 0 ? "text-up" : "text-down"
                      )}>
                        {sector.mainNetRatio >= 0 ? '+' : ''}{sector.mainNetRatio.toFixed(2)}%
                      </div>
                    </div>
                    {/* 展开详情 */}
                    {isExpanded && (
                      <div className="px-3 py-3 bg-surface/30 text-sm space-y-2">
                        {sector.topStock && (
                          <div className="text-muted-foreground">
                            领涨股: <span className="text-foreground font-medium">{sector.topStock}</span>
                          </div>
                        )}
                        <div className="grid grid-cols-2 gap-4 text-xs">
                          <div className="space-y-1">
                            <div className="text-muted-foreground">超大单</div>
                            <div className={cn(
                              "font-mono tabular-nums",
                              sector.superLargeNetInflow >= 0 ? "text-up" : "text-down"
                            )}>
                              {sector.superLargeNetInflow >= 0 ? '+' : ''}{formatAmount(sector.superLargeNetInflow)} ({sector.superLargeNetRatio >= 0 ? '+' : ''}{sector.superLargeNetRatio.toFixed(2)}%)
                            </div>
                          </div>
                          <div className="space-y-1">
                            <div className="text-muted-foreground">大单</div>
                            <div className={cn(
                              "font-mono tabular-nums",
                              sector.largeNetInflow >= 0 ? "text-up" : "text-down"
                            )}>
                              {sector.largeNetInflow >= 0 ? '+' : ''}{formatAmount(sector.largeNetInflow)} ({sector.largeNetRatio >= 0 ? '+' : ''}{sector.largeNetRatio.toFixed(2)}%)
                            </div>
                          </div>
                          <div className="space-y-1">
                            <div className="text-muted-foreground">中单</div>
                            <div className={cn(
                              "font-mono tabular-nums",
                              sector.mediumNetInflow >= 0 ? "text-up" : "text-down"
                            )}>
                              {sector.mediumNetInflow >= 0 ? '+' : ''}{formatAmount(sector.mediumNetInflow)} ({sector.mediumNetRatio >= 0 ? '+' : ''}{sector.mediumNetRatio.toFixed(2)}%)
                            </div>
                          </div>
                          <div className="space-y-1">
                            <div className="text-muted-foreground">小单</div>
                            <div className={cn(
                              "font-mono tabular-nums",
                              sector.smallNetInflow >= 0 ? "text-up" : "text-down"
                            )}>
                              {sector.smallNetInflow >= 0 ? '+' : ''}{formatAmount(sector.smallNetInflow)} ({sector.smallNetRatio >= 0 ? '+' : ''}{sector.smallNetRatio.toFixed(2)}%)
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
              {/* 查看全部/收起 */}
              {sectorData.length > 10 && (
                <div className="text-center py-2">
                  <button
                    onClick={() => setShowAllSectors(!showAllSectors)}
                    className="text-xs text-primary hover:underline"
                  >
                    {showAllSectors ? '收起' : `查看全部 (${sectorData.length} 个板块)`}
                  </button>
                </div>
              )}
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
