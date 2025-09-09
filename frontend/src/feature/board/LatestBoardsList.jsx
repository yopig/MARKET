// src/feature/board/LatestBoardsList.jsx
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Badge,
  Button,
  Card,
  Col,
  Container,
  Form,
  Row,
} from "react-bootstrap";
import axios from "axios";
import "../../styles/LatestBoardsList.css";
export function LatestBoardsList() {
  const [boards, setBoards] = useState(null);
  const [displayCount, setDisplayCount] = useState(12);
  const [keyword, setKeyword] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    // 최신 게시글 목록 1페이지(10개) 불러오기
    axios
      .get("/api/board/list", { params: { q: "", p: 1 } })
      .then((res) => {
        const list = res?.data?.boardList ?? [];
        setBoards(list);
      })
      .catch(() => setBoards([]));
  }, []);

  const filteredBoards =
    boards?.filter((b) => {
      const q = keyword.trim().toLowerCase();
      if (!q) return true;
      const hay = `${b.title ?? ""} ${b.content ?? ""}`.toLowerCase();
      return hay.includes(q);
    }) || [];

  // 로딩
  if (boards === null) {
    return (
      <Container className="latest-boards-container">
        <div className="loading-brutal">
          <div className="loading-pet-brutal">📦🐾</div>
          <p className="loading-text-brutal">게시글을 불러오는 중...</p>
        </div>
      </Container>
    );
  }

  // 빈 상태
  if (filteredBoards.length === 0) {
    return (
      <div className="latest-boards-container">
        <div className="boards-header">
          <h2 className="boards-title">🗂️ 최신 게시글</h2>
          <p className="boards-subtitle">방금 올라온 실시간 게시글을 확인하세요</p>
          <Form className="search-form-brutal">
            <Form.Control
              type="text"
              placeholder="제목/내용으로 검색"
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              className="search-input-brutal"
            />
          </Form>
        </div>
        <div className="empty-state-brutal">
          <h3>😔 검색 결과가 없습니다</h3>
          <p>다른 키워드로 검색해보거나 검색어를 지워보세요.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="latest-boards-container">
      {/* 페이지 헤더 */}
      <div className="boards-header">
        <h2 className="boards-title">🗂️ 최신 게시글</h2>
        <p className="boards-subtitle">방금 올라온 실시간 게시글을 확인하세요</p>
        <span className="boards-count">{filteredBoards.length}개</span>
        <Form className="search-form-brutal">
          <Form.Control
            type="text"
            placeholder="제목/내용으로 검색"
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            className="search-input-brutal"
          />
        </Form>
      </div>

      {/* 게시글 그리드 */}
      <div className="boards-grid-container mx-5">
        <Row className="g-3">
          {filteredBoards.slice(0, displayCount).map((b) => {
            const thumb = b.thumbnailUrl || b.firstImageUrl || null;

            return (
              <Col key={b.id} xs={6} sm={6} md={4} lg={3} xl={2}>
                <Card
                  className="board-card-brutal position-relative"
                  onClick={() => navigate(`/board/${b.id}`)}
                >
                  <Card.Body className="board-card-body">
                    {/* 제목 */}
                    <div className="board-title-brutal">{b.title ?? "(제목 없음)"}</div>

                    {/* 썸네일 (리뷰의 이미지 영역 대체) */}
                    {thumb && (
                      <Card.Img
                        variant="top"
                        src={thumb}
                        alt={b.title}
                        style={{
                          objectFit: "cover",
                          height: "120px",
                          marginBottom: "8px",
                          borderRadius: "0",
                        }}
                        onError={(e) => (e.currentTarget.style.display = "none")}
                      />
                    )}

                    {/* 본문 일부(있으면) */}
                    {b.content && (
                      <div className="board-text-brutal">
                        {b.content}
                      </div>
                    )}

                    {/* 메타: 카테고리/가격/지역/상태 */}
                    <div className="board-submeta-brutal">
                      {b.category && (
                        <Badge className="board-chip-brutal">#{b.category}</Badge>
                      )}
                      {typeof b.price === "number" && (
                        <Badge className="board-chip-brutal">
                          {b.price.toLocaleString()}원
                        </Badge>
                      )}
                      {(b.regionSido || b.regionSigungu) && (
                        <Badge className="board-chip-brutal">
                          📍 {b.regionSido ?? ""} {b.regionSigungu ?? ""}
                        </Badge>
                      )}
                      {b.tradeStatus && (
                        <Badge className="board-badge-brutal">{b.tradeStatus}</Badge>
                      )}
                    </div>
                  </Card.Body>
                </Card>
              </Col>
            );
          })}
        </Row>
      </div>

      {/* 더보기 버튼 */}
      {filteredBoards.length > displayCount && (
        <div className="load-more-section mb-5">
          <Button
            onClick={() =>
              setDisplayCount((prev) => Math.min(prev + 12, filteredBoards.length))
            }
            className="load-more-brutal"
          >
            더 많은 게시글 보기
            <small>({filteredBoards.length - displayCount}개 남음)</small>
          </Button>
        </div>
      )}
    </div>
  );
}
