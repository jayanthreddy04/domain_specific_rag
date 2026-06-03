import React, { useState, useEffect, useRef, useCallback } from 'react';
import ChatWindow from '../components/ChatWindow';
import LoadingIndicator from '../components/LoadingIndicator';
import { sendQuery, clearSession, checkHealth } from '../utils/api';

const SESSION_KEY = 'rag_session_id';

function getStoredSessionId() {
  return localStorage.getItem(SESSION_KEY);
}

function storeSessionId(id) {
  localStorage.setItem(SESSION_KEY, id);
}

const ChatPage = () => {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [sessionId, setSessionId] = useState(getStoredSessionId());
  const [kbStatus, setKbStatus] = useState(null);
  const bottomRef = useRef(null);

  useEffect(() => {
    checkHealth()
      .then(setKbStatus)
      .catch(() =>
        setKbStatus({
          status: 'error',
          knowledgeBaseChunks: 0,
          storageNote: 'Backend health check failed. Check Vercel function logs and environment variables.',
        })
      );
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  const handleSendMessage = useCallback(
    async (text) => {
      if (!text.trim() || loading) return;

      const userMessage = {
        id: `user-${Date.now()}`,
        role: 'user',
        content: text.trim(),
        timestamp: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, userMessage]);
      setLoading(true);

      try {
        const response = await sendQuery(text.trim(), sessionId);
        if (response.sessionId) {
          setSessionId(response.sessionId);
          storeSessionId(response.sessionId);
        }
        const botMessage = {
          id: `bot-${Date.now()}`,
          role: 'assistant',
          content: response.answer,
          citations: response.citations || [],
          meta: response.meta,
          timestamp: new Date().toISOString(),
        };
        setMessages((prev) => [...prev, botMessage]);
      } catch (err) {
        const isNetworkError = !err.response;
        const errorText = isNetworkError
          ? 'Cannot connect to the backend API at http://localhost:5001. Start it with `npm run dev` in the backend folder.'
          : err.response?.data?.error ||
            'Something went wrong while processing your question.';
        setMessages((prev) => [
          ...prev,
          {
            id: `err-${Date.now()}`,
            role: 'assistant',
            content: errorText,
            isError: true,
            timestamp: new Date().toISOString(),
          },
        ]);
      } finally {
        setLoading(false);
      }
    },
    [loading, sessionId]
  );

  const handleClearChat = async () => {
    if (sessionId) {
      try {
        await clearSession(sessionId);
      } catch {
        // ignore
      }
    }
    setMessages([]);
    localStorage.removeItem(SESSION_KEY);
    setSessionId(null);
  };

  return (
    <div className="chat-page">
      <header className="chat-header">
        <div className="brand">
          <span className="brand-icon">🧠</span>
          <div>
            <h1>Domain Specific RAG</h1>
            <p>Artificial Intelligence</p>
          </div>
        </div>
        <div className="header-actions">
          {kbStatus && (
            <span
              className={`kb-badge ${kbStatus.knowledgeBaseChunks > 0 ? 'ok' : 'warn'}`}
              title={kbStatus.storageNote || kbStatus.setupHint || ''}
            >
              {kbStatus.knowledgeBaseChunks > 0
                ? `${kbStatus.knowledgeBaseChunks} chunks · ${kbStatus.storage || 'indexed'}`
                : kbStatus.status === 'error'
                  ? 'Backend health check failed'
                  : 'Knowledge base empty — ingest ChromaDB'}
            </span>
          )}
          <button type="button" className="btn-secondary" onClick={handleClearChat}>
            New chat
          </button>
        </div>
      </header>

      <main className="chat-main">
        <ChatWindow messages={messages} onSend={handleSendMessage} disabled={loading} />
        {loading && <LoadingIndicator />}
        <div ref={bottomRef} />
      </main>
    </div>
  );
};

export default ChatPage;
