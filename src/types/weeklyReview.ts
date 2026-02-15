/** 每周复盘记录 */
export interface WeeklyReview {
  id: string;                      // 唯一标识 (周: YYYY-Www)
  weekLabel: string;               // 周标识 (例: 2025-W03)
  startDate: string;               // 周开始日期 (YYYY-MM-DD)
  endDate: string;                 // 周结束日期 (YYYY-MM-DD)
  createdAt: number;               // 创建时间戳
  updatedAt: number;               // 更新时间戳

  // 各个复盘板块
  coreGoals?: CoreGoalsData;                 // 本周核心目标回顾
  achievements?: AchievementsData;           // 本周成果评估
  resourceAnalysis?: ResourceAnalysisData;   // 资源投入分析
  marketRhythm?: MarketRhythmData;           // 关键信号与市场节奏判断
  nextWeekStrategy?: NextWeekStrategyData;   // 下周核心策略制定
  keyInsight?: string;                       // 本周最大认知收获
}

/** 本周核心目标回顾 */
export interface CoreGoalsData {
  mainSectors: string[];          // 主线板块 (1-2个)
  coreLogic: string;              // 核心逻辑 (政策催化、行业景气度等)
}

/** 本周成果评估 */
export interface AchievementsData {
  marketPerformance: MarketPerformance;      // 大盘表现
  sectorPerformance: SectorPerformance;      // 主线板块收益
  highlights: string[];                      // 个股操作亮点
  lowlights: string[];                       // 个股操作槽点
  // 数据统计
  mainSectorPosition: number;                // 主线仓位占比 (百分比)
  totalProfitLoss: number;                   // 总体盈亏
  winRate: number;                           // 胜率 (百分比)
}

export interface MarketPerformance {
  shanghaiChange: number;                    // 上证涨跌幅
  shanghaiVolumeTrend: 'up' | 'down' | 'flat';  // 成交量变化趋势
  chinextChange: number;                     // 创业板涨跌幅
  chinextVolumeTrend: 'up' | 'down' | 'flat'; // 创业板成交量趋势
  note?: string;                             // 备注说明
}

export interface SectorPerformance {
  sectorChange: number;                      // 板块整体涨幅
  marketChange: number;                      // 大盘涨幅
  outperformance: number;                    // 跑赢大盘百分点
  note?: string;                             // 说明
}

/** 资源投入分析 */
export interface ResourceAnalysisData {
  focusedOnMain: boolean;                    // 资金是否集中在主线上
  scatteredAttention: boolean;               // 是否过度关注非主线杂毛股
  tradingFrequency: 'excessive' | 'moderate' | 'missed';  // 操作频率
}

/** 关键信号与市场节奏判断 */
export interface MarketRhythmData {
  emotionCycle: EmotionCyclePhase;           // 情绪周期阶段
  keySignals: string[];                      // 核心验证信号
  northwardFunds: string;                    // 北向资金趋势
  volume: string;                            // 量能趋势
  limitUpCount: string;                      // 涨停家数趋势
}

export type EmotionCyclePhase = 'startup' | 'main_rise' | 'climax' | 'divergence' | 'retreat';

/** 下周核心策略制定 */
export interface NextWeekStrategyData {
  mainSector: string;                        // 唯一聚焦主线
  catalystEvents: string[];                  // 潜在杠杆事件
  positionPlan: PositionPlan;                // 仓位管理计划
  focusTargets: FocusTarget[];               // 重点关注标的 (≤3只)
  riskControl: WeeklyRiskControl;            // 风控底线
}

export interface PositionPlan {
  mainRise: string;                          // 情绪主升期仓位 (如: 7~9成)
  divergence: string;                        // 分歧/退潮期仓位 (如: ≤3成)
}

export interface FocusTarget {
  name: string;                              // 标的名称
  symbol: string;                            // 股票代码
  logic: string;                             // 买入逻辑
}

export interface WeeklyRiskControl {
  maxSingleLoss: number;                     // 单票最大亏损容忍 (百分比)
  retreatPosition: number;                   // 主线退潮时减仓至 (成数)
}

/** 获取周标识 */
export function getWeekLabel(date: Date): string {
  const year = date.getFullYear();
  const week = getWeekNumber(date);
  return `${year}-W${String(week).padStart(2, '0')}`;
}

/** 获取周的开始和结束日期 */
export function getWeekRange(weekLabel: string): { startDate: string; endDate: string } {
  const [year, weekStr] = weekLabel.split('-');
  const week = parseInt(weekStr.replace('W', ''), 10);
  const yearNum = parseInt(year, 10);

  const startDate = new Date(yearNum, 0, 1 + (week - 1) * 7);
  const dayOfWeek = startDate.getDay();
  const diff = startDate.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1);
  startDate.setDate(diff);

  const endDate = new Date(startDate);
  endDate.setDate(startDate.getDate() + 6);

  return {
    startDate: formatDate(startDate),
    endDate: formatDate(endDate),
  };
}

/** 获取周数 */
function getWeekNumber(date: Date): number {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  return Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
}

/** 格式化日期 */
function formatDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/** 获取当前周的标识 */
export function getCurrentWeekLabel(): string {
  return getWeekLabel(new Date());
}

/** 获取指定日期所在周的标识 */
export function getWeekLabelForDate(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return getWeekLabel(d);
}
