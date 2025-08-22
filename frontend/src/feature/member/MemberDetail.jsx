import {
  Button,
  Col,
  FormControl,
  FormGroup,
  FormLabel,
  Modal,
  Row,
  Spinner,
} from "react-bootstrap";
import { useContext, useEffect, useState } from "react";
import axios from "axios";
import { useNavigate, useSearchParams } from "react-router";
import { toast } from "react-toastify";
import { AuthenticationContext } from "../../common/AuthenticationContextProvider.jsx";
import GoogleCalendarReview from "../calendar/GoogleCalendarReview.jsx";
import { MyReview } from "../review/MyReview.jsx";
import "../../styles/MemberDetail.css";

export function MemberDetail() {
  const [member, setMember] = useState(null);
  const [modalShow, setModalShow] = useState(false);
  const [password, setPassword] = useState("");
  const [tempCode, setTempCode] = useState("");
  const { logout, hasAccess, isAdmin } = useContext(AuthenticationContext);
  const [params] = useSearchParams();
  const [rightColumnView, setRightColumnView] = useState("calendar");
  const navigate = useNavigate();

  useEffect(() => {
    axios
      .get(`/api/member?email=${params.get("email")}`)
      .then((res) => {
        setMember(res.data);
      })
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

  function handleModalButtonClick() {
    if (isKakao) {
      axios
        .post("/api/member/withdrawalCode", { email: member.email })
        .then((res) => {
          setTempCode(res.data.tempCode);
          setModalShow(true);
        })
        .catch((err) => {
          console.error(err);
          console.log("임시 코드 못 받음");
        })
        .finally(() => setPassword(""));
    } else {
      setModalShow(true);
    }
  }

  // function handleLogoutClick() {
  //   logout();
  //   navigate("/login");
  //   toast("로그아웃 되었습니다.", { type: "success" });
  // }

  if (!member) {
    return (
      <div className="d-flex justify-content-center my-5">
        <Spinner animation="border" role="status" />
      </div>
    );
  }

  const formattedInsertedAt = member.insertedAt
    ? member.insertedAt.replace("T", " ").substring(0, 16)
    : "";

  const profileImageUrl = member.files?.find((file) =>
    /\.(jpg|jpeg|png|gif|webp)$/i.test(file),
  );

  const isAdminFlag = member.authNames?.includes("admin");
  const isKakao = member.provider?.includes("kakao");
  const defaultImage = "/user.png";

  return (
    <div className="member-detail-container p-0 h-100">
      <Row className="h-100 g-0">
        <Col lg={5} md={12} className="member-info-column">
          {/* 헤더 */}
          <div className="brutal-card member-info-header">
            <h3 className="member-info-title">👤 회원 정보</h3>
            {/* --- 역할 배지 로직 수정 --- */}
            <span
              className={`member-role-badge ${
                isAdminFlag ? "admin" : isKakao ? "kakao" : "user"
              }`}
            >
              {isAdminFlag ? "관리자" : isKakao ? "카카오 회원" : "일반 회원"}
            </span>
          </div>

          {/* 프로필 정보 섹션 */}
          <div className="brutal-card profile-section">
            <div className="profile-image-wrapper">
              <img
                src={profileImageUrl || defaultImage}
                alt="프로필 이미지"
                className="profile-image"
              />
            </div>
            <div className="profile-main-info">
              <div className="info-group">
                <div className="info-label-brutal">이메일</div>
                <div className="info-value-brutal">{member.email}</div>
              </div>
              <div className="info-group">
                <div className="info-label-brutal">별명</div>
                <div className="info-value-brutal">{member.nickName}</div>
              </div>
            </div>
          </div>

          <div className="brutal-card">
            <div className="info-group">
              <div className="info-label-brutal">자기소개</div>
              <div className="info-value-brutal textarea">
                {member.info || "자기소개가 없습니다."}
              </div>
            </div>
            <div className="info-group">
              <div className="info-label-brutal">가입일시</div>
              <div className="info-value-brutal">{formattedInsertedAt}</div>
            </div>
          </div>

          {/* 액션 버튼들 */}
          {hasAccess(member.email) && (
            <div className="action-buttons-container">
              <Button
                onClick={() => navigate(`/member/edit?email=${member.email}`)}
                className="btn-brutal btn-edit"
              >
                수정
              </Button>
              <Button
                onClick={() =>
                  setRightColumnView(
                    rightColumnView === "calendar" ? "myReviews" : "calendar",
                  )
                }
                className="btn-brutal btn-view"
              >
                {rightColumnView === "calendar" ? "리뷰 보기" : "달력 보기"}
              </Button>
              <Button
                onClick={handleModalButtonClick}
                className="btn-brutal btn-delete"
              >
                탈퇴
              </Button>
            </div>
          )}
        </Col>

        {/* 오른쪽 컬럼 */}
        <Col style={{ height: "100%", overflowY: "auto" }}>
          {/* 캘린더 표시 조건 */}
          {hasAccess(member.email) && rightColumnView === "calendar" && (
            <GoogleCalendarReview />
          )}
          {/* 내 리뷰 표시 */}
          {rightColumnView === "myReviews" ||
          (!hasAccess(member.email) && isAdmin()) ? (
            <MyReview memberId={member.id} />
          ) : null}
        </Col>
      </Row>

      {/* 탈퇴 확인 모달 */}
      <Modal show={modalShow} onHide={() => setModalShow(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title>
            {isKakao ? "카카오 회원 탈퇴" : "회원 탈퇴 확인"}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <FormGroup controlId="password1">
            <FormLabel>
              {isKakao
                ? `탈퇴를 원하시면 ${tempCode}를 아래에 작성하세요.`
                : "탈퇴를 원하시면 비밀번호를 입력하세요."}
            </FormLabel>
            <FormControl
              type={isKakao ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder={
                isKakao ? "위의 코드를 작성하세요." : "비밀번호를 입력하세요."
              }
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
    </div>
  );
}
