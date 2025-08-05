import { Alert, Spinner, Table, Badge } from "react-bootstrap";
import { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { FaRegImages, FaRegComments } from "react-icons/fa";

export function ReviewPreview() {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    setLoading(true);
    setError(null);

    axios
      .get("/api/review/latest")
      .then((res) => setReviews(res.data))
      .catch(() => {
        setError("리뷰를 불러오는 중 오류가 발생했습니다.");
      })
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

  if (reviews.length === 0) {
    return <p className="text-muted mt-2 small">작성된 리뷰가 없습니다.</p>;
  }

  return (
    <Table
      hover
      responsive
      size="sm"
      className="align-middle text-secondary"
      style={{ fontSize: "1.2rem", tableLayout: "fixed" }}
    >
      <thead>
      <tr className="text-muted" style={{ height: "45px" }}>
        <th style={{ width: "50px" }}>#</th>
        <th>시설명</th>
        <th>제목</th>
        <th style={{ width: "100px" }}>작성자</th>
        <th style={{ width: "120px" }}>작성일</th>
      </tr>
      </thead>
      <tbody>
      {reviews.map((review) => (
        <tr
          key={review.id}
          onClick={() => navigate(`/review/${review.id}`)}
          style={{ cursor: "pointer", height: "55px" }}
        >
          <td className="text-muted">{review.id}</td>
          <td className="text-muted text-truncate">{review.facilityName}</td>
          <td className="text-dark">
            <div className="d-flex gap-2 align-items-center">
                <span
                  style={{
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                    display: "inline-block",
                    maxWidth: "100%",
                  }}
                >
                  {review.title}
                </span>
              {review.fileCount > 0 && (
                <Badge bg="info" text="white">
                  <div className="d-flex gap-1">
                    <FaRegImages />
                    <span>{review.fileCount}</span>
                  </div>
                </Badge>
              )}
            </div>
          </td>
          <td className="text-truncate text-muted">{review.nickName}</td>
          <td className="text-muted">{review.timesAgo}</td>

        </tr>
      ))}
      </tbody>
    </Table>
  );
}
