import html2canvas from 'html2canvas'
import jsPDF from 'jspdf'
import type {
  ShareConfig,
  ShareData,
  PrivacyConfig,
  ExportResult,
  ExportFormat,
  IMAGE_SIZE_CONFIG,
} from '../types/share'
import { PRIVACY_PRESETS, IMAGE_SIZE_CONFIG as imageSizeConfig } from '../types/share'
import type { Position, ProfitSummary, Transaction } from '../types'
import type { DailyReview, PositionReviewItem } from '../types/review'

/**
 * 分享服务
 * 负责生成分享图片、PDF、Markdown
 */
class ShareService {
  /**
   * 应用脱敏配置到金额
   */
  formatAmount(amount: number, config: PrivacyConfig): string {
    if (config.percentOnly) {
      return '--'
    }
    if (config.hideAmount) {
      return '***'
    }
    return this.formatMoney(amount)
  }

  /**
   * 应用脱敏配置到股票代码
   */
  formatStockCode(symbol: string, name: string, config: PrivacyConfig): string {
    if (config.hideStockCode) {
      return name
    }
    return `${name}(${symbol})`
  }

  /**
   * 应用脱敏配置到数量
   */
  formatQuantity(quantity: number, config: PrivacyConfig): string {
    if (config.hideQuantity) {
      return '***'
    }
    return quantity.toLocaleString()
  }

  /**
   * 应用脱敏配置到成本价
   */
  formatCostPrice(price: number, config: PrivacyConfig): string {
    if (config.hideCostPrice) {
      return '***'
    }
    return price.toFixed(2)
  }

  /**
   * 格式化金额
   */
  formatMoney(amount: number): string {
    if (Math.abs(amount) >= 10000) {
      return `${(amount / 10000).toFixed(2)}万`
    }
    return amount.toFixed(2)
  }

  /**
   * 格式化百分比
   */
  formatPercent(percent: number): string {
    const sign = percent >= 0 ? '+' : ''
    return `${sign}${percent.toFixed(2)}%`
  }

  /**
   * 脱敏持仓数据
   */
  sanitizePositions(
    positions: Position[],
    config: PrivacyConfig
  ): Array<{
    name: string
    symbol: string
    displayCode: string
    quantity: string
    costPrice: string
    currentPrice: number
    change: number
    profit: number
    profitDisplay: string
  }> {
    return positions.map((pos) => ({
      name: pos.name,
      symbol: pos.symbol,
      displayCode: this.formatStockCode(pos.symbol, pos.name, config),
      quantity: this.formatQuantity(pos.quantity, config),
      costPrice: this.formatCostPrice(pos.costPrice, config),
      currentPrice: pos.currentPrice,
      change: pos.changePercent,
      profit: (pos.currentPrice - pos.costPrice) * pos.quantity,
      profitDisplay: config.percentOnly
        ? this.formatPercent(pos.changePercent)
        : this.formatAmount((pos.currentPrice - pos.costPrice) * pos.quantity, config),
    }))
  }

  /**
   * 脱敏收益统计
   */
  sanitizeProfitSummary(
    summary: ProfitSummary,
    config: PrivacyConfig
  ): {
    totalCost: string
    totalValue: string
    totalProfit: string
    totalProfitPercent: string
  } {
    return {
      totalCost: this.formatAmount(summary.totalCost, config),
      totalValue: this.formatAmount(summary.totalValue, config),
      totalProfit: config.percentOnly
        ? this.formatPercent(summary.totalProfitPercent)
        : this.formatAmount(summary.totalProfit, config),
      totalProfitPercent: this.formatPercent(summary.totalProfitPercent),
    }
  }

  /**
   * 生成图片
   */
  async generateImage(
    element: HTMLElement,
    width: number = 1080
  ): Promise<ExportResult> {
    try {
      const canvas = await html2canvas(element, {
        scale: 2, // 2x 高清
        useCORS: true,
        backgroundColor: '#ffffff',
        logging: false,
      })

      const dataUrl = canvas.toDataURL('image/png')
      const filename = this.generateFilename('image')

      return {
        success: true,
        format: 'image',
        dataUrl,
        filename,
      }
    } catch (error) {
      return {
        success: false,
        format: 'image',
        filename: '',
        error: error instanceof Error ? error.message : '生成图片失败',
      }
    }
  }

  /**
   * 生成 PDF
   */
  async generatePDF(element: HTMLElement): Promise<ExportResult> {
    try {
      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        backgroundColor: '#ffffff',
        logging: false,
      })

      const imgData = canvas.toDataURL('image/png')
      const imgWidth = canvas.width
      const imgHeight = canvas.height

      // A4 纸尺寸 (mm)
      const pdfWidth = 210
      const pdfHeight = 297

      // 计算缩放比例
      const ratio = pdfWidth / (imgWidth / 2)
      const scaledHeight = (imgHeight / 2) * ratio

      // 如果内容高度超过一页，创建多页 PDF
      const pdf = new jsPDF({
        orientation: scaledHeight > pdfHeight ? 'portrait' : 'portrait',
        unit: 'mm',
        format: 'a4',
      })

      let heightLeft = scaledHeight
      let position = 0

      // 添加第一页
      pdf.addImage(imgData, 'PNG', 0, position, pdfWidth, scaledHeight)
      heightLeft -= pdfHeight

      // 如果需要多页
      while (heightLeft > 0) {
        position = heightLeft - scaledHeight
        pdf.addPage()
        pdf.addImage(imgData, 'PNG', 0, position, pdfWidth, scaledHeight)
        heightLeft -= pdfHeight
      }

      const filename = this.generateFilename('pdf')
      const blob = pdf.output('blob')

      return {
        success: true,
        format: 'pdf',
        blob,
        filename,
      }
    } catch (error) {
      return {
        success: false,
        format: 'pdf',
        filename: '',
        error: error instanceof Error ? error.message : '生成PDF失败',
      }
    }
  }

  /**
   * 生成 Markdown
   */
  generateMarkdown(data: ShareData, config: ShareConfig): ExportResult {
    try {
      const lines: string[] = []
      const date = data.dailyReview?.date || new Date().toISOString().split('T')[0]

      // 标题
      lines.push(`# 📅 ${date} 复盘`)
      lines.push('')

      // 日复盘内容
      if (config.modules.dailyReview && data.dailyReview) {
        const review = data.dailyReview

        // 市场数据
        if (review.marketData) {
          lines.push('## 📊 市场数据')
          lines.push('')
          review.marketData.indices.forEach((index) => {
            lines.push(`- ${index.name}: ${index.changeAmount.toFixed(2)} (${this.formatPercent(index.change)})`)
          })
          lines.push('')
        }

        // 持仓表现
        if (review.positionData) {
          lines.push('## 💰 持仓表现')
          lines.push('')
          const summary = review.positionData.dailySummary
          lines.push(`- 当日盈亏: ${this.formatAmount(summary.totalProfit, config.privacy)}`)
          lines.push(`- 盈利/亏损: ${summary.winCount}/${summary.lossCount}`)
          lines.push('')

          if (!config.privacy.hideAmount) {
            lines.push('| 股票 | 涨跌 | 盈亏 |')
            lines.push('|------|------|------|')
            review.positionData.positions.forEach((pos) => {
              const displayCode = this.formatStockCode(pos.symbol, pos.name, config.privacy)
              lines.push(`| ${displayCode} | ${this.formatPercent(pos.change)} | ${this.formatAmount(pos.dailyProfit, config.privacy)} |`)
            })
            lines.push('')
          }
        }

        // 今日操作
        if (review.operations?.transactions?.length) {
          lines.push('## 📝 今日操作')
          lines.push('')
          review.operations.transactions.forEach((tx) => {
            lines.push(`- ${tx.type === 'buy' ? '买入' : '卖出'} ${tx.name}: ${tx.quantity}股 @ ${tx.price}`)
          })
          lines.push('')
        }

        // 明日计划
        if (review.tomorrowPlan) {
          lines.push('## 💭 明日计划')
          lines.push('')
          lines.push(review.tomorrowPlan.strategy)
          lines.push('')
        }

        // 总结
        if (review.summary) {
          lines.push('## 📌 总结')
          lines.push('')
          lines.push(review.summary)
          lines.push('')
        }
      }

      // 收益统计
      if (config.modules.profitStats && data.profitSummary) {
        const sanitized = this.sanitizeProfitSummary(data.profitSummary, config.privacy)
        lines.push('## 📈 收益统计')
        lines.push('')
        lines.push(`- 总市值: ${sanitized.totalValue}`)
        lines.push(`- 总盈亏: ${sanitized.totalProfit}`)
        lines.push(`- 收益率: ${sanitized.totalProfitPercent}`)
        lines.push('')
      }

      // 水印
      lines.push('---')
      const watermark = config.style.customWatermark
        ? `🐢 龟迹复盘 | ${config.style.customWatermark}`
        : '🐢 龟迹复盘'
      lines.push(`*${watermark} | ${date}*`)

      const text = lines.join('\n')
      const filename = this.generateFilename('markdown')

      return {
        success: true,
        format: 'markdown',
        text,
        filename,
      }
    } catch (error) {
      return {
        success: false,
        format: 'markdown',
        filename: '',
        error: error instanceof Error ? error.message : '生成Markdown失败',
      }
    }
  }

  /**
   * 下载文件
   */
  downloadFile(result: ExportResult): void {
    if (!result.success) {
      console.error('Download failed:', result.error)
      return
    }

    switch (result.format) {
      case 'image':
        if (result.dataUrl) {
          const link = document.createElement('a')
          link.href = result.dataUrl
          link.download = result.filename
          document.body.appendChild(link)
          link.click()
          document.body.removeChild(link)
        }
        break

      case 'pdf':
        if (result.blob) {
          const url = URL.createObjectURL(result.blob)
          const link = document.createElement('a')
          link.href = url
          link.download = result.filename
          document.body.appendChild(link)
          link.click()
          document.body.removeChild(link)
          URL.revokeObjectURL(url)
        }
        break

      case 'markdown':
        if (result.text) {
          const blob = new Blob([result.text], { type: 'text/markdown;charset=utf-8' })
          const url = URL.createObjectURL(blob)
          const link = document.createElement('a')
          link.href = url
          link.download = result.filename
          document.body.appendChild(link)
          link.click()
          document.body.removeChild(link)
          URL.revokeObjectURL(url)
        }
        break
    }
  }

  /**
   * 复制图片到剪贴板
   */
  async copyImageToClipboard(dataUrl: string): Promise<boolean> {
    try {
      const response = await fetch(dataUrl)
      const blob = await response.blob()
      await navigator.clipboard.write([
        new ClipboardItem({ [blob.type]: blob }),
      ])
      return true
    } catch (error) {
      console.error('Failed to copy image:', error)
      return false
    }
  }

  /**
   * 复制文本到剪贴板
   */
  async copyTextToClipboard(text: string): Promise<boolean> {
    try {
      await navigator.clipboard.writeText(text)
      return true
    } catch (error) {
      console.error('Failed to copy text:', error)
      return false
    }
  }

  /**
   * 生成文件名
   */
  private generateFilename(format: ExportFormat): string {
    const date = new Date()
    const dateStr = `${date.getFullYear()}${String(date.getMonth() + 1).padStart(2, '0')}${String(date.getDate()).padStart(2, '0')}`

    switch (format) {
      case 'image':
        return `龟迹复盘_${dateStr}.png`
      case 'pdf':
        return `龟迹复盘_${dateStr}.pdf`
      case 'markdown':
        return `龟迹复盘_${dateStr}.md`
    }
  }

  /**
   * 获取图片尺寸配置
   */
  getImageSize(preset: keyof typeof imageSizeConfig, customWidth?: number): { width: number; height?: number } {
    const config = imageSizeConfig[preset]
    return {
      width: preset === 'custom' && customWidth ? customWidth : config.width,
      height: config.height,
    }
  }
}

export const shareService = new ShareService()
