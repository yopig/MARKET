import { useContext, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";
import { toast } from "react-toastify";
import { AuthenticationContext } from "../../common/AuthenticationContextProvider.jsx";
import "../../styles/member-login.css";

export function MemberLogin({ onLoginSuccess, onNavigateToSignup, isModal }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const { login } = useContext(AuthenticationContext);
  const navigate = useNavigate();

  const handleSignupClick = () => {
    if (onNavigateToSignup) onNavigateToSignup();
  };

  async function handleLogInButtonClick() {
    const trimmedEmail = email.trim();
    const trimmedPassword = password.trim();

    if (!trimmedEmail || !trimmedPassword) {
      setErrorMsg("이메일과 비밀번호를 모두 입력하세요.");
      return;
    }

    setLoading(true);
    setErrorMsg("");

    try {
      const res = await axios.post("/api/member/login", {
        email: trimmedEmail,
        password: trimmedPassword,
      });

      const token = res.data.token;
      if (!token) {
        setErrorMsg("로그인에 실패했습니다. 토큰이 없습니다.");
        setLoading(false);
        return;
      }

      login(token);
      toast.success("로그인 되었습니다.");

      if (onLoginSuccess) onLoginSuccess();

      navigate("/");
    } catch (err) {
      const message =
        err.response?.data?.message?.text ||
        "로그인에 실패했습니다. 이메일 또는 비밀번호를 확인하세요.";
      setErrorMsg(message);
    } finally {
      setLoading(false);
    }
  }

  function handleKakaoLoginClick() {
    const KAKAO_REST_API_KEY = import.meta.env.VITE_KAKAO_APP_KEY;
    const KAKAO_REDIRECT_URI = import.meta.env.VITE_KAKAO_REDIRECT_URI;

    const kakaoAuthUrl = `https://kauth.kakao.com/oauth/authorize?client_id=${KAKAO_REST_API_KEY}&redirect_uri=${KAKAO_REDIRECT_URI}&response_type=code`;
    window.location.href = kakaoAuthUrl;
  }

  // 모달용 렌더링 (컨테이너 없음)
  if (isModal) {
    return (
      <>
        {/* 에러 메시지 */}
        {errorMsg && (
          <div className="login-alert">
            <span className="alert-icon">⚠️</span>
            <span>{errorMsg}</span>
          </div>
        )}

        {/* 로그인 폼 */}
        <div className="login-form">
          <div className="form-group-neo">
            <label className="form-label-neo">이메일</label>
            <input
              type="email"
              className="form-input-neo"
              placeholder="이메일을 입력하세요"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={loading}
            />
          </div>

          <div className="form-group-neo">
            <label className="form-label-neo">비밀번호</label>
            <input
              type="password"
              className="form-input-neo"
              placeholder="비밀번호를 입력하세요"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={loading}
            />
          </div>

          {/* 로그인 버튼 */}
          <button
            className="btn-neo btn-primary-neo"
            onClick={handleLogInButtonClick}
            disabled={loading}
          >
            {loading ? (
              <span className="loading-text">
                <span className="spinner-neo"></span>
                로그인 중...
              </span>
            ) : (
              "로그인"
            )}
          </button>

          {/* 구분선 */}
          <div className="divider-neo">
            <span>또는</span>
          </div>

          {/* 카카오 로그인 버튼 */}
          <button
            className="btn-neo btn-kakao-neo"
            onClick={handleKakaoLoginClick}
            disabled={loading}
          >
            <img
              src="https://developers.kakao.com/assets/img/about/logos/kakaolink/kakaolink_btn_small.png"
              alt="카카오 로고"
              className="kakao-logo"
            />
            카카오로 로그인
          </button>

          {/* 회원가입 링크 */}
          <div className="signup-link">
            <span>아직 회원이 아니신가요?</span>
            <Link to="/signup" onClick={handleSignupClick}>
              회원가입
            </Link>
          </div>
        </div>
      </>
    );
  }

  // 페이지용 렌더링 (전체 컨테이너 포함)
  return (
    <div className="login-container">
      <div className="login-card">
        {/* 헤더 섹션 */}
        <div className="login-header">
          <h1 className="login-title">🛡️ 안전마켓</h1>
          <p className="login-subtitle">중고장터 안전한 거래의 시작</p>
        </div>

        {/* 에러 메시지 */}
        {errorMsg && (
          <div className="login-alert">
            <span className="alert-icon">⚠️</span>
            <span>{errorMsg}</span>
          </div>
        )}

        {/* 로그인 폼 */}
        <div className="login-form">
          <div className="form-group-neo">
            <label className="form-label-neo">이메일</label>
            <input
              type="email"
              className="form-input-neo"
              placeholder="이메일을 입력하세요"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={loading}
            />
          </div>

          <div className="form-group-neo">
            <label className="form-label-neo">비밀번호</label>
            <input
              type="password"
              className="form-input-neo"
              placeholder="비밀번호를 입력하세요"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={loading}
            />
          </div>

          {/* 로그인 버튼 */}
          <button
            className="btn-neo btn-primary-neo"
            onClick={handleLogInButtonClick}
            disabled={loading}
          >
            {loading ? (
              <span className="loading-text">
                <span className="spinner-neo"></span>
                로그인 중...
              </span>
            ) : (
              "로그인"
            )}
          </button>

          {/* 구분선 */}
          <div className="divider-neo">
            <span>또는</span>
          </div>

          {/* 카카오 로그인 버튼 */}
          <button
            className="btn-neo btn-kakao-neo"
            onClick={handleKakaoLoginClick}
            disabled={loading}
          >
            <img
              src="https://developers.kakao.com/assets/img/about/logos/kakaolink/kakaolink_btn_small.png"
              alt="카카오 로고"
              className="kakao-logo"
            />
            카카오로 로그인
          </button>

          {/* 회원가입 링크 */}
          <div className="signup-link">
            <span>아직 회원이 아니신가요?</span>
            <Link to="/signup" onClick={handleSignupClick}>
              회원가입
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
