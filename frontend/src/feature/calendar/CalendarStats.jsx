import React from "react";

export const CalendarStats = ({ reviews, currentDate }) => {
  // 해당 월의 리뷰들만 가져와서 당연히 평균 평점도 해당 달의 평균으로 계산 됨
  const totalRating = reviews.reduce((sum, review) => sum + review.rating, 0);
  const averageRating =
    reviews.length > 0 ? (totalRating / reviews.length).toFixed(1) : 0;

  const currentMonthReviews = reviews.filter((r) =>
    r.date.startsWith(
      `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, "0")}`,
    ),
  );

  return (
    <>
      <h5 className="card-title fs-6 fw-semibold text-muted">📊 이달의 활동</h5>
      <p className="card-text">
        작성한 리뷰:{" "}
        <span className="fw-bold">{currentMonthReviews.length}개</span>
      </p>
      <p className="card-text">
        평균 평점: <span className="fw-bold">{averageRating}점</span>
      </p>
    </>
  );
};
