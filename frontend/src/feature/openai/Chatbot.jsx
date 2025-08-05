import { useState } from "react";
import { Button, Form, InputGroup, Card, Spinner } from "react-bootstrap";

export function Chatbot() {
  const [messages, setMessages] = useState([
    {
      sender: "bot",
      text: "안녕하세요! 펫토피아 챗봇입니다. 무엇을 도와드릴까요?",
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);

  // ✅ Claude 백엔드 프록시 호출 함수
  const callClaudeViaBackend = async (userInput) => {
    const response = await fetch("/api/chatbot", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "claude-3-opus-20240229",
        max_tokens: 1024,
        temperature: 0.7,
        system: "당신은 정중한 말투로 한국어로만 대답하는 친절한 챗봇입니다.",
        messages: [
          {
            role: "user",
            content: userInput,
          },
        ],
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(error || "Claude 프록시 응답 실패");
    }

    const data = await response.json();
    return data?.content?.[0]?.text || "응답 없음";
  };

  // ✅ 메시지 전송 처리
  const handleSend = async () => {
    const trimmed = input.trim();
    if (!trimmed) return;

    const newMessages = [...messages, { sender: "user", text: trimmed }];
    setMessages(newMessages);
    setInput("");
    setLoading(true);

    try {
      const reply = await callClaudeViaBackend(trimmed);
      setMessages([...newMessages, { sender: "bot", text: reply }]);
    } catch (err) {
      setMessages([
        ...newMessages,
        { sender: "bot", text: `❌ 오류 발생: ${err.message}` },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div style={{ padding: "2rem", width: "90%", maxWidth: "1200px", margin: "0 auto" }}>

      <h2 className="mb-4">펫토피아 챗봇</h2>

      <div
        style={{
          width: "100%",
          border: "1px solid #ccc",
          borderRadius: "8px",
          padding: "1rem",
          height: "500px",
          overflowY: "auto",
          marginBottom: "1rem",
          backgroundColor: "#f8f9fa",
        }}

      >
        {messages.map((msg, idx) => (
          <Card
            key={idx}
            className={`mb-2 p-2 ${
              msg.sender === "user" ? "text-end bg-light" : "bg-white"
            }`}
          >
            <Card.Text>{msg.text}</Card.Text>
          </Card>
        ))}
        {loading && (
          <div className="text-center mt-3">
            <Spinner animation="border" size="sm" />
          </div>
        )}
      </div>

      <InputGroup>
        <Form.Control
          as="textarea"
          rows={1}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="메시지를 입력하세요..."
          style={{ resize: "none" }}
        />
        <Button onClick={handleSend} variant="primary" disabled={loading} variant="warning">
          전송
        </Button>
      </InputGroup>
    </div>
  );
}