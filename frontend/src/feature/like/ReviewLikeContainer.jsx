import { FaRegThumbsUp, FaThumbsUp } from "react-icons/fa";
import axios from "axios";
import { useContext, useEffect, useState } from "react";
import { OverlayTrigger, Spinner, Tooltip, Button } from "react-bootstrap";
import { AuthenticationContext } from "../../common/AuthenticationContextProvider.jsx";

export function ReviewLikeContainer({ reviewId }) {
  const [isProcessing, setIsProcessing] = useState(false);
  const [likeInfo, setLikeInfo] = useState(null);
  const { user } = useContext(AuthenticationContext);

  // 인증 헤더 생성 함수
  const getAuthHeaders = () => {
    if (!user || !user.accessToken) return {};
    return {
      Authorization: `Bearer ${user.accessToken}`,
    };
  };

  // 로그인 여부와 관계없이 항상 좋아요 수 조회
  function fetchLikeInfo() {
    return axios
      .get(`/api/reviewlike/review/${reviewId}`, {
        headers: getAuthHeaders(), // 비로그인 시 빈 객체 전달됨
      })
      .then((res) => setLikeInfo(res.data))
      .catch((err) => {
        console.error("리뷰 좋아요 정보 로딩 실패:", err);
        setLikeInfo({ liked: false, likeCount: 0 });
      });
  }

  useEffect(() => {
    setIsProcessing(true);
    fetchLikeInfo().finally(() => setIsProcessing(false));
  }, [reviewId, user]);

  function handleThumbsClick() {
    if (isProcessing || !user) return;

    setIsProcessing(true);
    axios
      .put(
        "/api/reviewlike",
        { reviewId },
        {
          headers: getAuthHeaders(),
        }
      )
      .then(() => fetchLikeInfo())
      .catch((err) => console.error("리뷰 좋아요 처리 실패:", err))
      .finally(() => setIsProcessing(false));
  }

  if (!likeInfo) {
    return (
      <div
        className="d-flex align-items-center justify-content-center"
        style={{ height: "2rem" }}
      >
        <Spinner animation="border" size="sm" />
      </div>
    );
  }

  return (
    <OverlayTrigger
      placement="top"
      overlay={
        !user ? (
          <Tooltip id="tooltip-login">로그인 하세요</Tooltip>
        ) : (
          <Tooltip id="tooltip-like">
            {likeInfo.liked ? "좋아요 취소" : "좋아요"}
          </Tooltip>
        )
      }
    >
      <Button
        variant={likeInfo.liked ? "primary" : "outline-secondary"}
        size="sm"
        onClick={user && !isProcessing ? handleThumbsClick : undefined}
        disabled={isProcessing || !user}
        className="d-flex align-items-center gap-1"
      >
        {isProcessing ? (
          <Spinner animation="border" size="sm" />
        ) : likeInfo.liked ? (
          <FaThumbsUp />
        ) : (
          <FaRegThumbsUp />
        )}
        <span>{likeInfo.likeCount}</span>
      </Button>
    </OverlayTrigger>
  );
}
