export {};

declare global {
  interface Window {
    dataLayer: unknown[][];
  }

  const process: {
    env: Record<string, string | undefined>;
  };
}
