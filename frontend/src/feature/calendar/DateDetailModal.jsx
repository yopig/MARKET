import React, { useState } from "react";
import { MapPin, Star } from "lucide-react";

export const DateDetailModal = ({ show, onClose, date, data }) => {
  if (!show || !data) return null;

  const MAX_LENGTH = 100; // 기본 표시 글자 수

  return (
    <div
      className="modal fade show"
      tabIndex="-1"
      style={{ display: "block", backgroundColor: "rgba(0,0,0,0.5)" }}
    >
      <div className="modal-dialog modal-dialog-centered modal-dialog-scrollable">
        <div className="modal-content">
          <div className="modal-header">
            <div>
              <h5 className="modal-title fw-bold">
                {date.getFullYear()}년 {date.getMonth() + 1}월 {data.day}일
              </h5>
              {data.holiday && (
                <div className="mt-1">
                  <span className="badge bg-danger">🎌 {data.holiday.name}</span>
                </div>
              )}
            </div>
            <button
              type="button"
              className="btn-close"
              onClick={onClose}
              aria-label="Close"
            />
          </div>
          <div className="modal-body">
            {data.holiday?.description && (
              <p className="alert alert-danger-subtle small">
                {data.holiday.description}
              </p>
            )}

            {data.reviews.length > 0 ? (
              <>
                <h6 className="mb-3 fw-semibold">📝 작성한 리뷰</h6>

                {data.reviews.map((review) => (
                  <ReviewCard key={review.id} review={review} maxLength={MAX_LENGTH} />
                ))}
              </>
            ) : (
              <div className="text-center p-5 text-muted">
                <p>이 날짜에 작성한 리뷰가 없습니다.</p>
              </div>
            )}
          </div>
          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={onClose}>
              닫기
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// 리뷰 카드 컴포넌트
const ReviewCard = ({ review, maxLength }) => {
  const [showFull, setShowFull] = useState(false);

  const isLong = review.content.length > maxLength;
  const displayedContent = showFull
    ? review.content
    : review.content.slice(0, maxLength) + (isLong ? "..." : "");

  return (
    <div className="card mb-3">
      <div className="card-body">
        <div className="d-flex justify-content-between align-items-start mb-2">
          <h6 className="card-title fw-bold mb-0">
            <MapPin size={14} /> {review.facilityName}
          </h6>
          <div className="d-flex gap-1">
            {Array(5)
              .fill(null)
              .map((_, i) => (
                <Star
                  key={i}
                  size={16}
                  fill={i < review.rating ? "#ffc107" : "#e9ecef"}
                  className={i < review.rating ? "text-warning" : "text-light"}
                />
              ))}
          </div>
        </div>
        <p className="card-text small">
          {displayedContent}{" "}
          {isLong && (
            <button
              className="btn btn-link btn-sm p-0"
              onClick={() => setShowFull(!showFull)}
              style={{ textDecoration: "none" }}
            >
              {showFull ? "접기" : "더보기"}
            </button>
          )}
        </p>
      </div>
    </div>
  );
};
