import { Outlet } from "react-router";
import { AppNavBar } from "./AppNavBar.jsx";
import { AppFooter } from "./AppFooter.jsx";
import { ChatButton } from "./ChatButton.jsx";

// 간단한 광고 자리 컴포넌트
function AdSpace({ width = 250, height = 400, position }) {
  return (
    <div
      className="ad-space"
      style={{
        width: `${width}px`,
        height: `${height}px`,
        backgroundColor: "#f6ece6",
        border: "2px dashed #2C2D31FF",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        borderRadius: "0px",
        marginBottom: "20px",
        boxShadow: "5px 5px 0px 0px #2C2D31FF",
      }}
    >
      <div
        style={{ textAlign: "center", color: "#2C2D31FF", fontSize: "12px" }}
      >
        <div style={{ fontSize: "16px" }}>📺</div>
        <div>광고</div>
        <div>
          {width}×{height}
        </div>
        <div style={{ fontSize: "10px" }}>{position}</div>
      </div>
    </div>
  );
}

export function MainLayout() {
  return (
    <div style={{ position: "relative", minHeight: "100vh" }}>
      {/* 기존 main-layout 그대로 유지 - 절대 건드리지 않음 */}
      <div className="main-layout">
        <div className="main-container">
          {/* 기본 네비게이션 바 - 카드 상단에 위치 */}
          <AppNavBar />

          {/* 메인 콘텐츠와 푸터를 flex로 감싸기 */}
          <div className="main-content-wrapper">
            {/* 메인 콘텐츠 영역 */}
            <div className="content-area">
              <Outlet />
            </div>

            {/* 푸터 - 항상 맨 아래 */}
            <div className="footer-area p-0 mx-0">
              <AppFooter />
            </div>
          </div>

          {/* 플로팅 채팅 버튼 - 우측 하단 고정 */}
          <div className="chat-button-container">
            <ChatButton />
          </div>
        </div>
      </div>

      {/* 왼쪽 광고 - 절대 위치로 메인 컨테이너 바깥에 배치 */}
      <div
        className="left-ad-area"
        style={{
          position: "fixed",
          left: "20px",
          top: "50%",
          transform: "translateY(-50%)",
          zIndex: 5,
          display: "flex",
          flexDirection: "column",
          gap: "15px",
        }}
      >
        <AdSpace width={200} height={650} position="왼쪽" />
        {/*<AdSpace width={200} height={200} position="왼쪽2" />*/}
      </div>

      {/* 오른쪽 광고 - 절대 위치로 메인 컨테이너 바깥에 배치 */}
      <div
        className="right-ad-area"
        style={{
          position: "fixed",
          right: "20px",
          top: "50%",
          transform: "translateY(-50%)",
          zIndex: 5,
          display: "flex",
          flexDirection: "column",
          gap: "15px",
        }}
      >
        <AdSpace width={200} height={650} position="오른쪽" />
        {/*<AdSpace width={200} height={200} position="오른쪽2" />*/}
      </div>

      {/* 반응형: 작은 화면에서 광고 숨기기 */}
      <style>{`
        @media (max-width: 1875px) {
          .left-ad-area,
          .right-ad-area {
            display: none !important;
          }
        }
      `}</style>
    </div>
  );
}
