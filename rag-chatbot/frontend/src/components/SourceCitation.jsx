import React, { useState } from 'react';

const SourceCitation = ({ citation }) => {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="citation-card">
      <button
        type="button"
        className="citation-header"
        onClick={() => setExpanded(!expanded)}
      >
        <span className="citation-index">[{citation.index}]</span>
        <span className="citation-title">{citation.title}</span>
        <span className="citation-score">{(citation.score * 100).toFixed(0)}% match</span>
      </button>
      {expanded && (
        <div className="citation-body">
          <p className="citation-doc-id">{citation.docId}</p>
          <p className="citation-excerpt">{citation.excerpt}</p>
        </div>
      )}
    </div>
  );
};

export default SourceCitation;
