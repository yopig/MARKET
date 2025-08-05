import {
  Alert,
  Badge,
  Button,
  Col,
  Form,
  FormControl,
  Image,
  InputGroup,
  Pagination,
  Row,
  Spinner,
  Table,
} from "react-bootstrap";
import { useEffect, useState, useContext } from "react";
import axios from "axios";
import { useNavigate, useSearchParams } from "react-router";
import { FaRegComments, FaRegImages } from "react-icons/fa"; // 좋아요 아이콘 삭제
import { AuthenticationContext } from "../../common/AuthenticationContextProvider.jsx";

export function BoardList() {
  const [boardList, setBoardList] = useState(null);
  const [errorMsg, setErrorMsg] = useState("");
  const [searchParams, setSearchParams] = useSearchParams();
  const [pageInfo, setPageInfo] = useState(null);
  const keyword = searchParams.get("q") ?? "";
  const [keywords, setKeywords] = useState("");
  const navigate = useNavigate();
  const { isAdmin } = useContext(AuthenticationContext);

  useEffect(() => {
    setKeywords(searchParams.get("q") ?? "");
  }, [searchParams]);

  useEffect(() => {
    const page = searchParams.get("p") ?? "1";
    axios
      .get("/api/board/list", { params: { q: keyword, p: page } })
      .then((res) => {
        setBoardList(res.data.boardList);
        setPageInfo(res.data.pageInfo);
        setErrorMsg("");
      })
      .catch((err) => {
        setBoardList(null);
        setErrorMsg(
          err.response?.status === 401
            ? "권한이 없습니다. 로그인 후 다시 시도하세요."
            : "게시글을 불러오는 중 오류가 발생했습니다."
        );
      });
  }, [keyword, searchParams]);

  function handleSearchFormSubmit(e) {
    e.preventDefault();
    navigate("/board/list?q=" + encodeURIComponent(keywords));
  }

  function handleTableRowClick(id) {
    navigate(`/board/${id}`);
  }

  function handlePageNumberClick(pageNumber) {
    const next = new URLSearchParams(searchParams);
    next.set("p", pageNumber);
    setSearchParams(next);
  }

  function handleNoticeAdd() {
    navigate("/board/add");
  }

  const pageNumbers = [];
  if (pageInfo) {
    for (let i = pageInfo.leftPageNumber; i <= pageInfo.rightPageNumber; i++) {
      pageNumbers.push(i);
    }
  }

  const defaultProfileImage = "/user.png";

  if (errorMsg) {
    return (
      <Row>
        <Col>
          <Alert variant="danger" className="mt-4">
            {errorMsg}
          </Alert>
        </Col>
      </Row>
    );
  }

  if (!boardList) {
    return (
      <Row>
        <Col className="text-center mt-4">
          <Spinner animation="border" />
        </Col>
      </Row>
    );
  }

  return (
    <>
      <Row className="justify-content-center">
        <Col xs={12} md={10} lg={8} style={{ maxWidth: "900px", margin: "0 auto" }}>
          <Table
            striped
            hover
            responsive
            style={{ tableLayout: "fixed", width: "100%", fontSize: "0.95rem" }}
            className="align-middle"
          >
            <thead>
            <tr style={{ fontSize: "0.85rem", color: "#6c757d" }}>
              <th style={{ width: "45px" }}>#</th>
              {/* 좋아요 열 삭제 */}
              <th style={{ width: "100%" }}>제목</th>
              <th style={{ width: "35%" }}>작성자</th>
              <th style={{ width: "50%" }}>작성일시</th>
            </tr>
            </thead>
            <tbody>
            {boardList.map((board) => (
              <tr
                key={board.id}
                style={{ cursor: "pointer", fontSize: "0.95rem", verticalAlign: "middle" }}
                onClick={() => handleTableRowClick(board.id)}
              >
                <td className="text-muted">{board.id}</td>
                {/* 좋아요 컬럼 삭제 */}
                <td>
                  <div className="d-flex gap-2 align-items-center">
                      <span
                        className="fw-semibold text-dark"
                        style={{
                          whiteSpace: "nowrap",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          maxWidth: "calc(100% - 40px)",
                        }}
                      >
                        {board.title}
                      </span>

                    {board.countComment > 0 && (
                      <Badge bg="light" text="dark">
                        <div className="d-flex gap-1 align-items-center">
                          <FaRegComments />
                          <span>{board.countComment}</span>
                        </div>
                      </Badge>
                    )}

                    {board.countFile > 0 && (
                      <Badge bg="warning" text="dark">
                        <div className="d-flex gap-1 align-items-center">
                          <FaRegImages />
                          <span>{board.countFile}</span>
                        </div>
                      </Badge>
                    )}
                  </div>
                </td>
                <td className="text-muted" title={board.nickName}>
                  <Image
                    roundedCircle
                    className="me-2"
                    src={board.profileImageUrl || defaultProfileImage}
                    alt={`${board.nickName ?? "익명"} 프로필`}
                    style={{ width: "20px", height: "20px" }}
                  />
                  {board.nickName}
                </td>
                <td className="text-muted" style={{ fontSize: "0.85rem" }}>
                  {board.timesAgo}
                </td>
              </tr>
            ))}
            </tbody>
          </Table>

          {/* 공지 버튼 하단 배치 */}
          {isAdmin && typeof isAdmin === "function" ? isAdmin() && (
            <div className="d-flex justify-content-end my-3">
              <Button variant="warning" onClick={handleNoticeAdd}>
                공지 작성
              </Button>
            </div>
          ) : isAdmin && (
            <div className="d-flex justify-content-end my-3">
              <Button variant="warning" onClick={handleNoticeAdd}>
                공지 작성
              </Button>
            </div>
          )}
        </Col>
      </Row>

      {pageInfo && (
        <Row className="my-4 justify-content-center">
          <Col xs={12} md={10} lg={8} style={{ maxWidth: "900px", margin: "0 auto" }}>
            <Pagination size="sm" className="justify-content-center mb-2">
              <Pagination.First onClick={() => handlePageNumberClick(1)} />
              <Pagination.Prev onClick={() => handlePageNumberClick(pageInfo.currentPageNumber - 1)} />
              {pageNumbers.map((num) => (
                <Pagination.Item
                  key={num}
                  active={pageInfo.currentPageNumber === num}
                  onClick={() => handlePageNumberClick(num)}
                >
                  {num}
                </Pagination.Item>
              ))}
              <Pagination.Next onClick={() => handlePageNumberClick(pageInfo.currentPageNumber + 1)} />
              <Pagination.Last onClick={() => handlePageNumberClick(pageInfo.totalPages)} />
            </Pagination>

            <Form onSubmit={handleSearchFormSubmit}>
              <InputGroup size="sm">
                <FormControl
                  placeholder="(제목+내용)"
                  value={keywords}
                  onChange={(e) => setKeywords(e.target.value)}
                />
                <Button type="submit" variant="warning" className="text-dark">
                  검색
                </Button>
              </InputGroup>
            </Form>
          </Col>
        </Row>
      )}
    </>
  );
}
