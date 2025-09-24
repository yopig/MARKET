import { Link, NavLink, useNavigate } from "react-router-dom";
import { useContext, useEffect, useRef, useState } from "react";
import { Badge, Button, Container, Nav, Navbar, Modal } from "react-bootstrap";
import { AuthenticationContext } from "./AuthenticationContextProvider.jsx";
import { toast } from "react-toastify";
import { FaUserCircle } from "react-icons/fa";
import { createPortal } from "react-dom";
import { MemberLogin } from "../feature/member/MemberLogin.jsx";
import "../styles/AppNavBar.css";

import SockJS from "sockjs-client/dist/sockjs.js";
import { Client as StompClient } from "@stomp/stompjs";
import axios from "axios";
import { chatApi } from "../feature/chat/chatApi";

const WS_URL =
  (typeof import.meta !== "undefined" && import.meta.env?.VITE_WS_URL) ||
  (typeof window !== "undefined" && window.__WS_URL) ||
  "http://localhost:8080/ws";

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

/** ===== 알림 유틸 ===== */
function playBeep() {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.type = "sine";
    o.frequency.value = 880;
    g.gain.value = 0.001;
    o.connect(g);
    g.connect(ctx.destination);
    o.start();
    setTimeout(() => { o.stop(); ctx.close(); }, 120);
  } catch {}
}
function flashTitle(message) {
  const original = document.title;
  let i = 0;
  const id = setInterval(() => {
    document.title = i % 2 === 0 ? `🔔 ${message}` : original;
    i += 1;
    if (i > 8) {
      clearInterval(id);
      document.title = original;
    }
  }, 400);
  return id;
}
async function notifyBrowser({ title, body, onClick }) {
  try {
    if (!("Notification" in window)) return;
    let perm = Notification.permission;
    if (perm === "default") perm = await Notification.requestPermission();
    if (perm !== "granted") return;
    const n = new Notification(title || "새 메시지", { body: body || "" });
    if (onClick) n.onclick = onClick;
  } catch {}
}

export function AppNavBar() {
  const { user, logout, isAdmin } = useContext(AuthenticationContext);
  const navigate = useNavigate();

  // ========= 채팅 미읽음 =========
  const [unreadCount, setUnreadCount] = useState(() => {
    try {
      const v = localStorage.getItem("chat_unread_total");
      return v ? Number(v) || 0 : 0;
    } catch { return 0; }
  });
  const [roomIds, setRoomIds] = useState([]);
  const stompRef = useRef/** @type {{client: StompClient|null, subs: any[]}|null} */(null);
  const reconnectTimerRef = useRef(null);

  const prevTotalRef = useRef(unreadCount);
  const initializedRef = useRef(false);
  const flasherRef = useRef(null);
  const reloadDebounceRef = useRef(null);

  const calcTotal = (rooms) =>
    Array.isArray(rooms) ? rooms.reduce((a, r) => a + Number(r?.unreadCount || 0), 0) : 0;

  const broadcastUnread = (n) => {
    const safe = Math.max(0, Number(n || 0));
    try { localStorage.setItem("chat_unread_total", String(safe)); } catch {}
    window.dispatchEvent(new CustomEvent("chat:unread", { detail: { n: safe } }));
  };

  function onNewIncoming({ roomId, senderNickName, content }) {
    // 즉시 증가(낙관) → 사용자에게 바로 보이도록
    setUnreadCount((prev) => {
      const next = Math.max(0, (prev || 0) + 1);
      broadcastUnread(next);
      return next;
    });

    try { if (navigator.vibrate) navigator.vibrate(50); } catch {}
    playBeep();

    try {
      toast.info(
        <span><strong>{senderNickName || "새 메시지"}</strong>{content ? ` : ${content}` : ""}</span>,
        { autoClose: 3000 }
      );
    } catch {}

    notifyBrowser({
      title: senderNickName ? `${senderNickName}의 새 메시지` : "새 메시지",
      body: content || "",
      onClick: () => { window.focus(); if (roomId) navigate(`/chat/rooms/${roomId}`); },
    });

    try {
      if (flasherRef.current) clearInterval(flasherRef.current);
      flasherRef.current = flashTitle("새 메시지!");
    } catch {}
  }

  const debouncedReload = () => {
    if (reloadDebounceRef.current) clearTimeout(reloadDebounceRef.current);
    reloadDebounceRef.current = setTimeout(() => {
      reloadDebounceRef.current = null;
      loadRoomsAndUnread();
    }, 400); // 짧게 디바운스
  };

  /** 1) 항상 chatApi로 서버 합계/roomIds 동기화 */
  async function loadRoomsAndUnread() {
    if (!user) {
      setUnreadCount(0);
      setRoomIds([]);
      broadcastUnread(0);
      prevTotalRef.current = 0;
      return;
    }
    try {
      const data = await chatApi.listMyRooms(); // [{id, unreadCount, ...}]
      const list = Array.isArray(data) ? data : [];
      setRoomIds(list.map((r) => r.id));
      const total = calcTotal(list);

      // 서버 값으로 동기화(증가/감소 모두 허용)
      setUnreadCount(total);
      broadcastUnread(total);

      if (initializedRef.current && total > (prevTotalRef.current || 0)) {
        if (document.hidden) onNewIncoming({ roomId: null, senderNickName: "새 메시지", content: "" });
        else playBeep();
      }
      prevTotalRef.current = total;
      initializedRef.current = true;
    } catch (e) {
      console.error("AppNavBar listMyRooms 실패", e);
      // 실패 시 기존 값을 유지 (배지 깜빡임 방지)
    }
  }

  /** 2) STOMP */
  function connectStomp() {
    const tok = getToken();
    if (!user || !tok) return;

    const sock = new SockJS(`${WS_URL}?token=${encodeURIComponent(tok)}`);
    const client = new StompClient({
      webSocketFactory: () => sock,
      reconnectDelay: 0,
      connectHeaders: { Authorization: `Bearer ${tok}` },
      debug: () => {},
      onConnect: () => {
        stompRef.current = { client, subs: [] };

        // (A) 사용자 큐: 어떤 메시지든 수신되면 네브바 배지를 즉시 +1, 이후 짧게 재조회로 정합성 보강
        const userQueues = [
          "/user/queue/chat/unread",
          "/user/queue/messages",
          "/user/queue/notifications",
        ];
        const qSubs = userQueues.map((dest) =>
          client.subscribe(dest, (frame) => {
            // payload에 미리보기 있으면 표시
            let preview = "", nick = "";
            try {
              const body = JSON.parse(frame.body);
              preview = body?.content || body?.message || "";
              nick = body?.senderNickName || body?.from || "";
            } catch {}
            onNewIncoming({ roomId: null, senderNickName: nick, content: preview });
            debouncedReload(); // 잠시 뒤 정확한 합계 동기화
          })
        );

        // (B) 방 토픽: 구체 메시지를 받으면 즉시 증가
        const roomSubs = roomIds.map((id) =>
          client.subscribe(`/topic/rooms/${id}`, (frame) => {
            try {
              const msg = JSON.parse(frame.body);
              if (String(msg?.senderId) === String(user?.id)) return; // 내가 보낸 건 제외
              onNewIncoming({
                roomId: id,
                senderNickName: msg?.senderNickName ?? null,
                content: msg?.content ?? "",
              });
            } catch {}
            debouncedReload();
          })
        );

        stompRef.current.subs = [...qSubs, ...roomSubs];

        // 연결 직후 동기화
        loadRoomsAndUnread();
      },
      onStompError: scheduleReconnect,
      onWebSocketClose: scheduleReconnect,
    });
    client.activate();
  }

  function scheduleReconnect() {
    if (reconnectTimerRef.current) return;
    reconnectTimerRef.current = setTimeout(() => {
      reconnectTimerRef.current = null;
      if (user) connectStomp();
    }, 1500);
  }

  function disconnectStomp() {
    try {
      if (stompRef.current?.subs) stompRef.current.subs.forEach((s) => s.unsubscribe());
      stompRef.current?.client?.deactivate();
    } catch {}
    stompRef.current = null;
  }

  // 로그인/로그아웃/새로고침
  useEffect(() => {
    if (!user) {
      setUnreadCount(0);
      setRoomIds([]);
      disconnectStomp();
      return;
    }
    loadRoomsAndUnread().then(() => connectStomp());

    const onFocus = () => loadRoomsAndUnread();
    const onVisibility = () => { if (!document.hidden) loadRoomsAndUnread(); };
    window.addEventListener("focus", onFocus);
    document.addEventListener("visibilitychange", onVisibility);

    // 로컬 이벤트: 증가만 반영 (감소는 서버 재조회로만)
    const onBus = (e) => {
      const n = e?.detail?.n;
      if (typeof n === "number") {
        setUnreadCount((prev) => {
          const next = Number.isFinite(n) ? n : 0;
          if (next > prev) {
            prevTotalRef.current = next;
            return next;
          }
          return prev;
        });
      }
    };
    const onStorage = (e) => {
      if (e.key === "chat_unread_total") {
        const raw = e.newValue ? Number(e.newValue) : 0;
        const n = Number.isFinite(raw) ? raw : 0;
        setUnreadCount((prev) => (n > prev ? (prevTotalRef.current = n, n) : prev));
      }
    };
    window.addEventListener("chat:unread", onBus);
    window.addEventListener("storage", onStorage);

    return () => {
      window.removeEventListener("focus", onFocus);
      document.removeEventListener("visibilitychange", onVisibility);
      window.removeEventListener("chat:unread", onBus);
      window.removeEventListener("storage", onStorage);
      disconnectStomp();
      if (reconnectTimerRef.current) { clearTimeout(reconnectTimerRef.current); reconnectTimerRef.current = null; }
      if (flasherRef.current) { clearInterval(flasherRef.current); flasherRef.current = null; }
      if (reloadDebounceRef.current) { clearTimeout(reloadDebounceRef.current); reloadDebounceRef.current = null; }
    };
  }, [user?.id]);

  // roomIds 변경 시 재구독
  useEffect(() => {
    const holder = stompRef.current;
    if (!holder?.client || !holder.client.connected) return;
    try { holder.subs.forEach((s) => s.unsubscribe()); } catch {}
    holder.subs = [];

    const userQueues = [
      "/user/queue/chat/unread",
      "/user/queue/messages",
      "/user/queue/notifications",
    ];
    const qSubs = userQueues.map((dest) =>
      holder.client.subscribe(dest, (frame) => {
        let preview = "", nick = "";
        try {
          const body = JSON.parse(frame.body);
          preview = body?.content || body?.message || "";
          nick = body?.senderNickName || body?.from || "";
        } catch {}
        onNewIncoming({ roomId: null, senderNickName: nick, content: preview });
        debouncedReload();
      })
    );

    const roomSubs = roomIds.map((id) =>
      holder.client.subscribe(`/topic/rooms/${id}`, (frame) => {
        try {
          const msg = JSON.parse(frame.body);
          if (String(msg?.senderId) === String(user?.id)) return;
          onNewIncoming({ roomId: id, senderNickName: msg?.senderNickName ?? null, content: msg?.content ?? "" });
        } catch {}
        debouncedReload();
      })
    );

    holder.subs = [...qSubs, ...roomSubs];
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [roomIds.join(",")]);

  // ========= 기존 UI =========
  const [showDropdown, setShowDropdown] = useState(false);
  const [dropdownPosition, setDropdownPosition] = useState({ top: 0, right: 0 });
  const [expanded, setExpanded] = useState(false);
  const dropdownRef = useRef(null);
  const navbarRef = useRef(null);
  const hoverTimeoutRef = useRef(null);

  const [showLoginModal, setShowLoginModal] = useState(false);
  const handleCloseLoginModal = () => setShowLoginModal(false);
  const handleShowLoginModal = () => setShowLoginModal(true);

  const handleToggle = () => setExpanded(!expanded);
  const handleMouseEnter = () => {
    if (hoverTimeoutRef.current) { clearTimeout(hoverTimeoutRef.current); hoverTimeoutRef.current = null; }
  };
  const handleMouseLeave = () => {
    if (window.innerWidth <= 992 && expanded) {
      hoverTimeoutRef.current = setTimeout(() => setExpanded(false), 300);
    }
  };
  const handleDropdownToggle = (event) => {
    if (!showDropdown) {
      const rect = event.currentTarget.getBoundingClientRect();
      setDropdownPosition({ top: rect.bottom + window.scrollY, right: window.innerWidth - rect.right });
    }
    setShowDropdown(!showDropdown);
  };

  const userDropdownTitle = (
    <span className="fw-bold">
      <FaUserCircle size={24} className="me-2" />
      {user?.nickName}
    </span>
  );

  const CustomDropdown = () => {
    if (!showDropdown) return null;
    return createPortal(
      <div
        ref={dropdownRef}
        style={{
          position: "absolute",
          top: dropdownPosition.top,
          right: dropdownPosition.right,
          backgroundColor: "#f6ece6",
          border: "3px solid black",
          boxShadow: "5px 5px 1px 1px black",
          minWidth: "160px",
          zIndex: 9999,
          overflow: "hidden",
        }}
      >
        <Link to={`/member?email=${user.email}`} className="dropdown-item" onClick={() => setShowDropdown(false)}>
          마이페이지
        </Link>
        <button
          className="dropdown-item text-danger"
          onClick={() => { logout(); navigate("/"); toast.success("로그아웃되었습니다."); setShowDropdown(false); }}
        >
          로그아웃
        </button>
      </div>,
      document.body,
    );
  };

  const navLinkStyle = {
    color: "#555",
    fontFamily: "'Poppins'",
    fontWeight: 500,
    paddingBottom: "0.5rem",
    margin: "0 1.2rem",
    textDecoration: "none",
    position: "relative",
    transition: "color 0.3s ease-in-out",
  };
  const activeLinkStyle = {
    color: "#d9534f",
    fontWeight: 700,
    borderBottom: "1px solid #d9534f",
  };

  return (
    <>
      <Navbar
        expand="xl"
        className="px-4"
        expanded={expanded}
        ref={navbarRef}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      >
        <Container>
          <Navbar.Brand as={Link} to="/" className="d-flex align-items-center">
            <div className="logo-image logo-md" />
          </Navbar.Brand>

          <div className="d-flex align-items-center order-lg-2">
            <Nav className="me-1">
              {user ? (
                <div className="nav-dropdown-container">
                  <Button
                    className="fw-bold"
                    style={{ boxShadow: "none", padding: "0.375rem 0.75rem", color: "#D9534F", backgroundColor: "transparent", border: "none", fontSize: "clamp(0.9rem, 2.5vw, 1.25rem)" }}
                    onClick={handleDropdownToggle}
                  >
                    {userDropdownTitle}
                  </Button>
                  <CustomDropdown />
                </div>
              ) : (
                <Button
                  onClick={handleShowLoginModal}
                  className="fw-bold"
                  style={{ boxShadow: "none", padding: "0.5rem 1.5rem", color: "#D9534F", backgroundColor: "transparent", border: "none", fontSize: "1.25rem" }}
                >
                  LOGIN
                </Button>
              )}
            </Nav>
            <Navbar.Toggle aria-controls="basic-navbar-nav" onClick={handleToggle} />
          </div>

          <Navbar.Collapse id="basic-navbar-nav" className="mt-2">
            <Nav
              className="mx-auto mb-4 mt-3"
              style={{
                display: "flex",
                justifyContent: expanded ? "flex-start" : "center",
                alignItems: expanded ? "flex-start" : "center",
                flexDirection: expanded ? "column" : "row",
                gap: "2rem",
              }}
            >
              {/* 채팅 + 미읽음 뱃지 */}
              <div className="navlink-with-badge" style={{ position: "relative" }}>
                <NavLink
                  to="/chat/rooms"
                  style={({ isActive }) => (isActive ? { ...navLinkStyle, ...activeLinkStyle } : navLinkStyle)}
                  onClick={() => setExpanded(false)}
                >
                  채팅
                </NavLink>
                {user && unreadCount > 0 && (
                  <Badge bg="danger" pill className="navlink-badge" title={`${unreadCount}개의 읽지 않은 메시지`}>
                    {unreadCount > 99 ? "99+" : unreadCount}
                  </Badge>
                )}
              </div>

              <NavLink
                to="/board/list"
                style={({ isActive }) => (isActive ? { ...navLinkStyle, ...activeLinkStyle } : navLinkStyle)}
                onClick={() => setExpanded(false)}
              >
                중고거래
              </NavLink>

              <NavLink
                to="/support"
                style={({ isActive }) => (isActive ? { ...navLinkStyle, ...activeLinkStyle } : navLinkStyle)}
                onClick={() => setExpanded(false)}
              >
                문의하기
              </NavLink>

              {isAdmin() && (
                <NavLink
                  to="/admin"
                  style={({ isActive }) => (isActive ? { ...navLinkStyle, ...activeLinkStyle } : navLinkStyle)}
                  onClick={() => setExpanded(false)}
                >
                  관리자
                </NavLink>
              )}
            </Nav>
          </Navbar.Collapse>
        </Container>
      </Navbar>

      <Modal show={showLoginModal} onHide={handleCloseLoginModal} centered>
        <Modal.Header closeButton>
          <Modal.Title className="w-100 text-center">안전마켓 로그인</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <MemberLogin onLoginSuccess={handleCloseLoginModal} onNavigateToSignup={handleCloseLoginModal} isModal={true} />
        </Modal.Body>
      </Modal>
    </>
  );
}
