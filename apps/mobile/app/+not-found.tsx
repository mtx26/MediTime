import { useEffect } from 'react';
import { usePathname, useRouter } from 'expo-router';
import NotFoundScreen from '../src/screens/general/NotFoundScreen';
import { toMobileHref } from '../src/utils/mobileRoutes';

export default function NotFoundPage() {
  const pathname = usePathname();
  const router = useRouter();
  const converted = toMobileHref(pathname);
  const needsRedirect = converted !== pathname;

  useEffect(() => {
    if (needsRedirect) {
      router.replace(converted as never);
    }
  }, [converted, needsRedirect, router]);

  if (needsRedirect) return null;
  return <NotFoundScreen />;
}
