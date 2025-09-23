// src/feature/chat/ChatListPage.jsx (FULL REPLACE)
import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Badge, Button, ListGroup, Spinner, Image } from "react-bootstrap";
import { chatApi } from "./chatApi";
import SockJS from "sockjs-client/dist/sockjs.js";
import { Client as StompClient } from "@stomp/stompjs";
import axios from "axios";
import { FaMapMarkerAlt, FaTag, FaWonSign } from "react-icons/fa";

/** -------------------- 설정/유틸 -------------------- */
const WS_URL =
  (typeof import.meta !== "undefined" && import.meta.env?.VITE_WS_URL) ||
  (typeof window !== "undefined" && window.__WS_URL) ||
  "http://localhost:8080/ws";

const defaultThumb = "/no-image.png";   // 게시글 썸네일 기본
const defaultAvatar = "/user.png";      // 사람 아바타 기본

function sanitizeToken(t) {
  if (!t) return null;
  return String(t).replace(/^Bearer\s+/i, "").trim();
}
function getToken() {
  const raw =
    (typeof localStorage !== "undefined" &&
      (localStorage.getItem("token") || localStorage.getItem("accessToken"))) ||
    axios.defaults.headers.common["Authorization"] ||
    null;
  return sanitizeToken(raw);
}
function formatPrice(v) {
  if (v === null || v === undefined || v === "") return null;
  const n = Number(v);
  if (Number.isNaN(n)) return null;
  return n.toLocaleString();
}
function pickThumb(files) {
  if (!Array.isArray(files)) return null;
  const urlOf = (f) =>
    typeof f === "string"
      ? f
      : f?.url || f?.path || f?.imageUrl || f?.thumbnailUrl || null;
  for (const f of files) {
    const u = urlOf(f);
    if (u && /\.(jpe?g|png|gif|webp)$/i.test(u)) return u;
  }
  for (const f of files) {
    const u = urlOf(f);
    if (u) return u;
  }
  return null;
}

/** 게시글 메타 보강 */
async function enrichRoomsWithBoard(rooms, bearer) {
  const out = [...rooms];
  const tasks = out.map(async (r, i) => {
    const boardId =
      r.boardId ?? r.itemId ?? r.postId ?? r.board?.id ?? r.board_id ?? null;
    if (!boardId) return;
    try {
      const { data } = await axios.get(`/api/board/${boardId}`, {
        headers: bearer ? { Authorization: bearer } : undefined,
      });
      const boardMeta = {
        boardId: data.id ?? boardId,
        boardTitle: data.title ?? r.boardTitle ?? "",
        boardPrice: data.price ?? r.boardPrice ?? null,
        boardCategory: data.category ?? r.boardCategory ?? "",
        boardRegionSido: data.regionSido ?? r.boardRegionSido ?? "",
        boardRegionSigungu: data.regionSigungu ?? r.boardRegionSigungu ?? "",
        boardTradeStatus: data.tradeStatus ?? r.boardTradeStatus ?? "ON_SALE",
        boardFiles: Array.isArray(data.files) ? data.files : [],
        boardThumb:
          r.boardThumb ||
          pickThumb(Array.isArray(data.files) ? data.files : []) ||
          null,
      };
      out[i] = { ...r, ...boardMeta };
    } catch {
      /* ignore */
    }
  });
  await Promise.allSettled(tasks);
  return out;
}

/** 참여자(상대) 아바타 보강: /api/chat/rooms/{roomId} */
async function enrichRoomsWithParticipants(rooms, bearer) {
  const out = [...rooms];
  const tasks = out.map(async (r, i) => {
    try {
      const { data } = await axios.get(`/api/chat/rooms/${r.id}`, {
        headers: bearer ? { Authorization: bearer } : undefined,
      });
      // otherMemberId가 seller/buyer 중 누구인지 확인해서 상대 프로필 URL 세팅
      let otherProfileImageUrl = null;
      if (r.otherMemberId != null) {
        if (String(r.otherMemberId) === String(data.sellerId)) {
          otherProfileImageUrl = data.sellerProfileImageUrl ?? null;
        } else if (String(r.otherMemberId) === String(data.buyerId)) {
          otherProfileImageUrl = data.buyerProfileImageUrl ?? null;
        }
      }
      out[i] = { ...r, otherProfileImageUrl };
    } catch {
      /* ignore */
    }
  });
  await Promise.allSettled(tasks);
  return out;
}

/** -------------------- UI 조각: 상태 뱃지(마켓 카드와 동일 톤) -------------------- */
function StatusPill({ status }) {
  // ON_SALE / RESERVED / SOLD_OUT → 텍스트/클래스 매핑
  const map = {
    ON_SALE: { text: "판매중", cls: "onsale" },
    RESERVED: { text: "예약중", cls: "reserved" },
    SOLD_OUT: { text: "판매완료", cls: "sold" },
  };
  const picked = map[status] || map.ON_SALE;

  // jn-badge 색감/패딩 그대로 사용하되 position만 static으로 교정
  return (
    <span
      className={`jn-badge ${picked.cls}`}
      style={{ position: "static", display: "inline-block", lineHeight: 1 }}
    >
      {picked.text}
    </span>
  );
}

/** -------------------- 컴포넌트 -------------------- */
export function ChatListPage() {
  const [rooms, setRooms] = useState(null);
  const [deleting, setDeleting] = useState(null);
  const navigate = useNavigate();
  const token = useMemo(() => getToken(), []);
  const bearer = token ? `Bearer ${token}` : null;

  // STOMP
  const stompRef = useRef(/** @type {{ client: StompClient|null, subs: any[] }} */(null));

  /** 1) 방 목록 + 게시글/참여자 메타 보강 */
  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const data = await chatApi.listMyRooms(); // [{id, otherMemberId, otherNickName, unreadCount, boardId, ...}]
        let list = Array.isArray(data) ? data : [];
        list = await enrichRoomsWithBoard(list, bearer);
        list = await enrichRoomsWithParticipants(list, bearer);
        if (!alive) return;
        setRooms(list);
      } catch {
        if (alive) setRooms([]);
      }
    })();
    return () => {
      alive = false;
    };
  }, [bearer]);

  /** 2) STOMP 클라이언트 1회 초기화 */
  useEffect(() => {
    if (!token) return;
    if (stompRef.current?.client) return;

    const sockUrl = `${WS_URL}?token=${encodeURIComponent(token)}`;
    const sock = new SockJS(sockUrl);
    const client = new StompClient({
      webSocketFactory: () => sock,
      reconnectDelay: 3000,
      connectHeaders: bearer ? { Authorization: bearer } : {},
      debug: () => {},
    });

    client.onConnect = () => {
      if (!stompRef.current) stompRef.current = { client, subs: [] };
      else stompRef.current.client = client;
    };

    client.activate();

    return () => {
      try {
        if (stompRef.current?.subs) stompRef.current.subs.forEach((s) => s.unsubscribe());
        client.deactivate();
      } catch {}
      stompRef.current = null;
    };
  }, [token, bearer]);

  /** 3) 방 목록 변경 시 구독 갱신 */
  useEffect(() => {
    if (!rooms) return;
    const holder = stompRef.current;
    if (!holder?.client || !holder.client.connected) return;

    if (holder.subs?.length) {
      try { holder.subs.forEach((s) => s.unsubscribe()); } catch {}
      holder.subs = [];
    }

    const subs = rooms.map((r) =>
      holder.client.subscribe(`/topic/rooms/${r.id}`, (frame) => {
        const msg = JSON.parse(frame.body);
        const preview = msg.content ?? "";
        const nick = msg.senderNickName ?? msg.senderId;

        setRooms((prev) => {
          const copy = Array.isArray(prev) ? [...prev] : [];
          const idx = copy.findIndex((x) => x.id === r.id);
          if (idx >= 0) {
            copy[idx] = {
              ...copy[idx],
              lastMessage: {
                ...(copy[idx].lastMessage || {}),
                content: preview,
                senderNickName: nick,
                senderId: msg.senderId ?? copy[idx].lastMessage?.senderId ?? null,
                senderProfileImageUrl: msg.senderProfileImageUrl ?? copy[idx].lastMessage?.senderProfileImageUrl ?? null,
                insertedAt: msg.insertedAt,
              },
              unreadCount: (copy[idx].unreadCount ?? 0) + 1,
            };
          }
          return copy;
        });
      })
    );
    holder.subs = subs;
  }, [rooms]);

  /** 방 삭제 */
  const deleteRoom = async (roomId) => {
    if (!roomId) return;
    try {
      setDeleting(roomId);
      await axios.delete(`/api/chat/rooms/${roomId}`, {
        headers: bearer ? { Authorization: bearer } : undefined,
      });
      setRooms((prev) => (Array.isArray(prev) ? prev.filter((r) => r.id !== roomId) : prev));
    } catch (e) {
      alert("채팅방 삭제 중 오류가 발생했습니다.");
    } finally {
      setDeleting(null);
    }
  };

  /** 마지막 발신자 이름/아바타 계산 */
  function lastSenderInfo(r) {
    const lm = r.lastMessage || {};
    const isOther = lm.senderId != null
      ? String(lm.senderId) === String(r.otherMemberId)
      : (lm.senderNickName && r.otherNickName && String(lm.senderNickName).trim().toLowerCase() === String(r.otherNickName).trim().toLowerCase());

    const name = lm.senderNickName
      ? lm.senderNickName
      : isOther
        ? (r.otherNickName ?? r.otherEmail ?? "상대")
        : "나";

    // 아바타: 1) lastMessage.senderProfileImageUrl → 2) 상대가 보낸 경우 otherProfileImageUrl → 3) 기본
    const avatar = lm.senderProfileImageUrl
      || (isOther ? r.otherProfileImageUrl : null)
      || defaultAvatar;

    return { name, isOther, avatar };
  }

  /** -------------------- 렌더 -------------------- */
  if (!rooms) {
    return (
      <div className="d-flex justify-content-center my-5">
        <Spinner />
      </div>
    );
  }
  if (rooms.length === 0) {
    return <div className="container py-4">채팅방이 없습니다.</div>;
  }

  return (
    <div className="container py-4 jn-root">
      <h2 className="mb-3">채팅</h2>
      <ListGroup>
        {rooms.map((r) => {
          const { name: senderName, avatar: senderAvatar } = lastSenderInfo(r);

          const otherName = r.otherNickName ?? r.otherEmail ?? "상대방";
          const preview = r.lastMessage?.content ?? "";
          const unread = r.unreadCount ?? 0;

          // 게시글 메타
          const title = r.boardTitle ?? "";
          const priceText = formatPrice(r.boardPrice);
          const regionText = [r.boardRegionSido, r.boardRegionSigungu].filter(Boolean).join(" ");
          const category = r.boardCategory ?? "";
          const status = r.boardTradeStatus ?? "ON_SALE";
          const thumb = r.boardThumb || defaultThumb;

          return (
            <ListGroup.Item
              key={r.id}
              className="d-flex justify-content-between align-items-center"
            >
              {/* 왼쪽: 게시글 + 마지막 메시지 프리뷰 */}
              <div className="d-flex align-items-center" style={{ gap: 10, maxWidth: "72%" }}>
                <div
                  style={{
                    width: 56,
                    height: 56,
                    borderRadius: 12,
                    overflow: "hidden",
                    background: "#f4f4f4",
                    flex: "0 0 auto",
                  }}
                >
                  <Image
                    src={thumb}
                    alt="썸네일"
                    onError={(e) => (e.currentTarget.src = defaultThumb)}
                    style={{ width: "100%", height: "100%", objectFit: "cover" }}
                  />
                </div>

                <div className="d-flex flex-column" style={{ minWidth: 0 }}>
                  <div className="d-flex align-items-center gap-2">
                    <strong className="text-truncate" title={title} style={{ maxWidth: 320 }}>
                      {title || "(제목 없음)"}
                    </strong>

                    {/* ✅ 마켓 카드와 동일한 색/톤의 상태 뱃지 */}
                    <StatusPill status={status} />
                  </div>

                  <div className="text-muted d-flex flex-wrap" style={{ gap: 10, fontSize: 13 }}>
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
                    {category && (
                      <span className="d-inline-flex align-items-center gap-1">
                        <FaTag /> {category}
                      </span>
                    )}
                  </div>

                  {/* ✅ 마지막 발신자 아바타 + 이름 + 메시지 */}
                  <div className="d-flex align-items-center" style={{ gap: 8, marginTop: 6, minWidth: 0 }}>
                    <Image
                      roundedCircle
                      src={senderAvatar || defaultAvatar}
                      onError={(e) => (e.currentTarget.src = defaultAvatar)}
                      alt={`${senderName} 프로필`}
                      style={{ width: 20, height: 20, objectFit: "cover", flex: "0 0 auto" }}
                    />
                    <div className="text-muted text-truncate" title={preview} style={{ maxWidth: 520 }}>
                      <strong>{senderName ?? otherName}</strong>: {preview}
                    </div>
                  </div>
                </div>
              </div>

              {/* 오른쪽: 뱃지/버튼들 */}
              <div className="d-flex align-items-center gap-2">
                {unread > 0 && <Badge bg="danger">{unread}</Badge>}

                <Button
                  variant="outline-secondary"
                  onClick={() => {
                    // 입장 시 낙관적으로 뱃지 0
                    setRooms((prev) => {
                      const copy = [...prev];
                      const idx = copy.findIndex((x) => x.id === r.id);
                      if (idx >= 0) copy[idx] = { ...copy[idx], unreadCount: 0 };
                      return copy;
                    });
                    navigate(`/chat/rooms/${r.id}`);
                  }}
                >
                  열기
                </Button>

                <Button
                  variant="outline-danger"
                  onClick={() => deleteRoom(r.id)}
                  disabled={deleting === r.id}
                  title="채팅방 삭제"
                >
                  {deleting === r.id ? <Spinner animation="border" size="sm" /> : "삭제"}
                </Button>
              </div>
            </ListGroup.Item>
          );
        })}
      </ListGroup>
    </div>
  );
}
