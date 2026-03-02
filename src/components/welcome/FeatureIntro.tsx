import { useState } from 'react'
import { ChevronLeft, ChevronRight, TrendingUp, Layers, BookOpen } from 'lucide-react'
import { Button } from '../ui/button'
import { motion, AnimatePresence } from 'framer-motion'

interface FeatureIntroProps {
  onNext: () => void
  onPrev: () => void
}

const features = [
  {
    id: 'tracking',
    icon: TrendingUp,
    title: '持仓追踪',
    description: '实时记录您的股票持仓，自动计算盈亏。支持多账户管理，清晰区分不同证券账户。',
    highlights: ['实时盈亏计算', '多账户支持', '交易记录追踪'],
  },
  {
    id: 'batch',
    icon: Layers,
    title: '分批管理',
    description: '支持股权激励等分批解禁场景，按批次独立追踪成本和解禁日期，自动识别可卖数量。',
    highlights: ['分批解禁追踪', '锁定状态自动识别', 'FIFO卖出分配'],
  },
  {
    id: 'review',
    icon: BookOpen,
    title: '复盘分析',
    description: '记录交易情绪和决策原因，定期回顾总结，不断提升投资决策质量。',
    highlights: ['交易情绪标签', 'AI智能复盘', '历史记录回顾'],
  },
]

export function FeatureIntro({ onNext, onPrev }: FeatureIntroProps) {
  const [currentIndex, setCurrentIndex] = useState(0)
  const currentFeature = features[currentIndex]
  const Icon = currentFeature.icon

  const handleNext = () => {
    if (currentIndex < features.length - 1) {
      setCurrentIndex(currentIndex + 1)
    } else {
      onNext()
    }
  }

  return (
    <div className="flex flex-col items-center px-8 py-8 h-full">
      {/* 标题 */}
      <h2 className="text-xl font-semibold mb-6">核心功能</h2>

      {/* 功能卡片 */}
      <div className="relative w-full max-w-md flex-1 flex items-center justify-center">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentFeature.id}
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -50 }}
            transition={{ duration: 0.2 }}
            className="w-full bg-card border rounded-xl p-6 shadow-sm"
          >
            {/* 图标 */}
            <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center mb-4">
              <Icon className="h-7 w-7 text-primary" />
            </div>

            {/* 标题 */}
            <h3 className="text-lg font-semibold mb-2">{currentFeature.title}</h3>

            {/* 描述 */}
            <p className="text-muted-foreground text-sm mb-4 leading-relaxed">
              {currentFeature.description}
            </p>

            {/* 亮点列表 */}
            <div className="space-y-2">
              {currentFeature.highlights.map((highlight, index) => (
                <div key={index} className="flex items-center gap-2 text-sm">
                  <span className="w-1.5 h-1.5 rounded-full bg-primary" />
                  <span>{highlight}</span>
                </div>
              ))}
            </div>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* 指示器 */}
      <div className="flex items-center gap-2 my-6">
        {features.map((_, index) => (
          <button
            key={index}
            onClick={() => setCurrentIndex(index)}
            className={`w-2 h-2 rounded-full transition-colors ${
              index === currentIndex ? 'bg-primary' : 'bg-muted-foreground/30'
            }`}
          />
        ))}
      </div>

      {/* 导航按钮 */}
      <div className="flex items-center justify-between w-full max-w-md">
        <Button
          variant="ghost"
          onClick={onPrev}
          className="gap-1"
        >
          <ChevronLeft className="h-4 w-4" />
          上一步
        </Button>

        <Button onClick={handleNext} className="gap-1">
          {currentIndex < features.length - 1 ? (
            <>
              下一步
              <ChevronRight className="h-4 w-4" />
            </>
          ) : (
            <>
              开始配置
              <ChevronRight className="h-4 w-4" />
            </>
          )}
        </Button>
      </div>
    </div>
  )
}
