import { useEffect, useState } from "react";
import { Col, Row, Spinner, Table, Alert } from "react-bootstrap";
import axios from "axios";
import { useNavigate } from "react-router";
import { FaUserCircle } from "react-icons/fa";
import { GoMail } from "react-icons/go";
import { BsCalendar2DateFill } from "react-icons/bs";
import "../../styles/MemberList.css";
import { toast } from "react-toastify";

export function MemberList() {
  const [memberList, setMemberList] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    axios
      .get("/api/member/list")
      .then((res) => setMemberList(res.data))
      .catch((err) => {
        console.error("회원 목록 오류", err);
        setError("회원 목록을 불러오는 중 문제가 발생했습니다.");
        navigate("/login");
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="text-center my-5">
        <Spinner animation="border" />
        <div className="mt-2 text-muted">데이터를 불러오는 중입니다...</div>
      </div>
    );
  }

  if (error) {
    return (
      <Alert variant="danger" className="my-5 text-center">
        {error}
      </Alert>
    );
  }

  if (!memberList || memberList.length === 0) {
    return (
      <Alert variant="info" className="my-5 text-center">
        등록된 회원이 없습니다.
      </Alert>
    );
  }

  return (
    <>
      <div style={{ padding: "2rem" }}>
        <h2 className="mb-4 fw-bold text-muted">회원 목록</h2>
        <Table className="member-list-table" responsive>
          <thead>
            <tr>
              <th>
                {/*<GoMail className="me-2" />*/}
                이메일
              </th>
              <th>
                {/*<FaUserCircle className="me-2" />*/}
                별명
              </th>
              <th>
                {/*<BsCalendar2DateFill className="me-2" />*/}
                가입일
              </th>
            </tr>
          </thead>
          <tbody>
            {memberList.map(({ email, nickName, insertedAt }) => (
              <tr
                key={email}
                onClick={() =>
                  navigate(`/member?email=${encodeURIComponent(email)}`)
                }
              >
                <td
                  className="email-cell"
                  title={email} // 마우스를 올리면 전체 이메일 표시
                >
                  {email}
                </td>
                <td>{nickName}</td>
                <td>{insertedAt ? insertedAt.substring(0, 10) : "-"}</td>
              </tr>
            ))}
          </tbody>
        </Table>
      </div>
    </>
  );
}
