import React, { createContext, useContext, useState, useId, useCallback, useMemo, useEffect } from 'react';
import PropTypes from 'prop-types';

const LoadingContext = createContext();

/**
 * Hook pour accéder au contexte de chargement
 * @returns {Object} { showLoading }
 */
export function useLoading() {
  const context = useContext(LoadingContext);
  const componentId = useId();
  
  if (!context) {
    throw new Error('useLoading doit être utilisé dans un LoadingProvider');
  }

  // Cleanup automatique au démontage du composant
  useEffect(() => {
    return () => {
      context.updateLoading(componentId, false, '', '60vh');
    };
  }, [componentId, context]);

  const showLoading = useCallback((condition, message = '', height = '60vh') => {
    context.updateLoading(componentId, condition, message, height);
  }, [componentId, context]);

  return { showLoading };
}

/**
 * Provider pour gérer l'état de chargement global avec overlay
 */
export function LoadingProvider({ children }) {
  const [loadingStates, setLoadingStates] = useState(new Map());

  const updateLoading = useCallback((id, condition, message, height) => {
    setLoadingStates(prev => {
      const newStates = new Map(prev);
      if (condition) {
        newStates.set(id, { message, height });
      } else {
        newStates.delete(id);
      }
      return newStates;
    });
  }, []);

  const contextValue = useMemo(() => ({ updateLoading }), [updateLoading]);

  // Récupérer le premier état de chargement actif
  const firstLoading = loadingStates?.size > 0 ? Array.from(loadingStates.values())?.[0] : null;
  const isLoading = loadingStates?.size > 0;

  return (
    <LoadingContext.Provider value={contextValue}>
      {children}
      {isLoading && firstLoading && (
        <div 
          className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center"
          style={{ minHeight: firstLoading?.height }}
        >
          <div className="flex flex-col items-center gap-2">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            {firstLoading?.message && (
              <p className="text-sm text-muted-foreground">{firstLoading.message}</p>
            )}
          </div>
        </div>
      )}
    </LoadingContext.Provider>
  );
}

LoadingProvider.propTypes = {
  children: PropTypes.node.isRequired,
};
