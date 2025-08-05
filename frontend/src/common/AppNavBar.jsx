import { Link, NavLink } from "react-router-dom";
import { Navbar, Nav, Container, Button, NavDropdown } from "react-bootstrap";
import { useContext, useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import { AuthenticationContext } from "./AuthenticationContextProvider.jsx";
import { FaUserCircle } from "react-icons/fa";
import { useNavigate } from "react-router";
import { toast } from "react-toastify";

export function AppNavBar() {
  const { user, logout } = useContext(AuthenticationContext);
  const [showDropdown, setShowDropdown] = useState(false);
  const [dropdownPosition, setDropdownPosition] = useState({
    top: 0,
    right: 0,
  });
  const dropdownRef = useRef(null);
  const navigate = useNavigate();

  // 드롭다운 위치 계산
  const handleDropdownToggle = (event) => {
    if (!showDropdown) {
      const rect = event.currentTarget.getBoundingClientRect();
      setDropdownPosition({
        top: rect.bottom + window.scrollY,
        right: window.innerWidth - rect.right,
      });
    }
    setShowDropdown(!showDropdown);
  };

  // 외부 클릭 시 드롭다운 닫기
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowDropdown(false);
      }
    };

    if (showDropdown) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [showDropdown]);

  // 기본 NavLink 스타일
  const navLinkStyle = {
    color: "#555",
    fontWeight: 500,
    paddingBottom: "0.5rem",
    margin: "0 1.2rem",
    textDecoration: "none",
    position: "relative",
    transition: "color 0.3s ease-in-out",
  };

  // 활성화된 NavLink 스타일
  const activeLinkStyle = {
    color: "#FF9D00", // 포인트 색상으로 변경
    fontWeight: 700,
    borderBottom: "2px solid #FF9D00", // 하단에 라인 추가
  };

  // 로그인 시 드롭다운 메뉴에 표시될 타이틀입니다.
  const userDropdownTitle = (
    <span className="text-white fw-bold">
      <FaUserCircle size={24} className="me-2" />
      {user?.nickName}
    </span>
  );

  // 커스텀 드롭다운 메뉴 (Portal 사용)
  const CustomDropdown = () => {
    if (!showDropdown) return null;

    return createPortal(
      <div
        ref={dropdownRef}
        style={{
          position: "absolute",
          top: dropdownPosition.top,
          right: dropdownPosition.right,
          backgroundColor: "white",
          borderRadius: "8px",
          boxShadow: "0 4px 12px rgba(0, 0, 0, 0.15)",
          border: "none",
          minWidth: "160px",
          zIndex: 9999,
          overflow: "hidden",
        }}
      >
        <Link
          to={`/member?email=${user.email}`}
          className="dropdown-item"
          style={{
            display: "block",
            padding: "8px 16px",
            color: "#333",
            textDecoration: "none",
            borderBottom: "1px solid #eee",
            transition: "background-color 0.2s",
          }}
          onMouseEnter={(e) => (e.target.style.backgroundColor = "#f8f9fa")}
          onMouseLeave={(e) => (e.target.style.backgroundColor = "transparent")}
          onClick={() => setShowDropdown(false)}
        >
          마이페이지
        </Link>
        <button
          className="dropdown-item"
          style={{
            display: "block",
            width: "100%",
            padding: "8px 16px",
            color: "red",
            backgroundColor: "transparent",
            border: "none",
            textAlign: "left",
            cursor: "pointer",
            transition: "background-color 0.2s",
          }}
          onMouseEnter={(e) => (e.target.style.backgroundColor = "#f8f9fa")}
          onMouseLeave={(e) => (e.target.style.backgroundColor = "transparent")}
          onClick={() => {
            logout();
            navigate("/login");
            toast("로그아웃되었습니다.");
            setShowDropdown(false);
          }}
        >
          로그아웃
        </button>
      </div>,
      document.body,
    );
  };

  return (
    <>
      <style>
        {`
          /* 드롭다운이 다른 요소를 밀어내지 않도록 절대 위치 설정 */
          .dropdown-menu {
            position: absolute !important;
            z-index: 1050 !important; /* 더 높은 z-index로 설정 */
            top: 100% !important;
            right: 0 !important;
            left: auto !important;
            transform: none !important;
            border-radius: 8px !important;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15) !important;
            border: none !important;
          }
          
          /* 드롭다운 컨테이너의 위치 설정 */
          .nav-dropdown-container {
            position: relative;
            z-index: 1051; /* 컨테이너도 높은 z-index */
          }
          
          /* 네비바 콜랩스 부드러운 전환 */
          .navbar-collapse {
            transition: all 0.3s ease-in-out !important;
          }
          
          /* 네비바 자체에도 부드러운 전환 효과 */
          .navbar {
            transition: all 0.3s ease-in-out !important;
          }
          
          /* 콜랩스 내용이 나타날 때 부드러운 애니메이션 */
          .navbar-collapse.collapsing {
            transition: height 0.3s ease-in-out !important;
          }
        `}
      </style>
      <Navbar
        sticky="top"
        expand="lg"
        variant="dark"
        className="px-4 shadow-sm"
        style={{
          background: "linear-gradient(90deg, #FFB75E, #FF9900)",
          minHeight: "80px",
          borderRadius: "0 0 12px 12px", // 네비바 자체에 borderRadius 적용
          overflow: "visible", // 네비바에서도 overflow visible 설정
        }}
      >
        <Container fluid>
          {/* 로고와 브랜드 이름 */}
          <Navbar.Brand as={Link} to="/" className="d-flex align-items-center">
            <span
              className="ms-2 ms-md-3" // 모바일에서는 ms-2, 중간 화면 이상에서는 ms-3
              style={{
                fontFamily: "'Fredoka One', cursive",
                fontSize: "clamp(1.2rem, 4vw, 1.8rem)", // 반응형 폰트 크기
                color: "white",
                textShadow: "1px 1px 3px rgba(0,0,0,0.2)",
              }}
            >
              PETOPIA
            </span>
          </Navbar.Brand>

          <div className="d-flex align-items-center order-lg-2">
            {/* 로그인 상태에 따른 UI (오른쪽) */}
            <Nav className="me-3">
              {user ? (
                <div className="nav-dropdown-container">
                  <button
                    className="btn btn-link p-0"
                    style={{
                      border: "none",
                      background: "transparent",
                      color: "white",
                      textDecoration: "none",
                    }}
                    onClick={handleDropdownToggle}
                  >
                    {userDropdownTitle}
                  </button>
                  <CustomDropdown />
                </div>
              ) : (
                <Button
                  as={Link}
                  to="/login"
                  className="fw-bold"
                  style={{
                    backgroundColor: "#FF9D00",
                    borderColor: "#FF9D00",
                    borderRadius: "20px",
                    padding: "0.5rem 1.5rem",
                  }}
                >
                  LOGIN
                </Button>
              )}
            </Nav>
            <Navbar.Toggle aria-controls="main-nav" />
          </div>

          {/* 네비게이션 메뉴 (중앙) */}
          {/*<Navbar.Toggle aria-controls="basic-navbar-nav" />*/}
          <Navbar.Collapse id="basic-navbar-nav">
            <Nav className="mx-auto">
              <NavLink
                to="/"
                style={({ isActive }) =>
                  isActive
                    ? { ...navLinkStyle, ...activeLinkStyle }
                    : navLinkStyle
                }
              >
                HOME
              </NavLink>
              <NavLink
                to="/kakaoMap"
                style={({ isActive }) =>
                  isActive
                    ? { ...navLinkStyle, ...activeLinkStyle }
                    : navLinkStyle
                }
              >
                MAP
              </NavLink>
              <NavLink
                to="/review/latest"
                style={({ isActive }) =>
                  isActive
                    ? { ...navLinkStyle, ...activeLinkStyle }
                    : navLinkStyle
                }
              >
                REVIEWS
              </NavLink>
              <NavLink
                to="/board/list"
                style={({ isActive }) =>
                  isActive
                    ? { ...navLinkStyle, ...activeLinkStyle }
                    : navLinkStyle
                }
              >
                NEWS
              </NavLink>
              <NavLink
                to="/support"
                style={({ isActive }) =>
                  isActive
                    ? { ...navLinkStyle, ...activeLinkStyle }
                    : navLinkStyle
                }
              >
                SUPPORT
              </NavLink>
            </Nav>
          </Navbar.Collapse>
        </Container>
      </Navbar>
    </>
  );
}
