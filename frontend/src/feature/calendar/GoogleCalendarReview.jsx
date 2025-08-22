// src/components/calendar/GoogleCalendarReview.jsx
import React, { useState } from "react";
import { Calendar, AlertCircle } from "lucide-react";
import { useCalendarData } from "./hooks/useCalendarData";
import { useCalendar } from "./hooks/useCalendar";
import { CalendarHeader } from "./CalendarHeader";
import { CalendarGrid } from "./CalendarGrid";
import { DateDetailModal } from "./DateDetailModal";
import { CalendarStats } from "./CalendarStats";
import "../../styles/calendar.css";

const GoogleCalendarReview = () => {
  const {
    currentDate,
    year,
    month,
    daysInMonth,
    firstDay,
    handlePrevMonth,
    handleNextMonth,
    formatDate,
    getDayOfWeek,
  } = useCalendar();
  const { reviews, holidays, loading, error } = useCalendarData(currentDate);

  const [selectedDate, setSelectedDate] = useState(null);

  const handleDateClick = (day, data) => {
    setSelectedDate({ day, ...data });
  };

  const handleCloseModal = () => {
    setSelectedDate(null);
  };

  return (
    <div className="calendar-container container-fluid">
      {error && <div className="alert alert-warning">...</div>}
      <div className="card">
        <div className="card-body">
          <CalendarHeader
            year={year}
            month={month}
            onPrevMonth={handlePrevMonth}
            onNextMonth={handleNextMonth}
            loading={loading}
          />
          {/* 범례는 여기에 직접 작성하거나 컴포넌트로 분리 가능 */}
          <div className="d-flex flex-wrap gap-3 small">
            <CalendarStats
              reviews={reviews}
              holidays={holidays}
              currentDate={currentDate}
            />

            <DateDetailModal
              show={!!selectedDate}
              onClose={handleCloseModal}
              date={currentDate}
              data={selectedDate}
            />
          </div>

          <CalendarGrid
            daysInMonth={daysInMonth}
            firstDay={firstDay}
            reviews={reviews}
            holidays={holidays}
            onDateClick={handleDateClick}
            formatDate={formatDate}
            getDayOfWeek={getDayOfWeek}
          />
        </div>
      </div>
    </div>
  );
};

export default GoogleCalendarReview;
