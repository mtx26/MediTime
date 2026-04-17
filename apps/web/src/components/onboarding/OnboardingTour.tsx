import { useState, useEffect, useCallback, useContext } from 'react';
import Joyride, { ACTIONS, EVENTS, STATUS, type CallBackProps } from 'react-joyride';
import { useTranslation } from 'react-i18next';
import { useNavigate, useParams } from 'react-router-dom';
import { UserContext } from '../../contexts/UserContext';
import TourTooltip from './TourTooltip';
import { getTourSteps } from './tourSteps';

interface OnboardingTourProps {
  isAppLoading: boolean;
}

const OnboardingTour = ({ isAppLoading }: OnboardingTourProps) => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { lng } = useParams();
  const userContext = useContext(UserContext);
  const userInfo = userContext?.userInfo ?? null;
  
  const [run, setRun] = useState(false);
  const [stepIndex, setStepIndex] = useState(0);
  const [waitingForStep, setWaitingForStep] = useState<number | null>(null);

  // Check if tour has been completed
  useEffect(() => {
    const tourCompleted = localStorage.getItem('meditime_tour_completed_v1');
    //const tourCompleted = false
    if (!tourCompleted && !isAppLoading && userInfo) {
      setRun(true);
    }
  }, [isAppLoading, userInfo]);

  const steps = getTourSteps(t);

  const ensureActionSheetOpen = useCallback((selector: string) => {
    const btn = document.querySelector(selector);
    if (btn) {
      const isMenuOpen = btn.parentNode?.querySelector('.dropdown-menu') !== null;
      if (!isMenuOpen) {
        (btn as HTMLElement).click();
      }
    }
  }, []);

  const handleNextStep = useCallback((currentIndex: number, nextIndex: number) => {
    const transitions: Record<number, string> = {
      0: `/${lng}/calendars`,
      1: `/${lng}/add-calendar`,
      4: `/${lng}/calendar/demo`,
      6: `/${lng}/calendar/demo/boxes`,
      10: `/${lng}/calendar/demo`,
      15: `/${lng}/calendar/demo/settings`,
      17: `/${lng}/calendar/demo/settings?tab=notifications`,
      18: `/${lng}/calendar/demo`,
      19: `/${lng}/shared-calendars?calendar=demo`,
      23: `/${lng}/calendar/demo`,
      25: `/${lng}/calendar/demo/stock-alerts`,
      28: `/${lng}/calendar/demo`,
      29: `/${lng}/calendars`,
    };

    if (transitions[currentIndex]) {
        setRun(false); // Pause tour
        navigate(transitions[currentIndex]);
        setWaitingForStep(nextIndex);
        return;
    }

    if ([15, 19, 24, 25, 29].includes(nextIndex)) {
        ensureActionSheetOpen('[data-tour="calendar-actions-btn"]');
        setRun(false);
        setWaitingForStep(nextIndex);
        return;
    }

    if ([27, 28].includes(nextIndex)) {
        ensureActionSheetOpen('[data-tour="stock-alerts-actions-btn"]');
        setRun(false);
        setWaitingForStep(nextIndex);
        return;
    }

    setStepIndex(nextIndex);
  }, [lng, navigate, ensureActionSheetOpen]);

  const handleJoyrideCallback = useCallback((data: CallBackProps) => {
    const { action, index, status, type } = data;

    if (([STATUS.FINISHED, STATUS.SKIPPED] as string[]).includes(status)) {
      setRun(false);
      localStorage.setItem('meditime_tour_completed_v1', 'true');
      return;
    }

    if (type !== EVENTS.STEP_AFTER && type !== EVENTS.TARGET_NOT_FOUND) {
      return;
    }

    const nextIndex = index + (action === ACTIONS.PREV ? -1 : 1);
    
    if (action === ACTIONS.PREV) {
        setStepIndex(nextIndex);
        return;
    }

    handleNextStep(index, nextIndex);
  }, [handleNextStep]);

  // Poll for element existence when waiting for a step
  useEffect(() => {
      if (waitingForStep === null || typeof waitingForStep !== 'number') return;
      if (waitingForStep < 0 || waitingForStep >= steps.length) return;

      const targetStep = steps[waitingForStep];
      if (!targetStep) return;

      const targetSelector = targetStep.target;
      if (typeof targetSelector !== 'string') return;

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
          // Check if we need to open the menu for steps 15, 19, 24, 25, 29 (Calendar View)
          if ([15, 19, 24, 25, 29].includes(waitingForStep)) {
             ensureActionSheetOpen('[data-tour="calendar-actions-btn"]');
          }
          // Check if we need to open the menu for step 27, 28 (Stock Alerts View)
          if ([27, 28].includes(waitingForStep)) {
             ensureActionSheetOpen('[data-tour="stock-alerts-actions-btn"]');
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
      tooltipComponent={TourTooltip}
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
