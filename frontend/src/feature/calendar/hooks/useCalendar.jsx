// src/components/calendar/hooks/useCalendar.js
import { useState, useMemo } from "react";

export const useCalendar = (initialDate = new Date()) => {
  const [currentDate, setCurrentDate] = useState(initialDate);

  const calendarInfo = useMemo(() => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const firstDay = new Date(year, month, 1).getDay();
    return { year, month, daysInMonth, firstDay };
  }, [currentDate]);

  const handlePrevMonth = () =>
    setCurrentDate(new Date(calendarInfo.year, calendarInfo.month - 1));
  const handleNextMonth = () =>
    setCurrentDate(new Date(calendarInfo.year, calendarInfo.month + 1));

  const formatDate = (day) =>
    `${calendarInfo.year}-${String(calendarInfo.month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
  const getDayOfWeek = (day) =>
    new Date(calendarInfo.year, calendarInfo.month, day).getDay();

  return {
    currentDate,
    ...calendarInfo,
    handlePrevMonth,
    handleNextMonth,
    formatDate,
    getDayOfWeek,
  };
};
