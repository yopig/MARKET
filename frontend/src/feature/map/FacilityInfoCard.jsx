import React from "react";

const FacilityInfoCard = ({ facility, loading }) => {
  if (loading) {
    return (
      <div className="text-center py-5">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
        <p className="mt-3 text-muted">시설 정보를 불러오는 중...</p>
      </div>
    );
  }

  if (!facility) {
    return (
      <div className="alert alert-danger" role="alert">
        <i className="bi bi-exclamation-triangle-fill me-2"></i>
        시설 정보를 찾을 수 없습니다.
      </div>
    );
  }

  const InfoItem = ({
    icon,
    iconColor,
    label,
    value,
    isLink = false,
    linkType = "url",
  }) => {
    if (
      !value ||
      value.trim() === "" ||
      value.toLowerCase() === "정보없음" ||
      value.toLowerCase() === "none" ||
      value.toLowerCase() === "null"
    ) {
      return null;
    }

    // 홈페이지가 여러개일 경우 쉼표(,)로 분리해서 배열로 만듦
    const urls =
      linkType === "url" && value.includes(",")
        ? value
            .split(",")
            .map((v) => v.trim())
            .filter((v) => v !== "")
        : [value];

    const renderValue = () => {
      if (!isLink) return <span className="fw-semibold">{value}</span>;

      if (linkType === "tel") {
        return (
          <a
            href={`tel:${value}`}
            className="text-decoration-none fw-semibold link-success"
          >
            {value}
          </a>
        );
      }

      if (linkType === "url") {
        return (
          <div>
            {urls.map((url, index) => {
              // http:// 혹은 https:// 없으면 자동 추가
              const href =
                url.startsWith("http://") || url.startsWith("https://")
                  ? url
                  : "http://" + url;
              return (
                <div key={index} className="mb-1">
                  <a
                    href={href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-decoration-none fw-semibold link-primary"
                  >
                    {url}
                  </a>
                </div>
              );
            })}
          </div>
        );
      }

      return <span className="fw-semibold">{value}</span>;
    };

    return (
      <div className="row mb-3">
        <div className="col-1">
          <div className="d-flex justify-content-center">
            <i className={`bi ${icon} ${iconColor} fs-5`}></i>
          </div>
        </div>
        <div className="col-11">
          <small className="text-muted text-uppercase fw-bold d-block mb-1">
            {label}
          </small>
          {renderValue()}
        </div>
      </div>
    );
  };

  const CategoryBadges = ({ category2, category3 }) => {
    if (!category2 && !category3) return null;

    return (
      <div className="row mb-3">
        <div className="col-1">
          <div className="d-flex justify-content-center">
            <i className="bi bi-tags-fill text-info fs-5"></i>
          </div>
        </div>
        <div className="col-11">
          <small className="text-muted text-uppercase fw-bold d-block mb-2">
            카테고리
          </small>
          <div className="d-flex flex-wrap gap-2">
            {category2 && (
              <span className="badge bg-primary rounded-pill px-3 py-2">
                {category2}
              </span>
            )}
            {category3 && (
              <span className="badge bg-secondary rounded-pill px-3 py-2">
                {category3}
              </span>
            )}
          </div>
        </div>
      </div>
    );
  };

  const ParkingStatus = ({ parkingAvailable }) => {
    if (!parkingAvailable) return null;

    const isAvailable = parkingAvailable === "Y";

    return (
      <div className="row mb-3">
        <div className="col-1">
          <div className="d-flex justify-content-center">
            <i
              className={`bi ${
                isAvailable
                  ? "bi-car-front-fill text-success"
                  : "bi-car-front text-muted"
              } fs-5`}
            ></i>
          </div>
        </div>
        <div className="col-11">
          <small className="text-muted text-uppercase fw-bold d-block mb-2">
            주차 가능 여부
          </small>
          <span
            className={`badge ${
              isAvailable ? "bg-success" : "bg-secondary"
            } rounded-0 px-3 py-2`}
            style={{
              border: "solid 1px black",
              boxShadow: "3px 3px 0px 0px #212529",
            }}
          >
            {isAvailable ? "🅿️ 주차 가능" : "🚫 주차 불가"}
          </span>
        </div>
      </div>
    );
  };

  return (
    <div className="card border-0 h-100">
      <div className="card-header bg-primary">
        <div className="d-flex align-items-center">
          <i className="bi bi-info-circle-fill me-3 fs-4"></i>
          <div>
            <h5 className="card-title mb-0">시설 정보</h5>
            <small className="opacity-75">Facility Information</small>
          </div>
        </div>
      </div>

      <div className="card-body p-4">
        <InfoItem
          icon="bi-telephone-fill"
          iconColor="text-success"
          label="전화번호"
          value={facility.phoneNumber}
          isLink={true}
          linkType="tel"
        />

        <InfoItem
          icon="bi-globe"
          iconColor="text-info"
          label="홈페이지"
          value={facility.homepage}
          isLink={true}
          linkType="url"
        />

        <InfoItem
          icon="bi-calendar-x-fill"
          iconColor="text-warning"
          label="휴무일"
          value={facility.holiday}
        />

        <InfoItem
          icon="bi-clock-fill"
          iconColor="text-primary"
          label="운영시간"
          value={facility.operatingHours}
        />

        <InfoItem
          icon="bi-heart-fill"
          iconColor="text-success"
          label="입장 가능 반려동물"
          value={facility.allowedPetSize}
        />

        <InfoItem
          icon="bi-exclamation-triangle-fill"
          iconColor="text-warning"
          label="반려동물 제한사항"
          value={facility.petRestrictions}
        />

        <ParkingStatus parkingAvailable={facility.parkingAvailable} />

        <CategoryBadges
          category2={facility.category2}
          category3={facility.category3}
        />
      </div>
    </div>
  );
};

export default FacilityInfoCard;
