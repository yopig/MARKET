import { useNavigate } from "react-router-dom";
import { Carousel, Col, Row, Button } from "react-bootstrap";
import { useContext } from "react";
import { AuthenticationContext } from "../../common/AuthenticationContextProvider.jsx";

import img1 from "../../assets/event1.jpg";
import img2 from "../../assets/event2.jpg";
import img3 from "../../assets/event3.jpg";
import { BoardListMini } from "./BoardListMini.jsx";
import { ReviewList } from "../review/ReviewList.jsx";  // 리뷰 리스트 임포트 추가

export function BoardLayout() {
  const navigate = useNavigate();
  const { isAdmin } = useContext(AuthenticationContext);

  const slides = [
    { id: 17, img: img1, title: "유기견 입양 안내" },
    { id: 18, img: img2, title: "길고양이" },
    { id: 19, img: img3, title: "특이한 반려동물" },
  ];

  return (
    <div className="container mt-5">
      <Row className="align-items-center">
        <Col xs={12} md={12}>
          <Carousel style={{ maxWidth: "1280px", margin: "0 auto" }}>
            {slides.map(({ id, img, title }, idx) => (
              <Carousel.Item
                key={id}
                onClick={() => {
                  if (id === 19) {
                    window.open("https://www.youtube.com/watch?v=0dQBxYc_8ZM", "_blank");
                  } else {
                    navigate(`/board/${id}`);
                  }
                }}
                style={{ cursor: "pointer", position: "relative" }}
              >
                <img
                  className="d-block w-100"
                  src={img}
                  alt={`${idx + 1}번째 슬라이드`}
                  loading="lazy"
                  style={{
                    width: "100%",
                    height: "420px",
                    objectFit: "cover",
                    objectPosition: "center center",
                  }}
                />
                <div
                  style={{
                    position: "absolute",
                    bottom: 0,
                    left: 0,
                    width: "100%",
                    height: "80px",
                    backgroundColor: "rgba(0, 0, 0, 0.3)",
                    color: "white",
                    padding: "10px 15px",
                    boxSizing: "border-box",
                    textAlign: "center",
                    borderRadius: "0 0 8px 8px",
                    lineHeight: 1.2,
                  }}
                >
                  <h6
                    style={{
                      margin: 0,
                      fontWeight: "bold",
                      fontSize: "1.25rem",
                      paddingTop: "4px",
                    }}
                  >
                    {title}
                  </h6>
                </div>
              </Carousel.Item>
            ))}
          </Carousel>
        </Col>
      </Row>

      {/* 공지사항과 리뷰 리스트를 반씩 나눠서 배치 */}
      <Row className="mt-4" style={{ maxHeight: "400px" }}>
        <Col md={6} style={{ overflowY: "auto" }}>
          <h5 style={{ fontSize: "1.5rem", fontWeight: "600" }}>공지사항</h5>
          <BoardListMini fontSize="1.25rem" iconSize={18} />
        </Col>

        <Col md={6} style={{ overflowY: "auto" }}>
          <h5 style={{ fontSize: "1.5rem", fontWeight: "600" }}>최신 리뷰</h5>
          <ReviewList />
        </Col>
      </Row>

      {/* 관리자 버튼 영역 */}
      {isAdmin() && (
        <Row className="mt-4">
          <Col className="d-flex justify-content-center gap-3">
            <Button
              variant="outline-warning"
              size="sm"
              onClick={() => navigate("/member/list")}
              style={{ minWidth: "120px" }}
            >
              회원목록 (관리자)
            </Button>
            <Button
              variant="outline-danger"
              size="sm"
              onClick={() => navigate("/support/list")}
              style={{ minWidth: "120px" }}
            >
              문의내역보기 (관리자)
            </Button>
          </Col>
        </Row>
      )}
    </div>
  );
}
