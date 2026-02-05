import { useState, useEffect } from 'react';
import { SectionCard } from '../shared/SectionCard';
import { TextInput } from '../shared/TextInput';
import type { PositionReviewData } from '../../../../types/review';
import { getStockQuote } from '../../../../services/stockService';
import type { Position } from '../../../../types';

interface PositionSectionProps {
  data?: PositionReviewData;
  onChange: (data: PositionReviewData) => void;
  date: string;
}

export function PositionSection({ data, onChange, date }: PositionSectionProps) {
  const [positions, setPositions] = useState<Position[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // 加载本地持仓数据
  useEffect(() => {
    const loadPositions = () => {
      const data = localStorage.getItem('stock-positions');
      if (data) {
        try {
          const parsed: Position[] = JSON.parse(data);
          setPositions(parsed);
        } catch (e) {
          console.error('解析持仓数据失败:', e);
        }
      }
      setIsLoading(false);
    };

    loadPositions();
  }, []);

  // 初始化或更新当日持仓数据
  useEffect(() => {
    if (!isLoading && positions.length > 0) {
      updatePositionData();
    }
  }, [isLoading, positions, date]);

  // 更新持仓数据
  const updatePositionData = async () => {
    // 只处理未清仓的股票
    const activePositions = positions.filter(pos => pos.quantity > 0);

    if (activePositions.length === 0) {
      onChange({
        positions: [],
        dailySummary: { totalProfit: 0, winCount: 0, lossCount: 0, winRate: 0 },
        soldToday: data?.soldToday || [],
      });
      return;
    }

    const reviewItems = await Promise.all(
      activePositions.map(async (pos: any) => {
        // 获取实时行情
        const quote = await getStockQuote(pos.symbol);
        const currentPrice = quote?.price || pos.currentPrice || pos.costPrice;

        // 判断是否今天买入的
        const today = new Date();
        const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;

        // 获取今日的交易记录
        const todayTransactions = (pos.transactions || []).filter((tx: any) => {
          const txDate = new Date(tx.timestamp);
          const txDateStr = `${txDate.getFullYear()}-${String(txDate.getMonth() + 1).padStart(2, '0')}-${String(txDate.getDate()).padStart(2, '0')}`;
          return txDateStr === todayStr;
        });

        // 计算今日买入和卖出的数量
        const todayBuyQty = todayTransactions
          .filter((tx: any) => tx.type === 'buy')
          .reduce((sum: number, tx: any) => sum + tx.quantity, 0);

        const todaySellQty = todayTransactions
          .filter((tx: any) => tx.type === 'sell')
          .reduce((sum: number, tx: any) => sum + tx.quantity, 0);

        // 昨日持仓数量 = 当前持仓 + 今日卖出 - 今日买入
        const yesterdayQty = pos.quantity + todaySellQty - todayBuyQty;

        // 当日涨跌幅：始终使用市场数据（基于昨收价），与个人操作无关
        const change = quote?.changePercent || 0;

        // 计算当日盈亏（分段计算）
        let dailyProfit = 0;

        // 1. 昨日持仓部分的浮动盈亏（基于昨收价）
        // 浮动盈亏 = (当前价 - 昨收价) × 昨日持仓数量
        if (yesterdayQty > 0) {
          dailyProfit += (quote?.change || 0) * yesterdayQty;
        }

        // 2. 今日买入部分的浮动盈亏（基于买入价）
        if (todayBuyQty > 0) {
          const todayBuys = todayTransactions.filter((tx: any) => tx.type === 'buy');
          todayBuys.forEach((buyTx: any) => {
            // 买入部分的盈亏 = (当前价 - 买入价) × 买入数量
            dailyProfit += (currentPrice - buyTx.price) * buyTx.quantity;
          });
        }

        // 3. 今日卖出已实现盈亏（基于卖出价和昨收价）
        if (todaySellQty > 0) {
          const todaySells = todayTransactions.filter((tx: any) => tx.type === 'sell');
          todaySells.forEach((sellTx: any) => {
            // 卖出部分的已实现盈亏 = (卖出价 - 昨收价) × 卖出数量
            const prevClosePrice = currentPrice / (1 + change / 100);
            dailyProfit += (sellTx.price - prevClosePrice) * sellTx.quantity;
          });
        }

        // 总盈亏 = (当前价 - 成本价) × 持仓数量
        const totalProfit = (currentPrice - pos.costPrice) * pos.quantity;

        return {
          symbol: pos.symbol,
          name: pos.name,
          change,
          dailyProfit,
          totalProfit,
          currentPrice,
          costPrice: pos.costPrice,
          quantity: pos.quantity,
          note: data?.positions.find(p => p.symbol === pos.symbol)?.note || '',
        };
      })
    );

    // 计算汇总
    const totalProfit = reviewItems.reduce((sum, p) => sum + p.dailyProfit, 0);
    const winCount = reviewItems.filter(p => p.dailyProfit > 0).length;
    const lossCount = reviewItems.filter(p => p.dailyProfit < 0).length;
    const winRate = reviewItems.length > 0 ? winCount / reviewItems.length : 0;

    const dailySummary = {
      totalProfit,
      winCount,
      lossCount,
      winRate,
    };

    // 检查数据是否有变化
    const currentData: any = {
      positions: reviewItems,
      dailySummary,
      soldToday: data?.soldToday || [],
    };

    // 只有当数据真正变化时才更新
    const positionsChanged = JSON.stringify(currentData.positions) !== JSON.stringify(data?.positions);
    if (positionsChanged || !data) {
      onChange(currentData);
    }
  };

  // 更新单只股票备注
  const updateNote = (symbol: string, note: string) => {
    const updatedPositions = (data?.positions || []).map((p: any) =>
      p.symbol === symbol ? { ...p, note } : p
    );
    onChange({
      ...data!,
      positions: updatedPositions,
    });
  };

  if (isLoading) {
    return (
      <SectionCard title="持仓买卖情况" icon="💼">
        <div className="text-center py-8 text-muted-foreground">加载中...</div>
      </SectionCard>
    );
  }

  const displayPositions = data?.positions || [];
  const summary = data?.dailySummary || { totalProfit: 0, winCount: 0, lossCount: 0, winRate: 0 };

  return (
    <SectionCard
      title="持仓买卖情况"
      icon="💼"
      badge={displayPositions.length}
    >
      {/* 当日盈亏汇总 */}
      <div className="mb-6 p-4 bg-accent/50 rounded-lg">
        <div className="grid grid-cols-4 gap-4 text-center">
          <div>
            <div className="text-sm text-muted-foreground">当日盈亏</div>
            <div className={`text-2xl font-bold ${summary.totalProfit >= 0 ? 'text-red-500' : 'text-green-500'}`}>
              {summary.totalProfit >= 0 ? '+' : ''}¥{summary.totalProfit.toFixed(2)}
            </div>
          </div>
          <div>
            <div className="text-sm text-muted-foreground">盈利</div>
            <div className="text-2xl font-bold text-red-500">{summary.winCount}</div>
          </div>
          <div>
            <div className="text-sm text-muted-foreground">亏损</div>
            <div className="text-2xl font-bold text-green-500">{summary.lossCount}</div>
          </div>
          <div>
            <div className="text-sm text-muted-foreground">胜率</div>
            <div className="text-2xl font-bold">{(summary.winRate * 100).toFixed(1)}%</div>
          </div>
        </div>
      </div>

      {/* 持仓列表 */}
      {displayPositions.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">
          暂无持仓数据
        </div>
      ) : (
        <div className="space-y-3">
          <div className="grid grid-cols-12 gap-2 text-sm text-muted-foreground px-3">
            <div className="col-span-2">股票</div>
            <div className="col-span-1 text-right">当日涨跌幅</div>
            <div className="col-span-2 text-right">当日盈亏</div>
            <div className="col-span-2 text-right">总盈亏</div>
            <div className="col-span-1 text-right">持仓</div>
            <div className="col-span-2 text-right">现价/成本</div>
            <div className="col-span-2">备注</div>
          </div>

          {displayPositions.map((pos: any) => {
            const isPositive = pos.change >= 0;
            const dailyProfitPositive = pos.dailyProfit >= 0;

            return (
              <div
                key={pos.symbol}
                className="grid grid-cols-12 gap-2 px-3 py-2 items-center border-b last:border-b-0 hover:bg-accent/30"
              >
                <div className="col-span-2">
                  <div className="font-medium">{pos.name}</div>
                  <div className="text-xs text-muted-foreground">{pos.symbol}</div>
                </div>

                <div className={`col-span-1 text-right ${isPositive ? 'text-red-500' : 'text-green-500'}`}>
                  {isPositive ? '+' : ''}{pos.change.toFixed(2)}%
                </div>

                <div className={`col-span-2 text-right font-medium ${dailyProfitPositive ? 'text-red-500' : 'text-green-500'}`}>
                  {pos.dailyProfit >= 0 ? '+' : ''}¥{pos.dailyProfit.toFixed(2)}
                </div>

                <div className={`col-span-2 text-right text-sm ${pos.totalProfit >= 0 ? 'text-red-500' : 'text-green-500'}`}>
                  {pos.totalProfit >= 0 ? '+' : ''}¥{pos.totalProfit.toFixed(2)}
                </div>

                <div className="col-span-1 text-right text-sm">
                  {pos.quantity}
                </div>

                <div className="col-span-2 text-right text-sm">
                  <div>¥{pos.currentPrice.toFixed(2)}</div>
                  <div className="text-xs text-muted-foreground">¥{pos.costPrice.toFixed(2)}</div>
                </div>

                <div className="col-span-2">
                  <TextInput
                    value={pos.note}
                    onChange={(value) => updateNote(pos.symbol, value)}
                    placeholder="添加备注..."
                    className="text-sm"
                  />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </SectionCard>
  );
}
