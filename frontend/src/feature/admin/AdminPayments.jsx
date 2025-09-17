// src/feature/admin/AdminPayments.jsx
import { useEffect, useState } from "react";
import axios from "axios";
import { Table, Spinner, Pagination, Badge } from "react-bootstrap";

export default function AdminPayments() {
  const [page, setPage] = useState(0);
  const [size] = useState(20);
  const [data, setData] = useState(null);

  useEffect(() => {
    let alive = true;
    setData(null);
    axios.get("/api/admin/payments", { params: { page, size } })
      .then(res => { if (alive) setData(res.data); })
      .catch(() => { /* 권한/네트워크 오류 등 처리 */ });
    return () => { alive = false; };
  }, [page, size]);

  if (!data) return <div className="my-4"><Spinner animation="border" /> 불러오는 중...</div>;

  return (
    <div className="container my-4">
      <h3>결제 내역</h3>
      <Table bordered hover responsive className="mt-3">
        <thead>
        <tr>
          <th>ID</th>
          <th>주문번호</th>
          <th>결제키</th>
          <th>금액</th>
          <th>상태</th>
          <th>수단</th>
          <th>게시글ID</th>
          <th>영수증</th>
          <th>결제시각</th>
        </tr>
        </thead>
        <tbody>
        {data.content.map((p) => (
          <tr key={p.id}>
            <td>{p.id}</td>
            <td>{p.orderId}</td>
            <td style={{maxWidth:280, overflow:"hidden", textOverflow:"ellipsis"}}>{p.paymentKey}</td>
            <td>{Number(p.amount).toLocaleString()}원</td>
            <td>
              <Badge bg={p.status === "PAID" ? "success" : (p.status === "CANCELED" ? "secondary" : "danger")}>
                {p.status}
              </Badge>
            </td>
            <td>{p.method}</td>
            <td>{p.boardId}</td>
            <td>{p.receiptUrl ? <a href={p.receiptUrl} target="_blank" rel="noreferrer">열기</a> : "-"}</td>
            <td>{(p.createdAt || "").replace("T"," ").slice(0,19)}</td>
          </tr>
        ))}
        </tbody>
      </Table>

      <Pagination className="mt-2">
        <Pagination.Prev disabled={page === 0} onClick={() => setPage((p) => Math.max(0, p - 1))}/>
        <Pagination.Item active>{page + 1}</Pagination.Item>
        <Pagination.Next disabled={data.last} onClick={() => setPage((p) => p + 1)}/>
      </Pagination>
    </div>
  );
}
