// src/feature/pay/PayFail.jsx
import { useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Button } from "react-bootstrap";
import { toast } from "react-toastify";

export default function PayFail() {
  const [search] = useSearchParams();
  const navigate = useNavigate();
  const code = search.get("code");
  const message = search.get("message");
  const boardId = search.get("boardId") || "";

  useEffect(() => {
    if (message) toast.error(decodeURIComponent(message));
  }, [message]);

  return (
    <div className="container my-5">
      <h2>결제에 실패했어요</h2>
      <p className="text-muted">사유: {decodeURIComponent(message || "알 수 없음")} {code ? `(${code})` : ""}</p>
      {boardId && (
        <Button variant="primary" onClick={() => navigate(`/board/detail/${boardId}`)}>
          게시글로 돌아가기
        </Button>
      )}
    </div>
  );
}
