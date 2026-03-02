import { Check, ChevronRight } from 'lucide-react'
import { Button } from '../ui/button'

interface CompleteStepProps {
  accountName: string
  onComplete: () => void
}

export function CompleteStep({ accountName, onComplete }: CompleteStepProps) {
  return (
    <div className="flex flex-col items-center justify-center text-center px-8 py-12">
      {/* 成功图标 */}
      <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mb-6">
        <Check className="h-10 w-10 text-primary" />
      </div>

      {/* 标题 */}
      <h1 className="text-2xl font-bold mb-2">配置完成！</h1>

      {/* 描述 */}
      <p className="text-muted-foreground mb-2">
        您的账户「<span className="text-foreground font-medium">{accountName}</span>」已创建成功
      </p>
      <p className="text-muted-foreground mb-8">
        现在可以开始记录您的持仓了
      </p>

      {/* 快速提示 */}
      <div className="bg-muted/50 rounded-lg p-4 mb-8 max-w-sm text-left">
        <p className="text-sm font-medium mb-2">快速开始</p>
        <ul className="text-sm text-muted-foreground space-y-1.5">
          <li className="flex items-start gap-2">
            <span className="text-primary">1.</span>
            <span>在「持仓管理」中添加您的第一只股票</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-primary">2.</span>
            <span>使用顶部「做T」按钮快速计算做T成本</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-primary">3.</span>
            <span>定期在「复盘管理」中回顾交易记录</span>
          </li>
        </ul>
      </div>

      {/* 完成按钮 */}
      <Button size="lg" onClick={onComplete} className="gap-2">
        开始记录
        <ChevronRight className="h-4 w-4" />
      </Button>
    </div>
  )
}
