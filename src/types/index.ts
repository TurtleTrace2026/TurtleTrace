// 交易类型
export type TransactionType = 'buy' | 'sell'

// 交易情绪标签
export interface EmotionTag {
  id: string
  name: string
  color: string
}

// 交易原因标签
export interface ReasonTag {
  id: string
  name: string
  color: string
}

// 交易记录
export interface Transaction {
  id: string
  type: TransactionType  // 买入或卖出
  price: number          // 成交价格
  quantity: number       // 成交数量
  amount: number         // 成交金额
  timestamp: number      // 交易时间戳
  emotion?: EmotionTag   // 情绪标签（单选）
  reasons?: ReasonTag[]  // 交易原因（多选）
}

// 股票持仓数据
export interface Position {
  id: string
  accountId?: string    // 所属账户ID（多账户支持）
  symbol: string        // 股票代码，如 "600519.SH"
  name: string          // 股票名称，如 "贵州茅台"
  costPrice: number     // 成本价（根据买卖记录动态计算）
  quantity: number      // 当前持仓数量
  currentPrice: number  // 当前价格
  changePercent: number // 涨跌幅 (%)
  high?: number         // 当日最高价
  low?: number          // 当日最低价
  open?: number         // 当日开盘价
  transactions: Transaction[]  // 交易记录
  totalBuyAmount: number  // 累计买入金额（用于计算成本）
  totalSellAmount: number // 累计卖出金额（用于计算成本）
}

// 股票实时行情
export interface StockQuote {
  symbol: string
  name: string
  price: number
  change: number        // 涨跌额
  changePercent: number // 涨跌幅 (%)
  open: number          // 开盘价
  high: number          // 最高价
  low: number           // 最低价
  volume: number        // 成交量
  timestamp: number     // 时间戳
}

// 清仓股票收益
export interface ClearedProfit {
  totalBuyAmount: number      // 清仓股票总买入金额
  totalSellAmount: number     // 清仓股票总卖出金额
  totalProfit: number         // 清仓总盈亏
  totalProfitPercent: number  // 清仓总收益率
  count: number               // 清仓股票数量
  positions: ClearedPositionProfit[] // 各清仓股盈亏
}

export interface ClearedPositionProfit {
  symbol: string
  name: string
  buyAmount: number      // 买入金额
  sellAmount: number     // 卖出金额
  profit: number         // 盈亏
  profitPercent: number  // 收益率
}

// 收益计算结果
export interface ProfitSummary {
  totalCost: number         // 总成本
  totalValue: number        // 总市值
  totalProfit: number       // 总盈亏
  totalProfitPercent: number // 总收益率
  positions: PositionProfit[] // 各股盈亏
  clearedProfit?: ClearedProfit // 清仓股票收益
}

export interface PositionProfit {
  symbol: string
  name: string
  cost: number
  value: number
  profit: number
  profitPercent: number
  quantity: number
  currentPrice: number
  // 次日预测价格
  nextHigh?: number
  nextLow?: number
  nextSecondaryHigh?: number
  nextSecondaryLow?: number
}

// 新闻条目
export interface NewsItem {
  id: string
  title: string
  source: string
  url: string
  publishTime: string  // 原始时间字符串
  summary?: string
  relatedSymbols: string[] // 相关股票代码
}

// 导出数据格式
export interface ExportData {
  version: string
  exportTime: number
  positions: Position[]
  summary: ProfitSummary
}
