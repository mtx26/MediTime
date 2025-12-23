import React from 'react';
import PropTypes from 'prop-types';
import ConfirmDialog from './ConfirmDialog';
import Toast from './Toast';

function AlertSystem({
  type = 'info',
  title,
  message,
  onClose,
  onConfirm = null,
  duration = 2000,
}) {
  const isConfirm = type.startsWith('confirm');

  if (!message) return null;

  if (isConfirm) {
    return (
      <ConfirmDialog
        type={type}
        title={title}
        message={message}
        onClose={onClose}
        onConfirm={onConfirm}
      />
    );
  }

  return (
    <Toast
      type={type}
      message={message}
      onClose={onClose}
      duration={duration}
    />
  );
}

AlertSystem.propTypes = {
  type: PropTypes.oneOf([
    'info',
    'success',
    'warning',
    'danger',
    'confirm-safe',
    'confirm-danger',
  ]),
  title: PropTypes.string,
  message: PropTypes.string.isRequired,
  onClose: PropTypes.func.isRequired,
  onConfirm: PropTypes.func,
  duration: PropTypes.number,
};

export default AlertSystem;
