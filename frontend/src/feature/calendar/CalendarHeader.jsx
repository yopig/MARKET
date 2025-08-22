// src/components/calendar/CalendarHeader.jsx
import React from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

const monthNames = [
  "1월",
  "2월",
  "3월",
  "4월",
  "5월",
  "6월",
  "7월",
  "8월",
  "9월",
  "10월",
  "11월",
  "12월",
];

export const CalendarHeader = ({
  year,
  month,
  onPrevMonth,
  onNextMonth,
  loading,
}) => (
  <div className="d-flex justify-content-between align-items-center mb-4">
    <button
      onClick={onPrevMonth}
      className="btn btn-outline-secondary"
      aria-label="이전 달"
    >
      <ChevronLeft size={20} />
    </button>
    <div className="d-flex align-items-center gap-2">
      <h3 className="mb-0 fs-5 fw-semibold">
        {year}년 {monthNames[month]}
      </h3>
      {loading && (
        <div
          className="spinner-border spinner-border-sm text-primary"
          role="status"
        >
          <span className="visually-hidden">Loading...</span>
        </div>
      )}
    </div>
    <button
      onClick={onNextMonth}
      className="btn btn-outline-secondary"
      aria-label="다음 달"
    >
      <ChevronRight size={20} />
    </button>
  </div>
);
