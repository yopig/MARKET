// src/feature/board/BoardDetail.jsx  (FULL REPLACE)
import { useContext, useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import axios from "axios";
import { toast } from "react-toastify";
import { Badge, Button, Image, Modal, Spinner } from "react-bootstrap";
import { AuthenticationContext } from "../../common/AuthenticationContextProvider.jsx";
import { CommentContainer } from "../comment/CommentContainer.jsx";
import { chatApi } from "../chat/chatApi"; // ✅ chatApi 경로 수정
import {
  FaClock,
  FaDownload,
  FaEdit,
  FaMapMarkerAlt,
  FaTag,
  FaTrashAlt,
  FaWonSign,
  FaComments,
} from "react-icons/fa";
import "../../styles/BoardDetail.css";

/** ✅ 같은 게시글(id)에 대한 중복 GET을 합쳐주는 전역 캐시 */
const inFlightById = new Map(); // key: id -> Promise

/** 숫자 가격 포맷 */
const formatPrice = (v) => {
  if (v === null || v === undefined || v === "") return null;
  const num = Number(v);
  if (Number.isNaN(num)) return null;
  return num.toLocaleString();
};

/** 대표 이미지 추출 */
const pickThumb = (files) => {
  if (!Array.isArray(files)) return null;
  return files.find((f) => /\.(jpe?g|png|gif|webp)$/i.test(f)) || null;
};

export function BoardDetail() { // ✅ named export
  const [board, setBoard] = useState(null);
  const [modalShow, setModalShow] = useState(false);
  const [chatLoading, setChatLoading] = useState(false);
  const { hasAccess } = useContext(AuthenticationContext);
  const { id } = useParams();
  const navigate = useNavigate();

  // 판매 상태 뱃지
  const tradeBadge = useMemo(() => {
    const status = board?.tradeStatus;
    if (status === "SOLD_OUT") return <Badge bg="secondary">판매완료</Badge>;
    return <Badge bg="success">판매중</Badge>; // 기본값
  }, [board?.tradeStatus]);

  useEffect(() => {
    if (!id) return;

    let cancelled = false;

    let p = inFlightById.get(id);
    if (!p) {
      p = axios.get(`/api/board/${id}`);
      inFlightById.set(id, p);
    }

    p.then((res) => {
      if (cancelled) return;
      setBoard(res.data);
    })
      .catch((err) => {
        if (cancelled) return;
        inFlightById.delete(id);

        if (err.response?.status === 404) {
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
    axios
      .delete(`/api/board/${id}`)
      .then((res) => {
        const message = res.data?.message;
        if (message) toast(message.text, { type: message.type });
        navigate("/board/list");
      })
      .catch(() => {
        toast.warning("게시물이 삭제되지 않았습니다.");
      });
  }

  // ✅ 판매자와 1:1 채팅방 생성/이동
  async function handleChatButtonClick() {
    if (!board) return;

    // 비로그인 방어
    const token = localStorage.getItem("token") || localStorage.getItem("accessToken");
    if (!token) {
      toast.info("채팅은 로그인 후 이용할 수 있습니다.");
      return;
    }

    setChatLoading(true);
    try {
      // 백엔드: POST /api/chat/rooms/open?boardId={id}
      const data = await chatApi.openRoomByBoard(board.id);
      const roomId = data.id ?? data.roomId; // 서버 구현 따라 유연 처리
      if (!roomId) throw new Error("roomId not found");
      navigate(`/chat/rooms/${roomId}`);
    } catch (e) {
      toast.error("채팅방을 생성/이동하는 중 오류가 발생했습니다.");
    } finally {
      setChatLoading(false);
    }
  }

  if (!board) {
    return (
      <div className="d-flex justify-content-center my-5">
        <Spinner animation="border" role="status" />
      </div>
    );
  }

  const formattedInsertedAt = board.insertedAt ? board.insertedAt.substring(0, 16) : "";
  const defaultProfileImage = "/user.png";
  const priceText = formatPrice(board.price);
  const regionText = [board.regionSido, board.regionSigungu].filter(Boolean).join(" ");
  const thumb = pickThumb(board.files);

  return (
    <div className="board-view-wrapper">
      <div className="board-view-header">
        <div className="d-flex align-items-start justify-content-between gap-3">
          <h1 className="d-flex align-items-center gap-2 mb-0">
            {board.title}
            {tradeBadge}
          </h1>

          {/* ✅ 비소유자(구매자)에게만 채팅 버튼 노출 (판매완료면 숨기고 싶으면 && board.tradeStatus !== "SOLD_OUT" 추가) */}
          {!hasAccess(board.authorEmail) && (
            <div className="d-flex align-items-center">
              <Button
                className="btn-neo btn-primary"
                onClick={handleChatButtonClick}
                disabled={chatLoading}
                title="판매자와 채팅하기"
              >
                {chatLoading ? <Spinner size="sm" animation="border" /> : <FaComments />}{" "}
                채팅하기
              </Button>
            </div>
          )}
        </div>

        <div className="header-meta mt-2">
          <div className="meta-item">
            <Image
              roundedCircle
              src={board.profileImageUrl || defaultProfileImage}
              alt={`${board.authorNickName ?? "익명"} 프로필`}
              className="meta-icon"
            />
            {board.authorNickName}
          </div>

          <div className="meta-item">
            <FaClock className="meta-icon" />
            {formattedInsertedAt}
          </div>

          <div className="meta-item">
            <span>#{board.id}</span>
          </div>
        </div>

        {/* ✅ 거래 정보 블럭 (가격/지역/카테고리) */}
        {(priceText || regionText || board.category) && (
          <div className="d-flex flex-wrap gap-3 mt-2 text-muted">
            {priceText && (
              <span className="d-inline-flex align-items-center gap-1">
                <FaWonSign /> <strong>{priceText}</strong> 원
              </span>
            )}
            {regionText && (
              <span className="d-inline-flex align-items-center gap-1">
                <FaMapMarkerAlt /> {regionText}
              </span>
            )}
            {board.category && (
              <span className="d-inline-flex align-items-center gap-1">
                <FaTag /> {board.category}
              </span>
            )}
          </div>
        )}
      </div>

      {/* 본문 */}
      <div className="board-view-body">
        {/* 썸네일 큰 이미지가 있으면 상단에 보여주고 싶다면 여기에 추가 */}
        {thumb && (
          <div className="board-hero-image mb-3">
            <img src={thumb} alt="대표 이미지" style={{ maxWidth: "100%", borderRadius: 12 }} />
          </div>
        )}
        <p className="board-content">{board.content}</p>
      </div>

      {/* 첨부파일 */}
      {Array.isArray(board.files) && board.files.length > 0 && (
        <div className="board-view-attachments">
          <h3 className="attachments-title">첨부파일</h3>

          <div className="image-preview-list">
            {board.files
              .filter((file) => /\.(jpg|jpeg|png|gif|webp)$/i.test(file))
              .map((file, idx) => (
                <img key={idx} src={file} alt={`첨부 이미지 ${idx + 1}`} />
              ))}
          </div>

          <div className="file-list">
            {board.files.map((file, idx) => {
              const fileName = decodeURIComponent(file.split("/").pop());
              return (
                <div key={idx} className="file-item">
                  <Button
                    href={file}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn-neo btn-download"
                    title={fileName}
                  >
                    <FaDownload />
                  </Button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 하단 버튼 */}
      <div className="board-view-footer">
        {hasAccess(board.authorEmail) && (
          <div className="d-flex gap-2">
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
    </div>
  );
}

export default undefined; // ⚠️ default export 막기 (named export만 사용)
