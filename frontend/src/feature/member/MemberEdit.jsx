// src/feature/member/MemberEdit.jsx  (FULL REPLACE)
import React, { useContext, useEffect, useRef, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import {
  Button,
  Col,
  FormControl,
  FormGroup,
  FormLabel,
  FormText,
  Modal,
  Row,
  Spinner,
  ListGroup,
  Image,
} from "react-bootstrap";
import axios from "axios";
import { toast } from "react-toastify";
import { AuthenticationContext } from "../../common/AuthenticationContextProvider.jsx";
import { FaPlus } from "react-icons/fa";
import "../../styles/MemberEdit.css";

/** 공통 유틸 */
const formatPrice = (v) => {
  if (v === null || v === undefined || Number.isNaN(Number(v))) return "-";
  return Number(v).toLocaleString() + "원";
};
const formatDate = (v) => (v ? String(v).replace("T", " ").slice(0, 16) : "");

/** 거래 상태 뱃지 (중고나라 톤: .jn-badge 스타일 사용) */
const tradeStatusBadge = (status) => {
  const s = String(status || "").toUpperCase().trim();
  if (s.includes("SOLD")) {
    return <span className="jn-badge jn-badge--inline sold">판매완료</span>;
  }
  if (s.includes("ON_SALE") || s.includes("SALE") || s.includes("ONSALE")) {
    return <span className="jn-badge jn-badge--inline onsale">판매중</span>;
  }
  return <span className="jn-badge jn-badge--inline">상태미정</span>;
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
      return () => {
        alive = false;
      };
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
            role: "seller",
            thumbnailUrl: thumb,
            updatedAt: b.insertedAt,
            reviewWritten: false,
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

    return () => {
      alive = false;
    };
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

export function MemberEdit() {
  const [member, setMember] = useState(null);

  const [modalShow, setModalShow] = useState(false);
  const [passwordModalShow, setPasswordModalShow] = useState(false);
  const [password, setPassword] = useState("");
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword1, setNewPassword1] = useState("");
  const [newPassword2, setNewPassword2] = useState("");

  const [currentProfileUrls, setCurrentProfileUrls] = useState([]);
  const [newProfileFiles, setNewProfileFiles] = useState([]);
  const [deleteProfileFileNames, setDeleteProfileFileNames] = useState([]);

  const [tempCode, setTempCode] = useState("");

  const [params] = useSearchParams();
  const navigate = useNavigate();
  const { hasAccess, updateUser } = useContext(AuthenticationContext);
  const isSelf = member ? hasAccess(member.email) : false;

  const fileInputRef = useRef(null);

  const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+=-]).{8,}$/;
  const nickRegex = /^[가-힣a-zA-Z0-9]{2,20}$/;

  useEffect(() => {
    axios
      .get(`/api/member?email=${params.get("email")}`)
      .then((res) => {
        setMember(res.data);
        const existingImages = res.data.files?.filter((fileUrl) => /\.(jpg|jpeg|png|gif|webp)$/i.test(fileUrl));
        setCurrentProfileUrls(existingImages || []);
        setNewProfileFiles([]);
        setDeleteProfileFileNames([]);
      })
      .catch((err) => {
        console.error("회원 정보 로딩 실패", err);
        toast.error("회원 정보를 불러오는 중 오류가 발생했습니다.");
      });
  }, [params]);

  useEffect(() => {
    return () => {
      newProfileFiles.forEach((file) => {
        if (file instanceof File && file.previewUrl) {
          URL.revokeObjectURL(file.previewUrl);
        }
      });
    };
  }, [newProfileFiles]);

  if (!member) {
    return (
      <div className="d-flex justify-content-center my-5">
        <Spinner animation="border" role="status" />
      </div>
    );
  }

  const isNickNameValid = nickRegex.test(member.nickName);
  const isPasswordValid = passwordRegex.test(newPassword1);
  const isPasswordMatch = newPassword1 === newPassword2;

  const isSaveDisabled = !isNickNameValid;
  const isChangePasswordDisabled =
    !oldPassword || !newPassword1 || !newPassword2 || !isPasswordValid || !isPasswordMatch;

  const handleProfileClick = () => {
    if (isSelf && fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleFileChange = (e) => {
    const selectedFiles = Array.from(e.target.files);
    if (selectedFiles.length > 0) {
      const file = selectedFiles[0];
      file.previewUrl = URL.createObjectURL(file);
      setNewProfileFiles([file]);

      if (currentProfileUrls.length > 0 && deleteProfileFileNames.length === 0) {
        const fileName = currentProfileUrls[0].split("/").pop();
        setDeleteProfileFileNames([fileName]);
      } else if (currentProfileUrls.length === 0 && deleteProfileFileNames.length > 0) {
        setDeleteProfileFileNames([]);
      }
    }
  };

  const handleRemoveProfile = (fileUrlToRemove) => {
    if (fileUrlToRemove && fileUrlToRemove.startsWith("blob:")) {
      URL.revokeObjectURL(fileUrlToRemove);
    }

    setCurrentProfileUrls((prevUrls) => {
      const remainingUrls = prevUrls.filter((url) => url !== fileUrlToRemove);
      return remainingUrls;
    });

    const fileName = fileUrlToRemove.split("/").pop();
    setDeleteProfileFileNames((prevDelete) => [...prevDelete, fileName]);

    newProfileFiles.forEach((file) => {
      if (file instanceof File && file.previewUrl) {
        URL.revokeObjectURL(file.previewUrl);
      }
    });
    setNewProfileFiles([]);

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const formattedInsertedAt = member.insertedAt ? member.insertedAt.replace("T", " ").substring(0, 16) : "";

  const handleSaveButtonClick = () => {
    if (password.trim() === "") {
      toast.error("비밀번호를 입력해주세요.");
      return;
    }

    const formData = new FormData();
    formData.append("email", member.email);
    formData.append("nickName", member.nickName);
    formData.append("info", member.info || "");
    formData.append("password", password);
    newProfileFiles.forEach((file) => {
      formData.append("profileFiles", file);
    });
    deleteProfileFileNames.forEach((name) => {
      formData.append("deleteProfileFileNames", name);
    });

    axios
      .put(`/api/member`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      })
      .then((res) => {
        const message = res.data.message;
        if (message) toast(message.text, { type: message.type });
        updateUser({ nickName: member.nickName });
        navigate(`/member?email=${member.email}`);
      })
      .catch((err) => {
        const message = err.response?.data?.message;
        if (message) toast(message.text, { type: message.type });
      })
      .finally(() => {
        setModalShow(false);
        setPassword("");
      });
  };

  const handleChangePasswordButtonClick = () => {
    axios
      .put(`/api/member/changePassword`, {
        email: member.email,
        oldPassword,
        newPassword: newPassword1,
      })
      .then((res) => {
        const message = res.data.message;
        if (message) toast(message.text, { type: message.type });
        setPasswordModalShow(false);
        setOldPassword("");
        setNewPassword1("");
        setNewPassword2("");
      })
      .catch((err) => {
        const message = err.response?.data?.message;
        if (message) toast(message.text, { type: message.type });
      });
  };

  const allProfileImages = [...currentProfileUrls, ...newProfileFiles.map((f) => f.previewUrl)];
  const displayProfileImage = allProfileImages.length > 0 ? allProfileImages[0] : null;

  const isAdminFlag = member.authNames?.includes("admin");
  const isKakao = member.provider?.includes("kakao");
  const defaultImage = "/user.png";

  function handleModalShowClick() {
    if (isKakao) {
      axios
        .post("/api/member/withdrawalCode", { email: member.email })
        .then((res) => {
          setTempCode(res.data.tempCode);
          setModalShow(true);
        })
        .catch((err) => {
          console.error(err);
          console.log("임시 코드 발급 안 됨");
        })
        .finally(() => setPassword(""));
    } else {
      setModalShow(true);
    }
  }

  return (
    <div className="p-0 h-100 member-edit-container">
      <Row className="h-100 g-0">
        {/* 좌측: 정보/메뉴 (MemberDetail과 동일 톤) */}
        <Col lg={5} md={12} className="p-4 d-flex flex-column member-edit-column">
          {/* 헤더 */}
          <div className="brutal-card member-info-header">
            <h3 className="member-info-title">✏️ 회원 정보 수정</h3>
            <span className={`role-badge ${isAdminFlag ? "admin" : isKakao ? "kakao" : "user"}`}>
              {isAdminFlag ? "관리자" : isKakao ? "카카오 회원" : "일반 회원"}
            </span>
          </div>

          {/* 프로필 정보 섹션 */}
          <div className="brutal-card profile-section">
            <div className="profile-image-wrapper">
              <div className="profile-upload-wrapper">
                <div className="profile-upload-area" onClick={isSelf ? handleProfileClick : undefined}>
                  {displayProfileImage ? (
                    <img src={displayProfileImage || defaultImage} alt="프로필 미리보기" className="profile-image" />
                  ) : (
                    <FaPlus size={40} color="#6c757d" />
                  )}
                </div>
                {isSelf && displayProfileImage && (
                  <Button
                    className="btn-remove-profile"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleRemoveProfile(displayProfileImage);
                    }}
                    aria-label="프로필 사진 제거"
                  >
                    &times;
                  </Button>
                )}
                <FormControl
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  style={{ display: "none" }}
                  accept="image/*"
                  disabled={!isSelf}
                  onClick={(e) => {
                    e.target.value = null;
                  }}
                />
              </div>
            </div>
            <div className="profile-main-info">
              <FormGroup controlId="email1" className="info-group">
                <FormLabel className="info-label-brutal">이메일</FormLabel>
                <FormControl disabled value={member.email} className="form-control-brutal" />
              </FormGroup>
              <FormGroup controlId="nickName1" className="info-group">
                <FormLabel className="info-label-brutal">별명</FormLabel>
                <FormControl
                  value={member.nickName}
                  maxLength={20}
                  placeholder="2~20자, 한글/영문/숫자만 사용 가능"
                  onChange={(e) =>
                    setMember({
                      ...member,
                      nickName: e.target.value.replace(/\s/g, ""),
                    })
                  }
                  className="form-control-brutal"
                  disabled={!isSelf}
                />
                {member.nickName && !isNickNameValid && (
                  <FormText className="text-danger">별명은 2~20자, 한글/영문/숫자만 사용.</FormText>
                )}
              </FormGroup>
            </div>
          </div>

          {/* 상세 정보 카드 */}
          <div className="brutal-card">
            <FormGroup controlId="info1" className="info-group">
              <FormLabel className="info-label-brutal">자기소개</FormLabel>
              <FormControl
                as="textarea"
                value={member.info || ""}
                maxLength={3000}
                onChange={(e) => setMember({ ...member, info: e.target.value })}
                className="form-control-brutal textarea"
                disabled={!isSelf}
              />
            </FormGroup>
            <FormGroup controlId="insertedAt1" className="info-group">
              <FormLabel className="info-label-brutal">가입일시</FormLabel>
              <FormControl disabled value={formattedInsertedAt} className="form-control-brutal" />
            </FormGroup>
          </div>

          {/* 액션 버튼 (MemberDetail의 메뉴 톤과 일치) */}
          {hasAccess(member.email) && (
            <div className="action-buttons-container">
              <Button onClick={() => navigate(-1)} className="btn-brutal btn-cancel">
                취소
              </Button>
              <Button disabled={isSaveDisabled} onClick={handleModalShowClick} className="btn-brutal btn-save">
                저장
              </Button>
              {!isKakao && (
                <Button onClick={() => setPasswordModalShow(true)} className="btn-brutal btn-password">
                  비밀번호 변경
                </Button>
              )}
            </div>
          )}
        </Col>

        {/* 우측: 달력 제거 → 거래 이력(내 게시물)로 교체 */}
        <Col lg={7} md={12} className="p-4" style={{ height: "100%", overflowY: "auto" }}>
          <TradeHistoryPanel memberId={member.id} />
        </Col>
      </Row>

      {/* 저장 확인 모달 */}
      <Modal show={modalShow} onHide={() => setModalShow(false)} centered className="modal-brutal">
        <Modal.Header closeButton>
          <Modal.Title className="fw-bold">회원 정보 수정 확인</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <FormGroup controlId="password1">
            <FormLabel className="info-label-brutal">
              {isKakao ? `정보 수정을 원하시면 ${tempCode}를 입력하세요.` : "정보 수정을 원하시면 비밀번호를 입력하세요."}
            </FormLabel>
            <FormControl
              type={isKakao ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder={isKakao ? "위의 코드를 입력하세요." : "비밀번호를 입력하세요."
              }
              autoFocus
              className="form-control-brutal"
            />
          </FormGroup>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="outline-secondary" onClick={() => setModalShow(false)}>
            취소
          </Button>
          <Button variant="primary" onClick={handleSaveButtonClick}>
            저장
          </Button>
        </Modal.Footer>
      </Modal>

      {/* 비밀번호 변경 모달 */}
      <Modal show={passwordModalShow} onHide={() => setPasswordModalShow(false)} centered className="modal-brutal">
        <Modal.Header closeButton>
          <Modal.Title className="fw-bold">비밀번호 변경</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <FormGroup className="mb-3" controlId="password2">
            <FormLabel className="info-label-brutal">현재 비밀번호</FormLabel>
            <FormControl
              type="password"
              value={oldPassword}
              placeholder="현재 비밀번호를 입력하세요."
              onChange={(e) => setOldPassword(e.target.value)}
              className="form-control-brutal"
            />
          </FormGroup>
          <FormGroup className="mb-3" controlId="password3">
            <FormLabel className="info-label-brutal">변경할 비밀번호</FormLabel>
            <FormControl
              type="password"
              value={newPassword1}
              maxLength={255}
              placeholder="8자 이상, 영문 대/소문자, 숫자, 특수문자 포함"
              onChange={(e) => setNewPassword1(e.target.value)}
              className="form-control-brutal"
            />
            {newPassword1 && !isPasswordValid && (
              <FormText className="text-danger">
                비밀번호는 8자 이상, 영문 대소문자, 숫자, 특수문자를 포함해야 합니다.
              </FormText>
            )}
          </FormGroup>
          <FormGroup className="mb-3" controlId="password4">
            <FormLabel className="info-label-brutal">변경할 비밀번호 확인</FormLabel>
            <FormControl
              type="password"
              value={newPassword2}
              maxLength={255}
              placeholder="변경할 비밀번호를 다시 입력하세요."
              onChange={(e) => setNewPassword2(e.target.value)}
              className="form-control-brutal"
            />
            {newPassword2 && !isPasswordMatch && <FormText className="text-danger">비밀번호가 일치하지 않습니다.</FormText>}
          </FormGroup>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="outline-secondary" onClick={() => setPasswordModalShow(false)}>
            취소
          </Button>
          <Button variant="primary" onClick={handleChangePasswordButtonClick} disabled={isChangePasswordDisabled}>
            변경
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
}
