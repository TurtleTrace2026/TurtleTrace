import { useState } from 'react';
import { ChevronDown, ChevronRight, X, Check } from 'lucide-react';
import { PRESET_EVENT_TAGS, getTagCategories, getTagsByCategory } from '../../../data/presetEventTags';
import { cn } from '../../../lib/utils';

interface TagSelectorProps {
  selectedTags: string[];
  onChange: (tags: string[]) => void;
}

export function TagSelector({ selectedTags, onChange }: TagSelectorProps) {
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set(['影响方向']));

  // 切换分类展开状态
  const toggleCategory = (category: string) => {
    setExpandedCategories(prev => {
      const next = new Set(prev);
      if (next.has(category)) {
        next.delete(category);
      } else {
        next.add(category);
      }
      return next;
    });
  };

  // 切换标签选中状态
  const toggleTag = (tagId: string) => {
    if (selectedTags.includes(tagId)) {
      onChange(selectedTags.filter(id => id !== tagId));
    } else {
      onChange([...selectedTags, tagId]);
    }
  };

  // 移除已选标签
  const removeTag = (tagId: string) => {
    onChange(selectedTags.filter(id => id !== tagId));
  };

  const categories = getTagCategories();

  return (
    <div className="space-y-3">
      {/* 已选标签展示 */}
      {selectedTags.length > 0 && (
        <div className="flex flex-wrap gap-1.5 p-2 bg-muted/50 rounded-lg">
          {selectedTags.map(tagId => {
            const tag = PRESET_EVENT_TAGS.find(t => t.id === tagId);
            if (!tag) return null;
            return (
              <span
                key={tag.id}
                className={cn(
                  "inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-background border",
                  tag.color
                )}
              >
                {tag.name}
                <button
                  onClick={() => removeTag(tag.id)}
                  className="hover:bg-muted rounded-full p-0.5"
                >
                  <X className="h-3 w-3" />
                </button>
              </span>
            );
          })}
          <button
            onClick={() => onChange([])}
            className="text-xs text-muted-foreground hover:text-foreground px-1"
          >
            清空
          </button>
        </div>
      )}

      {/* 分类列表 */}
      <div className="border rounded-lg divide-y">
        {categories.map(category => {
          const tags = getTagsByCategory(category);
          const isExpanded = expandedCategories.has(category);
          const selectedInCategory = tags.filter(t => selectedTags.includes(t.id)).length;

          return (
            <div key={category}>
              <button
                type="button"
                onClick={() => toggleCategory(category)}
                className="w-full flex items-center justify-between p-3 hover:bg-surface-hover transition-colors"
              >
                <div className="flex items-center gap-2">
                  {isExpanded ? (
                    <ChevronDown className="h-4 w-4 text-muted-foreground" />
                  ) : (
                    <ChevronRight className="h-4 w-4 text-muted-foreground" />
                  )}
                  <span className="font-medium text-sm">{category}</span>
                  {selectedInCategory > 0 && (
                    <span className="text-xs bg-primary/10 text-primary px-1.5 py-0.5 rounded">
                      {selectedInCategory}
                    </span>
                  )}
                </div>
              </button>

              {isExpanded && (
                <div className="px-3 pb-3 flex flex-wrap gap-1.5">
                  {tags.map(tag => {
                    const isSelected = selectedTags.includes(tag.id);
                    return (
                      <button
                        key={tag.id}
                        type="button"
                        onClick={() => toggleTag(tag.id)}
                        className={cn(
                          "inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-full border transition-all",
                          isSelected
                            ? "bg-primary/10 border-primary/30 text-primary"
                            : "bg-background hover:bg-surface-hover border-border"
                        )}
                      >
                        {tag.name}
                        {isSelected && <Check className="h-3 w-3" />}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
