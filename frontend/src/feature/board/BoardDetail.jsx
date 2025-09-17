// src/feature/board/BoardDetail.jsx
import { useContext, useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import axios from "axios";
import { toast } from "react-toastify";
import { Badge, Button, Image, Modal, Spinner, Form } from "react-bootstrap";
import { AuthenticationContext } from "../../common/AuthenticationContextProvider.jsx";
import { CommentContainer } from "../comment/CommentContainer.jsx";
import { chatApi } from "../chat/chatApi";
import {
  FaClock,
  FaEdit,
  FaMapMarkerAlt,
  FaTag,
  FaTrashAlt,
  FaWonSign,
  FaComments,
  FaFlag,
} from "react-icons/fa";
import "../../styles/BoardDetail.css";

/** 전역 in-flight 캐시 */
const inFlightById = new Map();

/** 숫자 가격 포맷 */
const formatPrice = (v) => {
  if (v === null || v === undefined || v === "") return null;
  const num = Number(String(v).replace(/[^\d.-]/g, ""));
  if (Number.isNaN(num)) return null;
  return num.toLocaleString();
};

/** 대표 이미지 추출 */
const pickThumb = (files) => {
  if (!Array.isArray(files)) return null;
  return files.find((f) => /\.(jpe?g|png|gif|webp)$/i.test(String(f))) || null;
};

// 서버 허용 사유 문자열(백엔드 화이트리스트와 일치)
const REPORT_REASONS = [
  { value: "SPAM", label: "스팸/도배" },
  { value: "SCAM", label: "사기/선입금 유도" },
  { value: "ILLEGAL", label: "불법/위법" },
  { value: "OFFENSIVE", label: "욕설/혐오/선정성" },
  { value: "OTHER", label: "기타" },
];

export default function BoardDetail() {
  const [board, setBoard] = useState(null);
  const [modalShow, setModalShow] = useState(false); // 삭제 모달
  const [chatLoading, setChatLoading] = useState(false);

  // 신고 모달 상태
  const [reportShow, setReportShow] = useState(false);
  const [reportReason, setReportReason] = useState("SPAM");
  const [reportDetail, setReportDetail] = useState("");
  const [reportSubmitting, setReportSubmitting] = useState(false);

  // ✅ 컨텍스트 방어: Provider 미적용/초기 로딩에도 안 터지게
  const auth = useContext(AuthenticationContext) || {};
  const hasAccess = auth.hasAccess ?? (() => false);

  const { id } = useParams();
  const navigate = useNavigate();

  const defaultProfileImage = "/user.png";

  const isSold = (board?.tradeStatus || "") === "SOLD_OUT";
  const isOwner = hasAccess(board?.authorEmail);

  // 판매 상태 뱃지
  const tradeBadge = useMemo(() => {
    const status = board?.tradeStatus;
    if (status === "SOLD_OUT") return <Badge bg="secondary">판매완료</Badge>;
    return <Badge bg="success">판매중</Badge>;
  }, [board?.tradeStatus]);

  useEffect(() => {
    if (!id) return;

    let cancelled = false;
    let p = inFlightById.get(id);
    if (!p) {
      p = axios.get(`/api/board/${encodeURIComponent(id)}`);
      inFlightById.set(id, p);
    }

    p.then((res) => {
      if (cancelled) return;
      setBoard(res?.data ?? null);
    })
      .catch((err) => {
        if (cancelled) return;
        inFlightById.delete(id);

        const status = err?.response?.status;
        if (status === 404) {
          toast.warning("해당 게시물이 없습니다.");
          navigate("/");
        } else {
          toast.error("게시글을 불러오는 중 오류가 발생했습니다.");
        }
      })
      .finally(() => {
        inFlightById.delete(id);
      });

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  function handleDeleteButtonClick() {
    if (isSold) {
      toast.info("판매완료된 게시물은 삭제할 수 없습니다.");
      return;
    }
    axios
      .delete(`/api/board/${board?.id ?? id}`)
      .then((res) => {
        const message = res.data?.message;
        if (message) toast(message.text, { type: message.type });
        navigate("/board/list");
      })
      .catch(() => {
        toast.warning("게시물이 삭제되지 않았습니다.");
      });
  }

  // 판매자와 1:1 채팅방 생성/이동
  async function handleChatButtonClick() {
    if (!board) return;

    const token = localStorage.getItem("token") || localStorage.getItem("accessToken");
    if (!token) {
      toast.info("채팅은 로그인 후 이용할 수 있습니다.");
      return;
    }

    setChatLoading(true);
    try {
      const data = await chatApi.openRoomByBoard(board.id);
      const roomId = data?.id ?? data?.roomId;
      if (!roomId) throw new Error("roomId not found");
      navigate(`/chat/rooms/${roomId}`);
    } catch (e) {
      toast.error("채팅방을 생성/이동하는 중 오류가 발생했습니다.");
    } finally {
      setChatLoading(false);
    }
  }

  // 신고 버튼 클릭
  function handleOpenReport() {
    const token = localStorage.getItem("token") || localStorage.getItem("accessToken");
    if (!token) {
      toast.info("신고는 로그인 후 이용할 수 있습니다.");
      return;
    }
    if (isOwner) {
      toast.info("본인 게시물은 신고할 수 없습니다.");
      return;
    }
    setReportShow(true);
  }

  // 신고 제출
  async function handleSubmitReport(e) {
    e?.preventDefault?.();
    if (!board) return;

    const body = {
      boardId: board.id,
      reason: (reportReason || "").toUpperCase().trim(),
      detail: reportDetail || "",
    };

    if (!REPORT_REASONS.some((r) => r.value === body.reason)) {
      toast.error("신고 사유를 선택해 주세요.");
      return;
    }

    setReportSubmitting(true);
    try {
      const res = await axios.post("/api/board-report", body);
      const msg = res.data?.message;
      if (msg?.text) toast(msg.text, { type: msg.type || "success" });
      else toast.success("신고가 접수되었습니다.");
      setReportShow(false);
      setReportReason("SPAM");
      setReportDetail("");
    } catch (err) {
      const status = err?.response?.status;
      const msg = err?.response?.data?.message;
      if (msg?.text) {
        toast(msg.text, { type: msg.type || (status === 409 ? "warning" : "error") });
      } else {
        if (status === 401) toast.info("로그인 후 이용 가능합니다.");
        else if (status === 409) toast.warning("이미 신고한 게시글입니다.");
        else if (status === 400) toast.error("입력값이 유효하지 않습니다.");
        else toast.error("신고 접수 중 오류가 발생했습니다.");
      }
    } finally {
      setReportSubmitting(false);
    }
  }

  if (!board) {
    return (
      <div className="d-flex justify-content-center my-5">
        <Spinner animation="border" role="status" />
      </div>
    );
  }

  const formattedInsertedAt = board.insertedAt ? String(board.insertedAt).substring(0, 16) : "";
  const priceText = formatPrice(board.price);
  const regionText = [board.regionSido, board.regionSigungu].filter(Boolean).join(" ");
  const thumb = pickThumb(board.files);

  return (
    <div className="board-view-wrapper">
      <div className="board-view-header">
        {/* 상단: 제목/메타 vs 액션바 분리 */}
        <div className="board-top">
          {/* 제목 + 메타 */}
          <div className="board-title-wrap">
            <h1>
              {board.title}
              {tradeBadge}
            </h1>

            {/* 메타 칩들 */}
            <div className="d-flex flex-wrap gap-2 mt-2 text-muted">
              <span className="meta-chip">
                <FaClock /> {formattedInsertedAt || "-"}
              </span>
              <span className="meta-chip">#{board.id}</span>
              {priceText && (
                <span className="price-chip">
                  <FaWonSign /> <strong>{priceText}</strong> 원
                </span>
              )}
              {regionText && (
                <span className="meta-chip">
                  <FaMapMarkerAlt /> {regionText}
                </span>
              )}
              {board.category && (
                <span className="cat-chip">
                  <FaTag /> {board.category}
                </span>
              )}
            </div>

            {/* 작성자 */}
            <div className="header-meta mt-3">
              <div className="meta-item">
                <Image
                  roundedCircle
                  src={board.profileImageUrl || defaultProfileImage}
                  alt={`${board.authorNickName ?? "익명"} 프로필`}
                  className="meta-icon"
                />
                {board.authorNickName}
              </div>
            </div>
          </div>

          {/* 액션바: 공간 없으면 줄바꿈으로 아래로 자연스럽게 */}
          <div className="board-action-bar">
            {!isOwner && (
              <>
                {/* 🚩 신고 버튼 스타일 클래스 교체 */}
                <Button
                  className="btn-neo btn-outline-danger-neo"
                  onClick={handleOpenReport}
                  title="이 게시물 신고하기"
                >
                  <FaFlag /> <span className="btn-text d-none d-sm-inline">신고</span>
                </Button>

                <Button
                  className="btn-neo btn-primary-neo"
                  onClick={handleChatButtonClick}
                  disabled={chatLoading}
                  title="판매자와 채팅하기"
                >
                  {chatLoading ? <Spinner size="sm" animation="border" /> : <FaComments />}
                  <span className="btn-text d-none d-sm-inline">채팅하기</span>
                </Button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* 본문 */}
      <div className="board-view-body">
        {thumb && (
          <div className="board-hero-image">
            <img src={thumb} alt="대표 이미지" />
          </div>
        )}
        <p className="board-content">{board.content}</p>
      </div>

      {/* 하단 버튼 */}
      <div className="board-view-footer">
        {isOwner && (
          <div className="d-flex flex-wrap gap-2">
            {!isSold ? (
              <>
                <Button
                  onClick={() => navigate(`/board/edit?id=${board.id}`)}
                  className="btn-neo btn-info-neo"
                  title="수정"
                >
                  <FaEdit />
                  <span>수정</span>
                </Button>
                <Button
                  onClick={() => setModalShow(true)}
                  className="btn-neo btn-danger-neo"
                  title="삭제"
                >
                  <FaTrashAlt />
                  <span>삭제</span>
                </Button>
              </>
            ) : (
              <span className="text-muted align-self-center">판매완료된 게시물은 수정/삭제할 수 없습니다.</span>
            )}
          </div>
        )}
      </div>

      {/* 댓글 */}
      <div className="comment-section-wrapper">
        <CommentContainer boardId={board.id} />
      </div>

      {/* 삭제 모달 */}
      <Modal show={modalShow} onHide={() => setModalShow(false)} centered className="modal-neo">
        <Modal.Header closeButton>
          <Modal.Title>게시물 삭제 확인</Modal.Title>
        </Modal.Header>
        <Modal.Body>#{board.id} 게시물을 삭제하시겠습니까?</Modal.Body>
        <Modal.Footer>
          <Button variant="outline-secondary" onClick={() => setModalShow(false)}>
            취소
          </Button>
          <Button variant="danger" onClick={handleDeleteButtonClick}>
            삭제
          </Button>
        </Modal.Footer>
      </Modal>

      {/* 신고 모달 */}
      <Modal show={reportShow} onHide={() => setReportShow(false)} centered className="modal-neo">
        <Form onSubmit={handleSubmitReport}>
          <Modal.Header closeButton>
            <Modal.Title>
              <FaFlag className="me-2" />
              게시물 신고
            </Modal.Title>
          </Modal.Header>
          <Modal.Body>
            <div className="mb-3 small text-muted">
              게시물 #{board.id} · {board.title}
            </div>
            <Form.Group className="mb-3">
              <Form.Label>신고 사유</Form.Label>
              <Form.Select
                value={reportReason}
                onChange={(e) => setReportReason(e.target.value)}
                required
              >
                {REPORT_REASONS.map((r) => (
                  <option key={r.value} value={r.value}>
                    {r.label}
                  </option>
                ))}
              </Form.Select>
            </Form.Group>
            <Form.Group>
              <Form.Label>상세 내용 (선택)</Form.Label>
              <Form.Control
                as="textarea"
                rows={4}
                placeholder="세부 상황이나 증빙(링크 등)을 적어주세요."
                value={reportDetail}
                onChange={(e) => setReportDetail(e.target.value)}
                maxLength={2000}
              />
              <div className="text-end text-muted mt-1">{reportDetail.length}/2000</div>
            </Form.Group>
          </Modal.Body>
          <Modal.Footer>
            <Button
              variant="outline-secondary"
              onClick={() => setReportShow(false)}
              disabled={reportSubmitting}
            >
              취소
            </Button>
            <Button type="submit" variant="danger" disabled={reportSubmitting}>
              {reportSubmitting ? <Spinner size="sm" animation="border" /> : <FaFlag />} 신고 제출
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>
    </div>
  );
}
