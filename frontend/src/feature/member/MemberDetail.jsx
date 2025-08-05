import {
  Button,
  Card,
  Col,
  FormControl,
  FormGroup,
  FormLabel,
  ListGroup,
  ListGroupItem,
  Modal,
  Row,
  Spinner,
} from "react-bootstrap";
import { useContext, useEffect, useState } from "react";
import axios from "axios";
import { useNavigate, useSearchParams } from "react-router";
import { toast } from "react-toastify";
import { AuthenticationContext } from "../../common/AuthenticationContextProvider.jsx";
import { FaDownload, FaUserCircle } from "react-icons/fa";
import { FiUser } from "react-icons/fi";
import { GrFavorite } from "react-icons/gr";

export function MemberDetail() {
  const [member, setMember] = useState(null);
  const [modalShow, setModalShow] = useState(false);
  const [password, setPassword] = useState("");
  const { logout, hasAccess } = useContext(AuthenticationContext);
  const [params] = useSearchParams();
  const navigate = useNavigate();

  useEffect(() => {
    axios
      .get(`/api/member?email=${params.get("email")}`)
      .then((res) => setMember(res.data))
      .catch((err) => {
        console.error(err);
        toast.error("회원 정보를 불러오는 중 오류가 발생했습니다.");
      });
  }, [params]);

  function handleDeleteButtonClick() {
    axios
      .delete("/api/member", { data: { email: member.email, password } })
      .then((res) => {
        toast(res.data.message.text, { type: res.data.message.type });
        navigate("/");
        logout();
      })
      .catch((err) => {
        toast(err.response?.data?.message?.text || "오류가 발생했습니다.", {
          type: "danger",
        });
      })
      .finally(() => {
        setModalShow(false);
        setPassword("");
      });
  }

  function handleLogoutClick() {
    logout();
    navigate("/login");
    toast("로그아웃 되었습니다.", { type: "success" });
  }

  if (!member) {
    return (
      <div className="d-flex justify-content-center my-5">
        <Spinner animation="border" role="status" />
      </div>
    );
  }

  // 가입일시 포맷 통일
  const formattedInsertedAt = member.insertedAt
    ? member.insertedAt.replace("T", " ").substring(0, 16)
    : "";

  // 프로필 이미지 URL 찾기
  // 이미지 확장자를 가진 파일 중 첫 번째를 프로필 이미지로 간주합니다.
  const profileImageUrl = member.files?.find((file) =>
    /\.(jpg|jpeg|png|gif|webp)$/i.test(file),
  );

  // member.authNames 배열에 admin 확인
  const isAdmin = member.authNames?.includes("admin");

  return (
    <Row className="justify-content-center my-4">
      <Col xs={12} md={8} lg={6}>
        <div className="d-flex justify-content-between align-items-center mb-3">
          <h3 className="fw-bold mb-0 text-dark">회원 정보</h3>
          <small className="text-muted" style={{ fontSize: "0.85rem" }}>
            {isAdmin ? (
              <span className="badge bg-danger">관리자</span>
            ) : (
              <span className="badge bg-secondary">일반 사용자</span>
            )}
          </small>
        </div>

        <Card className="shadow-sm border-0 rounded-3">
          <Card.Body>
            {/* 프로필 이미지 미리보기 */}
            <div className="mb-4 d-flex justify-content-center">
              {profileImageUrl ? (
                // 이미지가 있을 경우
                <img
                  src={profileImageUrl}
                  alt="프로필 이미지"
                  className="shadow rounded-circle" // 원형 스타일
                  style={{
                    width: "120px", // 원하는 크기로 조절
                    height: "120px", // 원하는 크기로 조절
                    objectFit: "cover", // 이미지가 잘리지 않게 채움
                    border: "2px solid #ddd", // 테두리 (선택 사항)
                  }}
                />
              ) : (
                // 이미지가 없을 경우 사용자 아이콘 표시
                <div
                  className="shadow rounded-circle d-flex justify-content-center align-items-center"
                  style={{
                    width: "120px", // 이미지와 동일한 크기
                    height: "120px", // 이미지와 동일한 크기
                    backgroundColor: "#e9ecef", // 배경색 (회색 계열)
                    border: "2px solid #ddd", // 테두리
                    color: "#6c757d", // 아이콘 색상
                  }}
                >
                  <FiUser size={80} /> {/* 아이콘 크기 조절 */}
                </div>
              )}
            </div>

            {/* 프로필 이미지가 없는 경우를 대비한 여백 (선택 사항) */}
            {!profileImageUrl && <br />}

            <FormGroup controlId="email1" className="mb-3">
              <FormLabel>이메일</FormLabel>
              <FormControl
                readOnly
                value={member.email}
                className="bg-light border-0"
                style={{
                  userSelect: "text",
                  boxShadow: "none",
                  outline: "none",
                }}
                onFocus={(e) => e.target.blur()}
              />
            </FormGroup>

            <FormGroup controlId="nickName1" className="mb-3">
              <FormLabel>별명</FormLabel>
              <FormControl
                readOnly
                value={member.nickName}
                className="bg-light border-0"
                style={{
                  userSelect: "text",
                  boxShadow: "none",
                  outline: "none",
                }}
                onFocus={(e) => e.target.blur()}
              />
            </FormGroup>

            <FormGroup controlId="info1" className="mb-3">
              <FormLabel>자기소개</FormLabel>
              <FormControl
                as="textarea"
                readOnly
                value={member.info || ""}
                className="bg-light border-0"
                style={{
                  minHeight: "120px",
                  resize: "none",
                  userSelect: "text",
                  fontSize: "1rem",
                  lineHeight: 1.5,
                }}
                onFocus={(e) => e.target.blur()}
              />
            </FormGroup>

            <FormGroup controlId="inserted1" className="mb-3">
              <FormLabel>가입일시</FormLabel>
              <FormControl
                readOnly
                value={formattedInsertedAt}
                className="bg-light border-0"
                style={{
                  userSelect: "text",
                  boxShadow: "none",
                  outline: "none",
                }}
                onFocus={(e) => e.target.blur()}
              />
            </FormGroup>

            {hasAccess(member.email) && (
              <div className="d-flex justify-content-start gap-2">
                <Button
                  variant="outline-danger"
                  onClick={() => setModalShow(true)}
                  className="d-flex align-items-center gap-1"
                >
                  탈퇴
                </Button>
                <Button
                  variant="outline-info"
                  onClick={() => navigate(`/member/edit?email=${member.email}`)}
                  className="d-flex align-items-center gap-1"
                >
                  수정
                </Button>
                <Button
                  variant="outline-secondary"
                  onClick={handleLogoutClick}
                  className="d-flex align-items-center gap-1"
                >
                  로그아웃
                </Button>
                <Button
                  variant="outline-success"
                  onClick={() => navigate("/review/my")}
                  className="d-flex align-items-center gap-1"
                >
                  내가 쓴 리뷰
                </Button>
              </div>
            )}
          </Card.Body>
        </Card>

        {/* 탈퇴 확인 모달 */}
        <Modal show={modalShow} onHide={() => setModalShow(false)} centered>
          <Modal.Header closeButton>
            <Modal.Title>회원 탈퇴 확인</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            <FormGroup controlId="password1">
              <FormLabel>암호</FormLabel>
              <FormControl
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="비밀번호를 입력하세요"
                autoFocus
              />
            </FormGroup>
          </Modal.Body>
          <Modal.Footer>
            <Button
              variant="outline-secondary"
              onClick={() => setModalShow(false)}
            >
              취소
            </Button>
            <Button variant="danger" onClick={handleDeleteButtonClick}>
              탈퇴
            </Button>
          </Modal.Footer>
        </Modal>
      </Col>
    </Row>
  );
}
