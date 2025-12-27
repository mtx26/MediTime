import React, { useEffect, useState } from 'react';

export default function ForcedLandscapeWrapper({ children }) {
  const [viewportWidth, setViewportWidth] = useState(window.innerWidth);
  const [viewportHeight, setViewportHeight] = useState(window.innerHeight);

  const isPortrait = viewportHeight > viewportWidth;

  useEffect(() => {
    const handleResize = () => {
      setViewportWidth(window.innerWidth);
      setViewportHeight(window.innerHeight);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  if (isPortrait) {
    return (
      <div
        className="fixed top-0 left-0 bg-background overflow-auto z-1000 rotate-90 origin-top-left"
        style={{
          width: viewportHeight,
          height: viewportWidth,
          transform: `translateX(${viewportWidth}px) rotate(90deg)`,
        }}
      >
        {children}
      </div>
    );
  }

  return <>{children}</>;
}
