import { useState, useEffect } from 'react'
import { PositionManager } from './components/dashboard/PositionManager'
import { ProfitDashboard } from './components/dashboard/ProfitDashboard'
import { NewsFeed } from './components/dashboard/NewsFeed'
import { DataExport } from './components/dashboard/DataExport'
import { ReviewTab } from './components/dashboard/review/ReviewTab'
import { LineChart, TrendingUp, Newspaper, Database, BookOpen } from 'lucide-react'
import type { Position, ProfitSummary } from './types'
import { calculateProfitSummary, calculateClearedProfit } from './utils/calculations'
import TurtleTraceLogo from './assets/TurtleTraceLogo.png'

function App() {
  const [positions, setPositions] = useState<Position[]>([])
  const [showClearedPositionsInOverview, setShowClearedPositionsInOverview] = useState(false)  // 总览页面持仓明细是否显示已清仓股票
  const [showClearedProfitCard, setShowClearedProfitCard] = useState(false)  // 是否显示清仓股票收益卡片
  const [summary, setSummary] = useState<ProfitSummary>({
    totalCost: 0,
    totalValue: 0,
    totalProfit: 0,
    totalProfitPercent: 0,
    positions: [],
  })
  const [activeTab, setActiveTab] = useState<'overview' | 'positions' | 'news' | 'data' | 'review'>('overview')

  // 计算收益汇总（根据是否显示已清仓股票过滤）
  useEffect(() => {
    const filteredPositions = showClearedPositionsInOverview
      ? positions
      : positions.filter(p => p.quantity > 0)
    const newSummary = calculateProfitSummary(filteredPositions)

    // 计算清仓股票收益
    const clearedProfit = calculateClearedProfit(positions) ?? undefined

    setSummary({
      ...newSummary,
      clearedProfit,
    })
  }, [positions, showClearedPositionsInOverview])

  // 从 localStorage 加载数据
  useEffect(() => {
    const saved = localStorage.getItem('stock-positions')
    if (saved) {
      try {
        const savedPositions = JSON.parse(saved) as Position[]
        // 迁移旧数据，添加新字段
        const migratedPositions = savedPositions.map(pos => ({
          ...pos,
          transactions: pos.transactions || [],
          totalBuyAmount: pos.totalBuyAmount ?? (pos.costPrice * pos.quantity),
          totalSellAmount: pos.totalSellAmount ?? 0,
        }))
        setPositions(migratedPositions)
      } catch (e) {
        console.error('Failed to load saved positions:', e)
      }
    }
  }, [])

  // 保存到 localStorage
  useEffect(() => {
    if (positions.length > 0) {
      localStorage.setItem('stock-positions', JSON.stringify(positions))
    } else {
      localStorage.removeItem('stock-positions')
    }
  }, [positions])

  const handleImportPositions = (importedPositions: Position[]) => {
    setPositions(importedPositions)
  }

  const tabs = [
    { id: 'overview' as const, label: '总览', icon: LineChart },
    { id: 'positions' as const, label: '持仓管理', icon: TrendingUp },
    { id: 'review' as const, label: '每日复盘', icon: BookOpen },
    { id: 'news' as const, label: '新闻快讯', icon: Newspaper },
    { id: 'data' as const, label: '数据管理', icon: Database },
  ]

  return (
    <div className="min-h-screen bg-background">
      {/* 顶部导航 */}
      <header className="border-b bg-card sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              {/* Logo */}
              <img
                src={TurtleTraceLogo}
                alt="龟迹复盘"
                className="h-10 w-auto"
              />
              <div>
                <h1 className="text-2xl font-bold">龟迹复盘</h1>
                <p className="text-sm text-muted-foreground">个人投资组合管理工具</p>
              </div>
            </div>
            {positions.length > 0 && (
              <div className="text-right">
                <div className="text-sm text-muted-foreground">持仓市值</div>
                <div className={`text-xl font-bold ${summary.totalProfit >= 0 ? 'text-red-600' : 'text-green-600'}`}>
                  {summary.totalProfit >= 0 ? '+' : ''}
                  {summary.totalProfit.toFixed(2)} ({summary.totalProfitPercent.toFixed(2)}%)
                </div>
              </div>
            )}
          </div>

          {/* 标签页导航 */}
          <nav className="flex gap-1 mt-4 border-b">
            {tabs.map(tab => {
              const Icon = tab.icon
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                    activeTab === tab.id
                      ? 'border-primary text-primary'
                      : 'border-transparent text-muted-foreground hover:text-foreground'
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  {tab.label}
                </button>
              )
            })}
          </nav>
        </div>
      </header>

      {/* 主内容区 */}
      <main className="container mx-auto px-4 py-6">
        {activeTab === 'overview' && (
          <ProfitDashboard
            summary={summary}
            showClearedPositions={showClearedPositionsInOverview}
            onToggleClearedPositions={() => setShowClearedPositionsInOverview(!showClearedPositionsInOverview)}
            hasClearedPositions={positions.some(p => p.quantity <= 0)}
            showClearedProfitCard={showClearedProfitCard}
            onToggleClearedProfitCard={() => setShowClearedProfitCard(!showClearedProfitCard)}
          />
        )}

        {activeTab === 'positions' && (
          <PositionManager
            positions={positions}
            onPositionsChange={setPositions}
          />
        )}

        {activeTab === 'news' && (
          <NewsFeed symbols={positions.map(p => p.symbol)} />
        )}

        {activeTab === 'review' && <ReviewTab />}

        {activeTab === 'data' && (
          <DataExport
            positions={positions}
            summary={summary}
            onImport={handleImportPositions}
          />
        )}
      </main>

      {/* 页脚 */}
      <footer className="border-t mt-12 py-6 text-center text-sm text-muted-foreground">
        <div className="flex items-center justify-center gap-2 mb-2">
          <img
            src={TurtleTraceLogo}
            alt="龟迹复盘"
            className="h-6 w-auto"
          />
          <span className="font-semibold">龟迹复盘</span>
        </div>
        <p>个人投资组合管理工具</p>
        <p className="mt-1">数据仅供参考，不构成投资建议</p>
      </footer>
    </div>
  )
}

export default App
