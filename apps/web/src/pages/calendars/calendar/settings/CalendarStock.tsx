import { useTranslation } from 'react-i18next';
import { useCalendarStock } from '@/hooks/calendars/useCalendarStock';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Package } from 'lucide-react';
import { STOCK_DECREMENT_METHODS } from '@meditime/constants';
import type { CalendarStockProps, StockDecrementMethod } from '@meditime/types';

function Stock(props: CalendarStockProps) {
  const { t } = useTranslation();
  const { selectedMethod, modifyStockDecrementMethod } = useCalendarStock(props);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <Package className="h-5 w-5 text-primary" />
          <CardTitle>{t('calendar_settings.stock.label')}</CardTitle>
        </div>
        <CardDescription>{t('calendar_settings.stock.description')}</CardDescription>
      </CardHeader>
      <CardContent>
        <RadioGroup
          value={selectedMethod}
          onValueChange={(v) => modifyStockDecrementMethod(v as StockDecrementMethod)}
          data-tour="settings-stock-methods"
          className="space-y-3"
        >
          <label htmlFor="weeklyPillbox" className="flex items-start gap-3 p-4 border rounded-lg hover:bg-accent/50 transition cursor-pointer">
            <RadioGroupItem value={STOCK_DECREMENT_METHODS.WEEKLY_PILLBOX} id="weeklyPillbox" className="mt-1" />
            <div className="flex-1">
              <div className="font-semibold">{t('calendar_settings.stock.weekly.label')}</div>
              <p className="text-sm text-muted-foreground mt-1">{t('calendar_settings.stock.weekly.description')}</p>
            </div>
          </label>
          <label htmlFor="dailyMidnight" className="flex items-start gap-3 p-4 border rounded-lg hover:bg-accent/50 transition cursor-pointer">
            <RadioGroupItem value={STOCK_DECREMENT_METHODS.DAILY_MIDNIGHT} id="dailyMidnight" className="mt-1" />
            <div className="flex-1">
              <div className="font-semibold">{t('calendar_settings.stock.daily.label')}</div>
              <p className="text-sm text-muted-foreground mt-1">{t('calendar_settings.stock.daily.description')}</p>
            </div>
          </label>
        </RadioGroup>
      </CardContent>
    </Card>
  );
}

export default Stock;
