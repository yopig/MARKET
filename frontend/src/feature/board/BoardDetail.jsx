// src/feature/board/BoardDetail.jsx  (FULL REPLACE)
import { useContext, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import axios from "axios";
import { toast } from "react-toastify";
import { Badge, Button, Image, Modal, Spinner } from "react-bootstrap";
import { AuthenticationContext } from "../../common/AuthenticationContextProvider.jsx";
import { CommentContainer } from "../comment/CommentContainer.jsx";
import { chatApi } from "../chat/chatApi"; // ✅ chatApi 경로 수정
import {
  FaClock,
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

/** ✅ 토스페이먼츠 Payment Widget 로더 */
let paymentWidgetScriptPromise = null;
function loadPaymentWidgetScript() {
  if (paymentWidgetScriptPromise) return paymentWidgetScriptPromise;
  paymentWidgetScriptPromise = new Promise((resolve, reject) => {
    if (window.PaymentWidget) return resolve();
    const s = document.createElement("script");
    s.src = "https://js.tosspayments.com/v1/payment-widget";
    s.async = true;
    s.onload = () => resolve();
    s.onerror = (e) => reject(e);
    document.head.appendChild(s);
  });
  return paymentWidgetScriptPromise;
}

export function BoardDetail() { // ✅ named export
  const [board, setBoard] = useState(null);
  const [modalShow, setModalShow] = useState(false); // 삭제 모달
  const [chatLoading, setChatLoading] = useState(false);

  // ✅ 결제 모달 상태
  const [payOpen, setPayOpen] = useState(false);
  const [payReady, setPayReady] = useState(false);
  const paymentWidgetRef = useRef(null); // PaymentWidget 인스턴스
  const paymentMethodsRef = useRef(null); // renderPaymentMethods 반환 핸들
  const agreementRef = useRef(null); // renderAgreement 반환 핸들

  const { hasAccess, user } = useContext(AuthenticationContext);
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();

  const defaultProfileImage = "/user.png";

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

  /** =========================
   *  ✅ 안전결제(토스 위젯) 처리
   *  ========================= */
  const CLIENT_KEY =
    (typeof import.meta !== "undefined" && import.meta.env?.VITE_TOSS_CLIENT_KEY) ||
    "test_ck_DLJOpm5Qrl72jXNzdqYAVPNdxbWn"; // 👉 네가 준 테스트 키

  // 고객 식별 키: 로그인 사용자의 이메일/ID가 제일 좋고, 없으면 로컬 생성
  function getCustomerKey() {
    const candidate = user?.email || user?.id || localStorage.getItem("customerKey");
    if (candidate) return String(candidate);
    const gen = `anon_${crypto?.randomUUID?.() || Date.now()}`;
    localStorage.setItem("customerKey", gen);
    return gen;
  }

  async function openPayModal() {
    if (!board) return;
    if (!board.price || Number.isNaN(Number(board.price))) {
      toast.warn("가격 정보가 없어 결제를 진행할 수 없습니다.");
      return;
    }
    try {
      setPayOpen(true);
      setPayReady(false);
      await loadPaymentWidgetScript();

      // 전역 SDK 로드됨
      const PaymentWidget = window.PaymentWidget;
      const customerKey = getCustomerKey();

      // 인스턴스 생성
      const widget = new PaymentWidget(CLIENT_KEY, customerKey);
      paymentWidgetRef.current = widget;

      // 결제수단/약관 렌더
      paymentMethodsRef.current = widget.renderPaymentMethods("#payment-methods", {
        value: Number(board.price),
      });
      agreementRef.current = widget.renderAgreement("#agreement", { variant: "AGREE" });

      setPayReady(true);
    } catch (e) {
      console.error(e);
      toast.error("결제위젯을 로드하는 중 문제가 발생했습니다.");
      setPayOpen(false);
    }
  }

  async function requestPayment() {
    if (!paymentWidgetRef.current || !board) return;
    try {
      const orderId = `BD-${board.id}-${Date.now()}`;
      const origin = window.location.origin;
      await paymentWidgetRef.current.requestPayment({
        orderId,
        orderName: board.title?.slice(0, 40) || `게시글 #${board.id}`,
        successUrl: `${origin}/pay/success?boardId=${board.id}&orderId=${encodeURIComponent(orderId)}`,
        failUrl: `${origin}/pay/fail?boardId=${board.id}&orderId=${encodeURIComponent(orderId)}`,
        customerEmail: user?.email || undefined,
        customerName: user?.nickName || user?.name || undefined,
        customerMobilePhone: user?.phone || undefined,
      });

      // 위 호출은 결제창으로 이동(또는 새 창)하며, 성공/실패 URL로 리다이렉트됨
      // 성공 페이지에서 paymentKey, orderId, amount로 백엔드 승인 API 호출 필요
    } catch (e) {
      // 사용자가 닫기 등
      console.warn(e);
    }
  }

  function closePayModal() {
    setPayOpen(false);
    setPayReady(false);
    // 특별한 해제는 불필요하지만, 필요 시 아래처럼 DOM 초기화 가능
    const container = document.querySelector("#payment-methods");
    if (container) container.innerHTML = "";
    const agreement = document.querySelector("#agreement");
    if (agreement) agreement.innerHTML = "";
  }

  if (!board) {
    return (
      <div className="d-flex justify-content-center my-5">
        <Spinner animation="border" role="status" />
      </div>
    );
  }

  const formattedInsertedAt = board.insertedAt ? board.insertedAt.substring(0, 16) : "";
  const priceText = formatPrice(board.price);
  const regionText = [board.regionSido, board.regionSigungu].filter(Boolean).join(" ");
  const thumb = pickThumb(board.files);

  const isOwner = hasAccess(board.authorEmail);
  const canPay = !isOwner && board.tradeStatus !== "SOLD_OUT" && Number(board.price) > 0;

  return (
    <div className="board-view-wrapper">
      <div className="board-view-header">
        <div className="d-flex align-items-start justify-content-between gap-3">
          <h1 className="d-flex align-items-center gap-2 mb-0">
            {board.title}
            {tradeBadge}
          </h1>

          {/* ✅ 비소유자(구매자)에게만 버튼 노출 */}
          {!isOwner && (
            <div className="d-flex align-items-center gap-2">
              {canPay && (
                <Button
                  className="btn-neo btn-warning"
                  onClick={openPayModal}
                  title="안전결제(에스크로/PG)로 진행"
                >
                  🔒 안전결제
                </Button>
              )}

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

        </div>

        {/* ✅ 거래 정보 블럭 (가격/지역/카테고리/시간/ID) */}
        <div className="d-flex flex-wrap gap-3 mt-2 text-muted">
          <span className="d-inline-flex align-items-center gap-1">
            <FaClock /> {formattedInsertedAt}
          </span>
          <span className="d-inline-flex align-items-center gap-1">#{board.id}</span>

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
      </div>

      {/* 본문 */}
      <div className="board-view-body">
        {thumb && (
          <div className="board-hero-image mb-3">
            <img src={thumb} alt="대표 이미지" style={{ maxWidth: "100%", borderRadius: 12 }} />
          </div>
        )}
        <p className="board-content">{board.content}</p>
      </div>

      {/* 하단 버튼 */}
      <div className="board-view-footer">
        {isOwner && (
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

      {/* ✅ 결제 모달 (토스 결제위젯) */}
      <Modal show={payOpen} onHide={closePayModal} centered size="lg">
        <Modal.Header closeButton>
          <Modal.Title>안전결제</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {!payReady ? (
            <div className="d-flex justify-content-center my-4">
              <Spinner animation="border" role="status" />
            </div>
          ) : (
            <>
              <div id="payment-methods" />
              <div id="agreement" className="mt-3" />
            </>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="outline-secondary" onClick={closePayModal}>
            닫기
          </Button>
          <Button variant="primary" onClick={requestPayment} disabled={!payReady}>
            결제하기
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
}

export default undefined; // ⚠️ default export 막기 (named export만 사용)
