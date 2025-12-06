import { useRef, useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import PropTypes from 'prop-types';
import { useTranslation } from 'react-i18next';

function ActionSheet({ actions, buttonSize, dataTour }) {
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
        !dropdownRef.current.contains(e.target) &&
        !e.target.closest('.react-joyride__tooltip')
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
      className={`btn btn-outline-dark ${buttonSize === 'sm' ? 'btn-sm' : ''}`}
      ref={buttonRef}
      onClick={toggleDropdown}
      label={t('Actions')}
      title={t('Actions')}
      data-tour={dataTour}
    >
      <i className="bi bi-three-dots-vertical"></i>
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
                  data-tour={action.dataTour}
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
                data-tour={action.dataTour}
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
  dataTour: PropTypes.string,
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