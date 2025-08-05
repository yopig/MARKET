import { useContext, useState } from "react";
import { useNavigate, Navigate } from "react-router";
import axios from "axios";
import { toast } from "react-toastify";
import {
  Button,
  Card,
  Col,
  Form,
  FormControl,
  FormGroup,
  ListGroup,
  Modal,
  Row,
  Spinner,
} from "react-bootstrap";
import { FaFileAlt, FaSave, FaTimes, FaTrashAlt } from "react-icons/fa";
import { AuthenticationContext } from "../../common/AuthenticationContextProvider.jsx";

export function BoardAdd() {
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [files, setFiles] = useState([]);
  const [isPrivate, setIsPrivate] = useState(false); // private 체크박스 상태
  const [modalShow, setModalShow] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  const { user, isAdmin } = useContext(AuthenticationContext);
  const navigate = useNavigate();

  // 로그인 여부 체크
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // 관리자 권한 체크
  const adminCheck = typeof isAdmin === "function" ? isAdmin() : isAdmin;
  if (!adminCheck) {
    return <Navigate to="/unauthorized" replace />; // 권한없음 페이지 없으면 "/login" 등으로 변경
  }

  const isValid =
    title.trim() !== "" && (content.trim() !== "" || files.length > 0);

  // 파일 첨부 시 처리 함수
  const handleFileChange = (e) => {
    const selectedFiles = Array.from(e.target.files);
    setFiles((prevFiles) => {
      const newFiles = selectedFiles.map((file) => ({
        file,
        previewUrl: file.type.startsWith("image/")
          ? URL.createObjectURL(file)
          : null,
      }));
      return [...prevFiles, ...newFiles];
    });
  };

  // 파일 삭제 시 처리 함수
  const handleFileRemove = (idx) => {
    setFiles(files.filter((_, i) => i !== idx));
  };

  // 저장 버튼 클릭 시 처리
  const handleSaveButtonClick = () => {
    if (!isValid) {
      toast.warning(
        "제목은 필수이며, 본문 또는 첨부파일이 하나 이상 있어야 합니다.",
      );
      return;
    }
    setModalShow(false);
    setIsProcessing(true);

    const formData = new FormData();
    formData.append("title", title);
    formData.append("content", content);
    formData.append("isPrivate", isPrivate);
    files.forEach((fileObj) => formData.append("files", fileObj.file));

    axios
      .post("/api/board/add", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      })
      .then((res) => {
        const message = res.data?.message;
        toast(message?.text || "게시글이 등록되었습니다.", {
          type: message?.type || "success",
        });
        navigate("/board/list");
      })
      .catch((err) => {
        const message = err.response?.data?.message;
        toast(message?.text || "오류가 발생했습니다.", {
          type: message?.type || "error",
        });
      })
      .finally(() => {
        setIsProcessing(false);
      });
  };

  return (
    <Row className="justify-content-center my-4">
      <Col xs={12} md={8} lg={6}>
        <div className="d-flex justify-content-between align-items-center mb-3">
          <FormControl
            className="fw-bold text-dark"
            placeholder="제목을 입력하세요"
            style={{
              fontSize: "1.5rem",
              border: "none",
              padding: 0,
              outline: "none",
              boxShadow: "none",
            }}
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            disabled={isProcessing}
          />
        </div>

        <Card className="shadow-sm rounded-3 border-0">
          <Card.Body>
            <FormGroup className="mb-4">
              <FormControl
                as="textarea"
                rows={6}
                placeholder="내용을 입력하세요"
                value={content}
                onChange={(e) => setContent(e.target.value)}
                style={{
                  whiteSpace: "pre-wrap",
                  fontSize: "1rem",
                  lineHeight: 1.5,
                }}
                disabled={isProcessing}
              />
            </FormGroup>

            {/* 파일 첨부 목록 */}
            {files.length > 0 && (
              <div className="mb-4">
                <ListGroup>
                  {files.map((fileObj, idx) => (
                    <ListGroup.Item
                      key={idx}
                      className="d-flex justify-content-between align-items-center"
                    >
                      {fileObj.previewUrl && (
                        <img
                          src={fileObj.previewUrl}
                          alt={fileObj.file.name}
                          style={{
                            width: "50px",
                            height: "50px",
                            objectFit: "cover",
                            marginRight: "10px",
                          }}
                        />
                      )}

                      <div className="d-flex justify-content-between align-items-center w-100">
                        <span className="text-truncate d-flex align-items-center gap-2">
                          <FaFileAlt /> {fileObj.file.name}
                        </span>
                        <Button
                          variant="outline-danger"
                          size="sm"
                          className="p-1 d-flex"
                          onClick={() => handleFileRemove(idx)}
                          disabled={isProcessing}
                        >
                          <FaTrashAlt />
                        </Button>
                      </div>
                    </ListGroup.Item>
                  ))}
                </ListGroup>
              </div>
            )}

            <FormGroup className="mb-4">
              <FormControl
                type="file"
                multiple
                onChange={handleFileChange}
                disabled={isProcessing}
              />
            </FormGroup>
            <Row className="text-muted mb-3" style={{ fontSize: "0.9rem" }}>
              <Col xs={6}>
                <div>
                  <strong>작성자</strong>
                  <div> {user.nickName}</div>
                </div>
              </Col>
            </Row>

            {/* 저장/취소 버튼 */}
            <div className="d-flex justify-content-end gap-2">
              <Button
                className="d-flex align-items-center gap-1"
                variant="outline-secondary"
                disabled={isProcessing}
                onClick={() => navigate(-1)}
                title="취소"
              >
                <FaTimes />
              </Button>

              <Button
                className="d-flex align-items-center gap-1"
                variant="primary"
                disabled={!isValid || isProcessing}
                onClick={() => setModalShow(true)}
                title="저장"
              >
                {isProcessing && (
                  <Spinner animation="border" size="sm" className="me-2" />
                )}
                <FaSave />
              </Button>
            </div>
          </Card.Body>
        </Card>

        <Modal
          show={modalShow}
          onHide={() => setModalShow(false)}
          centered
          backdrop="static"
          keyboard={false}
        >
          <Modal.Header closeButton>
            <Modal.Title>게시물 저장 확인</Modal.Title>
          </Modal.Header>
          <Modal.Body>게시물을 등록하시겠습니까?</Modal.Body>
          <Modal.Footer>
            <Button
              variant="outline-dark"
              onClick={() => setModalShow(false)}
              disabled={isProcessing}
            >
              취소
            </Button>
            <Button
              variant="primary"
              onClick={handleSaveButtonClick}
              disabled={isProcessing}
            >
              {isProcessing && (
                <Spinner animation="border" size="sm" className="me-2" />
              )}
              등록
            </Button>
          </Modal.Footer>
        </Modal>
      </Col>
    </Row>
  );
}
