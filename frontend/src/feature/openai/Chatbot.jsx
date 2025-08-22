import { useCallback, useEffect, useRef, useState } from "react";
import "../../styles/chatbot.css";

export function Chatbot() {
  const [messages, setMessages] = useState([
    {
      sender: "bot",
      text: "안녕하세요! 펫토피아 챗봇입니다. 무엇을 도와드릴까요?",
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const abortControllerRef = useRef(null);
  const messagesEndRef = useRef(null);

  const exampleQuestions = [
    "강아지 피부 알레르기 관리법은?",
    "고양이 스트레스 해소 방법 알려주세요.",
    "반려동물과 여행할 때 준비물은?",
    "강아지 건강검진 주기는 어떻게 되나요?",
  ];

  // 자동 스크롤
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // 최적화된 Claude API 호출
  const callClaudeViaBackend = useCallback(async (userInput) => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    abortControllerRef.current = new AbortController();

    try {
      const response = await fetch("/api/chatbot", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "claude-3-5-haiku-20241022",
          max_tokens: 300,
          temperature: 0.3,
          system:
            "당신은 정중한 말투로 한국어로만 대답하는 친절하고 간결한 펫토피아 챗봇입니다. 답변은 3-4문장으로 간단명료하게 해주세요.",
          messages: [
            {
              role: "user",
              content: userInput,
            },
          ],
        }),
        signal: abortControllerRef.current.signal,
      });

      if (!response.ok) {
        const error = await response.text();
        throw new Error(error || "Claude 프록시 응답 실패");
      }

      const data = await response.json();
      return data?.content?.[0]?.text || "응답을 받을 수 없습니다.";
    } catch (err) {
      if (err.name === "AbortError") {
        throw new Error("요청이 취소되었습니다.");
      }
      throw err;
    }
  }, []);

  const handleSend = useCallback(
    async (customInput) => {
      const trimmed = (customInput ?? input).trim();
      if (!trimmed || loading) return;

      const userMessage = { sender: "user", text: trimmed };
      setMessages((prev) => [...prev, userMessage]);
      setInput("");
      setLoading(true);

      try {
        const reply = await callClaudeViaBackend(trimmed);
        setMessages((prev) => [...prev, { sender: "bot", text: reply }]);
      } catch (err) {
        if (err.message !== "요청이 취소되었습니다.") {
          setMessages((prev) => [
            ...prev,
            { sender: "bot", text: `❌ 오류 발생: ${err.message}` },
          ]);
        }
      } finally {
        setLoading(false);
        abortControllerRef.current = null;
      }
    },
    [input, loading, callClaudeViaBackend],
  );

  const handleKeyDown = useCallback(
    (e) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        handleSend();
      }
    },
    [handleSend],
  );

  const handleExampleClick = useCallback(
    (question) => {
      handleSend(question);
    },
    [handleSend],
  );

  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  // 중복 컨테이너 제거 - 바로 내용만 렌더링
  return (
    <>
      {/* 로딩 표시 (필요한 경우) */}
      {loading && (
        <div className="chatbot-loading-inline">
          <div className="chatbot-spinner"></div>
          <span>답변 생성 중...</span>
        </div>
      )}

      {/* 대화창 영역 - 컨테이너 없이 바로 */}
      <div className="chatbot-messages-simple">
        {messages.map((msg, idx) => (
          <div
            key={idx}
            className={`chatbot-message ${msg.sender === "user" ? "user" : "bot"}`}
          >
            <div className="message-bubble">
              {msg.sender === "bot" && <span className="bot-emoji">🤖</span>}
              <div className="message-text">{msg.text}</div>
              {msg.sender === "user" && <span className="user-emoji">👤</span>}
            </div>
          </div>
        ))}

        {/* 예시 질문 버튼들 */}
        {messages.length === 1 && (
          <div className="example-questions">
            <h6 className="example-title">💡 이런 질문을 해보세요:</h6>
            <div className="example-buttons">
              {exampleQuestions.map((q, i) => (
                <button
                  key={i}
                  className="example-button"
                  onClick={() => handleExampleClick(q)}
                  disabled={loading}
                >
                  {q}
                </button>
              ))}
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* 입력창 */}
      <div className="chatbot-input-area-simple">
        <textarea
          className="chatbot-input"
          rows={1}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="궁금한 것을 물어보세요..."
          disabled={loading}
        />
        <button
          className="chatbot-send-btn"
          onClick={() => handleSend()}
          disabled={loading || !input.trim()}
        >
          {loading ? "..." : "전송"}
        </button>
      </div>
    </>
  );
}
