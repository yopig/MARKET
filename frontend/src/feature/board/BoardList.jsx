// src/feature/board/BoardList.jsx
import {
  Alert,
  Button,
  Form,
  FormControl,
  Image,
  InputGroup,
  Pagination,
  Spinner,
  Row,
  Col,
} from "react-bootstrap";
import { useEffect, useMemo, useState } from "react";
import axios from "axios";
import { useNavigate, useSearchParams } from "react-router";
import { FaRegComments, FaBullhorn, FaMapMarkerAlt, FaEye } from "react-icons/fa";
import "../../styles/BoardList.css";

// ⬇️ 지역 데이터 분리 파일에서 import
import { SIDO_OPTIONS, getSigunguOptions } from "../board/regions";

// 페이지당 개수
const PAGE_SIZE = 18;

/** ====== 카테고리(상위만) ====== */
const CATEGORY_LIST = [
  "전체",
  "디지털/가전",
  "가구/인테리어",
  "유아동",
  "생활/가공식품",
  "스포츠/레저",
  "여성의류",
  "남성의류",
  "게임/취미",
  "반려동물용품",
  "기타",
];

export function BoardList() {
  const [boardList, setBoardList] = useState(null);
  const [errorMsg, setErrorMsg] = useState("");
  const [searchParams, setSearchParams] = useSearchParams();
  const [pageInfo, setPageInfo] = useState(null);
  const navigate = useNavigate();

  // URL → 로컬 상태
  const qsKeyword = searchParams.get("q") ?? "";
  const [keywords, setKeywords] = useState(qsKeyword);

  const qsCategory = searchParams.get("category") ?? "전체";
  const [category, setCategory] = useState(CATEGORY_LIST.includes(qsCategory) ? qsCategory : "전체");

  const qsTradeStatus = searchParams.get("tradeStatus") ?? "";
  const [tradeStatus, setTradeStatus] = useState(qsTradeStatus);

  const qsMinPrice = searchParams.get("minPrice") ?? "";
  const [minPrice, setMinPrice] = useState(qsMinPrice);

  const qsMaxPrice = searchParams.get("maxPrice") ?? "";
  const [maxPrice, setMaxPrice] = useState(qsMaxPrice);

  const qsRegionSido = searchParams.get("regionSido") ?? "";
  const [regionSido, setRegionSido] = useState(qsRegionSido);

  const qsRegionSigungu = searchParams.get("regionSigungu") ?? "";
  const [regionSigungu, setRegionSigungu] = useState(qsRegionSigungu);

  useEffect(() => {
    setKeywords(qsKeyword);
    setCategory(CATEGORY_LIST.includes(qsCategory) ? qsCategory : "전체");
    setTradeStatus(qsTradeStatus);
    setMinPrice(qsMinPrice);
    setMaxPrice(qsMaxPrice);
    setRegionSido(qsRegionSido);
    setRegionSigungu(qsRegionSigungu);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  // 목록 조회
  useEffect(() => {
    const page = searchParams.get("p") ?? "1";
    const params = {
      q: qsKeyword,
      p: page,
      size: PAGE_SIZE,
    };
    if (qsCategory && qsCategory !== "전체") params.category = qsCategory;
    if (qsTradeStatus) params.tradeStatus = qsTradeStatus;
    if (qsMinPrice) params.minPrice = qsMinPrice;
    if (qsMaxPrice) params.maxPrice = qsMaxPrice;
    if (qsRegionSido) params.regionSido = qsRegionSido;
    if (qsRegionSigungu) params.regionSigungu = qsRegionSigungu;

    axios
      .get("/api/board/list", { params })
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
            : "게시글을 불러오는 중 오류가 발생했습니다."
        );
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  // 유틸
  const defaultProfileImage = "/user.png";
  const defaultThumb = "/noimg.png";
  const formatPrice = (n) => (typeof n === "number" ? `${n.toLocaleString()}원` : "-");
  const renderRegion = (sido, sigungu) => {
    const txt = `${sido ?? ""} ${sigungu ?? ""}`.trim();
    return txt || "-";
  };

  // ✅ 공통 상태 배지 (BoardLayout과 통일)
  const statusBadge = (status) => {
    if (!status) return null;
    const cls =
      status === "SOLD_OUT" ? "sold" : status === "RESERVED" ? "reserved" : "onsale";
    const text =
      status === "ON_SALE" ? "판매중" : status === "RESERVED" ? "예약중" : "판매완료";
    return <span className={`jn-badge ${cls}`}>{text}</span>;
  };

  const pageNumbers = useMemo(() => {
    const arr = [];
    if (pageInfo) {
      for (let i = pageInfo.leftPageNumber; i <= pageInfo.rightPageNumber; i++) arr.push(i);
    }
    return arr;
  }, [pageInfo]);

  // 썸네일
  const imageRegex = /\.(jpe?g|png|gif|webp|avif)$/i;
  const pickFirstImage = (arr) =>
    Array.isArray(arr) ? arr.find((u) => typeof u === "string" && imageRegex.test(u)) || null : null;
  const getThumbUrl = (b) => {
    const fromBackend =
      b.thumbnailUrl || b.firstImageUrl || b.imageUrl || (Array.isArray(b.images) && pickFirstImage(b.images));
    if (fromBackend) return fromBackend;
    const fromFiles = pickFirstImage(b.files);
    return fromFiles || defaultThumb;
  };

  // 시/군/구 옵션
  const sigunguOptions = useMemo(() => getSigunguOptions(regionSido), [regionSido]);

  // 공통: URL 업데이트
  function updateSearchParams(patch) {
    const next = new URLSearchParams(searchParams);
    Object.entries(patch).forEach(([k, v]) => {
      if (v === null || v === undefined || v === "" || (k === "category" && v === "전체")) next.delete(k);
      else next.set(k, String(v));
    });
    setSearchParams(next);
  }

  // 필터 핸들러
  const handleCategoryClick = (cat) => {
    const next = cat === category ? "전체" : cat;
    setCategory(next);
    updateSearchParams({ category: next, p: 1 });
  };
  function handleTradeStatusChange(e) {
    const v = e.target.value;
    setTradeStatus(v);
    updateSearchParams({ tradeStatus: v || "", p: 1 });
  }
  function handleSidoChange(e) {
    const v = e.target.value;
    setRegionSido(v);
    setRegionSigungu("");
    updateSearchParams({ regionSido: v || "", regionSigungu: "", p: 1 });
  }
  function handleSigunguChange(e) {
    const v = e.target.value;
    setRegionSigungu(v);
    updateSearchParams({ regionSigungu: v || "", p: 1 });
  }
  function handleSearchSubmit(e) {
    e.preventDefault();
    updateSearchParams({
      q: keywords || "",
      category,
      tradeStatus: tradeStatus || "",
      minPrice: minPrice || "",
      maxPrice: maxPrice || "",
      regionSido: regionSido || "",
      regionSigungu: regionSigungu || "",
      p: 1,
      size: PAGE_SIZE,
    });
  }
  function handleResetAll() {
    setKeywords("");
    setCategory("전체");
    setTradeStatus("");
    setMinPrice("");
    setMaxPrice("");
    setRegionSido("");
    setRegionSigungu("");
    updateSearchParams({
      q: "",
      category: "전체",
      tradeStatus: "",
      minPrice: "",
      maxPrice: "",
      regionSido: "",
      regionSigungu: "",
      p: 1,
      size: PAGE_SIZE,
    });
  }

  const handleCardClick = (id) => navigate(`/board/${id}`);
  const handlePageNumberClick = (n) => updateSearchParams({ p: n, size: PAGE_SIZE });
  const handleNoticeAdd = () => navigate("/board/add");

  // 렌더링
  if (errorMsg) {
    return (
      <Alert variant="danger" className="my-4 container-narrow">
        <FaBullhorn className="me-2" />
        {errorMsg}
      </Alert>
    );
  }
  if (!boardList) {
    return (
      <div className="text-center py-5">
        <Spinner animation="border" />
        <div className="mt-2 text-muted">게시글을 불러오는 중...</div>
      </div>
    );
  }

  const displayedList = Array.isArray(boardList) ? boardList : [];
  // 백엔드가 size=18을 무시하더라도 프론트에서 18개로 강제
  const pageItems = displayedList.slice(0, PAGE_SIZE);

  return (
    <div className="board-list-container container-narrow">
      {/* 히어로 */}
      <div className="market-hero rounded-3 p-3 p-md-4 mb-3">
        <div className="d-flex flex-column flex-md-row align-items-start align-items-md-center gap-3">
          <div className="flex-grow-1">
            <h4 className="mb-1 fw-semibold">중고거래</h4>
            <div className="text-white-50 small">
              총 <b>{pageInfo?.totalElements ?? pageItems.length}</b>개
              {category && category !== "전체" ? <> · 카테고리: <b>{category}</b></> : null}
              {qsKeyword ? <> · 검색: <b>“{qsKeyword}”</b></> : null}
            </div>
          </div>
          <div className="d-flex gap-2 ms-md-auto">
            <Button
              variant="warning"
              size="lg"
              className="sell-button-lg"
              onClick={handleNoticeAdd}
            >
              판매 등록
            </Button>
          </div>
        </div>

        {/* 검색 + 필터 */}
        <Form onSubmit={handleSearchSubmit} className="quick-search mt-3">
          <InputGroup className="mb-2">
            <FormControl
              placeholder="찾는 상품을 검색해보세요"
              value={keywords}
              onChange={(e) => setKeywords(e.target.value)}
            />
          </InputGroup>

          <Row className="g-2">
            <Col xs={6} md={2}>
              <Form.Select size="sm" value={tradeStatus} onChange={handleTradeStatusChange}>
                <option value="">상태(전체)</option>
                <option value="ON_SALE">판매중</option>
                <option value="SOLD_OUT">판매완료</option>
              </Form.Select>
            </Col>
            <Col xs={6} md={2}>
              <Form.Select size="sm" value={regionSido} onChange={handleSidoChange}>
                <option value="">시/도(전체)</option>
                {SIDO_OPTIONS.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </Form.Select>
            </Col>
            <Col xs={6} md={2}>
              <Form.Select
                size="sm"
                value={regionSigungu}
                onChange={handleSigunguChange}
                disabled={!regionSido}
              >
                <option value="">{regionSido ? "시/군/구(전체)" : "시/도를 먼저 선택"}</option>
                {sigunguOptions.map((g) => (
                  <option key={g} value={g}>{g}</option>
                ))}
              </Form.Select>
            </Col>
            <Col xs={6} md={2}>
              <InputGroup size="sm">
                <FormControl
                  type="number"
                  min="0"
                  placeholder="최소가격"
                  value={minPrice}
                  onChange={(e) => setMinPrice(e.target.value)}
                />
                <InputGroup.Text>원</InputGroup.Text>
              </InputGroup>
            </Col>
            <Col xs={6} md={2}>
              <InputGroup size="sm">
                <FormControl
                  type="number"
                  min="0"
                  placeholder="최대가격"
                  value={maxPrice}
                  onChange={(e) => setMaxPrice(e.target.value)}
                />
                <InputGroup.Text>원</InputGroup.Text>
              </InputGroup>
            </Col>
            <Col xs={12} md="auto">
              <div className="d-flex gap-2 h-100">
                <Button type="submit" size="sm" variant="dark">검색</Button>
                <Button type="button" size="sm" variant="outline-light" onClick={handleResetAll}>
                  초기화
                </Button>
              </div>
            </Col>
          </Row>
        </Form>
      </div>

      {/* 카테고리 바 */}
      <div className="category-bar shadow-sm bg-white rounded-3 px-2 py-2 mb-2">
        <div className="category-scroll jn-cats">
          {CATEGORY_LIST.map((cat) => {
            const active = cat === category;
            return (
              <button
                key={cat}
                type="button"
                aria-pressed={active}
                className={`jn-chip ${active ? "active" : ""}`}
                onClick={() => handleCategoryClick(cat)}
              >
                {cat}
              </button>
            );
          })}
        </div>
      </div>

      {/* 카드 그리드 */}
      {pageItems.length === 0 ? (
        <div className="text-center py-5 border rounded-3">
          <FaBullhorn className="text-muted mb-3" size={48} />
          <h5 className="text-muted">조건에 맞는 게시글이 없습니다.</h5>
          <p className="text-muted mb-0">필터를 조정해보세요.</p>
        </div>
      ) : (
        <Row className="g-2 mt-0 card-grid">
          {pageItems.map((b) => (
            <Col key={b.id} xs={6} md={3} lg={2} xl={2}>
              <article className="item-card" role="button" onClick={() => handleCardClick(b.id)}>
                <div className="thumb-wrap">
                  <div className="thumb-box rounded-3 overflow-hidden">
                    <img
                      src={getThumbUrl(b)}
                      alt={b.title}
                      className="thumb-img"
                      loading="lazy"
                      onError={(e) => (e.currentTarget.src = defaultThumb)}
                    />
                  </div>

                  {/* ✅ 통일된 상태 배지 */}
                  <div className="pos-tl">{statusBadge(b.tradeStatus)}</div>

                  {b.countComment > 0 && (
                    <div className="pos-br badge bg-dark bg-opacity-75 d-flex align-items-center gap-1">
                      <FaRegComments size={12} />
                      <small>{b.countComment}</small>
                    </div>
                  )}
                </div>

                <div className="meta-wrap">
                  <div className="title two-line">{b.title}</div>
                  <div className="price fw-bold">{formatPrice(b.price)}</div>

                  <div className="d-flex justify-content-between align-items-center mt-1 text-muted xsmall">
                    <div className="d-flex align-items-center gap-1">
                      <FaMapMarkerAlt />
                      <span>{renderRegion(b.regionSido, b.regionSigungu)}</span>
                    </div>
                    <div className="d-flex align-items-center gap-1">
                      <FaEye />
                      <span>{b.viewCount ?? "-"}</span>
                    </div>
                  </div>

                  <div className="d-flex align-items-center gap-2 mt-2">
                    <Image
                      roundedCircle
                      src={b.profileImageUrl || defaultProfileImage}
                      alt={`${b.nickName ?? "익명"} 프로필`}
                      style={{ width: 18, height: 18 }}
                      onError={(e) => (e.currentTarget.src = defaultProfileImage)}
                    />
                    <small className="text-muted">{b.nickName}</small>
                    {b.timesAgo && <small className="text-muted ms-auto">{b.timesAgo}</small>}
                  </div>
                </div>
              </article>
            </Col>
          ))}
        </Row>
      )}

      {/* 페이지네이션 */}
      {pageInfo && (
        <div className="p-3 d-flex justify-content-center">
          <Pagination size="sm" className="mb-0">
            <Pagination.First
              onClick={() => handlePageNumberClick(1)}
              disabled={pageInfo.currentPageNumber === 1}
            />
            <Pagination.Prev
              onClick={() => handlePageNumberClick(pageInfo.currentPageNumber - 1)}
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
              onClick={() => handlePageNumberClick(pageInfo.currentPageNumber + 1)}
              disabled={pageInfo.currentPageNumber === pageInfo.totalPages}
            />
            <Pagination.Last
              onClick={() => handlePageNumberClick(pageInfo.totalPages)}
              disabled={pageInfo.currentPageNumber === pageInfo.totalPages}
            />
          </Pagination>
        </div>
      )}
    </div>
  );
}
