import { useState } from 'react'
import { Button } from '../ui/button'
import { Download, Copy, Share2, X, Loader2, Check } from 'lucide-react'
import { generateShareImage, downloadImage, copyImageToClipboard, shareImage } from '../../utils/shareUtils'
import type { NewsAnalysis } from '../../services/aiService'

interface ShareDialogProps {
  analysis: NewsAnalysis
  newsTitle: string
  onClose: () => void
}

export function ShareDialog({ analysis, newsTitle, onClose }: ShareDialogProps) {
  const [loading, setLoading] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const handleGenerateAndDownload = async () => {
    setLoading('download')
    setError(null)
    try {
      const blob = await generateShareImage(analysis, newsTitle)
      downloadImage(blob)
      setSuccess('download')
      setTimeout(() => setSuccess(null), 2000)
    } catch (err) {
      setError('生成图片失败，请重试')
    } finally {
      setLoading(null)
    }
  }

  const handleCopyToClipboard = async () => {
    setLoading('copy')
    setError(null)
    try {
      const blob = await generateShareImage(analysis, newsTitle)
      const success = await copyImageToClipboard(blob)
      if (success) {
        setSuccess('copy')
        setTimeout(() => setSuccess(null), 2000)
      } else {
        setError('复制失败，请尝试下载图片')
      }
    } catch (err) {
      setError('生成图片失败，请重试')
    } finally {
      setLoading(null)
    }
  }

  const handleSystemShare = async () => {
    setLoading('share')
    setError(null)
    try {
      const blob = await generateShareImage(analysis, newsTitle)
      const shared = await shareImage(blob, newsTitle)
      if (!shared) {
        setError('系统分享不可用，请尝试其他方式')
      }
    } catch (err) {
      setError('分享失败，请重试')
    } finally {
      setLoading(null)
    }
  }

  // 检测是否支持系统分享
  const canSystemShare = typeof navigator !== 'undefined' && 'share' in navigator

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={onClose}>
      <div
        className="bg-card rounded-xl shadow-xl p-6 w-80 max-w-[90vw]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* 头部 */}
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">分享AI解读</h3>
          <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* 选项列表 */}
        <div className="space-y-2">
          {/* 下载图片 */}
          <Button
            variant="outline"
            className="w-full justify-start gap-3 h-12"
            onClick={handleGenerateAndDownload}
            disabled={loading !== null}
          >
            {loading === 'download' ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : success === 'download' ? (
              <Check className="h-4 w-4 text-green-500" />
            ) : (
              <Download className="h-4 w-4" />
            )}
            <span>保存图片</span>
          </Button>

          {/* 复制到剪贴板 */}
          <Button
            variant="outline"
            className="w-full justify-start gap-3 h-12"
            onClick={handleCopyToClipboard}
            disabled={loading !== null}
          >
            {loading === 'copy' ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : success === 'copy' ? (
              <Check className="h-4 w-4 text-green-500" />
            ) : (
              <Copy className="h-4 w-4" />
            )}
            <span>复制到剪贴板</span>
          </Button>

          {/* 系统分享（移动端） */}
          {canSystemShare && (
            <Button
              variant="outline"
              className="w-full justify-start gap-3 h-12"
              onClick={handleSystemShare}
              disabled={loading !== null}
            >
              {loading === 'share' ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Share2 className="h-4 w-4" />
              )}
              <span>系统分享</span>
            </Button>
          )}
        </div>

        {/* 错误提示 */}
        {error && (
          <p className="text-sm text-destructive mt-3 text-center">{error}</p>
        )}

        {/* 提示 */}
        <p className="text-xs text-muted-foreground mt-4 text-center">
          分享图片将包含品牌水印
        </p>
      </div>
    </div>
  )
}
