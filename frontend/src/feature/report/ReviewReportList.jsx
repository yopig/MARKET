import { useEffect, useState, useContext } from "react";
import { Table, Alert, Spinner } from "react-bootstrap";
import { AuthenticationContext } from "../../common/AuthenticationContextProvider.jsx";
import { Navigate, useNavigate } from "react-router-dom";
import axios from "axios";
import "../../styles/ReviewReportList.css";
import { ReviewText } from "../../common/ReviewText.jsx";
import { toast } from "react-toastify";
import ReviewReportActions from "./ReviewReportActions.jsx";

export default function ReviewReportList() {
  const { isAdmin, loading: loadingAuth } = useContext(AuthenticationContext);
  const [reports, setReports] = useState([]);
  const [loadingReports, setLoadingReports] = useState(true);
  const [error, setError] = useState("");
  const [deletingId, setDeletingId] = useState(null); // 리뷰 삭제 ID
  const [reportToDelete, setReportToDelete] = useState(null); // 신고 내역 삭제 ID
  const navigate = useNavigate();

  function getAuthHeader() {
    const token = localStorage.getItem("accessToken");
    return token ? { Authorization: `Bearer ${token}` } : {};
  }

  useEffect(() => {
    async function fetchReports() {
      try {
        const res = await axios.get("/api/review/report/list", {
          headers: {
            "Content-Type": "application/json",
            ...getAuthHeader(),
          },
        });
        setReports(res.data);
      } catch (err) {
        if (err.response?.status === 401) {
          setError("로그인이 필요합니다.");
        } else if (err.response?.status === 403) {
          setError("권한이 없습니다.");
        } else {
          setError("서버 오류로 신고 내역을 불러올 수 없습니다.");
        }
      } finally {
        setLoadingReports(false);
      }
    }
    fetchReports();
  }, []);

  async function handleDeleteReportOnly(id) {
    if (reportToDelete) return;
    setReportToDelete(id);

    try {
      await axios.delete(`/api/review/report/${id}`, {
        headers: {
          "Content-Type": "application/json",
          ...getAuthHeader(),
        },
      });
      toast.success("신고 내역이 성공적으로 삭제되었습니다.");
      setReports((prev) => prev.filter((r) => String(r.id) !== String(id)));
    } catch (err) {
      console.error(err);
      toast.error(
        err.response?.data?.message || "신고 내역 삭제 중 오류가 발생했습니다.",
      );
    } finally {
      setReportToDelete(null);
    }
  }

  async function handleDeleteReview(reviewId) {
    if (deletingId) return;
    setDeletingId(reviewId);

    try {
      await axios.delete(`/api/review/delete/${reviewId}`, {
        headers: {
          "Content-Type": "application/json",
          ...getAuthHeader(),
        },
      });
      toast.success("리뷰와 관련된 모든 신고가 삭제되었습니다.");
      setReports((prev) =>
        prev.filter((r) => String(r.reviewId) !== String(reviewId)),
      );
    } catch (err) {
      console.error(err);
      toast.error(
        err.response?.data?.message ||
          "리뷰와 신고 삭제 중 오류가 발생했습니다.",
      );
    } finally {
      setDeletingId(null);
    }
  }

  const handleRowClick = (reviewWriterId, reviewId, e) => {
    // ReviewReportActions 내부 클릭이면 이동 막기
    if (
      e.target.closest(".review-actions-container") ||
      e.target.closest(".modal")
    ) {
      return;
    }

    if (reviewWriterId) {
      navigate(`/review/my/${reviewWriterId}?focusReviewId=${reviewId}`);
    } else {
      toast.error("작성자 정보가 없습니다.");
    }
  };

  if (loadingAuth || loadingReports) {
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

  if (reports.length === 0) {
    return <Alert variant="info">신고된 리뷰가 없습니다.</Alert>;
  }

  return (
    <div className="p-4">
      <h2 className="mb-4 fw-bold text-muted">리뷰 신고 내역 목록</h2>
      <Table className="review-report-table" responsive>
        <thead>
          <tr>
            <th>신고자 이메일</th>
            <th>리뷰 ID</th>
            <th>신고 사유</th>
            <th>신고일</th>
          </tr>
        </thead>
        <tbody>
          {reports.map(
            ({
              id,
              reporterEmail,
              reviewId,
              reason,
              reportedAt,
              reviewWriterId,
            }) => (
              <tr
                key={id}
                className={reviewWriterId ? "clickable-row" : ""}
                onClick={(e) => handleRowClick(reviewWriterId, reviewId, e)}
                title={reviewWriterId ? "작성자 리뷰 보기" : undefined}
              >
                <td className="reporter-email-cell">
                  <div className="d-flex align-items-center">
                    <div
                      className="flex-grow-1 text-truncate me-2"
                      title={reporterEmail}
                    >
                      {reporterEmail}
                    </div>
                    <ReviewReportActions
                      reportId={id}
                      reviewId={reviewId}
                      handleDeleteReportOnly={handleDeleteReportOnly}
                      handleDeleteReview={handleDeleteReview}
                    />
                  </div>
                </td>
                <td>{reviewId}</td>
                <td className="reason-cell">
                  <ReviewText text={reason} />
                </td>
                <td>{reportedAt ? reportedAt.substring(0, 10) : "-"}</td>
              </tr>
            ),
          )}
        </tbody>
      </Table>
    </div>
  );
}
