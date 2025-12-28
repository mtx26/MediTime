import React, { useEffect, useState } from 'react';

export default function ForcedLandscapeWrapper({ children }) {
  const [dimensions, setDimensions] = useState({
    width: window.innerWidth,
    height: window.innerHeight
  });

  const isPortrait = dimensions.height > dimensions.width;

  useEffect(() => {
    const handleResize = () => {
      setDimensions({
        width: window.innerWidth,
        height: window.innerHeight
      });
    };

    // Forcer l'orientation paysage via Screen Orientation API
    const lockOrientation = async () => {
      try {
        if (screen.orientation && screen.orientation.lock) {
          await screen.orientation.lock('landscape').catch(() => {
            // Silently fail if not supported or denied
          });
        }
      } catch (e) {
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
      
      // Déverrouiller l'orientation à la sortie
      if (screen.orientation && screen.orientation.unlock) {
        screen.orientation.unlock();
      }
    };
  }, []);

  if (isPortrait) {
    return (
      <div
        className="fixed bg-background z-1000 min-h-[100dvh] min-w-[100dvw] flex items-center justify-center"
        style={{
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
      className="fixed inset-0 bg-background z-1000"
    >
      {children}
    </div>
  );
}

