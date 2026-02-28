import { useState, useRef, useEffect } from 'react'
import { ChevronDown, Building2, Layers, Users, Plus, Settings, Check } from 'lucide-react'
import type { Account } from '../../types/account'
import { ACCOUNT_COLORS } from '../../types/account'

interface AccountSwitcherProps {
  accounts: Account[]
  currentAccountId: string | null  // null 表示全部账户
  onAccountChange: (accountId: string | null) => void
  onOpenManager: () => void
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

export function AccountSwitcher({
  accounts,
  currentAccountId,
  onAccountChange,
  onOpenManager,
}: AccountSwitcherProps) {
  const [isOpen, setIsOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  // 点击外部关闭下拉
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // 当前选中的账户
  const currentAccount = currentAccountId
    ? accounts.find(a => a.id === currentAccountId)
    : null

  // 计算总持仓数
  const totalPositions = accounts.length

  return (
    <div className="relative" ref={containerRef}>
      {/* 触发按钮 */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-surface hover:bg-surface-hover border transition-colors text-sm"
      >
        {currentAccount ? (
          <>
            <span
              className="w-2 h-2 rounded-full"
              style={{ backgroundColor: currentAccount.color || '#6b7280' }}
            />
            <span className="font-medium">{currentAccount.name}</span>
          </>
        ) : (
          <>
            <span className="text-muted-foreground">全部账户</span>
            <span className="text-xs text-muted-foreground">({totalPositions})</span>
          </>
        )}
        <ChevronDown className={`h-4 w-4 text-muted-foreground transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {/* 下拉菜单 */}
      {isOpen && (
        <div className="absolute top-full left-0 mt-1 w-56 bg-popover border rounded-lg shadow-lg z-50 py-1">
          {/* 全部账户选项 */}
          <button
            onClick={() => {
              onAccountChange(null)
              setIsOpen(false)
            }}
            className={`w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-surface-hover transition-colors ${
              currentAccountId === null ? 'bg-primary/10 text-primary' : ''
            }`}
          >
            <div className="w-6 h-6 rounded-full bg-muted flex items-center justify-center">
              <Layers className="h-3.5 w-3.5 text-muted-foreground" />
            </div>
            <span className="flex-1 text-left">全部账户</span>
            {currentAccountId === null && <Check className="h-4 w-4" />}
          </button>

          {/* 分隔线 */}
          <div className="my-1 border-t" />

          {/* 账户列表 */}
          {accounts.map(account => {
            const Icon = getAccountIcon(account.type)
            const isSelected = currentAccountId === account.id
            return (
              <button
                key={account.id}
                onClick={() => {
                  onAccountChange(account.id)
                  setIsOpen(false)
                }}
                className={`w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-surface-hover transition-colors ${
                  isSelected ? 'bg-primary/10 text-primary' : ''
                }`}
              >
                <div
                  className="w-6 h-6 rounded-full flex items-center justify-center"
                  style={{ backgroundColor: `${account.color || '#6b7280'}20` }}
                >
                  <Icon className="h-3.5 w-3.5" style={{ color: account.color || '#6b7280' }} />
                </div>
                <span className="flex-1 text-left truncate">{account.name}</span>
                {account.isDefault && (
                  <span className="text-xs text-muted-foreground">默认</span>
                )}
                {isSelected && <Check className="h-4 w-4" />}
              </button>
            )
          })}

          {/* 分隔线 */}
          <div className="my-1 border-t" />

          {/* 操作按钮 */}
          <button
            onClick={() => {
              setIsOpen(false)
              onOpenManager()
            }}
            className="w-full flex items-center gap-2 px-3 py-2 text-sm text-muted-foreground hover:bg-surface-hover transition-colors"
          >
            <Settings className="h-4 w-4" />
            <span>账户管理</span>
          </button>
        </div>
      )}
    </div>
  )
}
