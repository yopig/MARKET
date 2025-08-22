import React from "react";

const ReviewStatsCard = ({ reviews, averageRating }) => {
  if (!reviews || reviews.length === 0) return null;

  const getRatingDistribution = () => {
    const distribution = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
    reviews.forEach((review) => {
      distribution[review.rating]++;
    });
    return distribution;
  };

  const distribution = getRatingDistribution();
  const totalReviews = reviews.length;

  const RatingBar = ({ rating, count }) => {
    const percentage = totalReviews > 0 ? (count / totalReviews) * 100 : 0;

    return (
      <div className="d-flex align-items-center mb-2">
        <div className="d-flex align-items-center" style={{ width: "60px" }}>
          <span className="text-muted fw-bold me-2">{rating}</span>
          <span className="text-warning">★</span>
        </div>
        <div className="flex-grow-1 mx-3">
          <div className="progress" style={{ height: "8px" }}>
            <div
              className="progress-bar bg-warning"
              role="progressbar"
              style={{ width: `${percentage}%` }}
              aria-valuenow={percentage}
              aria-valuemin={0}
              aria-valuemax={100}
            ></div>
          </div>
        </div>
        <span className="text-muted fw-bold" style={{ width: "30px" }}>
          {count}
        </span>
      </div>
    );
  };

  return (
    <div className="card border-0 shadow mb-4">
      <div className="card-header bg-warning text-dark">
        <div className="d-flex align-items-center">
          <i className="bi bi-star-fill me-3 fs-4"></i>
          <div>
            <h5 className="card-title mb-0">평점 통계</h5>
            <small className="opacity-75">Rating Statistics</small>
          </div>
        </div>
      </div>

      <div className="card-body p-4">
        <div className="row align-items-center">
          <div className="col-md-4 text-center mb-3 mb-md-0">
            <div className="mb-3">
              <span className="display-4 fw-bold text-warning">
                {averageRating}
              </span>
              <span className="fs-4 text-muted">/5</span>
            </div>
            <div className="mb-2">
              <span className="text-warning fs-3">
                {"★".repeat(Math.round(averageRating))}
                {"☆".repeat(5 - Math.round(averageRating))}
              </span>
            </div>
            <div className="text-muted fw-bold">총 {totalReviews}개의 리뷰</div>
          </div>

          <div className="col-md-8">
            <h6 className="fw-bold mb-3">
              <i className="bi bi-bar-chart-fill me-2 text-warning"></i>
              평점 분포
            </h6>
            <div>
              {[5, 4, 3, 2, 1].map((rating) => (
                <RatingBar
                  key={rating}
                  rating={rating}
                  count={distribution[rating]}
                />
              ))}
            </div>
          </div>
        </div>

        <hr className="my-4" />

        <div className="row text-center">
          <div className="col-4">
            <div className="fw-bold text-success fs-5">
              {distribution[5] + distribution[4]}
            </div>
            <small className="text-muted">긍정적 리뷰</small>
            <div className="progress mt-2" style={{ height: "4px" }}>
              <div
                className="progress-bar bg-success"
                style={{
                  width: `${((distribution[5] + distribution[4]) / totalReviews) * 100}%`,
                }}
              ></div>
            </div>
          </div>
          <div className="col-4">
            <div className="fw-bold text-warning fs-5">{distribution[3]}</div>
            <small className="text-muted">보통 리뷰</small>
            <div className="progress mt-2" style={{ height: "4px" }}>
              <div
                className="progress-bar bg-warning"
                style={{ width: `${(distribution[3] / totalReviews) * 100}%` }}
              ></div>
            </div>
          </div>
          <div className="col-4">
            <div className="fw-bold text-danger fs-5">
              {distribution[2] + distribution[1]}
            </div>
            <small className="text-muted">부정적 리뷰</small>
            <div className="progress mt-2" style={{ height: "4px" }}>
              <div
                className="progress-bar bg-danger"
                style={{
                  width: `${((distribution[2] + distribution[1]) / totalReviews) * 100}%`,
                }}
              ></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReviewStatsCard;
