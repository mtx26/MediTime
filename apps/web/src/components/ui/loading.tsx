import { useCallback, useEffect, useId, useRef, useSyncExternalStore, type ReactNode } from "react";

type LoadingEntry = {
  message: string;
};

type LoadingState = Map<string, LoadingEntry>;

type LoadingStore = {
  subscribe: (listener: () => void) => () => void;
  getSnapshot: () => LoadingState;
  update: (id: string, condition: boolean, message: string) => void;
};

// Store global synchrone pour chaque provider (pattern Zustand/Radix)
const stores = new Map<string, LoadingStore>();

function createLoadingStore(): LoadingStore {
  const listeners = new Set<() => void>();
  let state: LoadingState = new Map(); // Map<id, {message}>

  return {
    subscribe(listener) {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    getSnapshot() {
      return state;
    },
    update(id, condition, message) {
      const newState: LoadingState = new Map(state);
      if (condition) {
        newState.set(id, { message });
      } else {
        newState.delete(id);
      }
      state = newState;
      listeners.forEach((listener) => listener());
    },
  };
}

function getStore(name = "default"): LoadingStore {
  let store = stores.get(name);
  if (!store) {
    store = createLoadingStore();
    stores.set(name, store);
  }
  return store;
}

/**
 * Hook pour contrôler le loading (toujours disponible, aucun problème de timing)
 */
export function useLoading() {
  const componentId = useId();
  const activeKeys = useRef<Map<string, Set<string>>>(new Map()); // Map<providerName, Set<keys>>

  useEffect(() => {
    return () => {
      // Cleanup au démontage
      activeKeys.current.forEach((keys, providerName) => {
        const store = getStore(providerName);
        keys.forEach((key) => {
          store.update(`${componentId}-${key}`, false, "");
        });
      });
    };
  }, [componentId]);

  const showLoading = useCallback(
    (condition: boolean, message = "", providerName = "default") => {
      const key = "main";
      const fullId = `${componentId}-${key}`;
      const store = getStore(providerName);

      // Tracking
      if (condition) {
        if (!activeKeys.current.has(providerName)) {
          activeKeys.current.set(providerName, new Set());
        }
        activeKeys.current.get(providerName)?.add(key);
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
    },
    [componentId],
  );

  return { showLoading };
}

type LoadingProviderProps = {
  children: ReactNode;
  name?: string;
  className?: string;
};

/**
 * Provider de loading avec overlay
 * @param name Nom du provider (par défaut 'default')
 * @param className Classes Tailwind pour l'overlay
 */
export function LoadingProvider({ children, name = "default", className = "" }: LoadingProviderProps) {
  const store = getStore(name);
  const loadingStates = useSyncExternalStore(store.subscribe, store.getSnapshot, store.getSnapshot);

  const isLoading = loadingStates.size > 0;
  const uniqueMessages = [...new Set(Array.from(loadingStates.values()).map((l) => l.message).filter(Boolean))];

  // Provider 'default' = fixed (plein écran), autres = absolute (scoped)
  const positionClass = name === "default" ? "fixed" : "absolute";
  const backdropClass = name === "default" ? "bg-background/80 backdrop-blur-sm" : "";

  // Pour les providers locaux, appliquer className seulement pendant le loading
  const containerClass = name === "default" ? "relative w-full" : isLoading ? `relative w-full ${className}` : "relative w-full";

  return (
    <div className={containerClass}>
      {children}
      {isLoading && (
        <div
          className={`${positionClass} inset-0 ${backdropClass} z-10000 flex items-center justify-center`}
          role="status"
          aria-live="polite"
          aria-busy={true}
          aria-label={uniqueMessages.join(", ") || "Loading"}
        >
          <div className="flex flex-col items-center gap-3">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" aria-hidden="true" />
            {uniqueMessages.length > 0 && (
              <div className="flex flex-col items-center gap-1 max-w-xs">
                {uniqueMessages.map((msg, idx) => (
                  <p key={`${msg}-${idx}`} className="text-xs text-muted-foreground text-center animate-in fade-in duration-200">
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