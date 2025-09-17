// src/feature/pay/PaySuccess.jsx
import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import axios from "axios";
import { Spinner } from "react-bootstrap";
import { toast } from "react-toastify";

export default function PaySuccess() {
  const [search] = useSearchParams();
  const navigate = useNavigate();
  const paymentKey = search.get("paymentKey");
  const orderId    = search.get("orderId");
  const boardId    = search.get("boardId"); // 우리가 successUrl에 붙였던 값
  const [busy, setBusy] = useState(true);

  useEffect(() => {
    (async () => {
      if (!paymentKey || !orderId || !boardId) {
        toast.error("결제 성공 파라미터가 유효하지 않습니다.");
        navigate("/");
        return;
      }

      try {
        // 금액 검증은 서버에서 게시글 가격과 대조하므로 클라이언트가 한 번 더 조회해도 되고 생략해도 됨
        // 여기서는 서버가 신뢰원이라 amount를 서버에서 재검증하도록 게시글 가격을 가져와 사용
        const { data: board } = await axios.get(`/api/board/${boardId}`);
        const amount = Number(String(board?.price ?? "").replace(/[^\d.-]/g, ""));
        if (!Number.isFinite(amount) || amount <= 0) {
          throw new Error("게시글 가격이 유효하지 않습니다.");
        }

        await axios.post("/api/pay/confirm", {
          paymentKey,
          orderId,
          amount,                   // 서버에서 다시 검증함
          boardId: Number(boardId),
        });

        toast.success("결제가 완료되었어요. 판매자에게 안내할게요.");
        // 상세 페이지로 이동(서버에서 이미 상태를 PAID로 바꿨으니 버튼 자동 비활성화)
        navigate(`/board/detail/${boardId}`, { replace: true });
      } catch (e) {
        console.warn("confirm failed", e);
        const msg = e?.response?.data?.message || e?.message || "결제 승인 처리 중 오류가 발생했습니다.";
        toast.error(msg);
        navigate(`/pay/fail?boardId=${boardId}&orderId=${encodeURIComponent(orderId)}`, { replace: true });
      } finally {
        setBusy(false);
      }
    })();
  }, [paymentKey, orderId, boardId, navigate]);

  return (
    <div className="d-flex justify-content-center my-5">
      <Spinner animation="border" role="status" />
      <span className="ms-2">결제 승인 처리 중...</span>
    </div>
  );
}
