import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Carousel, Col, Row } from "react-bootstrap";
import axios from "axios";
import { BoardListMini } from "../main/BoardListMini.jsx";
import { ReviewCarousel } from "../main/ReviewCarousel.jsx";
import "../../styles/BoardLayout.css";

const sitelogo1 = "/sitelogo1.png";
const sitelogo2 = "/sitelogo2.png";
const sitelogo3 = "/sitelogo3.png";
const sitelogo4 = "/sitelogo4.png";

export function BoardLayout() {
  const navigate = useNavigate();
  const [slides, setSlides] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    axios
      .get("/api/board/latest3") // 백엔드 최신 3개 게시글 API
      .then((res) => {
        // console.log("원본 데이터:", res.data); // 디버깅용

        // 각 게시글의 firstImageUrl 확인
        // res.data.forEach((slide, index) => {
        // console.log(`게시글 ${slide.id} (인덱스 ${index}):`, {
        //   title: slide.title,
        //   firstImageUrl: slide.firstImageUrl,
        //   hasImage: !!slide.firstImageUrl,
        //   isEmptyString: slide.firstImageUrl === "",
        //   type: typeof slide.firstImageUrl,
        // });
        // });

        // 이미지가 있는 게시글만 필터링
        const slidesWithImages = res.data.filter((slide) => {
          const hasValidImage =
            slide.firstImageUrl &&
            slide.firstImageUrl.trim() !== "" &&
            slide.firstImageUrl !== "null" &&
            slide.firstImageUrl !== "undefined";

          // console.log(`게시글 ${slide.id} 필터링 결과:`, hasValidImage);
          return hasValidImage;
        });

        // console.log("필터링된 데이터:", slidesWithImages);
        setSlides(slidesWithImages);
        setLoading(false);
      })
      .catch(() => {
        // console.error("최신 게시글 로딩 실패", err);
        setLoading(false);
      });
  }, []);

  if (loading) {
    return (
      <div style={{ padding: "2rem", textAlign: "center" }}>
        최신 게시글 로딩 중...
      </div>
    );
  }

  if (slides.length === 0) {
    return (
      <div style={{ padding: "2rem", textAlign: "center" }}>
        이미지가 있는 최신 게시글이 없습니다.
      </div>
    );
  }

  return (
    <div>
      {/* 캐러셀 */}
      <Row className="align-items-center">
        <Col xs={12} md={12}>
          <Carousel
            style={{
              maxWidth: "auto",
              margin: "0 auto",
              borderBottom: "1px solid black",
            }}
          >
            {slides.map(({ id, title, firstImageUrl }, idx) => (
              <Carousel.Item
                key={id}
                onClick={() => navigate(`/board/${id}`)}
                style={{ cursor: "pointer", position: "relative" }}
              >
                <img
                  className="d-block w-100"
                  src={firstImageUrl}
                  alt={`${title} (${idx + 1}번째 슬라이드)`}
                  loading="lazy"
                  onError={(e) => {
                    // 이미지 로드 실패시 기본 이미지로 대체
                    e.target.src = "/images/default-placeholder.jpg";
                  }}
                  style={{
                    width: "100%",
                    height: "450px",
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

      {/* 공지사항과 리뷰 */}
      <div className="container">
        <Row className="mt-3">
          <Col md={6} className="mb-3 mb-md-0">
            <h5 style={{ fontSize: "2rem", fontWeight: "600" }}>공지사항</h5>
            <BoardListMini />
          </Col>

          <Col md={6}>
            <ReviewCarousel />
          </Col>
        </Row>
        <div className="py-3" />
      </div>

      {/* CTA 섹션 */}
      <div className="cta-section">
        <div className="cta-content">
          <h4 className="cta-title">
            <i className="bi bi-rocket-takeoff" />
            지금 바로 시작해보세요!
          </h4>
          <p className="cta-description">
            우리 아이와 함께 할 수 있는 특별한 장소들이 여러분을 기다리고
            있습니다.
          </p>
          <div className="d-flex justify-content-evenly">
            <img
              src={sitelogo1}
              alt=""
              style={{
                width: "200px",
                height: "60px",
                objectFit: "contain",
              }}
            />
            <img
              src={sitelogo2}
              alt=""
              style={{
                width: "200px",
                height: "60px",
                objectFit: "contain",
              }}
            />
            <img
              src={sitelogo3}
              alt=""
              style={{
                width: "200px",
                height: "60px",
                objectFit: "contain",
              }}
            />
            <img
              src={sitelogo4}
              alt=""
              style={{
                width: "200px",
                height: "60px",
                objectFit: "contain",
              }}
            />
          </div>

          {/*<div className="cta-buttons">*/}
          {/*  <button*/}
          {/*    className="cta-button primary"*/}
          {/*    onClick={() => navigate("/map")}*/}
          {/*  >*/}
          {/*    <i className="bi bi-geo-alt-fill me-2" />내 주변 찾기*/}
          {/*  </button>*/}
          {/*  <button*/}
          {/*    className="cta-button secondary"*/}
          {/*    onClick={() => navigate("/register")}*/}
          {/*  >*/}
          {/*    <i className="bi bi-person-plus me-2" />*/}
          {/*    회원가입하기*/}
          {/*  </button>*/}
          {/*</div>*/}
        </div>
      </div>
    </div>
  );
}
