import React from 'react';
import Tooltips from './Tooltips';

export default function IconButton({ className, icon, text, onClick, title, disabled, helpDisabled}) {
  const content = (
    <button 
      type="button" 
      className={`${className} shadow`} 
      onClick={onClick} 
      aria-label={text} 
      title={title || text}
      disabled={disabled}
    >
      <i className={`bi bi-${icon}`}></i> {text}
    </button>
  );
  return (disabled && helpDisabled) ? (
    <Tooltips content={helpDisabled} side="top" className="d-block w-100">
      {content}
    </Tooltips>
  ) : (
    content
  );
}