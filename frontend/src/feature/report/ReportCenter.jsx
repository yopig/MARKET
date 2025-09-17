// src/feature/report/ReportCenter.jsx
import { useContext, useEffect, useMemo, useState } from "react";
import {
  Alert,
  Badge,
  Button,
  Form,
  Spinner,
  Table,
  Tabs,
  Tab,
} from "react-bootstrap";
import axios from "axios";
import { toast } from "react-toastify";
import { AuthenticationContext } from "../../common/AuthenticationContextProvider.jsx";
import { useNavigate, useLocation, Navigate } from "react-router-dom";

/** ====== 공통 상수 ====== */
const REASONS = [
  { value: "SPAM", label: "스팸/도배" },
  { value: "SCAM", label: "사기/선입금" },
  { value: "ILLEGAL", label: "불법/위법" },
  { value: "OFFENSIVE", label: "욕설/혐오/선정성" },
  { value: "OTHER", label: "기타" },
];

// ✅ 상태는 두 가지로 축소: 판매중 / 판매완료
const STATUS_OPTIONS = [
  { value: "", label: "전체" },
  { value: "ON_SALE", label: "판매중" },
  { value: "SOLD_OUT", label: "판매완료" },
];

function StatusBadge({ value }) {
  const v = (value || "").toUpperCase();
  if (v === "ON_SALE") return <Badge bg="success">판매중</Badge>;
  if (v === "SOLD_OUT") return <Badge bg="secondary">판매완료</Badge>;
  return <Badge bg="light" text="dark">{value || "-"}</Badge>;
}

/** ====== 신고 폼 ====== */
function ReportForm() {
  const { isLoggedIn } = useContext(AuthenticationContext);
  const navigate = useNavigate();
  const location = useLocation();

  const [boardId, setBoardId] = useState("");
  const [reason, setReason] = useState("SPAM");
  const [detail, setDetail] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const getAuthHeader = () => {
    const token = localStorage.getItem("accessToken") || localStorage.getItem("token");
    return token ? { Authorization: `Bearer ${token}` } : {};
  };

  async function handleSubmit(e) {
    e.preventDefault();
    const bId = Number(boardId);
    if (!bId || bId <= 0) {
      toast.error("게시글 ID를 정확히 입력하세요.");
      return;
    }
    if (!reason) {
      toast.error("신고 사유를 선택하세요.");
      return;
    }
    if (!detail || detail.trim().length < 5) {
      toast.error("상세 사유를 5자 이상 입력하세요.");
      return;
    }

    setSubmitting(true);
    try {
      const res = await axios.post(
        "/api/board-report",
        { boardId: bId, reason, detail },
        { headers: { "Content-Type": "application/json", ...getAuthHeader() } }
      );
      const msg = res.data?.message?.text || "신고가 접수되었습니다.";
      toast.success(msg);
      setBoardId("");
      setReason("SPAM");
      setDetail("");
    } catch (err) {
      const code = err.response?.status;
      if (code === 401 || code === 403) {
        toast.error(code === 401 ? "로그인이 필요합니다." : "권한이 없습니다.");
        navigate("/login", { replace: true, state: { from: location } });
      } else {
        const m = err.response?.data?.message?.text || "신고 접수 중 오류가 발생했습니다.";
        toast.error(m);
        console.error("report submit error:", err.response?.data || err);
      }
    } finally {
      setSubmitting(false);
    }
  }

  if (!isLoggedIn?.()) {
    return <Alert variant="info">신고하려면 로그인 해주세요.</Alert>;
  }

  return (
    <Form onSubmit={handleSubmit} className="p-3 border rounded-3 bg-white">
      <div className="mb-3">
        <Form.Label>게시글 ID</Form.Label>
        <Form.Control
          type="text"
          inputMode="numeric"
          placeholder="예) 123"
          value={boardId}
          onChange={(e) => setBoardId(e.target.value.replace(/[^\d]/g, ""))}
          required
        />
        <Form.Text className="text-muted">신고할 게시글의 숫자 ID를 입력하세요.</Form.Text>
      </div>

      <div className="mb-3">
        <Form.Label>신고 사유</Form.Label>
        <Form.Select value={reason} onChange={(e) => setReason(e.target.value)} required>
          {REASONS.map((r) => (
            <option key={r.value} value={r.value}>{r.label}</option>
          ))}
        </Form.Select>
      </div>

      <div className="mb-3">
        <Form.Label>상세 사유</Form.Label>
        <Form.Control
          as="textarea"
          rows={5}
          placeholder="구체적으로 작성해주세요."
          value={detail}
          onChange={(e) => setDetail(e.target.value)}
          maxLength={2000}
          required
        />
        <div className="text-end text-muted small">{detail.length}/2000</div>
      </div>

      <div className="d-flex justify-content-end">
        <Button type="submit" disabled={submitting}>
          {submitting ? "접수 중…" : "신고 접수"}
        </Button>
      </div>
    </Form>
  );
}

/** ====== 내 신고 내역 ====== */
function MyReportList() {
  const { isAdmin, isLoggedIn, user } = useContext(AuthenticationContext);
  const navigate = useNavigate();
  const location = useLocation();

  const [rows, setRows] = useState([]); // BoardReportDto[]
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // 필터/페이지 상태
  const [status, setStatus] = useState("");
  const [page, setPage] = useState(0);
  const [size, setSize] = useState(20);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);

  const getAuthHeader = () => {
    const token = localStorage.getItem("accessToken") || localStorage.getItem("token");
    return token ? { Authorization: `Bearer ${token}` } : {};
  };

  // ✅ boardId 필터 제거 / 새로고침 버튼 제거 → 관련 쿼리 파라미터도 정리
  const query = useMemo(() => {
    const p = new URLSearchParams();
    p.set("page", page);
    p.set("size", size);
    if (status) p.set("status", status);
    return p.toString();
  }, [page, size, status]);

  async function fetchList() {
    setLoading(true);
    setError("");
    try {
      const res = await axios.get(`/api/board-report?${query}`, {
        headers: { "Content-Type": "application/json", ...getAuthHeader() },
      });
      const d = res.data || {};
      const list = d.content || [];
      setRows(list);
      setPage(d.page ?? 0);
      setSize(d.size ?? 20);
      setTotalPages(d.totalPages ?? 0);
      setTotalElements(d.totalElements ?? 0);
    } catch (err) {
      const code = err.response?.status;
      if (code === 401 || code === 403) {
        navigate("/login", { replace: true, state: { from: location } });
        return;
      }
      const m = err.response?.data?.message?.text || "서버 오류로 신고 내역을 불러올 수 없습니다.";
      setError(m);
      console.error("my report list error:", err.response?.data || err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchList();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query]);

  if (!isLoggedIn?.()) {
    return <Navigate to="/login" replace />;
  }

  // 일반 유저: 클라이언트에서 본인 이메일만 필터링
  const filteredRows = isAdmin?.()
    ? rows
    : rows.filter((r) => {
      const email = (r.reporterEmail || "").toLowerCase();
      const my = (user?.email || "").toLowerCase();
      return my && email === my;
    });

  return (
    <div className="p-3 border rounded-3 bg-white">
      <div className="d-flex flex-wrap align-items-end gap-2 mb-3">
        <div>
          <h5 className="mb-1">{isAdmin?.() ? "전체 신고 내역" : "내 신고 내역"}</h5>
          <div className="text-muted small">
            총 {isAdmin?.() ? totalElements.toLocaleString() : filteredRows.length.toLocaleString()}건
          </div>
        </div>

        {/* 우측 필터: 상태/페이지크기만 남김 */}
        <div className="ms-auto d-flex flex-wrap gap-2">
          <Form.Select
            value={status}
            onChange={(e) => { setPage(0); setStatus(e.target.value); }}
            style={{ minWidth: 160 }}
            title="상태 필터"
          >
            {STATUS_OPTIONS.map(opt => (
              <option key={opt.value || "ALL"} value={opt.value}>{opt.label}</option>
            ))}
          </Form.Select>

          <Form.Select
            value={size}
            onChange={(e) => { setPage(0); setSize(Number(e.target.value) || 20); }}
            style={{ width: 120 }}
            title="페이지 크기"
          >
            {[10, 20, 30, 50].map(s => <option key={s} value={s}>{s}/페이지</option>)}
          </Form.Select>
        </div>
      </div>

      {loading ? (
        <div className="text-center my-4">
          <Spinner animation="border" />
        </div>
      ) : error ? (
        <Alert variant="danger">{error}</Alert>
      ) : filteredRows.length === 0 ? (
        <Alert variant="info">표시할 신고 내역이 없습니다.</Alert>
      ) : (
        <>
          <Table responsive>
            <thead>
            <tr>
              <th>ID</th>
              <th>게시글 ID</th>
              <th>신고자 이메일</th>
              <th>사유</th>
              <th>상세</th>
              <th>상태</th>
              <th>신고일</th>
            </tr>
            </thead>
            <tbody>
            {filteredRows.map(r => (
              <tr key={r.id} className="align-middle">
                <td>{r.id}</td>
                <td>#{r.boardId}</td>
                <td className="text-truncate" title={r.reporterEmail}>{r.reporterEmail}</td>
                <td>{REASONS.find(x => x.value === r.reason)?.label || r.reason}</td>
                <td className="text-truncate" title={r.detail || ""}>
                  {(r.detail || "").slice(0, 60)}{(r.detail || "").length > 60 ? "…" : ""}
                </td>
                <td><StatusBadge value={r.status} /></td>
                <td>{r.insertedAt ? String(r.insertedAt).replace("T"," ").slice(0,16) : "-"}</td>
              </tr>
            ))}
            </tbody>
          </Table>

          <div className="d-flex justify-content-between align-items-center mt-3">
            <div className="text-muted small">
              페이지 {page + 1} / {Math.max(totalPages, 1)}
            </div>
            <div className="d-flex gap-2">
              <Button
                variant="outline-secondary"
                onClick={() => setPage(p => Math.max(0, p - 1))}
                disabled={page <= 0}
              >이전</Button>
              <Button
                variant="outline-secondary"
                onClick={() => setPage(p => (p + 1 < totalPages ? p + 1 : p))}
                disabled={page + 1 >= totalPages}
              >다음</Button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

/** ====== 탑 레벨: 신고 센터 ====== */
export default function ReportCenter() {
  const { isLoggedIn } = useContext(AuthenticationContext);

  if (!isLoggedIn?.()) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="p-4">
      <h2 className="mb-3 fw-bold text-muted">신고 센터</h2>
      <Tabs defaultActiveKey="create" className="mb-3">
        <Tab eventKey="create" title="신고하기">
          <ReportForm />
        </Tab>
        <Tab eventKey="mine" title="내 신고 내역">
          <div className="mt-3">
            <MyReportList />
          </div>
        </Tab>
      </Tabs>
    </div>
  );
}
