import { useContext, useEffect, useMemo, useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import axios from "axios";
import {
  Badge,
  Button,
  Col,
  Form,
  ListGroup,
  Modal,
  Row,
  Spinner,
} from "react-bootstrap";
import { toast } from "react-toastify";
import { AuthenticationContext } from "../../common/AuthenticationContextProvider.jsx";

const formatDate = (v) => (v ? String(v).replace("T", " ").slice(0, 16) : "");
const clamp = (n, a, b) => Math.max(a, Math.min(b, n ?? a));

export function ReviewPage() {
  const { memberId: paramMemberId } = useParams();
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const revieweeId = Number(paramMemberId);
  const prefillBoardId = params.get("boardId") ? Number(params.get("boardId")) : null;

  const { me, hasAccess } = useContext(AuthenticationContext) || {};
  const myId = me?.id;

  const [stats, setStats] = useState({ avgRating: 0, count: 0 });
  const [profile, setProfile] = useState(null);
  const [loadingList, setLoadingList] = useState(true);
  const [list, setList] = useState([]);
  const [page, setPage] = useState(0);
  const size = 10;
  const [totalPages, setTotalPages] = useState(1);

  const [showWrite, setShowWrite] = useState(false);
  const [boards, setBoards] = useState([]); // 대상 회원(보통 판매자)의 게시글 목록
  const [form, setForm] = useState({
    boardId: prefillBoardId,
    rating: 5,
    content: "",
    imagesText: "", // 줄바꿈으로 URL 여러개
  });
  const canWrite = myId && myId !== revieweeId; // 본인에게는 리뷰 금지

  // 대상 회원 프로필 + 통계
  useEffect(() => {
    let alive = true;
    setStats({ avgRating: 0, count: 0 });
    setProfile(null);

    axios.get(`/api/member/${revieweeId}`)
      .then(res => alive && setProfile(res.data))
      .catch(err => {
        console.error(err);
        toast.error("대상 회원 정보를 불러오지 못했습니다.");
      });

    axios.get(`/api/reviews/member/${revieweeId}/stats`)
      .then(res => alive && setStats(res.data?.data || { avgRating: 0, count: 0 }))
      .catch(() => {});

    return () => { alive = false; };
  }, [revieweeId]);

  // 리뷰 목록
  useEffect(() => {
    let alive = true;
    setLoadingList(true);
    axios.get(`/api/reviews/member/${revieweeId}`, { params: { page, size } })
      .then(res => {
        if (!alive) return;
        const pr = res.data?.data;
        setList(pr?.content || []);
        setTotalPages(pr?.totalPages ?? 1);
      })
      .catch(err => {
        console.error(err);
        toast.error("리뷰 목록을 불러오지 못했습니다.");
      })
      .finally(() => alive && setLoadingList(false));
    return () => { alive = false; };
  }, [revieweeId, page]);

  // 리뷰 작성 모달 열릴 때, 대상 회원이 작성한(=판매자) 게시글 목록 가져오기
  const openWrite = () => {
    setShowWrite(true);
    // 대상 회원이 author인 글만 조회 -> 거래글 선택
    axios.get("/api/board/list", { params: { p: 1, size: 50, authorId: revieweeId } })
      .then(res => {
        const data = res.data || {};
        setBoards(Array.isArray(data.boardList) ? data.boardList : []);
        if (prefillBoardId && !form.boardId) {
          setForm(f => ({ ...f, boardId: prefillBoardId }));
        }
      })
      .catch(err => {
        console.error(err);
        toast.error("대상 회원의 거래글 목록을 불러오지 못했습니다.");
      });
  };

  const closeWrite = () => {
    setShowWrite(false);
    setForm({ boardId: prefillBoardId, rating: 5, content: "", imagesText: "" });
  };

  const submitReview = () => {
    if (!canWrite) {
      toast.error("본인에게는 리뷰를 작성할 수 없습니다.");
      return;
    }
    const boardId = Number(form.boardId);
    if (!boardId) {
      toast.error("거래글을 선택하세요.");
      return;
    }
    const rating = clamp(Number(form.rating), 1, 5);
    if (!rating) {
      toast.error("평점을 입력하세요(1~5).");
      return;
    }
    // imagesText -> JSON 문자열
    let imagesJson = undefined;
    if (form.imagesText && form.imagesText.trim().length > 0) {
      const arr = form.imagesText
        .split(/\r?\n/)
        .map(s => s.trim())
        .filter(Boolean);
      imagesJson = JSON.stringify(arr);
    }

    axios.post("/api/reviews", {
      boardId,
      revieweeId,
      rating,
      content: form.content?.trim() || "",
      imagesJson,
    })
      .then(res => {
        toast(res.data?.message?.text || "리뷰가 등록되었습니다.", {
          type: res.data?.message?.type || "success",
        });
        closeWrite();
        // 목록 새로고침
        setPage(0);
        return axios.get(`/api/reviews/member/${revieweeId}`, { params: { page: 0, size } });
      })
      .then(res => {
        const pr = res?.data?.data;
        if (pr) {
          setList(pr.content || []);
          setTotalPages(pr.totalPages ?? 1);
        }
        // 통계도 갱신
        return axios.get(`/api/reviews/member/${revieweeId}/stats`);
      })
      .then(res => {
        if (res?.data?.data) setStats(res.data.data);
      })
      .catch(err => {
        console.error(err);
        toast.error(
          err.response?.data?.message?.text ||
          err.response?.data?.error ||
          `리뷰 등록 실패 (HTTP ${err.response?.status ?? "?"})`
        );
      });
  };

  return (
    <div className="container py-4">
      <Button variant="outline-secondary" onClick={() => navigate(-1)} className="mb-3">
        ← 뒤로
      </Button>

      <Row className="g-4">
        <Col md={4}>
          <div className="p-3 border rounded-3 shadow-sm">
            <h5 className="mb-3">🎯 대상 회원</h5>
            {profile ? (
              <>
                <div><strong>닉네임:</strong> {profile.nickName}</div>
                <div><strong>이메일:</strong> {profile.email}</div>
                <div className="mt-2">
                  <Badge bg="dark" className="me-2">평균 {stats.avgRating?.toFixed?.(1) ?? stats.avgRating}</Badge>
                  <Badge bg="secondary">후기 {stats.count}</Badge>
                </div>
              </>
            ) : (
              <Spinner size="sm" />
            )}

            <hr />
            <div className="d-grid gap-2">
              <Button
                variant="dark"
                disabled={!canWrite}
                onClick={openWrite}
                title={canWrite ? "이 회원에 대한 후기를 작성합니다" : "본인에게는 후기를 작성할 수 없습니다"}
              >
                ✍️ 후기 작성
              </Button>
            </div>
          </div>
        </Col>

        <Col md={8}>
          <div className="p-3 border rounded-3 shadow-sm">
            <div className="d-flex justify-content-between align-items-center">
              <h5 className="mb-0">📝 받은 후기</h5>
              <div className="d-flex align-items-center gap-2">
                <Button
                  size="sm"
                  variant="outline-dark"
                  onClick={() => setPage(p => Math.max(0, p - 1))}
                  disabled={page <= 0}
                >
                  이전
                </Button>
                <span className="small text-muted">
                  {page + 1}/{totalPages}
                </span>
                <Button
                  size="sm"
                  variant="dark"
                  onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))}
                  disabled={page >= totalPages - 1}
                >
                  다음
                </Button>
              </div>
            </div>

            <hr />

            {loadingList ? (
              <div className="text-center my-4"><Spinner animation="border" /></div>
            ) : list.length === 0 ? (
              <div className="text-muted">아직 후기가 없습니다.</div>
            ) : (
              <ListGroup>
                {list.map(r => (
                  <ListGroup.Item key={r.id}>
                    <div className="d-flex justify-content-between">
                      <div className="d-flex align-items-center gap-2">
                        <strong>★ {r.rating}</strong>
                        <span className="text-muted small">{formatDate(r.insertedAt)}</span>
                      </div>
                      <div className="text-muted small">
                        by {r.reviewerNick || `회원#${r.reviewerId}`}
                      </div>
                    </div>
                    {r.content && <div className="mt-2">{r.content}</div>}
                    {/* 필요하면 r.imagesJson 렌더링 */}
                  </ListGroup.Item>
                ))}
              </ListGroup>
            )}
          </div>
        </Col>
      </Row>

      {/* 리뷰 작성 모달 */}
      <Modal show={showWrite} onHide={closeWrite} centered>
        <Modal.Header closeButton>
          <Modal.Title>후기 작성</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form>
            <Form.Group className="mb-3">
              <Form.Label>거래글 선택 (대상 회원의 게시글)</Form.Label>
              <Form.Select
                value={form.boardId ?? ""}
                onChange={(e) => setForm(f => ({ ...f, boardId: e.target.value ? Number(e.target.value) : null }))}
              >
                <option value="">선택하세요</option>
                {boards.map(b => (
                  <option key={b.id} value={b.id}>
                    #{b.id} · {b.title}
                  </option>
                ))}
              </Form.Select>
              <div className="form-text">
                거래 상대가 작성한(판매자) 게시글을 선택하세요.
              </div>
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>평점 (1~5)</Form.Label>
              <Form.Control
                type="number"
                min={1}
                max={5}
                value={form.rating}
                onChange={(e) => setForm(f => ({ ...f, rating: Number(e.target.value) }))}
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>내용 (선택)</Form.Label>
              <Form.Control
                as="textarea"
                rows={4}
                value={form.content}
                onChange={(e) => setForm(f => ({ ...f, content: e.target.value }))}
                placeholder="거래가 어땠는지 솔직하게 적어주세요."
              />
            </Form.Group>

            <Form.Group>
              <Form.Label>이미지 URL (선택, 줄바꿈으로 여러 개)</Form.Label>
              <Form.Control
                as="textarea"
                rows={2}
                value={form.imagesText}
                onChange={(e) => setForm(f => ({ ...f, imagesText: e.target.value }))}
                placeholder="https://.../a.jpg\nhttps://.../b.png"
              />
              <div className="form-text">
                업로드 기능이 없다면 URL만 입력하세요. 전송 시 JSON 배열로 변환됩니다.
              </div>
            </Form.Group>
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="outline-secondary" onClick={closeWrite}>취소</Button>
          <Button variant="dark" onClick={submitReview}>등록</Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
}
