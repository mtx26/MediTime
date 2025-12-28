import { useTranslation } from 'react-i18next';
import { useParams, Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { AlertTriangle, Home } from 'lucide-react';

function NotFound() {
  const { t } = useTranslation();
  const { lng } = useParams();

  return (
    <div className="flex items-center justify-center bg-background px-8">
      <div className="text-center max-w-2xl">
        <AlertTriangle className="h-24 w-24 text-destructive mx-auto mb-6" />
        
        <h1 className="text-6xl font-bold text-foreground mb-2">
          404
        </h1>
        
        <h2 className="text-3xl font-bold text-foreground mb-4">
          {t('not_found.title')}
        </h2>
        
        <p className="text-lg text-muted-foreground mb-8">
          {t('not_found.message')}
        </p>
        
        <div className="flex flex-col sm:flex-row justify-center gap-4">
          <Link to={`/${lng}/`}>
            <Button size="lg" className="gap-2">
              <Home className="h-4 w-4" />
              {t('home')}
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}

export default NotFound;
