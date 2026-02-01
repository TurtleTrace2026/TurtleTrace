import { useRef, useState } from 'react'
import { Button } from '../ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card'
import { Download, Upload, FileSpreadsheet, FileJson } from 'lucide-react'
import type { Position, ProfitSummary } from '../../types'
import { exportToCSV, exportToJSON, importFromJSON } from '../../services/exportService'

interface DataExportProps {
  positions: Position[]
  summary: ProfitSummary
  onImport: (positions: Position[]) => void
}

export function DataExport({ positions, summary, onImport }: DataExportProps) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [importError, setImportError] = useState('')

  const handleExportCSV = () => {
    if (positions.length === 0) return
    exportToCSV(positions, summary)
  }

  const handleExportJSON = () => {
    if (positions.length === 0) return
    exportToJSON(positions, summary)
  }

  const handleImportClick = () => {
    fileInputRef.current?.click()
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
      } else {
        setImportError('导入失败：文件格式不正确或已损坏')
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
          导出持仓数据进行备份，或导入之前的备份文件
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* 导出 */}
          <div>
            <h4 className="text-sm font-medium mb-3">导出数据</h4>
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

          {/* 导入 */}
          <div className="border-t pt-4">
            <h4 className="text-sm font-medium mb-3">导入数据</h4>
            <Button
              variant="outline"
              onClick={handleImportClick}
            >
              <Upload className="h-4 w-4 mr-2" />
              导入 JSON 备份
            </Button>
            <input
              ref={fileInputRef}
              type="file"
              accept=".json"
              className="hidden"
              onChange={handleFileChange}
            />
            <p className="text-sm text-muted-foreground mt-2">
              从之前导出的 JSON 文件恢复持仓数据
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
