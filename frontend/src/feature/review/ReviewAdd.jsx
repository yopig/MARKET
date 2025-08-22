import React, { useContext, useEffect, useState, useCallback } from "react";
import { AuthenticationContext } from "../../common/AuthenticationContextProvider.jsx";
import { FaSave, FaTimes, FaTrashAlt } from "react-icons/fa";
import { toast } from "react-toastify";
import axios from "axios";
import Select from "react-select/creatable";
import {
  Button,
  Card,
  FormControl,
  FormGroup,
  ListGroup,
  Spinner,
  Form,
} from "react-bootstrap";

export function ReviewAdd({ facility, onSave, onCancel }) {
  const { user } = useContext(AuthenticationContext);

  const [content, setContent] = useState("");
  const [rating, setRating] = useState(5);
  const [files, setFiles] = useState([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [tagOptions, setTagOptions] = useState([]);
  const [selectedTags, setSelectedTags] = useState([]);

  const [inputValue, setInputValue] = useState("");

  // 서버에서 태그 검색
  const fetchTagOptions = useCallback(async (searchTerm) => {
    try {
      const res = await axios.get("/api/tags", {
        params: { q: searchTerm },
      });
      const options = res.data.map((tag) => {
        const cleanName = tag.name.replace(/#/g, ""); // 모든 # 제거
        return {
          value: cleanName,
          label: cleanName,
        };
      });
      setTagOptions(options);
    } catch (error) {
      console.error("태그 검색 실패:", error);
      toast.error("태그 검색 중 오류가 발생했습니다.");
    }
  }, []);

  // inputValue 변경될 때 서버 검색 실행 (300ms 디바운스)
  useEffect(() => {
    if (inputValue.trim() === "") {
      fetchTagOptions("");
      return;
    }
    const delayDebounce = setTimeout(() => {
      fetchTagOptions(inputValue);
    }, 300);

    return () => clearTimeout(delayDebounce);
  }, [inputValue, fetchTagOptions]);

  // 메모리 누수 방지를 위한 cleanup
  useEffect(() => {
    return () => {
      files.forEach((fileObj) => {
        if (fileObj.previewUrl) {
          URL.revokeObjectURL(fileObj.previewUrl);
        }
      });
    };
  }, [files]);

  const handleFileChange = useCallback((e) => {
    const selectedFiles = Array.from(e.target.files);

    const validFiles = selectedFiles.filter((file) => {
      const isValidType = file.type.startsWith("image/");
      const isValidSize = file.size <= 10 * 1024 * 1024;

      if (!isValidType) {
        toast.warning(`${file.name}은(는) 지원하지 않는 파일 형식입니다.`);
        return false;
      }
      if (!isValidSize) {
        toast.warning(`${file.name}은(는) 파일 크기가 10MB를 초과합니다.`);
        return false;
      }
      return true;
    });

    const newFiles = validFiles.map((file) => ({
      file,
      previewUrl: file.type.startsWith("image/")
        ? URL.createObjectURL(file)
        : null,
    }));

    setFiles((prev) => [...prev, ...newFiles]);
    e.target.value = null;
  }, []);

  const handleFileRemove = useCallback((idx) => {
    setFiles((prevFiles) => {
      const fileToRemove = prevFiles[idx];
      if (fileToRemove?.previewUrl) {
        URL.revokeObjectURL(fileToRemove.previewUrl);
      }
      return prevFiles.filter((_, i) => i !== idx);
    });
  }, []);

  const isValid = content.trim() !== "";

  // 새 태그 생성 함수: 특수기호, 띄어쓰기 금지
  const handleCreateTag = (tagValue) => {
    const validTagRegex = /^[a-zA-Z0-9가-힣_]+$/;

    if (!validTagRegex.test(tagValue)) {
      toast.warning("태그는 띄어쓰기 및 특수문자를 포함할 수 없습니다.");
      return;
    }

    if (selectedTags.find((tag) => tag.value === tagValue)) {
      toast.warning("이미 존재하는 태그입니다.");
      return;
    }

    if (selectedTags.length >= 6) {
      toast.warning("태그는 최대 6개까지만 선택할 수 있습니다.");
      return;
    }

    const newTag = { value: tagValue, label: tagValue };
    setSelectedTags((prev) => [...prev, newTag]);
  };

  // 태그 선택 시 # 제거 후 저장, 6개 초과 방지
  const handleTagChange = (newValue) => {
    if (newValue && newValue.length > 6) {
      toast.warning("태그는 최대 6개까지만 선택할 수 있습니다.");
      return;
    }
    const cleaned = (newValue || []).map((tag) => ({
      ...tag,
      value: tag.value.replace(/#/g, ""),
      label: tag.label.replace(/#/g, ""),
    }));
    setSelectedTags(cleaned);
  };

  // 띄어쓰기 입력 시 태그 생성 처리
  const handleInputKeyDown = (e) => {
    if (e.key === " " || e.key === "Spacebar") {
      e.preventDefault(); // 띄어쓰기 기본 동작 막기
      const val = inputValue.trim();

      if (val) {
        handleCreateTag(val);
        setInputValue("");
      }
    }
  };

  const handleSave = async () => {
    if (!isValid) {
      toast.warning("내용을 입력하세요.");
      return;
    }

    setIsProcessing(true);

    try {
      const formData = new FormData();
      if (facility?.id) formData.append("facilityId", facility.id.toString());
      formData.append("memberEmail", user.email);
      formData.append("review", content.trim());
      formData.append("rating", rating.toString());

      files.forEach((fileObj) => {
        formData.append("files", fileObj.file);
      });

      selectedTags.forEach((tag) => {
        formData.append("tagNames", tag.value);
      });

      const response = await axios.post("/api/review/add", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });
      // 새로 생성된 리뷰 ID를 가져옴
      const reviewId = response.data.id;

      toast.success("리뷰가 저장되었습니다.");

      setContent("");
      setRating(5);
      setFiles([]);
      setSelectedTags([]);

      // 새로 생성된 reivewId 인자로 전달
      onSave?.(reviewId);
    } catch (error) {
      console.error("리뷰 저장 실패:", error);
      const errorMessage =
        error.response?.data?.message || "리뷰 저장에 실패했습니다.";
      toast.error(errorMessage);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleCancel = () => {
    if (content.trim() || files.length > 0 || selectedTags.length > 0) {
      if (
        window.confirm("작성 중인 내용이 있습니다. 정말로 취소하시겠습니까?")
      ) {
        files.forEach((fileObj) => {
          if (fileObj.previewUrl) {
            URL.revokeObjectURL(fileObj.previewUrl);
          }
        });

        setContent("");
        setRating(5);
        setFiles([]);
        setSelectedTags([]);

        onCancel?.();
      }
    } else {
      onCancel?.();
    }
  };

  return (
    <div>
      {/* 태그 선택 */}
      <FormGroup className="mb-3">
        <Form.Label>태그</Form.Label>
        <Select
          isMulti
          isClearable
          options={tagOptions}
          value={selectedTags}
          onChange={handleTagChange}
          inputValue={inputValue}
          onInputChange={setInputValue}
          onCreateOption={handleCreateTag}
          onKeyDown={handleInputKeyDown}
          placeholder="태그를 입력하거나 선택하세요..."
          formatCreateLabel={(inputValue) => `"${inputValue}" 태그 추가`}
          noOptionsMessage={() => "태그가 없습니다"}
          isDisabled={isProcessing}
          className="react-select-container"
          classNamePrefix="react-select"
          formatOptionLabel={(option) => (
            <span>
              {option.label.startsWith("#") ? option.label : `#${option.label}`}
            </span>
          )}
          components={{
            MultiValueLabel: ({ data }) => (
              <span>
                {data.label.startsWith("#") ? data.label : `#${data.label}`}
              </span>
            ),
          }}
        />
      </FormGroup>

      {/* 내용 */}
      <FormGroup className="mb-3">
        <Form.Label>내용 *</Form.Label>
        <FormControl
          as="textarea"
          rows={4}
          placeholder="리뷰 내용을 입력하세요 (필수)"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          disabled={isProcessing}
          maxLength={1000}
        />
        <Form.Text className="text-muted">{content.length}/1000자</Form.Text>
      </FormGroup>

      {/* 별점 */}
      <FormGroup className="mb-3">
        <Form.Label>별점</Form.Label>
        <div className="d-flex align-items-center">
          {[1, 2, 3, 4, 5].map((star) => (
            <span
              key={star}
              style={{
                fontSize: "1.8rem",
                color: star <= rating ? "#ffc107" : "#e4e5e9",
                cursor: isProcessing ? "default" : "pointer",
                marginRight: "4px",
              }}
              onClick={() => !isProcessing && setRating(star)}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if ((e.key === "Enter" || e.key === " ") && !isProcessing) {
                  setRating(star);
                }
              }}
            >
              ★
            </span>
          ))}
          <span className="ms-2 text-muted">({rating}점)</span>
        </div>
      </FormGroup>

      {/* 파일 첨부 목록 */}
      {files.length > 0 && (
        <FormGroup className="mb-3">
          <Form.Label>첨부 파일</Form.Label>
          <div className="d-flex flex-wrap gap-2">
            {files.map((fileObj, idx) => (
              <div key={idx} className="position-relative">
                <img
                  src={fileObj.previewUrl}
                  alt="미리보기"
                  style={{
                    width: 100,
                    height: 100,
                    objectFit: "cover",
                    borderRadius: "0",
                  }}
                />
                {/* 오버레이 X 버튼 */}
                <Button
                  variant="danger"
                  className="position-absolute top-0 end-0 p-1"
                  style={{
                    borderRadius: "0",
                    lineHeight: 1,
                  }}
                  onClick={() => handleFileRemove(idx)}
                  disabled={isProcessing}
                  aria-label={`${fileObj.file.name} 삭제`}
                >
                  &times; {/* X 아이콘 */}
                </Button>
              </div>
            ))}
          </div>
        </FormGroup>
      )}

      {/* 파일 첨부 입력 */}
      <FormGroup className="mb-3">
        <Form.Label>파일 첨부</Form.Label>
        <FormControl
          type="file"
          multiple
          accept="image/*,.pdf"
          onChange={handleFileChange}
          disabled={isProcessing}
        />
        <Form.Text className="text-muted">
          이미지 파일만 업로드 가능 (최대 10MB)
        </Form.Text>
      </FormGroup>

      {/* 작성자 정보 */}
      <div className="text-muted mb-3">
        작성자: <strong>{user.nickName}</strong>
      </div>

      {/* 버튼 */}
      <div className="d-flex justify-content-end gap-2">
        <Button
          variant="outline-secondary"
          onClick={handleCancel}
          disabled={isProcessing}
        >
          <FaTimes /> 취소
        </Button>
        <Button
          variant="primary"
          disabled={!isValid || isProcessing}
          onClick={handleSave}
        >
          {isProcessing && (
            <Spinner animation="border" size="sm" className="me-2" />
          )}
          <FaSave /> 저장
        </Button>
      </div>
    </div>
  );
}

export default ReviewAdd;
