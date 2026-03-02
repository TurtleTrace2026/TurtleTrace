import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { WelcomeStep } from './WelcomeStep'
import { FeatureIntro } from './FeatureIntro'
import { InitialConfig } from './InitialConfig'
import { CompleteStep } from './CompleteStep'
import { markWelcomeCompleted } from '../../services/welcomeService'
import { createAccount, setLastActiveAccount } from '../../services/accountService'

interface WelcomeWizardProps {
  onComplete: () => void
}

const TOTAL_STEPS = 4

export function WelcomeWizard({ onComplete }: WelcomeWizardProps) {
  const [currentStep, setCurrentStep] = useState(0)
  const [accountName, setAccountName] = useState('我的账户')

  const goToNextStep = () => {
    if (currentStep < TOTAL_STEPS - 1) {
      setCurrentStep(currentStep + 1)
    }
  }

  const goToPrevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1)
    }
  }

  const handleConfigComplete = (name: string) => {
    setAccountName(name)
  }

  const handleFinalComplete = () => {
    // 创建账户
    try {
      const account = createAccount({
        name: accountName,
        type: 'broker',
        isDefault: true,
      })
      setLastActiveAccount(account.id)
    } catch (e) {
      // 如果账户已存在或其他错误，忽略并继续
      console.error('Failed to create account:', e)
    }

    // 标记欢迎流程完成
    markWelcomeCompleted()

    // 通知父组件
    onComplete()
  }

  const renderStep = () => {
    switch (currentStep) {
      case 0:
        return <WelcomeStep onNext={goToNextStep} />
      case 1:
        return <FeatureIntro onNext={goToNextStep} onPrev={goToPrevStep} />
      case 2:
        return (
          <InitialConfig
            onNext={goToNextStep}
            onPrev={goToPrevStep}
            onConfigComplete={handleConfigComplete}
          />
        )
      case 3:
        return (
          <CompleteStep
            accountName={accountName}
            onComplete={handleFinalComplete}
          />
        )
      default:
        return null
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-background">
      {/* 进度指示器 */}
      <div className="absolute top-6 left-1/2 -translate-x-1/2 flex items-center gap-2">
        {Array.from({ length: TOTAL_STEPS }).map((_, index) => (
          <div
            key={index}
            className={`w-2 h-2 rounded-full transition-colors ${
              index === currentStep
                ? 'bg-primary'
                : index < currentStep
                ? 'bg-primary/50'
                : 'bg-muted-foreground/30'
            }`}
          />
        ))}
      </div>

      {/* 内容区域 */}
      <div className="w-full max-w-md h-[500px] relative">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentStep}
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -30 }}
            transition={{ duration: 0.2 }}
            className="w-full h-full bg-card border rounded-xl shadow-lg overflow-hidden"
          >
            {renderStep()}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* 步骤指示文字 */}
      <div className="absolute bottom-6 text-xs text-muted-foreground">
        {currentStep + 1} / {TOTAL_STEPS}
      </div>
    </div>
  )
}
