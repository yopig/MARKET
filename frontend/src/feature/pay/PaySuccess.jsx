// src/feature/pay/PaySuccess.jsx
import { useEffect, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import axios from "axios";
import { Spinner, Button, Alert } from "react-bootstrap";

export function PaySuccess() {
  const [sp] = useSearchParams();
  const navigate = useNavigate();
  const [state, setState] = useState({ loading: true, error: null, data: null });

  useEffect(() => {
    const paymentKey = sp.get("paymentKey");
    const orderId   = sp.get("orderId");
    const amountStr = sp.get("amount"); // 토스가 넘겨줌(숫자 문자열)
    const boardId   = sp.get("boardId");

    // 기본 검증
    if (!paymentKey || !orderId || !amountStr || !boardId) {
      setState({ loading: false, error: "필수 파라미터가 누락되었습니다.", data: null });
      return;
    }

    const amount = Number(amountStr);
    if (!Number.isFinite(amount) || amount <= 0) {
      setState({ loading: false, error: "결제 금액이 올바르지 않습니다.", data: null });
      return;
    }

    // ✅ 백엔드 승인 호출 (네가 만든 /api/pay/confirm)
    axios.post("/api/pay/confirm", {
      paymentKey,
      orderId,
      amount,      // Object로 보내도 되고 숫자로 보내도 됨(백엔드 toInt가 처리)
      boardId,
    })
      .then((res) => {
        setState({ loading: false, error: null, data: res.data });
      })
      .catch((err) => {
        const msg = err.response?.data?.message || err.message || "승인 처리 중 오류";
        setState({ loading: false, error: msg, data: null });
      });

  }, []);

  if (state.loading) {
    return (
      <div className="container py-5 text-center">
        <Spinner animation="border" />
        <div className="mt-3">결제 승인 처리 중...</div>
      </div>
    );
  }

  if (state.error) {
    return (
      <div className="container py-5">
        <Alert variant="danger">결제 승인 실패: {state.error}</Alert>
        <div className="d-flex gap-2">
          <Button variant="secondary" onClick={() => navigate(-1)}>뒤로가기</Button>
          <Button variant="outline-primary" onClick={() => navigate("/")}>홈으로</Button>
        </div>
      </div>
    );
  }

  // 성공
  const r = state.data; // ConfirmResponse
  return (
    <div className="container py-5">
      <h2 className="mb-3">결제가 완료되었습니다.</h2>
      <ul className="list-unstyled">
        <li><strong>상태:</strong> {r.status}</li>
        <li><strong>주문번호:</strong> {r.orderId}</li>
        <li><strong>결제키:</strong> {r.paymentKey}</li>
        <li><strong>결제금액:</strong> {r.amount?.toLocaleString?.() ?? r.amount} 원</li>
        <li><strong>결제수단:</strong> {r.method}</li>
        {r.receiptUrl && (
          <li>
            <strong>영수증:</strong>{" "}
            <a href={r.receiptUrl} target="_blank" rel="noreferrer">열기</a>
          </li>
        )}
      </ul>
      <div className="d-flex gap-2 mt-3">
        <Button variant="primary" onClick={() => navigate(`/board/${new URLSearchParams(location.search).get("boardId")}`)}>
          게시글로 돌아가기
        </Button>
        <Button variant="outline-secondary" onClick={() => navigate("/")}>
          홈
        </Button>
      </div>
    </div>
  );
}
