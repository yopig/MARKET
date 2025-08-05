import { useEffect, useState, useContext } from "react";
import { Table, Alert, Spinner } from "react-bootstrap";
import { AuthenticationContext } from "../../common/AuthenticationContextProvider.jsx";
import { Navigate } from "react-router-dom";
import axios from "axios"; // ✅ 추가

export default function ServiceListPage() {
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const { isAdmin } = useContext(AuthenticationContext);

  if (!(typeof isAdmin === "function" ? isAdmin() : isAdmin)) {
    return <Navigate to="/login" replace />;
  }

  useEffect(() => {
    async function fetchServices() {
      try {
        const res = await axios.get("/api/support/list"); // ✅ 수정됨
        const data = res.data; // ✅ 수정됨
        setServices(data);
      } catch (err) {
        if (err.response?.status === 401) {
          setError("로그인이 필요합니다.");
        } else {
          setError("서버 오류로 문의 내역을 불러올 수 없습니다.");
        }
      } finally {
        setLoading(false);
      }
    }

    fetchServices();
  }, []);

  if (loading) {
    return (
      <div className="text-center my-4">
        <Spinner animation="border" />
        <div>불러오는 중...</div>
      </div>
    );
  }

  if (error) {
    return <Alert variant="danger">{error}</Alert>;
  }

  if (services.length === 0) {
    return <Alert variant="info">등록된 문의가 없습니다.</Alert>;
  }

  return (
    <div style={{ padding: "2rem" }}>
      <h2 className="mb-4">문의 내역 목록</h2>
      <Table striped bordered hover>
        <thead>
        <tr>
          <th>#</th>
          <th>이메일</th>
          <th>제목</th>
          <th>내용</th>
          <th>접수일</th>
        </tr>
        </thead>
        <tbody>
        {services.map(({ id, email, title, content, inserted_at }, idx) => (
          <tr key={id ?? idx}>
            <td>{idx + 1}</td>
            <td>{email}</td>
            <td>{title}</td>
            <td style={{ whiteSpace: "pre-wrap", wordBreak: "break-word" }}>
              {content}
            </td>
            <td>{new Date(inserted_at).toLocaleString()}</td>
          </tr>
        ))}
        </tbody>
      </Table>
    </div>
  );
}
