import type { DailyReview } from './review'
import type { WeeklyReview } from './weeklyReview'
import type { Position, ProfitSummary, Transaction } from '.'

/** 分享内容模块 */
export interface ShareModules {
  dailyReview: boolean;      // 日复盘
  weeklyReview: boolean;     // 周复盘
  positions: boolean;        // 持仓明细
  profitStats: boolean;      // 收益统计
  profitCurve: boolean;      // 收益曲线
  transactions: boolean;     // 交易记录
}

/** 脱敏配置 */
export interface PrivacyConfig {
  hideAmount: boolean;       // 隐藏金额
  hideStockCode: boolean;    // 隐藏股票代码
  hideAccountName: boolean;  // 隐藏账户名
  hideQuantity: boolean;     // 隐藏持仓数量
  hideCostPrice: boolean;    // 隐藏成本价
  percentOnly: boolean;      // 只显示百分比
}

/** 脱敏预设类型 */
export type PrivacyPreset = 'public' | 'light' | 'medium' | 'heavy';

/** 图片模板风格 */
export type ShareTemplateStyle = 'simple' | 'card' | 'dark' | 'report';

/** 图片尺寸预设 */
export type ImageSizePreset = 'wechat-moment' | 'wechat-group' | 'xiaohongshu' | 'long' | 'custom';

/** 样式配置 */
export interface ShareStyleConfig {
  template: ShareTemplateStyle;        // 模板风格
  customWatermark?: string;            // 自定义水印文字
  imageSize: ImageSizePreset;          // 图片尺寸预设
  customWidth?: number;                // 自定义宽度（当 imageSize 为 custom 时使用）
}

/** 完整分享配置 */
export interface ShareConfig {
  modules: ShareModules;
  moduleOrder: string[];               // 模块显示顺序
  privacy: PrivacyConfig;
  style: ShareStyleConfig;
}

/** 分享数据（聚合后的数据） */
export interface ShareData {
  // 日复盘数据
  dailyReview?: DailyReview;

  // 周复盘数据
  weeklyReview?: WeeklyReview;

  // 持仓数据
  positions?: Position[];

  // 收益统计
  profitSummary?: ProfitSummary;

  // 收益曲线数据（可选）
  profitCurveData?: ProfitCurvePoint[];

  // 交易记录
  transactions?: ShareTransaction[];
}

/** 收益曲线数据点 */
export interface ProfitCurvePoint {
  date: string;
  value: number;
  change: number;
}

/** 分享用交易记录（脱敏后） */
export interface ShareTransaction {
  date: string;
  symbol: string;
  name: string;
  type: 'buy' | 'sell';
  price: number;
  quantity: number;
  amount: number;
  reasons?: string[];
}

/** 分享模板（用户保存的配置） */
export interface ShareTemplate {
  id: string;
  name: string;
  config: ShareConfig;
  isDefault?: boolean;
  createdAt: number;
  updatedAt: number;
}

/** 导出格式 */
export type ExportFormat = 'image' | 'pdf' | 'markdown';

/** 导出结果 */
export interface ExportResult {
  success: boolean;
  format: ExportFormat;
  dataUrl?: string;          // base64 数据（图片）
  blob?: Blob;               // 文件二进制（PDF）
  text?: string;             // 文本内容（Markdown）
  filename: string;
  error?: string;
}

/** 脱敏预设配置 */
export const PRIVACY_PRESETS: Record<PrivacyPreset, PrivacyConfig> = {
  public: {
    hideAmount: false,
    hideStockCode: false,
    hideAccountName: false,
    hideQuantity: false,
    hideCostPrice: false,
    percentOnly: false,
  },
  light: {
    hideAmount: false,
    hideStockCode: false,
    hideAccountName: false,
    hideQuantity: true,
    hideCostPrice: true,
    percentOnly: false,
  },
  medium: {
    hideAmount: true,
    hideStockCode: false,
    hideAccountName: false,
    hideQuantity: true,
    hideCostPrice: true,
    percentOnly: false,
  },
  heavy: {
    hideAmount: true,
    hideStockCode: true,
    hideAccountName: true,
    hideQuantity: true,
    hideCostPrice: true,
    percentOnly: true,
  },
};

/** 默认分享配置 */
export const DEFAULT_SHARE_CONFIG: ShareConfig = {
  modules: {
    dailyReview: true,
    weeklyReview: false,
    positions: false,
    profitStats: true,
    profitCurve: false,
    transactions: false,
  },
  moduleOrder: ['dailyReview', 'profitStats', 'positions', 'transactions', 'profitCurve'],
  privacy: PRIVACY_PRESETS.public,
  style: {
    template: 'simple',
    imageSize: 'wechat-moment',
  },
};

/** 图片尺寸配置 */
export const IMAGE_SIZE_CONFIG: Record<ImageSizePreset, { width: number; height?: number; label: string }> = {
  'wechat-moment': { width: 1080, height: 1920, label: '朋友圈 (9:16)' },
  'wechat-group': { width: 1080, height: 1080, label: '微信群 (1:1)' },
  'xiaohongshu': { width: 1080, height: 1440, label: '小红书 (3:4)' },
  'long': { width: 1080, label: '长图模式' },
  'custom': { width: 1080, label: '自定义' },
};
