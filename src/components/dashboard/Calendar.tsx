import React, { useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

export const Calendar: React.FC = () => {
  const [currentDate, setCurrentDate] = useState(new Date());

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const daysOfWeek = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

  // Days in month
  const getDaysInMonth = (y: number, m: number) => {
    return new Date(y, m + 1, 0).getDate();
  };

  // Day of week index for the first day of the month (0 - Sunday, 6 - Saturday)
  const getFirstDayIndex = (y: number, m: number) => {
    return new Date(y, m, 1).getDay();
  };

  const daysCount = getDaysInMonth(year, month);
  const startDayIndex = getFirstDayIndex(year, month);

  // Previous month days to fill start gap
  const prevMonth = month === 0 ? 11 : month - 1;
  const prevYear = month === 0 ? year - 1 : year;
  const prevDaysCount = getDaysInMonth(prevYear, prevMonth);

  const days: { dayNum: number; isCurrentMonth: boolean; date: Date }[] = [];

  // Fill preceding empty days of the previous month
  for (let i = startDayIndex - 1; i >= 0; i--) {
    const dayVal = prevDaysCount - i;
    days.push({
      dayNum: dayVal,
      isCurrentMonth: false,
      date: new Date(prevYear, prevMonth, dayVal),
    });
  }

  // Fill current month days
  for (let i = 1; i <= daysCount; i++) {
    days.push({
      dayNum: i,
      isCurrentMonth: true,
      date: new Date(year, month, i),
    });
  }

  // Fill succeeding empty days of the next month to make a clean multiple of 7
  const totalSlots = 42; // standard 6-row calendar grid
  const nextMonth = month === 11 ? 0 : month + 1;
  const nextYear = month === 11 ? year + 1 : year;
  const nextDaysNeeded = totalSlots - days.length;
  
  for (let i = 1; i <= nextDaysNeeded; i++) {
    days.push({
      dayNum: i,
      isCurrentMonth: false,
      date: new Date(nextYear, nextMonth, i),
    });
  }

  const handlePrevMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
  };

  const isToday = (date: Date) => {
    const today = new Date();
    return date.getDate() === today.getDate() &&
           date.getMonth() === today.getMonth() &&
           date.getFullYear() === today.getFullYear();
  };

  return (
    <div className="glass-panel p-4.5 rounded-2xl select-none flex flex-col">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-sm font-bold text-text-primary">
          {monthNames[month]} <span className="text-text-secondary font-medium ml-1">{year}</span>
        </h3>
        
        <div className="flex items-center gap-1">
          <button
            onClick={handlePrevMonth}
            className="p-1 rounded-lg border border-border/20 bg-surface/30 text-text-secondary hover:text-text-primary hover:bg-surface-hover/50 transition-all focus:outline-none"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <button
            onClick={handleNextMonth}
            className="p-1 rounded-lg border border-border/20 bg-surface/30 text-text-secondary hover:text-text-primary hover:bg-surface-hover/50 transition-all focus:outline-none"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Weekday Labels */}
      <div className="grid grid-cols-7 gap-1 text-center text-[10px] font-bold text-text-secondary uppercase tracking-wider mb-2">
        {daysOfWeek.map(day => (
          <div key={day} className="py-1">{day}</div>
        ))}
      </div>

      {/* Days Grid */}
      <div className="grid grid-cols-7 gap-1 text-center text-xs font-semibold">
        {days.map((item, idx) => {
          const currentDayIsToday = isToday(item.date);
          return (
            <div
              key={idx}
              className={`py-1 rounded-lg transition-all flex items-center justify-center relative ${
                item.isCurrentMonth 
                  ? 'text-text-primary hover:bg-surface-hover/40' 
                  : 'text-text-secondary/30'
              } ${
                currentDayIsToday 
                  ? 'bg-accent/15 text-accent font-extrabold border border-accent/25' 
                  : ''
              }`}
            >
              {item.dayNum}
              {currentDayIsToday && (
                <span className="absolute bottom-1 h-1 w-1 rounded-full bg-accent" />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
