// src/feature/chat/ChatRoomPage.jsx (FULL REPLACE)
import { useContext, useEffect, useMemo, useRef, useState } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { Button, Form, Image, InputGroup, ListGroup, Spinner } from "react-bootstrap";
import SockJS from "sockjs-client/dist/sockjs.js";
import { Client as StompClient } from "@stomp/stompjs";
import axios from "axios";
import { chatApi } from "./chatApi";
import { AuthenticationContext } from "../../common/AuthenticationContextProvider.jsx";
import { FaMapMarkerAlt, FaTag, FaWonSign } from "react-icons/fa";

/** -------------------- 설정/유틸 -------------------- */
const defaultProfileImage = "/user.png"; // public/user.png 존재 확인

// .env에서 VITE_WS_URL 제공 가능(예: http://localhost:8080/ws)
const WS_URL =
  (typeof import.meta !== "undefined" && import.meta.env?.VITE_WS_URL) ||
  (typeof window !== "undefined" && window.__WS_URL) ||
  "http://localhost:8080/ws";

function sanitizeToken(t) {
  if (!t) return null;
  return String(t).replace(/^Bearer\s+/i, "").trim();
}

function getAccessToken(user) {
  const raw =
    user?.token ||
    (typeof localStorage !== "undefined" &&
      (localStorage.getItem("token") || localStorage.getItem("accessToken"))) ||
    axios.defaults.headers.common["Authorization"] ||
    null;
  return sanitizeToken(raw);
}

// 필요 시 동일 오리진 이미지에만 토큰 쿼리 추가(서버가 ?token=... 허용할 때만 사용)
// 기본값 false: 토큰 노출 위험 방지. 허용하려면 VITE_IMG_TOKEN_QUERY=true 지정.
const IMG_TOKEN_QUERY =
  (typeof import.meta !== "undefined" && import.meta.env?.VITE_IMG_TOKEN_QUERY === "true") || false;
function withTokenIfSameOrigin(url, token) {
  try {
    if (!url) return url;
    const u = new URL(url, window.location.origin);
    if (!token) return u.toString();
    // 동일 오리진일 때만 부착(옵션)
    if (IMG_TOKEN_QUERY && u.origin === window.location.origin) {
      if (!u.searchParams.has("token")) u.searchParams.set("token", token);
    }
    return u.toString();
  } catch {
    return url;
  }
}

/** prev를 지키면서 next의 "유의미한 값"만 덮어쓰기 */
function mergeMeta(prev, next) {
  const out = { ...(prev || {}) };
  if (!next) return out;

  const keys = [
    "id",
    "title",
    "price",
    "category",
    "regionSido",
    "regionSigungu",
    "authorNick",
    "authorAvatar",
    "tradeStatus",
    "files",
    "thumb",
  ];

  for (const k of keys) {
    const v = next[k];
    // null/undefined/빈문자열은 덮어쓰지 않음
    const meaningful =
      v !== undefined &&
      v !== null &&
      !(typeof v === "string" && v.trim() === "");
    if (meaningful) out[k] = v;
  }
  return out;
}

/** 메시지 표준화 */
function normalizeMessage(raw) {
  if (!raw) return null;
  return {
    id: raw.id ?? raw.messageId ?? raw.mid ?? null,
    roomId: raw.roomId,
    senderId: raw.senderId ?? raw.sender_id ?? raw.fromId ?? raw.from ?? null,
    senderNickName:
      raw.senderNickName ??
      raw.senderNickname ??
      raw.sender_name ??
      raw.fromName ??
      raw.nickname ??
      raw.nick ??
      null,
    senderEmail: raw.senderEmail ?? raw.email ?? null,
    senderName: raw.senderName ?? raw.name ?? null,
    senderProfileImageUrl:
      raw.senderProfileImageUrl ?? raw.senderAvatar ?? raw.senderImageUrl ?? null,
    content: (raw.content ?? raw.message ?? "").toString(),
    insertedAt: raw.insertedAt ?? raw.createdAt ?? raw.inserted_at ?? null,
  };
}

function formatTime(ts) {
  if (!ts) return "";
  try {
    const d = new Date(ts);
    const hh = String(d.getHours()).padStart(2, "0");
    const mm = String(d.getMinutes()).padStart(2, "0");
    return `${hh}:${mm}`;
  } catch {
    return "";
  }
}

// ■ 날짜 칩/툴팁용 포맷터
function formatDate(ts) {
  if (!ts) return "";
  try {
    const d = new Date(ts);
    // 예: 2025. 09. 11. (목)
    return d.toLocaleDateString("ko-KR", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      weekday: "short",
    });
  } catch {
    return "";
  }
}

function formatDateTime(ts) {
  if (!ts) return "";
  try {
    const d = new Date(ts);
    const yyyy = d.getFullYear();
    const MM = String(d.getMonth() + 1).padStart(2, "0");
    const dd = String(d.getDate()).padStart(2, "0");
    const hh = String(d.getHours()).padStart(2, "0");
    const mm = String(d.getMinutes()).padStart(2, "0");
    const ss = String(d.getSeconds()).padStart(2, "0");
    return `${yyyy}-${MM}-${dd} ${hh}:${mm}:${ss}`;
  } catch {
    return ts;
  }
}

/** 숫자 가격 포맷 */
function formatPrice(v) {
  if (v === null || v === undefined || v === "") return null;
  const num = Number(v);
  if (Number.isNaN(num)) return null;
  return num.toLocaleString();
}

/** 대표 이미지 추출: 문자열/객체(url,path,link) 모두 지원 */
function pickThumb(files) {
  if (!Array.isArray(files)) return null;

  const getUrl = (f) => {
    if (typeof f === "string") return f;
    if (f && typeof f === "object") {
      return f.url || f.path || f.link || f.imageUrl || f.thumbnailUrl || null;
    }
    return null;
  };

  for (const f of files) {
    const u = getUrl(f);
    if (u && /\.(jpe?g|png|gif|webp)$/i.test(u)) return u;
  }
  // 확장자 확인이 불가하면 첫 번째 유효 URL 반환
  for (const f of files) {
    const u = getUrl(f);
    if (u) return u;
  }
  return null;
}

/** "내 메시지" 판별: 확실할 때만 true */
function isMyMessage(msg, user, myId) {
  const myPrimary = myId ?? user?.id ?? user?.memberId ?? user?.userId ?? null;
  if (myPrimary != null && msg.senderId != null) {
    return String(msg.senderId) === String(myPrimary);
  }
  const toKey = (v) => String(v).trim().toLowerCase();
  const meStrings = [user?.email, user?.nickName ?? user?.nickname, user?.name]
    .filter(Boolean)
    .map(toKey);
  const senderStrings = [msg.senderEmail, msg.senderNickName, msg.senderName]
    .filter(Boolean)
    .map(toKey);
  if (meStrings.length && senderStrings.length) {
    if (meStrings.some((m) => senderStrings.includes(m))) return true;
  }
  return false;
}

/** -------------------- 컴포넌트 -------------------- */
export function ChatRoomPage() {
  const { roomId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useContext(AuthenticationContext);
  const token = useMemo(() => getAccessToken(user), [user]);
  const bearer = token ? `Bearer ${token}` : null;

  const [messages, setMessages] = useState(null);
  const [input, setInput] = useState("");
  const [connecting, setConnecting] = useState(false);

  // 방/게시글 메타
  const [roomMeta, setRoomMeta] = useState(null);

  /** ▶ 게시글(상품) 메타: 챗룸 헤더에 표시할 정보 */
  const [itemMeta, setItemMeta] = useState(() => {
    const hint = location.state?.boardHint || null;
    if (!hint) return null;
    return {
      id: hint.id ?? null,
      title: hint.title ?? "",
      price: hint.price ?? null,
      category: hint.category ?? "",
      regionSido: hint.regionSido ?? "",
      regionSigungu: hint.regionSigungu ?? "",
      authorNick: hint.authorNick ?? "",
      authorAvatar: hint.authorAvatar ?? null,
      tradeStatus: hint.tradeStatus ?? "ON_SALE",
      files: [],
      thumb: hint.thumb ?? null,
    };
  });

  const stompRef = useRef(null);
  const listRef = useRef(null);
  const myId = user?.id ?? user?.memberId ?? user?.userId ?? null;

  /** 방 메타 로드 */
  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        let meta;
        for (const fn of ["getRoomMeta", "getRoom", "getRoomInfo", "getRoomSummary"]) {
          if (chatApi?.[fn]) {
            meta = await chatApi[fn](roomId);
            if (meta) break;
          }
        }
        if (!meta) {
          const { data } = await axios.get(`/api/chat/rooms/${roomId}`, {
            headers: bearer ? { Authorization: bearer } : undefined,
          });
          meta = data;
        }

        const normalized = {
          roomId: meta.roomId ?? roomId,
          boardId: meta.boardId ?? meta.itemId ?? meta.postId ?? null,

          boardTitle: meta.boardTitle ?? meta.title ?? null,
          boardPrice: meta.boardPrice ?? meta.price ?? null,
          boardCategory: meta.boardCategory ?? meta.category ?? null,
          boardRegionSido: meta.boardRegionSido ?? meta.regionSido ?? null,
          boardRegionSigungu: meta.boardRegionSigungu ?? meta.regionSigungu ?? null,
          boardThumb:
            meta.boardThumb ??
            meta.boardImageUrl ??
            meta.thumbnailUrl ??
            (Array.isArray(meta.files)
              ? meta.files.find((f) => {
              const u =
                typeof f === "string"
                  ? f
                  : f?.url || f?.path || f?.imageUrl || f?.thumbnailUrl || "";
              return /\.(jpe?g|png|gif|webp)$/i.test(u);
            }) || null
              : null),

          sellerId: meta.sellerId ?? meta.boardAuthorId ?? meta.seller?.id ?? null,
          sellerNick:
            meta.sellerNick ??
            meta.sellerNickname ??
            meta.seller?.nickName ??
            meta.seller?.nickname ??
            meta.sellerName ??
            null,
          sellerAvatar:
            meta.sellerProfileImageUrl ??
            meta.seller?.profileImageUrl ??
            meta.sellerAvatar ??
            meta.sellerImageUrl ??
            null,

          buyerId: meta.buyerId ?? meta.buyer?.id ?? null,
          buyerNick:
            meta.buyerNick ??
            meta.buyerNickname ??
            meta.buyer?.nickName ??
            meta.buyer?.nickname ??
            meta.buyerName ??
            null,
          buyerAvatar:
            meta.buyerProfileImageUrl ??
            meta.buyer?.profileImageUrl ??
            meta.buyerAvatar ??
            meta.buyerImageUrl ??
            null,
        };

        if (!alive) return;
        setRoomMeta(normalized);

        const fromRoom = {
          id: normalized.boardId ?? null,
          title: normalized.boardTitle ?? undefined,
          price: normalized.boardPrice ?? undefined,
          category: normalized.boardCategory ?? undefined,
          regionSido: normalized.boardRegionSido ?? undefined,
          regionSigungu: normalized.boardRegionSigungu ?? undefined,
          authorNick: normalized.sellerNick ?? undefined,
          authorAvatar: normalized.sellerAvatar ?? undefined,
          thumb: normalized.boardThumb ?? undefined,
        };
        setItemMeta((prev) => mergeMeta(prev, fromRoom));
      } catch (e) {
        console.error("load room meta failed", e);
        if (alive) setRoomMeta(null);
      }
    })();
    return () => {
      alive = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [roomId, bearer]);

  /** ▶ 게시글(상품) 상세 보강 */
  useEffect(() => {
    let alive = true;
    (async () => {
      const boardId = roomMeta?.boardId ?? itemMeta?.id ?? null;
      if (!boardId) return;

      try {
        const { data } = await axios.get(`/api/board/${boardId}`, {
          headers: bearer ? { Authorization: bearer } : undefined,
        });
        if (!alive) return;
        const fromDetail = {
          id: data.id ?? boardId,
          title: data.title ?? "",
          price: data.price ?? null,
          category: data.category ?? "",
          regionSido: data.regionSido ?? "",
          regionSigungu: data.regionSigungu ?? "",
          authorNick: data.authorNickName ?? data.nickName ?? data.nickname ?? "",
          authorAvatar: data.profileImageUrl ?? null,
          tradeStatus: data.tradeStatus ?? "ON_SALE",
          files: Array.isArray(data.files) ? data.files : [],
          thumb: undefined,
        };
        setItemMeta((prev) => {
          const merged = mergeMeta(prev, fromDetail);
          if (!merged.thumb) merged.thumb = pickThumb(merged.files || []) ?? null;
          return merged;
        });
      } catch (e) {
        console.warn("board detail load failed", e?.response?.status);
      }
    })();
    return () => {
      alive = false;
    };
  }, [roomMeta?.boardId]); // eslint-disable-line react-hooks/exhaustive-deps

  /** 최초 메시지 로드 */
  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const data = await chatApi.listMessages(roomId, { limit: 50 });
        if (!alive) return;
        const items = data.map(normalizeMessage).filter(Boolean);
        setMessages(items);

        // ✅ id 없으면 markRead 스킵 + 실패해도 메시지 날리지 않음
        if (items.length > 0 && items[items.length - 1].id) {
          try {
            await chatApi.markRead(roomId, items[items.length - 1].id);
          } catch (e) {
            console.warn("markRead(initial) failed", e?.response?.status);
          }
        }

        // 스크롤 하단
        setTimeout(() => {
          const el = listRef.current;
          if (el) el.scrollTop = el.scrollHeight;
        }, 0);
      } catch (e) {
        console.error(e);
        setMessages([]); // 실패해도 렌더는 되게
      }
    })();
    return () => {
      alive = false;
    };
  }, [roomId]);

  /** 메시지 변경 시 자동 스크롤(수신/송신 모두) */
  useEffect(() => {
    const el = listRef.current;
    if (!el || !messages) return;
    el.scrollTop = el.scrollHeight;
  }, [messages?.length]);

  /** STOMP 연결 */
  useEffect(() => {
    if (!token) return;
    setConnecting(true);

    const sockUrl = `${WS_URL}?token=${encodeURIComponent(token)}`;
    const sock = new SockJS(sockUrl);

    const client = new StompClient({
      webSocketFactory: () => sock,
      reconnectDelay: 3000,
      connectHeaders: bearer ? { Authorization: bearer } : {},
      onStompError: (f) => console.error("STOMP error", f.headers, f.body),
      onWebSocketClose: (e) => {
        console.warn("WS closed", e?.code, e?.reason);
        setConnecting(true);
      },
      debug: () => {}, // 로그 지저분하면 무음
    });

    client.onConnect = () => {
      setConnecting(false);

      const sub = client.subscribe(`/topic/rooms/${roomId}`, async (frame) => {
        const msg = normalizeMessage(JSON.parse(frame.body));
        if (!msg) return;

        setMessages((prev) => (prev ? [...prev, msg] : [msg]));
        // 새 메시지 읽음 처리: id 없으면 스킵
        if (msg.id) {
          try {
            await chatApi.markRead(roomId, msg.id);
          } catch {}
        }
      });

      stompRef.current = { client, sub };
    };

    client.activate();

    return () => {
      try {
        if (stompRef.current?.sub) stompRef.current.sub.unsubscribe();
        client.deactivate();
      } catch {}
      stompRef.current = null;
    };
  }, [roomId, token, bearer]);

  /** 전송 */
  const sendMessage = () => {
    const content = input.trim();
    if (!content) return;
    const holder = stompRef.current;
    const client = holder?.client ?? null;

    if (!client || !client.connected) {
      alert("연결 준비 중입니다.");
      return;
    }

    client.publish({
      destination: `/app/rooms/${roomId}/send`,
      body: JSON.stringify({ content }),
    });
    setInput("");
  };

  /** --- 표시용 닉/아바타 매핑 --- */
  function participantsMap() {
    const map = new Map();

    // seller
    if (roomMeta?.sellerId != null) {
      const sid = String(roomMeta.sellerId);
      map.set(sid, {
        nick: roomMeta.sellerNick ?? itemMeta?.authorNick ?? "판매자",
        avatar:
          withTokenIfSameOrigin(
            roomMeta.sellerAvatar ?? itemMeta?.authorAvatar ?? defaultProfileImage,
            token
          ) || defaultProfileImage,
      });
    }

    // buyer
    if (roomMeta?.buyerId != null) {
      const bid = String(roomMeta.buyerId);
      map.set(bid, {
        nick: roomMeta.buyerNick ?? "구매자",
        avatar:
          withTokenIfSameOrigin(roomMeta.buyerAvatar ?? defaultProfileImage, token) ||
          defaultProfileImage,
      });
    }

    // me
    if (myId != null) {
      const mid = String(myId);
      map.set(mid, {
        nick: user?.nickName ?? user?.nickname ?? user?.name ?? user?.email ?? "나",
        avatar:
          withTokenIfSameOrigin(
            user?.profileImageUrl ||
            user?.avatarUrl ||
            user?.imageUrl ||
            user?.photoURL ||
            defaultProfileImage,
            token
          ) || defaultProfileImage,
      });
    }

    return map;
  }

  function viewNameAndAvatar(m, isMe) {
    const map = participantsMap();
    const sid = m.senderId != null ? String(m.senderId) : null;

    if (sid && map.has(sid)) {
      const p = map.get(sid);
      return { name: p.nick, avatar: p.avatar };
    }

    const name = isMe
      ? user?.nickName ?? user?.nickname ?? user?.name ?? user?.email ?? "나"
      : m.senderNickName ?? m.senderName ?? m.senderEmail ?? m.senderId ?? "상대";
    const avatar = isMe
      ? withTokenIfSameOrigin(
      user?.profileImageUrl ||
      user?.avatarUrl ||
      user?.imageUrl ||
      user?.photoURL ||
      defaultProfileImage,
      token
    ) || defaultProfileImage
      : withTokenIfSameOrigin(m.senderProfileImageUrl, token) || defaultProfileImage;

    return { name, avatar };
  }

  /** ------------- 렌더 ------------- */
  if (!messages) {
    return (
      <div className="p-3">
        <Spinner animation="border" size="sm" /> 불러오는 중...
      </div>
    );
  }

  const priceText = formatPrice(itemMeta?.price);
  const regionText = [itemMeta?.regionSido, itemMeta?.regionSigungu].filter(Boolean).join(" ");
  const rawThumb = itemMeta?.thumb ?? pickThumb(itemMeta?.files || []);
  const thumb = withTokenIfSameOrigin(rawThumb, token);

  // ✅ BoardDetail과 동일한 status-chip 배지 사용
  const tradeClass =
    itemMeta?.tradeStatus === "SOLD_OUT"
      ? "sold"
      : itemMeta?.tradeStatus === "RESERVED"
        ? "reserved"
        : "onsale";
  const tradeText =
    itemMeta?.tradeStatus === "SOLD_OUT"
      ? "판매완료"
      : itemMeta?.tradeStatus === "RESERVED"
        ? "예약중"
        : "판매중";
  const tradeBadge = <span className={`status-chip ${tradeClass}`}>{tradeText}</span>;

  return (
    <div className="p-3" style={{ maxWidth: 820, margin: "0 auto" }}>
      {/* ▶ 게시물(상품) 헤더 */}
      {(itemMeta?.id || itemMeta?.title || thumb) && (
        <div
          className="chatroom-header"
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 12,
            padding: "10px 12px",
            border: "1px solid #eee",
            borderRadius: 12,
            background: "#fff",
            marginBottom: 12,
            position: "sticky",
            top: 8,
            zIndex: 1,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{ width: 60, height: 60, borderRadius: 12, overflow: "hidden", background: "#fafafa" }}>
              {thumb ? (
                <img
                  src={thumb}
                  alt="대표 이미지"
                  onError={(e) => (e.currentTarget.style.display = "none")}
                  style={{ width: "100%", height: "100%", objectFit: "cover" }}
                />
              ) : (
                <div
                  style={{
                    width: "100%",
                    height: "100%",
                    display: "grid",
                    placeItems: "center",
                    fontSize: 12,
                    color: "#999",
                  }}
                >
                  No Image
                </div>
              )}
            </div>

            <div>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 2 }}>
                <strong style={{ fontSize: 16 }}>{itemMeta?.title || "제목 없음"}</strong>
                {tradeBadge}
              </div>

              <div style={{ display: "flex", flexWrap: "wrap", gap: 10, color: "#666", fontSize: 13 }}>
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
                {itemMeta?.category && (
                  <span className="d-inline-flex align-items-center gap-1">
                    <FaTag /> {itemMeta.category}
                  </span>
                )}
              </div>

              {itemMeta?.authorNick && (
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 6, fontSize: 12, color: "#777" }}>
                  <Image
                    roundedCircle
                    src={withTokenIfSameOrigin(itemMeta.authorAvatar || defaultProfileImage, token)}
                    onError={(e) => (e.currentTarget.src = defaultProfileImage)}
                    alt={`${itemMeta.authorNick ?? "익명"} 프로필`}
                    style={{ width: 20, height: 20, objectFit: "cover" }}
                  />
                  <span>{itemMeta.authorNick}</span>
                </div>
              )}
            </div>
          </div>

          <div>
            <Button
              size="sm"
              variant="outline-primary"
              disabled={!itemMeta?.id}
              onClick={() => itemMeta?.id && navigate(`/board/${itemMeta.id}`)}
              title={itemMeta?.id ? "게시글 상세로 이동" : "게시글 ID가 없어 이동할 수 없습니다"}
            >
              게시글 보러가기
            </Button>
          </div>
        </div>
      )}

      <div className="d-flex align-items-center justify-content-between mb-2">
        <h5 className="mb-0">{itemMeta?.title || `채팅방 #${roomId}`}</h5>
        <div className="small text-muted">{connecting ? "연결 중..." : ""}</div>
      </div>

      {/* 메시지 영역 */}
      <div
        ref={listRef}
        style={{
          border: "1px solid #eee",
          borderRadius: 12,
          height: "60vh",
          minHeight: 420,
          overflowY: "auto",
          padding: 12,
          marginBottom: 12,
          background: "#fafafa",
        }}
      >
        <ListGroup as="div" variant="flush" style={{ display: "flex", gap: 6 }}>
          {messages.length === 0 && (
            <div style={{ color: "#888", fontSize: 13, textAlign: "center", paddingTop: 24 }}>
              대화를 시작해보세요!
            </div>
          )}

          {/* 날짜 구분선 포함 렌더 */}
          {(() => {
            let lastDayKey = null;
            return messages.map((m, idx) => {
              const isMe = isMyMessage(m, user, myId);
              const { name, avatar } = viewNameAndAvatar(m, isMe);
              const key = m.id ?? `${m.insertedAt ?? ""}-${idx}`;

              // 날짜 구분선 판단(일 단위)
              const dayKey = m.insertedAt ? new Date(m.insertedAt).toDateString() : "noDate";
              const needDivider = dayKey !== lastDayKey;
              lastDayKey = dayKey;

              return (
                <div key={key}>
                  {needDivider && m.insertedAt && (
                    <div style={{ display: "flex", justifyContent: "center", margin: "10px 0" }}>
                      <span
                        style={{
                          fontSize: 12,
                          color: "#666",
                          background: "#fff",
                          border: "1px solid #e5e5e5",
                          padding: "3px 10px",
                          borderRadius: 999,
                          boxShadow: "0 1px 0 rgba(0,0,0,0.03)",
                        }}
                      >
                        {formatDate(m.insertedAt)}
                      </span>
                    </div>
                  )}

                  <ListGroup.Item style={{ border: "none", background: "transparent", padding: "6px 0" }}>
                    <div
                      style={{
                        display: "flex",
                        justifyContent: isMe ? "flex-end" : "flex-start",
                        alignItems: "flex-end",
                        gap: 8,
                      }}
                    >
                      {/* 상대(왼쪽) 아바타 */}
                      {!isMe && (
                        <Image
                          roundedCircle
                          src={avatar || defaultProfileImage}
                          onError={(e) => (e.currentTarget.src = defaultProfileImage)}
                          alt={`${name ?? "상대"} 프로필`}
                          style={{
                            width: 32,
                            height: 32,
                            objectFit: "cover",
                            flex: "0 0 auto",
                            boxShadow: "0 1px 0 rgba(0,0,0,0.06)",
                            background: "#f2f2f2",
                          }}
                        />
                      )}

                      {/* 말풍선 */}
                      <div
                        title={formatDateTime(m.insertedAt)}
                        style={{
                          maxWidth: "72%",
                          background: isMe ? "#e6f2ff" : "#fff",
                          border: `1px solid ${isMe ? "#d6e9ff" : "#eee"}`,
                          padding: "8px 10px",
                          borderRadius: 12,
                          boxShadow: "0 1px 0 rgba(0,0,0,0.03)",
                          color: "#222",
                          wordBreak: "break-word",
                          borderTopLeftRadius: isMe ? 12 : 6,
                          borderTopRightRadius: isMe ? 6 : 12,
                        }}
                      >
                        <div
                          style={{
                            display: "flex",
                            alignItems: "baseline",
                            justifyContent: "space-between",
                            gap: 12,
                            marginBottom: 2,
                          }}
                        >
                          <div style={{ fontSize: 11, color: "#666", fontWeight: 600 }}>{name}</div>
                          <div style={{ fontSize: 11, color: "#999" }}>{formatTime(m.insertedAt)}</div>
                        </div>

                        <div style={{ whiteSpace: "pre-wrap", fontSize: 14 }}>{m.content}</div>
                      </div>

                      {/* 내(오른쪽) 아바타 */}
                      {isMe && (
                        <Image
                          roundedCircle
                          src={avatar || defaultProfileImage}
                          onError={(e) => (e.currentTarget.src = defaultProfileImage)}
                          alt={`${name ?? "나"} 프로필`}
                          style={{
                            width: 32,
                            height: 32,
                            objectFit: "cover",
                            flex: "0 0 auto",
                            boxShadow: "0 1px 0 rgba(0,0,0,0.06)",
                            background: "#f2f2f2",
                          }}
                        />
                      )}
                    </div>
                  </ListGroup.Item>
                </div>
              );
            });
          })()}
        </ListGroup>
      </div>

      {/* 입력영역 */}
      <InputGroup>
        <Form.Control
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={connecting ? "연결 중..." : "메시지를 입력하세요"}
          onKeyDown={(e) => (e.key === "Enter" ? sendMessage() : null)}
          disabled={connecting}
        />
        <Button onClick={sendMessage} disabled={connecting || !input.trim()}>
          전송
        </Button>
      </InputGroup>
    </div>
  );
}

// 기본 내보내기(라우터가 default import로 가져올 때 대비)
export default ChatRoomPage;
