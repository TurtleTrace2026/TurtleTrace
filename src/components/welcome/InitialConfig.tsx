import { useState } from 'react'
import { ChevronLeft, ChevronRight, ChevronDown, ChevronUp } from 'lucide-react'
import { Button } from '../ui/button'
import { Input } from '../ui/input'
import type { FeeConfig } from '../../types/tCalculator'
import { DEFAULT_FEE_CONFIG } from '../../types/tCalculator'
import { saveFeeConfig } from '../../services/tCalculatorService'

interface InitialConfigProps {
  onNext: () => void
  onPrev: () => void
  onConfigComplete: (accountName: string) => void
}

export function InitialConfig({ onNext, onPrev, onConfigComplete }: InitialConfigProps) {
  const [accountName, setAccountName] = useState('我的账户')
  const [showFeeSettings, setShowFeeSettings] = useState(false)
  const [feeConfig, setFeeConfig] = useState<FeeConfig>(DEFAULT_FEE_CONFIG)
  const [error, setError] = useState('')

  const handleNext = () => {
    const trimmedName = accountName.trim()
    if (!trimmedName) {
      setError('请输入账户名称')
      return
    }
    if (trimmedName.length > 20) {
      setError('账户名称不能超过20个字符')
      return
    }

    // 保存费率配置
    saveFeeConfig(feeConfig)

    // 通知配置完成
    onConfigComplete(trimmedName)
    onNext()
  }

  const handleFeeChange = (field: keyof FeeConfig, value: number) => {
    setFeeConfig(prev => ({
      ...prev,
      [field]: value,
    }))
  }

  // 格式化费率显示（转为万分之一）
  const formatRateDisplay = (rate: number) => {
    return (rate * 10000).toFixed(2)
  }

  // 解析费率输入（从万分之一转为小数）
  const parseRateInput = (value: number) => {
    return value / 10000
  }

  return (
    <div className="flex flex-col px-8 py-6 h-full">
      {/* 标题 */}
      <h2 className="text-xl font-semibold mb-6 text-center">初始配置</h2>

      {/* 必填配置 */}
      <div className="space-y-4 mb-6">
        <div>
          <label className="block text-sm font-medium mb-1.5">
            账户名称 <span className="text-destructive">*</span>
          </label>
          <Input
            value={accountName}
            onChange={(e) => {
              setAccountName(e.target.value)
              setError('')
            }}
            placeholder="输入账户名称"
            maxLength={20}
          />
          {error && (
            <p className="text-sm text-destructive mt-1">{error}</p>
          )}
          <p className="text-xs text-muted-foreground mt-1">
            用于区分不同的证券账户
          </p>
        </div>
      </div>

      {/* 分隔线 */}
      <div className="flex items-center gap-3 mb-4">
        <div className="flex-1 h-px bg-border" />
        <span className="text-xs text-muted-foreground">可选配置</span>
        <div className="flex-1 h-px bg-border" />
      </div>

      {/* 可选配置 - 费率设置 */}
      <div className="space-y-3">
        <button
          onClick={() => setShowFeeSettings(!showFeeSettings)}
          className="w-full flex items-center justify-between p-3 rounded-lg border hover:bg-surface-hover transition-colors"
        >
          <div className="text-left">
            <div className="text-sm font-medium">做T手续费设置</div>
            <div className="text-xs text-muted-foreground">
              佣金费率: {formatRateDisplay(feeConfig.commissionRate)}‰
            </div>
          </div>
          {showFeeSettings ? (
            <ChevronUp className="h-4 w-4 text-muted-foreground" />
          ) : (
            <ChevronDown className="h-4 w-4 text-muted-foreground" />
          )}
        </button>

        {showFeeSettings && (
          <div className="p-4 border rounded-lg space-y-4 bg-muted/30">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs text-muted-foreground mb-1">
                  佣金费率 (万分之一)
                </label>
                <Input
                  type="number"
                  value={formatRateDisplay(feeConfig.commissionRate)}
                  onChange={(e) => handleFeeChange('commissionRate', parseRateInput(Number(e.target.value)))}
                  step="0.01"
                  min="0"
                  className="font-mono text-sm"
                />
              </div>
              <div>
                <label className="block text-xs text-muted-foreground mb-1">
                  最低佣金 (元)
                </label>
                <Input
                  type="number"
                  value={feeConfig.minCommission}
                  onChange={(e) => handleFeeChange('minCommission', Number(e.target.value))}
                  step="1"
                  min="0"
                  className="font-mono text-sm"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs text-muted-foreground mb-1">
                  印花税率 (千分之一)
                </label>
                <Input
                  type="number"
                  value={(feeConfig.stampTaxRate * 1000).toFixed(1)}
                  onChange={(e) => handleFeeChange('stampTaxRate', Number(e.target.value) / 1000)}
                  step="0.1"
                  min="0"
                  className="font-mono text-sm"
                />
              </div>
              <div>
                <label className="block text-xs text-muted-foreground mb-1">
                  过户费率 (万分之一)
                </label>
                <Input
                  type="number"
                  value={formatRateDisplay(feeConfig.transferFeeRate)}
                  onChange={(e) => handleFeeChange('transferFeeRate', parseRateInput(Number(e.target.value)))}
                  step="0.01"
                  min="0"
                  className="font-mono text-sm"
                />
              </div>
            </div>
            <p className="text-xs text-muted-foreground">
              以上为A股默认费率，可在设置中随时修改
            </p>
          </div>
        )}
      </div>

      {/* 弹性空间 */}
      <div className="flex-1" />

      {/* 导航按钮 */}
      <div className="flex items-center justify-between pt-4">
        <Button variant="ghost" onClick={onPrev} className="gap-1">
          <ChevronLeft className="h-4 w-4" />
          上一步
        </Button>

        <div className="flex gap-2">
          <Button variant="outline" onClick={onNext}>
            跳过
          </Button>
          <Button onClick={handleNext} className="gap-1">
            下一步
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  )
}
