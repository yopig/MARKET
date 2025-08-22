import React from "react";
import { Row, Col, Card, Badge, Button } from "react-bootstrap";
import { useNavigate } from "react-router-dom";
import "../styles/about.css";

export function About() {
  const navigate = useNavigate();

  const features = [
    {
      icon: "bi-geo-alt-fill",
      color: "primary",
      title: "정확한 위치 정보",
      description: "공공데이터 기반의 신뢰할 수 있는 시설 정보와 카카오맵 연동",
    },
    {
      icon: "bi-funnel-fill",
      color: "success",
      title: "스마트 필터링",
      description: "반려동물 크기, 지역, 주차 가능 여부 등 세세한 조건 검색",
    },
    {
      icon: "bi-chat-heart-fill",
      color: "info",
      title: "진솔한 리뷰",
      description: "실제 방문 경험을 바탕으로 한 솔직한 후기와 사진 공유",
    },
  ];

  return (
    <div style={{ maxWidth: "100%", margin: "0 auto" }}>
      {/* Hero 섹션 */}
      <div className="about-hero">
        <h1 className="display-4 fw-bold mb-3">
          반려동물과 함께하는
          <br />
          <span className="text-primary">특별한 하루</span>
        </h1>
        <p className="lead mb-4">
          우리 아이와 함께 갈 수 있는 모든 곳을 한눈에!<br />
          공공데이터 기반의 신뢰할 수 있는 정보로 안전하고 즐거운 나들이를
          계획하세요.
        </p>
        <Button
          variant="light"
          size="lg"
          className="fw-bold"
          onClick={() => navigate("/Kakaomap")}
        >
          <i className="bi bi-map me-2"></i>
          지금 찾아보기
        </Button>
      </div>

      {/* 주요 기능 소개 */}
      <div className="about-features mb-5">
        <div className="text-center mb-4">
          <h3 className="fw-bold mb-3">
            <span className="text-primary">PETOPIA</span>가 특별한 이유
          </h3>
          <p className="text-muted">
            공공데이터와 실제 경험이 만나 더욱 신뢰할 수 있는 정보를 제공합니다
          </p>
        </div>

        <Row className="g-4">
          {features.map((feature, idx) => (
            <Col lg={4} key={idx}>
              <Card className="h-100 text-center">
                <Card.Body className="p-4">
                  <div
                    className={`feature-icon bg-${feature.color} bg-opacity-10 mb-3`}
                  >
                    <i className={`bi ${feature.icon} text-${feature.color} fs-4`}></i>
                  </div>
                  <h5 className="fw-bold mb-3">{feature.title}</h5>
                  <p className="text-muted mb-0">{feature.description}</p>
                </Card.Body>
              </Card>
            </Col>
          ))}
        </Row>
      </div>

      {/* 3단계 사용법 */}
      <div className="about-steps mb-5 text-center">
        <h4 className="fw-bold mb-4">
          간단한 <span className="text-primary">3단계</span>로 시작하기
        </h4>
        <Row className="g-4 justify-content-center">
          {[
            { step: 1, title: "검색하기", icon: "bi-search", color: "primary", desc: "지역, 카테고리, 반려동물 크기 등 원하는 조건으로 검색" },
            { step: 2, title: "위치 확인", icon: "bi-map", color: "success", desc: "지도에서 정확한 위치를 확인하고 길찾기로 바로 출발" },
            { step: 3, title: "즐기기", icon: "bi-heart", color: "warning", desc: "우리 아이와 함께 즐거운 시간을 보내고 후기를 남겨주세요" },
          ].map((item, idx) => (
            <Col md={4} className="text-center" key={idx}>
              <div className={`step-circle bg-${item.color} mb-3 d-inline-flex align-items-center justify-content-center text-white fw-bold`}>
                {item.step}
              </div>
              <h6 className="fw-bold mb-2">
                <i className={`bi ${item.icon} text-${item.color} me-2`}></i>
                {item.title}
              </h6>
              <p className="text-muted small">{item.desc}</p>
            </Col>
          ))}
        </Row>
      </div>
    </div>
  );
}
