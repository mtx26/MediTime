import { Link } from 'react-router-dom';
import PropTypes from 'prop-types';
import { useTranslation } from 'react-i18next';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { MoreVertical } from 'lucide-react';

function ActionSheet({ actions, buttonSize, dataTour }) {
  const { t } = useTranslation();

  return (
    <DropdownMenu modal={false}>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          size={buttonSize === 'sm' ? 'sm' : 'default'}
          aria-label={t('Actions')}
          title={t('Actions')}
          data-tour={dataTour}
          className="px-2"
        >
          <MoreVertical className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent 
        className="w-56" 
        align="start"
        side="bottom"
        sideOffset={8}
        alignOffset={0}
      >
        {actions.map((action, index) => {
          if (action.separator) {
            return <DropdownMenuSeparator key={`separator-${index}`} />;
          }

          if (action.linkTo) {
            return (
              <DropdownMenuItem key={index} asChild>
                <Link
                  to={action.linkTo}
                  className={action.danger ? 'text-red-600 focus:text-red-600 hover:text-red-800' : ''}
                  title={action.title}
                  aria-label={action.title}
                  data-tour={action.dataTour}
                >
                  {action.label}
                </Link>
              </DropdownMenuItem>
            );
          }

          return (
            <DropdownMenuItem
              key={index}
              onClick={action.onClick}
              className={action.danger ? 'text-red-600 focus:text-red-600 hover:text-red-800' : ''}
              title={action.title}
              aria-label={action.title}
              data-tour={action.dataTour}
            >
              {action.label}
            </DropdownMenuItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
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