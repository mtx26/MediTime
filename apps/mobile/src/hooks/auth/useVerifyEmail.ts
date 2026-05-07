import { useCallback, useEffect, useRef, useState } from 'react';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { log } from '@meditime/utils';
import { useAuth } from './useAuth';
import { supabase } from '../../services/supabase';
import { buildMobileAuthCallbackUrl } from '../../utils/inAppBrowser';

export function useVerifyEmail() {
  const { t } = useTranslation();
  const router = useRouter();
  const { userInfo, reloadUser } = useAuth();
  const userInfoRef = useRef(userInfo);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  userInfoRef.current = userInfo;

  useEffect(() => {
    if (userInfo?.emailVerified) {
      router.replace('/calendars');
    }
  }, [router, userInfo?.emailVerified]);

  useEffect(() => {
    const intervalId = setInterval(() => {
      const checkEmailVerification = async () => {
        const { data, error: getUserError } = await supabase.auth.getUser();

        if (getUserError || !data.user) return;

        if (data.user.email_confirmed_at) {
          await reloadUser();
          router.replace('/calendars');
        }
      };

      void checkEmailVerification();
    }, 5000);

    return () => clearInterval(intervalId);
  }, [reloadUser, router]);

  const handleSendVerification = useCallback(async () => {
    const user = userInfoRef.current;

    setError(null);

    if (!user?.email) {
      setError(String(t('verify_email.no_user')));
      return;
    }

    setIsSubmitting(true);

    const { error: resendError } = await supabase.auth.resend({
      type: 'signup',
      email: user.email,
      options: {
        emailRedirectTo: buildMobileAuthCallbackUrl('signup'),
      },
    });

    if (resendError) {
      log.error("Erreur d'envoi du mail de verification", {
        uid: user.uid,
        origin: 'EMAIL_VERIFICATION_ERROR',
        error: resendError,
      });
      const code = resendError.code || 'unexpected_error';
      setError(String(t(`supabase-error.${code}`)));
      setIsSubmitting(false);
      return;
    }

    setSent(true);
    setIsSubmitting(false);
    log.info('Email de verification envoye', {
      code: 'EMAIL_VERIFICATION_SENT',
      origin: 'VerifyEmail',
      uid: user.uid,
    });
  }, [t]);

  return {
    email: userInfo?.email ?? null,
    sent,
    error,
    isSubmitting,
    handleSendVerification,
    backToLogin: () => router.replace('/(auth)/login'),
  };
}
