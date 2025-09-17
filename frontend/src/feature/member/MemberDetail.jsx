// src/feature/member/MemberDetail.jsx  (FULL REPLACE)
import {
  Button,
  Col,
  FormControl,
  FormGroup,
  FormLabel,
  Modal,
  Row,
  Spinner,
  Badge,
  ListGroup,
  Image,
} from "react-bootstrap";
import { useContext, useEffect, useMemo, useState } from "react";
import axios from "axios";
import { useNavigate, useSearchParams } from "react-router-dom"; // ✅ dom
import { toast } from "react-toastify";
import { AuthenticationContext } from "../../common/AuthenticationContextProvider.jsx";
import { MyReview } from "../review/MyReview.jsx";
import "../../styles/MemberDetail.css";

/** 공통 유틸 */
const formatPrice = (v) => {
  if (v === null || v === undefined || Number.isNaN(Number(v))) return "-";
  return Number(v).toLocaleString() + "원";
};
const formatDate = (v) => (v ? String(v).replace("T", " ").slice(0, 16) : "");

/** 거래 상태 뱃지 */
const tradeStatusBadge = (status) => {
  const s = (status || "").toLowerCase();
  let variant = "secondary";
  if (s.includes("sold")) variant = "dark";
  else if (s.includes("reserve")) variant = "warning";
  else if (s.includes("sale") || s.includes("on_sale")) variant = "success";
  return <Badge bg={variant}>{status || "상태미정"}</Badge>;
};

/** 거래이력 패널 (게시물 = 거래이력, 페이지네이션 포함) */
function TradeHistoryPanel({ memberId }) {
  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState([]);
  const [pageInfo, setPageInfo] = useState({ currentPageNumber: 1, totalPages: 1 });
  const [page, setPage] = useState(1);
  const size = 12;

  useEffect(() => {
    let alive = true;

    if (memberId == null) {
      setItems([]);
      setPageInfo({ currentPageNumber: 1, totalPages: 1 });
      setLoading(false);
      return () => { alive = false; };
    }

    setLoading(true);
    axios
      .get("/api/board/list", {
        params: {
          p: page,
          size,
          authorId: memberId, // ✅ 내가 쓴 게시물만
        },
      })
      .then((res) => {
        if (!alive) return;
        const data = res.data || {};
        const list = Array.isArray(data.boardList) ? data.boardList : [];
        setPageInfo(data.pageInfo || { currentPageNumber: page, totalPages: 1 });

        // 게시글 → 거래 카드 형태로 매핑
        const mapped = list.map((b) => {
          const thumb =
            b.thumbnailUrl ||
            (Array.isArray(b.files) ? b.files.find((f) => /\.(jpg|jpeg|png|gif|webp)$/i.test(f)) : null) ||
            "/no-image.png";
          return {
            id: b.id,
            boardId: b.id,
            title: b.title,
            price: b.price,
            status: b.tradeStatus,
            role: "seller",              // 내 게시물이므로 판매로 간주
            thumbnailUrl: thumb,
            updatedAt: b.insertedAt,
            reviewWritten: false,        // 게시글 목록에선 정보 없음
          };
        });
        setItems(mapped);
      })
      .catch((err) => {
        console.error(err);
        const msg =
          err.response?.data?.message?.text ??
          err.response?.data?.error ??
          `거래 이력(게시물) 조회 실패 (HTTP ${err.response?.status ?? "?"})`;
        toast.error(msg);
        setItems([]);
        setPageInfo({ currentPageNumber: page, totalPages: 1 });
      })
      .finally(() => alive && setLoading(false));

    return () => { alive = false; };
  }, [memberId, page]);

  const goPrev = () => setPage((p) => Math.max(1, p - 1));
  const goNext = () => setPage((p) => Math.min(pageInfo.totalPages || 1, p + 1));

  if (loading) {
    return (
      <div className="d-flex justify-content-center my-4">
        <Spinner animation="border" role="status" />
      </div>
    );
  }

  return (
    <div className="brutal-card">
      <div className="d-flex justify-content-between align-items-center mb-2">
        <h5 className="m-0">🧾 거래 이력(내 게시물)</h5>
        <div className="d-flex align-items-center gap-2">
          <span className="small text-muted">
            {pageInfo.currentPageNumber}/{pageInfo.totalPages}
          </span>
          <Button size="sm" variant="outline-dark" onClick={goPrev} disabled={pageInfo.currentPageNumber <= 1}>
            이전
          </Button>
          <Button
            size="sm"
            variant="dark"
            onClick={goNext}
            disabled={pageInfo.currentPageNumber >= (pageInfo.totalPages || 1)}
          >
            다음
          </Button>
        </div>
      </div>

      {items.length === 0 ? (
        <div className="text-muted">표시할 거래 이력이 없습니다.</div>
      ) : (
        <ListGroup className="trade-list">
          {items.map((it) => (
            <ListGroup.Item key={it.id} className="d-flex gap-3 align-items-center trade-item">
              <Image
                src={it.thumbnailUrl || "/no-image.png"}
                alt="thumb"
                rounded
                style={{ width: 64, height: 64, objectFit: "cover", flex: "0 0 64px" }}
              />
              <div className="flex-grow-1">
                <div className="d-flex align-items-center gap-2">
                  <strong className="text-truncate" style={{ maxWidth: 420 }}>
                    {it.title || "(제목 없음)"}
                  </strong>
                  {tradeStatusBadge(it.status)}
                  <Badge bg="info" text="dark">판매</Badge>
                </div>
                <div className="small text-muted mt-1">
                  {formatPrice(it.price)} · {formatDate(it.updatedAt)}
                </div>
              </div>

              <div className="d-flex gap-2">
                <Button
                  size="sm"
                  variant="outline-secondary"
                  onClick={() => (window.location.href = `/board/${it.boardId}`)}
                >
                  게시글
                </Button>
              </div>
            </ListGroup.Item>
          ))}
        </ListGroup>
      )}
    </div>
  );
}

export function MemberDetail() {
  const [member, setMember] = useState(null);
  const [modalShow, setModalShow] = useState(false);
  const [password, setPassword] = useState("");
  const [tempCode, setTempCode] = useState("");
  const { logout, hasAccess, isAdmin } = useContext(AuthenticationContext);
  const [params] = useSearchParams();
  const [rightColumnView, setRightColumnView] = useState("trades"); // trades | myReviews
  const navigate = useNavigate();

  useEffect(() => {
    const email = params.get("email");
    if (!email) return;
    axios
      .get(`/api/member`, { params: { email } })
      .then((res) => setMember(res.data))
      .catch((err) => {
        console.error(err);
        toast.error(
          err.response?.data?.message?.text ||
          err.response?.data?.error ||
          `회원 정보를 불러오는 중 오류 (HTTP ${err.response?.status ?? "?"})`
        );
      });
  }, [params]);

  const handleDeleteButtonClick = () => {
    axios
      .delete("/api/member", { data: { email: member.email, password } })
      .then((res) => {
        toast(res.data.message?.text || "탈퇴가 완료되었습니다.", {
          type: res.data.message?.type || "success",
        });
        navigate("/");
        logout?.();
      })
      .catch((err) => {
        toast(err.response?.data?.message?.text || "오류가 발생했습니다.", { type: "error" });
      })
      .finally(() => {
        setModalShow(false);
        setPassword("");
      });
  };

  const isKakao = (member?.provider || "").includes("kakao");

  const handleModalButtonClick = () => {
    if (isKakao) {
      axios
        .post("/api/member/withdrawalCode", { email: member.email })
        .then((res) => {
          setTempCode(res.data?.tempCode);
          setModalShow(true);
        })
        .catch((err) => {
          console.error(err);
          toast.error(
            err.response?.data?.message?.text ||
            err.response?.data?.error ||
            `임시 코드를 발급받지 못했습니다. (HTTP ${err.response?.status ?? "?"})`
          );
        })
        .finally(() => setPassword(""));
    } else {
      setModalShow(true);
    }
  };

  if (!member) {
    return (
      <div className="d-flex justify-content-center my-5">
        <Spinner animation="border" role="status" />
      </div>
    );
  }

  const formattedInsertedAt = member.insertedAt
    ? String(member.insertedAt).replace("T", " ").substring(0, 16)
    : "";

  const profileImageUrl = Array.isArray(member.files)
    ? member.files.find((file) => /\.(jpg|jpeg|png|gif|webp)$/i.test(file))
    : null;

  const isAdminFlag = Array.isArray(member.authNames) ? member.authNames.includes("admin") : false;
  const defaultImage = "/user.png";

  return (
    <div className="member-detail-container p-0 h-100">
      <Row className="h-100 g-0">
        <Col lg={5} md={12} className="member-info-column">
          {/* 헤더 */}
          <div className="brutal-card member-info-header">
            <h3 className="member-info-title">👤 회원 정보</h3>
            <span className={`member-role-badge ${isAdminFlag ? "admin" : isKakao ? "kakao" : "user"}`}>
              {isAdminFlag ? "관리자" : isKakao ? "카카오 회원" : "일반 회원"}
            </span>
          </div>

          {/* 프로필 정보 섹션 */}
          <div className="brutal-card profile-section">
            <div className="profile-image-wrapper">
              <img src={profileImageUrl || defaultImage} alt="프로필 이미지" className="profile-image" />
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
              <div className="info-value-brutal textarea">{member.info || "자기소개가 없습니다."}</div>
            </div>
            <div className="info-group">
              <div className="info-label-brutal">가입일시</div>
              <div className="info-value-brutal">{formattedInsertedAt}</div>
            </div>
          </div>

          {/* 액션 버튼들 */}
          {hasAccess(member.email) && (
            <div className="action-buttons-container">
              <Button onClick={() => navigate(`/member/edit?email=${member.email}`)} className="btn-brutal btn-edit">
                수정
              </Button>
              <div className="d-flex gap-2">
                <Button
                  onClick={() => setRightColumnView("trades")}
                  className={`btn-brutal btn-view ${rightColumnView === "trades" ? "active" : ""}`}
                >
                  거래 이력
                </Button>
                <Button
                  onClick={() => setRightColumnView("myReviews")}
                  className={`btn-brutal btn-view ${rightColumnView === "myReviews" ? "active" : ""}`}
                >
                  후기 보기
                </Button>
              </div>
              <Button onClick={handleModalButtonClick} className="btn-brutal btn-delete">
                탈퇴
              </Button>
            </div>
          )}
        </Col>

        {/* 오른쪽 컬럼 */}
        <Col style={{ height: "100%", overflowY: "auto" }}>
          {rightColumnView === "trades" && <TradeHistoryPanel memberId={member.id} />}
          {rightColumnView === "myReviews" ||
          (!hasAccess(member.email) && typeof isAdmin === "function" && isAdmin()) ? (
            <MyReview memberId={member.id} />
          ) : null}
        </Col>
      </Row>

      {/* 탈퇴 확인 모달 */}
      <Modal show={modalShow} onHide={() => setModalShow(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title>{isKakao ? "카카오 회원 탈퇴" : "회원 탈퇴 확인"}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <FormGroup controlId="password1">
            <FormLabel>
              {isKakao ? `탈퇴를 원하시면 ${tempCode}를 아래에 작성하세요.` : "탈퇴를 원하시면 비밀번호를 입력하세요."}
            </FormLabel>
            <FormControl
              type={isKakao ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder={isKakao ? "위의 코드를 작성하세요." : "비밀번호를 입력하세요."}
              autoFocus
            />
          </FormGroup>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="outline-secondary" onClick={() => setModalShow(false)}>
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
