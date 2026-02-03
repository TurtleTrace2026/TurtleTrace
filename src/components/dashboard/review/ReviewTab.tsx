import { useState, useEffect } from 'react';
import { Edit, Eye, Plus } from 'lucide-react';
import { ReviewEditor } from './ReviewEditor';
import { ReviewViewer } from './ReviewViewer';
import { reviewService } from '../../../services/reviewService';
import type { DailyReview } from '../../../types/review';

type ViewMode = 'edit' | 'view';

export function ReviewTab() {
  const [viewMode, setViewMode] = useState<ViewMode>('edit');
  const [selectedDate, setSelectedDate] = useState(() => {
    const today = new Date();
    return `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
  });
  const [existingReview, setExistingReview] = useState<DailyReview | undefined>();
  const [hasReview, setHasReview] = useState(false);

  // 检查当前日期是否有复盘
  useEffect(() => {
    checkReviewExists();
  }, [selectedDate]);

  const checkReviewExists = async () => {
    const review = await reviewService.getReview(selectedDate);
    setExistingReview(review || undefined);
    setHasReview(!!review);

    // 如果没有复盘，自动切换到编辑模式
    if (!review) {
      setViewMode('edit');
    }
  };

  // 切换到编辑模式
  const handleEditDate = (date: string) => {
    setSelectedDate(date);
    setViewMode('edit');
  };

  // 切换到查看模式
  const handleSwitchToView = () => {
    setViewMode('view');
  };

  // 保存后的回调
  const handleSave = (review: DailyReview) => {
    setExistingReview(review);
    setHasReview(true);
  };

  // 获取今天的日期
  const getTodayDate = () => {
    const today = new Date();
    return `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
  };

  const todayDate = getTodayDate();

  return (
    <div className="space-y-4">
      {/* 模式切换 */}
      <div className="flex items-center justify-between border-b pb-4">
        <div className="flex gap-2">
          <button
            onClick={() => setViewMode('edit')}
            className={`flex items-center gap-2 px-4 py-2 rounded-md transition-colors ${
              viewMode === 'edit'
                ? 'bg-primary text-primary-foreground'
                : 'bg-accent hover:bg-accent/80'
            }`}
          >
            <Edit className="h-4 w-4" />
            编辑复盘
          </button>
          <button
            onClick={handleSwitchToView}
            disabled={!hasReview}
            className={`flex items-center gap-2 px-4 py-2 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
              viewMode === 'view'
                ? 'bg-primary text-primary-foreground'
                : 'bg-accent hover:bg-accent/80'
            }`}
          >
            <Eye className="h-4 w-4" />
            查看历史
          </button>
        </div>

        {selectedDate === todayDate && !hasReview && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Plus className="h-4 w-4" />
            开始今日复盘
          </div>
        )}
      </div>

      {/* 内容区域 */}
      {viewMode === 'edit' ? (
        <ReviewEditor
          date={selectedDate}
          existingReview={existingReview}
          onSave={handleSave}
        />
      ) : (
        <ReviewViewer onEditDate={handleEditDate} />
      )}
    </div>
  );
}
