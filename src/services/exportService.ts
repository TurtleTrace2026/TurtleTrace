import type { Position, ProfitSummary, ExportData } from '../types'

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

// 从 JSON 导入数据
export function importFromJSON(jsonContent: string): {
  positions: Position[]
  summary?: ProfitSummary
} | null {
  try {
    const data = JSON.parse(jsonContent) as ExportData

    // 验证数据格式
    if (!data.positions || !Array.isArray(data.positions)) {
      throw new Error('Invalid data format')
    }

    return {
      positions: data.positions,
      summary: data.summary,
    }
  } catch (error) {
    console.error('Failed to import JSON:', error)
    return null
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
