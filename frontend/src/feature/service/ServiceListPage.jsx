import { useEffect, useState, useContext } from "react";
import {
  Table,
  Alert,
  Spinner,
  Button,
  Modal,
  Tooltip,
  OverlayTrigger,
} from "react-bootstrap";
import { AuthenticationContext } from "../../common/AuthenticationContextProvider.jsx";
import { Navigate, useNavigate } from "react-router-dom";
import { FaUserCircle, FaTrash } from "react-icons/fa";
import { BsChatLeftTextFill, BsCalendar2DateFill } from "react-icons/bs";
import axios from "axios";
import "../../styles/ServiceList.css";
import { ReviewText } from "../../common/ReviewText.jsx";
import { toast } from "react-toastify";

export default function ServiceListPage() {
  const { isAdmin, loading: loadingAuth } = useContext(AuthenticationContext);
  const [services, setServices] = useState([]);
  const [loadingServices, setLoadingServices] = useState(true);
  const [error, setError] = useState("");
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedServiceId, setSelectedServiceId] = useState(null);
  const [deletingId, setDeletingId] = useState(null); // 삭제 중 표시용
  const navigate = useNavigate();

  // 🔹 모든 Hooks 최상위에서 호출
  useEffect(() => {
    async function fetchServices() {
      try {
        const res = await axios.get("/api/support/list");
        setServices(res.data);
      } catch (err) {
        if (err.response?.status === 401) {
          setError("로그인이 필요합니다.");
        } else {
          setError("서버 오류로 문의 내역을 불러올 수 없습니다.");
        }
      } finally {
        setLoadingServices(false);
      }
    }
    fetchServices();
  }, []);

  // 이메일 옆 휴지통 버튼 클릭 — propagation 막기
  const handleDeleteClick = (event, id) => {
    event.stopPropagation();
    setSelectedServiceId(id);
    setShowDeleteModal(true);
  };

  const handleDeleteConfirmed = async () => {
    setShowDeleteModal(false);
    if (!selectedServiceId) return;
    try {
      setDeletingId(selectedServiceId);
      await axios.delete(`/api/support/${selectedServiceId}`);
      setServices((prev) =>
        prev.filter((item) => item.id !== selectedServiceId),
      );
      toast.success("문의 답변 완료되었습니다.");
    } catch (err) {
      console.error("삭제 중 오류가 발생했습니다.", err);
      toast.error("삭제 중 오류가 발생했습니다.");
    } finally {
      setDeletingId(null);
      setSelectedServiceId(null);
    }
  };

  // 🔹 인증 상태 로딩 중이면 로딩 화면
  if (loadingAuth || loadingServices) {
    return (
      <div className="text-center my-5">
        <Spinner animation="border" />
        <div className="mt-2 text-muted">데이터를 불러오는 중입니다...</div>
      </div>
    );
  }

  // 🔹 인증 후 admin 체크
  if (!isAdmin()) {
    return <Navigate to="/login" replace />;
  }

  if (error) {
    return <Alert variant="danger">{error}</Alert>;
  }

  if (services.length === 0) {
    return <Alert variant="info">등록된 문의가 없습니다.</Alert>;
  }

  return (
    <div className="p-4">
      <h2 className="mb-4 fw-bold text-muted">문의 내역 목록</h2>
      <Table className="service-list-table" responsive>
        <thead>
          <tr>
            <th>이메일</th>
            <th>제목</th>
            <th>내용</th>
            <th>접수일</th>
          </tr>
        </thead>
        <tbody>
          {services.map(({ id, email, title, content, inserted_at }) => (
            <tr
              key={id}
              onClick={() => {
                /* 행 클릭으로 상세 페이지나 다른 동작이 필요하면 여기서 처리 */
              }}
            >
              <td className="text-truncate service-email-cell" title={email}>
                <div className="d-flex align-items-center">
                  <span className="flex-grow-1 text-truncate me-2">
                    {email}
                  </span>
                  <OverlayTrigger
                    placement="top"
                    overlay={
                      <Tooltip id={`tooltip-delete-${id}`}>문의 삭제</Tooltip>
                    }
                  >
                    <Button
                      variant="outline-danger"
                      size="sm"
                      onClick={(e) => handleDeleteClick(e, id)}
                      disabled={deletingId === id}
                      aria-label={`delete-service-${id}`}
                    >
                      {deletingId === id ? (
                        <Spinner animation="border" size="sm" />
                      ) : (
                        <FaTrash />
                      )}
                    </Button>
                  </OverlayTrigger>
                </div>
              </td>
              <td className="text-truncate" title={title}>
                {title}
              </td>
              <td className="content-cell">
                <ReviewText text={content} />
              </td>
              <td>{inserted_at ? inserted_at.substring(0, 10) : "-"}</td>
            </tr>
          ))}
        </tbody>
      </Table>

      <Modal
        show={showDeleteModal}
        onHide={() => setShowDeleteModal(false)}
        centered
      >
        <Modal.Header closeButton>
          <Modal.Title>문의 삭제</Modal.Title>
        </Modal.Header>
        <Modal.Body>정말 이 문의를 삭제하시겠습니까?</Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowDeleteModal(false)}>
            취소
          </Button>
          <Button
            variant="danger"
            onClick={handleDeleteConfirmed}
            disabled={deletingId === selectedServiceId}
          >
            {deletingId === selectedServiceId ? "삭제 중..." : "삭제"}
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
}
