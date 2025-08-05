import { useNavigate, useParams } from "react-router";
import { useContext, useEffect, useState } from "react";
import axios from "axios";
import { toast } from "react-toastify";
import {
  Button,
  Card,
  Col,
  Image,
  ListGroup,
  ListGroupItem,
  Modal,
  OverlayTrigger,
  Row,
  Spinner,
  Tooltip,
} from "react-bootstrap";
import { AuthenticationContext } from "../../common/AuthenticationContextProvider.jsx";
import { CommentContainer } from "../comment/CommentContainer.jsx";
import { LikeContainer } from "../like/LikeContainer.jsx";
import { FaDownload, FaEdit, FaTrashAlt } from "react-icons/fa";

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

  // 프로필 사진 없는 사람들
  const defaultProfileImage = "/user.png";

  return (
    <Row className="justify-content-center my-4">
      <Col xs={12} md={10} lg={8}>
        <div className="d-flex justify-content-between align-items-center mb-3">
          <h3 className="fw-bold mb-0 text-dark">{board.title}</h3>
          <small className="text-muted" style={{ fontSize: "0.85rem" }}>
            #{board.id}
          </small>
        </div>

        <Card className="mb-4 shadow-sm border-0 rounded-3">
          <Card.Body>
            <br />
            <Card.Text
              className="mb-4 text-secondary"
              style={{
                whiteSpace: "pre-wrap",
                fontSize: "1.05rem",
                lineHeight: 1.6,
              }}
            >
              {board.content}
            </Card.Text>

            {/* 이미지 미리보기 */}
            {Array.isArray(board.files) &&
              board.files.some((file) =>
                /\.(jpg|jpeg|png|gif|webp)$/i.test(file),
              ) && (
                <div className="mb-4 d-flex flex-column gap-3">
                  {board.files
                    .filter((file) => /\.(jpg|jpeg|png|gif|webp)$/i.test(file))
                    .map((file, idx) => (
                      <img
                        key={idx}
                        src={file}
                        alt={`첨부 이미지 ${idx + 1}`}
                        className="shadow rounded"
                        style={{
                          width: "500px",
                          height: "500px",
                          objectFit: "cover",
                        }}
                      />
                    ))}
                </div>
              )}
            <br />
            {/* 첨부 파일 목록 */}
            {Array.isArray(board.files) && board.files.length > 0 && (
              <div className="mb-4">
                <ListGroup variant="flush">
                  {board.files.map((file, idx) => {
                    const fileName = file.split("/").pop();
                    return (
                      <ListGroupItem
                        key={idx}
                        className="d-flex justify-content-between align-items-center px-2 py-1 border-0"
                        style={{
                          fontSize: "0.85rem",
                          color: "#6c757d",
                          backgroundColor: "transparent",
                        }}
                      >
                        <span
                          className="text-truncate"
                          style={{
                            maxWidth: "85%",
                            whiteSpace: "nowrap",
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                          }}
                          title={fileName}
                        >
                          {fileName}
                        </span>
                        <Button
                          variant="outline-primary"
                          size="sm"
                          href={file}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="d-flex align-items-center justify-content-center p-1"
                          style={{ fontSize: "0.8rem" }}
                        >
                          <FaDownload />
                        </Button>
                      </ListGroupItem>
                    );
                  })}
                </ListGroup>
              </div>
            )}

            {/* 작성자 / 작성일시 */}
            <Row className="text-muted mb-3" style={{ fontSize: "0.9rem" }}>
              <Col xs={6}>
                <div>
                  <Image
                    roundedCircle
                    className="me-2"
                    src={board.profileImageUrl || defaultProfileImage}
                    alt={`${board.authorNickName ?? "익명"} 프로필`}
                    style={{
                      width: "20px",
                      height: "20px",
                    }}
                  />
                  <strong>작성자</strong>
                  <div>{board.authorNickName}</div>
                </div>
              </Col>
              <Col xs={6} className="text-end">
                <div>
                  <strong>작성일시</strong>
                  <div>{formattedInsertedAt}</div>
                </div>
              </Col>
            </Row>

            {/* 버튼 및 좋아요 */}
            <div className="d-flex justify-content-between align-items-center">
              <div className="d-flex">
                {hasAccess(board.authorEmail) && (
                  <>
                    <div style={{ position: "relative" }}>
                      <OverlayTrigger
                        placement="top"
                        overlay={<Tooltip id="tooltip-delete">삭제</Tooltip>}
                        delay={{ show: 250, hide: 400 }}
                        containerPadding={10}
                        popperConfig={{
                          modifiers: [
                            { name: "preventOverflow", enabled: false },
                            { name: "flip", enabled: false },
                          ],
                        }}
                      >
                        <Button
                          onClick={() => setModalShow(true)}
                          className="me-2 d-flex align-items-center gap-1"
                          variant="outline-danger"
                          title="게시물 삭제"
                        >
                          <FaTrashAlt />
                        </Button>
                      </OverlayTrigger>
                    </div>
                    <div style={{ position: "relative" }}>
                      <OverlayTrigger
                        placement="top"
                        overlay={<Tooltip id="tooltip-edit">수정</Tooltip>}
                        delay={{ show: 250, hide: 400 }}
                        containerPadding={10}
                        popperConfig={{
                          modifiers: [
                            { name: "preventOverflow", enabled: false },
                            { name: "flip", enabled: false },
                          ],
                        }}
                      >
                        <Button
                          variant="outline-info"
                          className="d-flex align-items-center gap-1"
                          onClick={() => navigate(`/board/edit?id=${board.id}`)}
                          title="게시물 수정"
                        >
                          <FaEdit />
                        </Button>
                      </OverlayTrigger>
                    </div>
                  </>
                )}
              </div>
            </div>
          </Card.Body>
        </Card>

        <CommentContainer boardId={board.id} />
      </Col>

      {/* 모달 */}
      <Modal show={modalShow} onHide={() => setModalShow(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title>게시물 삭제 확인</Modal.Title>
        </Modal.Header>
        <Modal.Body>{board.id}번 게시물을 삭제하시겠습니까?</Modal.Body>
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
    </Row>
  );
}
