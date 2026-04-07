import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import type { ReactNode } from 'react';
import type { ActionSheetProps as SharedActionSheetProps } from '@meditime/types';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { MoreVertical } from 'lucide-react';

type ActionSheetProps = SharedActionSheetProps<ReactNode>;

function ActionSheet({ actions, buttonSize, dataTour }: ActionSheetProps) {
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
                  className={action.danger ? 'text-red-600! [&_svg]:text-red-600!' : ''}
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
              className={action.danger ? 'text-red-600! [&_svg]:text-red-600!' : ''}
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

export default ActionSheet;