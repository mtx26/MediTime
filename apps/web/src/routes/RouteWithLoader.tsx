import { useEffect, type ReactElement } from 'react';
import { useLoading } from '@/components/ui/loading';
import { useTranslation } from 'react-i18next';

export default function RouteWithLoader({ element, isLoading }: { element: ReactElement; isLoading: boolean }): ReactElement | null {
  const { showLoading } = useLoading() as { showLoading: (condition: boolean, message?: string) => void };
  const { t } = useTranslation();

  useEffect(() => {
    showLoading(isLoading, t('loading'));
  }, [isLoading, showLoading, t]);

  if (isLoading) return null;
  return element;
}
