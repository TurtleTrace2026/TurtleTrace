// 账户类型
export type AccountType = 'broker' | 'strategy' | 'family'

// 账户实体
export interface Account {
  id: string                    // 账户唯一ID
  name: string                  // 账户名称（如"招商证券"、"长线账户"）
  type: AccountType             // 账户类型
  broker?: string               // 券商名称（type为broker时）
  description?: string          // 备注说明
  color?: string                // 标识颜色（用于UI区分）
  icon?: string                 // 图标
  isDefault: boolean            // 是否为默认账户
  createdAt: string             // 创建时间
  updatedAt: string             // 更新时间
}

// 账户统计（运行时计算）
export interface AccountStats {
  accountId: string
  accountName: string
  totalCost: number             // 总成本
  totalValue: number            // 总市值
  totalProfit: number           // 总盈亏
  profitRate: number            // 收益率
  positionCount: number         // 持仓数量
  todayProfit: number           // 今日盈亏
  todayProfitRate: number       // 今日收益率
}

// 存储结构
export interface AccountsStorage {
  version: number               // 数据版本号
  accounts: Account[]
  defaultAccountId: string      // 默认账户ID
  lastActiveAccountId: string   // 最后活跃账户
}

// 预置券商列表
export const BROKERS = [
  { code: 'zszq', name: '招商证券' },
  { code: 'htzq', name: '华泰证券' },
  { code: 'dfcf', name: '东方财富' },
  { code: 'gfzq', name: '广发证券' },
  { code: 'gtht', name: '国泰海通' },
  { code: 'hxzq', name: '华鑫证券' },
  { code: 'zgzq', name: '中国银河' },
  { code: 'txzq', name: '天风证券' },
  { code: 'gxzq', name: '国信证券' },
  { code: 'xazq', name: '兴业证券' },
  { code: 'msht', name: '民生证券' },
  { code: 'ajzq', name: '安信证券' },
  { code: 'other', name: '其他' },
]

// 账户颜色选项
export const ACCOUNT_COLORS = [
  { name: '蓝色', value: '#3b82f6' },
  { name: '绿色', value: '#22c55e' },
  { name: '橙色', value: '#f97316' },
  { name: '紫色', value: '#a855f7' },
  { name: '红色', value: '#ef4444' },
  { name: '青色', value: '#06b6d4' },
  { name: '粉色', value: '#ec4899' },
  { name: '灰色', value: '#6b7280' },
]

// 创建账户的输入参数
export interface CreateAccountInput {
  name: string
  type: AccountType
  broker?: string
  description?: string
  color?: string
  isDefault?: boolean
}

// 更新账户的输入参数
export interface UpdateAccountInput {
  name?: string
  type?: AccountType
  broker?: string
  description?: string
  color?: string
  isDefault?: boolean
}
