import React, { useEffect, useContext, useRef } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import axios from "axios";
import { AuthenticationContext } from "../../common/AuthenticationContextProvider"; // 경로 확인 필요
import { Spinner } from "react-bootstrap";
import { toast } from "react-toastify";

export function KakaoCallback() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { login } = useContext(AuthenticationContext);

  const hasRun = useRef(false); // 💡 실행 여부 추적

  useEffect(() => {
    if (hasRun.current) return;
    hasRun.current = true;

    const code = searchParams.get("code");

    if (code) {
      axios
        .post("/api/member/login/kakao", { code })
        .then((response) => {
          const { token } = response.data;
          if (token) {
            login(token);
            toast.success("카카오 계정으로 로그인되었습니다.");
            navigate("/");
          } else {
            throw new Error("토큰이 수신되지 않았습니다.");
          }
        })
        .catch((error) => {
          console.error("카카오 로그인 처리 중 오류 발생:", error);
          toast.error("로그인에 실패했습니다. 다시 시도해주세요.");
          navigate("/login");
        });
    }
  }, [searchParams, login, navigate]);

  return (
    <div className="d-flex justify-content-center align-items-center vh-100">
      <Spinner animation="border" />
      <span className="ms-3">카카오 로그인 처리 중입니다...</span>
    </div>
  );
}