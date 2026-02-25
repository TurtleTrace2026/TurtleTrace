import { useState, useEffect } from 'react';
import { Save, Download, ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '../../../lib/utils';
import { weeklyReviewService } from '../../../services/weeklyReviewService';
import type { WeeklyReview } from '../../../types/weeklyReview';
import { getCurrentWeekLabel, getWeekRange } from '../../../types/weeklyReview';
import { SectionCard } from '../review/shared/SectionCard';
import { TextInput } from '../review/shared/TextInput';

interface WeeklyReviewEditorProps {
  weekLabel?: string;
  existingReview?: WeeklyReview;
  onSave?: (review: WeeklyReview) => void;
}

function NumberInput({
  value,
  onChange,
  placeholder,
  className = '',
}: {
  value: number | undefined;
  onChange: (value: number) => void;
  placeholder?: string;
  className?: string;
}) {
  const [inputValue, setInputValue] = useState(String(value ?? ''));

  useEffect(() => {
    setInputValue(String(value ?? ''));
  }, [value]);

  return (
    <input
      type="number"
      value={inputValue}
      onChange={(e) => {
        const newValue = e.target.value;
        setInputValue(newValue);
        onChange(parseFloat(newValue) || 0);
      }}
      placeholder={placeholder}
      className={cn("w-full px-3 py-2 border rounded-lg bg-surface focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all placeholder:text-muted-foreground/50", className)}
    />
  );
}

export function WeeklyReviewEditor({ weekLabel, existingReview, onSave }: WeeklyReviewEditorProps) {
  const [currentWeek, setCurrentWeek] = useState(() => weekLabel || getCurrentWeekLabel());
  const [review, setReview] = useState<Partial<WeeklyReview>>(() => {
    if (existingReview) {
      return existingReview;
    }
    const range = getWeekRange(currentWeek);
    return {
      id: currentWeek,
      weekLabel: currentWeek,
      startDate: range.startDate,
      endDate: range.endDate,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
  });

  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState('');

  useEffect(() => {
    loadAllWeeks();
  }, []);

  const loadAllWeeks = async () => {
    await weeklyReviewService.getAllReviews();
  };

  const changeWeek = async (direction: 'prev' | 'next') => {
    const [year, weekStr] = currentWeek.split('-');
    let week = parseInt(weekStr.replace('W', ''), 10);
    const yearNum = parseInt(year, 10);

    if (direction === 'prev') {
      week -= 1;
      if (week < 1) {
        week = 52;
      }
    } else {
      week += 1;
      if (week > 52) {
        week = 1;
      }
    }

    const newWeekLabel = `${yearNum}-W${String(week).padStart(2, '0')}`;
    setCurrentWeek(newWeekLabel);

    const existing = await weeklyReviewService.getReview(newWeekLabel);
    const range = getWeekRange(newWeekLabel);

    if (existing) {
      setReview(existing);
    } else {
      setReview({
        id: newWeekLabel,
        weekLabel: newWeekLabel,
        startDate: range.startDate,
        endDate: range.endDate,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      });
    }
  };

  const updateReview = (updates: Partial<WeeklyReview>) => {
    setReview(prev => ({
      ...prev,
      ...updates,
      updatedAt: Date.now(),
    }));
  };

  const handleSave = async () => {
    setIsSaving(true);
    setSaveMessage('');

    const completeReview: WeeklyReview = {
      id: review.id || review.weekLabel!,
      weekLabel: review.weekLabel!,
      startDate: review.startDate!,
      endDate: review.endDate!,
      createdAt: (review as any).createdAt || Date.now(),
      updatedAt: Date.now(),
      coreGoals: review.coreGoals,
      achievements: review.achievements,
      resourceAnalysis: review.resourceAnalysis,
      marketRhythm: review.marketRhythm,
      nextWeekStrategy: review.nextWeekStrategy,
      keyInsight: review.keyInsight,
    };

    const success = await weeklyReviewService.saveReview(completeReview);

    if (success) {
      setSaveMessage('保存成功');
      setReview(completeReview);
      await loadAllWeeks();
      onSave?.(completeReview);
      setTimeout(() => setSaveMessage(''), 3000);
    } else {
      setSaveMessage('保存失败');
      setTimeout(() => setSaveMessage(''), 3000);
    }

    setIsSaving(false);
  };

  const handleExportPDF = async () => {
    await weeklyReviewService.exportToPDF(currentWeek);
  };

  const range = getWeekRange(currentWeek);

  return (
    <div className="space-y-4">
      {/* 顶部工具栏 */}
      <div className="flex items-center justify-between border-b pb-4">
        <div className="flex items-center gap-4">
          <button
            onClick={() => changeWeek('prev')}
            className="p-2 hover:bg-surface-hover rounded-lg transition-colors"
            title="上一周"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          <div className="text-center">
            <div className="font-semibold text-lg">{currentWeek}</div>
            <div className="text-sm text-muted-foreground">{range.startDate} ~ {range.endDate}</div>
          </div>
          <button
            onClick={() => changeWeek('next')}
            className="p-2 hover:bg-surface-hover rounded-lg transition-colors"
            title="下一周"
          >
            <ChevronRight className="h-5 w-5" />
          </button>
        </div>

        <div className="flex items-center gap-2">
          {saveMessage && (
            <span className={cn("text-sm", saveMessage.includes('成功') ? 'text-up' : 'text-down')}>
              {saveMessage}
            </span>
          )}
          <button
            onClick={handleExportPDF}
            className="flex items-center gap-2 px-4 py-2 bg-surface hover:bg-surface-hover border rounded-lg transition-colors"
          >
            <Download className="h-4 w-4" />
            导出PDF
          </button>
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground hover:bg-primary/90 rounded-lg transition-colors disabled:opacity-50"
          >
            <Save className="h-4 w-4" />
            {isSaving ? '保存中...' : '保存'}
          </button>
        </div>
      </div>

      {/* 复盘内容 */}
      <div className="grid gap-6">
        {/* 一、本周核心目标回顾 */}
        <SectionCard title="一、本周核心目标回顾" icon="🎯">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">本周重点布局的主线板块（1~2个）</label>
              <TextInput
                value={review.coreGoals?.mainSectors?.join('、') || ''}
                onChange={(value) => updateReview({
                  coreGoals: { ...review.coreGoals!, mainSectors: value.split('、').filter(s => s.trim()) }
                })}
                placeholder="例：AI算力、新能源汽车"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">当初选择该主线的核心逻辑</label>
              <TextInput
                multiline
                value={review.coreGoals?.coreLogic || ''}
                onChange={(value) => updateReview({
                  coreGoals: { ...review.coreGoals!, coreLogic: value }
                })}
                placeholder="例：政策催化（算力基建投资加码）+ 行业景气度回升（电动车销量超预期）"
              />
            </div>
          </div>
        </SectionCard>

        {/* 二、本周成果评估 */}
        <SectionCard title="二、本周成果评估" icon="📊">
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">上证涨跌幅 (%)</label>
                <NumberInput
                  value={review.achievements?.marketPerformance?.shanghaiChange}
                  onChange={(value) => updateReview({
                    achievements: {
                      ...review.achievements!,
                      marketPerformance: { ...review.achievements!.marketPerformance!, shanghaiChange: value }
                    }
                  })}
                  placeholder="例: 1.5"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">创业板涨跌幅 (%)</label>
                <NumberInput
                  value={review.achievements?.marketPerformance?.chinextChange}
                  onChange={(value) => updateReview({
                    achievements: {
                      ...review.achievements!,
                      marketPerformance: { ...review.achievements!.marketPerformance!, chinextChange: value }
                    }
                  })}
                  placeholder="例: 2.3"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">主线板块涨幅 (%)</label>
                <NumberInput
                  value={review.achievements?.sectorPerformance?.sectorChange}
                  onChange={(value) => updateReview({
                    achievements: {
                      ...review.achievements!,
                      sectorPerformance: { ...review.achievements!.sectorPerformance!, sectorChange: value }
                    }
                  })}
                  placeholder="例: 5.2"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">大盘涨幅 (%)</label>
                <NumberInput
                  value={review.achievements?.marketPerformance?.shanghaiChange}
                  onChange={(value) => {
                    const sectorChange = review.achievements?.sectorPerformance?.sectorChange || 0;
                    updateReview({
                      achievements: {
                        ...review.achievements!,
                        marketPerformance: { ...review.achievements!.marketPerformance!, shanghaiChange: value },
                        sectorPerformance: {
                          ...review.achievements!.sectorPerformance!,
                          sectorChange,
                          outperformance: sectorChange - value
                        }
                      }
                    });
                  }}
                  placeholder="例: 1.5"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">个股操作亮点（每行一条）</label>
              <TextInput
                multiline
                value={review.achievements?.highlights?.join('\n') || ''}
                onChange={(value) => updateReview({
                  achievements: { ...review.achievements!, highlights: value.split('\n').filter(s => s.trim()) }
                })}
                placeholder="例：精准低吸龙头、及时止盈"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">个股操作槽点（每行一条）</label>
              <TextInput
                multiline
                value={review.achievements?.lowlights?.join('\n') || ''}
                onChange={(value) => updateReview({
                  achievements: { ...review.achievements!, lowlights: value.split('\n').filter(s => s.trim()) }
                })}
                placeholder="例：追高杂毛、未止损弱势股"
              />
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">主线仓位占比 (%)</label>
                <NumberInput
                  value={review.achievements?.mainSectorPosition}
                  onChange={(value) => updateReview({
                    achievements: { ...review.achievements!, mainSectorPosition: value }
                  })}
                  placeholder="60"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">总体盈亏 (%)</label>
                <NumberInput
                  value={review.achievements?.totalProfitLoss}
                  onChange={(value) => updateReview({
                    achievements: { ...review.achievements!, totalProfitLoss: value }
                  })}
                  placeholder="+5.2"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">胜率 (%)</label>
                <NumberInput
                  value={review.achievements?.winRate}
                  onChange={(value) => updateReview({
                    achievements: { ...review.achievements!, winRate: value }
                  })}
                  placeholder="60"
                />
              </div>
            </div>
          </div>
        </SectionCard>

        {/* 三、资源投入分析 */}
        <SectionCard title="三、资源投入分析（资金 & 精力）" icon="💰">
          <div className="space-y-4">
            <div className="flex items-center gap-4">
              <label className="text-sm font-medium">资金是否集中在主线上？</label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={review.resourceAnalysis?.focusedOnMain || false}
                  onChange={(e) => updateReview({
                    resourceAnalysis: { ...review.resourceAnalysis!, focusedOnMain: e.target.checked }
                  })}
                  className="w-4 h-4"
                />
                <span className="text-sm">是（主线仓位 ≥60%）</span>
              </label>
            </div>
            <div className="flex items-center gap-4">
              <label className="text-sm font-medium">是否过度关注非主线杂毛股？</label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={review.resourceAnalysis?.scatteredAttention || false}
                  onChange={(e) => updateReview({
                    resourceAnalysis: { ...review.resourceAnalysis!, scatteredAttention: e.target.checked }
                  })}
                  className="w-4 h-4"
                />
                <span className="text-sm">是（频繁切换、追小票）</span>
              </label>
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">操作频率</label>
              <select
                value={review.resourceAnalysis?.tradingFrequency || 'moderate'}
                onChange={(e) => updateReview({
                  resourceAnalysis: { ...review.resourceAnalysis!, tradingFrequency: e.target.value as any }
                })}
                className="w-full px-3 py-2 border rounded-lg bg-surface focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-colors"
              >
                <option value="excessive">过度交易</option>
                <option value="moderate">适度</option>
                <option value="missed">错失机会</option>
              </select>
            </div>
          </div>
        </SectionCard>

        {/* 四、关键信号与市场节奏判断 */}
        <SectionCard title="四、关键信号与市场节奏判断" icon="📈">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">本周情绪周期阶段</label>
              <select
                value={review.marketRhythm?.emotionCycle || 'main_rise'}
                onChange={(e) => updateReview({
                  marketRhythm: { ...review.marketRhythm!, emotionCycle: e.target.value as any }
                })}
                className="w-full px-3 py-2 border rounded-lg bg-surface focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-colors"
              >
                <option value="startup">启动期</option>
                <option value="main_rise">主升期</option>
                <option value="climax">高潮期</option>
                <option value="divergence">分歧期</option>
                <option value="retreat">退潮期</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">核心验证信号（每行一条）</label>
              <TextInput
                multiline
                value={review.marketRhythm?.keySignals?.join('\n') || ''}
                onChange={(value) => updateReview({
                  marketRhythm: { ...review.marketRhythm!, keySignals: value.split('\n').filter(s => s.trim()) }
                })}
                placeholder="例：龙头连续加速但中位股批量跌停 → 分歧加剧"
              />
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">北向资金</label>
                <TextInput
                  value={review.marketRhythm?.northwardFunds || ''}
                  onChange={(value) => updateReview({
                    marketRhythm: { ...review.marketRhythm!, northwardFunds: value }
                  })}
                  placeholder="持续流入"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">量能</label>
                <TextInput
                  value={review.marketRhythm?.volume || ''}
                  onChange={(value) => updateReview({
                    marketRhythm: { ...review.marketRhythm!, volume: value }
                  })}
                  placeholder="维持在8000亿以上"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">涨停家数</label>
                <TextInput
                  value={review.marketRhythm?.limitUpCount || ''}
                  onChange={(value) => updateReview({
                    marketRhythm: { ...review.marketRhythm!, limitUpCount: value }
                  })}
                  placeholder="稳定＞50家"
                />
              </div>
            </div>
          </div>
        </SectionCard>

        {/* 五、下周核心策略制定 */}
        <SectionCard title="五、下周核心策略制定" icon="🎯">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">唯一聚焦主线</label>
              <TextInput
                value={review.nextWeekStrategy?.mainSector || ''}
                onChange={(value) => updateReview({
                  nextWeekStrategy: { ...review.nextWeekStrategy!, mainSector: value }
                })}
                placeholder="例：AI算力"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">潜在杠杆事件（每行一条）</label>
              <TextInput
                multiline
                value={review.nextWeekStrategy?.catalystEvents?.join('\n') || ''}
                onChange={(value) => updateReview({
                  nextWeekStrategy: { ...review.nextWeekStrategy!, catalystEvents: value.split('\n').filter(s => s.trim()) }
                })}
                placeholder="例：下周将发布《AI芯片白皮书》"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">情绪主升期仓位</label>
                <TextInput
                  value={review.nextWeekStrategy?.positionPlan?.mainRise || ''}
                  onChange={(value) => updateReview({
                    nextWeekStrategy: {
                      ...review.nextWeekStrategy!,
                      positionPlan: { ...review.nextWeekStrategy!.positionPlan!, mainRise: value }
                    }
                  })}
                  placeholder="7~9成"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">分歧/退潮期仓位</label>
                <TextInput
                  value={review.nextWeekStrategy?.positionPlan?.divergence || ''}
                  onChange={(value) => updateReview({
                    nextWeekStrategy: {
                      ...review.nextWeekStrategy!,
                      positionPlan: { ...review.nextWeekStrategy!.positionPlan!, divergence: value }
                    }
                  })}
                  placeholder="≤3成"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">重点关注标的（≤3只）</label>
              <div className="space-y-2">
                {[0, 1, 2].map(i => {
                  const target = review.nextWeekStrategy?.focusTargets?.[i];
                  return (
                    <div key={i} className="grid grid-cols-12 gap-2">
                      <input
                        type="text"
                        value={target?.name || ''}
                        onChange={(e) => {
                          const newTargets = [...(review.nextWeekStrategy?.focusTargets || [])];
                          while (newTargets.length < 3) newTargets.push({ name: '', symbol: '', logic: '' });
                          newTargets[i] = { ...newTargets[i], name: e.target.value };
                          updateReview({
                            nextWeekStrategy: { ...review.nextWeekStrategy!, focusTargets: newTargets }
                          });
                        }}
                        placeholder="名称"
                        className="col-span-3 px-3 py-2 border rounded-lg text-sm bg-surface focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-colors placeholder:text-muted-foreground/50"
                      />
                      <input
                        type="text"
                        value={target?.symbol || ''}
                        onChange={(e) => {
                          const newTargets = [...(review.nextWeekStrategy?.focusTargets || [])];
                          while (newTargets.length < 3) newTargets.push({ name: '', symbol: '', logic: '' });
                          newTargets[i] = { ...newTargets[i], symbol: e.target.value };
                          updateReview({
                            nextWeekStrategy: { ...review.nextWeekStrategy!, focusTargets: newTargets }
                          });
                        }}
                        placeholder="代码"
                        className="col-span-2 px-3 py-2 border rounded-lg text-sm bg-surface focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-colors placeholder:text-muted-foreground/50"
                      />
                      <input
                        type="text"
                        value={target?.logic || ''}
                        onChange={(e) => {
                          const newTargets = [...(review.nextWeekStrategy?.focusTargets || [])];
                          while (newTargets.length < 3) newTargets.push({ name: '', symbol: '', logic: '' });
                          newTargets[i] = { ...newTargets[i], logic: e.target.value };
                          updateReview({
                            nextWeekStrategy: { ...review.nextWeekStrategy!, focusTargets: newTargets }
                          });
                        }}
                        placeholder="逻辑"
                        className="col-span-7 px-3 py-2 border rounded-lg text-sm bg-surface focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-colors placeholder:text-muted-foreground/50"
                      />
                    </div>
                  );
                })}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">单票最大亏损容忍 (%)</label>
                <NumberInput
                  value={review.nextWeekStrategy?.riskControl?.maxSingleLoss}
                  onChange={(value) => updateReview({
                    nextWeekStrategy: {
                      ...review.nextWeekStrategy!,
                      riskControl: { ...review.nextWeekStrategy!.riskControl!, maxSingleLoss: value }
                    }
                  })}
                  placeholder="5"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">主线退潮时减仓至（成）</label>
                <NumberInput
                  value={review.nextWeekStrategy?.riskControl?.retreatPosition}
                  onChange={(value) => updateReview({
                    nextWeekStrategy: {
                      ...review.nextWeekStrategy!,
                      riskControl: { ...review.nextWeekStrategy!.riskControl!, retreatPosition: value }
                    }
                  })}
                  placeholder="3"
                />
              </div>
            </div>
          </div>
        </SectionCard>

        {/* 六、本周最大认知收获 */}
        <SectionCard title="六、本周最大认知收获（1句话总结）" icon="💡">
          <TextInput
            multiline
            value={review.keyInsight || ''}
            onChange={(value) => updateReview({ keyInsight: value })}
            placeholder="例：主升期要敢于持有龙头，不要因小波动下车。"
          />
        </SectionCard>
      </div>
    </div>
  );
}
