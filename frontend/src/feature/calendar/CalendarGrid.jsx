// src/components/calendar/CalendarGrid.jsx
import React from "react";

const dayNames = ["일", "월", "화", "수", "목", "금", "토"];

export const CalendarGrid = ({
  daysInMonth,
  firstDay,
  reviews,
  holidays,
  onDateClick,
  formatDate,
  getDayOfWeek,
}) => {
  const getDataForDate = (day) => {
    const dateStr = formatDate(day);
    return {
      reviews: reviews.filter((review) => review.date === dateStr),
      holiday: holidays[dateStr],
    };
  };

  // 전체 칸 수 계산 (6주 * 7일 = 42칸)
  const totalCells = 42;
  const cells = [];

  // 빈 칸 추가 (첫 주)
  for (let i = 0; i < firstDay; i++) {
    cells.push(
      <div key={`empty-start-${i}`} className="cal-cell cal-empty"></div>,
    );
  }

  // 날짜 칸 추가
  for (let day = 1; day <= daysInMonth; day++) {
    const data = getDataForDate(day);
    const dayOfWeek = getDayOfWeek(day);

    let cellClass = "cal-cell cal-date";
    if (dayOfWeek === 0) cellClass += " cal-sunday";
    if (dayOfWeek === 6) cellClass += " cal-saturday";
    if (data.holiday) cellClass += " cal-holiday";
    if (data.reviews.length > 0) cellClass += " cal-has-reviews";

    cells.push(
      <div
        key={`day-${day}`}
        className={cellClass}
        onClick={() => onDateClick(day, data)}
      >
        <div className="cal-day-number">{day}</div>
        {data.holiday && (
          <div className="cal-badge-holiday">{data.holiday.name}</div>
        )}
        {data.reviews.length > 0 && (
          <>
            {data.reviews.slice(0, 2).map((review, idx) => (
              <div key={idx} className="cal-badge-review">
                {review.placeName}
              </div>
            ))}
            {data.reviews.length > 2 && (
              <div className="cal-more-text">
                +{data.reviews.length - 2} more
              </div>
            )}
          </>
        )}
      </div>,
    );
  }

  // 남은 빈 칸 추가
  const remainingCells = totalCells - firstDay - daysInMonth;
  for (let i = 0; i < remainingCells; i++) {
    cells.push(
      <div key={`empty-end-${i}`} className="cal-cell cal-empty"></div>,
    );
  }

  return (
    <div className="cal-wrapper">
      {/* 요일 헤더 */}
      <div className="cal-header-row">
        {dayNames.map((day, index) => (
          <div
            key={day}
            className={`cal-header-cell ${
              index === 0
                ? "cal-header-sunday"
                : index === 6
                  ? "cal-header-saturday"
                  : ""
            }`}
          >
            {day}
          </div>
        ))}
      </div>

      {/* 날짜 그리드 */}
      <div className="cal-body">{cells}</div>
    </div>
  );
};
