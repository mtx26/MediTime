import type { Href } from 'expo-router';

type CalendarNavigationRouter = {
  dismissTo: (href: Href) => void;
  replace: (href: Href) => void;
};

export function dismissToCalendars(router: CalendarNavigationRouter) {
  router.dismissTo('/calendars');
}

export function replaceToHome(router: CalendarNavigationRouter) {
  router.replace('/');
}
