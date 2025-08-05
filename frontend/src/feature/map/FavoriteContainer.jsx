import { MdFavorite, MdFavoriteBorder } from "react-icons/md";
import axios from "axios";
import { useContext, useEffect, useState } from "react";
import { OverlayTrigger, Spinner, Tooltip } from "react-bootstrap";
import { AuthenticationContext } from "../../common/AuthenticationContextProvider.jsx";

export function FavoriteContainer({ facilityName }) {
  const [isProcessing, setIsProcessing] = useState(false);
  const [favoriteInfo, setFavoriteInfo] = useState(null);
  const { user } = useContext(AuthenticationContext);

  function fetchLikeInfo() {
    return axios
      .get(`/api/favorite/${facilityName}`)
      .then((res) => {
        setFavoriteInfo(res.data);
      })
      .catch((err) => {
        console.error("찜 정보 불러오기 실패:", err);
      });
  }

  useEffect(() => {
    if (!user) return; // 🔒 비로그인 시 실행 안 함
    setIsProcessing(true);
    fetchLikeInfo().finally(() => setIsProcessing(false));
  }, [facilityName, user]);

  function handleFavoriteClick() {
    if (isProcessing || !user) return;

    setIsProcessing(true);
    axios
      .put("/api/favorite", { facilityName })
      .then(() => fetchLikeInfo())
      .catch((err) => {
        console.error("찜 처리 실패:", err);
      })
      .finally(() => setIsProcessing(false));
  }

  const heartStyle = {
    fontSize: "2rem",
    cursor: user ? "pointer" : "not-allowed",
    color: favoriteInfo?.isFavorite ? "red" : "#ccc",
  };

  return (
    <OverlayTrigger
      placement="top"
      overlay={
        !user ? (
          <Tooltip id="tooltip-login">로그인 하세요</Tooltip>
        ) : (
          <Tooltip id="tooltip-like">
            {favoriteInfo?.isFavorite ? "찜 취소" : "찜"}
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
          ) : favoriteInfo?.isFavorite ? (
            <MdFavorite style={heartStyle} />
          ) : (
            <MdFavoriteBorder style={heartStyle} />
          )
        ) : (
          <MdFavoriteBorder style={heartStyle} />
        )}
      </div>
    </OverlayTrigger>
  );
}
