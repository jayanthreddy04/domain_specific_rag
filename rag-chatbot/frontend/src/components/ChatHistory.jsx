import React from 'react';
import MessageBubble from './MessageBubble';

const ChatHistory = ({ messages }) => (
  <div className="chat-history">
    {messages.map((msg) => (
      <MessageBubble key={msg.id} message={msg} />
    ))}
  </div>
);

export default ChatHistory;
