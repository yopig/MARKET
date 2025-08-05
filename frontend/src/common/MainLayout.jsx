import { Outlet } from "react-router";
import { AppNavBar } from "./AppNavBar.jsx";
import { Card, Container, Button } from "react-bootstrap";
import { AppFooter } from "./AppFooter.jsx";
import { ChatButton } from "./ChatButton.jsx";
import { useContext } from "react";
import { AuthenticationContext } from "./AuthenticationContextProvider.jsx";
import { useNavigate } from "react-router";

export function MainLayout() {
  const { isAdmin } = useContext(AuthenticationContext);
  const navigate = useNavigate();

  return (
    <div
      className="min-vh-100"
      style={{
        backgroundColor: "#033C33", // 초록색 배경
        position: "relative", // 플로팅 버튼 절대 위치 기준
      }}
    >
      {/* 고정 네비바 - 카드와 연결되어 보이도록 스타일링 */}
      <div
        style={{
          position: "fixed",
          top: 0,
          left: "50%",
          transform: "translateX(-50%)",
          width: "100%",
          maxWidth: "1000px", // 카드와 같은 최대 너비
          zIndex: 1030,
          padding: "0 20px", // 좌우 여백
        }}
      >
        <div
          style={{
            borderRadius: "0 0 12px 12px", // 하단만 둥글게
            overflow: "visible", // 드롭다운이 보이도록 변경
            boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1)", // 네비바에 그림자 추가
          }}
        >
          <AppNavBar />
        </div>
      </div>

      {/* 네비바 높이만큼 상단 여백 추가 */}
      <div style={{ padding: "100px 0 20px 0" }}>
        {/* 전체를 감싸는 카드 */}
        <Container className="h-100">
          <Card
            className="shadow-lg mx-auto"
            style={{
              maxWidth: "1000px", // 카드 최대 너비
              minHeight: "calc(100vh - 140px)", // 화면 높이에서 패딩과 네비바 높이 제외
              borderRadius: "12px 12px 12px 12px", // 상단도 둥글게 (네비바와 시각적으로 분리)
              marginTop: "0", // 네비바와 카드 사이 간격 제거
              overflow: "hidden",
              position: "relative", // 플로팅 버튼 절대 위치 기준
              border: "none", // 기본 테두리 제거
            }}
          >
            {/* 카드 내부 레이아웃 */}
            <div className="d-flex flex-column h-100">
              {/* 메인 콘텐츠 영역 - 상단 패딩 추가로 네비바와 겹치지 않게 */}
              <div className="flex-grow-1 p-4" style={{ paddingTop: "2rem" }}>
                <Outlet />
              </div>

              {/* 푸터 - 카드 하단 */}
              <AppFooter />
            </div>

            {/* 플로팅 채팅 버튼 - 카드 내부 우하단 */}
            <div
              style={{
                position: "absolute",
                bottom: "20px",
                right: "20px",
                display: "flex",
                flexDirection: "column",
                alignItems: "flex-end",
                gap: "10px",
              }}
            >
              {/* 관리자 회원목록 버튼 - isAdmin 체크 */}

              <ChatButton />
            </div>
          </Card>
        </Container>
      </div>
    </div>
  );
}
