// src/feature/board/BoardLayout.jsx  (FULL REPLACE)
import React, { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Col, Row, Container, Button, Card, Spinner } from "react-bootstrap";
import axios from "axios";
import "../../styles/BoardLayout.css";
import { FaEye } from "react-icons/fa";

/** 번개장터 모바일 감성 — 상단 칩 + 정사각 카드 그리드 + 무한스크롤 */
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

/** 서버 상태 문자열 유연 정규화 */
const normalizeTradeStatus = (raw) => {
  const s = String(raw || "").trim().toUpperCase();
  if (["SOLD_OUT", "SOLD", "SOLDOUT", "COMPLETED", "COMPLETE", "DONE"].includes(s)) return "SOLD_OUT";
  if (["RESERVED", "RESERVE", "HOLD"].includes(s)) return "RESERVED";
  if (["ON_SALE", "SALE", "SELLING", "AVAILABLE"].includes(s)) return "ON_SALE";
  return ""; // 알 수 없음
};

/** 가격 표시 */
const priceText = (v) => {
  if (typeof v === "number") return `${v.toLocaleString()}원`;
  if (v === 0) return "0원";
  if (v) return `${v}원`;
  return "가격문의";
};

/** 첫 이미지 선택 (url 배열 또는 필드들 혼합 대비) */
const pickThumb = (b) => {
  const exts = /\.(jpe?g|png|gif|webp|avif)$/i;
  const candidates = [
    b.thumbnailUrl,
    b.firstImageUrl,
    b.imageUrl,
    ...(Array.isArray(b.images) ? b.images : []),
    ...(Array.isArray(b.files) ? b.files : []),
  ].filter(Boolean);
  const found = candidates.find((u) => typeof u === "string" && exts.test(u));
  return found || null;
};

const PAGE_SIZE = 24; // 모바일 2열/데스크탑 5~6열 고려해서 여유

export function BoardLayout() {
  const navigate = useNavigate();

  // 목록/페이징
  const [boards, setBoards] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [category, setCategory] = useState("");

  // 무한스크롤 sentinel
  const sentinelRef = useRef(null);
  const observerRef = useRef(null);

  // 목록 불러오기
  const fetchPage = async ({ page = 1, append = false } = {}) => {
    try {
      if (append) setLoadingMore(true);
      else setLoading(true);

      const params = {
        p: page,
        size: PAGE_SIZE,
        category: category || undefined,
      };
      const { data } = await axios.get("/api/board/list", { params });

      const list = Array.isArray(data?.boardList) ? data.boardList : [];
      const pi = data?.pageInfo || {};
      setBoards((prev) => (append ? [...prev, ...list] : list));
      setPage(page);
      setTotalPages(pi.totalPages ?? 1);
    } catch (e) {
      if (!append) {
        setBoards([]);
        setTotalPages(1);
        setPage(1);
      }
    } finally {
      if (append) setLoadingMore(false);
      else setLoading(false);
    }
  };

  // 최초 & 카테고리 변경 시
  useEffect(() => {
    fetchPage({ page: 1, append: false });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [category]);

  // 무한스크롤 옵저버
  useEffect(() => {
    if (!sentinelRef.current) return;

    // 이전 옵저버 정리
    if (observerRef.current) observerRef.current.disconnect();

    observerRef.current = new IntersectionObserver(
      (entries) => {
        const first = entries[0];
        if (first && first.isIntersecting) {
          // 다음 페이지 로드
          if (!loading && !loadingMore && page < totalPages) {
            fetchPage({ page: page + 1, append: true });
          }
        }
      },
      { rootMargin: "400px 0px 400px 0px", threshold: 0 }
    );

    observerRef.current.observe(sentinelRef.current);
    return () => observerRef.current && observerRef.current.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sentinelRef.current, loading, loadingMore, page, totalPages, category]);

  const showEmpty = !loading && boards.length === 0;

  return (
    <div className="jn-root">

      {/* ====== HERO (심플한 번장 톤) ====== */}
      <section className="jn-hero">
        <Container>
          <h1 className="jn-hero-title">
            <span className="highlight">중고거래</span> 마켓
          </h1>
          <p className="jn-hero-sub">
            <span className="tagline">가깝고 안전한 동네 거래</span>를 시작하세요
          </p>

          {/* 카테고리 칩: 가로 스크롤 + sticky 느낌 */}
          <div className="jn-cats">
            <button
              type="button"
              className={`jn-chip ${category === "" ? "active" : ""}`}
              onClick={() => setCategory("")}
              aria-pressed={category === ""}
            >
              전체
            </button>
            {CATEGORIES.map((c) => (
              <button
                key={c}
                type="button"
                className={`jn-chip ${category === c ? "active" : ""}`}
                onClick={() => setCategory(c)}
                aria-pressed={category === c}
              >
                {c}
              </button>
            ))}
          </div>
        </Container>
      </section>

      {/* ====== GRID ====== */}
      <section className="jn-grid">
        <Container>
          {loading ? (
            <div className="jn-loading d-flex align-items-center justify-content-center py-5">
              <Spinner animation="border" />
              <span className="ms-2">불러오는 중…</span>
            </div>
          ) : showEmpty ? (
            <div className="jn-empty text-center py-5">
              조건에 맞는 게시글이 없습니다.
            </div>
          ) : (
            <>
              <Row className="g-2 g-sm-3">
                {boards.map((b) => {
                  const thumb = pickThumb(b);
                  const st = normalizeTradeStatus(b.tradeStatus);

                  const badgeClass =
                    st === "SOLD_OUT" ? "sold" :
                      st === "RESERVED" ? "reserved" :
                        st === "ON_SALE" ? "onsale" : "";

                  const badgeText =
                    st === "SOLD_OUT" ? "판매완료" :
                      st === "RESERVED" ? "예약중" :
                        st === "ON_SALE" ? "판매중" : "";

                  return (
                    <Col key={b.id} xs={6} sm={4} md={3} lg={2}>
                      <Card
                        className="jn-card"
                        role="button"
                        onClick={() => navigate(`/board/${b.id}`)}
                        data-status={st}
                        data-sold={st === "SOLD_OUT"}
                        aria-label={`${b.title ?? "게시글"} 상세 보기`}
                      >
                        <div className="jn-thumb">
                          {thumb ? (
                            <img
                              src={thumb}
                              alt={b.title || "상품 이미지"}
                              loading="lazy"
                              onError={(e) => {
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
                          <div className="jn-title two-line" title={b.title}>
                            {b.title ?? "(제목 없음)"}
                          </div>
                          <div className="jn-price">{priceText(b.price)}</div>

                          <div className="jn-meta">
                            <span className="jn-loc">
                              {(b.regionSido ?? "") + (b.regionSigungu ? ` ${b.regionSigungu}` : "")}
                            </span>
                            <span className="jn-counts">
                              <FaEye size={12} className="me-1" />
                              {b.viewCount ?? 0}
                            </span>
                          </div>
                        </Card.Body>
                      </Card>
                    </Col>
                  );
                })}
              </Row>

              {/* 무한스크롤 sentinel */}
              {(page < totalPages || loadingMore) && (
                <div ref={sentinelRef} className="d-flex justify-content-center py-3">
                  {loadingMore && (
                    <div className="d-flex align-items-center">
                      <Spinner animation="border" size="sm" />
                      <span className="ms-2 small text-muted">더 불러오는 중…</span>
                    </div>
                  )}
                </div>
              )}

              {/* 더보기 버튼 (옵저버 미지원/실패 대비) */}
              {page < totalPages && !loadingMore && (
                <div className="jn-more text-center">
                  <Button
                    className="jn-more-btn"
                    onClick={() => fetchPage({ page: page + 1, append: true })}
                  >
                    더 보기
                  </Button>
                </div>
              )}
            </>
          )}
        </Container>
      </section>
    </div>
  );
}
