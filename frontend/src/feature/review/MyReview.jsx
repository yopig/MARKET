// src/feature/review/MyReview.jsx
import { useEffect, useMemo, useState } from "react";
import axios from "axios";
import { Badge, Button, Dropdown, ListGroup, Spinner } from "react-bootstrap";
import { toast } from "react-toastify";

/** 별점 렌더링 (1~5) */
function Stars({ rating = 0 }) {
  const r = Math.max(0, Math.min(5, Number(rating) || 0));
  return (
    <span aria-label={`별점 ${r} / 5`} title={`${r}/5`}>
      {"★".repeat(r)}
      <span style={{ opacity: 0.25 }}>{"★".repeat(5 - r)}</span>
    </span>
  );
}

/** 태그 배지 */
function TagChips({ tags = [] }) {
  if (!tags || tags.length === 0) return null;
  return (
    <div className="d-flex flex-wrap gap-1 mt-2">
      {tags.map((t, idx) => (
        <Badge key={`${t}-${idx}`} bg="light" text="dark" className="border">
          #{t}
        </Badge>
      ))}
    </div>
  );
}

/** 정렬 옵션 */
const SORT_OPTIONS = [
  { key: "insertedAt,desc", label: "최신순" },
  { key: "insertedAt,asc", label: "오래된순" },
  { key: "rating,desc", label: "평점 높은순" },
  { key: "rating,asc", label: "평점 낮은순" },
];

/**
 * 받은 후기 목록 (publicOnly)
 * props:
 *  - memberId: Long (필수) — 이 회원이 ‘받은 후기’ 노출
 */
export function MyReview({ memberId }) {
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0); // 0-based
  const [size, setSize] = useState(10);
  const [sort, setSort] = useState("insertedAt,desc");
  const [content, setContent] = useState({
    content: [],
    totalElements: 0,
    totalPages: 0,
    number: 0,
    size: 10,
  });

  const totalPages = content?.totalPages || 0;
  const canPrev = page > 0;
  const canNext = page < Math.max(0, totalPages - 1);

  useEffect(() => {
    if (!memberId) return;
    let alive = true;
    setLoading(true);

    axios
      .get(`/api/reviews/member/${memberId}`, {
        params: {
          publicOnly: true,
          page,
          size,
          sort,
        },
      })
      .then((res) => {
        if (!alive) return;
        setContent(res.data || {});
      })
      .catch((err) => {
        console.error(err);
        const msg =
          err.response?.data?.message ||
          err.response?.data?.error ||
          `후기 조회 실패 (HTTP ${err.response?.status ?? "?"})`;
        toast.error(msg);
        setContent({
          content: [],
          totalElements: 0,
          totalPages: 0,
          number: page,
          size,
        });
      })
      .finally(() => alive && setLoading(false));

    return () => {
      alive = false;
    };
  }, [memberId, page, size, sort]);

  const summary = useMemo(() => {
    const items = Array.isArray(content?.content) ? content.content : [];
    const count = content?.totalElements || items.length || 0;
    // 가벼운 평균 계산 (페이지 아이템 기반이 아닌 총평균이 필요하면 서버에서 제공)
    const avg =
      items.length > 0
        ? (items.reduce((s, it) => s + (Number(it.rating) || 0), 0) / items.length).toFixed(1)
        : "-";
    return { count, avg };
  }, [content]);

  return (
    <div className="brutal-card">
      <div className="d-flex justify-content-between align-items-center mb-2">
        <h5 className="m-0">⭐ 받은 후기</h5>
        <div className="d-flex align-items-center gap-2">
          <Dropdown onSelect={(k) => k && setSort(k)}>
            <Dropdown.Toggle size="sm" variant="outline-dark">
              정렬: {SORT_OPTIONS.find((o) => o.key === sort)?.label || "최신순"}
            </Dropdown.Toggle>
            <Dropdown.Menu>
              {SORT_OPTIONS.map((o) => (
                <Dropdown.Item eventKey={o.key} key={o.key} active={o.key === sort}>
                  {o.label}
                </Dropdown.Item>
              ))}
            </Dropdown.Menu>
          </Dropdown>

          <Dropdown onSelect={(k) => setSize(Number(k))}>
            <Dropdown.Toggle size="sm" variant="outline-dark">
              {size}개씩
            </Dropdown.Toggle>
            <Dropdown.Menu>
              {[5, 10, 20].map((n) => (
                <Dropdown.Item key={n} eventKey={n} active={n === size}>
                  {n}개
                </Dropdown.Item>
              ))}
            </Dropdown.Menu>
          </Dropdown>

          <div className="small text-muted">
            {content?.number + 1}/{content?.totalPages || 1}
          </div>
          <Button size="sm" variant="outline-dark" onClick={() => setPage((p) => Math.max(0, p - 1))} disabled={!canPrev}>
            이전
          </Button>
          <Button
            size="sm"
            variant="dark"
            onClick={() => setPage((p) => Math.min(Math.max(0, totalPages - 1), p + 1))}
            disabled={!canNext}
          >
            다음
          </Button>
        </div>
      </div>

      {/* 요약 */}
      <div className="d-flex align-items-center gap-3 mb-3">
        <Badge bg="dark">총 {summary.count}개</Badge>
        <Badge bg="secondary">페이지 평균 {summary.avg}</Badge>
      </div>

      {loading ? (
        <div className="d-flex justify-content-center my-4">
          <Spinner animation="border" role="status" />
        </div>
      ) : Array.isArray(content?.content) && content.content.length > 0 ? (
        <ListGroup>
          {content.content.map((r) => (
            <ListGroup.Item key={r.id} className="d-flex flex-column gap-1">
              <div className="d-flex justify-content-between align-items-start">
                <div className="d-flex flex-column">
                  <div className="d-flex align-items-center gap-2">
                    <Stars rating={r.rating} />
                    <strong>{r.reviewerNickname || `작성자 #${r.reviewerId}`}</strong>
                    {r.revieweeRole && (
                      <Badge bg="light" text="dark" className="border">
                        {r.revieweeRole === "SELLER" ? "판매자 후기" : "구매자 후기"}
                      </Badge>
                    )}
                    {r.isPublic === false && (
                      <Badge bg="warning" text="dark">
                        비공개
                      </Badge>
                    )}
                  </div>
                  <div className="text-muted small">{r.insertedAt?.replace("T", " ").slice(0, 16)}</div>
                </div>

                {/* 게시글 이동 */}
                {r.boardId && (
                  <Button
                    size="sm"
                    variant="outline-secondary"
                    onClick={() => (window.location.href = `/board/${r.boardId}`)}
                  >
                    게시글
                  </Button>
                )}
              </div>

              <div className="mt-2" style={{ whiteSpace: "pre-wrap" }}>
                {r.content}
              </div>

              <TagChips tags={r.tags} />
            </ListGroup.Item>
          ))}
        </ListGroup>
      ) : (
        <div className="text-muted">표시할 후기가 없습니다.</div>
      )}
    </div>
  );
}

export default MyReview;
