import { useRef, useState } from "react";
import { Bot, Send, X, ChevronDown } from "lucide-react";

type Message = { role: "user" | "assistant"; content: string };

const API_BASE = import.meta.env.VITE_API_BASE ?? "";

export function ApiChatBot() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    { role: "assistant", content: "你好！我是 Dida API 助手，可以回答关于接入流程、接口参数、错误码等任何问题。请问有什么可以帮到你？" },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () =>
    setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: "smooth" }), 50);

  const send = async () => {
    const text = input.trim();
    if (!text || loading) return;

    const next: Message[] = [...messages, { role: "user", content: text }];
    setMessages(next);
    setInput("");
    setLoading(true);
    scrollToBottom();

    const assistantMsg: Message = { role: "assistant", content: "" };
    setMessages([...next, assistantMsg]);

    try {
      const res = await fetch(`${API_BASE}/api/chat/dida-api`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: next.map((m) => ({ role: m.role, content: m.content })),
        }),
      });

      if (!res.ok || !res.body) throw new Error("请求失败");

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let full = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        full += decoder.decode(value, { stream: true });
        setMessages([...next, { role: "assistant", content: full }]);
        scrollToBottom();
      }
    } catch {
      setMessages([...next, { role: "assistant", content: "抱歉，请求失败，请稍后重试。" }]);
    } finally {
      setLoading(false);
      scrollToBottom();
    }
  };

  return (
    <>
      {/* Floating button */}
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        style={styles.fab}
        aria-label="打开 Dida API 助手"
        title="Dida API 助手"
      >
        {open ? <X size={22} /> : <Bot size={22} />}
      </button>

      {/* Chat panel */}
      {open && (
        <div style={styles.panel}>
          {/* Header */}
          <div style={styles.header}>
            <Bot size={18} style={{ flexShrink: 0 }} />
            <div>
              <div style={{ fontWeight: 700, fontSize: 14 }}>Dida API 助手</div>
              <div style={{ fontSize: 11, opacity: 0.8 }}>Powered by Claude</div>
            </div>
            <button type="button" onClick={() => setOpen(false)} style={styles.closeBtn} aria-label="关闭">
              <ChevronDown size={18} />
            </button>
          </div>

          {/* Messages */}
          <div style={styles.body}>
            {messages.map((m, i) => (
              <div key={i} style={{ display: "flex", justifyContent: m.role === "user" ? "flex-end" : "flex-start", marginBottom: 10 }}>
                <div style={m.role === "user" ? styles.userBubble : styles.aiBubble}>
                  {m.content || (loading && i === messages.length - 1 ? "▋" : "")}
                </div>
              </div>
            ))}
            <div ref={bottomRef} />
          </div>

          {/* Input */}
          <div style={styles.inputRow}>
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && send()}
              placeholder="输入问题，按 Enter 发送…"
              disabled={loading}
              style={styles.chatInput}
              autoFocus
            />
            <button type="button" onClick={send} disabled={loading || !input.trim()} style={styles.sendBtn} aria-label="发送">
              <Send size={15} />
            </button>
          </div>
        </div>
      )}
    </>
  );
}

const styles: Record<string, React.CSSProperties> = {
  fab: {
    position: "fixed",
    bottom: 28,
    right: 28,
    width: 52,
    height: 52,
    borderRadius: "50%",
    background: "var(--dida-navy)",
    color: "#fff",
    border: "none",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    boxShadow: "0 4px 16px rgba(0,9,71,0.35)",
    zIndex: 1000,
    transition: "transform 0.15s",
  },
  panel: {
    position: "fixed",
    bottom: 90,
    right: 28,
    width: 360,
    height: 500,
    background: "var(--surface)",
    borderRadius: 16,
    boxShadow: "0 8px 40px rgba(0,9,71,0.2)",
    border: "1px solid var(--line)",
    display: "flex",
    flexDirection: "column",
    zIndex: 999,
    overflow: "hidden",
  },
  header: {
    background: "var(--dida-navy)",
    color: "#fff",
    padding: "14px 16px",
    display: "flex",
    alignItems: "center",
    gap: 10,
    flexShrink: 0,
  },
  closeBtn: {
    marginLeft: "auto",
    background: "none",
    border: "none",
    color: "#fff",
    cursor: "pointer",
    opacity: 0.8,
    display: "flex",
    alignItems: "center",
    padding: 0,
  },
  body: {
    flex: 1,
    overflowY: "auto",
    padding: "14px 14px 8px",
    display: "flex",
    flexDirection: "column",
  },
  userBubble: {
    background: "var(--dida-navy)",
    color: "#fff",
    borderRadius: "14px 14px 4px 14px",
    padding: "9px 13px",
    fontSize: 13,
    maxWidth: "80%",
    lineHeight: 1.5,
    whiteSpace: "pre-wrap",
    wordBreak: "break-word",
  },
  aiBubble: {
    background: "var(--surface-soft)",
    border: "1px solid var(--line)",
    color: "var(--text)",
    borderRadius: "14px 14px 14px 4px",
    padding: "9px 13px",
    fontSize: 13,
    maxWidth: "85%",
    lineHeight: 1.6,
    whiteSpace: "pre-wrap",
    wordBreak: "break-word",
  },
  inputRow: {
    display: "flex",
    gap: 8,
    padding: "10px 12px",
    borderTop: "1px solid var(--line)",
    flexShrink: 0,
  },
  chatInput: {
    flex: 1,
    height: 36,
    padding: "0 12px",
    fontSize: 13,
    border: "1px solid var(--line)",
    borderRadius: 8,
    outline: "none",
    background: "var(--surface-soft)",
    color: "var(--text)",
  },
  sendBtn: {
    width: 36,
    height: 36,
    borderRadius: 8,
    background: "var(--dida-navy)",
    color: "#fff",
    border: "none",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
    opacity: 1,
    transition: "opacity 0.15s",
  },
};
