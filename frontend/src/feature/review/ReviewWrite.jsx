// src/feature/review/ReviewWrite.jsx
import { useEffect, useState } from "react";
import { Button, Form, FormControl, FormGroup, FormLabel, Modal, Spinner } from "react-bootstrap";
import { toast } from "react-toastify";
import { TAG_WHITELIST, checkEligible, createReview } from "./reviewApi";

/**
 * 별점 선택 (1~5)
 */
function RatingSelect({ value, onChange }) {
  return (
    <Form.Select value={value} onChange={(e) => onChange(Number(e.target.value))}>
      {[5, 4, 3, 2, 1].map((n) => (
        <option key={n} value={n}>
          {n}
        </option>
      ))}
    </Form.Select>
  );
}

/**
 * 후기 작성 모달 (단독 사용 가능)
 * props:
 *  - show: boolean
 *  - onHide(): void
 *  - boardId: number (필수)
 *  - defaultRevieweeId?: number | string
 *  - onSuccess?(reviewResponse): void
 */
export function ReviewWriteModal({ show, onHide, boardId, defaultRevieweeId, onSuccess }) {
  const [revieweeId, setRevieweeId] = useState(defaultRevieweeId ?? "");
  const [rating, setRating] = useState(5);
  const [content, setContent] = useState("");
  const [tags, setTags] = useState([]);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (show) {
      setRevieweeId(defaultRevieweeId ?? "");
      setRating(5);
      setContent("");
      setTags([]);
    }
  }, [show, defaultRevieweeId]);

  const toggleTag = (t) => {
    setTags((prev) => (prev.includes(t) ? prev.filter((x) => x !== t) : [...prev, t]));
  };

  const handleSubmit = async () => {
    if (!boardId) return toast.error("boardId가 없습니다.");
    if (!revieweeId || Number.isNaN(Number(revieweeId))) return toast.error("대상 회원 ID를 입력하세요.");
    if (!rating || rating < 1 || rating > 5) return toast.error("평점은 1~5 사이여야 합니다.");
    if (!content?.trim()) return toast.error("후기 내용을 입력하세요.");

    setSubmitting(true);
    try {
      const res = await createReview({
        boardId: Number(boardId),
        revieweeId: Number(revieweeId),
        rating: Number(rating),
        content: content.trim(),
        tags,
      });
      toast.success("후기가 등록되었습니다.");
      onHide?.();
      onSuccess?.(res);
    } catch (err) {
      console.error(err);
      const msg =
        err?.response?.data?.message ||
        err?.response?.data?.error ||
        `후기 등록 실패 (HTTP ${err?.response?.status ?? "?"})`;
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal show={show} onHide={onHide} centered>
      <Modal.Header closeButton>
        <Modal.Title>후기 작성</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <FormGroup className="mb-3">
          <FormLabel>대상 회원 ID</FormLabel>
          <FormControl
            type="number"
            value={revieweeId}
            onChange={(e) => setRevieweeId(e.target.value)}
            placeholder="거래 상대 회원 ID"
          />
          <div className="form-text">
            구매자 작성 → 보통 판매자(게시글 작성자) ID / 판매자 작성 → 구매자 ID
          </div>
        </FormGroup>

        <FormGroup className="mb-3">
          <FormLabel>평점 (1~5)</FormLabel>
          <RatingSelect value={rating} onChange={setRating} />
        </FormGroup>

        <FormGroup className="mb-3">
          <FormLabel>내용</FormLabel>
          <FormControl
            as="textarea"
            rows={4}
            maxLength={2000}
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="거래 경험을 상세히 적어주세요."
          />
          <div className="form-text">{content.length}/2000</div>
        </FormGroup>

        <FormGroup>
          <FormLabel>태그 (선택)</FormLabel>
          <div className="d-flex flex-wrap gap-2">
            {TAG_WHITELIST.map((t) => (
              <Form.Check
                key={t}
                type="checkbox"
                id={`tag-${t}`}
                label={t}
                checked={tags.includes(t)}
                onChange={() => toggleTag(t)}
              />
            ))}
          </div>
        </FormGroup>
      </Modal.Body>
      <Modal.Footer>
        <Button variant="outline-secondary" onClick={onHide} disabled={submitting}>
          취소
        </Button>
        <Button variant="dark" onClick={handleSubmit} disabled={submitting}>
          {submitting ? (
            <>
              <Spinner size="sm" as="span" className="me-2" /> 등록 중...
            </>
          ) : (
            "등록"
          )}
        </Button>
      </Modal.Footer>
    </Modal>
  );
}

/**
 * 후기 작성 버튼 (eligible 체크 + 모달 오픈까지 한 번에)
 * props:
 *  - boardId: number (필수)
 *  - defaultRevieweeId?: number | string
 *  - size?: "sm" | "lg"
 *  - variant?: string (react-bootstrap Button variant)
 *  - className?: string
 *  - onSuccess?(reviewResponse): void
 *  - children?: 커스텀 버튼 텍스트 (기본: "후기 작성")
 */
export function ReviewWriteButton({
                                    boardId,
                                    defaultRevieweeId,
                                    size = "sm",
                                    variant = "dark",
                                    className,
                                    onSuccess,
                                    children,
                                  }) {
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);

  const handleClick = async () => {
    if (!boardId) {
      toast.error("boardId가 없습니다.");
      return;
    }
    setLoading(true);
    try {
      const ok = await checkEligible(boardId);
      if (!ok) {
        toast.info("이미 해당 거래글에 후기를 작성했습니다.");
        return;
      }
      setOpen(true);
    } catch (err) {
      console.error(err);
      const msg =
        err?.response?.data?.message ||
        err?.response?.data?.error ||
        `작성 가능 여부 확인 실패 (HTTP ${err?.response?.status ?? "?"})`;
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Button size={size} variant={variant} className={className} onClick={handleClick} disabled={loading}>
        {loading ? (
          <>
            <Spinner as="span" size="sm" className="me-2" /> 확인 중...
          </>
        ) : (
          children || "후기 작성"
        )}
      </Button>

      <ReviewWriteModal
        show={open}
        onHide={() => setOpen(false)}
        boardId={boardId}
        defaultRevieweeId={defaultRevieweeId}
        onSuccess={(res) => {
          setOpen(false);
          onSuccess?.(res);
        }}
      />
    </>
  );
}

export default ReviewWriteButton;
