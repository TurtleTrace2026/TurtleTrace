import { useRef, useState, useEffect } from 'react'
import { Button } from '../ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card'
import { Upload, FileSpreadsheet, FileJson, FileText, BookOpen } from 'lucide-react'
import type { Position, ProfitSummary } from '../../types'
import {
  exportToCSV,
  exportToJSON,
  exportCompleteData,
  exportReviewsData,
  exportReviewsToMarkdown,
  importFromJSON,
  importReviewsData,
  saveImportedReviews
} from '../../services/exportService'

interface DataExportProps {
  positions: Position[]
  summary: ProfitSummary
  onImport: (positions: Position[]) => void
}

export function DataExport({ positions, summary, onImport }: DataExportProps) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const reviewsInputRef = useRef<HTMLInputElement>(null)
  const [importError, setImportError] = useState('')
  const [reviewsCount, setReviewsCount] = useState<number | null>(null)

  // 加载复盘数量
  useEffect(() => {
    const loadReviewsCount = async () => {
      try {
        const { reviewService } = await import('../../services/reviewService')
        const reviews = await reviewService.getAllReviews()
        setReviewsCount(reviews.length)
      } catch (e) {
        console.error('Failed to load reviews count:', e)
      }
    }
    loadReviewsCount()
  }, [])

  const handleExportCSV = () => {
    if (positions.length === 0) return
    exportToCSV(positions, summary)
  }

  const handleExportJSON = () => {
    if (positions.length === 0) return
    exportToJSON(positions, summary)
  }

  const handleExportComplete = async () => {
    if (positions.length === 0) return
    await exportCompleteData(positions, summary)
  }

  const handleExportReviewsJSON = async () => {
    await exportReviewsData()
    // 刷新复盘数量
    try {
      const { reviewService } = await import('../../services/reviewService')
      const reviews = await reviewService.getAllReviews()
      setReviewsCount(reviews.length)
    } catch (e) {
      console.error('Failed to load reviews count:', e)
    }
  }

  const handleExportReviewsMarkdown = async () => {
    await exportReviewsToMarkdown()
  }

  const handleImportClick = () => {
    fileInputRef.current?.click()
  }

  const handleReviewsImportClick = () => {
    reviewsInputRef.current?.click()
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setImportError('')
    const file = e.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (event) => {
      const content = event.target?.result as string
      const result = importFromJSON(content)

      if (result) {
        onImport(result.positions)

        // 如果有复盘数据，也导入
        if (result.reviews && result.reviews.length > 0) {
          const reviews = result.reviews
          saveImportedReviews(reviews).then(success => {
            if (success) {
              setReviewsCount(reviews.length)
              alert(`成功导入 ${result.positions.length} 条持仓数据和 ${reviews.length} 条复盘记录`)
            } else {
              alert('持仓数据导入成功，但复盘数据导入失败')
            }
          })
        } else {
          alert(`成功导入 ${result.positions.length} 条持仓数据`)
        }
      } else {
        setImportError('导入失败：文件格式不正确或已损坏')
      }
    }
    reader.readAsText(file)

    // 重置文件输入
    e.target.value = ''
  }

  const handleReviewsFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setImportError('')
    const file = e.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = async (event) => {
      const content = event.target?.result as string
      const reviews = importReviewsData(content)

      if (reviews && reviews.length > 0) {
        const success = await saveImportedReviews(reviews)
        if (success) {
          setReviewsCount(reviews.length)
          alert(`成功导入 ${reviews.length} 条复盘记录`)
        } else {
          setImportError('导入失败：保存复盘数据时出错')
        }
      } else {
        setImportError('导入失败：文件格式不正确或没有复盘数据')
      }
    }
    reader.readAsText(file)

    // 重置文件输入
    e.target.value = ''
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>数据管理</CardTitle>
        <CardDescription>
          导出持仓数据和复盘记录进行备份，或导入之前的备份文件
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* 导出持仓数据 */}
          <div>
            <h4 className="text-sm font-medium mb-3">导出持仓数据</h4>
            <div className="flex flex-wrap gap-3">
              <Button
                variant="outline"
                onClick={handleExportCSV}
                disabled={positions.length === 0}
              >
                <FileSpreadsheet className="h-4 w-4 mr-2" />
                导出 CSV
              </Button>
              <Button
                variant="outline"
                onClick={handleExportJSON}
                disabled={positions.length === 0}
              >
                <FileJson className="h-4 w-4 mr-2" />
                导出 JSON
              </Button>
            </div>
            {positions.length === 0 && (
              <p className="text-sm text-muted-foreground mt-2">
                添加持仓后可导出数据
              </p>
            )}
          </div>

          {/* 导出复盘数据 */}
          <div className="border-t pt-4">
            <h4 className="text-sm font-medium mb-3 flex items-center gap-2">
              <BookOpen className="h-4 w-4" />
              导出每日复盘
              <span className="text-xs text-muted-foreground">
                ({reviewsCount ?? '-'} 条记录)
              </span>
            </h4>
            <div className="flex flex-wrap gap-3">
              <Button
                variant="outline"
                onClick={handleExportReviewsJSON}
              >
                <FileJson className="h-4 w-4 mr-2" />
                导出 JSON
              </Button>
              <Button
                variant="outline"
                onClick={handleExportReviewsMarkdown}
              >
                <FileText className="h-4 w-4 mr-2" />
                导出 Markdown
              </Button>
            </div>
          </div>

          {/* 导出完整数据 */}
          <div className="border-t pt-4">
            <h4 className="text-sm font-medium mb-3">导出完整数据</h4>
            <Button
              variant="default"
              onClick={handleExportComplete}
              disabled={positions.length === 0}
            >
              <FileJson className="h-4 w-4 mr-2" />
              导出完整备份
            </Button>
            <p className="text-sm text-muted-foreground mt-2">
              包含持仓数据和所有复盘记录的完整备份
            </p>
          </div>

          {/* 导入持仓数据 */}
          <div className="border-t pt-4">
            <h4 className="text-sm font-medium mb-3">导入持仓数据</h4>
            <Button
              variant="outline"
              onClick={handleImportClick}
            >
              <Upload className="h-4 w-4 mr-2" />
              导入备份文件
            </Button>
            <input
              ref={fileInputRef}
              type="file"
              accept=".json"
              className="hidden"
              onChange={handleFileChange}
            />
            <p className="text-sm text-muted-foreground mt-2">
              从之前导出的备份文件恢复数据（支持复盘数据）
            </p>
          </div>

          {/* 导入复盘数据 */}
          <div className="border-t pt-4">
            <h4 className="text-sm font-medium mb-3">导入复盘数据</h4>
            <Button
              variant="outline"
              onClick={handleReviewsImportClick}
            >
              <Upload className="h-4 w-4 mr-2" />
              导入复盘文件
            </Button>
            <input
              ref={reviewsInputRef}
              type="file"
              accept=".json"
              className="hidden"
              onChange={handleReviewsFileChange}
            />
            <p className="text-sm text-muted-foreground mt-2">
              从复盘数据文件中导入复盘记录
            </p>
            {importError && (
              <p className="text-sm text-destructive mt-2">
                {importError}
              </p>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
