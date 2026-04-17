import { useTranslation } from 'react-i18next';
import { useAcceptInvite } from '@/hooks/share/useAcceptInvite';
import HoveredUserProfile from '@/components/common/HoveredUserProfile';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Mail, Calendar, Check, X } from 'lucide-react';
import NotFound from '@/pages/general/NotFound';
import type { AcceptInvitePageProps } from '@meditime/types';

function AcceptInvitePage(props: AcceptInvitePageProps) {
  const { t } = useTranslation();
  const { loading, invitation, notFound, handleAccept, handleReject } = useAcceptInvite(props);

  if (notFound) return <NotFound />;
  if (!invitation) return null;

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
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            <div className="flex flex-col items-center">
              <p className="text-sm text-muted-foreground font-semibold mb-2">{t('calendar.label')}</p>
              <div className="flex items-center gap-2 px-4 py-3 rounded-lg bg-accent border">
                <Calendar className="h-5 w-5 text-primary" />
                <span className="font-semibold text-base">{invitation.calendar_name}</span>
              </div>
            </div>

            <div className="flex flex-col items-center">
              <p className="text-sm text-muted-foreground font-semibold mb-2">{t('owner')}</p>
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

          <div className="flex gap-3">
            <Button variant="default" className="flex-1 gap-2" onClick={handleAccept} disabled={loading}>
              <Check className="h-4 w-4" />
              {t('accept')}
            </Button>
            <Button variant="destructive" className="flex-1 gap-2" onClick={handleReject} disabled={loading}>
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
