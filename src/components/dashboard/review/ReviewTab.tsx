import { useState, useEffect } from 'react';
import { Edit, Eye, Plus, BookOpen, Calendar } from 'lucide-react';
import { Card } from '../../ui/card';
import { ReviewEditor } from './ReviewEditor';
import { ReviewViewer } from './ReviewViewer';
import { WeeklyReviewEditor } from '../weeklyReview/WeeklyReviewEditor';
import { WeeklyReviewViewer } from '../weeklyReview/WeeklyReviewViewer';
import { reviewService } from '../../../services/reviewService';
import { weeklyReviewService } from '../../../services/weeklyReviewService';
import type { DailyReview } from '../../../types/review';
import type { WeeklyReview } from '../../../types/weeklyReview';
import type { Account } from '../../../types/account';
import { getCurrentWeekLabel } from '../../../types/weeklyReview';

type ReviewType = 'daily' | 'weekly';
type ViewMode = 'edit' | 'view';

interface ReviewTabProps {
  currentAccountId?: string | null;
  accounts?: Account[];
}

export function ReviewTab({ currentAccountId, accounts }: ReviewTabProps) {
  const [reviewType, setReviewType] = useState<ReviewType>('daily');
  const [viewMode, setViewMode] = useState<ViewMode>('view');
  const [selectedDate, setSelectedDate] = useState(() => {
    const today = new Date();
    return `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
  });
  const [selectedWeek, setSelectedWeek] = useState(getCurrentWeekLabel());
  const [existingReview, setExistingReview] = useState<DailyReview | undefined>();
  const [existingWeeklyReview, setExistingWeeklyReview] = useState<WeeklyReview | undefined>();
  const [hasAnyReviews, setHasAnyReviews] = useState(false);
  const [hasAnyWeeklyReviews, setHasAnyWeeklyReviews] = useState(false);

  // 检查是否有任何复盘记录
  useEffect(() => {
    checkAnyReviews();
    checkAnyWeeklyReviews();
  }, []);

  // 检查当前日期是否有复盘
  useEffect(() => {
    if (reviewType === 'daily') {
      checkReviewExists();
    } else {
      checkWeeklyReviewExists();
    }
  }, [selectedDate, selectedWeek, reviewType]);

  const checkAnyReviews = async () => {
    const allReviews = await reviewService.getAllReviews();
    setHasAnyReviews(allReviews.length > 0);
  };

  const checkAnyWeeklyReviews = async () => {
    const allReviews = await weeklyReviewService.getAllReviews();
    setHasAnyWeeklyReviews(allReviews.length > 0);
  };

  const checkReviewExists = async () => {
    const review = await reviewService.getReview(selectedDate);
    setExistingReview(review || undefined);
  };

  const checkWeeklyReviewExists = async () => {
    const review = await weeklyReviewService.getReview(selectedWeek);
    setExistingWeeklyReview(review || undefined);
  };

  // 切换复盘类型
  const handleReviewTypeChange = async (type: ReviewType) => {
    setReviewType(type);
    setViewMode('view');
    if (type === 'daily') {
      setSelectedDate(() => {
        const today = new Date();
        return `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
      });
    } else {
      setSelectedWeek(getCurrentWeekLabel());
    }
  };

  // 切换到编辑模式
  const handleEditDate = (date: string) => {
    setSelectedDate(date);
    setViewMode('edit');
  };

  const handleEditWeek = (weekLabel: string) => {
    setSelectedWeek(weekLabel);
    setViewMode('edit');
  };

  // 切换到查看模式
  const handleSwitchToView = async () => {
    await checkAnyReviews();
    await checkAnyWeeklyReviews();
    setViewMode('view');
  };

  // 保存后的回调
  const handleSave = (review: DailyReview) => {
    setExistingReview(review);
    setHasAnyReviews(true);
  };

  const handleWeeklySave = (review: WeeklyReview) => {
    setExistingWeeklyReview(review);
    setHasAnyWeeklyReviews(true);
  };

  // 获取今天的日期
  const getTodayDate = () => {
    const today = new Date();
    return `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
  };

  const todayDate = getTodayDate();
  const currentWeekLabel = getCurrentWeekLabel();

  return (
    <div className="space-y-6">
      {/* 模式切换卡片 */}
      <Card className="p-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          {/* 左侧：复盘类型和模式切换 */}
          <div className="flex flex-wrap items-center gap-3">
            {/* 复盘类型切换 */}
            <div className="flex gap-1 bg-surface rounded-lg p-1 border">
              <button
                onClick={() => handleReviewTypeChange('daily')}
                className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all ${
                  reviewType === 'daily'
                    ? 'bg-primary text-primary-foreground shadow-sm'
                    : 'text-muted-foreground hover:bg-surface-hover'
                }`}
              >
                <BookOpen className="h-4 w-4" />
                每日复盘
              </button>
              <button
                onClick={() => handleReviewTypeChange('weekly')}
                className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all ${
                  reviewType === 'weekly'
                    ? 'bg-primary text-primary-foreground shadow-sm'
                    : 'text-muted-foreground hover:bg-surface-hover'
                }`}
              >
                <Calendar className="h-4 w-4" />
                每周复盘
              </button>
            </div>

            <div className="w-px h-8 bg-border" />

            {/* 编辑/查看模式切换 */}
            <button
              onClick={() => setViewMode('edit')}
              className={`flex items-center gap-2 px-4 py-2 rounded-md transition-all ${
                viewMode === 'edit'
                  ? 'bg-info text-info-foreground shadow-sm'
                  : 'bg-surface hover:bg-surface-hover text-muted-foreground'
              }`}
            >
              <Edit className="h-4 w-4" />
              编辑复盘
            </button>
            <button
              onClick={handleSwitchToView}
              disabled={reviewType === 'daily' ? !hasAnyReviews : !hasAnyWeeklyReviews}
              className={`flex items-center gap-2 px-4 py-2 rounded-md transition-all disabled:opacity-50 disabled:cursor-not-allowed ${
                viewMode === 'view'
                  ? 'bg-info text-info-foreground shadow-sm'
                  : 'bg-surface hover:bg-surface-hover text-muted-foreground'
              }`}
            >
              <Eye className="h-4 w-4" />
              查看历史
            </button>
          </div>

          {/* 右侧：提示信息 */}
          {reviewType === 'daily' && selectedDate === todayDate && !existingReview && (
            <div className="flex items-center gap-2 text-sm text-info bg-info/10 px-3 py-2 rounded-lg">
              <Plus className="h-4 w-4" />
              开始今日复盘
            </div>
          )}
          {reviewType === 'weekly' && selectedWeek === currentWeekLabel && !existingWeeklyReview && (
            <div className="flex items-center gap-2 text-sm text-info bg-info/10 px-3 py-2 rounded-lg">
              <Plus className="h-4 w-4" />
              开始本周复盘
            </div>
          )}
        </div>
      </Card>

      {/* 内容区域 */}
      {reviewType === 'daily' ? (
        viewMode === 'edit' ? (
          <ReviewEditor
            date={selectedDate}
            existingReview={existingReview}
            onSave={handleSave}
          />
        ) : (
          <ReviewViewer onEditDate={handleEditDate} />
        )
      ) : (
        viewMode === 'edit' ? (
          <WeeklyReviewEditor
            weekLabel={selectedWeek}
            existingReview={existingWeeklyReview}
            onSave={handleWeeklySave}
          />
        ) : (
          <WeeklyReviewViewer onEditWeek={handleEditWeek} />
        )
      )}
    </div>
  );
}
