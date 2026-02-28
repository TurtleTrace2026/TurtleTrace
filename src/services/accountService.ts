import type {
  Account,
  AccountStats,
  AccountsStorage,
  CreateAccountInput,
  UpdateAccountInput,
} from '../types/account'
import type { Position } from '../types'

const STORAGE_KEY = 'turtletrace_accounts'
const CURRENT_VERSION = 2

// 生成唯一ID
function generateId(): string {
  return `account_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
}

// 获取存储数据
function getStorage(): AccountsStorage {
  const saved = localStorage.getItem(STORAGE_KEY)
  if (saved) {
    try {
      const data = JSON.parse(saved) as AccountsStorage
      // 版本迁移
      if (data.version < CURRENT_VERSION) {
        return migrateData(data)
      }
      return data
    } catch (e) {
      console.error('Failed to parse accounts storage:', e)
    }
  }
  // 返回默认存储结构
  return createDefaultStorage()
}

// 创建默认存储结构
function createDefaultStorage(): AccountsStorage {
  const defaultAccount: Account = {
    id: generateId(),
    name: '我的账户',
    type: 'broker',
    isDefault: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }
  return {
    version: CURRENT_VERSION,
    accounts: [defaultAccount],
    defaultAccountId: defaultAccount.id,
    lastActiveAccountId: defaultAccount.id,
  }
}

// 数据迁移
function migrateData(data: AccountsStorage): AccountsStorage {
  // V1 -> V2: 添加多账户支持
  if (!data.accounts || data.accounts.length === 0) {
    const defaultAccount: Account = {
      id: data.defaultAccountId || generateId(),
      name: '我的账户',
      type: 'broker',
      isDefault: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }
    data.accounts = [defaultAccount]
    data.defaultAccountId = defaultAccount.id
    data.lastActiveAccountId = defaultAccount.id
  }
  data.version = CURRENT_VERSION
  saveStorage(data)
  return data
}

// 保存存储数据
function saveStorage(data: AccountsStorage): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
}

// ==================== 账户管理 API ====================

// 获取所有账户
export function getAccounts(): Account[] {
  const storage = getStorage()
  return storage.accounts
}

// 获取单个账户
export function getAccount(id: string): Account | null {
  const accounts = getAccounts()
  return accounts.find(a => a.id === id) || null
}

// 创建账户
export function createAccount(input: CreateAccountInput): Account {
  const storage = getStorage()

  // 检查名称是否重复
  if (storage.accounts.some(a => a.name === input.name)) {
    throw new Error('账户名称已存在')
  }

  const newAccount: Account = {
    id: generateId(),
    name: input.name,
    type: input.type,
    broker: input.broker,
    description: input.description,
    color: input.color,
    isDefault: input.isDefault || false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }

  // 如果设为默认账户，取消其他账户的默认标记
  if (newAccount.isDefault) {
    storage.accounts = storage.accounts.map(a => ({
      ...a,
      isDefault: false,
    }))
    storage.defaultAccountId = newAccount.id
  }

  storage.accounts.push(newAccount)
  saveStorage(storage)

  return newAccount
}

// 更新账户
export function updateAccount(id: string, input: UpdateAccountInput): Account {
  const storage = getStorage()
  const index = storage.accounts.findIndex(a => a.id === id)

  if (index === -1) {
    throw new Error('账户不存在')
  }

  // 检查名称是否与其他账户重复
  if (input.name && storage.accounts.some(a => a.id !== id && a.name === input.name)) {
    throw new Error('账户名称已存在')
  }

  // 如果设为默认账户，取消其他账户的默认标记
  if (input.isDefault) {
    storage.accounts = storage.accounts.map(a => ({
      ...a,
      isDefault: a.id === id,
    }))
    storage.defaultAccountId = id
  }

  storage.accounts[index] = {
    ...storage.accounts[index],
    ...input,
    updatedAt: new Date().toISOString(),
  }

  saveStorage(storage)
  return storage.accounts[index]
}

// 删除账户
export function deleteAccount(id: string): boolean {
  const storage = getStorage()
  const account = storage.accounts.find(a => a.id === id)

  if (!account) {
    throw new Error('账户不存在')
  }

  // 不能删除默认账户
  if (account.isDefault) {
    throw new Error('不能删除默认账户')
  }

  // 检查是否还有持仓
  const positions = getPositionsForAccount(id)
  if (positions.some(p => p.quantity > 0)) {
    throw new Error('该账户还有持仓，请先清仓后再删除')
  }

  storage.accounts = storage.accounts.filter(a => a.id !== id)

  // 如果删除的是最后活跃账户，切换到默认账户
  if (storage.lastActiveAccountId === id) {
    storage.lastActiveAccountId = storage.defaultAccountId
  }

  saveStorage(storage)
  return true
}

// 获取默认账户
export function getDefaultAccount(): Account {
  const storage = getStorage()
  const account = storage.accounts.find(a => a.id === storage.defaultAccountId)
  return account || storage.accounts[0]
}

// 设置默认账户
export function setDefaultAccount(id: string): void {
  const storage = getStorage()
  const account = storage.accounts.find(a => a.id === id)

  if (!account) {
    throw new Error('账户不存在')
  }

  storage.accounts = storage.accounts.map(a => ({
    ...a,
    isDefault: a.id === id,
  }))
  storage.defaultAccountId = id
  saveStorage(storage)
}

// 获取最后活跃账户
export function getLastActiveAccount(): Account {
  const storage = getStorage()
  const account = storage.accounts.find(a => a.id === storage.lastActiveAccountId)
  return account || getDefaultAccount()
}

// 设置最后活跃账户
export function setLastActiveAccount(id: string): void {
  const storage = getStorage()
  if (storage.accounts.some(a => a.id === id)) {
    storage.lastActiveAccountId = id
    saveStorage(storage)
  }
}

// ==================== 账户统计 API ====================

// 从 localStorage 获取所有持仓（内部函数）
function loadPositionsFromStorage(): Position[] {
  const saved = localStorage.getItem('stock-positions')
  if (saved) {
    try {
      return JSON.parse(saved) as Position[]
    } catch (e) {
      console.error('Failed to load positions:', e)
    }
  }
  return []
}

// 保存所有持仓（内部函数）
function saveAllPositions(positions: Position[]): void {
  if (positions.length > 0) {
    localStorage.setItem('stock-positions', JSON.stringify(positions))
  } else {
    localStorage.removeItem('stock-positions')
  }
}

// 获取指定账户的持仓
export function getPositionsForAccount(accountId: string): Position[] {
  const allPositions = loadPositionsFromStorage()
  return allPositions.filter(p => p.accountId === accountId)
}

// 获取所有账户的持仓
export function getAllPositions(): Position[] {
  return loadPositionsFromStorage()
}

// 获取账户统计
export function getAccountStats(accountId: string, positions?: Position[]): AccountStats {
  const account = getAccount(accountId)
  if (!account) {
    // 账户不存在时返回默认值（可能是初始化阶段）
    return {
      accountId: accountId,
      accountName: '未知账户',
      totalCost: 0,
      totalValue: 0,
      totalProfit: 0,
      profitRate: 0,
      positionCount: 0,
      todayProfit: 0,
      todayProfitRate: 0,
    }
  }

  const accountPositions = positions || getPositionsForAccount(accountId)
  const activePositions = accountPositions.filter(p => p.quantity > 0)

  const totalCost = activePositions.reduce(
    (sum, p) => sum + p.costPrice * p.quantity,
    0
  )
  const totalValue = activePositions.reduce(
    (sum, p) => sum + p.currentPrice * p.quantity,
    0
  )
  const totalProfit = totalValue - totalCost
  const profitRate = totalCost > 0 ? (totalProfit / totalCost) * 100 : 0

  return {
    accountId: account.id,
    accountName: account.name,
    totalCost,
    totalValue,
    totalProfit,
    profitRate,
    positionCount: activePositions.length,
    todayProfit: 0, // TODO: 需要历史价格数据支持
    todayProfitRate: 0,
  }
}

// 获取所有账户统计
export function getAllAccountStats(): AccountStats[] {
  const accounts = getAccounts()
  const allPositions = getAllPositions()
  return accounts.map(account =>
    getAccountStats(account.id, allPositions.filter(p => p.accountId === account.id))
  )
}

// 获取汇总统计
export function getTotalStats(): AccountStats {
  const accounts = getAccounts()
  const allPositions = getAllPositions()
  const activePositions = allPositions.filter(p => p.quantity > 0)

  const totalCost = activePositions.reduce(
    (sum, p) => sum + p.costPrice * p.quantity,
    0
  )
  const totalValue = activePositions.reduce(
    (sum, p) => sum + p.currentPrice * p.quantity,
    0
  )
  const totalProfit = totalValue - totalCost
  const profitRate = totalCost > 0 ? (totalProfit / totalCost) * 100 : 0

  return {
    accountId: 'total',
    accountName: '全部账户',
    totalCost,
    totalValue,
    totalProfit,
    profitRate,
    positionCount: activePositions.length,
    todayProfit: 0,
    todayProfitRate: 0,
  }
}

// ==================== 数据迁移 API ====================

// 迁移旧数据（将现有持仓关联到默认账户）
export function migrateLegacyPositions(): void {
  const allPositions = getAllPositions()
  const storage = getStorage()
  let needsMigration = false

  const migratedPositions = allPositions.map(pos => {
    if (!pos.accountId) {
      needsMigration = true
      return {
        ...pos,
        accountId: storage.defaultAccountId,
      }
    }
    return pos
  })

  if (needsMigration) {
    saveAllPositions(migratedPositions)
    console.log('Positions migrated to multi-account structure')
  }
}

// 初始化账户系统（首次使用时调用）
export function initializeAccountSystem(): {
  storage: AccountsStorage
  migrated: boolean
} {
  let storage = getStorage()
  let migrated = false

  // 检查是否需要迁移持仓数据
  const allPositions = getAllPositions()
  const hasUnassignedPositions = allPositions.some(p => !p.accountId)

  if (hasUnassignedPositions) {
    migrateLegacyPositions()
    migrated = true
  }

  return { storage, migrated }
}

// ==================== 持仓管理 API ====================

// 添加持仓到指定账户
export function addPositionToAccount(accountId: string, position: Position): void {
  const allPositions = getAllPositions()
  position.accountId = accountId
  allPositions.push(position)
  saveAllPositions(allPositions)
}

// 更新持仓
export function updatePosition(position: Position): void {
  const allPositions = getAllPositions()
  const index = allPositions.findIndex(p => p.id === position.id)
  if (index !== -1) {
    allPositions[index] = position
    saveAllPositions(allPositions)
  }
}

// 删除持仓
export function deletePosition(positionId: string): void {
  const allPositions = getAllPositions()
  const filtered = allPositions.filter(p => p.id !== positionId)
  saveAllPositions(filtered)
}

// 获取持仓（按账户筛选或全部）
export function getPositions(accountId?: string): Position[] {
  const allPositions = getAllPositions()
  if (accountId && accountId !== 'total') {
    return allPositions.filter(p => p.accountId === accountId)
  }
  return allPositions
}
