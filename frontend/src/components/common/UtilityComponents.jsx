import React from 'react';
import Tooltips from './Tooltips';
import PropTypes from 'prop-types';

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

IconButton.propTypes = {
  className: PropTypes.string,
  icon: PropTypes.string.isRequired,
  text: PropTypes.string.isRequired,
  onClick: PropTypes.func,
  title: PropTypes.string,
  disabled: PropTypes.bool,
  helpDisabled: PropTypes.string,
};