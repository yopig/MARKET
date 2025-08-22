import React, { useState, useEffect } from "react";
import { FaRobot } from "react-icons/fa";
import { Chatbot } from "../feature/openai/Chatbot";

export function ChatButton() {
  const [open, setOpen] = useState(false);
  const [windowWidth, setWindowWidth] = useState(window.innerWidth);

  useEffect(() => {
    const handleResize = () => setWindowWidth(window.innerWidth);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // 모바일 너비는 90% 또는 최소 280px 중 큰 값을 씀
  const mobileWidth = Math.min(windowWidth * 0.9, 280);

  let drawerWidth;
  if (windowWidth >= 1200) {
    drawerWidth = 600;
  } else if (windowWidth >= 768) {
    drawerWidth = 450;
  } else {
    drawerWidth = mobileWidth;
  }

  return (
    <>
      {/* 플로팅 버튼 - 네오브루탈리즘 스타일 */}
      <button
        onClick={() => setOpen((prev) => !prev)}
        style={{
          position: "fixed",
          bottom: "80px",
          right: open ? drawerWidth + 30 : 30,
          backgroundColor: "#ffc107", // 노란색으로 변경
          color: "#2C2D31FF",
          border: "3px solid #2C2D31FF",
          borderRadius: "0", // 직각 모서리
          width: "70px",
          height: "70px",
          boxShadow: "5px 5px 0px 0px #2C2D31FF",
          zIndex: 9999,
          transition: "all 0.3s ease",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          cursor: "pointer",
          fontWeight: "bold",
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.transform = "translate(-2px, -2px)";
          e.currentTarget.style.boxShadow = "7px 7px 0px 0px #2C2D31FF";
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = "translate(0, 0)";
          e.currentTarget.style.boxShadow = "5px 5px 0px 0px #2C2D31FF";
        }}
        aria-label={open ? "Close chat" : "Open chat"}
      >
        <FaRobot size={30} />
      </button>

      {/* 챗봇 서랍 - 네오브루탈리즘 스타일 */}
      <div
        style={{
          position: "fixed",
          top: "100px", // 네브바 아래로 조정
          right: open ? 20 : -drawerWidth - 50,
          width: drawerWidth,
          height: "calc(100vh - 140px)",
          backgroundColor: "#ffffff",
          border: "3px solid #2C2D31FF",
          borderRadius: "0",
          boxShadow: open ? "8px 8px 0px 0px #2C2D31FF" : "none",
          zIndex: 9998,
          transition: "all 0.3s ease",
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
        }}
      >
        {/* 헤더 - 베이지색 배경 */}
        <div
          style={{
            padding: "15px 20px",
            borderBottom: "3px solid #2C2D31FF",
            backgroundColor: "#f6ece6", // 베이지색
            color: "#2C2D31FF",
            fontWeight: "700",
            fontSize: "1.2rem",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            fontFamily: "'Poppins', sans-serif",
          }}
        >
          <span style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <FaRobot size={20} />
            펫토피아 챗봇
          </span>
          <button
            onClick={() => setOpen(false)}
            style={{
              background: "#ffffff",
              border: "2px solid #2C2D31FF",
              borderRadius: "0",
              color: "#2C2D31FF",
              fontSize: "1.2rem",
              width: "30px",
              height: "30px",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontWeight: "bold",
              transition: "all 0.2s ease",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = "#ffc107";
              e.currentTarget.style.transform = "translate(-2px, -2px)";
              e.currentTarget.style.boxShadow = "2px 2px 0px 0px #2C2D31FF";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = "#ffffff";
              e.currentTarget.style.transform = "translate(0, 0)";
              e.currentTarget.style.boxShadow = "none";
            }}
            aria-label="Close chat"
          >
            ×
          </button>
        </div>

        {/* 챗봇 본체 */}
        <div
          style={{
            flex: 1,
            overflowY: "auto",
            backgroundColor: "#fdfdfd",
          }}
        >
          <Chatbot />
        </div>
      </div>

      {/* 배경 오버레이 (모바일용) */}
      {open && windowWidth < 768 && (
        <div
          onClick={() => setOpen(false)}
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: "rgba(0, 0, 0, 0.3)",
            zIndex: 9997,
          }}
        />
      )}
    </>
  );
}
