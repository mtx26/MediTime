import React, { useState, useEffect, useCallback, useSyncExternalStore } from 'react';
import PropTypes from 'prop-types';

// Store global synchrone pour chaque provider (pattern Zustand/Radix)
const stores = new Map();

function createLoadingStore(name) {
  const listeners = new Set();
  let state = new Map(); // Map<id, {message}>

  return {
    subscribe(listener) {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    getSnapshot() {
      return state;
    },
    update(id, condition, message) {
      const newState = new Map(state);
      if (condition) {
        newState.set(id, { message });
      } else {
        newState.delete(id);
      }
      state = newState;
      listeners.forEach(listener => listener());
    },
  };
}

function getStore(name = 'default') {
  if (!stores.has(name)) {
    stores.set(name, createLoadingStore(name));
  }
  return stores.get(name);
}

/**
 * Hook pour contrôler le loading (toujours disponible, aucun problème de timing)
 */
export function useLoading() {
  const componentId = React.useId();
  const activeKeys = React.useRef(new Map()); // Map<providerName, Set<keys>>

  useEffect(() => {
    return () => {
      // Cleanup au démontage
      activeKeys.current.forEach((keys, providerName) => {
        const store = getStore(providerName);
        keys.forEach(key => {
          store.update(`${componentId}-${key}`, false, '');
        });
      });
    };
  }, [componentId]);

  const showLoading = useCallback((condition, message = '', providerName = 'default') => {
    const key = 'main';
    const fullId = `${componentId}-${key}`;
    const store = getStore(providerName);

    // Tracking
    if (condition) {
      if (!activeKeys.current.has(providerName)) {
        activeKeys.current.set(providerName, new Set());
      }
      activeKeys.current.get(providerName).add(key);
    } else {
      const keys = activeKeys.current.get(providerName);
      if (keys) {
        keys.delete(key);
        if (keys.size === 0) {
          activeKeys.current.delete(providerName);
        }
      }
    }

    store.update(fullId, condition, message);
  }, [componentId]);

  return { showLoading };
}

/**
 * Provider de loading avec overlay
 * @param {string} name - Nom du provider (par défaut 'default')
 * @param {string} className - Classes Tailwind pour l'overlay
 */
export function LoadingProvider({ children, name = 'default', className = '' }) {
  const store = getStore(name);
  const loadingStates = useSyncExternalStore(
    store.subscribe,
    store.getSnapshot,
    store.getSnapshot
  );

  const isLoading = loadingStates.size > 0;
  const uniqueMessages = [...new Set(
    Array.from(loadingStates.values()).map(l => l.message).filter(Boolean)
  )];

  // Debug
  React.useEffect(() => {
    if (import.meta.env.DEV) {
      console.log(`[LoadingProvider ${name}] isLoading:`, isLoading, 'messages:', uniqueMessages);
    }
  }, [isLoading, name, uniqueMessages]);

  // Provider 'default' = fixed (plein écran), autres = absolute (scoped)
  const positionClass = name === 'default' ? 'fixed' : 'absolute';
  const backdropClass = name === 'default' ? 'bg-background/80 backdrop-blur-sm' : '';
  
  // Pour les providers locaux, appliquer className seulement pendant le loading
  const containerClass = name === 'default' 
    ? 'contents' 
    : isLoading 
      ? `relative w-full ${className}` 
      : 'relative w-full';

  return (
    <div className={containerClass}>
      {children}
      {isLoading && (
        <div
          className={`${positionClass} inset-0 ${backdropClass} z-50 flex items-center justify-center`}
          role="status"
          aria-live="polite"
          aria-busy={true}
          aria-label={uniqueMessages.join(', ') || 'Loading'}
        >
          <div className="flex flex-col items-center gap-3">
            <div 
              className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"
              aria-hidden="true"
            />
            {uniqueMessages.length > 0 && (
              <div className="flex flex-col items-center gap-1 max-w-xs">
                {uniqueMessages.map((msg, idx) => (
                  <p 
                    key={idx} 
                    className="text-xs text-muted-foreground text-center animate-in fade-in duration-200"
                  >
                    {msg}
                  </p>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

LoadingProvider.propTypes = {
  children: PropTypes.node.isRequired,
  name: PropTypes.string,
  className: PropTypes.string,
};
