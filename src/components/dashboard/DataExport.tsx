import { useRef, useState, useEffect } from 'react'
import { Button } from '../ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card'
import { Upload, FileSpreadsheet, FileJson, FileText, BookOpen, Database, Shield, Download } from 'lucide-react'
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
        <div className="flex items-center gap-3">
          <div className="p-2 bg-primary/10 rounded-lg">
            <Database className="h-5 w-5 text-primary" />
          </div>
          <div>
            <CardTitle>数据管理</CardTitle>
            <CardDescription>
              导出持仓数据和复盘记录进行备份，或导入之前的备份文件
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid gap-6 md:grid-cols-2">
          {/* 导出持仓数据 */}
          <div className="p-4 border rounded-xl bg-surface/50 space-y-4">
            <div className="flex items-center gap-2">
              <Download className="h-4 w-4 text-muted-foreground" />
              <h4 className="text-sm font-medium">导出持仓数据</h4>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button
                variant="outline"
                onClick={handleExportCSV}
                disabled={positions.length === 0}
                className="flex-1"
              >
                <FileSpreadsheet className="h-4 w-4 mr-2" />
                CSV
              </Button>
              <Button
                variant="outline"
                onClick={handleExportJSON}
                disabled={positions.length === 0}
                className="flex-1"
              >
                <FileJson className="h-4 w-4 mr-2" />
                JSON
              </Button>
            </div>
            {positions.length === 0 && (
              <p className="text-sm text-muted-foreground">
                添加持仓后可导出数据
              </p>
            )}
          </div>

          {/* 导出复盘数据 */}
          <div className="p-4 border rounded-xl bg-surface/50 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <BookOpen className="h-4 w-4 text-muted-foreground" />
                <h4 className="text-sm font-medium">导出复盘数据</h4>
              </div>
              <span className="text-xs bg-muted px-2 py-1 rounded-full">
                {reviewsCount ?? '-'} 条
              </span>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button
                variant="outline"
                onClick={handleExportReviewsJSON}
                className="flex-1"
              >
                <FileJson className="h-4 w-4 mr-2" />
                JSON
              </Button>
              <Button
                variant="outline"
                onClick={handleExportReviewsMarkdown}
                className="flex-1"
              >
                <FileText className="h-4 w-4 mr-2" />
                Markdown
              </Button>
            </div>
          </div>

          {/* 导出完整数据 */}
          <div className="p-4 border rounded-xl bg-primary/5 space-y-4 md:col-span-2">
            <div className="flex items-center gap-2">
              <Shield className="h-4 w-4 text-primary" />
              <h4 className="text-sm font-medium">导出完整备份</h4>
            </div>
            <div className="flex items-center gap-4">
              <Button
                variant="default"
                onClick={handleExportComplete}
                disabled={positions.length === 0}
                className="gap-2"
              >
                <FileJson className="h-4 w-4" />
                导出完整备份
              </Button>
              <p className="text-sm text-muted-foreground">
                包含持仓数据和所有复盘记录的完整备份文件
              </p>
            </div>
          </div>

          {/* 导入数据 */}
          <div className="p-4 border rounded-xl bg-surface/50 space-y-4 md:col-span-2">
            <div className="flex items-center gap-2">
              <Upload className="h-4 w-4 text-muted-foreground" />
              <h4 className="text-sm font-medium">导入备份数据</h4>
            </div>
            <div className="flex flex-wrap gap-3">
              <Button
                variant="outline"
                onClick={handleImportClick}
                className="gap-2"
              >
                <Upload className="h-4 w-4" />
                导入完整备份
              </Button>
              <input
                ref={fileInputRef}
                type="file"
                accept=".json"
                className="hidden"
                onChange={handleFileChange}
              />
              <Button
                variant="outline"
                onClick={handleReviewsImportClick}
                className="gap-2"
              >
                <Upload className="h-4 w-4" />
                仅导入复盘
              </Button>
              <input
                ref={reviewsInputRef}
                type="file"
                accept=".json"
                className="hidden"
                onChange={handleReviewsFileChange}
              />
            </div>
            <p className="text-sm text-muted-foreground">
              从之前导出的备份文件恢复数据
            </p>
            {importError && (
              <p className="text-sm text-destructive">
                {importError}
              </p>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
