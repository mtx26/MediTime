import { useTranslation } from 'react-i18next';
import type { HTMLAttributes } from 'react';
import type { TooltipRenderProps } from 'react-joyride';

export default function TourTooltip({
  continuous,
  index,
  step,
  backProps,
  closeProps,
  primaryProps,
  tooltipProps,
  skipProps,
  size,
}: TooltipRenderProps) {
  const { t } = useTranslation();

  return (
    <div
      {...(tooltipProps as unknown as HTMLAttributes<HTMLDivElement>)}
      className="card shadow"
      style={{ maxWidth: 400, width: '90vw', zIndex: 10000 }}
    >
      <div className="card-body">
        {step.title && <h5 className="card-title mb-3">{step.title}</h5>}
        <div className="card-text mb-4">{step.content}</div>
        <div className="d-flex justify-content-between align-items-center gap-2">
          <div className="d-flex align-items-center gap-2">
             {skipProps && (
                <button {...skipProps} className="btn btn-sm btn-link text-decoration-none text-muted p-0">
                  {t('tour.skip')}
                </button>
             )}
             <div className="text-muted small ms-2">
                {t('tour.step', { current: index + 1, total: size })}
             </div>
          </div>
          <div className="d-flex gap-2">
            {index > 0 && (
              <button {...backProps} className="btn btn-sm btn-outline-secondary">
                {t('tour.back')}
              </button>
            )}
            {continuous ? (
              <button {...primaryProps} className="btn btn-sm btn-primary">
                {index === size - 1 ? t('tour.last') : t('tour.next')}
              </button>
            ) : (
              <button {...closeProps} className="btn btn-sm btn-primary">
                {t('tour.close')}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
