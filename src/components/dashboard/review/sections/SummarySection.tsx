import { Lightbulb, PenLine } from 'lucide-react';
import { SectionCard } from '../shared/SectionCard';
import { TextInput } from '../shared/TextInput';

interface SummarySectionProps {
  value: string;
  onChange: (value: string) => void;
}

// 预设的总结模板
const SUMMARY_TEMPLATES = [
  '今日整体操作符合预期，保持耐心，继续等待机会。',
  '今日操作存在追涨杀跌的情况，需要控制情绪，严格执行交易计划。',
  '市场震荡加剧，降低仓位，观望为主，等待明确信号。',
  '抓住了一些机会，但也有失误，总结经验教训，明天做得更好。',
  '严格遵守交易纪律，不追高不抄底，保持理性思考。',
];

export function SummarySection({ value, onChange }: SummarySectionProps) {
  // 应用模板
  const applyTemplate = (template: string) => {
    if (!value) {
      onChange(template);
    } else {
      onChange(value + '\n\n' + template);
    }
  };

  return (
    <SectionCard title="总结感悟" icon="💭">
      <div className="space-y-4">
        {/* 快捷模板 */}
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Lightbulb className="w-4 h-4 text-yellow-500" />
            <span className="text-sm font-medium text-muted-foreground">快捷模板</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {SUMMARY_TEMPLATES.map((template, index) => (
              <button
                key={index}
                onClick={() => applyTemplate(template)}
                className="text-xs px-3 py-1.5 bg-surface hover:bg-surface-hover border rounded-full transition-colors"
              >
                {template.slice(0, 15)}...
              </button>
            ))}
          </div>
        </div>

        {/* 文本输入区 */}
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <PenLine className="w-4 h-4 text-muted-foreground" />
            <label className="text-sm font-medium text-muted-foreground">
              今日总结与感悟
            </label>
          </div>
          <TextInput
            value={value}
            onChange={onChange}
            placeholder="记录今日交易的总体感受、经验教训、对市场的理解..."
            multiline
            rows={6}
            maxLength={2000}
          />
          <div className="text-xs text-muted-foreground">
            提示：可以记录今日最深刻的感受、最重要的教训、对明天的启示等
          </div>
        </div>

        {/* 统计信息 */}
        {value && (
          <div className="text-sm text-muted-foreground bg-surface/50 rounded-lg p-3 border">
            <div className="flex items-center justify-between">
              <span>字数统计</span>
              <span className="font-medium font-mono tabular-nums">{value.length} / 2000</span>
            </div>
          </div>
        )}
      </div>
    </SectionCard>
  );
}
