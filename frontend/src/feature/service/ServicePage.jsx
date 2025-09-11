// src/feature/service/ServicePage.jsx (FULL REPLACE)
import { useState, useMemo } from "react";
import { Form, Button, Alert } from "react-bootstrap";
import "../../styles/service.css";
import { FaPhoneAlt, FaRegBuilding, FaRegEnvelope } from "react-icons/fa";

// 최대 길이 상수
const MAX_SUBJECT_LENGTH = 30;
const MAX_MESSAGE_LENGTH = 300;

// .env의 VITE_API_BASE 우선 사용, 없으면 상대경로
const API_BASE =
  (typeof import.meta !== "undefined" && import.meta.env?.VITE_API_BASE) || "";

export default function ServicePage() {
  const [form, setForm] = useState({
    email: "",
    subject: "",
    message: "",
    // 스팸봇 차단용(사용자는 보이지 않음, 값이 있으면 차단)
    nickname: "",
  });

  const [loading, setLoading] = useState(false);
  const [justSubmitted, setJustSubmitted] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  const [formErrors, setFormErrors] = useState({
    email: "",
    subject: "",
    message: "",
  });

  const validateEmail = (email) =>
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());

  const subjectCount = useMemo(
    () => `${form.subject.length} / ${MAX_SUBJECT_LENGTH}`,
    [form.subject.length]
  );
  const messageCount = useMemo(
    () => `${form.message.length} / ${MAX_MESSAGE_LENGTH}`,
    [form.message.length]
  );

  const handleChange = (e) => {
    const { name, value } = e.target;

    if (name === "subject" && value.length > MAX_SUBJECT_LENGTH) return;
    if (name === "message" && value.length > MAX_MESSAGE_LENGTH) return;

    setForm((prev) => ({ ...prev, [name]: value }));

    // 입력 중 유효성 반영
    setFormErrors((prev) => {
      const next = { ...prev };
      if (name === "email") {
        next.email = validateEmail(value) ? "" : "올바른 이메일 형식을 입력하세요.";
      }
      if (name === "subject") {
        next.subject =
          value.length === 0
            ? `제목은 1자 이상 ${MAX_SUBJECT_LENGTH}자 이하로 작성해주세요.`
            : "";
      }
      if (name === "message") {
        next.message =
          value.length === 0
            ? `문의 내용은 1자 이상 ${MAX_MESSAGE_LENGTH}자 이하로 작성해주세요.`
            : "";
      }
      return next;
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // 허니팟 값이 있으면 봇으로 간주
    if (form.nickname) {
      setErrorMsg("전송이 차단되었습니다. 다시 시도해주세요.");
      return;
    }

    const errors = { email: "", subject: "", message: "" };
    let hasError = false;

    if (!validateEmail(form.email)) {
      errors.email = "올바른 이메일 형식을 입력하세요.";
      hasError = true;
    }
    if (form.subject.length === 0) {
      errors.subject = `제목은 1자 이상 ${MAX_SUBJECT_LENGTH}자 이하로 작성해주세요.`;
      hasError = true;
    }
    if (form.message.length === 0) {
      errors.message = `문의 내용은 1자 이상 ${MAX_MESSAGE_LENGTH}자 이하로 작성해주세요.`;
      hasError = true;
    }

    if (hasError) {
      setFormErrors(errors);
      return;
    }

    setFormErrors({ email: "", subject: "", message: "" });
    setErrorMsg("");
    setSuccessMsg("");
    setLoading(true);

    try {
      const res = await fetch(`${API_BASE}/api/support`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        // 백엔드가 필요하면 추후 제목/본문 앞뒤 공백 트림 or XSS 필터링 추가
        body: JSON.stringify({
          email: form.email.trim(),
          subject: form.subject.trim(),
          message: form.message.trim(),
        }),
      });

      if (!res.ok) throw new Error("SERVER_ERROR");

      const text = await res.text();
      setSuccessMsg(text || "문의가 접수되었습니다. 빠르게 답변드릴게요!");
      setForm({ email: "", subject: "", message: "", nickname: "" });
      setJustSubmitted(true);
      // 3초 후 재전송 가능
      setTimeout(() => setJustSubmitted(false), 3000);
    } catch {
      setErrorMsg("문의 접수 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="support-page-container">
      <div className="support-page-header">
        <h1>고객센터</h1>
        <p>
          안전마켓 이용 중 궁금한 점이나 불편 사항이 있나요?
          <br />
          언제든 편하게 문의해 주세요. 빠르게 도와드릴게요.
        </p>
      </div>

      <div className="support-grid">
        {/* 좌측 안내 패널 */}
        <div className="support-info-panel">
          <h3>문의 안내</h3>
          <p>
            아래 연락처로 직접 문의하시거나, 오른쪽 양식을 작성해 보내주시면
            순차적으로 답변드립니다.
          </p>
          <div className="contact-details">
            <div className="contact-item">
              <FaRegBuilding size={20} />
              <span>안전마켓 운영팀</span>
            </div>
            <div className="contact-item">
              <FaRegEnvelope size={20} />
              <span>support@safety-market.app</span>
            </div>
            <div className="contact-item">
              <FaPhoneAlt size={20} />
              <span>TEL: 010-0000-0000</span>
            </div>
          </div>
          <ul className="mt-3 text-muted" style={{ fontSize: "0.9rem" }}>
            <li>운영시간: 평일 10:00 ~ 18:00 (주말/공휴일 휴무)</li>
            <li>중고거래 사기 의심 시 즉시 신고해 주세요.</li>
          </ul>
        </div>

        {/* 우측 폼 패널 */}
        <div className="support-form-panel">
          {successMsg && (
            <Alert className="alert-neo alert-success-neo">{successMsg}</Alert>
          )}
          {errorMsg && (
            <Alert className="alert-neo alert-danger-neo">{errorMsg}</Alert>
          )}

          <Form onSubmit={handleSubmit} noValidate>
            {/* 허니팟: 시각적으로 숨김 */}
            <div style={{ position: "absolute", left: "-10000px", top: "auto" }}>
              <label>
                Leave this field empty
                <input
                  type="text"
                  name="nickname"
                  value={form.nickname}
                  onChange={handleChange}
                  tabIndex={-1}
                  autoComplete="off"
                />
              </label>
            </div>

            <Form.Group className="mb-4" controlId="formEmail">
              <Form.Label className="form-label-neo">이메일 주소</Form.Label>
              <Form.Control
                type="email"
                name="email"
                value={form.email}
                onChange={handleChange}
                isInvalid={!!formErrors.email}
                required
                className="form-input-neo"
                placeholder="답변을 받을 이메일을 입력하세요"
              />
              <Form.Control.Feedback type="invalid">
                {formErrors.email}
              </Form.Control.Feedback>
            </Form.Group>

            <Form.Group className="mb-4" controlId="formSubject">
              <Form.Label className="form-label-neo">제목</Form.Label>
              <Form.Control
                type="text"
                name="subject"
                value={form.subject}
                onChange={handleChange}
                isInvalid={!!formErrors.subject}
                maxLength={MAX_SUBJECT_LENGTH}
                required
                className="form-input-neo"
                placeholder="예) 거래 취소 문의"
              />
              <Form.Control.Feedback type="invalid">
                {formErrors.subject}
              </Form.Control.Feedback>
              <div className="text-end text-muted mt-1" style={{ fontSize: "0.8rem" }}>
                {subjectCount}
              </div>
            </Form.Group>

            <Form.Group className="mb-4" controlId="formMessage">
              <Form.Label className="form-label-neo">문의 내용</Form.Label>
              <Form.Control
                as="textarea"
                rows={6}
                name="message"
                value={form.message}
                onChange={handleChange}
                isInvalid={!!formErrors.message}
                maxLength={MAX_MESSAGE_LENGTH}
                required
                className="form-input-neo"
                style={{ resize: "none" }}
                placeholder={
                  "상세 상황(상품/거래 링크, 시간, 상대 닉네임 등)을 남겨주시면\n더 신속하게 도와드릴 수 있어요."
                }
              />
              <Form.Control.Feedback type="invalid">
                {formErrors.message}
              </Form.Control.Feedback>
              <div className="text-end text-muted mt-1" style={{ fontSize: "0.8rem" }}>
                {messageCount}
              </div>
            </Form.Group>

            <Button
              type="submit"
              disabled={loading || justSubmitted}
              className="btn-neo btn-warning-neo w-100"
            >
              {loading ? "전송 중..." : justSubmitted ? "잠시 후 재전송 가능" : "문의 보내기"}
            </Button>
          </Form>
        </div>
      </div>
    </div>
  );
}
