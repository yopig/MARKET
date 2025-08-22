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
} from "react-bootstrap";
import axios from "axios";
import { toast } from "react-toastify";
import { AuthenticationContext } from "../../common/AuthenticationContextProvider.jsx";
import { FaPlus } from "react-icons/fa";
import GoogleCalendarReview from "../calendar/GoogleCalendarReview.jsx";
import "../../styles/MemberEdit.css"; // CSS 파일을 import 해주세요.

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

  const passwordRegex =
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+=-]).{8,}$/;
  const nickRegex = /^[가-힣a-zA-Z0-9]{2,20}$/;

  useEffect(() => {
    axios
      .get(`/api/member?email=${params.get("email")}`)
      .then((res) => {
        setMember(res.data);
        const existingImages = res.data.files?.filter((fileUrl) =>
          /\.(jpg|jpeg|png|gif|webp)$/i.test(fileUrl),
        );
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
    !oldPassword ||
    !newPassword1 ||
    !newPassword2 ||
    !isPasswordValid ||
    !isPasswordMatch;

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

      if (
        currentProfileUrls.length > 0 &&
        deleteProfileFileNames.length === 0
      ) {
        const fileName = currentProfileUrls[0].split("/").pop();
        setDeleteProfileFileNames([fileName]);
      } else if (
        currentProfileUrls.length === 0 &&
        deleteProfileFileNames.length > 0
      ) {
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

  const formattedInsertedAt = member.insertedAt
    ? member.insertedAt.replace("T", " ").substring(0, 16)
    : "";

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

  const allProfileImages = [
    ...currentProfileUrls,
    ...newProfileFiles.map((f) => f.previewUrl),
  ];
  const displayProfileImage =
    allProfileImages.length > 0 ? allProfileImages[0] : null;

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
        <Col
          lg={5}
          md={12}
          className="p-4 d-flex flex-column member-edit-column"
        >
          {/* 헤더 */}
          <div className="brutal-card member-info-header">
            <h3 className="member-info-title">✏️ 회원 정보 수정</h3>
            <span
              className={`role-badge ${
                isAdminFlag ? "admin" : isKakao ? "kakao" : "user"
              }`}
            >
              {isAdminFlag ? "관리자" : isKakao ? "카카오 회원" : "일반 회원"}
            </span>
          </div>

          {/* 프로필 정보 섹션 */}
          <div className="brutal-card profile-section">
            <div className="profile-image-wrapper">
              <div className="profile-upload-wrapper">
                <div
                  className="profile-upload-area"
                  onClick={isSelf ? handleProfileClick : undefined}
                >
                  {displayProfileImage ? (
                    <img
                      src={displayProfileImage || defaultImage}
                      alt="프로필 미리보기"
                      className="profile-image"
                    />
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
                <FormControl
                  disabled
                  value={member.email}
                  className="form-control-brutal"
                />
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
                  <FormText className="text-danger">
                    별명은 2~20자, 한글/영문/숫자만 사용.
                  </FormText>
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
              <FormControl
                disabled
                value={formattedInsertedAt}
                className="form-control-brutal"
              />
            </FormGroup>
          </div>

          {/* 액션 버튼 */}
          {hasAccess(member.email) && (
            <div className="action-buttons-container">
              <Button
                onClick={() => navigate(-1)}
                className="btn-brutal btn-cancel"
              >
                취소
              </Button>
              <Button
                disabled={isSaveDisabled}
                onClick={handleModalShowClick}
                className="btn-brutal btn-save"
              >
                저장
              </Button>
              {!isKakao && (
                <Button
                  onClick={() => setPasswordModalShow(true)}
                  className="btn-brutal btn-password"
                >
                  비밀번호 변경
                </Button>
              )}
            </div>
          )}
        </Col>

        <Col
          lg={7}
          md={12}
          className="p-4"
          style={{ height: "100%", overflowY: "auto" }}
        >
          <GoogleCalendarReview />
        </Col>
      </Row>

      {/* 모달들 */}
      <Modal
        show={modalShow}
        onHide={() => setModalShow(false)}
        centered
        className="modal-brutal"
      >
        <Modal.Header closeButton>
          <Modal.Title className="fw-bold">회원 정보 수정 확인</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <FormGroup controlId="password1">
            <FormLabel className="info-label-brutal">
              {isKakao
                ? `정보 수정을 원하시면 ${tempCode}를 입력하세요.`
                : "정보 수정을 원하시면 비밀번호를 입력하세요."}
            </FormLabel>
            <FormControl
              type={isKakao ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder={
                isKakao ? "위의 코드를 입력하세요." : "비밀번호를 입력하세요."
              }
              autoFocus
              className="form-control-brutal"
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
          <Button variant="primary" onClick={handleSaveButtonClick}>
            저장
          </Button>
        </Modal.Footer>
      </Modal>

      <Modal
        show={passwordModalShow}
        onHide={() => setPasswordModalShow(false)}
        centered
        className="modal-brutal"
      >
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
                비밀번호는 8자 이상, 영문 대소문자, 숫자, 특수문자를 포함해야
                합니다.
              </FormText>
            )}
          </FormGroup>
          <FormGroup className="mb-3" controlId="password4">
            <FormLabel className="info-label-brutal">
              변경할 비밀번호 확인
            </FormLabel>
            <FormControl
              type="password"
              value={newPassword2}
              maxLength={255}
              placeholder="변경할 비밀번호를 다시 입력하세요."
              onChange={(e) => setNewPassword2(e.target.value)}
              className="form-control-brutal"
            />
            {newPassword2 && !isPasswordMatch && (
              <FormText className="text-danger">
                비밀번호가 일치하지 않습니다.
              </FormText>
            )}
          </FormGroup>
        </Modal.Body>
        <Modal.Footer>
          <Button
            variant="outline-secondary"
            onClick={() => setPasswordModalShow(false)}
          >
            취소
          </Button>
          <Button
            variant="primary"
            onClick={handleChangePasswordButtonClick}
            disabled={isChangePasswordDisabled}
          >
            변경
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
}
