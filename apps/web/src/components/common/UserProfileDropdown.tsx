import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { handleLogout } from '../../services/auth/authService';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { User, Settings, LogOut, UserPlus, LogIn, ChevronDown } from 'lucide-react';
import type { UserInfo } from '@meditime/types';

interface UserProfileDropdownProps {
  lng: string;
  userInfo: UserInfo | null | undefined;
}

export default function UserProfileDropdown({ lng, userInfo }: UserProfileDropdownProps) {
  const { t } = useTranslation();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="flex items-center gap-2">
          {userInfo ? (
            <>
              <Avatar className="h-8 w-8">
                <AvatarImage src={userInfo.photoUrl || undefined} alt={userInfo.displayName || t('user')} referrerPolicy="no-referrer" />
                <AvatarFallback><User className="h-4 w-4" /></AvatarFallback>
              </Avatar>
              <span className="text-sm">{userInfo.displayName || t('user')}</span>
              <ChevronDown className="h-4 w-4" />
            </>
          ) : (
            <>
              <User className="h-5 w-5" />
              <span>{t('account.label')}</span>
              <ChevronDown className="h-4 w-4" />
            </>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {userInfo ? (
          <>
            <DropdownMenuItem asChild>
              <Link to={`/${lng}/profile`} className="flex items-center gap-2">
                <User className="h-4 w-4" /> {t('profile')}
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link to={`/${lng}/settings`} className="flex items-center gap-2">
                <Settings className="h-4 w-4" /> {t('settings.label')}
              </Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleLogout} className="flex items-center gap-2 text-red-600! [&_svg]:text-red-600!">
              <LogOut className="h-4 w-4" /> {t('logout')}
            </DropdownMenuItem>
          </>
        ) : (
          <>
            <DropdownMenuItem asChild>
              <Link to={`/${lng}/login`} className="flex items-center gap-2">
                <LogIn className="h-4 w-4" /> {t('login')}
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link to={`/${lng}/register`} className="flex items-center gap-2">
                <UserPlus className="h-4 w-4" /> {t('register')}
              </Link>
            </DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
