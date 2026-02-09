/** 每日复盘记录 */
export interface DailyReview {
  id: string;                      // 唯一标识 (日期: YYYY-MM-DD)
  date: string;                    // 复盘日期
  createdAt: number;               // 创建时间戳
  updatedAt: number;               // 更新时间戳

  // 各个复盘板块
  marketData?: MarketReviewData;           // 大盘指数与关键数据
  sectorData?: SectorReviewData;           // 板块追踪与资金流向
  positionData?: PositionReviewData;       // 持仓买卖情况
  dragonTiger?: DragonTigerReviewData;     // 龙虎榜与机构动向
  newsDigest?: NewsDigestData;             // 消息面汇总和解读
  operations?: OperationsReviewData;       // 今日操作回顾与反思
  tomorrowPlan?: TomorrowPlanData;         // 明日策略与计划
  summary?: string;                        // 总结感悟
}

/** 大盘指数与关键数据 */
export interface MarketReviewData {
  indices: MarketIndex[];
  keyStats: KeyStat[];
  marketMood: 'bullish' | 'bearish' | 'neutral';  // 市场情绪
  moodNote?: string;           // 情绪备注
}

export interface MarketIndex {
  name: string;              // 指数名称 (上证指数、深证成指、创业板指等)
  code: string;              // 指数代码
  change: number;            // 涨跌幅
  changeAmount: number;      // 涨跌点数
  volume: number;            // 成交量
  amount: number;            // 成交额
}

export interface KeyStat {
  name: string;              // 统计名称
  value: string;             // 统计值
  trend: 'up' | 'down' | 'flat';  // 趋势
}

/** 板块追踪与资金流向 */
export interface SectorReviewData {
  hotSectors: SectorInfo[];
  coldSectors: SectorInfo[];
  overallFlow?: string;        // 整体资金流向分析
}

export interface SectorInfo {
  name: string;              // 板块名称
  change: number;            // 涨跌幅
  leadingStocks: string[];   // 领涨股
  fundFlow: number;          // 资金流入(亿)
  reason?: string;           // 上涨原因
}

/** 持仓买卖情况 */
export interface PositionReviewData {
  positions: PositionReviewItem[];
  dailySummary: DailyProfitSummary;
  soldToday?: SoldTodayItem[];                // 今日卖出记录
}

export interface PositionReviewItem {
  symbol: string;            // 股票代码
  name: string;              // 股票名称
  change: number;            // 当日涨跌幅
  dailyProfit: number;       // 当日盈亏
  totalProfit: number;       // 总盈亏
  currentPrice: number;      // 当前价格
  costPrice: number;         // 成本价
  quantity: number;          // 持仓数量
  note?: string;             // 备注分析
  // 次日预测价格
  nextHigh?: number;         // 次日最高价
  nextLow?: number;          // 次日最低价
  nextSecondaryHigh?: number; // 次日次高价
  nextSecondaryLow?: number;  // 次日次低价
}

export interface DailyProfitSummary {
  totalProfit: number;       // 当日总盈亏
  winCount: number;          // 盈利股票数
  lossCount: number;         // 亏损股票数
  winRate: number;           // 胜率
}

export interface SoldTodayItem {
  symbol: string;
  name: string;
  profit: number;
  profitRate: number;
  reason: string;
}

/** 龙虎榜与机构动向 */
export interface DragonTigerReviewData {
  stocks: DragonTigerStock[];
  summary?: string;            // 机构动向总结
}

export interface DragonTigerStock {
  symbol: string;
  name: string;
  reason: string;            // 上榜原因
  buySeats: string[];        // 买入席位
  sellSeats: string[];       // 卖出席位
  netBuy: number;            // 净买入额
  institution?: string;      // 机构类型
}

/** 消息面汇总和解读 */
export interface NewsDigestData {
  majorNews: NewsItem[];
  policyNews?: PolicyNews[];
  overall?: string;            // 整体消息面判断
}

export interface NewsItem {
  title: string;
  source: string;
  time: string;
  impact: 'positive' | 'negative' | 'neutral';
  relatedStocks?: string[];  // 相关股票
  interpretation?: string;   // 个人解读
}

export interface PolicyNews {
  title: string;
  content: string;
  impactSectors: string[];   // 影响板块
}

/** 今日操作回顾与反思 */
export interface OperationsReviewData {
  transactions: OperationTransaction[];
  reflection: OperationReflection;
}

export interface OperationTransaction {
  symbol: string;
  name: string;              // 股票名称
  type: 'buy' | 'sell';
  price: number;
  quantity: number;
  amount: number;
  mood: string;              // 操作时情绪
  reason: string[];          // 操作原因
}

export interface OperationReflection {
  whatWorked?: string;       // 做得好的地方
  whatFailed?: string;       // 做得不好的地方
  lessons?: string;          // 经验教训
  emotionalState?: string;   // 情绪状态反思
}

/** 明日策略与计划 */
export interface TomorrowPlanData {
  strategy: string;            // 整体策略方向
  watchList: WatchListItem[];
  riskControl: RiskControl;
  marketFocus?: string;        // 市场关注点
}

export interface WatchListItem {
  symbol: string;
  name: string;
  reason: string;            // 关注原因
  targetPrice?: number;      // 目标价格
  stopLoss?: number;         // 止损价位
  action: 'buy' | 'sell' | 'hold' | 'observe';
}

export interface RiskControl {
  maxPosition: number;       // 最大持仓金额
  stopLossRatio: number;     // 止损比例
}
