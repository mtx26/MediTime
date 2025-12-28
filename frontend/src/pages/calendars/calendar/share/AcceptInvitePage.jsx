// src/pages/AcceptInvitePage.jsx
import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useLoading } from '@/components/ui/loading';
import HoveredUserProfile from '@/components/common/HoveredUserProfile';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Mail, Calendar, AlertCircle, Check, X } from 'lucide-react';

function AcceptInvitePage({sharedUserCalendars}) {
  const { t } = useTranslation();

  const [token, setToken] = useState('');
  const [type, setType] = useState('');
  const [loading, setLoading] = useState(true);
  const [invitation, setInvitation] = useState(null);

  const navigate = useNavigate();
  const { lng } = useParams();

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    setToken(params.get('token') || '');
    setType(params.get('type') || '');
  }, []);

  useEffect(() => {
    if (!token || !type) {
      return;
    }
    getInvitation();
  }, [token, type, setLoading]);

  const getInvitation = async () => {
    if (type === 'login') {
      const rep = await sharedUserCalendars.getLoginInvitation(token);
      if (rep.success) {
        setInvitation(rep.invitation);
      }
    } else if (type === 'registration') {
      const rep = await sharedUserCalendars.getRegistrationInvitation(token);
      if (rep.success) {
        setInvitation(rep.invitation);
      }
    }
    setLoading(false);
  }

  const handleAccept = async () => {
    setLoading(true);
    let calendarId = null;

    if (type === 'login') {
      const rep = await sharedUserCalendars.acceptLoginInvitation(token);
      if (rep.success) {
        calendarId = rep.calendar_id;
        navigate(`/${lng}/shared-user-calendar/${calendarId}`);
      }
    } else if (type === 'registration') {
      const rep = await sharedUserCalendars.acceptRegistrationInvitation(token);
      if (rep.success) {
        calendarId = rep.calendar_id;
        navigate(`/${lng}/shared-user-calendar/${calendarId}`);
      }
    }
    setLoading(false);
  }

  const handleReject = async () => {
    setLoading(true);
    if (type === 'login') {
      const rep = await sharedUserCalendars.rejectLoginInvitation(token);
      if (rep.success) {
        navigate(`/${lng}/calendars`);
      }
    } else if (type === 'registration') {
      const rep = await sharedUserCalendars.rejectRegistrationInvitation(token);
      if (rep.success) {
        navigate(`/${lng}/calendars`);
      }
    }
    setLoading(false);
  }

  const { showLoading } = useLoading();

  useEffect(() => {
    showLoading(loading === true, t('invitation.loading'));
  }, [loading, showLoading, t]);

  if (loading) {
    return null;
  }

  if (loading === false && !invitation) {
    return (
      <div className="max-w-md mx-auto mt-8">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            {t('invitation.invalid_or_expired')}
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="flex justify-center items-center min-h-screen p-4">
      <Card className="w-full max-w-2xl">
        <CardHeader className="text-center border-b">
          <div className="flex justify-center mb-3">
            <Mail className="h-8 w-8 text-primary" />
          </div>
          <CardTitle className="text-2xl">{t('invitation.title')}</CardTitle>
        </CardHeader>

        <CardContent className="py-8">
          {/* Grid avec calendrier et propriétaire */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            {/* Calendrier */}
            <div className="flex flex-col items-center">
              <p className="text-sm text-muted-foreground font-semibold mb-2">
                {t('calendar.label')}
              </p>
              <div className="flex items-center gap-2 px-4 py-3 rounded-lg bg-accent border">
                <Calendar className="h-5 w-5 text-primary" />
                <span className="font-semibold text-base">
                  {invitation.calendar_name}
                </span>
              </div>
            </div>

            {/* Propriétaire */}
            <div className="flex flex-col items-center">
              <p className="text-sm text-muted-foreground font-semibold mb-2">
                {t('owner')}
              </p>
              <HoveredUserProfile
                user={{
                  photo_url: invitation.owner_photo_url,
                  display_name: invitation.owner_display_name,
                  email: invitation.owner_email,
                }}
                trigger={
                  <div className="flex items-center gap-3 px-3 py-2 rounded-lg bg-accent border cursor-pointer hover:bg-accent/80 transition">
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={invitation.owner_photo_url} alt={t('profile')} referrerPolicy="no-referrer" />
                      <AvatarFallback>{invitation.owner_display_name.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <strong>{invitation.owner_display_name}</strong>
                  </div>
                }
              />
            </div>
          </div>

          {/* Boutons */}
          <div className="flex gap-3">
            <Button 
              variant="default" 
              className="flex-1 gap-2"
              onClick={handleAccept}
              disabled={loading}
            >
              <Check className="h-4 w-4" />
              {t('accept')}
            </Button>
            <Button 
              variant="destructive" 
              className="flex-1 gap-2"
              onClick={handleReject}
              disabled={loading}
            >
              <X className="h-4 w-4" />
              {t('reject')}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default AcceptInvitePage;
