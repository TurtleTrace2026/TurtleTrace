import type { Position, ProfitSummary, ExportData } from '../types'
import type { DailyReview } from '../types/review'
import { reviewService } from './reviewService'

// 扩展导出数据类型以包含复盘
export interface ExtendedExportData extends ExportData {
  reviews?: DailyReview[]
}

// 导出为 CSV
export function exportToCSV(positions: Position[], summary: ProfitSummary): void {
  // 持仓明细 CSV
  const csvRows: string[] = []

  // 表头
  csvRows.push('股票代码,股票名称,持仓数量,成本价,当前价格,市值,盈亏,盈亏比例(%)')

  // 数据行
  positions.forEach(pos => {
    const marketValue = pos.currentPrice * pos.quantity
    const costValue = pos.costPrice * pos.quantity
    const profit = marketValue - costValue
    const profitPercent = ((pos.currentPrice - pos.costPrice) / pos.costPrice) * 100

    csvRows.push(
      [
        pos.symbol,
        pos.name,
        pos.quantity.toString(),
        pos.costPrice.toFixed(2),
        pos.currentPrice.toFixed(2),
        marketValue.toFixed(2),
        profit.toFixed(2),
        profitPercent.toFixed(2),
      ].join(',')
    )
  })

  // 添加汇总行
  csvRows.push('')
  csvRows.push('汇总')
  csvRows.push(
    [
      '总成本',
      '总市值',
      '总盈亏',
      '总收益率(%)',
    ].join(',')
  )
  csvRows.push(
    [
      summary.totalCost.toFixed(2),
      summary.totalValue.toFixed(2),
      summary.totalProfit.toFixed(2),
      summary.totalProfitPercent.toFixed(2),
    ].join(',')
  )

  const csvContent = '\uFEFF' + csvRows.join('\n') // 添加 BOM 以支持中文

  // 下载文件
  downloadFile(csvContent, `持仓数据_${getDateString()}.csv`, 'text/csv;charset=utf-8')
}

// 导出为 JSON（用于持久化）
export function exportToJSON(positions: Position[], summary: ProfitSummary): void {
  const data: ExportData = {
    version: '1.0.0',
    exportTime: Date.now(),
    positions,
    summary,
  }

  const jsonContent = JSON.stringify(data, null, 2)

  downloadFile(jsonContent, `持仓备份_${getDateString()}.json`, 'application/json')
}

// 导出完整数据（包含持仓和复盘）
export async function exportCompleteData(positions: Position[], summary: ProfitSummary): Promise<void> {
  // 获取所有复盘记录
  const reviews = await reviewService.getAllReviews()

  const data: ExtendedExportData = {
    version: '2.0.0',
    exportTime: Date.now(),
    positions,
    summary,
    reviews,
  }

  const jsonContent = JSON.stringify(data, null, 2)

  downloadFile(jsonContent, `完整数据备份_${getDateString()}.json`, 'application/json')
}

// 导出每日复盘数据（单独）
export async function exportReviewsData(): Promise<void> {
  const reviews = await reviewService.getAllReviews()

  if (reviews.length === 0) {
    alert('暂无复盘数据可导出')
    return
  }

  const data = {
    version: '1.0.0',
    exportTime: Date.now(),
    reviews,
  }

  const jsonContent = JSON.stringify(data, null, 2)

  downloadFile(jsonContent, `每日复盘_${getDateString()}.json`, 'application/json')
}

// 导出每日复盘为 Markdown
export async function exportReviewsToMarkdown(): Promise<void> {
  const reviews = await reviewService.getAllReviews()

  if (reviews.length === 0) {
    alert('暂无复盘数据可导出')
    return
  }

  // 按日期排序
  const sortedReviews = [...reviews].sort((a, b) => b.date.localeCompare(a.date))

  const lines: string[] = []

  // 标题
  lines.push('# 每日复盘记录\n')
  lines.push(`导出时间: ${new Date().toLocaleString('zh-CN')}\n`)
  lines.push(`共 ${sortedReviews.length} 条复盘记录\n`)
  lines.push('---\n\n')

  // 每条复盘
  for (const review of sortedReviews) {
    const markdown = await reviewService.exportToMarkdown(review.date)
    lines.push(markdown)
    lines.push('\n\n---\n\n')
  }

  const markdownContent = lines.join('')

  downloadFile(markdownContent, `每日复盘_${getDateString()}.md`, 'text/markdown;charset=utf-8')
}

// 从 JSON 导入数据
export function importFromJSON(jsonContent: string): {
  positions: Position[]
  summary?: ProfitSummary
  reviews?: DailyReview[]
} | null {
  try {
    const data = JSON.parse(jsonContent) as ExportData | ExtendedExportData

    // 验证数据格式
    if (!data.positions || !Array.isArray(data.positions)) {
      throw new Error('Invalid data format')
    }

    const result: {
      positions: Position[]
      summary?: ProfitSummary
      reviews?: DailyReview[]
    } = {
      positions: data.positions,
      summary: data.summary,
    }

    // 如果有复盘数据，也返回
    if ('reviews' in data && Array.isArray(data.reviews)) {
      result.reviews = data.reviews
    }

    return result
  } catch (error) {
    console.error('Failed to import JSON:', error)
    return null
  }
}

// 导入复盘数据（单独）
export function importReviewsData(jsonContent: string): DailyReview[] | null {
  try {
    const data = JSON.parse(jsonContent) as {
      reviews?: DailyReview[]
    }

    if (!data.reviews || !Array.isArray(data.reviews)) {
      throw new Error('Invalid reviews data format')
    }

    return data.reviews
  } catch (error) {
    console.error('Failed to import reviews:', error)
    return null
  }
}

// 保存导入的复盘数据到 localStorage
export async function saveImportedReviews(reviews: DailyReview[]): Promise<boolean> {
  try {
    for (const review of reviews) {
      await reviewService.saveReview(review)
    }
    return true
  } catch (error) {
    console.error('Failed to save reviews:', error)
    return false
  }
}

// 下载文件到本地
function downloadFile(content: string, filename: string, mimeType: string): void {
  const blob = new Blob([content], { type: mimeType })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

// 获取日期字符串（格式：YYYY-MM-DD）
function getDateString(): string {
  const now = new Date()
  const year = now.getFullYear()
  const month = String(now.getMonth() + 1).padStart(2, '0')
  const day = String(now.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}
