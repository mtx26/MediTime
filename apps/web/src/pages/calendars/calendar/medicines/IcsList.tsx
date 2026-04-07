import { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useParams, useLocation } from 'react-router-dom';
import { useAlert } from '@/contexts/AlertContext';
import { useLoading } from '@/components/ui/loading';
import { getCalendarSourceMap, detectCalendarType } from '@meditime/utils';
import HoveredUserProfile from '@/components/common/HoveredUserProfile';
import { Card, CardContent } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Link2, InfoIcon, Trash2, Clipboard, ExternalLink, PlusCircle } from 'lucide-react';
import NotFound from '@/pages/general/NotFound';
import type { IcsListPageProps, IcsSource, IcsTokenEntry } from '@meditime/types';

const VITE_API_URL = import.meta.env.VITE_API_URL;


function IcsList({ personalCalendars, sharedUserCalendars, tokenCalendars }: IcsListPageProps) {
  const { t } = useTranslation();
  const location = useLocation();
  const params = useParams<{ calendarId?: string; sharedToken?: string }>();

  const [tokens, setTokens] = useState<IcsTokenEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const { showAlert, showConfirm } = useAlert();
  const { showLoading } = useLoading();
  const [notFound, setNotFound] = useState(false);

  const { calendarType } = detectCalendarType(location.pathname);
  const calendarId = calendarType === 'token' ? params.sharedToken : params.calendarId;

  const calendarSource = getCalendarSourceMap(
    personalCalendars,
    sharedUserCalendars,
    tokenCalendars
  )[calendarType] as unknown as IcsSource;

  const fetchTokens = async () => {
    setLoading(true);
    const result = await calendarSource.getTokensIcs(calendarId);
    if (result.success) {
      setTokens(result.data?.tokens || []);
    } else if (result.status === 404) {
      setNotFound(true);
    }
    setLoading(false);
  };
  useEffect(() => {
    fetchTokens();
  }, [calendarId]);

  const handleCreateToken = async () => {
    const result = await calendarSource.createTokenIcs(calendarId);
    if (result.success) {
      fetchTokens();
    }
  };

  const handleDeleteToken = async (tokenId: string) => {
    const result = await calendarSource.deleteTokenIcs(calendarId, tokenId);
    if (result.success) {
      fetchTokens();
    }
  };

  const openDeleteActionSheet = (token: IcsTokenEntry) => {
    showConfirm(
      'confirm-danger',
      t('ics.delete_title'),
      t('ics.delete_description'),
      () => {
        void handleDeleteToken(token.id);
      }
    );
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text).then(() => {
      showAlert('success', t('link_copied'));
    }).catch(() => {
      showAlert('danger', t('copy_link_error'));
    });
  };

  const getWebcalUrl = (token: string) => {
    const url = `${VITE_API_URL}/api/calendar/${token}.ics`;
    return url.replace(/^https?:\/\//, 'webcal://');
  };

  // Gérer l'affichage du spinner global
  useEffect(() => {
    showLoading(loading, t('ics.loading_ics_tokens'));
  }, [loading, showLoading, t]);

  if (notFound) {
    return <NotFound />;
  }

  return (
    <div className="container mx-auto max-w-3xl">
      <div className="mb-4">
        <h4 className="mb-3 text-xl font-bold flex items-center gap-2">
          <Link2 className="h-5 w-5" />
          {t('ics.title')}
        </h4>
      </div>

      <Alert className="mb-4">
        <InfoIcon className="h-4 w-4" />
        <AlertDescription>
          <h5 className="font-semibold mb-1">{t('ics.info_title')}</h5>
          <p className="text-sm">{t('ics.info_description')}</p>
        </AlertDescription>
      </Alert>

      {tokens.map((token) => (
        <Card key={token.id} className="mb-3 shadow-sm">
          <CardContent>
            <div className="mb-3">
              <h5 className="flex items-center gap-2">
                <Link2 className="h-4 w-4" />
                {t('ics.token_label')}
              </h5>
            </div>
            <div className="flex mb-3">
              <Input
                type="text"
                className="flex-1 rounded-r-none border-2 border-green-500 focus-visible:ring-green-500"
                value={getWebcalUrl(token.token)}
                readOnly
                aria-label={t('ics.token_label')}
              />
              <Button
                variant="outline"
                size="icon"
                className="rounded-l-none border-green-500 text-green-600 hover:bg-green-50 dark:hover:bg-green-950"
                onClick={() => copyToClipboard(getWebcalUrl(token.token))}
                title={t('copy_link')}
                aria-label={t('copy_link')}
              >
                <Clipboard className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="icon"
                className="border-primary text-primary hover:bg-primary/5 ml-2"
                asChild
              >
                <a
                  href={getWebcalUrl(token.token)}
                  title={t('open')}
                  aria-label={t('open')}
                >
                  <ExternalLink className="h-4 w-4" />
                </a>
              </Button>
              <Button
                variant="outline"
                size="icon"
                className="border-destructive text-destructive hover:bg-destructive/10 ml-2"
                onClick={() => openDeleteActionSheet(token)}
                title={t('delete')}
                aria-label={t('delete')}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
            <div className="flex items-center gap-1 text-sm">
              <span className="text-muted-foreground">{t('creator')}:</span>
              <HoveredUserProfile
                user={{
                  photo_url: token.owner_photo_url,
                  display_name: token.owner_display_name,
                  email: token.owner_email,
                }}
                trigger={
                  <span className="text-muted-foreground">
                    {token.owner_display_name}
                  </span>
                }
              />
            </div>
          </CardContent>
        </Card>
      ))}

      <Button
        variant="outline"
        className="w-full mb-3"
        onClick={handleCreateToken}
        aria-label={t('ics.add_token')}
        title={t('ics.add_token')}
      >
        <PlusCircle className="h-4 w-4 mr-2" />
        {t('ics.add_token')}
      </Button>
    </div>
  );
}

export default IcsList;

