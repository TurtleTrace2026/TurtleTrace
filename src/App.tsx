import { useState, useEffect } from 'react'
import { PositionManager } from './components/dashboard/PositionManager'
import { ProfitDashboard } from './components/dashboard/ProfitDashboard'
import { NewsFeed } from './components/dashboard/NewsFeed'
import { DataExport } from './components/dashboard/DataExport'
import { ReviewTab } from './components/dashboard/review/ReviewTab'
import { LineChart, TrendingUp, Newspaper, Database, BookOpen, Menu, X } from 'lucide-react'
import type { Position, ProfitSummary } from './types'
import { calculateProfitSummary, calculateClearedProfit } from './utils/calculations'
import TurtleTraceLogo from './assets/TurtleTraceLogo.png'

function App() {
  const [positions, setPositions] = useState<Position[]>([])
  const [showClearedPositionsInOverview, setShowClearedPositionsInOverview] = useState(false)  // 总览页面持仓明细是否显示已清仓股票
  const [showClearedProfitCard, setShowClearedProfitCard] = useState(false)  // 是否显示清仓股票收益卡片
  const [sidebarOpen, setSidebarOpen] = useState(true)  // 侧边栏展开/折叠状态
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
    { id: 'review' as const, label: '复盘管理', icon: BookOpen },
    { id: 'news' as const, label: '新闻快讯', icon: Newspaper },
    { id: 'data' as const, label: '数据管理', icon: Database },
  ]

  return (
    <div className="min-h-screen bg-background flex">
      {/* 左侧导航栏 */}
      <aside className={`fixed left-0 top-0 h-screen border-r bg-card flex flex-col transition-all duration-300 z-20 ${
        sidebarOpen ? 'w-64' : 'w-0 overflow-hidden'
      }`}>
        {/* Logo 区域 */}
        <div className="p-6 border-b">
          <div className="flex items-center gap-3">
            <img
              src={TurtleTraceLogo}
              alt="龟迹复盘"
              className="h-10 w-auto"
            />
            <div>
              <h1 className="text-xl font-bold">龟迹复盘</h1>
              <p className="text-xs text-muted-foreground">个人投资组合复盘</p>
            </div>
          </div>
        </div>

        {/* 持仓市值信息 */}
        {positions.length > 0 && (
          <div className="px-6 py-4 border-b bg-muted/30">
            <div className="text-xs text-muted-foreground mb-1">持仓市值</div>
            <div className={`text-lg font-bold ${summary.totalProfit >= 0 ? 'text-red-600' : 'text-green-600'}`}>
              {summary.totalProfit >= 0 ? '+' : ''}
              {summary.totalProfit.toFixed(2)}
            </div>
            <div className={`text-sm ${summary.totalProfitPercent >= 0 ? 'text-red-500' : 'text-green-500'}`}>
              ({summary.totalProfitPercent >= 0 ? '+' : ''}{summary.totalProfitPercent.toFixed(2)}%)
            </div>
          </div>
        )}

        {/* 导航菜单 */}
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {tabs.map(tab => {
            const Icon = tab.icon
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`w-full flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-lg transition-colors ${
                  activeTab === tab.id
                    ? 'bg-primary text-primary-foreground'
                    : 'text-muted-foreground hover:bg-accent hover:text-foreground'
                }`}
              >
                <Icon className="h-5 w-5" />
                {tab.label}
              </button>
            )
          })}
        </nav>

        {/* 侧边栏底部 */}
        <div className="p-4 border-t text-xs text-muted-foreground text-center">
          <p>龟迹复盘 v1.0</p>
        </div>
      </aside>

      {/* 右侧主内容区 */}
      <div className={`flex-1 flex flex-col transition-all duration-300 ${
        sidebarOpen ? 'ml-64' : 'ml-0'
      }`}>
        {/* 顶部栏（菜单按钮） */}
        <header className="h-14 border-b bg-card flex items-center px-4 flex-shrink-0">
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-2 hover:bg-accent rounded-lg transition-colors"
          >
            {sidebarOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </header>

        {/* 主内容 */}
        <main className="flex-1 overflow-y-auto px-6 py-6">
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
        <footer className="border-t py-4 px-6 text-center text-xs text-muted-foreground flex-shrink-0">
          <p>数据仅供参考，不构成投资建议</p>
        </footer>
      </div>
    </div>
  )
}

export default App
