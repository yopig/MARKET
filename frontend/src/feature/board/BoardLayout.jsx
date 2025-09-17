// src/feature/board/BoardLayout.jsx  (FULL REPLACE)
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Col, Row, Container, Button, Card } from "react-bootstrap";
import axios from "axios";
import "../../styles/BoardLayout.css";
import { FaEye } from "react-icons/fa";

/** 조그나(중고나라)풍 카테고리 샘플 */
const CATEGORIES = [
  "디지털/가전",
  "가구/인테리어",
  "유아동",
  "생활/가공식품",
  "스포츠/레저",
  "여성의류",
  "남성의류",
  "게임/취미",
  "반려동물용품",
  "기타",
];

/** 서버에서 오는 상태 문자열을 흡수적으로 정규화 */
const normalizeTradeStatus = (raw) => {
  const s = String(raw || "").trim().toUpperCase();
  if (["SOLD_OUT", "SOLD", "SOLDOUT", "COMPLETED", "COMPLETE", "DONE"].includes(s)) return "SOLD_OUT";
  if (["RESERVED", "RESERVE", "HOLD"].includes(s)) return "RESERVED";
  if (["ON_SALE", "SALE", "SELLING", "AVAILABLE"].includes(s)) return "ON_SALE";
  return ""; // 알 수 없음
};

export function BoardLayout() {
  const navigate = useNavigate();

  // 목록 + 카테고리
  const [boards, setBoards] = useState([]);
  const [loadingBoards, setLoadingBoards] = useState(true);
  const [pageNumber, setPageNumber] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [category, setCategory] = useState("");

  // ───────── 목록 로딩 함수 ─────────
  const fetchBoards = async ({ page = 1, append = false } = {}) => {
    setLoadingBoards(true);
    try {
      const params = {
        p: page,
        category: category || undefined,
      };
      const { data } = await axios.get("/api/board/list", { params });
      const list = data?.boardList ?? [];
      const pageInfo = data?.pageInfo ?? {};
      setBoards((prev) => (append ? [...prev, ...list] : list));

      const totalPages = pageInfo?.totalPages ?? 1;
      setHasMore(page < totalPages);
      setPageNumber(page);
    } catch {
      setBoards((prev) => (append ? prev : []));
      setHasMore(false);
    } finally {
      setLoadingBoards(false);
    }
  };

  // 최초 로딩
  useEffect(() => {
    fetchBoards({ page: 1, append: false });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // 카테고리 변경 시 0.25초 디바운스 후 목록 새로 로드
  useEffect(() => {
    const t = setTimeout(() => {
      fetchBoards({ page: 1, append: false });
    }, 250);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [category]);

  return (
    <div className="jn-root">
      {/* ====== 히어로(검색·해시태그 제거) ====== */}
      <section className="jn-hero">
        <Container>
          <h1 className="jn-hero-title">
            <span className="highlight">중고거래</span> 마켓
          </h1>
          <p className="jn-hero-sub">
            <span className="tagline">가깝고 안전한 동네 거래</span>를 시작하세요
          </p>

          {/* 카테고리 칩 */}
          <div className="jn-cats">
            <button
              className={`jn-chip ${category === "" ? "active" : ""}`}
              onClick={() => setCategory("")}
            >
              전체
            </button>
            {CATEGORIES.map((c) => (
              <button
                key={c}
                className={`jn-chip ${category === c ? "active" : ""}`}
                onClick={() => setCategory(c)}
              >
                {c}
              </button>
            ))}
          </div>
        </Container>
      </section>

      {/* ====== 카드 그리드 ====== */}
      <section className="jn-grid">
        <Container>
          {loadingBoards ? (
            <div className="jn-loading">게시글을 불러오는 중…</div>
          ) : boards.length === 0 ? (
            <div className="jn-empty">조건에 맞는 게시글이 없습니다.</div>
          ) : (
            <Row className="g-3">
              {boards.map((b) => {
                const thumb = b.thumbnailUrl || b.firstImageUrl || null;
                const price =
                  typeof b.price === "number"
                    ? `${b.price.toLocaleString()}원`
                    : b.price
                      ? `${b.price}원`
                      : "가격문의";

                const st = normalizeTradeStatus(b.tradeStatus);
                const badgeClass =
                  st === "SOLD_OUT" ? "sold" :
                    st === "RESERVED" ? "reserved" :
                      st === "ON_SALE" ? "onsale" : null;

                const badgeText =
                  st === "ON_SALE" ? "판매중" :
                    st === "RESERVED" ? "예약중" :
                      st === "SOLD_OUT" ? "판매완료" : null;

                return (
                  <Col key={b.id} xs={6} sm={4} md={3} lg={2}>
                    <Card className="jn-card" onClick={() => navigate(`/board/${b.id}`)}>
                      <div className="jn-thumb">
                        {thumb ? (
                          <img
                            src={thumb}
                            alt={b.title}
                            loading="lazy"
                            onError={(e) => {
                              // 이미지 깨지면 숨기고 빈 썸네일 표시
                              e.currentTarget.style.display = "none";
                              const fallback = e.currentTarget.parentElement?.querySelector(".jn-thumb-empty");
                              if (fallback) fallback.style.display = "grid";
                            }}
                          />
                        ) : (
                          <div className="jn-thumb-empty">No Image</div>
                        )}

                        {badgeClass && (
                          <span className={`jn-badge ${badgeClass}`}>
                            {badgeText}
                          </span>
                        )}
                      </div>

                      <Card.Body className="jn-card-body">
                        {b.category && <div className="jn-cat">#{b.category}</div>}
                        <div className="jn-title" title={b.title}>
                          {b.title ?? "(제목 없음)"}
                        </div>
                        <div className="jn-price">{price}</div>
                        <div className="jn-meta">
                          <span className="jn-loc">
                            {b.regionSido ?? ""} {b.regionSigungu ?? ""}
                          </span>
                          <span className="jn-counts">
                            <FaEye size={12} className="me-1" /> {b.viewCount ?? 0}
                          </span>
                        </div>
                      </Card.Body>
                    </Card>
                  </Col>
                );
              })}
            </Row>
          )}

          {!loadingBoards && hasMore && (
            <div className="jn-more">
              <Button
                className="jn-more-btn"
                onClick={() => navigate("/board/list")}
              >
                더 많은 물건 보러가기
              </Button>
            </div>
          )}
        </Container>
      </section>
    </div>
  );
}
