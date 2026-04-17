import {
  GoogleHandleLogin,
  GithubHandleLogin,
  TwitterHandleLogin,
  DiscordHandleLogin,
  FacebookHandleLogin,
  MicrosoftHandleLogin
} from '@/services/auth/authService';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { FcGoogle } from 'react-icons/fc';
import { SiGithub, SiDiscord, SiFacebook } from 'react-icons/si';
import { FaMicrosoft } from 'react-icons/fa';
import { FaXTwitter } from 'react-icons/fa6';

interface SocialProvidersProps {
  activeTab: string;
  redirect: string | undefined;
}

function SocialProviders({ activeTab, redirect }: SocialProvidersProps) {
  const { t } = useTranslation();

  return (
    <div className="text-center mb-4">
      <p className="text-muted-foreground">{activeTab === 'login' ? t('auth.login_with') : t('auth.register_with')}</p>
      <div className="grid grid-cols-3 md:grid-cols-6 gap-4 mt-2 place-items-center">
        <div className="flex flex-col items-center">
          <Button variant="outline" className="h-12 w-12" onClick={() => GoogleHandleLogin(redirect)} aria-label={t('auth.with_google')} title={t('auth.with_google')}>
            <FcGoogle className="size-8" />
          </Button>
          <span className="mt-1 text-xs w-full text-center truncate">{t('auth.provider.google')}</span>
        </div>
        <div className="flex flex-col items-center">
          <Button variant="outline" className="h-12 w-12" onClick={() => GithubHandleLogin(redirect)} aria-label={t('auth.with_github')} title={t('auth.with_github')}>
            <SiGithub className="size-8 text-black" />
          </Button>
          <span className="mt-1 text-xs w-full text-center truncate">{t('auth.provider.github')}</span>
        </div>
        <div className="flex flex-col items-center">
          <Button variant="outline" className="h-12 w-12" onClick={() => DiscordHandleLogin(redirect)} aria-label={t('auth.with_discord')} title={t('auth.with_discord')}>
            <SiDiscord className="size-8 text-[#5865F2]" />
          </Button>
          <span className="mt-1 text-xs w-full text-center truncate">{t('auth.provider.discord')}</span>
        </div>
        <div className="flex flex-col items-center">
          <Button variant="outline" className="h-12 w-12" onClick={() => TwitterHandleLogin(redirect)} aria-label={t('auth.with_twitter')} title={t('auth.with_twitter')}>
            <FaXTwitter className="size-8 text-black" />
          </Button>
          <span className="mt-1 text-xs w-full text-center truncate">{t('auth.provider.twitter')}</span>
        </div>
        <div className="flex flex-col items-center">
          <Button variant="outline" className="h-12 w-12" onClick={() => FacebookHandleLogin(redirect)} aria-label={t('auth.with_facebook')} title={t('auth.with_facebook')}>
            <SiFacebook className="size-8 text-[#1877F2]" />
          </Button>
          <span className="mt-1 text-xs w-full text-center truncate">{t('auth.provider.facebook')}</span>
        </div>
        <div className="flex flex-col items-center">
          <Button variant="outline" className="h-12 w-12" onClick={() => MicrosoftHandleLogin(redirect)} aria-label={t('auth.with_microsoft')} title={t('auth.with_microsoft')}>
            <FaMicrosoft className="size-8 text-[#5E5E5E]" />
          </Button>
          <span className="mt-1 text-xs w-full text-center truncate">{t('auth.provider.microsoft')}</span>
        </div>
      </div>
      <p className="text-center mt-3 mb-0 text-muted-foreground">{t('auth.or_with_email')}</p>
    </div>
  );
}

export default SocialProviders;
