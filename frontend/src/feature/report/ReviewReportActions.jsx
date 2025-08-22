import React, { useState } from "react";
import {
  Dropdown,
  Modal,
  Button,
  Tooltip,
  OverlayTrigger,
} from "react-bootstrap";
import { FaTrash } from "react-icons/fa";

export default function ReviewReportActions({
  reportId,
  reviewId,
  handleDeleteReportOnly,
  handleDeleteReview,
}) {
  const [actionType, setActionType] = useState(null);
  const [showModal, setShowModal] = useState(false);

  // 이벤트 버블링을 중지하는 헬퍼 함수
  const stopBubbling = (e) => {
    e.stopPropagation();
  };

  const handleAction = (e, type) => {
    stopBubbling(e);
    setActionType(type);
    setShowModal(true);
  };

  const handleCloseModal = (e) => {
    if (e) stopBubbling(e);
    setShowModal(false);
  };

  const confirmAction = (e) => {
    stopBubbling(e);
    if (actionType === "report") {
      handleDeleteReportOnly(reportId);
    } else if (actionType === "review") {
      handleDeleteReview(reviewId);
    }
    setShowModal(false);
  };

  return (
    <div className="review-actions-container d-flex gap-2">
      <OverlayTrigger
        placement="top"
        overlay={
          <Tooltip id={`tooltip-report-${reportId}`}>신고 내역만 삭제</Tooltip>
        }
      >
        <Button
          variant="outline-warning"
          size="sm"
          onClick={(e) => handleAction(e, "report")}
        >
          ⚠️
        </Button>
      </OverlayTrigger>

      <OverlayTrigger
        placement="top"
        overlay={
          <Tooltip id={`tooltip-review-${reviewId}`}>
            리뷰와 신고 모두 삭제
          </Tooltip>
        }
      >
        <Button
          variant="outline-danger"
          size="sm"
          onClick={(e) => handleAction(e, "review")}
        >
          🚨
        </Button>
      </OverlayTrigger>

      {/* 모달 (재사용) */}
      <Modal
        show={showModal}
        centered
        onHide={handleCloseModal}
        onClick={stopBubbling}
      >
        <Modal.Header closeButton onClick={handleCloseModal}>
          <Modal.Title className="fw-bold">
            {actionType === "report"
              ? "⚠️ 신고 내역 삭제 ⚠️"
              : "🚨 리뷰 삭제 🚨"}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {actionType === "report"
            ? "정말 이 신고 내역을 삭제하시겠습니까?"
            : "리뷰와 관련된 모든 신고가 함께 삭제됩니다. 진행하시겠습니까?"}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={handleCloseModal}>
            취소
          </Button>
          {actionType === "report" ? (
            <Button variant="warning" onClick={confirmAction}>
              확인
            </Button>
          ) : (
            <Button variant="danger" onClick={confirmAction}>
              확인
            </Button>
          )}
        </Modal.Footer>
      </Modal>
    </div>
  );
}
