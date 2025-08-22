import React, { useContext, useState } from "react";
import { Badge, Button, Carousel, Image, Modal } from "react-bootstrap";
import { FaEdit, FaTrashAlt } from "react-icons/fa";
import { AuthenticationContext } from "../../common/AuthenticationContextProvider.jsx";
import ReviewEdit from "./ReviewEdit.jsx";
import { useNavigate } from "react-router";
import { ReviewText } from "../../common/ReviewText.jsx";

function ReviewCard({ review, onUpdate, onDelete, showOnlyImages = false }) {
  const { user } = useContext(AuthenticationContext);
  const [isEditing, setIsEditing] = useState(false);
  const [showImageModal, setShowImageModal] = useState(false);

  const [showAllImages, setShowAllImages] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  const [isHoverd, setIsHoverd] = useState(false);

  // 이미지 캐루셀 index
  const [modalImageIndex, setModalImageIndex] = useState(0);

  const navigate = useNavigate();
  const defaultProfileImage = "/user.png";

  const formatDate = (isoString) => {
    if (!isoString) return "날짜 없음";
    const date = new Date(isoString);
    return `${date.getFullYear()}-${(date.getMonth() + 1)
      .toString()
      .padStart(2, "0")}-${date.getDate().toString().padStart(2, "0")}`;
  };

  // 이미지 정보가 URL 문자열일 수도, 객체일 수도 있으므로 확인 후 처리
  const getImageUrl = (fileInfo) => {
    return typeof fileInfo === "string" ? fileInfo : fileInfo.url;
  };

  const getImageNickName = (fileInfo) => {
    return typeof fileInfo === "string" ? null : fileInfo.nickName;
  };

  const getProfileImageUrl = (fileInfo) => {
    return typeof fileInfo === "string" ? null : fileInfo.profileImageUrl;
  };

  const getCountMemberReview = (fileInfo) => {
    return typeof fileInfo === "string" ? null : fileInfo.countMemberReview;
  };

  const getMemberAverageRating = (fileInfo) => {
    return typeof fileInfo === "string" ? null : fileInfo.memberAverageRating;
  };

  // URL 문자열을 받아서 이미지 파일인지 확인하는 함수
  const isImageUrl = (fileUrl) => {
    if (typeof fileUrl !== "string" || !fileUrl) {
      return false;
    }
    const extension = fileUrl.split(".").pop().split("?")[0];
    return ["jpg", "jpeg", "png", "gif", "webp"].includes(
      extension.toLowerCase(),
    );
  };

  // 모든 이미지 파일을 컴포넌트 상단에서 한 번만 필터링
  const allImages = Array.isArray(review.files)
    ? review.files.filter((fileInfo) => {
        // fileInfo가 객체일 경우 url 속성으로 URL을 가져와서 검사
        const fileUrl = getImageUrl(fileInfo);
        return isImageUrl(fileUrl);
      })
    : [];

  const handleImageClick = (imageInfo, index) => {
    setModalImageIndex(index);
    setShowImageModal(true);
  };

  const handleCloseImageModal = () => {
    setShowImageModal(false);
  };

  const handleEditStart = () => {
    setIsEditing(true);
  };

  const handleEditSave = (reviewId) => {
    setIsEditing(false);
    if (onUpdate) {
      // 수정한 리뷰 id를 mapDetail로 보냄
      onUpdate(reviewId);
    }
  };

  const handleEditCancel = () => {
    setIsEditing(false);
  };

  const handleDeleteConfirmed = () => {
    onDelete?.(review.id);
    setShowDeleteModal(false);
  };

  // 편집 모드일 때는 ReviewEdit 컴포넌트 렌더링
  if (isEditing) {
    return (
      <ReviewEdit
        review={review}
        onSave={handleEditSave}
        onCancel={handleEditCancel}
      />
    );
  }

  // showOnlyImages prop이 true일 경우, 이미지 파일만 렌더링
  if (showOnlyImages) {
    const imagesToShow = showAllImages ? allImages : allImages.slice(0, 5);
    const hasMoreImages = allImages.length > 5;

    return (
      <>
        <div className="d-flex flex-wrap gap-2">
          {imagesToShow.map((imageInfo, idx) => (
            <div key={idx} className="position-relative">
              <Image
                src={getImageUrl(imageInfo)}
                alt={`첨부 이미지 ${idx + 1}`}
                className="shadow rounded"
                width="150"
                height="150"
                style={{
                  objectFit: "cover",
                  cursor: "pointer",
                }}
                onClick={() => handleImageClick(imageInfo, idx)}
              />
              {/* 더보기 버튼을 마지막 이미지 위에 오버레이로 표시 */}
              {idx === imagesToShow.length - 1 &&
                hasMoreImages &&
                !showAllImages && (
                  <Button
                    variant="dark"
                    className="position-absolute top-50 start-50 translate-middle rounded-circle"
                    style={{ width: "60px", height: "60px", opacity: 0.8 }}
                    onClick={() => setShowAllImages(true)}
                  >
                    +{allImages.length - 6}
                  </Button>
                )}
            </div>
          ))}

          {/* 간략히 버튼은 이미지 갤러리 아래에 배치 */}
          {hasMoreImages && showAllImages && (
            <Button
              variant="outline-secondary"
              className="w-100 mt-2"
              onClick={() => setShowAllImages(false)}
            >
              간략히
            </Button>
          )}
        </div>

        {/* 이미지 확대 모달 */}
        <Modal
          show={showImageModal}
          onHide={handleCloseImageModal}
          centered
          size="xl"
        >
          <Modal.Header closeButton className="border-0 bg-transparent" />
          <Modal.Body
            className="d-flex justify-content-center align-items-center p-0 bg-transparent"
            style={{ minHeight: "500px" }}
          >
            <Carousel
              className="hover-controls"
              activeIndex={modalImageIndex}
              onSelect={setModalImageIndex}
              interval={null}
              slide={false}
              // 🔽 이미지 개수가 1개를 초과할 때만 버튼을 보여줍니다.
              // 여기는 캡션 필요해서 버튼으로 ui 설정
              prevIcon={
                allImages.length > 1 ? (
                  <span
                    aria-hidden="true"
                    className="carousel-control-prev-icon"
                  />
                ) : null
              }
              nextIcon={
                allImages.length > 1 ? (
                  <span
                    aria-hidden="true"
                    className="carousel-control-next-icon"
                  />
                ) : null
              }
            >
              {allImages.map((imageInfo, idx) => (
                <Carousel.Item key={idx}>
                  <Image
                    src={getImageUrl(imageInfo)}
                    alt={`확대 이미지 ${idx + 1}`}
                    fluid
                    style={{
                      height: "500px",
                      width: "100vw",
                      objectFit: "contain",
                      margin: "0 auto", // 중앙 정렬
                    }}
                  />
                  {/* 캐러셀 캡션으로 작성자 정보 푸터처럼 표시 */}
                  <Carousel.Caption
                    className="d-flex align-items-center justify-content-start p-3 bg-dark bg-opacity-75"
                    style={{ left: 0, right: 0, bottom: 0, padding: "1rem" }}
                  >
                    <Image
                      roundedCircle
                      src={getProfileImageUrl(imageInfo)}
                      alt={`${getImageNickName(imageInfo)} 프로필 사진`}
                      style={{
                        width: "40px",
                        height: "40px",
                        objectFit: "cover",
                      }}
                    />
                    <div className="d-flex flex-column ms-2 text-start">
                      <strong className="text-white">
                        {getImageNickName(imageInfo)}
                      </strong>
                      <span className="small text-white text-opacity-75">
                        리뷰 <strong>{getCountMemberReview(imageInfo)}</strong>{" "}
                        평균 평점{" "}
                        <strong>{getMemberAverageRating(imageInfo)}</strong>
                      </span>
                    </div>
                  </Carousel.Caption>
                </Carousel.Item>
              ))}
            </Carousel>
          </Modal.Body>
        </Modal>
      </>
    );
  }

  // 일반 표시 모드
  return (
    <div className="position-relative px-4">
      {/* 프로필 정보 섹션 */}
      <div className="d-flex align-items-start justify-content-between mb-3">
        {/* 작성자 정보 (왼쪽) */}
        <div className="d-flex align-items-center">
          <Image
            roundedCircle
            src={review.profileImageUrl || defaultProfileImage}
            alt={`${review.memberEmailNickName ?? "익명"} 프로필`}
            width="40"
            height="40"
            className="me-3 border border-2 border-light"
            style={{ objectFit: "cover" }}
          />
          <div>
            <div className="d-flex align-items-center">
              <div
                className={`fw-bold text-dark ${isHoverd ? "text-decoration-underline" : ""}`}
                style={{ cursor: "pointer" }}
                onMouseOver={() => setIsHoverd(true)}
                onMouseOut={() => setIsHoverd(false)}
                onClick={() => navigate(`/review/my/${review.memberId}`)}
              >
                {review.memberEmailNickName || "알 수 없음"}
              </div>
              <div className="small text-muted ms-2">
                {" "}
                리뷰 {review.countMemberReview} 평균 평점{" "}
                {review.memberAverageRating}
              </div>
            </div>
            <div className="small text-muted">
              {formatDate(review.insertedAt)}
            </div>
          </div>
        </div>

        {user?.email === review.memberEmail && (
          <div className="d-flex gap-2">
            <Button
              variant="outline-secondary"
              size="sm"
              onClick={handleEditStart}
              className="d-flex align-items-center"
            >
              <FaEdit className="me-1" /> 수정
            </Button>
            <Button
              variant="outline-danger"
              size="sm"
              onClick={() => setShowDeleteModal(true)}
              className="d-flex align-items-center"
            >
              <FaTrashAlt className="me-1" /> 삭제
            </Button>
          </div>
        )}
      </div>

      {/* 태그 표시 */}
      {Array.isArray(review.tags) && review.tags.length > 0 && (
        <div className="d-flex flex-wrap gap-2 mb-3">
          {review.tags.map((tag) => (
            <Badge key={tag.id} bg="secondary" className="fw-normal px-2 py-1">
              # {tag.name}
            </Badge>
          ))}
        </div>
      )}

      {/* 리뷰 본문 */}
      <div className="mb-3 p-3 bg-light">
        <ReviewText text={review.review} />
      </div>

      {/* 첨부 이미지 */}
      {allImages.length > 0 && (
        <div className="mb-3">
          <div className="d-flex gap-2 overflow-auto pb-2">
            {allImages.map((fileUrl, idx) => (
              <Image
                key={idx}
                src={fileUrl}
                alt={`첨부 이미지 ${idx + 1}`}
                className="shadow-sm rounded flex-shrink-0"
                width="120"
                height="120"
                style={{
                  objectFit: "cover",
                  cursor: "pointer",
                  transition: "transform 0.2s",
                }}
                onClick={() => handleImageClick(fileUrl)} // 모달이 아래 같이 있어서 리뷰이미지들만 넘겨도 됨
                onMouseOver={(e) => (e.target.style.transform = "scale(1.05)")}
                onMouseOut={(e) => (e.target.style.transform = "scale(1)")}
              />
            ))}
          </div>
        </div>
      )}

      {/* 이미지 확대 모달 */}
      <Modal
        show={showImageModal}
        onHide={handleCloseImageModal}
        centered
        size="xl"
      >
        <Modal.Header closeButton className="border-0 bg-transparent" />
        <Modal.Body
          className="d-flex justify-content-center align-items-center p-0 bg-transparent"
          style={{ minHeight: "500px" }}
        >
          <Carousel
            className="hover-controls"
            activeIndex={modalImageIndex}
            onSelect={setModalImageIndex}
            interval={null}
            slide={false}
            // 🔽 이미지 개수가 1개를 초과할 때만 버튼을 보여줍니다.
            // 여기는 캡션 필요해서 버튼으로 ui 설정
            prevIcon={
              allImages.length > 1 ? (
                <span
                  aria-hidden="true"
                  className="carousel-control-prev-icon"
                />
              ) : null
            }
            nextIcon={
              allImages.length > 1 ? (
                <span
                  aria-hidden="true"
                  className="carousel-control-next-icon"
                />
              ) : null
            }
          >
            {allImages.map((imageInfo, idx) => (
              <Carousel.Item key={idx}>
                <Image
                  src={getImageUrl(imageInfo)}
                  alt={`확대 이미지 ${idx + 1}`}
                  fluid
                  style={{
                    height: "500px",
                    width: "100vw",
                    objectFit: "contain",
                    margin: "0 auto", // 중앙 정렬
                  }}
                />
                {/* 캐러셀 캡션으로 작성자 정보 푸터처럼 표시 */}
                <Carousel.Caption
                  className="d-flex align-items-center justify-content-start p-3 bg-dark bg-opacity-75"
                  style={{ left: 0, right: 0, bottom: 0, padding: "1rem" }}
                >
                  <Image
                    roundedCircle
                    src={review.profileImageUrl || defaultProfileImage}
                    alt={`${review.memberEmailNickName ?? "익명"} 프로필`}
                    style={{
                      width: "40px",
                      height: "40px",
                      objectFit: "cover",
                    }}
                  />
                  <div className="d-flex flex-column ms-3 text-start">
                    <strong className="text-white">
                      {review.memberEmailNickName || "알 수 없음"}
                    </strong>
                    <span className="small text-white text-opacity-75">
                      리뷰 <strong>{review.countMemberReview}</strong> 평균 평점{" "}
                      <strong>{review.memberAverageRating ?? 0.0}</strong>
                    </span>
                  </div>
                </Carousel.Caption>
              </Carousel.Item>
            ))}
          </Carousel>
        </Modal.Body>
      </Modal>

      {/* 삭제 확인 모달 */}
      <Modal
        show={showDeleteModal}
        onHide={() => setShowDeleteModal(false)}
        centered
      >
        <Modal.Header closeButton>
          <Modal.Title>리뷰 삭제</Modal.Title>
        </Modal.Header>
        <Modal.Body>정말 삭제하시겠습니까?</Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowDeleteModal(false)}>
            취소
          </Button>
          <Button variant="danger" onClick={handleDeleteConfirmed}>
            삭제
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
}

export default ReviewCard;
