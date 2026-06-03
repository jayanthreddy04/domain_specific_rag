import React, { useState } from 'react';
import MessageBubble from './MessageBubble';

const SUGGESTIONS = [
  'What is retrieval-augmented generation?',
  'How do transformers use self-attention?',
  'What are common ways to reduce overfitting?',
  'How can LLM hallucinations be mitigated?',
];

const ChatWindow = ({ messages, onSend, disabled }) => {
  const [input, setInput] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!input.trim() || disabled) return;
    onSend(input);
    setInput('');
  };

  return (
    <div className="chat-window">
      <div className="messages-area" id="chat-window">
        {messages.length === 0 ? (
          <div className="welcome-panel">
            <h2>Ask anything about Artificial Intelligence</h2>
            <p>
              Answers are grounded in 52 curated AI documents with source citations.
              Ask about machine learning, NLP, transformers, RAG, AI ethics, and related topics.
            </p>
            <div className="suggestions">
              {SUGGESTIONS.map((s) => (
                <button
                  key={s}
                  type="button"
                  className="suggestion-chip"
                  onClick={() => onSend(s)}
                  disabled={disabled}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        ) : (
          messages.map((msg) => <MessageBubble key={msg.id} message={msg} />)
        )}
      </div>

      <form className="chat-input-form" onSubmit={handleSubmit}>
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask about machine learning, NLP, ethics, RAG..."
          disabled={disabled}
          aria-label="Chat message"
        />
        <button type="submit" disabled={disabled || !input.trim()}>
          Send
        </button>
      </form>
    </div>
  );
};

export default ChatWindow;
