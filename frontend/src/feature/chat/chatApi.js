// src/feature/chat/chatApi.js
import axios from "axios";

/** 토큰 가져오기: user 컨텍스트 없이도 동작하도록 로컬/기본헤더에서 탐색 */
function getAccessToken() {
  return (
    (typeof localStorage !== "undefined" &&
      (localStorage.getItem("token") || localStorage.getItem("accessToken"))) ||
    (axios.defaults.headers.common["Authorization"] || "").replace(/^Bearer\s+/i, "")
  );
}

/** axios 인스턴스: baseURL은 필요 시 .env 에서 주입 */
const api = axios.create({
  baseURL:
    typeof import.meta !== "undefined" && import.meta.env?.VITE_API_BASE
      ? import.meta.env.VITE_API_BASE
      : "",
  timeout: 15000,
});

/** 요청 인터셉터: Authorization 자동 첨부 */
api.interceptors.request.use((config) => {
  const token = getAccessToken();
  if (token && !/^Bearer\s/i.test(config.headers?.Authorization || "")) {
    config.headers = config.headers || {};
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

/** 공통 에러 포맷터 (필요시 확장) */
function unwrap(res) {
  return res?.data;
}

/** ===== 정규화 유틸 ===== */

/** 방 메타 응답을 UI에서 쓰기 편하게 정규화 */
function normalizeRoom(raw) {
  if (!raw) return null;
  const partnerNickName =
    raw.partnerNickName ??
    raw.otherNickName ??
    raw.otherNickname ??
    raw.opponentNickName ??
    raw.partner_nickname ??
    raw.other_nickname;

  const myMemberId =
    raw.myMemberId ??
    raw.meId ??
    raw.viewerId ??
    raw.my_member_id ??
    raw.viewer_id;

  const boardId =
    raw.boardId ??
    raw.bid ??
    raw.board_id ??
    (typeof raw.board === "object" ? raw.board.id : undefined);

  return {
    id: raw.id ?? raw.roomId ?? raw.rid,
    boardId,
    myMemberId,
    partnerNickName,
    board: raw.board ?? null, // 있으면 그대로 둠 (BoardDetail에서 쓰는 구조 가정)
    // 백엔드가 추가로 내려주는 필드들 그대로 보존
    ...raw,
  };
}

/** 메시지 정규화: ChatRoomPage의 normalizeMessage와 동일 컨벤션 권장 */
function normalizeMessage(raw) {
  if (!raw) return null;
  return {
    id: raw.id ?? raw.messageId ?? raw.mid,
    roomId: raw.roomId,
    senderId: raw.senderId,
    senderNickName:
      raw.senderNickName ?? raw.senderNickname ?? raw.sender_name,
    content: raw.content ?? raw.message ?? "",
    insertedAt: raw.insertedAt ?? raw.createdAt ?? raw.inserted_at,
    // 기타 보존
    ...raw,
  };
}

/** 리스트 정규화 헬퍼 */
function normalizeArray(arr, normalizer) {
  if (!Array.isArray(arr)) return [];
  return arr.map(normalizer).filter(Boolean);
}

/** ===== API ===== */
export const chatApi = {
  /** 게시글 기반으로 1:1 방 열기 (또는 기존 방으로 이동) */
  async openRoomByBoard(boardId) {
    const res = await api.post(`/api/chat/rooms/open`, null, { params: { boardId } });
    // 백엔드 계약: { roomId, boardId, buyerId, sellerId }
    return unwrap(res);
  },

  /** 내 채팅방 목록 */
  async listMyRooms() {
    // 백엔드 엔드포인트 필요: GET /api/chat/rooms/my
    const res = await api.get(`/api/chat/rooms/my`);
    // [{ id, otherNickName, otherEmail, boardTitle, lastMessage, unreadCount }, ...]
    return unwrap(res);
  },

  /** 방 메타/상대/게시판 요약 (ChatRoomPage에서 상단 헤더용) */
  async getRoom(roomId) {
    const res = await api.get(`/api/chat/rooms/${roomId}`);
    const data = unwrap(res);
    return normalizeRoom(data);
  },

  /** 메시지 목록 (limit/beforeId/afterId 등 파라미터 확장 가능) */
  async listMessages(roomId, params = {}) {
    const res = await api.get(`/api/chat/rooms/${roomId}/messages`, { params });
    const data = unwrap(res);
    // ChatMessageDto[] → 정규화해서 반환
    return normalizeArray(data, normalizeMessage);
  },

  /** 읽음 처리: 마지막 메시지 ID 기준 */
  async markRead(roomId, lastMessageId) {
    await api.post(`/api/chat/rooms/${roomId}/read`, null, { params: { lastMessageId } });
  },

  /** (옵션) 서버 REST 전송이 필요한 경우 제공. 기본은 STOMP publish 사용 */
  async sendMessage(roomId, content) {
    const res = await api.post(`/api/chat/rooms/${roomId}/messages`, { content });
    const data = unwrap(res);
    return normalizeMessage(data);
  },

  /** (옵션) WebSocket 엔드포인트 도우미 */
  getSignedWsUrl() {
    const token = getAccessToken();
    // 배포 환경에 맞게 호스트 변경 가능
    const base = (typeof import.meta !== "undefined" && import.meta.env?.VITE_WS_BASE) || "http://localhost:8080";
    return `${base}/ws?token=${encodeURIComponent(token || "")}`;
  },
};
