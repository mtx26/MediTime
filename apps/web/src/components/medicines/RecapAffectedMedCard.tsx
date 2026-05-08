import { useTranslation } from 'react-i18next';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Pill, ArrowRight } from 'lucide-react';
import { TIME_OF_DAY_COLORS } from '@meditime/constants';
import type { MissedIntakesPreviewBox } from '@meditime/types';

interface RecapAffectedMedCardProps {
  box: MissedIntakesPreviewBox;
}

function RecapAffectedMedCard({ box }: RecapAffectedMedCardProps) {
  const { t } = useTranslation();

  return (
    <Card className="py-0">
      <CardContent className="px-4 py-2.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Pill className="size-4 text-muted-foreground" />
            <span className="font-medium text-sm">
              {box.name}{box.dose ? ` (${box.dose} mg)` : ''}
            </span>
          </div>
          <Badge variant="secondary" className="text-xs">+{box.tablets_to_add}</Badge>
        </div>
        <div className="flex items-center gap-3 mt-1.5 ml-6 text-xs text-muted-foreground">
          <span>{box.old_stock}</span>
          <ArrowRight className="size-3" />
          <span className="text-foreground font-medium">{box.new_stock}</span>
          {box.times_of_day.length > 0 && (
            <div className="flex gap-1 ml-auto">
              {box.times_of_day.map((time) => (
                <Badge key={time} variant="outline" className={`text-[10px] py-0 px-1 ${TIME_OF_DAY_COLORS[time] ?? ''}`}>
                  {t(time)}
                </Badge>
              ))}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

export default RecapAffectedMedCard;
