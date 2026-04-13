import { useEffect } from 'react';
import { useLoading } from '@/components/ui/loading';
import { useTranslation } from 'react-i18next';

export default function SuspenseFallback(): null {
  const { showLoading } = useLoading() as { showLoading: (condition: boolean, message?: string) => void };
  const { t } = useTranslation();

  useEffect(() => {
    showLoading(true, t('loading'));
    return () => showLoading(false, '');
  }, [showLoading, t]);

  return null;
}
