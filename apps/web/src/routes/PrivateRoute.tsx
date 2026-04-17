import { useContext, type ReactElement } from 'react';
import { Navigate, useLocation, useParams } from 'react-router-dom';
import { UserContext } from '../contexts/UserContext';

function buildFullPath(loc: { pathname?: string; search?: string; hash?: string }): string {
  const path = loc.pathname || '/';
  const qs = loc.search || '';
  const hash = loc.hash || '';
  return `${path}${qs}${hash}`;
}

export default function PrivateRoute({ element }: { element: ReactElement }): ReactElement {
  const context = useContext(UserContext);
  const userInfo = context?.userInfo;
  const location = useLocation();
  const { lng } = useParams();

  if (!userInfo) {
    const full = buildFullPath(location);
    return <Navigate to={`/${lng}/login?redirect=${encodeURIComponent(full)}`} replace />;
  }
  return element;
}
