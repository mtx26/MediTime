import { useRef, useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import PropTypes from 'prop-types';
import { useTranslation } from 'react-i18next';

function ActionSheet({ actions, buttonSize, minimal = false }) {
  const [show, setShow] = useState(false);
  const buttonRef = useRef(null);
  const dropdownRef = useRef(null);
  const { t } = useTranslation();

  const toggleDropdown = () => {
    setShow((prev) => !prev);
  };

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (
        buttonRef.current &&
        !buttonRef.current.contains(e.target) &&
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target)
      ) {
        setShow(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
<>
  <span className="position-relative d-inline-block">
    <button
      className={
        minimal
          ? 'border-0 bg-transparent d-flex align-items-center justify-content-center'
          : `btn btn-outline-dark ${buttonSize === 'sm' ? 'btn-sm' : ''}`
      }
      style={
        minimal
          ? {
              width: '2rem',
              height: '2rem',
              lineHeight: 1,
              cursor: 'pointer',
            }
          : {}
      }
      ref={buttonRef}
      onClick={toggleDropdown}
      label={t('Actions')}
      title={t('Actions')}
    >
      <i
        className="bi bi-three-dots-vertical"
        style={minimal ? { fontSize: '1.2rem' } : {}}
      ></i>
    </button>



    {show && (
      <ul
        className="dropdown-menu show shadow"
        ref={dropdownRef}
        style={{
          position: 'absolute',
          top: '100%',
          right: 0,
          minWidth: '12rem',
          zIndex: 1055,
        }}
      >
        {actions.map((action, index) => {
          if (action.separator) {
            return (
              <li key={`separator-${index}`}>
                <hr className="dropdown-divider" />
              </li>
            );
          }

          if (action.linkTo) {
            return (
              <li key={index}>
                <Link
                  to={action.linkTo}
                  onClick={() => setShow(false)}
                  className={`dropdown-item ${action.danger ? 'text-danger' : ''}`}
                  title={action.title}
                  aria-label={action.title}
                >
                  {action.label}
                </Link>
              </li>
            );
          }

          return (
            <li key={index}>
              <button
                className={`dropdown-item btn btn-outline-dark ${action.danger ? 'text-danger' : ''}`}
                onClick={() => {
                  action.onClick?.();
                  setShow(false);
                }}
                title={action.title}
                aria-label={action.title}
              >
                {action.label}
              </button>
            </li>
          );
        })}
      </ul>
    )}
  </span>
</>

  );
}

ActionSheet.propTypes = {
  buttonSize: PropTypes.string,
  actions: PropTypes.arrayOf(
    PropTypes.shape({
      label: PropTypes.node,
      title: PropTypes.string,
      onClick: PropTypes.func,
      linkTo: PropTypes.string,
      danger: PropTypes.bool,
      separator: PropTypes.bool,
    })
  ).isRequired,
};

export default ActionSheet;