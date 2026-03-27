import React from 'react';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip';
import PropTypes from 'prop-types';

export default function IconButton({ className, icon: Icon, text, onClick, title, disabled, helpDisabled }) {
  const content = (
    <Button
      type="button"
      className={`inline-flex items-center gap-2 ${className || ''}`}
      onClick={onClick}
      aria-label={text}
      title={title || text}
      disabled={disabled}
      variant="outline"
      size="sm"
    >
      {Icon && <Icon className="w-4 h-4" />}
      {text}
    </Button>
  );

  return (disabled && helpDisabled) ? (
    <Tooltip>
      <TooltipTrigger asChild>
        {content}
      </TooltipTrigger>
      <TooltipContent side="top">
        {helpDisabled}
      </TooltipContent>
    </Tooltip>
  ) : (
    content
  );
}

IconButton.propTypes = {
  className: PropTypes.string,
  icon: PropTypes.elementType,
  text: PropTypes.string.isRequired,
  onClick: PropTypes.func,
  title: PropTypes.string,
  disabled: PropTypes.bool,
  helpDisabled: PropTypes.string,
};