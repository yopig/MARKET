import React, { useEffect, useState } from "react";
import axios from "axios";
import { Card, Col, Image, Row, Spinner } from "react-bootstrap";
import { useNavigate } from "react-router-dom";

export function MyReview() {
  const [reviews, setReviews] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    axios
      .get("/api/review/myReview")
      .then((res) => setReviews(res.data))
      .catch((err) => {
        console.error("리뷰 불러오기 실패", err);
        setReviews([]);
      });
  }, []);

  const isImageFile = (url) =>
    /\.(jpg|jpeg|png|gif|webp)$/i.test(url?.split("?")[0]);
  const defaultProfileImage = "/user.png";

  if (!reviews) {
    return (
      <div className="text-center mt-5">
        <Spinner animation="border" />
      </div>
    );
  }

  if (reviews.length === 0) {
    return (
      <div className="text-center mt-5 text-muted">작성한 리뷰가 없습니다.</div>
    );
  }

  return (
    <Row className="justify-content-center mt-4">
      <Col xs={12} md={10} lg={8} style={{ maxWidth: "900px" }}>
        <h2 className="fw-bold mb-4">내가 쓴 리뷰</h2>
        <div className="d-flex flex-column gap-3">
          {reviews.map((r) => {
            const firstImage = r.files?.find(isImageFile) || null;

            return (
              <Card
                key={r.id}
                className="shadow-sm border-0 p-3"
                style={{ backgroundColor: "#fffdf7" }}
              >
                {/* 상단: 시설명 + 별점 */}
                <div className="d-flex justify-content-between align-items-center mb-2">
                  <div
                    className="fw-semibold hover-underline-on-hover"
                    style={{ color: "#5a3600", cursor: "pointer" }}
                    onClick={() =>
                      navigate(
                        `/facility/${encodeURIComponent(r.facilityName)}`,
                      )
                    }
                  >
                    {r.facilityName}
                  </div>
                  <div className="small d-flex align-items-center">
                    <span style={{ color: "#f0ad4e", fontSize: "1.1rem" }}>
                      {"★".repeat(r.rating)}
                    </span>
                    <span className="ms-2 text-dark fw-semibold">
                      {r.rating}
                    </span>
                  </div>
                </div>

                <hr className="mt-1 border-gray-300" />

                {/* 본문 + 이미지 */}
                <Row>
                  <Col xs={12} md={firstImage ? 8 : 12}>
                    <div style={{ whiteSpace: "pre-wrap" }}>{r.review}</div>
                  </Col>
                  {firstImage && (
                    <Col xs={12} md={4} className="mt-3 mt-md-0 text-end">
                      <Image
                        src={firstImage}
                        alt="리뷰 이미지"
                        className="rounded shadow"
                        style={{
                          width: "100px",
                          height: "100px",
                          objectFit: "cover",
                        }}
                      />
                    </Col>
                  )}
                </Row>

                {/* 하단: 날짜 + 프로필 */}
                <div
                  className="text-muted mt-3"
                  style={{ fontSize: "0.85rem" }}
                >
                  <Image
                    roundedCircle
                    className="me-2"
                    src={r.profileImageUrl || defaultProfileImage}
                    alt={`${r.memberEmailNickName ?? "익명"} 프로필`}
                    style={{
                      width: "24px",
                      height: "24px",
                      objectFit: "cover",
                    }}
                  />
                  {r.insertedAt?.split("T")[0]}
                </div>
              </Card>
            );
          })}
        </div>
      </Col>

      <style>{`
        .line-clamp {
          display: -webkit-box;
          -webkit-line-clamp: 3;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }
        .hover-underline-on-hover:hover {
          text-decoration: underline !important;
        }
      `}</style>
    </Row>
  );
}
