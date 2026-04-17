import { useTranslation } from 'react-i18next';
import { useIcsList } from '@/hooks/ics/useIcsList';
import IcsTokenCard from '@/components/ics/IcsTokenCard';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Link2, InfoIcon, PlusCircle } from 'lucide-react';
import NotFound from '@/pages/general/NotFound';
import type { IcsListPageProps } from '@meditime/types';


function IcsList(props: IcsListPageProps) {
  const { t } = useTranslation();
  const { tokens, notFound, handleCreateToken, openDeleteActionSheet, copyToClipboard } = useIcsList(props);

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
        <IcsTokenCard
          key={token.id}
          token={token}
          onDelete={openDeleteActionSheet}
          onCopy={copyToClipboard}
        />
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

