import { useState, useEffect } from 'react'
import { Button } from '../ui/button'
import { Input } from '../ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card'
import { Badge } from '../ui/badge'
import {
  Plus,
  Trash2,
  Edit2,
  Building2,
  Layers,
  Users,
  X,
  Check,
  Star,
  Wallet,
} from 'lucide-react'
import type { Account, AccountStats, AccountType, CreateAccountInput, UpdateAccountInput } from '../../types/account'
import { BROKERS, ACCOUNT_COLORS } from '../../types/account'
import {
  getAccounts,
  createAccount,
  updateAccount,
  deleteAccount,
  getAccountStats,
  getAllAccountStats,
  getTotalStats,
  setDefaultAccount,
  getPositionsForAccount,
} from '../../services/accountService'
import { formatCurrency, formatPercent } from '../../lib/utils'

interface AccountManagerProps {
  onClose?: () => void
  onAccountChange?: () => void
}

// 获取账户类型图标
function getAccountIcon(type: string) {
  switch (type) {
    case 'broker':
      return Building2
    case 'strategy':
      return Layers
    case 'family':
      return Users
    default:
      return Building2
  }
}

// 获取账户类型名称
function getAccountTypeName(type: string) {
  switch (type) {
    case 'broker':
      return '券商账户'
    case 'strategy':
      return '策略账户'
    case 'family':
      return '家庭账户'
    default:
      return '未知类型'
  }
}

export function AccountManager({ onClose, onAccountChange }: AccountManagerProps) {
  const [accounts, setAccounts] = useState<Account[]>([])
  const [accountStats, setAccountStats] = useState<AccountStats[]>([])
  const [totalStats, setTotalStats] = useState<AccountStats | null>(null)
  const [showAddForm, setShowAddForm] = useState(false)
  const [editingAccount, setEditingAccount] = useState<Account | null>(null)
  const [error, setError] = useState('')

  // 表单状态
  const [formName, setFormName] = useState('')
  const [formType, setFormType] = useState<AccountType>('broker')
  const [formBroker, setFormBroker] = useState('')
  const [formDescription, setFormDescription] = useState('')
  const [formColor, setFormColor] = useState(ACCOUNT_COLORS[0].value)
  const [formIsDefault, setFormIsDefault] = useState(false)

  // 加载数据
  const loadData = () => {
    const accountsData = getAccounts()
    setAccounts(accountsData)
    setAccountStats(getAllAccountStats())
    setTotalStats(getTotalStats())
  }

  useEffect(() => {
    loadData()
  }, [])

  // 重置表单
  const resetForm = () => {
    setFormName('')
    setFormType('broker')
    setFormBroker('')
    setFormDescription('')
    setFormColor(ACCOUNT_COLORS[0].value)
    setFormIsDefault(false)
    setError('')
    setEditingAccount(null)
    setShowAddForm(false)
  }

  // 开始编辑
  const startEdit = (account: Account) => {
    setEditingAccount(account)
    setFormName(account.name)
    setFormType(account.type)
    setFormBroker(account.broker || '')
    setFormDescription(account.description || '')
    setFormColor(account.color || ACCOUNT_COLORS[0].value)
    setFormIsDefault(account.isDefault)
    setShowAddForm(true)
    setError('')
  }

  // 提交表单
  const handleSubmit = () => {
    setError('')

    if (!formName.trim()) {
      setError('请输入账户名称')
      return
    }

    try {
      if (editingAccount) {
        // 更新账户
        const input: UpdateAccountInput = {
          name: formName.trim(),
          type: formType,
          broker: formType === 'broker' ? formBroker : undefined,
          description: formDescription.trim() || undefined,
          color: formColor,
          isDefault: formIsDefault,
        }
        updateAccount(editingAccount.id, input)
      } else {
        // 创建账户
        const input: CreateAccountInput = {
          name: formName.trim(),
          type: formType,
          broker: formType === 'broker' ? formBroker : undefined,
          description: formDescription.trim() || undefined,
          color: formColor,
          isDefault: formIsDefault,
        }
        createAccount(input)
      }

      loadData()
      resetForm()
      onAccountChange?.()
    } catch (e) {
      setError(e instanceof Error ? e.message : '操作失败')
    }
  }

  // 删除账户
  const handleDelete = (account: Account) => {
    if (!confirm(`确定要删除账户"${account.name}"吗？\n\n注意：删除账户将同时删除该账户下的所有持仓数据。`)) {
      return
    }

    try {
      deleteAccount(account.id)
      loadData()
      onAccountChange?.()
    } catch (e) {
      alert(e instanceof Error ? e.message : '删除失败')
    }
  }

  // 设为默认
  const handleSetDefault = (account: Account) => {
    setDefaultAccount(account.id)
    loadData()
    onAccountChange?.()
  }

  return (
    <div className="space-y-6">
      {/* 标题和操作 */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold">账户管理</h2>
          <p className="text-sm text-muted-foreground">管理您的证券账户和投资策略账户</p>
        </div>
        {!showAddForm && (
          <Button onClick={() => setShowAddForm(true)}>
            <Plus className="h-4 w-4 mr-1" />
            添加账户
          </Button>
        )}
      </div>

      {/* 添加/编辑表单 */}
      {showAddForm && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">
                {editingAccount ? '编辑账户' : '添加新账户'}
              </CardTitle>
              <Button variant="ghost" size="icon" onClick={resetForm}>
                <X className="h-4 w-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* 账户名称 */}
            <div className="space-y-2">
              <label className="text-sm font-medium">账户名称 *</label>
              <Input
                placeholder="如：招商证券、长线账户"
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
              />
            </div>

            {/* 账户类型 */}
            <div className="space-y-2">
              <label className="text-sm font-medium">账户类型 *</label>
              <div className="flex gap-2">
                {(['broker', 'strategy', 'family'] as AccountType[]).map((type) => {
                  const Icon = getAccountIcon(type)
                  return (
                    <Button
                      key={type}
                      variant={formType === type ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setFormType(type)}
                      className="flex items-center gap-1"
                    >
                      <Icon className="h-4 w-4" />
                      {getAccountTypeName(type)}
                    </Button>
                  )
                })}
              </div>
            </div>

            {/* 券商选择 */}
            {formType === 'broker' && (
              <div className="space-y-2">
                <label className="text-sm font-medium">券商名称</label>
                <select
                  className="w-full h-10 px-3 rounded-md border bg-background"
                  value={formBroker}
                  onChange={(e) => setFormBroker(e.target.value)}
                >
                  <option value="">请选择券商</option>
                  {BROKERS.map((broker) => (
                    <option key={broker.code} value={broker.name}>
                      {broker.name}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* 标识颜色 */}
            <div className="space-y-2">
              <label className="text-sm font-medium">标识颜色</label>
              <div className="flex gap-2">
                {ACCOUNT_COLORS.map((color) => (
                  <button
                    key={color.value}
                    type="button"
                    onClick={() => setFormColor(color.value)}
                    className={`w-8 h-8 rounded-full border-2 transition-transform ${
                      formColor === color.value ? 'scale-110 border-foreground' : 'border-transparent'
                    }`}
                    style={{ backgroundColor: color.value }}
                    title={color.name}
                  />
                ))}
              </div>
            </div>

            {/* 备注 */}
            <div className="space-y-2">
              <label className="text-sm font-medium">备注</label>
              <Input
                placeholder="可选备注信息"
                value={formDescription}
                onChange={(e) => setFormDescription(e.target.value)}
              />
            </div>

            {/* 设为默认 */}
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="isDefault"
                checked={formIsDefault}
                onChange={(e) => setFormIsDefault(e.target.checked)}
                className="rounded"
              />
              <label htmlFor="isDefault" className="text-sm">
                设为默认账户
              </label>
            </div>

            {/* 错误提示 */}
            {error && (
              <div className="text-sm text-destructive">{error}</div>
            )}

            {/* 操作按钮 */}
            <div className="flex gap-2">
              <Button onClick={handleSubmit}>
                {editingAccount ? '保存修改' : '创建账户'}
              </Button>
              <Button variant="ghost" onClick={resetForm}>
                取消
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* 全部账户汇总 */}
      {totalStats && accounts.length > 1 && (
        <Card className="bg-gradient-to-r from-primary/5 to-primary/10">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-primary/10 rounded-lg">
                <Wallet className="h-5 w-5 text-primary" />
              </div>
              <div>
                <div className="font-medium">全部账户汇总</div>
                <div className="text-xs text-muted-foreground">{accounts.length} 个账户</div>
              </div>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div>
                <div className="text-muted-foreground">总市值</div>
                <div className="font-medium font-mono">{formatCurrency(totalStats.totalValue)}</div>
              </div>
              <div>
                <div className="text-muted-foreground">总成本</div>
                <div className="font-medium font-mono">{formatCurrency(totalStats.totalCost)}</div>
              </div>
              <div>
                <div className="text-muted-foreground">总盈亏</div>
                <div className={`font-medium font-mono ${totalStats.totalProfit >= 0 ? 'text-up' : 'text-down'}`}>
                  {formatCurrency(totalStats.totalProfit)}
                </div>
              </div>
              <div>
                <div className="text-muted-foreground">总收益率</div>
                <div className={`font-medium font-mono ${totalStats.profitRate >= 0 ? 'text-up' : 'text-down'}`}>
                  {formatPercent(totalStats.profitRate)}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* 账户列表 */}
      <div className="space-y-4">
        {accounts.map((account) => {
          const stats = accountStats.find(s => s.accountId === account.id)
          const Icon = getAccountIcon(account.type)
          const positionCount = getPositionsForAccount(account.id).filter(p => p.quantity > 0).length

          return (
            <Card key={account.id} className="card-hover">
              <CardContent className="pt-6">
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3">
                    <div
                      className="p-2 rounded-lg"
                      style={{ backgroundColor: `${account.color || '#6b7280'}20` }}
                    >
                      <Icon className="h-5 w-5" style={{ color: account.color || '#6b7280' }} />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{account.name}</span>
                        {account.isDefault && (
                          <Badge variant="secondary" className="text-xs">
                            <Star className="h-3 w-3 mr-1" />
                            默认
                          </Badge>
                        )}
                      </div>
                      <div className="text-sm text-muted-foreground mt-1">
                        {getAccountTypeName(account.type)}
                        {account.broker && ` · ${account.broker}`}
                      </div>
                      {account.description && (
                        <div className="text-xs text-muted-foreground mt-1">
                          {account.description}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-1">
                    {!account.isDefault && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleSetDefault(account)}
                        title="设为默认"
                      >
                        <Star className="h-4 w-4" />
                      </Button>
                    )}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => startEdit(account)}
                    >
                      <Edit2 className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDelete(account)}
                      disabled={account.isDefault}
                      className="text-destructive hover:text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                {/* 账户统计 */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4 pt-4 border-t text-sm">
                  <div>
                    <div className="text-muted-foreground">持仓数量</div>
                    <div className="font-medium">{positionCount} 只</div>
                  </div>
                  <div>
                    <div className="text-muted-foreground">持仓市值</div>
                    <div className="font-medium font-mono">
                      {formatCurrency(stats?.totalValue || 0)}
                    </div>
                  </div>
                  <div>
                    <div className="text-muted-foreground">持仓盈亏</div>
                    <div className={`font-medium font-mono ${(stats?.totalProfit || 0) >= 0 ? 'text-up' : 'text-down'}`}>
                      {formatCurrency(stats?.totalProfit || 0)}
                    </div>
                  </div>
                  <div>
                    <div className="text-muted-foreground">收益率</div>
                    <div className={`font-medium font-mono ${(stats?.profitRate || 0) >= 0 ? 'text-up' : 'text-down'}`}>
                      {formatPercent(stats?.profitRate || 0)}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* 空状态 */}
      {accounts.length === 0 && !showAddForm && (
        <div className="text-center py-12 text-muted-foreground">
          <Building2 className="h-12 w-12 mx-auto mb-4 opacity-50" />
          <p>暂无账户</p>
          <p className="text-sm mt-2">点击上方"添加账户"按钮创建您的第一个账户</p>
        </div>
      )}
    </div>
  )
}
