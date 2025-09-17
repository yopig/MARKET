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
import { useContext, useEffect, useMemo, useState } from "react";
import axios from "axios";
import { useNavigate, useSearchParams } from "react-router";
import { toast } from "react-toastify";
import {
  FaDownload,
  FaFileAlt,
  FaSave,
  FaTimes,
  FaTrashAlt,
} from "react-icons/fa";
import { AuthenticationContext } from "../../common/AuthenticationContextProvider.jsx";
import "../../styles/BoardAdd.css"; // ✅ 제목 테두리 제거용 클래스 재활용

// ✅ 지역 데이터
import { SIDO_OPTIONS, getSigunguOptions } from "../board/regions";

/** ====== 카테고리(상위만) : BoardAdd와 동일 ====== */
const CATEGORY_LIST = [
  "전체","디지털/가전","가구/인테리어","유아동","생활/가공식품","스포츠/레저","여성의류","남성의류","게임/취미","반려동물용품","기타",
];

export function BoardEdit() {
  const [board, setBoard] = useState({
    title: "",
    content: "",
    files: [],
    authorNickName: "",
    id: null,
    insertedAt: null,
  });

  // ✅ BoardAdd와 동일한 신규 필드들
  const [tradeStatus, setTradeStatus] = useState("ON_SALE"); // "ON_SALE" | "SOLD_OUT"
  const [price, setPrice] = useState(""); // 숫자만
  const [regionSido, setRegionSido] = useState("");
  const [regionSigungu, setRegionSigungu] = useState("");
  const [category, setCategory] = useState("전체");

  // ✅ 시/군/구 옵션 (기타 입력 제거)
  const sigunguOptions = useMemo(() => {
    return regionSido ? getSigunguOptions(regionSido) : [];
  }, [regionSido]);

  const [searchParams] = useSearchParams();
  const [modalShow, setModalShow] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [newFiles, setNewFiles] = useState([]);
  const [deleteFileNames, setDeleteFileNames] = useState([]);

  const { user } = useContext(AuthenticationContext);
  const navigate = useNavigate();

  const formattedInsertedAt = board.insertedAt
    ? board.insertedAt.substring(0, 16)
    : "";

  useEffect(() => {
    const id = searchParams.get("id");
    if (!id) {
      toast("잘못된 접근입니다.", { type: "warning" });
      navigate("/board/list");
      return;
    }

    axios
      .get(`/api/board/${id}`)
      .then((res) => {
        const data = res.data;
        setBoard(data);

        // ✅ 서버 값으로 폼 초기화
        setTradeStatus(data.tradeStatus === "SOLD_OUT" ? "SOLD_OUT" : "ON_SALE");
        setPrice(
          data.price === null || data.price === undefined
            ? ""
            : String(data.price).replace(/[^\d]/g, "")
        );
        setRegionSido(data.regionSido || "");
        setRegionSigungu(data.regionSigungu || "");
        setCategory(data.category || "전체");
      })
      .catch(() => {
        toast("해당 게시물이 존재하지 않습니다.", { type: "warning" });
        navigate("/board/list");
      });
  }, [searchParams, navigate]);

  function handleDeleteFile(idx) {
    setBoard((prev) => {
      const fileName = prev.files[idx].split("/").pop();
      setDeleteFileNames((prevDelete) => [...prevDelete, fileName]);
      return { ...prev, files: prev.files.filter((_, i) => i !== idx) };
    });
  }

  const handlePriceChange = (e) => {
    const onlyDigits = e.target.value.replace(/[^\d]/g, "");
    setPrice(onlyDigits);
  };

  const onChangeSido = (e) => {
    const next = e.target.value;
    setRegionSido(next);
    setRegionSigungu("");
  };

  const onChangeSigungu = (e) => {
    setRegionSigungu(e.target.value);
  };

  function handleSaveButtonClick() {
    if (!board.id) return;

    // 간단 검증
    if (!board.title?.trim()) {
      toast("제목을 입력하세요.", { type: "warning" });
      return;
    }
    if (
      !(board.content?.trim() || newFiles.length > 0 || (board.files && board.files.length > 0))
    ) {
      toast("내용 또는 첨부파일을 입력하세요.", { type: "warning" });
      return;
    }
    if (price !== "" && isNaN(Number(price))) {
      toast("가격은 숫자만 입력하세요.", { type: "warning" });
      return;
    }

    const id = searchParams.get("id");
    setIsProcessing(true);

    const formData = new FormData();
    formData.append("title", board.title ?? "");
    formData.append("content", board.content ?? "");

    // ✅ BoardAdd와 동일하게 전송
    formData.append("tradeStatus", tradeStatus); // "ON_SALE" | "SOLD_OUT"
    formData.append("category", category);
    if (price !== "") formData.append("price", Number(price));
    if (regionSido.trim() !== "") formData.append("regionSido", regionSido.trim());
    if (regionSigungu.trim() !== "") formData.append("regionSigungu", regionSigungu.trim());

    deleteFileNames.forEach((name) => formData.append("deleteFileNames", name));
    newFiles.forEach((file) => formData.append("files", file));
    formData.append("id", board.id); // 컨트롤러 @ModelAttribute용

    axios
      .put(`/api/board/${id}`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      })
      .then((res) => {
        const message = res.data?.message || {
          text: "게시물이 성공적으로 수정되었습니다.",
          type: "success",
        };
        toast(message.text, { type: message.type });
        navigate(`/board/${board.id}`);
      })
      .catch((err) => {
        const message = err.response?.data?.message || {
          text: "게시물 수정 중 오류가 발생했습니다.",
          type: "warning",
        };
        toast(message.text, { type: message.type });
      })
      .finally(() => {
        setModalShow(false);
        setIsProcessing(false);
      });
  }

  const isValid =
    board.title?.trim() !== "" &&
    (board.content?.trim() !== "" ||
      newFiles.length > 0 ||
      (board.files && board.files.length > 0));

  return (
    <Row className="justify-content-center my-4">
      <Col xs={12} md={8} lg={6}>
        {!board.id ? (
          <div className="text-center my-5">
            <Spinner animation="border" />
          </div>
        ) : (
          <>
            <Card className="shadow-sm rounded-3 border-0">
              <Card.Body>
                {/* 1행: 카테고리 · 시/도 · 시/군/구 (BoardAdd와 동일) */}
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
                      <Form.Select
                        value={regionSido}
                        onChange={onChangeSido}
                        disabled={isProcessing}
                      >
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

                {/* 2행: 판매상태 · 가격 (BoardAdd와 동일) */}
                <Row className="g-3 mb-4">
                  <Col xs={12} md={4}>
                    <FormGroup>
                      <Form.Label className="fw-semibold">판매 상태</Form.Label>
                      <Form.Select
                        value={tradeStatus}
                        onChange={(e) => setTradeStatus(e.target.value)}
                        disabled={isProcessing}
                      >
                        <option value="ON_SALE">판매중</option>
                        <option value="SOLD_OUT">판매완료</option>
                      </Form.Select>
                    </FormGroup>
                  </Col>

                  <Col xs={12} md={4}>
                    <FormGroup>
                      <Form.Label className="fw-semibold">가격(원)</Form.Label>
                      <Form.Control
                        type="text"
                        value={price ? Number(price).toLocaleString() : ""}
                        readOnly
                        disabled
                        placeholder="수정 불가 (등록 시에만 입력)"
                      />
                    </FormGroup>
                  </Col>
                </Row>

                {/* 제목 입력: BoardAdd와 동일하게 테두리 제거 클래스 적용 */}
                <div className="d-flex justify-content-between align-items-center mb-3">
                  <FormControl
                    className="page-title-input fw-bold text-dark"
                    placeholder="제목을 입력하세요"
                    value={board.title ?? ""}
                    onChange={(e) => setBoard({ ...board, title: e.target.value })}
                    disabled={isProcessing}
                  />
                  <small className="text-muted" style={{ fontSize: "0.85rem" }}>
                    #{board.id}
                  </small>
                </div>

                {/* 내용 */}
                <FormGroup className="mb-4">
                  <FormControl
                    as="textarea"
                    rows={6}
                    value={board.content ?? ""}
                    onChange={(e) => setBoard({ ...board, content: e.target.value })}
                    placeholder="내용을 입력하세요"
                    style={{ whiteSpace: "pre-wrap", fontSize: "1rem", lineHeight: 1.5 }}
                    disabled={isProcessing}
                  />
                </FormGroup>

                {/* 기존 파일 목록 */}
                {Array.isArray(board.files) && board.files.length > 0 && (
                  <div className="mb-4">
                    <ListGroup>
                      {board.files.map((file, idx) => {
                        const fileName = file.split("/").pop();
                        return (
                          <ListGroup.Item
                            key={idx}
                            className="d-flex justify-content-between align-items-center"
                          >
                            {fileName.match(/\.(jpg|jpeg|png|gif|webp)$/i) && (
                              <img
                                src={file}
                                alt={fileName}
                                style={{
                                  width: 50,
                                  height: 50,
                                  objectFit: "cover",
                                  marginRight: 10,
                                }}
                              />
                            )}
                            <div className="d-flex justify-content-between align-items-center w-100">
                              <span className="text-truncate d-flex align-items-center gap-2">
                                <FaFileAlt /> {fileName}
                              </span>
                              <div className="d-flex gap-2">
                                <Button
                                  variant="outline-primary"
                                  size="sm"
                                  href={file}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="p-1 d-flex align-items-center justify-content-center"
                                >
                                  <FaDownload />
                                </Button>
                                <Button
                                  variant="outline-danger"
                                  size="sm"
                                  className="p-1 d-flex align-items-center justify-content-center"
                                  onClick={() => handleDeleteFile(idx)}
                                  disabled={isProcessing}
                                >
                                  <FaTrashAlt />
                                </Button>
                              </div>
                            </div>
                          </ListGroup.Item>
                        );
                      })}
                    </ListGroup>
                  </div>
                )}

                {/* 새로 추가할 파일 목록(프리뷰) */}
                {newFiles.length > 0 && (
                  <div className="mb-4">
                    <ListGroup>
                      {newFiles.map((file, idx) => (
                        <ListGroup.Item
                          key={idx}
                          className="d-flex justify-content-between align-items-center"
                        >
                          {file.name.match(/\.(jpg|jpeg|png|gif|webp)$/i) && (
                            <img
                              src={URL.createObjectURL(file)}
                              alt={file.name}
                              style={{
                                width: 50,
                                height: 50,
                                objectFit: "cover",
                                marginRight: 10,
                              }}
                            />
                          )}
                          <div className="d-flex justify-content-between align-items-center w-100">
                            <span className="text-truncate d-flex align-items-center gap-2">
                              <FaFileAlt /> {file.name}
                            </span>
                            <Button
                              variant="outline-danger"
                              size="sm"
                              onClick={() =>
                                setNewFiles((prev) => prev.filter((_, i) => i !== idx))
                              }
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

                {/* 파일 선택 */}
                <FormGroup className="mb-4">
                  <FormControl
                    type="file"
                    multiple
                    onChange={(e) =>
                      setNewFiles((prev) => [...prev, ...Array.from(e.target.files || [])])
                    }
                    disabled={isProcessing}
                  />
                </FormGroup>

                {/* 작성자 / 작성일시 */}
                <Row className="text-muted mb-3" style={{ fontSize: "0.9rem" }}>
                  <Col xs={6}>
                    <div>
                      <strong>작성자</strong>
                      <div>{user.nickName}</div>
                    </div>
                  </Col>
                  <Col xs={6} className="text-end">
                    <div>
                      <strong>작성일시</strong>
                      <div>{formattedInsertedAt}</div>
                    </div>
                  </Col>
                </Row>

                {/* 버튼 */}
                <div className="d-flex justify-content-end gap-2">
                  <Button
                    className="d-flex align-items-center gap-1"
                    variant="outline-secondary"
                    onClick={() => navigate(-1)}
                    disabled={isProcessing}
                    title="취소"
                  >
                    <FaTimes />
                  </Button>

                  <Button
                    disabled={!isValid || isProcessing}
                    onClick={() => setModalShow(true)}
                    variant="primary"
                    className="d-flex align-items-center gap-1"
                    title="저장"
                  >
                    {isProcessing && <Spinner size="sm" className="me-2" />}
                    <FaSave />
                  </Button>
                </div>
              </Card.Body>
            </Card>

            <Modal show={modalShow} onHide={() => setModalShow(false)} centered>
              <Modal.Header closeButton>
                <Modal.Title>게시물 저장 확인</Modal.Title>
              </Modal.Header>
              <Modal.Body>{board.id}번 게시물을 수정하시겠습니까?</Modal.Body>
              <Modal.Footer>
                <Button
                  variant="outline-dark"
                  onClick={() => setModalShow(false)}
                  disabled={isProcessing}
                >
                  취소
                </Button>
                <Button
                  disabled={isProcessing}
                  variant="primary"
                  onClick={handleSaveButtonClick}
                >
                  {isProcessing && <Spinner size="sm" className="me-2" />}
                  {isProcessing ? "저장 중..." : "저장"}
                </Button>
              </Modal.Footer>
            </Modal>
          </>
        )}
      </Col>
    </Row>
  );
}
