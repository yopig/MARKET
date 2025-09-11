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
import { useNavigate, useSearchParams } from "react-router";
import { toast } from "react-toastify";
import { AuthenticationContext } from "../../common/AuthenticationContextProvider.jsx";
import { MyReview } from "../review/MyReview.jsx";
import "../../styles/MemberDetail.css";

/** 거래이력 패널 */
function TradeHistoryPanel({ memberId }) {
  const [items, setItems] = useState(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState("all"); // all | buy | sell

  useEffect(() => {
    let alive = true;
    setLoading(true);
    axios
      .get(`/api/trade/history?memberId=${memberId}`)
      .then((res) => {
        if (!alive) return;
        setItems(Array.isArray(res.data) ? res.data : res.data?.content || []);
      })
      .catch((err) => {
        console.error(err);
        toast.error("중고거래 이력을 불러오는 중 오류가 발생했습니다.");
        setItems([]);
      })
      .finally(() => alive && setLoading(false));
    return () => {
      alive = false;
    };
  }, [memberId]);

  const filtered = useMemo(() => {
    if (!items) return [];
    if (tab === "all") return items;
    return items.filter((it) => (tab === "buy" ? it.role === "buyer" : it.role === "seller"));
  }, [items, tab]);

  if (loading) {
    return (
      <div className="d-flex justify-content-center my-4">
        <Spinner animation="border" role="status" />
      </div>
    );
  }

  const EmptyState = (
    <div className="brutal-card">
      <div className="d-flex justify-content-between align-items-center mb-2">
        <h5 className="m-0">🧾 중고거래 이력</h5>
        <div className="d-flex gap-2">
          <Button size="sm" variant={tab === "all" ? "dark" : "outline-dark"} onClick={() => setTab("all")}>
            전체
          </Button>
          <Button size="sm" variant={tab === "buy" ? "dark" : "outline-dark"} onClick={() => setTab("buy")}>
            구매
          </Button>
          <Button size="sm" variant={tab === "sell" ? "dark" : "outline-dark"} onClick={() => setTab("sell")}>
            판매
          </Button>
        </div>
      </div>
      <div className="text-muted">표시할 거래 이력이 없습니다.</div>
    </div>
  );

  if (!filtered.length) return EmptyState;

  const formatPrice = (v) => {
    if (v === null || v === undefined || Number.isNaN(Number(v))) return "-";
    return Number(v).toLocaleString() + "원";
  };

  const formatDate = (v) => (v ? String(v).replace("T", " ").slice(0, 16) : "");

  const statusBadge = (status) => {
    const s = (status || "").toLowerCase();
    let variant = "secondary";
    if (s.includes("sold")) variant = "dark";
    else if (s.includes("reserve")) variant = "warning";
    else if (s.includes("sale")) variant = "success";
    return <Badge bg={variant}>{status || "상태미정"}</Badge>;
  };

  return (
    <div className="brutal-card">
      <div className="d-flex justify-content-between align-items-center mb-2">
        <h5 className="m-0">🧾 중고거래 이력</h5>
        <div className="d-flex gap-2">
          <Button size="sm" variant={tab === "all" ? "dark" : "outline-dark"} onClick={() => setTab("all")}>
            전체
          </Button>
          <Button size="sm" variant={tab === "buy" ? "dark" : "outline-dark"} onClick={() => setTab("buy")}>
            구매
          </Button>
          <Button size="sm" variant={tab === "sell" ? "dark" : "outline-dark"} onClick={() => setTab("sell")}>
            판매
          </Button>
        </div>
      </div>

      <ListGroup className="trade-list">
        {filtered.map((it) => {
          const thumb =
            it.thumbnailUrl ||
            it.boardThumbnail ||
            (Array.isArray(it.files) ? it.files.find((f) => /\.(jpg|jpeg|png|gif|webp)$/i.test(f)) : null) ||
            "/no-image.png";

          return (
            <ListGroup.Item key={it.id} className="d-flex gap-3 align-items-center trade-item">
              <Image
                src={thumb}
                alt="thumb"
                rounded
                style={{ width: 64, height: 64, objectFit: "cover", flex: "0 0 64px" }}
              />
              <div className="flex-grow-1">
                <div className="d-flex align-items-center gap-2">
                  <strong className="text-truncate" style={{ maxWidth: 420 }}>
                    {it.title || it.boardTitle || "(제목 없음)"}
                  </strong>
                  {statusBadge(it.status)}
                  <Badge bg="info" text="dark">
                    {it.role === "seller" ? "판매" : it.role === "buyer" ? "구매" : "기타"}
                  </Badge>
                </div>
                <div className="small text-muted mt-1">
                  {formatPrice(it.price)} · {it.opponentNickName || it.partnerNickName || "상대 미표기"} ·{" "}
                  {formatDate(it.updatedAt || it.dealAt || it.createdAt)}
                </div>
              </div>

              <div className="d-flex gap-2">
                {it.boardId ? (
                  <Button
                    size="sm"
                    variant="outline-secondary"
                    onClick={() => (window.location.href = `/board/${it.boardId}`)}
                  >
                    게시글
                  </Button>
                ) : null}
                {it.reviewWritten ? (
                  <Button size="sm" variant="outline-success" disabled>
                    후기 작성됨
                  </Button>
                ) : (
                  <Button
                    size="sm"
                    variant="dark"
                    onClick={() => {
                      const bid = it.boardId || it.id;
                      window.location.href = `/review/write?boardId=${bid}&tradeId=${it.id}`;
                    }}
                  >
                    후기 작성
                  </Button>
                )}
              </div>
            </ListGroup.Item>
          );
        })}
      </ListGroup>
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
  const [rightColumnView, setRightColumnView] = useState("trades"); // 기본: 거래이력
  const navigate = useNavigate();

  useEffect(() => {
    const email = params.get("email");
    if (!email) return;
    axios
      .get(`/api/member?email=${encodeURIComponent(email)}`)
      .then((res) => setMember(res.data))
      .catch((err) => {
        console.error(err);
        toast.error("회원 정보를 불러오는 중 오류가 발생했습니다.");
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
        logout();
      })
      .catch((err) => {
        toast(err.response?.data?.message?.text || "오류가 발생했습니다.", { type: "danger" });
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
          setTempCode(res.data.tempCode);
          setModalShow(true);
        })
        .catch((err) => {
          console.error(err);
          toast.error("임시 코드를 발급받지 못했습니다.");
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
              <Button
                onClick={() => setRightColumnView(rightColumnView === "trades" ? "myReviews" : "trades")}
                className="btn-brutal btn-view"
              >
                {rightColumnView === "trades" ? "후기 보기" : "거래 이력"}
              </Button>
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
