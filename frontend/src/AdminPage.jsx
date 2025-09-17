import { Button, Col, Row } from "react-bootstrap";
import { Outlet, useNavigate, useLocation } from "react-router";
import { BsPeopleFill, BsChatLeftTextFill, BsFlagFill } from "react-icons/bs";

// 사이드바 버튼에 적용할 스타일
const sidebarButtonClass = "d-flex align-items-center gap-2 text-start w-100";

export function AdminPage() {
  const navigate = useNavigate();
  const location = useLocation();

  // 현재 경로가 특정 메뉴에 해당하는지 확인하는 함수
  const isLinkActive = (path) => location.pathname.startsWith(path);

  return (
    <Row className="mt-4">
      {/* 왼쪽 사이드바 */}
      <Col md={3} className="border-end p-4">
        <h5 className="mb-4 text-muted fw-bold">관리자 메뉴</h5>
        <div className="d-flex flex-column gap-3">
          <Button
            variant={isLinkActive("/admin/member") ? "outline-dark" : "light"}
            className={sidebarButtonClass}
            onClick={() => navigate("/admin/member/list")}
          >
            <BsPeopleFill size={18} /> 회원 목록
          </Button>
          <Button
            variant={isLinkActive("/admin/support") ? "outline-dark" : "light"}
            className={sidebarButtonClass}
            onClick={() => navigate("/admin/support/list")}
          >
            <BsChatLeftTextFill size={18} /> 문의 내역
          </Button>

          {/* 🔁 여기 변경: 리뷰 신고 목록 → 신고 센터(ReportCenter) */}
          <Button
            variant={isLinkActive("/admin/report") ? "outline-dark" : "light"}
            className={sidebarButtonClass}
            onClick={() => navigate("/admin/review/report/list")}
          >
            <BsFlagFill size={18} /> 신고 센터
          </Button>
        </div>
      </Col>

      {/* 오른쪽 콘텐츠 영역 */}
      <Col md={9} className="p-4">
        <Outlet /> {/* 여기에 하위 라우트 컴포넌트가 렌더링됨 */}
      </Col>
    </Row>
  );
}
