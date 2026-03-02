import { ChevronRight } from 'lucide-react'
import { Button } from '../ui/button'
import TurtleTraceLogo from '../../assets/TurtleTraceLogo.png'

interface WelcomeStepProps {
  onNext: () => void
}

export function WelcomeStep({ onNext }: WelcomeStepProps) {
  return (
    <div className="flex flex-col items-center justify-center text-center px-8 py-12">
      {/* Logo */}
      <img
        src={TurtleTraceLogo}
        alt="龟迹复盘"
        className="h-20 w-auto mb-6"
      />

      {/* 标题 */}
      <h1 className="text-3xl font-bold mb-2">龟迹复盘</h1>
      <p className="text-lg text-muted-foreground mb-4">个人投资组合复盘工具</p>

      {/* 欢迎语 */}
      <p className="text-muted-foreground mb-8 max-w-md">
        欢迎使用龟迹复盘，开始您的投资记录之旅。
        记录每一笔交易，复盘每一次决策。
      </p>

      {/* 核心功能预览 */}
      <div className="flex gap-6 mb-10 text-sm text-muted-foreground">
        <div className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-primary" />
          <span>持仓追踪</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-primary" />
          <span>分批管理</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-primary" />
          <span>复盘分析</span>
        </div>
      </div>

      {/* 开始按钮 */}
      <Button size="lg" onClick={onNext} className="gap-2">
        开始使用
        <ChevronRight className="h-4 w-4" />
      </Button>
    </div>
  )
}
