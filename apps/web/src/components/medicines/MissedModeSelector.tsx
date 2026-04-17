import { useTranslation } from 'react-i18next';
import { Card, CardContent } from '@/components/ui/card';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { CalendarDays, Pill } from 'lucide-react';
import type { MissedMode } from '@meditime/types';

interface MissedModeSelectorProps {
  mode: MissedMode;
  onModeChange: (mode: MissedMode) => void;
}

function MissedModeSelector({ mode, onModeChange }: MissedModeSelectorProps) {
  const { t } = useTranslation();

  return (
    <RadioGroup value={mode} onValueChange={(v) => onModeChange(v as MissedMode)} className="mb-4 grid grid-cols-2 gap-2">
      <Card className={`cursor-pointer transition-colors py-0 ${mode === 'intake' ? 'border-primary' : ''}`} onClick={() => onModeChange('intake')}>
        <CardContent className="flex items-center gap-2 px-3 py-2.5">
          <RadioGroupItem value="intake" id="mode-intake" />
          <CalendarDays className="size-4 text-muted-foreground" />
          <Label htmlFor="mode-intake" className="cursor-pointer font-medium text-sm">{t('missed_intakes.mode_intake')}</Label>
        </CardContent>
      </Card>
      <Card className={`cursor-pointer transition-colors py-0 ${mode === 'medication' ? 'border-primary' : ''}`} onClick={() => onModeChange('medication')}>
        <CardContent className="flex items-center gap-2 px-3 py-2.5">
          <RadioGroupItem value="medication" id="mode-med" />
          <Pill className="size-4 text-muted-foreground" />
          <Label htmlFor="mode-med" className="cursor-pointer font-medium text-sm">{t('missed_intakes.mode_medication')}</Label>
        </CardContent>
      </Card>
    </RadioGroup>
  );
}

export default MissedModeSelector;
