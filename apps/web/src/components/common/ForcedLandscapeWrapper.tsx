import { useEffect, useState, type ReactNode } from 'react';
import type { ForcedLandscapeWrapperProps } from '@meditime/types';

interface ViewportDimensions {
  width: number;
  height: number;
}

function getViewportDimensions(): ViewportDimensions {
  return {
    width: window.innerWidth,
    height: window.innerHeight,
  };
}

type OrientationWithLock = ScreenOrientation & {
  lock?: (orientation: 'any' | 'landscape' | 'portrait' | 'portrait-primary' | 'portrait-secondary' | 'landscape-primary' | 'landscape-secondary') => Promise<void>;
  unlock?: () => void;
};

export default function ForcedLandscapeWrapper({ children }: ForcedLandscapeWrapperProps<ReactNode>) {
  const [dimensions, setDimensions] = useState<ViewportDimensions>(getViewportDimensions);

  const isPortrait = dimensions.height > dimensions.width;

  useEffect(() => {
    const handleResize = () => {
      setDimensions(getViewportDimensions());
    };

    // Forcer l'orientation paysage via Screen Orientation API
    const lockOrientation = async () => {
      const orientation = screen.orientation as OrientationWithLock;
      try {
        if (orientation?.lock) {
          await orientation.lock('landscape').catch(() => {
            // Silently fail if not supported or denied
          });
        }
      } catch {
        // API non supportée
      }
    };

    // Bloquer le scroll du body
    document.body.style.overflow = 'hidden';

    lockOrientation();
    window.addEventListener('resize', handleResize);
    window.addEventListener('orientationchange', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('orientationchange', handleResize);
      
      // Restaurer le scroll du body
      document.body.style.overflow = '';

      const orientation = screen.orientation as OrientationWithLock;
      
      // Déverrouiller l'orientation à la sortie
      if (orientation?.unlock) {
        orientation.unlock();
      }
    };
  }, []);

  if (isPortrait) {
    return (
      <div
        className="fixed bg-background z-30"
        style={{
          width: '100vh',
          height: '100vw',
          transform: 'rotate(90deg)',
          transformOrigin: 'left top',
          top: 0,
          left: '100%',
          overflowX: 'hidden',
        }}
      >
        {children}
      </div>
    );
  }

  // Déjà en paysage - utiliser tout l'écran disponible
  return (
    <div
      className="fixed inset-0 bg-background z-30"
    >
      {children}
    </div>
  );
}

