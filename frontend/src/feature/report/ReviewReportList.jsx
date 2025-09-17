// src/feature/board/BoardReportList.jsx
import { useEffect, useState, useContext } from "react";
import { Table, Alert, Spinner, Button } from "react-bootstrap";
import { AuthenticationContext } from "../../common/AuthenticationContextProvider.jsx";
import { Navigate, useNavigate, useLocation } from "react-router-dom";
import axios from "axios";
import { toast } from "react-toastify";
import "../../styles/ReviewReportList.css";

// 사유 라벨
const REASON_LABELS = {
  SPAM: "스팸/도배",
  SCAM: "사기/선입금",
  ILLEGAL: "불법/위법",
  OFFENSIVE: "욕설/혐오/선정성",
  OTHER: "기타",
};

export default function BoardReportList() {
  const { isAdmin, loading: loadingAuth } = useContext(AuthenticationContext);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [rows, setRows] = useState([]); // BoardReportDto[]
  const [deletingId, setDeletingId] = useState(null);

  const navigate = useNavigate();
  const location = useLocation();

  function getAuthHeader() {
    const token = localStorage.getItem("accessToken") || localStorage.getItem("token");
    return token ? { Authorization: `Bearer ${token}` } : {};
  }

  async function fetchReports() {
    setLoading(true);
    setError("");
    try {
      const res = await axios.get(`/api/board-report`, {
        headers: { "Content-Type": "application/json", ...getAuthHeader() },
      });
      const data = res.data || {};
      setRows(data.content || []);
    } catch (err) {
      const code = err.response?.status;
      if (code === 401 || code === 403) {
        toast.error(code === 401 ? "로그인이 필요합니다." : "권한이 없습니다.");
        navigate("/login", { replace: true, state: { from: location } });
        return;
      }
      setError("서버 오류로 신고 내역을 불러올 수 없습니다.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchReports();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function handleRowClick(boardId, e) {
    if (e.target.closest(".report-actions") || e.target.tagName === "BUTTON") return;
    if (!boardId) return;
    navigate(`/board/${boardId}`);
  }

  async function handleDeleteReport(id) {
    setDeletingId(id);
    try {
      await axios.delete(`/api/board-report/${id}`, {
        headers: { "Content-Type": "application/json", ...getAuthHeader() },
      });
      toast.success("신고 내역이 삭제되었습니다.");
      setRows((prev) => prev.filter((r) => String(r.id) !== String(id)));
    } catch (err) {
      const code = err.response?.status;
      if (code === 401 || code === 403) {
        toast.error(code === 401 ? "로그인이 필요합니다." : "권한이 없습니다.");
        navigate("/login", { replace: true, state: { from: location } });
      } else {
        const m = err?.response?.data?.message?.text || "신고 내역 삭제 중 오류가 발생했습니다.";
        toast.error(m);
      }
    } finally {
      setDeletingId(null);
    }
  }

  if (loadingAuth || loading) {
    return (
      <div className="text-center my-5">
        <Spinner animation="border" />
        <div className="mt-2 text-muted">데이터를 불러오는 중입니다...</div>
      </div>
    );
  }

  if (!isAdmin()) {
    return <Navigate to="/login" replace />;
  }

  if (error) {
    return <Alert variant="danger">{error}</Alert>;
  }

  return (
    <div className="p-4">
      <div className="d-flex flex-wrap align-items-end gap-3 mb-3">
        <div>
          <h2 className="mb-1 fw-bold text-muted">게시물 신고 내역</h2>
          <div className="text-muted small">총 {rows.length.toLocaleString()}건</div>
        </div>
      </div>

      {rows.length === 0 ? (
        <Alert variant="info">조건에 해당하는 신고가 없습니다.</Alert>
      ) : (
        <Table className="review-report-table" responsive>
          <thead>
          <tr>
            <th>ID</th>
            <th>게시글 ID</th>
            <th>신고자 이메일</th>
            <th>사유</th>
            <th>상세</th>
            <th>신고일</th>
            <th style={{ width: 120 }}>관리</th>
          </tr>
          </thead>
          <tbody>
          {rows.map((r) => (
            <tr
              key={r.id}
              className="clickable-row"
              onClick={(e) => handleRowClick(r.boardId, e)}
              title="게시글 상세로 이동"
            >
              <td>{r.id}</td>
              <td>#{r.boardId}</td>
              <td className="reporter-email-cell">
                <div className="text-truncate" title={r.reporterEmail}>{r.reporterEmail}</div>
              </td>
              <td className="reason-cell">{REASON_LABELS[r.reason] || r.reason}</td>
              <td className="text-truncate" title={r.detail || ""}>
                {(r.detail || "").slice(0, 50)}{r.detail && r.detail.length > 50 ? "…" : ""}
              </td>
              <td>{r.insertedAt ? String(r.insertedAt).replace("T", " ").slice(0, 16) : "-"}</td>
              <td className="report-actions">
                <Button
                  size="sm"
                  variant="outline-danger"
                  onClick={(e) => { e.stopPropagation(); handleDeleteReport(r.id); }}
                  disabled={deletingId === r.id}
                  title="신고 삭제"
                >
                  {deletingId === r.id ? "삭제중…" : "삭제"}
                </Button>
              </td>
            </tr>
          ))}
          </tbody>
        </Table>
      )}
    </div>
  );
}
