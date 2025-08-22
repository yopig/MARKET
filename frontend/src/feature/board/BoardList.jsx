import {
  Alert,
  Badge,
  Button,
  Form,
  FormControl,
  Image,
  InputGroup,
  Pagination,
  Spinner,
  Table,
} from "react-bootstrap";
import { useEffect, useState, useContext } from "react";
import axios from "axios";
import { useNavigate, useSearchParams } from "react-router";
import {
  FaRegComments,
  FaRegImages,
  FaBullhorn,
  FaThumbtack,
} from "react-icons/fa";
import { AuthenticationContext } from "../../common/AuthenticationContextProvider.jsx";
import "../../styles/BoardList.css";

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
            : "게시글을 불러오는 중 오류가 발생했습니다.",
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
      <Alert variant="danger">
        <FaBullhorn className="me-2" />
        {errorMsg}
      </Alert>
    );
  }

  if (!boardList) {
    return (
      <div className="text-center py-5">
        <Spinner animation="border" variant="primary" />
        <div className="mt-2 text-muted">공지사항을 불러오는 중...</div>
      </div>
    );
  }

  // isAdmin은 함수이므로 호출하여 boolean 확인
  const adminFlag = typeof isAdmin === "function" ? isAdmin() : isAdmin;

  return (
    <div className="board-list-container">
      {/* 헤더 */}
      <div className="p-3 mb-0 d-flex align-items-center justify-content-between">
        <div className="d-flex align-items-center">
          <FaBullhorn className="me-2" size={20} />
          <h5 className="mb-0 fw-bold">공지사항</h5>
        </div>
        {adminFlag && (
          <Button variant="warning" size="sm" onClick={handleNoticeAdd}>
            공지 작성
          </Button>
        )}
      </div>

      {/* 공지사항 테이블 */}
      {boardList.length === 0 ? (
        <div className="text-center py-5 border border-top-0">
          <FaBullhorn className="text-muted mb-3" size={48} />
          <h5 className="text-muted">등록된 공지사항이 없습니다.</h5>
          <p className="text-muted mb-0">새로운 공지사항을 기다리고 있어요!</p>
        </div>
      ) : (
        <Table hover className="mb-0" style={{ fontSize: "0.9rem" }}>
          <thead className="table-light">
            <tr>
              <th style={{ width: "60px", textAlign: "center" }}>번호</th>
              <th style={{ width: "80px", textAlign: "center" }}>구분</th>
              <th>제목</th>
              <th style={{ width: "120px", textAlign: "center" }}>작성자</th>
              <th style={{ width: "120px", textAlign: "center" }}>작성일</th>
              <th style={{ width: "80px", textAlign: "center" }}>첨부</th>
            </tr>
          </thead>
          <tbody>
            {boardList.map((board) => (
              <tr
                key={board.id}
                style={{ cursor: "pointer" }}
                onClick={() => handleTableRowClick(board.id)}
                className="align-middle"
              >
                <td className="text-center text-muted">
                  <small>{board.id}</small>
                </td>
                <td className="text-center">
                  <Badge
                    bg="danger"
                    className="d-flex align-items-center justify-content-center gap-1"
                  >
                    <FaThumbtack size={10} />
                    <small>공지</small>
                  </Badge>
                </td>
                <td>
                  <div className="d-flex align-items-center">
                    <span className="fw-semibold text-dark me-2">
                      {board.title}
                    </span>
                    {board.countComment > 0 && (
                      <Badge
                        bg="light"
                        text="dark"
                        className="d-flex align-items-center gap-1 me-1"
                      >
                        <FaRegComments size={10} />
                        <small>{board.countComment}</small>
                      </Badge>
                    )}
                  </div>
                </td>
                <td className="text-center">
                  <div className="d-flex align-items-center justify-content-center">
                    <Image
                      roundedCircle
                      className="me-1"
                      src={board.profileImageUrl || defaultProfileImage}
                      alt={`${board.nickName ?? "익명"} 프로필`}
                      style={{ width: "16px", height: "16px" }}
                    />
                    <small className="text-muted">{board.nickName}</small>
                  </div>
                </td>
                <td className="text-center">
                  <small className="text-muted">{board.timesAgo}</small>
                </td>
                <td className="text-center">
                  {board.countFile > 0 ? (
                    <Badge
                      bg="secondary"
                      className="d-flex align-items-center justify-content-center gap-1"
                    >
                      <FaRegImages size={10} />
                      <small>{board.countFile}</small>
                    </Badge>
                  ) : (
                    <small className="text-muted">-</small>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </Table>
      )}

      {/* 하단 영역 */}
      {pageInfo && (
        <div className="border border-top-0 bg-light p-3">
          {/* 검색 */}
          <div className="mb-3">
            <Form onSubmit={handleSearchFormSubmit}>
              <InputGroup
                size="sm"
                style={{ maxWidth: "400px", margin: "0 auto" }}
              >
                <FormControl
                  placeholder="제목 또는 내용 검색"
                  value={keywords}
                  onChange={(e) => setKeywords(e.target.value)}
                />
                <Button type="submit" variant="outline-secondary">
                  검색
                </Button>
              </InputGroup>
            </Form>
          </div>

          {/* 페이지네이션 */}
          <div className="d-flex justify-content-center">
            <Pagination size="sm" className="mb-0">
              <Pagination.First
                onClick={() => handlePageNumberClick(1)}
                disabled={pageInfo.currentPageNumber === 1}
              />
              <Pagination.Prev
                onClick={() =>
                  handlePageNumberClick(pageInfo.currentPageNumber - 1)
                }
                disabled={pageInfo.currentPageNumber === 1}
              />
              {pageNumbers.map((num) => (
                <Pagination.Item
                  key={num}
                  active={pageInfo.currentPageNumber === num}
                  onClick={() => handlePageNumberClick(num)}
                >
                  {num}
                </Pagination.Item>
              ))}
              <Pagination.Next
                onClick={() =>
                  handlePageNumberClick(pageInfo.currentPageNumber + 1)
                }
                disabled={pageInfo.currentPageNumber === pageInfo.totalPages}
              />
              <Pagination.Last
                onClick={() => handlePageNumberClick(pageInfo.totalPages)}
                disabled={pageInfo.currentPageNumber === pageInfo.totalPages}
              />
            </Pagination>
          </div>
        </div>
      )}
    </div>
  );
}
