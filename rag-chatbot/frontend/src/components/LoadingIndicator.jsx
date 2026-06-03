import React from 'react';

const LoadingIndicator = () => (
  <div className="loading-indicator" role="status" aria-live="polite">
    <div className="loading-dots">
      <span />
      <span />
      <span />
    </div>
    <p>Retrieving context and generating answer...</p>
  </div>
);

export default LoadingIndicator;
