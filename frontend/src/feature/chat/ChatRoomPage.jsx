// src/feature/chat/ChatRoomPage.jsx (FULL REPLACE)
import { useContext, useEffect, useMemo, useRef, useState } from "react";
import { useParams } from "react-router";
import { Button, Form, InputGroup, ListGroup, Spinner } from "react-bootstrap";
import SockJS from "sockjs-client/dist/sockjs.js";
import { Client as StompClient } from "@stomp/stompjs";
import axios from "axios";
import { chatApi } from "./chatApi";
import { AuthenticationContext } from "../../common/AuthenticationContextProvider.jsx";

/** -------------------- 유틸 -------------------- */
const DEFAULT_AVATAR = "/user.png";

function getAccessToken(user) {
  return (
    user?.token ||
    (typeof localStorage !== "undefined" &&
      (localStorage.getItem("token") || localStorage.getItem("accessToken"))) ||
    (axios.defaults.headers.common["Authorization"] || "").replace(/^Bearer\s+/i, "")
  );
}

function normalizeMessage(raw) {
  if (!raw) return null;
  return {
    id: raw.id ?? raw.messageId ?? raw.mid,
    roomId: raw.roomId,
    senderId: raw.senderId ?? raw.sender_id ?? raw.fromId ?? raw.from,
    senderNickName:
      raw.senderNickName ??
      raw.senderNickname ??
      raw.sender_name ??
      raw.fromName ??
      raw.nickname ??
      raw.nick,
    senderEmail: raw.senderEmail ?? raw.email,
    senderName: raw.senderName ?? raw.name,
    content: raw.content ?? raw.message ?? "",
    insertedAt: raw.insertedAt ?? raw.createdAt ?? raw.inserted_at,
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
    return ts;
  }
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
  const { user } = useContext(AuthenticationContext);
  const token = useMemo(() => getAccessToken(user), [user]);

  const [messages, setMessages] = useState(null);
  const [input, setInput] = useState("");
  const [connecting, setConnecting] = useState(false);

  // 방/게시글 메타
  const [roomMeta, setRoomMeta] = useState(null);
  const [boardMeta, setBoardMeta] = useState(null); // ◀️ boardId로 보강

  const stompRef = useRef(null);
  const listRef = useRef(null);

  const myId = user?.id ?? user?.memberId ?? user?.userId ?? null;

  /** 방 메타 로드 + 필요 시 게시글 메타 보강 */
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
          const { data } = await axios.get(`/api/chat/rooms/${roomId}`);
          meta = data;
        }

        // 표준화
        const normalized = {
          roomId: meta.roomId ?? roomId,
          boardId: meta.boardId ?? meta.itemId ?? meta.postId ?? null,

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

        // ◀️ 판매자 아바타/닉이 비면 boardId로 보강(BoardDetail이 잘 뜨는 이유 활용)
        if (normalized.boardId && (!normalized.sellerAvatar || !normalized.sellerNick)) {
          try {
            const { data } = await axios.get(`/api/board/${normalized.boardId}`);
            if (!alive) return;
            setBoardMeta({
              authorId: data.authorId ?? data.memberId ?? null,
              authorNick: data.authorNickName ?? data.nickName ?? data.nickname ?? null,
              authorAvatar: data.profileImageUrl ?? null,
            });
          } catch {
            // ignore
          }
        } else {
          setBoardMeta(null);
        }
      } catch {
        if (alive) setRoomMeta(null);
      }
    })();
    return () => {
      alive = false;
    };
  }, [roomId]);

  /** 최초 메시지 로드 */
  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const data = await chatApi.listMessages(roomId, { limit: 50 });
        if (!alive) return;
        const items = data.map(normalizeMessage).filter(Boolean);
        setMessages(items);

        if (items.length > 0) {
          await chatApi.markRead(roomId, items[items.length - 1].id);
          setTimeout(() => listRef.current?.scrollTo?.(0, listRef.current.scrollHeight), 0);
        }
      } catch (e) {
        console.error(e);
        setMessages([]); // 실패해도 렌더는 되게
      }
    })();
    return () => {
      alive = false;
    };
  }, [roomId]);

  /** STOMP 연결 */
  useEffect(() => {
    if (!token) return;
    setConnecting(true);

    const sockUrl = `http://localhost:8080/ws?token=${encodeURIComponent(token)}`;
    const sock = new SockJS(sockUrl);

    const client = new StompClient({
      webSocketFactory: () => sock,
      reconnectDelay: 3000,
      connectHeaders: { Authorization: `Bearer ${token}` },
      onStompError: (f) => console.error("STOMP error", f.headers, f.body),
      onWebSocketClose: (e) => console.warn("WS closed", e?.code, e?.reason),
    });

    client.onConnect = () => {
      setConnecting(false);

      const sub = client.subscribe(`/topic/rooms/${roomId}`, async (frame) => {
        const msg = normalizeMessage(JSON.parse(frame.body));
        if (!msg) return;

        setMessages((prev) => (prev ? [...prev, msg] : [msg]));
        try {
          await chatApi.markRead(roomId, msg.id);
        } catch {}
        setTimeout(() => listRef.current?.scrollTo?.(0, listRef.current.scrollHeight), 0);
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
  }, [roomId, token]);

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
        nick:
          roomMeta.sellerNick ??
          boardMeta?.authorNick ?? // ◀️ 보강
          "판매자",
        avatar:
          roomMeta.sellerAvatar ??
          boardMeta?.authorAvatar ?? // ◀️ 보강
          DEFAULT_AVATAR,
      });
    }

    // buyer
    if (roomMeta?.buyerId != null) {
      const bid = String(roomMeta.buyerId);
      map.set(bid, {
        nick: roomMeta.buyerNick ?? "구매자",
        avatar: roomMeta.buyerAvatar ?? DEFAULT_AVATAR,
      });
    }

    // me (우선순위: user)
    if (myId != null) {
      const mid = String(myId);
      map.set(mid, {
        nick: user?.nickName ?? user?.nickname ?? user?.name ?? user?.email ?? "나",
        avatar:
          user?.profileImageUrl ||
          user?.avatarUrl ||
          user?.imageUrl ||
          user?.photoURL ||
          DEFAULT_AVATAR,
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

    // 메시지 자체에 정보가 있으면 사용
    const name = isMe
      ? user?.nickName ?? user?.nickname ?? user?.name ?? user?.email ?? "나"
      : m.senderNickName ?? m.senderName ?? m.senderEmail ?? m.senderId ?? "상대";
    const avatar = isMe
      ? user?.profileImageUrl || user?.avatarUrl || user?.imageUrl || user?.photoURL || DEFAULT_AVATAR
      : DEFAULT_AVATAR;

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

  return (
    <div className="p-3" style={{ maxWidth: 820, margin: "0 auto" }}>
      <div className="d-flex align-items-center justify-content-between mb-2">
        <h5 className="mb-0">채팅방 #{roomId}</h5>
        <div className="small text-muted">{connecting ? "연결 중..." : "연결됨"}</div>
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

          {messages.map((m) => {
            const isMe = isMyMessage(m, user, myId); // ✅ 내 메시지 = 오른쪽
            const { name, avatar } = viewNameAndAvatar(m, isMe);

            return (
              <ListGroup.Item
                key={m.id ?? Math.random()}
                style={{ border: "none", background: "transparent", padding: "6px 0" }}
              >
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
                    <img
                      src={avatar || DEFAULT_AVATAR}
                      alt={name}
                      onError={(e) => (e.currentTarget.src = DEFAULT_AVATAR)}
                      style={{
                        width: 32,
                        height: 32,
                        borderRadius: "50%",
                        objectFit: "cover",
                        flex: "0 0 auto",
                        boxShadow: "0 1px 0 rgba(0,0,0,0.06)",
                        background: "#f2f2f2",
                      }}
                    />
                  )}

                  {/* 말풍선 */}
                  <div
                    title={m.insertedAt ?? ""}
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
                    <img
                      src={avatar || DEFAULT_AVATAR}
                      alt={name}
                      onError={(e) => (e.currentTarget.src = DEFAULT_AVATAR)}
                      style={{
                        width: 32,
                        height: 32,
                        borderRadius: "50%",
                        objectFit: "cover",
                        flex: "0 0 auto",
                        boxShadow: "0 1px 0 rgba(0,0,0,0.06)",
                        background: "#f2f2f2",
                      }}
                    />
                  )}
                </div>
              </ListGroup.Item>
            );
          })}
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
