import { useState, useMemo } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import type { DailyReview } from '../../../types/review';

interface ReviewCalendarProps {
  reviews: DailyReview[];
  selectedDate: string;
  onSelectDate: (date: string) => void;
}

export function ReviewCalendar({
  reviews,
  selectedDate,
  onSelectDate,
}: ReviewCalendarProps) {
  const [currentMonth, setCurrentMonth] = useState(() => {
    const date = new Date(selectedDate);
    return { year: date.getFullYear(), month: date.getMonth() };
  });

  // 获取有复盘记录的日期集合
  const reviewDates = useMemo(() => {
    return new Set(reviews.map(r => r.date));
  }, [reviews]);

  // 获取月份信息
  const monthInfo = useMemo(() => {
    const firstDay = new Date(currentMonth.year, currentMonth.month, 1);
    const lastDay = new Date(currentMonth.year, currentMonth.month + 1, 0);
    const startPad = firstDay.getDay(); // 0 = Sunday
    const totalDays = lastDay.getDate();

    return { startPad, totalDays };
  }, [currentMonth]);

  // 生成日历天数
  const calendarDays = useMemo(() => {
    const days: (Date | null)[] = [];

    // 填充月初空白
    for (let i = 0; i < monthInfo.startPad; i++) {
      days.push(null);
    }

    // 填充日期
    for (let i = 1; i <= monthInfo.totalDays; i++) {
      days.push(new Date(currentMonth.year, currentMonth.month, i));
    }

    return days;
  }, [monthInfo]);

  // 格式化日期为 YYYY-MM-DD
  const formatDate = (date: Date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  // 上一个月
  const prevMonth = () => {
    setCurrentMonth(prev => {
      if (prev.month === 0) {
        return { year: prev.year - 1, month: 11 };
      }
      return { year: prev.year, month: prev.month - 1 };
    });
  };

  // 下一个月
  const nextMonth = () => {
    setCurrentMonth(prev => {
      if (prev.month === 11) {
        return { year: prev.year + 1, month: 0 };
      }
      return { year: prev.year, month: prev.month + 1 };
    });
  };

  // 今天
  const goToday = () => {
    const today = new Date();
    setCurrentMonth({ year: today.getFullYear(), month: today.getMonth() });
    onSelectDate(formatDate(today));
  };

  const weekDays = ['日', '一', '二', '三', '四', '五', '六'];
  const todayStr = formatDate(new Date());

  return (
    <div className="border rounded-lg bg-card p-4">
      {/* 月份导航 */}
      <div className="flex items-center justify-between mb-4">
        <button
          onClick={prevMonth}
          className="p-2 hover:bg-accent rounded-md transition-colors"
        >
          <ChevronLeft className="h-5 w-5" />
        </button>

        <div className="flex items-center gap-3">
          <h3 className="text-lg font-semibold">
            {currentMonth.year}年{currentMonth.month + 1}月
          </h3>
          <button
            onClick={goToday}
            className="text-sm px-3 py-1 bg-primary/10 hover:bg-primary/20 rounded-full transition-colors"
          >
            今天
          </button>
        </div>

        <button
          onClick={nextMonth}
          className="p-2 hover:bg-accent rounded-md transition-colors"
        >
          <ChevronRight className="h-5 w-5" />
        </button>
      </div>

      {/* 星期标题 */}
      <div className="grid grid-cols-7 gap-1 mb-2">
        {weekDays.map(day => (
          <div key={day} className="text-center text-sm text-muted-foreground py-2">
            {day}
          </div>
        ))}
      </div>

      {/* 日期格子 */}
      <div className="grid grid-cols-7 gap-1">
        {calendarDays.map((date, index) => {
          if (!date) {
            return <div key={index} className="aspect-square" />;
          }

          const dateStr = formatDate(date);
          const hasReview = reviewDates.has(dateStr);
          const isSelected = dateStr === selectedDate;
          const isToday = dateStr === todayStr;

          return (
            <button
              key={index}
              onClick={() => onSelectDate(dateStr)}
              className={`
                aspect-square rounded-md flex items-center justify-center text-sm relative transition-colors
                ${isSelected
                  ? 'bg-primary text-primary-foreground font-semibold'
                  : 'hover:bg-accent'
                }
                ${isToday && !isSelected ? 'ring-2 ring-primary' : ''}
              `}
            >
              {date.getDate()}
              {hasReview && (
                <span
                  className={`
                    absolute bottom-1 w-1 h-1 rounded-full
                    ${isSelected ? 'bg-primary-foreground' : 'bg-primary'}
                  `}
                />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
