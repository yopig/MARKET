import { Button, Form, FormText, Spinner } from "react-bootstrap";
import { useRef, useState } from "react";
import axios from "axios";
import { toast } from "react-toastify";
import { useNavigate } from "react-router";
import { FaCheckCircle, FaPaw, FaPlus } from "react-icons/fa";
import "../../styles/MemberAdd.css";

export function MemberAdd() {
  // 입력값 상태 정의
  const [files, setFiles] = useState([]);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [password2, setPassword2] = useState("");
  const [nickName, setNickName] = useState("");
  const [info, setInfo] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const navigate = useNavigate();

  // 숨겨진 파일 인풋을 참조하기 위한 useRef
  const fileInputRef = useRef(null);

  // 정규식 (백엔드와 동일한 조건)
  const emailRegex = /^[\w.-]+@[\w.-]+\.[a-zA-Z]{2,}$/;
  const passwordRegex =
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+=-]).{8,}$/;
  const nickRegex = /^[가-힣a-zA-Z0-9]{2,20}$/;

  // 유효성 검사 결과
  const isEmailValid = emailRegex.test(email);
  const isPasswordValid = passwordRegex.test(password);
  const isNickNameValid = nickRegex.test(nickName);
  const isPasswordMatch = password === password2;

  // 버튼 비활성화 조건
  const disabled = !(
    isEmailValid &&
    isPasswordValid &&
    isNickNameValid &&
    isPasswordMatch &&
    !isProcessing
  );

  // 파일 첨부 시 처리하는 함수 (프로필 사진은 하나만)
  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      setFiles([
        {
          file: selectedFile,
          previewUrl: URL.createObjectURL(selectedFile),
        },
      ]);
    } else {
      setFiles([]);
    }
  };

  // 프로필 이미지 클릭 시 숨겨진 파일 인풋 클릭
  const handleProfileClick = () => {
    fileInputRef.current.click();
  };

  function handleSaveClick() {
    setIsProcessing(true);

    const formData = new FormData();
    formData.append("email", email);
    formData.append("password", password);
    formData.append("nickName", nickName);
    formData.append("info", info);

    if (files.length > 0) {
      formData.append("files", files[0].file);
    }

    axios
      .post("/api/member/add", formData, {
        headers: { "Content-type": "multipart/form-data" },
      })
      .then((res) => {
        const message = res.data.message;
        if (message) {
          toast(message.text, { type: message.type });
        }
        navigate("/");
      })
      .catch((err) => {
        const message = err.response.data.message;
        if (message) {
          toast(message.text, { type: message.type });
        }
      })
      .finally(() => {
        setIsProcessing(false);
      });
  }

  // 현재 선택된 프로필 이미지의 미리보기 URL
  const currentProfilePreview = files.length > 0 ? files[0].previewUrl : null;

  return (
    <div className="signup-page-wrapper">
      <div className="signup-container-v2">
        {/* 2단 레이아웃 그리드 */}
        <div className="signup-grid">
          {/* 왼쪽: 환영 패널 */}
          <div className="signup-welcome-panel">
            <div className="welcome-content">
              <h1 className="welcome-logo">🐾 PETOPIA</h1>
              <h2>
                펫토피아의
                <br />
                가족이 되세요!
              </h2>
              <p>
                반려동물과 함께하는 특별한 순간들을 공유하고, 전국의
                펫플레이스를 탐험해보세요.
              </p>
              <ul className="welcome-benefits">
                <li>
                  <FaPaw size={18} />
                  <span>전국의 펫플레이스 정보 탐색</span>
                </li>
                <li>
                  <FaPaw size={18} />
                  <span>나만의 장소 리뷰 및 공유</span>
                </li>
                <li>
                  <FaPaw size={18} />
                  <span>다른 반려인들과의 소통</span>
                </li>
                <li>
                  <FaPaw size={18} />
                  <span>반려동물 케어 정보 교환</span>
                </li>
              </ul>
            </div>
          </div>

          {/* 오른쪽: 가입 폼 패널 */}
          <div className="signup-form-panel">
            <Form>
              <Form.Group className="mb-4 text-center">
                <div
                  className="profile-uploader-neo"
                  onClick={handleProfileClick}
                >
                  {currentProfilePreview ? (
                    <img
                      src={currentProfilePreview}
                      alt="프로필 미리보기"
                      className="profile-preview-img"
                    />
                  ) : (
                    <FaPlus size={30} color="#999" />
                  )}
                </div>
                <p className="form-label-neo mb-3 mt-3">프로필 사진 (선택)</p>
                <Form.Control
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  style={{ display: "none" }}
                  accept="image/*"
                  disabled={isProcessing}
                />
              </Form.Group>

              <Form.Group className="mb-3">
                <Form.Label className="form-label-neo">이메일</Form.Label>
                <Form.Control
                  type="text"
                  value={email}
                  onChange={(e) => setEmail(e.target.value.replace(/\s/g, ""))}
                  className="form-input-neo"
                  placeholder="user@example.com"
                />
                {email && !isEmailValid && (
                  <FormText className="text-danger fw-bold">
                    이메일 형식이 올바르지 않습니다.
                  </FormText>
                )}
              </Form.Group>

              <Form.Group className="mb-3">
                <Form.Label className="form-label-neo">비밀번호</Form.Label>
                <Form.Control
                  type="password"
                  value={password}
                  onChange={(e) =>
                    setPassword(e.target.value.replace(/\s/g, ""))
                  }
                  className="form-input-neo"
                  placeholder="8자 이상, 대/소문자, 숫자, 특수문자 포함"
                />
                {password && !isPasswordValid && (
                  <FormText className="text-danger fw-bold">
                    비밀번호는 8자 이상, 영문 대소문자, 숫자, 특수문자를
                    포함해야 합니다.
                  </FormText>
                )}
              </Form.Group>

              <Form.Group className="mb-3">
                <Form.Label className="form-label-neo">
                  비밀번호 확인
                </Form.Label>
                <Form.Control
                  type="password"
                  value={password2}
                  onChange={(e) =>
                    setPassword2(e.target.value.replace(/\s/g, ""))
                  }
                  className="form-input-neo"
                  placeholder="비밀번호를 다시 한번 입력해주세요"
                />
                {password2 && !isPasswordMatch && (
                  <FormText className="text-danger fw-bold">
                    비밀번호가 일치하지 않습니다.
                  </FormText>
                )}
              </Form.Group>

              <Form.Group className="mb-4">
                <Form.Label className="form-label-neo">별명</Form.Label>
                <Form.Control
                  value={nickName}
                  onChange={(e) =>
                    setNickName(e.target.value.replace(/\s/g, ""))
                  }
                  className="form-input-neo"
                  placeholder="2~20자, 한글/영문/숫자"
                />
                {nickName && !isNickNameValid && (
                  <FormText className="text-danger fw-bold">
                    별명은 2~20자, 한글/영문/숫자만 사용할 수 있습니다.
                  </FormText>
                )}
              </Form.Group>

              <Form.Group className="mb-4">
                <Form.Label className="form-label-neo">자기소개</Form.Label>
                <Form.Control
                  as="textarea"
                  rows={3}
                  value={info}
                  maxLength={1000}
                  placeholder="자기소개를 입력하세요. 1000자 이내 (선택)"
                  onChange={(e) => setInfo(e.target.value)}
                  className="form-input-neo"
                  style={{ resize: "none" }}
                />
                <div
                  className="text-end text-muted mt-1"
                  style={{ fontSize: "0.8rem" }}
                >
                  {info.length} / 1000
                </div>
              </Form.Group>

              <div className="mt-4">
                <Button
                  onClick={handleSaveClick}
                  disabled={disabled}
                  className="btn-neo btn-primary-neo w-100"
                >
                  {isProcessing && <Spinner size="sm" className="me-2" />}
                  가입하기
                </Button>
              </div>
            </Form>
          </div>
        </div>
      </div>
    </div>
  );
}
