import { useTranslation } from 'react-i18next';
import HoveredUserProfile from '@/components/common/HoveredUserProfile';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Link2, Trash2, Clipboard, ExternalLink } from 'lucide-react';
import { getWebcalUrl } from '@/hooks/ics/useIcsList';
import type { IcsTokenEntry } from '@meditime/types';

interface IcsTokenCardProps {
  token: IcsTokenEntry;
  onDelete: (token: IcsTokenEntry) => void;
  onCopy: (text: string) => void;
}

function IcsTokenCard({ token, onDelete, onCopy }: IcsTokenCardProps) {
  const { t } = useTranslation();
  const webcalUrl = getWebcalUrl(token.token);

  return (
    <Card className="mb-3 shadow-sm">
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
            value={webcalUrl}
            readOnly
            aria-label={t('ics.token_label')}
          />
          <Button
            variant="outline"
            size="icon"
            className="rounded-l-none border-green-500 text-green-600 hover:bg-green-50 dark:hover:bg-green-950"
            onClick={() => onCopy(webcalUrl)}
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
              href={webcalUrl}
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
            onClick={() => onDelete(token)}
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
  );
}

export default IcsTokenCard;
