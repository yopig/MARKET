// src/feature/chat/ChatListPage.jsx
import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router";
import { Badge, Button, ListGroup, Spinner } from "react-bootstrap";
import { chatApi } from "./chatApi";
import SockJS from "sockjs-client/dist/sockjs.js";
import { Client as StompClient } from "@stomp/stompjs";
import axios from "axios";

function getToken() {
  return (
    (typeof localStorage !== "undefined" && (localStorage.getItem("token") || localStorage.getItem("accessToken"))) ||
    (axios.defaults.headers.common["Authorization"] || "").replace(/^Bearer\s+/i, "")
  );
}

export function ChatListPage() {
  const [rooms, setRooms] = useState(null);
  const navigate = useNavigate();
  const token = useMemo(() => getToken(), []);
  const stompRef = useRef(null);

  // 리스트 초기 로드
  useEffect(() => {
    let alive = true;
    chatApi
      .listMyRooms()
      .then((data) => alive && setRooms(Array.isArray(data) ? data : []))
      .catch(() => alive && setRooms([]));
    return () => { alive = false; };
  }, []);

  // STOMP 연결 + 각 방 구독하여 실시간 반영
  useEffect(() => {
    if (!rooms || !token) return;

    // 기존 연결 정리
    if (stompRef.current?.client) {
      try { stompRef.current.client.deactivate(); } catch {}
      stompRef.current = null;
    }

    const sockUrl = `http://localhost:8080/ws?token=${encodeURIComponent(token)}`;
    const sock = new SockJS(sockUrl);
    const client = new StompClient({
      webSocketFactory: () => sock,
      reconnectDelay: 3000,
      connectHeaders: { Authorization: `Bearer ${token}` },
    });

    client.onConnect = () => {
      const subs = [];

      rooms.forEach((r) => {
        const sub = client.subscribe(`/topic/rooms/${r.id}`, (frame) => {
          const msg = JSON.parse(frame.body);
          const preview = msg.content ?? "";
          const nick = msg.senderNickName ?? msg.senderId;

          setRooms((prev) => {
            const copy = Array.isArray(prev) ? [...prev] : [];
            const idx = copy.findIndex((x) => x.id === r.id);
            if (idx >= 0) {
              copy[idx] = {
                ...copy[idx],
                lastMessage: { ...(copy[idx].lastMessage || {}), content: preview, senderNickName: nick, insertedAt: msg.insertedAt },
                unreadCount: (copy[idx].unreadCount ?? 0) + 1, // 화면에서는 증가, 방 진입 시 markRead로 서버에서 0 처리
              };
            }
            return copy;
          });
        });
        subs.push(sub);
      });

      stompRef.current = { client, subs };
    };

    client.activate();

    return () => {
      try {
        if (stompRef.current?.subs) stompRef.current.subs.forEach((s) => s.unsubscribe());
        client.deactivate();
      } catch {}
      stompRef.current = null;
    };
  }, [rooms, token]);

  if (!rooms) return <div className="d-flex justify-content-center my-5"><Spinner /></div>;
  if (rooms.length === 0) return <div className="container py-4">채팅방이 없습니다.</div>;

  return (
    <div className="container py-4">
      <h2 className="mb-3">채팅</h2>
      <ListGroup>
        {rooms.map((r) => {
          const otherName = r.otherNickName ?? r.otherEmail ?? "상대방";
          const preview = r.lastMessage?.content ?? "";
          const unread = r.unreadCount ?? 0;
          return (
            <ListGroup.Item key={r.id} className="d-flex justify-content-between align-items-center">
              <div
                onClick={() => {
                  // 낙관적 업데이트: 들어가자마자 뱃지 0으로
                  setRooms((prev) => {
                    const copy = [...prev];
                    const idx = copy.findIndex((x) => x.id === r.id);
                    if (idx >= 0) copy[idx] = { ...copy[idx], unreadCount: 0 };
                    return copy;
                  });
                  navigate(`/chat/rooms/${r.id}`);
                }}
                style={{ cursor: "pointer", maxWidth: "70%" }}
                title={preview}
              >
                <div className="fw-bold">
                  {otherName}
                  {r.boardTitle ? <small className="text-muted"> · {r.boardTitle}</small> : null}
                </div>
                <div className="text-muted text-truncate">{preview}</div>
              </div>
              <div className="d-flex align-items-center gap-2">
                {unread > 0 && <Badge bg="danger">{unread}</Badge>}
                <Button variant="outline-secondary" onClick={() => navigate(`/chat/rooms/${r.id}`)}>
                  열기
                </Button>
              </div>
            </ListGroup.Item>
          );
        })}
      </ListGroup>
    </div>
  );
}
