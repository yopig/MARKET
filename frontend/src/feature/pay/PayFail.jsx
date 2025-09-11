// src/feature/pay/PayFail.jsx
import { useSearchParams, useNavigate } from "react-router-dom";
import { Alert, Button } from "react-bootstrap";

export function PayFail() {
  const [sp] = useSearchParams();
  const navigate = useNavigate();
  const code = sp.get("code");
  const message = sp.get("message");
  const boardId = sp.get("boardId");

  return (
    <div className="container py-5">
      <Alert variant="warning">
        <h4 className="mb-2">결제가 완료되지 않았습니다.</h4>
        <div className="mb-1"><strong>코드:</strong> {code || "-"}</div>
        <div><strong>사유:</strong> {message || "사용자가 취소했거나 오류가 발생했습니다."}</div>
      </Alert>
      <div className="d-flex gap-2">
        {boardId && (
          <Button variant="primary" onClick={() => navigate(`/board/${boardId}`)}>
            게시글로 돌아가기
          </Button>
        )}
        <Button variant="outline-secondary" onClick={() => navigate("/")}>홈</Button>
      </div>
    </div>
  );
}
