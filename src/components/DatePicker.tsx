import { useState, useEffect, useRef } from "react";

interface DatePickerProps {
  value: string; // YYYY-MM-DD
  onChange: (value: string) => void;
  label?: string;
  prefix?: string;
  placeholder?: string;
}

const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
];

const WEEKDAYS = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];

export default function DatePicker({ value, onChange, prefix, placeholder = "Pick a date" }: DatePickerProps) {
  const [isOpen, setIsOpen] = useState(false);

  const [currentDate, setCurrentDate] = useState(() => {
    if (value) {
      const parsed = new Date(value);
      if (!isNaN(parsed.getTime())) return parsed;
    }
    return new Date();
  });
  
  const popoverRef = useRef<HTMLDivElement>(null);

  // Sync internal state when prop changes
  useEffect(() => {
    if (value) {
      const parsed = new Date(value);
      if (!isNaN(parsed.getTime())) {
        setCurrentDate(parsed);
      }
    }
  }, [value]);

  // Close popover when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (popoverRef.current && !popoverRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener("click", handleClickOutside);
    }
    return () => {
      document.removeEventListener("click", handleClickOutside);
    };
  }, [isOpen]);

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const handlePrevMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
  };

  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDayIndex = new Date(year, month, 1).getDay();

  // Days from previous month to fill the starting row
  const prevMonthDays = new Date(year, month, 0).getDate();
  const trailingDays = Array.from({ length: firstDayIndex }, (_, i) => {
    const day = prevMonthDays - firstDayIndex + 1 + i;
    return { day, isCurrentMonth: false, dateStr: formatDateString(year, month - 1, day) };
  });

  // Days for current month
  const currentMonthDays = Array.from({ length: daysInMonth }, (_, i) => {
    const day = i + 1;
    return { day, isCurrentMonth: true, dateStr: formatDateString(year, month, day) };
  });

  // Days from next month to pad the end row
  const totalCells = 42; // standard 6 rows
  const remainingCells = totalCells - (trailingDays.length + currentMonthDays.length);
  const leadingDays = Array.from({ length: remainingCells }, (_, i) => {
    const day = i + 1;
    return { day, isCurrentMonth: false, dateStr: formatDateString(year, month + 1, day) };
  });

  const allCells = [...trailingDays, ...currentMonthDays, ...leadingDays];

  function formatDateString(y: number, m: number, d: number) {
    const dateObj = new Date(y, m, d);
    const pad = (num: number) => num.toString().padStart(2, "0");
    return `${dateObj.getFullYear()}-${pad(dateObj.getMonth() + 1)}-${pad(dateObj.getDate())}`;
  }

  const handleSelectDay = (dateStr: string) => {
    onChange(dateStr);
    setIsOpen(false);
  };

  const displayLabel = () => {
    if (!value) return placeholder;
    const dateObj = new Date(value);
    if (isNaN(dateObj.getTime())) return placeholder;
    return dateObj.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric"
    });
  };

  return (
    <div className="relative shrink-0" ref={popoverRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center h-[38px] rounded-full border text-sm transition-all duration-300 ease-in-out text-left select-none relative overflow-hidden w-[260px] pl-3.5 pr-8 ${
          isOpen 
            ? "bg-surface-container border-primary ring-2 ring-primary/20 shadow-sm" 
            : "bg-surface border-outline-variant hover:bg-surface-container"
        }`}
      >
        <div className="flex items-center gap-1.5 min-w-0 w-full">
          <span className="material-symbols-outlined text-secondary shrink-0" style={{ fontSize: 18 }}>calendar_today</span>
          
          <div className="flex items-center gap-1 min-w-0 transition-opacity duration-200 opacity-100 w-auto">
            {prefix && (
              <span className="text-secondary text-[11px] font-bold uppercase tracking-wider shrink-0">{prefix}</span>
            )}
            <span className={`truncate text-sm ${value ? "font-bold text-on-surface" : "text-secondary font-normal"}`}>
              {displayLabel()}
            </span>
          </div>
        </div>

        {isOpen && (
          <span className="material-symbols-outlined text-secondary opacity-60 shrink-0 absolute right-2.5" style={{ fontSize: 16 }}>expand_more</span>
        )}
      </button>

      {value && !isOpen && (
        <button 
          onClick={(e) => {
            e.stopPropagation();
            onChange("");
          }}
          className="absolute right-2.5 top-1/2 -translate-y-1/2 text-secondary hover:text-on-surface hover:bg-surface-container-high rounded-full w-5 h-5 flex items-center justify-center transition-colors z-10"
          title="Clear date"
        >
          <span className="material-symbols-outlined" style={{ fontSize: '14px' }}>close</span>
        </button>
      )}

      {/* Floating Popover Calendar */}
      {isOpen && (
        <div className="absolute z-30 mt-2 p-3 bg-surface border border-outline-variant rounded-xl shadow-lg w-[280px] top-full left-0 md:left-auto md:right-0 animate-in fade-in slide-in-from-top-1 duration-150">
          {/* Header */}
          <div className="flex items-center justify-between mb-3 px-1">
            <button
              type="button"
              onClick={handlePrevMonth}
              className="w-7 h-7 rounded-lg border border-outline-variant flex items-center justify-center hover:bg-surface-container text-secondary hover:text-on-surface transition-colors"
            >
              <span className="material-symbols-outlined" style={{ fontSize: 16 }}>chevron_left</span>
            </button>
            <div className="text-sm font-bold text-on-surface">
              {MONTHS[month]} {year}
            </div>
            <button
              type="button"
              onClick={handleNextMonth}
              className="w-7 h-7 rounded-lg border border-outline-variant flex items-center justify-center hover:bg-surface-container text-secondary hover:text-on-surface transition-colors"
            >
              <span className="material-symbols-outlined" style={{ fontSize: 16 }}>chevron_right</span>
            </button>
          </div>

          {/* Weekdays */}
          <div className="grid grid-cols-7 gap-y-1 text-center mb-1">
            {WEEKDAYS.map((day) => (
              <span key={day} className="text-[11px] text-secondary font-bold uppercase tracking-wider py-1 select-none">
                {day}
              </span>
            ))}
          </div>

          {/* Days Grid */}
          <div className="grid grid-cols-7 gap-1">
            {allCells.map(({ day, isCurrentMonth, dateStr }, index) => {
              const isSelected = value === dateStr;
              const isToday = formatDateString(new Date().getFullYear(), new Date().getMonth(), new Date().getDate()) === dateStr;
              
              return (
                <button
                  key={index}
                  type="button"
                  onClick={() => handleSelectDay(dateStr)}
                  className={`aspect-square w-full rounded-lg text-xs font-medium flex items-center justify-center transition-all ${
                    isSelected
                      ? "bg-primary text-white font-bold"
                      : isToday
                      ? "bg-primary-container/10 border border-primary text-primary font-bold hover:bg-surface-container"
                      : isCurrentMonth
                      ? "text-on-surface hover:bg-surface-container"
                      : "text-secondary opacity-30 hover:bg-surface-container"
                  }`}
                >
                  {day}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
