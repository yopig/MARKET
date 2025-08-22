import { useNavigate, useParams } from "react-router";
import { useContext, useEffect, useState } from "react";
import axios from "axios";
import { toast } from "react-toastify";
import { Button, Image, Modal, Spinner } from "react-bootstrap";
import { AuthenticationContext } from "../../common/AuthenticationContextProvider.jsx";
import { CommentContainer } from "../comment/CommentContainer.jsx";
import { FaClock, FaDownload, FaEdit, FaTrashAlt } from "react-icons/fa";
import "../../styles/BoardDetail.css";

export function BoardDetail() {
  const [board, setBoard] = useState(null);
  const [modalShow, setModalShow] = useState(false);
  const { hasAccess } = useContext(AuthenticationContext);
  const { id } = useParams();
  const navigate = useNavigate();

  useEffect(() => {
    axios
      .get(`/api/board/${id}`)
      .then((res) => {
        setBoard(res.data);
      })
      .catch((err) => {
        if (err.response?.status === 404) {
          toast.warning("해당 게시물이 없습니다.");
          navigate("/");
        } else {
          toast.error("게시글을 불러오는 중 오류가 발생했습니다.");
        }
      });
  }, [id, navigate]);

  function handleDeleteButtonClick() {
    axios
      .delete(`/api/board/${id}`)
      .then((res) => {
        const message = res.data.message;
        if (message) {
          toast(message.text, { type: message.type });
        }
        navigate("/board/list");
      })
      .catch(() => {
        toast.warning("게시물이 삭제되지 않았습니다.");
      });
  }

  if (!board) {
    return (
      <div className="d-flex justify-content-center my-5">
        <Spinner animation="border" role="status" />
      </div>
    );
  }

  const formattedInsertedAt = board.insertedAt
    ? board.insertedAt.substring(0, 16)
    : "";

  const defaultProfileImage = "/user.png";

  return (
    // 1. 전체를 감싸는 wrapper로 변경 (카드 스타일 제거)
    <div className="board-view-wrapper">
      {/* 2. 제목, 작성자, 날짜 정보를 담는 헤더 섹션 */}
      <div className="board-view-header">
        <h1>{board.title}</h1>
        <div className="header-meta">
          <div className="meta-item">
            <Image
              roundedCircle
              src={board.profileImageUrl || defaultProfileImage}
              alt={`${board.authorNickName ?? "익명"} 프로필`}
              className="meta-icon"
            />
            {board.authorNickName}
          </div>
          <div className="meta-item">
            <FaClock className="meta-icon" />
            {formattedInsertedAt}
          </div>
          <div className="meta-item">
            <span>#{board.id}</span>
          </div>
        </div>
      </div>

      {/* 3. 본문 내용 */}
      <div className="board-view-body">
        <p className="board-content">{board.content}</p>
      </div>

      {/* 4. 첨부파일 섹션 */}
      {Array.isArray(board.files) && board.files.length > 0 && (
        <div className="board-view-attachments">
          <h3 className="attachments-title">첨부파일</h3>
          <div className="image-preview-list">
            {board.files
              .filter((file) => /\.(jpg|jpeg|png|gif|webp)$/i.test(file))
              .map((file, idx) => (
                <img key={idx} src={file} alt={`첨부 이미지 ${idx + 1}`} />
              ))}
          </div>
          <div className="file-list">
            {board.files.map((file, idx) => {
              const fileName = decodeURIComponent(file.split("/").pop()); // 디코딩해서 혹시 한글이면 안 깨지도록
              return (
                <div key={idx} className="file-item">
                  {/*<span title={fileName}>{fileName}</span>그냥 뺌*/}
                  <Button
                    href={file}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn-neo btn-download"
                    title={fileName}
                  >
                    <FaDownload />
                  </Button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 5. 수정/삭제 버튼 등을 담는 푸터 섹션 */}
      <div className="board-view-footer">
        {hasAccess(board.authorEmail) && (
          <div className="d-flex gap-2">
            <Button
              onClick={() => navigate(`/board/edit?id=${board.id}`)}
              className="btn-neo btn-info-neo"
              title="수정"
            >
              <FaEdit />
              <span>수정</span>
            </Button>
            <Button
              onClick={() => setModalShow(true)}
              className="btn-neo btn-danger-neo"
              title="삭제"
            >
              <FaTrashAlt />
              <span>삭제</span>
            </Button>
          </div>
        )}
      </div>

      {/* 댓글 컨테이너 */}
      <div className="comment-section-wrapper">
        <CommentContainer boardId={board.id} />
      </div>

      {/* 모달 (기존과 동일, className='modal-neo' 유지) */}
      <Modal
        show={modalShow}
        onHide={() => setModalShow(false)}
        centered
        className="modal-neo"
      >
        <Modal.Header closeButton>
          <Modal.Title>게시물 삭제 확인</Modal.Title>
        </Modal.Header>
        <Modal.Body>#{board.id} 게시물을 삭제하시겠습니까?</Modal.Body>
        <Modal.Footer>
          <Button
            variant="outline-secondary"
            onClick={() => setModalShow(false)}
          >
            취소
          </Button>
          <Button variant="danger" onClick={handleDeleteButtonClick}>
            삭제
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
}
