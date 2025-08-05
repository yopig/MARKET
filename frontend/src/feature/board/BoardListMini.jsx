import { Alert, Badge, Spinner, Table } from "react-bootstrap";
import { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router";
import { FaRegImages } from "react-icons/fa";

export function BoardListMini() {
  const [boardList, setBoardList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    setLoading(true);
    setError(null);

    axios
      .get("/api/board/latest")
      .then((res) => setBoardList(res.data))
      .catch(() => {
        setError("게시글을 불러오는 중 오류가 발생했습니다.");
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="text-center my-3 text-secondary small">
        <Spinner animation="border" size="sm" /> 불러오는 중...
      </div>
    );
  }

  if (error) {
    return (
      <Alert variant="danger" className="my-3 py-2 px-3 small">
        {error}
      </Alert>
    );
  }

  if (boardList.length === 0) {
    return <p className="text-muted mt-2 small">작성된 글이 없습니다.</p>;
  }

  return (
    <Table
      hover
      responsive
      size="sm"
      className="align-middle text-secondary"
      style={{ fontSize: "1rem", tableLayout: "fixed" }} // 글씨 크기 1rem으로 조정
    >
      <thead>
      <tr className="text-muted" style={{ height: "40px", fontSize: "0.9rem" }}>
        <th style={{ width: "50px" }}>#</th>
        <th>제목</th>
        <th style={{ width: "100px" }}>작성자</th>
        <th style={{ width: "120px" }}>작성일</th>
      </tr>
      </thead>
      <tbody>
      {boardList.map((board) => (
        <tr
          key={board.id}
          onClick={() => navigate(`/board/${board.id}`)}
          style={{ cursor: "pointer", height: "50px" }} // 행 높이 약간 줄임
        >
          <td className="text-muted" style={{ fontSize: "0.9rem" }}>{board.id}</td>
          <td
            className="text-dark"
            style={{
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
              fontSize: "0.95rem",
            }}
          >
            <div
              className="d-flex gap-2 align-items-center"
              style={{ overflow: "hidden" }}
            >
                <span
                  style={{
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                    display: "inline-block",
                    maxWidth: "100%",
                  }}
                >
                  {board.title}
                </span>

              {board.countFile > 0 && (
                <Badge bg="warning" text="white" style={{ fontSize: "0.75rem" }}>
                  <div className="d-flex gap-1 align-items-center">
                    <FaRegImages />
                    <span>{board.countFile}</span>
                  </div>
                </Badge>
              )}
            </div>
          </td>
          <td className="text-truncate text-muted" title={board.nickName} style={{ fontSize: "0.9rem" }}>
            {board.nickName}
          </td>
          <td className="text-muted" style={{ fontSize: "0.9rem" }}>{board.timesAgo}</td>
        </tr>
      ))}
      </tbody>
    </Table>
  );
}
