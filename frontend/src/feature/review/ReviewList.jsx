import { Alert, Spinner, Table } from "react-bootstrap";
import { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router";
import { FaStar } from "react-icons/fa";

export function ReviewList() {
  const [reviewList, setReviewList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    setLoading(true);
    setError(null);

    axios
      .get("/api/review/latest")
      .then((res) => setReviewList(res.data))
      .catch(() => setError("리뷰를 불러오는 중 오류가 발생했습니다."))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="text-center my-3 text-secondary small">
        <Spinner animation="border" size="sm" /> 불러오는 중...
      </div>
    );
  }

  if (error) {
    return (
      <Alert variant="danger" className="my-3 py-2 px-3 small">
        {error}
      </Alert>
    );
  }

  if (reviewList.length === 0) {
    return <p className="text-muted mt-2 small">작성된 리뷰가 없습니다.</p>;
  }

  // 최신 3개 리뷰만 사용
  const top3Reviews = reviewList.slice(0, 3);

  // 별점에 따라 ★ 아이콘 여러 개 표시 함수
  const renderStars = (rating) => {
    const stars = [];
    for (let i = 0; i < 5; i++) {
      stars.push(
        <FaStar key={i} color={i < rating ? "#ffc107" : "#e4e5e9"} />
      );
    }
    return stars;
  };

  return (
    <Table
      hover
      responsive
      size="sm"
      className="align-middle text-secondary"
      style={{ fontSize: "1rem", tableLayout: "fixed" }} // 글씨 크기 살짝 줄임
    >
      <thead>
      <tr className="text-muted" style={{ height: "40px", fontSize: "0.9rem" }}>
        <th style={{ width: "100px" }}>별점</th>
        <th>리뷰</th>
        <th style={{ width: "120px" }}>장소</th>
        <th style={{ width: "100px" }}>작성자</th>
      </tr>
      </thead>
      <tbody>
      {top3Reviews.map((review) => (
        <tr
          key={review.id}
          onClick={() => navigate(`/facility/${encodeURIComponent(review.facilityName)}`)}
          style={{ cursor: "pointer", height: "50px" }}
        >
          <td className="text-warning fw-bold" style={{ fontSize: "1rem" }}>
            {renderStars(review.rating)}
          </td>
          <td
            className="text-dark"
            style={{
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
              fontSize: "0.95rem",
            }}
          >
            {review.review}
          </td>
          <td className="text-muted" style={{ fontSize: "0.9rem" }}>
            {review.facilityName}
          </td>
          <td className="text-muted" style={{ fontSize: "0.9rem" }}>
            {review.memberEmailNickName}
          </td>
        </tr>
      ))}
      </tbody>
    </Table>
  );
}
