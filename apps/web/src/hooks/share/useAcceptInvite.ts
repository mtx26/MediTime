import { useEffect, useState } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useLoading } from '@/components/ui/loading';
import { INVITE_TYPES } from '@meditime/constants';
import type {
  AcceptInvitePageProps,
  AcceptInviteSharedUserCalendars,
  InviteType,
  SharedInvitation,
} from '@meditime/types';

export function useAcceptInvite({ sharedUserCalendars }: AcceptInvitePageProps) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { lng } = useParams<{ lng: string }>();
  const [searchParams] = useSearchParams();

  const calendarsApi = sharedUserCalendars as AcceptInviteSharedUserCalendars;

  const [token, setToken] = useState('');
  const [type, setType] = useState('');
  const [loading, setLoading] = useState(true);
  const [invitation, setInvitation] = useState<SharedInvitation | null>(null);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    setToken(searchParams.get('token') ?? '');
    setType(searchParams.get('type') ?? '');
  }, [searchParams]);

  const getInvitation = async () => {
    if (type === INVITE_TYPES.LOGIN) {
      const rep = await calendarsApi.getLoginInvitation(token);
      if (rep.success) setInvitation(rep.invitation ?? null);
    } else if (type === INVITE_TYPES.REGISTRATION) {
      const rep = await calendarsApi.getRegistrationInvitation(token);
      if (rep.success) {
        setInvitation(rep.invitation ?? null);
      } else if (rep.status === 404) {
        setNotFound(true);
      }
    }
    setLoading(false);
  };

  useEffect(() => {
    if (token === '' || type === '') {
      setNotFound(true);
      setLoading(false);
      return;
    }
    void getInvitation();
  }, [token, type]);

  const locale = lng ?? 'en';

  const handleAccept = async () => {
    setLoading(true);
    if (type === INVITE_TYPES.LOGIN) {
      const rep = await calendarsApi.acceptLoginInvitation(token);
      if (rep.success && rep.calendar_id) navigate(`/${locale}/shared-user-calendar/${rep.calendar_id}`);
    } else if (type === INVITE_TYPES.REGISTRATION) {
      const rep = await calendarsApi.acceptRegistrationInvitation(token);
      if (rep.success && rep.calendar_id) navigate(`/${locale}/shared-user-calendar/${rep.calendar_id}`);
    }
    setLoading(false);
  };

  const handleReject = async () => {
    setLoading(true);
    if (type === INVITE_TYPES.LOGIN) {
      const rep = await calendarsApi.rejectLoginInvitation(token);
      if (rep.success) navigate(`/${locale}/calendars`);
    } else if (type === INVITE_TYPES.REGISTRATION) {
      const rep = await calendarsApi.rejectRegistrationInvitation(token);
      if (rep.success) navigate(`/${locale}/calendars`);
    }
    setLoading(false);
  };

  const { showLoading } = useLoading();

  useEffect(() => {
    showLoading(loading === true, t('invitation.loading'));
  }, [loading, showLoading, t]);

  return { loading, invitation, notFound, handleAccept, handleReject };
}
