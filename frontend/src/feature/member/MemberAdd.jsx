// src/feature/member/MemberAdd.jsx
import { Button, Form, FormText, Spinner, InputGroup } from "react-bootstrap";
import { useEffect, useRef, useState } from "react";
import axios from "axios";
import { toast } from "react-toastify";
import { useNavigate } from "react-router";
import { FaPaw, FaPlus } from "react-icons/fa";
import "../../styles/MemberAdd.css";

export function MemberAdd() {
  // 입력값 상태
  const [files, setFiles] = useState([]);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [password2, setPassword2] = useState("");
  const [nickName, setNickName] = useState("");
  const [info, setInfo] = useState("");

  // 처리/인증 상태
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const [emailCode, setEmailCode] = useState("");
  const [isEmailVerified, setIsEmailVerified] = useState(false);
  const [verificationId, setVerificationId] = useState(null);

  // 재전송 쿨다운/타이머
  const RESEND_COOLDOWN = 60; // 초
  const CODE_EXPIRES_IN = 600; // 10분
  const [cooldown, setCooldown] = useState(0);
  const [remain, setRemain] = useState(0);

  const navigate = useNavigate();
  const fileInputRef = useRef(null);

  // 정규식 (백엔드와 동일 조건 가정)
  const emailRegex = /^[\w.-]+@[\w.-]+\.[a-zA-Z]{2,}$/;
  const passwordRegex =
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+=-]).{8,}$/;
  const nickRegex = /^[가-힣a-zA-Z0-9]{2,20}$/;

  const isEmailValid = emailRegex.test(email);
  const isPasswordValid = passwordRegex.test(password);
  const isNickNameValid = nickRegex.test(nickName);
  const isPasswordMatch = password === password2;

  const disabled =
    !isEmailVerified ||
    !isEmailValid ||
    !isPasswordValid ||
    !isNickNameValid ||
    !isPasswordMatch ||
    isProcessing;

  // 파일 첨부
  const handleFileChange = (e) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFiles([
        {
          file: selectedFile,
          previewUrl: URL.createObjectURL(selectedFile),
        },
      ]);
    } else {
      setFiles([]);
    }
  };
  const handleProfileClick = () => fileInputRef.current?.click();

  // 이메일 인증: 코드 발송
  async function handleSendCode() {
    if (!isEmailValid) {
      toast("올바른 이메일을 입력해주세요.", { type: "warning" });
      return;
    }
    setIsSending(true);
    try {
      // 백엔드 사양: POST /api/auth/email/send-code  { email }
      // response: { verificationId, expiresInSec }
      const { data } = await axios.post("/api/auth/email/send-code", { email });
      setVerificationId(data.verificationId);
      setEmailSent(true);
      setIsEmailVerified(false);
      setCooldown(RESEND_COOLDOWN);
      setRemain(Math.min(CODE_EXPIRES_IN, data?.expiresInSec ?? CODE_EXPIRES_IN));
      toast("인증 코드를 이메일로 전송했어요.", { type: "success" });
    } catch (err) {
      const message = err?.response?.data?.message;
      toast(message?.text ?? "인증 코드 전송에 실패했어요.", {
        type: message?.type ?? "error",
      });
    } finally {
      setIsSending(false);
    }
  }

  // 이메일 인증: 코드 검증
  async function handleVerifyCode() {
    if (!verificationId) {
      toast("먼저 인증 코드를 요청해주세요.", { type: "warning" });
      return;
    }
    if (!emailCode.trim()) {
      toast("수신한 인증 코드를 입력해주세요.", { type: "warning" });
      return;
    }
    setIsVerifying(true);
    try {
      // 백엔드 사양: POST /api/auth/email/verify  { verificationId, email, code }
      // response: { verified: true, verificationId }
      const { data } = await axios.post("/api/auth/email/verify", {
        verificationId,
        email,
        code: emailCode.trim(),
      });
      if (data.verified) {
        setIsEmailVerified(true);
        toast("이메일 인증이 완료됐어요.", { type: "success" });
      } else {
        setIsEmailVerified(false);
        toast("인증에 실패했어요. 코드를 다시 확인해주세요.", { type: "error" });
      }
    } catch (err) {
      const message = err?.response?.data?.message;
      toast(message?.text ?? "인증에 실패했어요.", {
        type: message?.type ?? "error",
      });
      setIsEmailVerified(false);
    } finally {
      setIsVerifying(false);
    }
  }

  // 타이머 (재전송 쿨다운/코드 만료)
  useEffect(() => {
    if (cooldown <= 0) return;
    const t = setInterval(() => setCooldown((s) => Math.max(0, s - 1)), 1000);
    return () => clearInterval(t);
  }, [cooldown]);

  useEffect(() => {
    if (!emailSent || remain <= 0 || isEmailVerified) return;
    const t = setInterval(() => setRemain((s) => Math.max(0, s - 1)), 1000);
    return () => clearInterval(t);
  }, [emailSent, remain, isEmailVerified]);

  // 이메일 변경 시 인증 상태 리셋
  useEffect(() => {
    setEmailCode("");
    setIsEmailVerified(false);
    setVerificationId(null);
    setEmailSent(false);
    setCooldown(0);
    setRemain(0);
  }, [email]);

  // 가입
  async function handleSaveClick() {
    if (!isEmailVerified) {
      toast("이메일 인증을 완료해주세요.", { type: "warning" });
      return;
    }
    setIsProcessing(true);

    const formData = new FormData();
    formData.append("email", email);
    formData.append("password", password);
    formData.append("nickName", nickName);
    formData.append("info", info);
    // 서버에서 검증용으로 받도록 권장
    if (verificationId) formData.append("emailVerificationId", verificationId);

    if (files.length > 0) {
      formData.append("files", files[0].file);
    }

    try {
      const res = await axios.post("/api/member/add", formData, {
        headers: { "Content-type": "multipart/form-data" },
      });
      const message = res?.data?.message;
      if (message) toast(message.text, { type: message.type });
      navigate("/");
    } catch (err) {
      const message = err?.response?.data?.message;
      if (message) {
        toast(message.text, { type: message.type });
      } else {
        toast("가입에 실패했어요.", { type: "error" });
      }
    } finally {
      setIsProcessing(false);
    }
  }

  const currentProfilePreview = files.length > 0 ? files[0].previewUrl : null;

  return (
    <div className="signup-page-wrapper">
      <div className="signup-container-v2">
        <div className="signup-grid">
          {/* 왼쪽: 환영 패널 (브랜딩 → 안전마켓) */}
          <div className="signup-welcome-panel">
            <div className="welcome-content">
              <h1 className="welcome-logo">🛡️ 안전마켓</h1>
              <h2>
                중고거래는
                <br />
                안전마켓에서!
              </h2>
              <p>
                동네 중고거래를 더 안전하고 편하게. 신뢰 기반의 거래 문화를
                안전마켓에서 경험해보세요.
              </p>
              <ul className="welcome-benefits">
                <li>
                  <FaPaw size={18} />
                  <span>카테고리/지역별 매물 탐색</span>
                </li>
                <li>
                  <FaPaw size={18} />
                  <span>거래 후기와 프로필 신뢰도 확인</span>
                </li>
                <li>
                  <FaPaw size={18} />
                  <span>실시간 채팅으로 빠른 협의</span>
                </li>
                <li>
                  <FaPaw size={18} />
                  <span>안전한 거래 정보/가이드 제공</span>
                </li>
              </ul>
            </div>
          </div>

          {/* 오른쪽: 가입 폼 패널 */}
          <div className="signup-form-panel">
            <Form>
              {/* 프로필 이미지 업로더 */}
              <Form.Group className="mb-4 text-center">
                <div className="profile-uploader-neo" onClick={handleProfileClick}>
                  {currentProfilePreview ? (
                    <img
                      src={currentProfilePreview}
                      alt="프로필 미리보기"
                      className="profile-preview-img"
                    />
                  ) : (
                    <FaPlus size={30} color="#999" />
                  )}
                </div>
                <p className="form-label-neo mb-3 mt-3">프로필 사진 (선택)</p>
                <Form.Control
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  style={{ display: "none" }}
                  accept="image/*"
                  disabled={isProcessing}
                />
              </Form.Group>

              {/* 이메일 + 인증 요청 */}
              <Form.Group className="mb-3">
                <Form.Label className="form-label-neo">이메일</Form.Label>
                <InputGroup>
                  <Form.Control
                    type="text"
                    value={email}
                    onChange={(e) => setEmail(e.target.value.replace(/\s/g, ""))}
                    className="form-input-neo"
                    placeholder="user@example.com"
                    isInvalid={!!email && !isEmailValid}
                    disabled={isProcessing}
                  />
                  <Button
                    variant="outline-primary"
                    onClick={handleSendCode}
                    disabled={!isEmailValid || isSending || cooldown > 0 || isProcessing}
                  >
                    {isSending ? (
                      <>
                        <Spinner size="sm" className="me-2" /> 전송중…
                      </>
                    ) : cooldown > 0 ? (
                      `재전송 (${cooldown}s)`
                    ) : (
                      "인증요청"
                    )}
                  </Button>
                </InputGroup>
                {email && !isEmailValid && (
                  <FormText className="text-danger fw-bold">
                    이메일 형식이 올바르지 않습니다.
                  </FormText>
                )}
                {emailSent && !isEmailVerified && (
                  <div className="text-muted mt-1" style={{ fontSize: "0.85rem" }}>
                    인증 코드는 {Math.ceil(remain / 60)}분 내에 입력해주세요
                    {remain > 0 ? ` (남은 시간 ${remain}s)` : " (만료됨)"}.
                  </div>
                )}
                {isEmailVerified && (
                  <div className="text-success mt-1 fw-bold">이메일 인증 완료</div>
                )}
              </Form.Group>

              {/* 인증 코드 입력 */}
              {emailSent && !isEmailVerified && (
                <Form.Group className="mb-3">
                  <Form.Label className="form-label-neo">인증 코드</Form.Label>
                  <InputGroup>
                    <Form.Control
                      type="text"
                      value={emailCode}
                      onChange={(e) => setEmailCode(e.target.value.replace(/\s/g, ""))}
                      className="form-input-neo"
                      placeholder="이메일로 받은 6자리 코드를 입력"
                      disabled={isProcessing || remain <= 0}
                    />
                    <Button
                      variant="outline-success"
                      onClick={handleVerifyCode}
                      disabled={isVerifying || isProcessing || remain <= 0}
                    >
                      {isVerifying ? (
                        <>
                          <Spinner size="sm" className="me-2" /> 확인중…
                        </>
                      ) : (
                        "인증확인"
                      )}
                    </Button>
                  </InputGroup>
                  {remain <= 0 && (
                    <FormText className="text-danger fw-bold">
                      코드가 만료됐어요. “인증요청”으로 다시 받아주세요.
                    </FormText>
                  )}
                </Form.Group>
              )}

              {/* 비밀번호 */}
              <Form.Group className="mb-3">
                <Form.Label className="form-label-neo">비밀번호</Form.Label>
                <Form.Control
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value.replace(/\s/g, ""))}
                  className="form-input-neo"
                  placeholder="8자 이상, 대/소문자, 숫자, 특수문자 포함"
                  isInvalid={!!password && !isPasswordValid}
                  disabled={isProcessing}
                />
                {password && !isPasswordValid && (
                  <FormText className="text-danger fw-bold">
                    비밀번호는 8자 이상, 영문 대소문자, 숫자, 특수문자를 포함해야 합니다.
                  </FormText>
                )}
              </Form.Group>

              {/* 비밀번호 확인 */}
              <Form.Group className="mb-3">
                <Form.Label className="form-label-neo">비밀번호 확인</Form.Label>
                <Form.Control
                  type="password"
                  value={password2}
                  onChange={(e) => setPassword2(e.target.value.replace(/\s/g, ""))}
                  className="form-input-neo"
                  placeholder="비밀번호를 다시 한번 입력해주세요"
                  isInvalid={!!password2 && !isPasswordMatch}
                  disabled={isProcessing}
                />
                {password2 && !isPasswordMatch && (
                  <FormText className="text-danger fw-bold">
                    비밀번호가 일치하지 않습니다.
                  </FormText>
                )}
              </Form.Group>

              {/* 별명 */}
              <Form.Group className="mb-4">
                <Form.Label className="form-label-neo">별명</Form.Label>
                <Form.Control
                  value={nickName}
                  onChange={(e) => setNickName(e.target.value.replace(/\s/g, ""))}
                  className="form-input-neo"
                  placeholder="2~20자, 한글/영문/숫자"
                  isInvalid={!!nickName && !isNickNameValid}
                  disabled={isProcessing}
                />
                {nickName && !isNickNameValid && (
                  <FormText className="text-danger fw-bold">
                    별명은 2~20자, 한글/영문/숫자만 사용할 수 있습니다.
                  </FormText>
                )}
              </Form.Group>

              {/* 자기소개 */}
              <Form.Group className="mb-4">
                <Form.Label className="form-label-neo">자기소개</Form.Label>
                <Form.Control
                  as="textarea"
                  rows={3}
                  value={info}
                  maxLength={1000}
                  placeholder="자기소개를 입력하세요. 1000자 이내 (선택)"
                  onChange={(e) => setInfo(e.target.value)}
                  className="form-input-neo"
                  style={{ resize: "none" }}
                  disabled={isProcessing}
                />
                <div className="text-end text-muted mt-1" style={{ fontSize: "0.8rem" }}>
                  {info.length} / 1000
                </div>
              </Form.Group>

              {/* 가입 버튼 */}
              <div className="mt-4">
                <Button
                  onClick={handleSaveClick}
                  disabled={disabled}
                  className="btn-neo btn-primary-neo w-100"
                >
                  {isProcessing && <Spinner size="sm" className="me-2" />}
                  가입하기
                </Button>
                {!isEmailVerified && (
                  <div className="text-danger fw-bold mt-2" style={{ fontSize: "0.9rem" }}>
                    가입하려면 이메일 인증이 필요합니다.
                  </div>
                )}
              </div>
            </Form>
          </div>
        </div>
      </div>
    </div>
  );
}
