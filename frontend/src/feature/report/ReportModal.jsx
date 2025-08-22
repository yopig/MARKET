import React, { useState } from "react";
import axios from "axios";
import { toast } from "react-toastify";

export default function ReportModal({ reviewId, onClose }) {
  const [reason, setReason] = useState("");
  const [loading, setLoading] = useState(false);

  const submitReport = async () => {
    if (!reason.trim()) {
      alert("신고 사유를 입력해주세요.");
      return;
    }
    setLoading(true);
    try {
      await axios.post("/api/review/report", {
        reviewId,
        reason: reason.trim(),
      });
      toast.success("신고가 접수되었습니다.");
      onClose();
    } catch (error) {
      console.error("신고 실패:", error);
      toast.error(
        "신고 실패: " + (error.response?.data?.message || error.message)
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="modal show d-block"
      tabIndex="-1"
      style={{ backgroundColor: "rgba(0,0,0,0.5)" }}
      onClick={onClose} // 모달 외부 클릭 시 닫기
    >
      <div
        className="modal-dialog modal-dialog-centered"
        onClick={(e) => e.stopPropagation()} // 내부 클릭 시 이벤트 버블링 차단
      >
        <div className="modal-content">
          <div className="modal-header border-0 pb-0">
            <h5 className="modal-title">
              <i className="bi bi-flag-fill text-danger me-2"></i>
              리뷰 신고하기
            </h5>
            <button
              type="button"
              className="btn-close"
              onClick={onClose}
              disabled={loading}
            ></button>
          </div>

          <div className="modal-body">
            <div className="mb-3">
              <label htmlFor="reportReason" className="form-label fw-bold">
                신고 사유
              </label>
              <textarea
                id="reportReason"
                className="form-control"
                rows={4}
                maxLength={100}
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="신고 사유를 자세히 작성해주세요. (최대 100자)"
              />
              <small className="text-muted">{reason.length} / 100자</small>
            </div>
          </div>

          <div className="modal-footer border-0 pt-0">
            <button
              type="button"
              className="btn btn-secondary"
              onClick={onClose}
              disabled={loading}
            >
              취소
            </button>
            <button
              type="button"
              className="btn btn-danger"
              onClick={submitReport}
              disabled={loading}
            >
              {loading ? (
                <>
                  <span
                    className="spinner-border spinner-border-sm me-2"
                    role="status"
                  ></span>
                  신고 중...
                </>
              ) : (
                "신고하기"
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
