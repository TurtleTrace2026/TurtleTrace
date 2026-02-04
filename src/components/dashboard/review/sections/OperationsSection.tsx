import { useState, useEffect } from 'react';
import { ArrowUpRight, ArrowDownRight, TrendingUp, TrendingDown, Lightbulb } from 'lucide-react';
import { SectionCard } from '../shared/SectionCard';
import { TextInput } from '../shared/TextInput';
import type { OperationsReviewData, OperationTransaction, OperationReflection } from '../../../../types/review';
import type { Position } from '../../../../types';

interface OperationsSectionProps {
  data?: OperationsReviewData;
  onChange: (data: OperationsReviewData) => void;
  date: string;
}

export function OperationsSection({ data, onChange, date }: OperationsSectionProps) {
  const [positions, setPositions] = useState<Position[]>([]);

  // 加载本地持仓数据
  useEffect(() => {
    const loadPositions = () => {
      const stored = localStorage.getItem('stock-positions');
      if (stored) {
        try {
          const parsed: Position[] = JSON.parse(stored);
          setPositions(parsed);
        } catch (e) {
          console.error('解析持仓数据失败:', e);
        }
      }
    };

    loadPositions();
  }, []);

  // 初始化当日交易数据
  useEffect(() => {
    if (positions.length === 0) return;

    // 获取当日交易的股票
    const todayTransactions = extractTodayTransactions();

    // 如果没有数据或数据为空，初始化
    if (!data || !data.transactions || data.transactions.length === 0) {
      const operations: OperationsReviewData = {
        transactions: todayTransactions,
        reflection: data?.reflection || {
          whatWorked: '',
          whatFailed: '',
          lessons: '',
          emotionalState: '',
        },
      };

      // 只有当有交易时才更新
      if (todayTransactions.length > 0) {
        onChange(operations);
      }
    }
  }, [positions, date]);

  // 提取当日交易记录
  const extractTodayTransactions = (): OperationTransaction[] => {
    const transactions: OperationTransaction[] = [];

    for (const pos of positions) {
      for (const tx of pos.transactions) {
        // 检查是否是当日交易（简化判断，实际应该比较日期）
        const txDate = new Date(tx.timestamp);
        const targetDate = new Date(date);

        // 比较年月日
        if (
          txDate.getFullYear() === targetDate.getFullYear() &&
          txDate.getMonth() === targetDate.getMonth() &&
          txDate.getDate() === targetDate.getDate()
        ) {
          transactions.push({
            symbol: pos.symbol,
            type: tx.type,
            price: tx.price,
            quantity: tx.quantity,
            amount: tx.amount,
            mood: (tx as any).emotion?.name || '',
            reason: (tx as any).reasons?.map((r: any) => r.name) || [],
          } as any);
        }
      }
    }

    return transactions;
  };

  // 更新反思内容
  const updateReflection = (field: keyof OperationReflection, value: string) => {
    onChange({
      ...data!,
      reflection: {
        ...data!.reflection,
        [field]: value,
      },
    });
  };

  const transactions = data?.transactions || [];
  const reflection = data?.reflection || {
    whatWorked: '',
    whatFailed: '',
    lessons: '',
    emotionalState: '',
  };

  return (
    <SectionCard
      title="今日操作回顾与反思"
      icon="📝"
      badge={transactions.length}
    >
      {transactions.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">
          今日暂无交易记录
        </div>
      ) : (
        <>
          {/* 交易记录列表 */}
          <div className="mb-6 space-y-3">
            <h4 className="font-medium text-sm text-muted-foreground">交易记录</h4>

            {transactions.map((tx: any, index: number) => {
              const isBuy = tx.type === 'buy';

              return (
                <div
                  key={index}
                  className="flex items-start gap-4 p-4 border rounded-lg hover:bg-accent/30"
                >
                  {/* 操作类型图标 */}
                  <div className={`
                    flex items-center justify-center w-10 h-10 rounded-full
                    ${isBuy ? 'bg-red-100 text-red-600' : 'bg-green-100 text-green-600'}
                  `}>
                    {isBuy ? <ArrowUpRight className="w-5 h-5" /> : <ArrowDownRight className="w-5 h-5" />}
                  </div>

                  {/* 交易详情 */}
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-semibold">{tx.name}</span>
                      <span className="text-sm text-muted-foreground">{tx.symbol}</span>
                      <span className={`text-xs px-2 py-0.5 rounded-full ${isBuy ? 'bg-red-100 text-red-600' : 'bg-green-100 text-green-600'}`}>
                        {isBuy ? '买入' : '卖出'}
                      </span>
                    </div>

                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <span>价格: ¥{tx.price.toFixed(2)}</span>
                      <span>数量: {tx.quantity}股</span>
                      <span>金额: ¥{tx.amount.toFixed(2)}</span>
                    </div>

                    {/* 情绪和原因标签 */}
                    <div className="flex items-center gap-2 mt-2 flex-wrap">
                      {tx.mood && (
                        <span className="text-xs px-2 py-1 rounded-full bg-purple-100 text-purple-700">
                          😊 {tx.mood}
                        </span>
                      )}
                      {tx.reason.map((r: any, i: number) => (
                        <span key={i} className="text-xs px-2 py-1 rounded-full bg-blue-100 text-blue-700">
                          💡 {r}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* 反思总结 */}
          <div className="space-y-4">
            <h4 className="font-medium text-sm text-muted-foreground flex items-center gap-2">
              <Lightbulb className="w-4 h-4" />
              反思总结
            </h4>

            <div className="grid grid-cols-2 gap-4">
              {/* 做得好的地方 */}
              <div className="space-y-2">
                <label className="text-sm font-medium flex items-center gap-1">
                  <TrendingUp className="w-4 h-4 text-green-500" />
                  做得好的地方
                </label>
                <TextInput
                  value={reflection.whatWorked || ''}
                  onChange={(value) => updateReflection('whatWorked', value)}
                  placeholder="今日交易中做得好的地方..."
                  multiline
                  rows={3}
                />
              </div>

              {/* 做得不好的地方 */}
              <div className="space-y-2">
                <label className="text-sm font-medium flex items-center gap-1">
                  <TrendingDown className="w-4 h-4 text-red-500" />
                  需要改进的地方
                </label>
                <TextInput
                  value={reflection.whatFailed || ''}
                  onChange={(value) => updateReflection('whatFailed', value)}
                  placeholder="今日交易中需要改进的地方..."
                  multiline
                  rows={3}
                />
              </div>
            </div>

            {/* 经验教训 */}
            <div className="space-y-2">
              <label className="text-sm font-medium flex items-center gap-1">
                <Lightbulb className="w-4 h-4 text-yellow-500" />
                经验教训
              </label>
              <TextInput
                value={reflection.lessons || ''}
                onChange={(value) => updateReflection('lessons', value)}
                placeholder="今日交易的经验总结和教训..."
                multiline
                rows={3}
              />
            </div>

            {/* 情绪状态反思 */}
            <div className="space-y-2">
              <label className="text-sm font-medium">情绪状态反思</label>
              <TextInput
                value={reflection.emotionalState || ''}
                onChange={(value) => updateReflection('emotionalState', value)}
                placeholder="今日交易时的情绪状态..."
                multiline
                rows={2}
              />
            </div>
          </div>
        </>
      )}
    </SectionCard>
  );
}
