import * as DropdownMenu from '@radix-ui/react-dropdown-menu';
import { Link } from 'react-router-dom';
import PropTypes from 'prop-types';
import { useTranslation } from 'react-i18next';

function ActionSheet({ actions, buttonSize, dataTour }) {
  const { t } = useTranslation();

  return (
    <DropdownMenu.Root>
      <DropdownMenu.Trigger asChild>
        <button
          className={`btn btn-outline-dark ${buttonSize === 'sm' ? 'btn-sm' : ''}`}
          aria-label={t('Actions')}
          title={t('Actions')}
          data-tour={dataTour}
        >
          <i className="bi bi-three-dots-vertical"></i>
        </button>
      </DropdownMenu.Trigger>

      <DropdownMenu.Portal>
        <DropdownMenu.Content
          className="dropdown-menu show shadow"
          align="end"
          sideOffset={5}
          style={{
            minWidth: '12rem',
            zIndex: 1055,
          }}
        >
          {actions.map((action, index) => {
            if (action.separator) {
              return <DropdownMenu.Separator key={`separator-${index}`} className="dropdown-divider" />;
            }

            if (action.linkTo) {
              return (
                <DropdownMenu.Item key={index} asChild>
                  <Link
                    to={action.linkTo}
                    className={`dropdown-item ${action.danger ? 'text-danger' : ''}`}
                    title={action.title}
                    aria-label={action.title}
                    data-tour={action.dataTour}
                  >
                    {action.label}
                  </Link>
                </DropdownMenu.Item>
              );
            }

            return (
              <DropdownMenu.Item key={index} asChild>
                <button
                  className={`dropdown-item ${action.danger ? 'text-danger' : ''}`}
                  onClick={action.onClick}
                  title={action.title}
                  aria-label={action.title}
                  data-tour={action.dataTour}
                >
                  {action.label}
                </button>
              </DropdownMenu.Item>
            );
          })}
        </DropdownMenu.Content>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
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