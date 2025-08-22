import axios from "axios";
import { Badge, Carousel, Col, Image, Row, Spinner } from "react-bootstrap";
import { ReviewLikeContainer } from "../like/ReviewLikeContainer.jsx";
import { FavoriteContainer } from "../kakaoMap/FavoriteContainer.jsx";
import React, { useContext, useEffect, useRef, useState } from "react";
import { useParams, useSearchParams } from "react-router";
import { ReviewText } from "../../common/ReviewText.jsx";
import { FaChevronRight } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import "bootstrap/dist/css/bootstrap.min.css";
import "../../styles/MyReview.css";
import { AuthenticationContext } from "../../common/AuthenticationContextProvider.jsx";

export function MyReview({ memberId: memberIdFromProp }) {
  const { user, isLoading } = useContext(AuthenticationContext);
  const [reviews, setReviews] = useState(null);
  const [favoriteMap, setFavoriteMap] = useState({});
  const navigate = useNavigate();
  const { memberId: memberIdFromUrl } = useParams();
  const [searchParams] = useSearchParams(); // setSearchParams는 안 쓸 수도??
  const memberId = memberIdFromProp || memberIdFromUrl;
  const reviewRefs = useRef({});

  // 그러니까 res.data가 여러개를 받을텐데,
  // 하나 받을 때마다 isFavorite인지 그것도 요청을 해야함.
  // 즉 전에는 각 시설명에 대한 로그인유저의 즐찾 유무를 가져오지 못했기 때문에 안 나오는 게 당연했다!!
  useEffect(() => {
    // 1. 리뷰 목록을 가져오는 비동기 함수
    const fetchReviews = axios.get(`/api/review/myReview/${memberId}`);

    // 2. 로그인 유저가 즐겨찾기한 시설 목록을 가져오는 비동기 함수
    // user가 존재할 때만 실행
    const fetchFavorites = user
      ? axios.get(`/api/favorite/mine`) // 즐겨찾기 목록을 가져오는 새로운 API 엔드포인트가 필요합니다.
      : Promise.resolve({ data: [] }); // user가 없으면 빈 배열로 처리

    Promise.all([fetchReviews, fetchFavorites])
      .then(([reviewsResponse, favoritesResponse]) => {
        const reviewData = reviewsResponse.data || [];
        setReviews(reviewData);

        // 즐겨찾기 목록 데이터를 Map 형태로 변환 (더 빠른 조회를 위해)
        const favoriteFacilityIds = new Set(
          favoritesResponse.data?.map((fav) => fav.facilityId),
        );

        // 초기 favoriteMap 생성
        const map = {};
        reviewData.forEach((r) => {
          if (r.petFacility?.id != null) {
            // 이 시설 ID가 로그인 유저의 즐겨찾기 목록에 포함되어 있는지 확인
            // 그렇게 해서 모은 isFavorite의 집합이 favoriteMap이 되는거고,
            // 얘를 각 리뷰에서 순서에 맞게 보내기 때문에 !! 잘 보이는 것임 이제 하하
            map[r.petFacility.id] = favoriteFacilityIds.has(r.petFacility.id);
          }
        });
        setFavoriteMap(map);

        // console.log("리뷰 데이터:", reviewData);
        // console.log("즐겨찾기 상태 맵:", map); // 이게 4개가 나왔던 이유는
        // 지금 리뷰 목록에서 중복 제외하고, 시설명들의 id를 가져온건데,
        // 거기서 true이면 즐찾이 되어있다!! 이 말
      })
      .catch((err) => {
        console.error("데이터 불러오기 실패", err);
        setReviews([]);
        setFavoriteMap({});
      });
  }, [memberId, user]); // user가 변경될 때도 다시 실행하도록 추가

  // 포커스 맞추는 useEffect
  useEffect(() => {
    const focusReviewId = searchParams.get("focusReviewId");
    if (focusReviewId && reviews?.length > 0) {
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

  const isImageFile = (url) =>
    /\.(jpg|jpeg|png|gif|webp)$/i.test(url?.split("?")[0]);

  if (!reviews) {
    return (
      <div className="text-center mt-5">
        <Spinner animation="border" />
      </div>
    );
  }

  if (reviews.length === 0) {
    return (
      <div className="text-center mt-5 text-muted">작성한 리뷰가 없습니다.</div>
    );
  }

  const userNickName = reviews[0].memberEmailNickName ?? "알 수 없음";
  const userProfileImage = reviews[0].profileImageUrl || "/user.png";
  const userCountMemberReview = reviews[0].countMemberReview;
  const userMemberAverageRating = reviews[0].memberAverageRating;

  // const toggleFavorite = (facilityId, newState) => {
  //   setFavoriteMap((prev) => ({
  //     ...prev,
  //     [facilityId]: newState,
  //   }));
  // };

  const toggleFavorite = (facilityId, newState) => {
    // API 호출을 통해 서버에 즐겨찾기 상태 변경을 요청
    axios
      .put("/api/favorite", {
        // 찜 추가/취소 요청
        facilityId,
        isFavorite: newState,
      })
      .then(() => {
        // 서버 요청 성공 시, 상태 업데이트
        setFavoriteMap((prev) => ({
          ...prev,
          [facilityId]: newState,
        }));
      })
      .catch((err) => {
        console.error("즐겨찾기 상태 변경 실패", err);
        alert("즐겨찾기 상태 변경에 실패했습니다.");
      });
  };

  // isLoading 상태를 통해 로딩 중일 때 스피너를 보여줌
  if (isLoading) {
    return (
      <div className="text-center mt-5">
        <Spinner animation="border" />
      </div>
    );
  }

  return (
    <>
      <Row className="justify-content-center mt-5">
        <Col xs={10} md={10} lg={10}>
          <div className="d-flex flex-row align-items-start mb-2">
            <Image
              className="me-3"
              src={userProfileImage}
              alt={`${userNickName} 프로필`}
              style={{
                width: "75px",
                height: "75px",
                objectFit: "cover",
              }}
            />
            <div className="d-flex flex-column align-items-start">
              <h3 className="fw-bold mb-1">{userNickName}</h3>
              <span>
                리뷰 <strong>{userCountMemberReview}</strong> 평균 평점{" "}
                <strong>{userMemberAverageRating}</strong>
              </span>
            </div>
          </div>

          <hr className="hr-color-hotpink review-separator" />

          {reviews.map((r) => {
            const reviewImages = r.files?.filter(isImageFile) || [];

            return (
              <div
                key={r.id}
                className="mb-3 review-card-custom"
                ref={(el) => (reviewRefs.current[r.id] = el)}
              >
                <div className="card-body p-4">
                  <div className={reviewImages.length > 0 ? "mb-3" : ""}>
                    {reviewImages.length > 0 && (
                      <div style={{ maxWidth: "400px", margin: "0 auto" }}>
                        {reviewImages.length === 1 ? (
                          <img
                            src={reviewImages[0]}
                            alt="리뷰 이미지"
                            className="d-block w-100 rounded"
                            style={{ height: "400px", objectFit: "cover" }}
                          />
                        ) : (
                          <Carousel interval={null} indicators={false}>
                            {reviewImages.map((image, i) => (
                              <Carousel.Item key={i}>
                                <img
                                  src={image}
                                  alt={`리뷰 이미지 ${i + 1}`}
                                  className="d-block w-100"
                                  style={{
                                    height: "400px",
                                    objectFit: "cover",
                                  }}
                                />
                                <div className="carousel-counter">
                                  {i + 1} / {reviewImages.length}
                                </div>
                              </Carousel.Item>
                            ))}
                          </Carousel>
                        )}
                      </div>
                    )}
                  </div>

                  <div className="p-1">
                    <div className="d-flex align-items-center justify-content-between">
                      <div
                        className="fw-semibold d-flex align-items-center facility-link mb-2"
                        style={{ cursor: "pointer" }}
                        onClick={() =>
                          navigate(`/facility/${r.petFacility.id}`)
                        }
                      >
                        {r.petFacility.name}
                        <FaChevronRight className="ms-1" size={13} />
                      </div>
                      <div className="small d-flex align-items-center">
                        {r.petFacility?.id != null && (
                          <FavoriteContainer
                            facilityName={r.petFacility.name}
                            facilityId={r.petFacility.id}
                            isFavorite={favoriteMap[r.petFacility.id] ?? false}
                            onToggle={(newState) =>
                              toggleFavorite(r.petFacility.id, newState)
                            }
                          />
                        )}
                      </div>
                    </div>
                    <div style={{ color: "#888", fontSize: "0.85rem" }}>
                      {r.petFacility.sidoName} {r.petFacility.sigunguName}
                    </div>
                    <hr className="my-2 hr-color-hotpink" />

                    <div
                      className="text-muted mb-1"
                      style={{ whiteSpace: "pre-wrap" }}
                    >
                      <ReviewText text={r.review} />
                    </div>

                    {Array.isArray(r.tags) && r.tags.length > 0 && (
                      <div className="d-flex flex-wrap gap-2 mb-2">
                        {r.tags.map((tag) => (
                          <Badge
                            key={tag.id}
                            bg="light"
                            text="dark"
                            className="fw-normal border"
                            style={{
                              borderRadius: "0",
                            }}
                          >
                            # {tag.name}
                          </Badge>
                        ))}
                      </div>
                    )}

                    <div className="text-muted" style={{ fontSize: "0.85rem" }}>
                      {r.insertedAt?.split("T")[0]}
                    </div>

                    <ReviewLikeContainer reviewId={r.id} />
                  </div>
                </div>
              </div>
            );
          })}
        </Col>
      </Row>
    </>
  );
}
