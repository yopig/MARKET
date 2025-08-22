// src/components/calendar/DateCell.jsx
import React from "react";

export const DateCell = ({ day, data, onDateClick, dayOfWeek }) => {
  const { reviews, holiday } = data;
  const hasReviews = reviews.length > 0;

  let bgClass = "";
  if (holiday && hasReviews) bgClass = "bg-info-subtle";
  else if (holiday) bgClass = "bg-danger-subtle";
  else if (hasReviews) bgClass = "bg-primary-subtle";

  return (
    <div
      onClick={() => onDateClick(day, data)}
      className={`col p-2 border rounded ${bgClass}`}
      style={{ minHeight: "120px", cursor: "pointer", transition: "all 0.2s" }}
    >
      <div
        className={`fw-bold small mb-1 ${dayOfWeek === 0 || holiday ? "text-danger" : dayOfWeek === 6 ? "text-primary" : "text-dark"}`}
      >
        {day}
      </div>
      {holiday && (
        <div className="badge text-bg-danger text-wrap w-100 mb-1">
          {holiday.name}
        </div>
      )}
      {hasReviews &&
        reviews.slice(0, holiday ? 1 : 2).map((review) => (
          <div
            key={review.id}
            className="badge text-bg-primary text-wrap w-100 mb-1"
          >
            {review.placeName}
          </div>
        ))}
      {reviews.length > (holiday ? 1 : 2) && (
        <div className="small text-primary text-center mt-1">
          +{reviews.length - (holiday ? 1 : 2)} more
        </div>
      )}
    </div>
  );
};
