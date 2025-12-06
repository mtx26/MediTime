import React, { useState, useEffect, useCallback } from 'react';
import Joyride, { ACTIONS, EVENTS, STATUS } from 'react-joyride';
import { useTranslation } from 'react-i18next';
import { useNavigate, useLocation, useParams } from 'react-router-dom';

const Tooltip = ({
  continuous,
  index,
  step,
  backProps,
  closeProps,
  primaryProps,
  tooltipProps,
  skipProps,
  size,
}) => {
  const { t } = useTranslation();

  return (
    <div {...tooltipProps} className="card shadow" style={{ maxWidth: 400, zIndex: 10000 }}>
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
};

const OnboardingTour = ({ isAppLoading }) => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const { lng } = useParams();
  
  const [run, setRun] = useState(false);
  const [stepIndex, setStepIndex] = useState(0);
  const [waitingForStep, setWaitingForStep] = useState(null);

  // Check if tour has been completed
  useEffect(() => {
    // const tourCompleted = localStorage.getItem('meditime_tour_completed');
    const tourCompleted = false; // For testing purposes, always show the tour
    if (!tourCompleted && !isAppLoading) {
      setRun(true);
    }
  }, [isAppLoading]);

  const steps = [
    // 0. Welcome (Dashboard)
    {
      target: 'body',
      content: t('tour.welcome_content'),
      title: t('tour.welcome_title'),
      placement: 'center',
      disableBeacon: true,
    },
    // 1. Add Calendar Button (Dashboard)
    {
      target: '[data-tour="add-calendar-btn"]',
      content: t('tour.add_calendar_content'),
      title: t('tour.add_calendar_title'),
      disableBeacon: true,
    },
    // 2. Name Input (Add Page)
    {
      target: '[data-tour="calendar-name-input"]',
      content: t('tour.calendar_name_content'),
      title: t('tour.calendar_name_title'),
      disableBeacon: true,
    },
    // 3. Import Type (Add Page)
    {
      target: '[data-tour="import-type-select"]',
      content: t('tour.import_type_content'),
      title: t('tour.import_type_title'),
      disableBeacon: true,
    },
    // 4. Submit (Add Page)
    {
      target: '[data-tour="submit-calendar-btn"]',
      content: t('tour.submit_calendar_content'),
      title: t('tour.submit_calendar_title'),
      disableBeacon: true,
    },
    // 5. Go to Calendar (Transition)
    {
      target: 'body',
      content: t('tour.go_to_calendar_content'),
      title: t('tour.go_to_calendar_title'),
      placement: 'center',
      disableBeacon: true,
    },
    // 6. Medicines Button (Calendar View)
    {
      target: '[data-tour="nav-medicines-btn"]',
      content: t('tour.medicines_btn_content'),
      title: t('tour.medicines_btn_title'),
      disableBeacon: true,
    },
    // 7. Stock Intro (Boxes View)
    {
      target: '[data-tour="stock-view-title"]',
      content: t('tour.stock_intro_content'),
      title: t('tour.stock_intro_title'),
      placement: 'bottom',
      disableBeacon: true,
    },
    // 8. Add Manual (Boxes View)
    {
      target: '[data-tour="add-manual-btn"]',
      content: t('tour.add_manual_content'),
      title: t('tour.add_manual_title'),
      disableBeacon: true,
    },
    // 9. Add QR (Boxes View)
    {
      target: '[data-tour="add-qr-btn"]',
      content: t('tour.add_qr_content'),
      title: t('tour.add_qr_title'),
      disableBeacon: true,
    },
    // 10. Box Condition (Boxes View)
    {
      target: '[data-tour="box-condition-toggle"]',
      content: t('tour.box_condition_content'),
      title: t('tour.box_condition_title'),
      disableBeacon: true,
    },
    // 11. Calendar Grid (Desktop)
    {
      target: '[data-tour="calendar-grid-desktop"]',
      content: t('tour.calendar_grid_content'),
      title: t('tour.calendar_grid_title'),
      placement: 'left',
      disableBeacon: true,
    },
    // 11. Week Selector
    {
      target: '[data-tour="calendar-week-selector"]',
      content: t('tour.week_selector_content'),
      title: t('tour.week_selector_title'),
      disableBeacon: true,
    },
    // 12. Actions (Calendar View)
    {
      target: '[data-tour="calendar-actions-btn"]',
      content: t('tour.calendar_actions_content'),
      title: t('tour.calendar_actions_title'),
      disableBeacon: true,
    },
    // 13. Settings
    {
      target: '[data-tour="calendar-settings-btn"]',
      content: t('tour.settings_btn_content'),
      title: t('tour.settings_btn_title'),
      disableBeacon: true,
    },
    // 14. Settings Page (Demo)
    {
      target: 'body',
      content: t('tour.settings_page_content'),
      title: t('tour.settings_page_title'),
      placement: 'center',
      disableBeacon: true,
    },
    // 15. Stock Settings Tab
    {
      target: '[data-tour="settings-stock-methods"]',
      content: t('tour.stock_settings_content'),
      title: t('tour.stock_settings_title'),
      disableBeacon: true,
    },
    // 16. Notifications Settings Tab
    {
      target: '[data-tour="settings-notifications-toggle"]',
      content: t('tour.notifications_settings_content'),
      title: t('tour.notifications_settings_title'),
      disableBeacon: true,
    },
    // 17. Share Calendar
    {
      target: '[data-tour="share-calendar-btn"]',
      content: t('tour.share_btn_content'),
      title: t('tour.share_btn_title'),
      disableBeacon: true,
    },
    // 18. Share Page (Demo)
    {
      target: 'body',
      content: t('tour.share_page_content'),
      title: t('tour.share_page_title'),
      placement: 'center',
      disableBeacon: true,
    },
    // 19. Public Links
    {
      target: '[data-tour="share-public-links"]',
      content: t('tour.public_links_content'),
      title: t('tour.public_links_title'),
      disableBeacon: true,
    },
    // 20. Shared Users
    {
      target: '[data-tour="share-users-list"]',
      content: t('tour.shared_users_content'),
      title: t('tour.shared_users_title'),
      disableBeacon: true,
    },
    // 21. Invite User
    {
      target: '[data-tour="share-invite-user-form"]',
      content: t('tour.invite_user_content'),
      title: t('tour.invite_user_title'),
      disableBeacon: true,
    },
    // 22. Export PDF
    {
      target: '[data-tour="export-pdf-btn"]',
      content: t('tour.export_pdf_content'),
      title: t('tour.export_pdf_title'),
      disableBeacon: true,
    },
    // 23. Stock Alerts
    {
      target: '[data-tour="stock-alerts-btn"]',
      content: t('tour.stock_alerts_content'),
      title: t('tour.stock_alerts_title'),
      disableBeacon: true,
    },
    // 24. Stock Alerts Page (Demo)
    {
      target: 'body',
      content: t('tour.stock_alerts_page_content'),
      title: t('tour.stock_alerts_page_title'),
      placement: 'center',
      disableBeacon: true,
    },
    // 25. Send SMS
    {
      target: '[data-tour="send-sms-btn"]',
      content: t('tour.send_sms_content'),
      title: t('tour.send_sms_title'),
      disableBeacon: true,
    },
    // 26. ICS Calendar
    {
      target: '[data-tour="ics-calendar-btn"]',
      content: t('tour.ics_calendar_content'),
      title: t('tour.ics_calendar_title'),
      disableBeacon: true,
    },
    // 27. Pillbox History
    {
      target: '[data-tour="pillbox-history-btn"]',
      content: t('tour.pillbox_history_content'),
      title: t('tour.pillbox_history_title'),
      disableBeacon: true,
    }
  ];

  const handleJoyrideCallback = useCallback((data) => {
    const { action, index, status, type } = data;

    if ([STATUS.FINISHED, STATUS.SKIPPED].includes(status)) {
      setRun(false);
      localStorage.setItem('meditime_tour_completed', 'true');
    } else if (type === EVENTS.STEP_AFTER || type === EVENTS.TARGET_NOT_FOUND) {
      const nextIndex = index + (action === ACTIONS.PREV ? -1 : 1);
      
      if (action === ACTIONS.PREV) {
          setStepIndex(nextIndex);
          return;
      }

      // Define transitions requiring navigation
      let shouldNavigate = false;
      let nextPath = '';

      // 0 -> 1: Go to Calendars list
      if (index === 0) {
          shouldNavigate = true;
          nextPath = `/${lng}/calendars`;
      }
      // 1 -> 2: Go to Add Calendar
      else if (index === 1) {
          shouldNavigate = true;
          nextPath = `/${lng}/add-calendar`;
      }
      // 4 -> 5: Go to Calendar View (Demo)
      else if (index === 4) {
          shouldNavigate = true;
          nextPath = `/${lng}/calendar/demo`;
      }
      // 6 -> 7: Go to Medicines Page (Boxes View)
      else if (index === 6) {
          shouldNavigate = true;
          nextPath = `/${lng}/calendar/demo/boxes`;
      }
      // 10 -> 11: Go back to Calendar View
      else if (index === 10) {
          shouldNavigate = true;
          nextPath = `/${lng}/calendar/demo`;
      }
      // 14 -> 15: Go to Settings Page
      else if (index === 14) {
          shouldNavigate = true;
          nextPath = `/${lng}/calendar/demo/settings`;
      }
      // 15 -> 16: Switch to Notifications Tab
      else if (index === 16) {
          shouldNavigate = true;
          nextPath = `/${lng}/calendar/demo/settings?tab=notifications`;
      }
      // 17 -> 18: Go back to Calendar View
      else if (index === 17) {
          shouldNavigate = true;
          nextPath = `/${lng}/calendar/demo`;
      }
      // 18 -> 19: Go to Share Page
      else if (index === 18) {
          shouldNavigate = true;
          nextPath = `/${lng}/shared-calendars?calendar=demo`;
      }
      // 22 -> 23: Go back to Calendar View
      else if (index === 22) {
          shouldNavigate = true;
          nextPath = `/${lng}/calendar/demo`;
      }
      // 24 -> 25: Go to Stock Alerts Page
      else if (index === 24) {
          shouldNavigate = true;
          nextPath = `/${lng}/calendar/demo/stock-alerts`;
      }
      // 27 -> 28: Go back to Calendar View
      else if (index === 27) {
          shouldNavigate = true;
          nextPath = `/${lng}/calendar/demo`;
      }

      if (shouldNavigate) {
          setRun(false); // Pause tour
          navigate(nextPath);
          setWaitingForStep(nextIndex);
      } else if ([14, 18, 23, 24, 28].includes(nextIndex)) {
          // Ensure ActionSheet is open for steps inside it (Calendar View)
          const btn = document.querySelector('[data-tour="calendar-actions-btn"]');
          if (btn) {
            const isMenuOpen = btn.parentNode.querySelector('.dropdown-menu') !== null;
            if (!isMenuOpen) {
              btn.click();
            }
          }
          setRun(false);
          setWaitingForStep(nextIndex);
      } else if ([26, 27].includes(nextIndex)) {
          // Ensure ActionSheet is open for steps inside it (Stock Alerts View)
          const btn = document.querySelector('[data-tour="stock-alerts-actions-btn"]');
          if (btn) {
            const isMenuOpen = btn.parentNode.querySelector('.dropdown-menu') !== null;
            if (!isMenuOpen) {
              btn.click();
            }
          }
          setRun(false);
          setWaitingForStep(nextIndex);
      } else {
          setStepIndex(nextIndex);
      }
    }
  }, [navigate, lng]);

  // Poll for element existence when waiting for a step
  useEffect(() => {
      if (waitingForStep === null) return;

      const targetStep = steps[waitingForStep];
      const targetSelector = targetStep.target;

      // If target is body, we just assume it's ready immediately after a small delay
      if (targetSelector === 'body') {
          const timer = setTimeout(() => {
              setStepIndex(waitingForStep);
              setRun(true);
              setWaitingForStep(null);
          }, 500);
          return () => clearTimeout(timer);
      }

      const intervalId = setInterval(() => {
          // Check if we need to open the menu for steps 14, 18, 23, 24, 28 (Calendar View)
          if ([14, 18, 23, 24, 28].includes(waitingForStep)) {
             const btn = document.querySelector('[data-tour="calendar-actions-btn"]');
             if (btn) {
                const isMenuOpen = btn.parentNode.querySelector('.dropdown-menu') !== null;
                if (!isMenuOpen) {
                  btn.click();
                }
             }
          }
          // Check if we need to open the menu for step 26, 27 (Stock Alerts View)
          if ([26, 27].includes(waitingForStep)) {
             const btn = document.querySelector('[data-tour="stock-alerts-actions-btn"]');
             if (btn) {
                const isMenuOpen = btn.parentNode.querySelector('.dropdown-menu') !== null;
                if (!isMenuOpen) {
                  btn.click();
                }
             }
          }

          const element = document.querySelector(targetSelector);
          if (element) {
              clearInterval(intervalId);
              setStepIndex(waitingForStep);
              setRun(true);
              setWaitingForStep(null);
          }
      }, 200); // Check every 200ms

      // Safety timeout (10s)
      const timeoutId = setTimeout(() => {
          clearInterval(intervalId);
          // Force proceed anyway or handle error? 
          // Let's proceed, Joyride might handle the missing target or we just show it.
          setStepIndex(waitingForStep);
          setRun(true);
          setWaitingForStep(null);
      }, 10000);

      return () => {
          clearInterval(intervalId);
          clearTimeout(timeoutId);
      };
  }, [waitingForStep, steps]);

  return (
    <Joyride
      steps={steps}
      run={run}
      stepIndex={stepIndex}
      continuous
      showProgress
      showSkipButton
      callback={handleJoyrideCallback}
      tooltipComponent={Tooltip}
      styles={{
        options: {
          primaryColor: '#0d6efd',
          zIndex: 10000,
        },
      }}
      scrollOffset={100}
    />
  );
};

export default OnboardingTour;
