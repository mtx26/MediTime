import { useEffect } from 'react';
import type { ArrowControlsProps } from '@meditime/types';

export default function ArrowControls({ onLeft, onRight }: ArrowControlsProps) {
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'ArrowLeft') {
        onLeft();
      } else if (event.key === 'ArrowRight') {
        onRight();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onLeft, onRight]);

  return null;
}
