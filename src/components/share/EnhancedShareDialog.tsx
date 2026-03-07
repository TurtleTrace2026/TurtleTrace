import React, { useState, useRef } from 'react'
import {
  X,
  Share2,
  Check,
  Download,
  Copy,
  FileText,
  Image,
  FileDown,
  Eye,
  Settings2,
  Palette,
  Shield,
} from 'lucide-react'
import { cn } from '../../lib/utils'
import type {
  ShareConfig,
  ShareData,
  PrivacyPreset,
  ShareTemplateStyle,
  ImageSizePreset,
  ExportResult,
} from '../../types/share'
import {
  DEFAULT_SHARE_CONFIG,
  PRIVACY_PRESETS,
  IMAGE_SIZE_CONFIG,
} from '../../types/share'
import { shareService } from '../../services/shareService'
import { ShareTemplateSimple } from './ShareTemplateSimple'
import { ShareTemplateCard } from './ShareTemplateCard'
import type { DailyReview } from '../../types/review'
import type { ProfitSummary, Position } from '../../types'

interface EnhancedShareDialogProps {
  isOpen: boolean
  onClose: () => void
  dailyReview?: DailyReview
  positions?: Position[]
  profitSummary?: ProfitSummary
}

type Step = 'content' | 'privacy' | 'style' | 'preview'

const PRIVACY_PRESET_LABELS: Record<PrivacyPreset, string> = {
  public: '完全公开',
  light: '轻度脱敏',
  medium: '中度脱敏',
  heavy: '重度脱敏',
}

const TEMPLATE_LABELS: Record<ShareTemplateStyle, string> = {
  simple: '简约白',
  card: '卡片风',
  dark: '深色模式',
  report: '财报风',
}

export const EnhancedShareDialog: React.FC<EnhancedShareDialogProps> = ({
  isOpen,
  onClose,
  dailyReview,
  positions = [],
  profitSummary,
}) => {
  const [config, setConfig] = useState<ShareConfig>(DEFAULT_SHARE_CONFIG)
  const [currentStep, setCurrentStep] = useState<Step>('content')
  const [isGenerating, setIsGenerating] = useState(false)
  const [exportResult, setExportResult] = useState<ExportResult | null>(null)
  const [copied, setCopied] = useState(false)
  const previewRef = useRef<HTMLDivElement>(null)

  if (!isOpen) return null

  // 更新模块选择
  const toggleModule = (module: keyof ShareConfig['modules']) => {
    setConfig((prev) => ({
      ...prev,
      modules: {
        ...prev.modules,
        [module]: !prev.modules[module],
      },
    }))
  }

  // 更新脱敏配置
  const updatePrivacy = (key: keyof ShareConfig['privacy'], value: boolean) => {
    setConfig((prev) => ({
      ...prev,
      privacy: {
        ...prev.privacy,
        [key]: value,
      },
    }))
  }

  // 应用脱敏预设
  const applyPrivacyPreset = (preset: PrivacyPreset) => {
    setConfig((prev) => ({
      ...prev,
      privacy: PRIVACY_PRESETS[preset],
    }))
  }

  // 更新模板
  const updateTemplate = (template: ShareTemplateStyle) => {
    setConfig((prev) => ({
      ...prev,
      style: {
        ...prev.style,
        template,
      },
    }))
  }

  // 更新图片尺寸
  const updateImageSize = (size: ImageSizePreset) => {
    setConfig((prev) => ({
      ...prev,
      style: {
        ...prev.style,
        imageSize: size,
      },
    }))
  }

  // 更新自定义水印
  const updateWatermark = (watermark: string) => {
    setConfig((prev) => ({
      ...prev,
      style: {
        ...prev.style,
        customWatermark: watermark,
      },
    }))
  }

  // 准备分享数据
  const shareData: ShareData = {
    dailyReview,
    positions,
    profitSummary,
  }

  // 生成图片
  const handleGenerateImage = async () => {
    if (!previewRef.current) return

    setIsGenerating(true)
    try {
      const { width } = shareService.getImageSize(
        config.style.imageSize,
        config.style.customWidth
      )
      const result = await shareService.generateImage(previewRef.current, width)
      setExportResult(result)

      if (result.success) {
        shareService.downloadFile(result)
      }
    } finally {
      setIsGenerating(false)
    }
  }

  // 生成 PDF
  const handleGeneratePDF = async () => {
    if (!previewRef.current) return

    setIsGenerating(true)
    try {
      const result = await shareService.generatePDF(previewRef.current)
      setExportResult(result)

      if (result.success) {
        shareService.downloadFile(result)
      }
    } finally {
      setIsGenerating(false)
    }
  }

  // 生成 Markdown
  const handleGenerateMarkdown = () => {
    setIsGenerating(true)
    try {
      const result = shareService.generateMarkdown(shareData, config)
      setExportResult(result)

      if (result.success) {
        shareService.downloadFile(result)
      }
    } finally {
      setIsGenerating(false)
    }
  }

  // 复制到剪贴板
  const handleCopy = async () => {
    if (exportResult?.format === 'image' && exportResult.dataUrl) {
      const success = await shareService.copyImageToClipboard(exportResult.dataUrl)
      if (success) {
        setCopied(true)
        setTimeout(() => setCopied(false), 2000)
      }
    } else if (exportResult?.format === 'markdown' && exportResult.text) {
      const success = await shareService.copyTextToClipboard(exportResult.text)
      if (success) {
        setCopied(true)
        setTimeout(() => setCopied(false), 2000)
      }
    }
  }

  // 渲染预览内容
  const renderPreview = () => {
    const templateProps = {
      data: shareData,
      config,
      width: 400, // 预览时使用较小宽度
    }

    switch (config.style.template) {
      case 'card':
        return <ShareTemplateCard {...templateProps} />
      case 'dark':
        // 暂时使用简约模板，后续可以添加深色模板
        return <ShareTemplateSimple {...templateProps} />
      case 'report':
        // 暂时使用简约模板，后续可以添加财报模板
        return <ShareTemplateSimple {...templateProps} />
      default:
        return <ShareTemplateSimple {...templateProps} />
    }
  }

  // 步骤配置
  const steps: { id: Step; label: string; icon: React.ReactNode }[] = [
    { id: 'content', label: '内容', icon: <FileText className="h-4 w-4" /> },
    { id: 'privacy', label: '脱敏', icon: <Shield className="h-4 w-4" /> },
    { id: 'style', label: '样式', icon: <Palette className="h-4 w-4" /> },
    { id: 'preview', label: '预览', icon: <Eye className="h-4 w-4" /> },
  ]

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-background rounded-xl shadow-2xl max-w-5xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* 头部 */}
        <div className="flex items-center justify-between px-6 py-4 border-b bg-background">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-primary/10 rounded-lg">
              <Share2 className="h-5 w-5 text-primary" />
            </div>
            <h2 className="text-lg font-semibold">分享设置</h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-surface-hover rounded-lg transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* 步骤指示器 */}
        <div className="flex items-center gap-1 px-6 py-3 bg-surface/50 border-b">
          {steps.map((step, index) => (
            <React.Fragment key={step.id}>
              <button
                onClick={() => setCurrentStep(step.id)}
                className={cn(
                  'flex items-center gap-2 px-3 py-1.5 rounded-full text-sm transition-colors',
                  currentStep === step.id
                    ? 'bg-primary text-primary-foreground'
                    : 'hover:bg-surface-hover text-muted-foreground'
                )}
              >
                {step.icon}
                {step.label}
              </button>
              {index < steps.length - 1 && (
                <div className="w-8 h-px bg-border mx-1" />
              )}
            </React.Fragment>
          ))}
        </div>

        {/* 内容区域 */}
        <div className="flex-1 overflow-y-auto p-6">
          {/* 内容选择 */}
          {currentStep === 'content' && (
            <div className="space-y-4">
              <h3 className="text-sm font-medium text-muted-foreground">
                选择要分享的内容模块
              </h3>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { key: 'dailyReview' as const, label: '日复盘', desc: '市场数据、持仓表现、操作记录' },
                  { key: 'profitStats' as const, label: '收益统计', desc: '总市值、收益率、盈亏' },
                  { key: 'positions' as const, label: '持仓明细', desc: '股票名称、持仓量、成本' },
                  { key: 'transactions' as const, label: '交易记录', desc: '买卖记录、交易理由' },
                ].map((item) => (
                  <button
                    key={item.key}
                    onClick={() => toggleModule(item.key)}
                    className={cn(
                      'flex flex-col items-start p-4 rounded-lg border-2 transition-all text-left',
                      config.modules[item.key]
                        ? 'border-primary bg-primary/5'
                        : 'border-border hover:border-primary/50'
                    )}
                  >
                    <div className="flex items-center gap-2">
                      <div
                        className={cn(
                          'w-5 h-5 rounded border-2 flex items-center justify-center',
                          config.modules[item.key]
                            ? 'bg-primary border-primary'
                            : 'border-muted-foreground'
                        )}
                      >
                        {config.modules[item.key] && (
                          <Check className="h-3 w-3 text-primary-foreground" />
                        )}
                      </div>
                      <span className="font-medium">{item.label}</span>
                    </div>
                    <span className="text-xs text-muted-foreground mt-1 ml-7">
                      {item.desc}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* 脱敏配置 */}
          {currentStep === 'privacy' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-sm font-medium text-muted-foreground mb-3">
                  快速选择脱敏级别
                </h3>
                <div className="flex gap-2">
                  {(Object.keys(PRIVACY_PRESETS) as PrivacyPreset[]).map((preset) => (
                    <button
                      key={preset}
                      onClick={() => applyPrivacyPreset(preset)}
                      className={cn(
                        'px-4 py-2 rounded-lg border transition-colors',
                        JSON.stringify(config.privacy) ===
                          JSON.stringify(PRIVACY_PRESETS[preset])
                          ? 'border-primary bg-primary text-primary-foreground'
                          : 'border-border hover:border-primary/50'
                      )}
                    >
                      {PRIVACY_PRESET_LABELS[preset]}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <h3 className="text-sm font-medium text-muted-foreground mb-3">
                  自定义脱敏选项
                </h3>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { key: 'hideAmount' as const, label: '隐藏金额', desc: '金额显示为 ***' },
                    { key: 'hideStockCode' as const, label: '隐藏股票代码', desc: '只显示股票名称' },
                    { key: 'hideAccountName' as const, label: '隐藏账户名', desc: '账户名替换为通用名称' },
                    { key: 'hideQuantity' as const, label: '隐藏持仓数量', desc: '数量显示为 ***' },
                    { key: 'hideCostPrice' as const, label: '隐藏成本价', desc: '成本价显示为 ***' },
                    { key: 'percentOnly' as const, label: '只显示涨跌幅', desc: '所有数值只展示百分比' },
                  ].map((item) => (
                    <label
                      key={item.key}
                      className="flex items-start gap-3 p-3 rounded-lg border cursor-pointer hover:bg-surface/50"
                    >
                      <input
                        type="checkbox"
                        checked={config.privacy[item.key]}
                        onChange={(e) => updatePrivacy(item.key, e.target.checked)}
                        className="mt-0.5"
                      />
                      <div>
                        <div className="font-medium text-sm">{item.label}</div>
                        <div className="text-xs text-muted-foreground">{item.desc}</div>
                      </div>
                    </label>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* 样式配置 */}
          {currentStep === 'style' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-sm font-medium text-muted-foreground mb-3">
                  图片模板
                </h3>
                <div className="grid grid-cols-2 gap-3">
                  {(['simple', 'card'] as ShareTemplateStyle[]).map((template) => (
                    <button
                      key={template}
                      onClick={() => updateTemplate(template)}
                      className={cn(
                        'p-4 rounded-lg border-2 transition-all text-left',
                        config.style.template === template
                          ? 'border-primary bg-primary/5'
                          : 'border-border hover:border-primary/50'
                      )}
                    >
                      <div className="font-medium">{TEMPLATE_LABELS[template]}</div>
                      <div className="text-xs text-muted-foreground mt-1">
                        {template === 'simple' && '白底简洁排版，重点突出'}
                        {template === 'card' && '圆角卡片、阴影层次、现代感'}
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <h3 className="text-sm font-medium text-muted-foreground mb-3">
                  图片尺寸
                </h3>
                <div className="flex flex-wrap gap-2">
                  {(
                    ['wechat-moment', 'wechat-group', 'xiaohongshu', 'long'] as ImageSizePreset[]
                  ).map((size) => (
                    <button
                      key={size}
                      onClick={() => updateImageSize(size)}
                      className={cn(
                        'px-4 py-2 rounded-lg border transition-colors',
                        config.style.imageSize === size
                          ? 'border-primary bg-primary text-primary-foreground'
                          : 'border-border hover:border-primary/50'
                      )}
                    >
                      {IMAGE_SIZE_CONFIG[size].label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <h3 className="text-sm font-medium text-muted-foreground mb-3">
                  自定义水印（可选）
                </h3>
                <input
                  type="text"
                  value={config.style.customWatermark || ''}
                  onChange={(e) => updateWatermark(e.target.value)}
                  placeholder="例如：投资是一场修行 @某雪球ID"
                  className="w-full px-4 py-2 rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/50"
                />
              </div>
            </div>
          )}

          {/* 预览和导出 */}
          {currentStep === 'preview' && (
            <div className="space-y-6">
              <div className="flex justify-center">
                <div
                  ref={previewRef}
                  className="rounded-lg overflow-hidden shadow-xl"
                  style={{ maxWidth: '100%', transform: 'scale(0.6)', transformOrigin: 'top center' }}
                >
                  {renderPreview()}
                </div>
              </div>

              {/* 导出按钮 */}
              <div className="flex justify-center gap-3">
                <button
                  onClick={handleGenerateImage}
                  disabled={isGenerating}
                  className="flex items-center gap-2 px-6 py-3 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 disabled:opacity-50 transition-colors"
                >
                  <Image className="h-5 w-5" />
                  {isGenerating ? '生成中...' : '生成图片'}
                </button>
                <button
                  onClick={handleGeneratePDF}
                  disabled={isGenerating}
                  className="flex items-center gap-2 px-6 py-3 bg-secondary text-secondary-foreground rounded-lg hover:bg-secondary/80 disabled:opacity-50 transition-colors"
                >
                  <FileDown className="h-5 w-5" />
                  生成 PDF
                </button>
                <button
                  onClick={handleGenerateMarkdown}
                  disabled={isGenerating}
                  className="flex items-center gap-2 px-6 py-3 bg-secondary text-secondary-foreground rounded-lg hover:bg-secondary/80 disabled:opacity-50 transition-colors"
                >
                  <FileText className="h-5 w-5" />
                  生成 Markdown
                </button>
              </div>

              {/* 导出结果 */}
              {exportResult && (
                <div className="flex justify-center gap-3">
                  {exportResult.success ? (
                    <>
                      <button
                        onClick={handleCopy}
                        className="flex items-center gap-2 px-4 py-2 border border-border rounded-lg hover:bg-surface-hover transition-colors"
                      >
                        {copied ? (
                          <>
                            <Check className="h-4 w-4 text-green-500" />
                            已复制
                          </>
                        ) : (
                          <>
                            <Copy className="h-4 w-4" />
                            复制到剪贴板
                          </>
                        )}
                      </button>
                      <button
                        onClick={() => shareService.downloadFile(exportResult)}
                        className="flex items-center gap-2 px-4 py-2 border border-border rounded-lg hover:bg-surface-hover transition-colors"
                      >
                        <Download className="h-4 w-4" />
                        再次下载
                      </button>
                    </>
                  ) : (
                    <div className="text-red-500">{exportResult.error}</div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        {/* 底部导航 */}
        <div className="flex items-center justify-between px-6 py-4 border-t bg-background">
          <button
            onClick={() => {
              const currentIndex = steps.findIndex((s) => s.id === currentStep)
              if (currentIndex > 0) {
                setCurrentStep(steps[currentIndex - 1].id)
              }
            }}
            disabled={currentStep === 'content'}
            className="px-4 py-2 text-muted-foreground hover:text-foreground disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            上一步
          </button>
          <button
            onClick={() => {
              const currentIndex = steps.findIndex((s) => s.id === currentStep)
              if (currentIndex < steps.length - 1) {
                setCurrentStep(steps[currentIndex + 1].id)
              }
            }}
            disabled={currentStep === 'preview'}
            className="px-6 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            下一步
          </button>
        </div>
      </div>
    </div>
  )
}
