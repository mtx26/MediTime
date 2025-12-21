import { forwardRef, useImperativeHandle, useState } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import WeeklyEventContent from './WeeklyEventContent';
import PropTypes from 'prop-types';
import { useTranslation } from 'react-i18next';

const DateModal = forwardRef(
  ({ selectedDate, eventsForDay, onNext, onPrev, onSelectDate, getPastWeek, getNextWeek }, ref) => {
    const { t } = useTranslation();
    const [visible, setVisible] = useState(false);

    // 🔁 expose open() et close() vers le parent
    useImperativeHandle(ref, () => ({
      open: () => setVisible(true),
      close: () => setVisible(false),
    }));

    return (
      <Dialog.Root open={visible} onOpenChange={setVisible}>
        <Dialog.Portal>
          <Dialog.Overlay 
            className="position-fixed top-0 start-0 w-100 h-100 bg-dark bg-opacity-50"
            style={{ zIndex: 1050 }}
          />
          <Dialog.Content
            className="modal-dialog modal-dialog-centered position-fixed top-50 start-50 translate-middle"
            style={{ zIndex: 1051, maxWidth: '500px', width: '90%' }}
          >
            <div className="modal-content">
              <div className="modal-header">
                <Dialog.Title className="modal-title">
                  <i className="bi bi-calendar-date"></i>{' '}
                  {new Date(selectedDate).toLocaleDateString(t('locale'), {
                    weekday: 'long',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  })}
                </Dialog.Title>
                <Dialog.Close asChild>
                  <button
                    className="btn-close"
                    aria-label={t('close')}
                    title={t('close')}
                  ></button>
                </Dialog.Close>
              </div>
              <div className="modal-body">
                <WeeklyEventContent
                  ifModal={true}
                  selectedDate={selectedDate}
                  eventsForDay={eventsForDay}
                  onSelectDate={onSelectDate}
                  onNext={onNext}
                  onPrev={onPrev}
                  getPastWeek={getPastWeek}
                  getNextWeek={getNextWeek}
                />
              </div>
              <div className="modal-footer">
                <Dialog.Close asChild>
                  <button
                    className="btn btn-secondary"
                    aria-label={t('close')}
                    title={t('close')}
                  >
                    {t('close')}
                  </button>
                </Dialog.Close>
              </div>
            </div>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    );
  }
);

export default DateModal;

DateModal.propTypes = {
  selectedDate: PropTypes.string.isRequired,
  eventsForDay: PropTypes.array.isRequired,
  onNext: PropTypes.func.isRequired,
  onPrev: PropTypes.func.isRequired,
  onSelectDate: PropTypes.func.isRequired,
  getPastWeek: PropTypes.func.isRequired,
  getNextWeek: PropTypes.func.isRequired,
};
