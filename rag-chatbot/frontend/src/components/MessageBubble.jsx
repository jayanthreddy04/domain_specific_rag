import React from 'react';
import SourceCitation from './SourceCitation';

const MessageBubble = ({ message }) => {
  const isUser = message.role === 'user';

  return (
    <div className={`message-row ${isUser ? 'user' : 'assistant'} ${message.isError ? 'error' : ''}`}>
      <div className="avatar">{isUser ? 'You' : 'AI'}</div>
      <div className="bubble">
        <p className="message-text">{message.content}</p>
        {!isUser && message.citations?.length > 0 && (
          <div className="citations-block">
            <h4>Sources</h4>
            {message.citations.map((citation) => (
              <SourceCitation key={citation.id || citation.index} citation={citation} />
            ))}
          </div>
        )}
        {!isUser && message.meta && (
          <div className="meta-line">
            {message.meta.responseTimeMs != null && (
              <span>{message.meta.responseTimeMs} ms</span>
            )}
            {message.meta.retrievalCount != null && (
              <span>{message.meta.retrievalCount} sources retrieved</span>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default MessageBubble;
