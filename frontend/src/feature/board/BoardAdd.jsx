import { useContext, useMemo, useState } from "react";
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
import "../../styles/BoardAdd.css";

// ✅ 지역 데이터: 분리된 모듈에서 import (경로 주의)
import { SIDO_OPTIONS, getSigunguOptions } from "../board/regions";

/** ====== 카테고리(상위만) ====== */
const CATEGORY_LIST = [
  "전체","디지털/가전","가구/인테리어","유아동","생활/가공식품","스포츠/레저","여성의류","남성의류","게임/취미","반려동물용품","기타",
];

export function BoardAdd() {
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [files, setFiles] = useState([]);
  const [isPrivate, setIsPrivate] = useState(false);

  // 판매 상태: 고정값(판매중)
  const [tradeStatus] = useState("ON_SALE"); // 고정

  // 가격/지역
  const [price, setPrice] = useState("");
  const [regionSido, setRegionSido] = useState("");
  const [regionSigungu, setRegionSigungu] = useState("");

  // 카테고리 (서브카테고리 제거)
  const [category, setCategory] = useState("전체");

  // ⬇️ 시/군/구 옵션
  const sigunguOptions = useMemo(() => {
    return regionSido ? getSigunguOptions(regionSido) : [];
  }, [regionSido]);

  const [modalShow, setModalShow] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  const { user } = useContext(AuthenticationContext);
  const navigate = useNavigate();

  if (!user) {
    return <Navigate to="/login?redirect=/board/add" replace />;
  }

  const isValid = title.trim() !== "" && (content.trim() !== "" || files.length > 0);

  // 파일 첨부/삭제
  const handleFileChange = (e) => {
    const selectedFiles = Array.from(e.target.files || []);
    setFiles((prevFiles) => {
      const newFiles = selectedFiles.map((file) => ({
        file,
        previewUrl: file.type.startsWith("image/") ? URL.createObjectURL(file) : null,
      }));
      return [...prevFiles, ...newFiles];
    });
  };
  const handleFileRemove = (idx) => setFiles((prev) => prev.filter((_, i) => i !== idx));

  // 가격 입력(숫자만)
  const handlePriceChange = (e) => setPrice(e.target.value.replace(/[^\d]/g, ""));

  // 시/도 변경 → 시/군/구 초기화
  const onChangeSido = (e) => {
    const next = e.target.value;
    setRegionSido(next);
    setRegionSigungu("");
  };

  // 시/군/구 변경
  const onChangeSigungu = (e) => {
    setRegionSigungu(e.target.value);
  };

  // 저장
  const handleSaveButtonClick = () => {
    if (!isValid) {
      toast.warning("제목은 필수이며, 본문 또는 첨부파일이 하나 이상 있어야 합니다.");
      return;
    }
    if (price !== "" && isNaN(Number(price))) {
      toast.warning("가격은 숫자만 입력하세요.");
      return;
    }

    setModalShow(false);
    setIsProcessing(true);

    const formData = new FormData();
    formData.append("title", title);
    formData.append("content", content);
    formData.append("isPrivate", isPrivate);
    formData.append("tradeStatus", "ON_SALE"); // 고정
    formData.append("category", category);
    if (price !== "") formData.append("price", Number(price));
    if (regionSido.trim() !== "") formData.append("regionSido", regionSido.trim());
    if (regionSigungu.trim() !== "") formData.append("regionSigungu", regionSigungu.trim());
    files.forEach((f) => formData.append("files", f.file));

    axios
      .post("/api/board/add", formData, { headers: { "Content-Type": "multipart/form-data" } })
      .then((res) => {
        const message = res.data?.message;
        toast(message?.text || "게시글이 등록되었습니다.", { type: message?.type || "success" });
        navigate("/board/list");
      })
      .catch((err) => {
        const message = err.response?.data?.message;
        toast(message?.text || "오류가 발생했습니다.", { type: message?.type || "error" });
      })
      .finally(() => setIsProcessing(false));
  };

  return (
    <Row className="board-add justify-content-center my-4">
      <Col xs={12} md={8} lg={6}>
        <Card className="shadow-sm rounded-3 border-0">
          <Card.Body>
            {/* 1행: 카테고리 · 시/도 · 시/군/구 */}
            <Row className="g-3 mb-4">
              <Col xs={12} md={4}>
                <FormGroup>
                  <Form.Label className="fw-semibold">카테고리</Form.Label>
                  <Form.Select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    disabled={isProcessing}
                  >
                    {CATEGORY_LIST.map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </Form.Select>
                </FormGroup>
              </Col>

              <Col xs={12} md={4}>
                <FormGroup>
                  <Form.Label className="fw-semibold">지역(시/도)</Form.Label>
                  <Form.Select value={regionSido} onChange={onChangeSido} disabled={isProcessing}>
                    <option value="">선택</option>
                    {SIDO_OPTIONS.map((s) => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </Form.Select>
                </FormGroup>
              </Col>

              <Col xs={12} md={4}>
                <FormGroup>
                  <Form.Label className="fw-semibold">지역(시/군/구)</Form.Label>
                  <Form.Select
                    value={regionSigungu}
                    onChange={onChangeSigungu}
                    disabled={isProcessing || !regionSido}
                  >
                    <option value="">{regionSido ? "선택" : "시/도를 먼저 선택"}</option>
                    {regionSido &&
                      sigunguOptions.map((g) => (
                        <option key={g} value={g}>{g}</option>
                      ))}
                  </Form.Select>
                </FormGroup>
              </Col>
            </Row>

            {/* 2행: 판매상태(고정) · 가격 */}
            <Row className="g-3 mb-4">
              <Col xs={12} md={4}>
                <FormGroup>
                  <Form.Label className="fw-semibold">판매 상태</Form.Label>
                  <Form.Select value="ON_SALE" disabled>
                    <option value="ON_SALE">판매중</option>
                  </Form.Select>
                  <Form.Text className="text-muted">판매상태는 ‘판매중’으로 고정됩니다.</Form.Text>
                </FormGroup>
              </Col>

              <Col xs={12} md={4}>
                <FormGroup>
                  <Form.Label className="fw-semibold">가격(원)</Form.Label>
                  <Form.Control
                    type="text"
                    inputMode="numeric"
                    placeholder="예) 15000"
                    value={price}
                    onChange={handlePriceChange}
                    disabled={isProcessing}
                  />
                  <Form.Text className="text-muted">숫자만 입력하세요. 미입력 시 가격 없이 저장됩니다.</Form.Text>
                </FormGroup>
              </Col>
            </Row>

            <div className="d-flex justify-content-between align-items-center mb-3">
              <FormControl
                className="page-title-input fw-bold text-dark"
                placeholder="제목을 입력하세요"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                disabled={isProcessing}
              />
            </div>

            <FormGroup className="mb-4">
              <FormControl
                as="textarea"
                rows={6}
                placeholder="내용을 입력하세요"
                value={content}
                onChange={(e) => setContent(e.target.value)}
                style={{ whiteSpace: "pre-wrap", fontSize: "1rem", lineHeight: 1.5 }}
                disabled={isProcessing}
              />
            </FormGroup>

            {/* 파일 첨부 목록 */}
            {files.length > 0 && (
              <div className="mb-4">
                <ListGroup>
                  {files.map((fileObj, idx) => (
                    <ListGroup.Item key={idx} className="d-flex justify-content-between align-items-center">
                      {fileObj.previewUrl && (
                        <img
                          src={fileObj.previewUrl}
                          alt={fileObj.file.name}
                          style={{ width: 50, height: 50, objectFit: "cover", marginRight: 10 }}
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
              <FormControl type="file" multiple onChange={handleFileChange} disabled={isProcessing} />
            </FormGroup>

            <Row className="text-muted mb-3" style={{ fontSize: "0.9rem" }}>
              <Col xs={6}>
                <div>
                  <strong>작성자</strong>
                  <div>{user.nickName}</div>
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
                {isProcessing && <Spinner animation="border" size="sm" className="me-2" />}
                <FaSave />
              </Button>
            </div>
          </Card.Body>
        </Card>

        <Modal show={modalShow} onHide={() => setModalShow(false)} centered backdrop="static" keyboard={false}>
          <Modal.Header closeButton>
            <Modal.Title>게시물 저장 확인</Modal.Title>
          </Modal.Header>
          <Modal.Body>게시물을 등록하시겠습니까?</Modal.Body>
          <Modal.Footer>
            <Button variant="outline-dark" onClick={() => setModalShow(false)} disabled={isProcessing}>
              취소
            </Button>
            <Button variant="primary" onClick={handleSaveButtonClick} disabled={isProcessing}>
              {isProcessing && <Spinner animation="border" size="sm" className="me-2" />}
              등록
            </Button>
          </Modal.Footer>
        </Modal>
      </Col>
    </Row>
  );
}
