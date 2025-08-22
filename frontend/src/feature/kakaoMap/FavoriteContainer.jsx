import { MdStar, MdStarBorder } from "react-icons/md";
import axios from "axios";
import { useContext, useState } from "react";
import { OverlayTrigger, Spinner, Tooltip } from "react-bootstrap";
import { AuthenticationContext } from "../../common/AuthenticationContextProvider.jsx";

export function FavoriteContainer({
  facilityName,
  facilityId,
  isFavorite,
  onToggle,
}) {
  // 그니까 얘는 지금 이제 즐찾 누르고, 안 누르는 것만 관리.
  // isFavorite을 통해 현재 시설물이 즐찾이냐 아니냐라는 상태(true, false)를 받음
  const [isProcessing, setIsProcessing] = useState(false);
  const { user } = useContext(AuthenticationContext);

  if (!facilityName || !facilityName.trim()) {
    return null;
  }

  const handleFavoriteClick = async () => {
    if (isProcessing || !user) return;

    setIsProcessing(true);

    try {
      await axios.put("/api/favorite", {
        facilityId,
        facilityName: facilityName.trim(),
      });

      // 상위 컴포넌트 상태 갱신
      onToggle?.(!isFavorite);
    } catch (err) {
      console.error("즐겨찾기 처리 실패:", err);
      alert("즐겨찾기 처리 중 오류가 발생했습니다.");
    } finally {
      setIsProcessing(false);
    }
  };

  const starStyle = {
    fontSize: "1.8rem",
    cursor: user ? (isProcessing ? "wait" : "pointer") : "not-allowed",
    color: isFavorite ? "gold" : "#ccc",
    transition: "color 0.3s ease",
  };

  return (
    <OverlayTrigger
      placement="top"
      overlay={
        !user ? (
          <Tooltip id="tooltip-login">로그인 하세요</Tooltip>
        ) : (
          <Tooltip id="tooltip-like">
            {isFavorite ? "즐겨찾기 취소" : "즐겨찾기"}
          </Tooltip>
        )
      }
    >
      <div
        onClick={user && !isProcessing ? handleFavoriteClick : undefined}
        style={{ display: "flex", alignItems: "center" }}
      >
        {user ? (
          isProcessing ? (
            <Spinner animation="border" size="sm" />
          ) : isFavorite ? (
            <MdStar style={starStyle} />
          ) : (
            <MdStarBorder style={starStyle} />
          )
        ) : (
          <MdStarBorder style={starStyle} />
        )}
      </div>
    </OverlayTrigger>
  );
}
