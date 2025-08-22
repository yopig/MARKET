import React, { useContext, useEffect, useRef, useState } from "react";
import { useParams, useSearchParams } from "react-router-dom";
import { AuthenticationContext } from "../../common/AuthenticationContextProvider.jsx";
import { ReviewLikeContainer } from "../like/ReviewLikeContainer.jsx";
import { FavoriteContainer } from "../kakaoMap/FavoriteContainer.jsx";
import { get } from "../kakaoMap/data/api.jsx";
import axios from "axios";
import ReviewCard from "../review/ReviewCard.jsx";
import ReviewAdd from "../review/ReviewAdd.jsx";
import FacilityInfoCard from "./FacilityInfoCard.jsx";
import MapPreviewCard from "./MapPreviewCard.jsx";
import ReviewStatsCard from "./ReviewStatusCard.jsx";
import ReportModal from "../report/ReportModal.jsx";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import "../../styles/MapDetail.css";

export function MapDetail() {
  const { id } = useParams();
  const { user } = useContext(AuthenticationContext);
  const [searchParams, setSearchParams] = useSearchParams();

  // 상태 관리
  const [facility, setFacility] = useState({
    isFavorite: false,
    id: null,
    name: "",
  });
  const [reviews, setReviews] = useState([]);
  const [loadingFacility, setLoadingFacility] = useState(true);
  const [loadingReviews, setLoadingReviews] = useState(true);
  const [sortBy, setSortBy] = useState("latest");
  const [isWriting, setIsWriting] = useState(false);

  const reviewRefs = useRef({});

  // 신고 관련 상태
  const [reportModalOpen, setReportModalOpen] = useState(false);
  const [reportingReviewId, setReportingReviewId] = useState(null);

  // 데이터 조회 함수들
  const fetchFacility = async () => {
    if (!id) return;
    setLoadingFacility(true);
    try {
      const facilityData = await get(`/pet_facilities/${id}`);

      let isFavorite = false;
      if (user) {
        const favResponse = await axios.get(
          `/api/favorite/id/${facilityData.id}`,
        );
        isFavorite = favResponse.data.isFavorite;
      }

      setFacility({ ...facilityData, isFavorite });
    } catch (err) {
      console.error(`시설 조회 실패 (id=${id}):`, err);
      setFacility({ id: null, name: "", isFavorite: false });
    } finally {
      setLoadingFacility(false);
    }
  };
  // 그니까 얘는 한 번에 한 시설명에 대한 즐찾만 가져오니까 .. 잘 확인하고 있는거고,
  // MyReview는 각 리뷰에서 계속 isFavorite인지 확인해야함

  const fetchReviews = async () => {
    if (!id) return;
    setLoadingReviews(true);
    try {
      const response = await axios.get(`/api/review/facility/${id}`, {
        params: { sort: sortBy },
      });
      setReviews(response.data || []);
    } catch (err) {
      console.error("리뷰 목록 조회 실패:", err);
      setReviews([]);
    } finally {
      setLoadingReviews(false);
    }
  };

  // 리뷰 핸들러
  const handleUpdate = (reviewId) => {
    fetchReviews();
    setSearchParams({ focusReviewId: reviewId });
  };
  const handleDelete = async (reviewId) => {
    try {
      await axios.delete(`/api/review/delete/${reviewId}`, {
        data: { email: user.email },
      });
      setSearchParams({ focusReviewId: "" });
      toast.success("리뷰가 삭제되었습니다.");
      fetchReviews();
    } catch (err) {
      console.error("리뷰 삭제 실패:", err);
      alert("삭제 실패: " + (err.response?.data?.message || err.message));
    }
  };

  const handleGoToWrite = () => setIsWriting(true);
  const handleReviewSaved = (reviewId) => {
    setIsWriting(false);
    fetchReviews();
    setSearchParams({ focusReviewId: reviewId });
  };
  const handleReviewCancel = () => setIsWriting(false);

  // 신고 모달
  const openReportModal = (review) => {
    if (!user) return;

    if (user.email === review.memberEmail) {
      toast.error("자신의 리뷰는 신고할 수 없습니다.");
      return;
    }

    setReportingReviewId(review.id);
    setReportModalOpen(true);
  };
  const closeReportModal = () => {
    setReportingReviewId(null);
    setReportModalOpen(false);
  };

  // 유틸
  const getAverageRating = () => {
    if (reviews.length === 0) return null;
    const sum = reviews.reduce((acc, r) => acc + r.rating, 0);
    return (sum / reviews.length).toFixed(1);
  };
  const isImageFile = (fileUrl) => {
    const ext = fileUrl.split(".").pop().split("?")[0];
    return ["jpg", "jpeg", "png", "gif", "webp"].includes(ext.toLowerCase());
  };
  const allImagesAndNickNameFromReviews = reviews.flatMap((review) =>
    (review.files || []).filter(isImageFile).map((fileUrl) => ({
      url: fileUrl,
      nickName: review.memberEmailNickName,
      profileImageUrl: review.profileImageUrl || "/user.png",
      countMemberReview: review.countMemberReview,
      memberAverageRating: review.memberAverageRating,
    })),
  );

  const sortedReviews = [...reviews];
  if (sortBy === "likes") {
    sortedReviews.sort((a, b) => (b.likeCount || 0) - (a.likeCount || 0));
  } else {
    sortedReviews.sort((a, b) => {
      const dateA = new Date(a.insertedAt || a.createdAt || 0);
      const dateB = new Date(b.insertedAt || b.createdAt || 0);
      return dateB - dateA;
    });
  }

  // useEffect
  useEffect(() => {
    fetchReviews();
  }, [id, sortBy]);

  useEffect(() => {
    // user가 undefined가 아니면 fetchFacility
    if (user !== undefined) fetchFacility();
  }, [id, user]);

  useEffect(() => {
    const focusReviewId = searchParams.get("focusReviewId");
    if (focusReviewId && reviews.length > 0) {
      const el = reviewRefs.current[focusReviewId];
      if (el) {
        el.scrollIntoView({ behavior: "smooth", block: "center" });
        el.classList.add("bg-warning", "bg-opacity-25", "rounded", "p-2");
        const timer = setTimeout(() => {
          el.classList.remove("bg-warning", "bg-opacity-25", "rounded", "p-2");
        }, 2500);
        return () => clearTimeout(timer);
      }
    }
  }, [reviews, searchParams]);

  return (
    <div
      className="map-detail-container container-fluid px-4 py-4"
      style={{ maxWidth: "1400px" }}
    >
      {/* 헤더 */}
      <div className="row mb-5">
        <div className="col-12">
          <div className="card border-0 bg-transparent">
            <div className="card-body p-4">
              <div className="d-flex justify-content-between align-items-center">
                <div>
                  <h1 className="display-6 fw-bold mb-2">
                    {loadingFacility
                      ? "불러오는 중..."
                      : facility?.name || "시설 정보 없음"}
                  </h1>
                  <p className="opacity-75 mb-0">
                    <i className="bi bi-geo-alt me-2"></i>
                    반려동물과 함께하는 특별한 공간
                  </p>
                </div>
                {facility?.id && (
                  <FavoriteContainer
                    facilityName={facility.name}
                    facilityId={facility.id}
                    isFavorite={facility.isFavorite}
                    onToggle={(newVal) =>
                      setFacility((prev) => ({ ...prev, isFavorite: newVal }))
                    }
                  />
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 시설 정보 + 지도 */}
      <div className="row mb-5 g-4">
        <div className="col-lg-7">
          <FacilityInfoCard facility={facility} loading={loadingFacility} />
        </div>
        <div className="col-lg-5">
          <MapPreviewCard facility={facility} />
        </div>
      </div>

      {/* 리뷰 작성 */}
      {!isWriting && (
        <div className="row mb-4">
          <div className="col-12 text-center">
            {user ? (
              <button
                onClick={handleGoToWrite}
                className="btn btn-warning btn-lg px-5 py-3 fw-bold"
              >
                <i className="bi bi-pencil-square me-3 fs-5"></i>
                리뷰 작성하기
              </button>
            ) : (
              <div className="alert alert-info border-0">
                <div className="d-flex align-items-center justify-content-center">
                  <i className="bi bi-info-circle-fill me-3 fs-4"></i>
                  <div>
                    <h6 className="alert-heading mb-1">로그인이 필요합니다</h6>
                    <p className="mb-0">
                      로그인한 사용자만 리뷰를 작성할 수 있습니다.
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {isWriting && facility && (
        <div className="row mb-5">
          <div className="col-12">
            <div className="card border-0">
              <div
                style={{
                  backgroundColor: "#F6ECE6",
                  borderBottom: "3px solid #212529",
                }}
              >
                <h2 className="card-title mb-0 p-4">새 리뷰 작성</h2>
              </div>
              <div className="card-body p-5">
                <ReviewAdd
                  facility={facility}
                  onSave={handleReviewSaved}
                  onCancel={handleReviewCancel}
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {reviews.length > 0 && (
        <ReviewStatsCard reviews={reviews} averageRating={getAverageRating()} />
      )}

      {/* 사진/영상 */}
      <div className="row mb-5">
        <div className="col-12">
          <div className="card border-0">
            <div className="card-header bg-info text-white">
              <div className="d-flex align-items-center">
                <i className="bi bi-camera-fill me-3 fs-4"></i>
                <div>
                  <h4 className="card-title mb-0">사진 ▪ 영상</h4>
                  <small className="opacity-75">
                    Photos & Videos from Reviews
                  </small>
                </div>
              </div>
            </div>
            <div className="card-body p-4">
              {loadingReviews ? (
                <div className="text-center py-5">
                  <div className="spinner-border text-primary" role="status">
                    <span className="visually-hidden">Loading...</span>
                  </div>
                  <p className="mt-3 text-muted">사진을 불러오는 중...</p>
                </div>
              ) : allImagesAndNickNameFromReviews.length === 0 ? (
                <div className="text-center py-5">
                  <i className="bi bi-images text-muted display-4"></i>
                  <h5 className="mt-3 text-muted">
                    아직 업로드된 사진이 없습니다
                  </h5>
                  <small className="text-muted">
                    첫 번째 사진을 공유해보세요!
                  </small>
                </div>
              ) : (
                <ReviewCard
                  review={{ files: allImagesAndNickNameFromReviews }}
                  showOnlyImages={true}
                />
              )}
            </div>
          </div>
        </div>
      </div>

      {/* 리뷰 목록 */}
      <div className="row">
        <div className="col-12">
          <div className="card border-0">
            <div className="card-header bg-success text-white">
              <div className="d-flex justify-content-between align-items-center">
                <div className="d-flex align-items-center">
                  <i className="bi bi-chat-quote-fill me-3 fs-4"></i>
                  <div>
                    <h4 className="card-title mb-0">
                      리뷰 목록
                      <span className="badge bg-light text-dark ms-2">
                        {reviews.length}
                      </span>
                    </h4>
                    <small className="opacity-75">
                      User Reviews & Experiences
                    </small>
                  </div>
                </div>

                {reviews.length > 0 && (
                  <div className="d-flex align-items-center">
                    <label htmlFor="sortSelect" className="me-2 mb-0 fw-bold">
                      정렬:
                    </label>
                    <select
                      id="sortSelect"
                      value={sortBy}
                      onChange={(e) => {
                        setSearchParams({ focusReviewId: "" });
                        setSortBy(e.target.value);
                      }}
                      className="form-select form-select-sm"
                      style={{ width: "auto" }}
                    >
                      <option value="latest">최신순</option>
                      <option value="likes">좋아요순</option>
                    </select>
                  </div>
                )}
              </div>
            </div>

            <div className="card-body p-4">
              {loadingReviews ? (
                <div className="text-center py-5">
                  <div className="spinner-border text-primary" role="status">
                    <span className="visually-hidden">Loading...</span>
                  </div>
                  <p className="mt-3 text-muted">리뷰를 불러오는 중...</p>
                </div>
              ) : sortedReviews.length === 0 ? (
                <div className="text-center py-5">
                  <i className="bi bi-chat-left-text display-1 text-muted"></i>
                  <h5 className="mt-3 fw-bold text-muted">
                    아직 작성된 리뷰가 없습니다
                  </h5>
                  {user && (
                    <p className="text-muted">첫 번째 리뷰를 작성해보세요!</p>
                  )}
                </div>
              ) : (
                <div className="list-group list-group-flush">
                  {sortedReviews.map((review, index) => (
                    <div
                      key={review.id}
                      ref={(el) => (reviewRefs.current[review.id] = el)}
                      className={`list-group-item px-0 py-4 ${index < sortedReviews.length - 1 ? "border-bottom" : ""}`}
                    >
                      <div className="d-flex align-items-center mb-3 px-4">
                        <span className="text-warning fs-4 me-3">
                          {"★".repeat(review.rating)}
                          {"☆".repeat(5 - review.rating)}
                        </span>
                        <span className="fw-bold fs-5 text-dark">
                          {review.rating}.0 / 5.0
                        </span>
                      </div>

                      <ReviewCard
                        key={review.id}
                        review={review}
                        onUpdate={handleUpdate}
                        onDelete={handleDelete}
                        showOnlyImages={false}
                      />

                      <div className="d-flex align-items-center gap-3 mt-4 pt-3 border-top px-4">
                        <ReviewLikeContainer reviewId={review.id} />
                        <button
                          onClick={() => openReportModal(review)}
                          className="p-0 border-0 bg-transparent"
                          style={{ cursor: user ? "pointer" : "not-allowed" }}
                          disabled={!user}
                          title={user ? "리뷰 신고하기" : "로그인 후 이용 가능"}
                        >
                          🚨
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {reportModalOpen && (
        <ReportModal reviewId={reportingReviewId} onClose={closeReportModal} />
      )}
    </div>
  );
}
