import React, { useState } from "react";
import { aiChatMessages as initialMessages } from "../../data/mockData.js";
import { createChatThread, sendChatMessage } from "../../api/client.js";
import "./AIChat.css";

export default function AIChat() {
  const [messages, setMessages] = useState(initialMessages);
  const [input, setInput] = useState("");
  const [threadId, setThreadId] = useState(null);
  const [sending, setSending] = useState(false);

  async function ensureThread() {
    if (threadId) return threadId;
    try {
      const thread = await createChatThread(null);
      setThreadId(thread.id);
      return thread.id;
    } catch (e) {
      return null;
    }
  }

  async function send() {
    const text = input.trim();
    if (!text || sending) return;
    setInput("");
    setMessages(m => [...m, { id: Date.now(), role: "user", text }]);
    setSending(true);
    const tid = await ensureThread();
    if (tid) {
      try {
        const reply = await sendChatMessage(tid, text);
        setMessages(m => [...m, { id: Date.now() + 1, role: "assistant", text: reply.content }]);
        setSending(false);
        return;
      } catch (e) { /* fall through to demo reply */ }
    }
    setTimeout(() => {
      setMessages(m => [...m, { id: Date.now() + 1, role: "assistant", text: "(Demo) Backend ulanmagan — real javob uchun API'ni ishga tushiring." }]);
      setSending(false);
    }, 500);
  }

  return (
    <div>
      <h1 className="page-title">AI Chat repetitor</h1>
      <p className="page-sub">Har qanday savol bering — grammatika, masala yechimi yoki maslahat</p>
      <div className="ai-chat-panel">
        <div className="ai-chat-messages">
          {messages.map(m => <div key={m.id} className={"ai-msg " + m.role}>{m.text}</div>)}
        </div>
        <div className="ai-chat-input-row">
          <input className="input" placeholder="Savolingizni yozing..." value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => e.key === "Enter" && send()} />
          <button className="btn btn-primary" onClick={send} disabled={sending}>{sending ? "..." : "Yuborish"}</button>
        </div>
      </div>
    </div>
  );
}
