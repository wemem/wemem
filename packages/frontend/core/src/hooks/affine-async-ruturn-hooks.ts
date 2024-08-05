import React from 'react';

export type AsyncReturnErrorHandler = (error: Error) => void;

/**
 * App should provide a global error handler for async callback in the root.
 */
export const AsyncReturnCallbackContext =
  React.createContext<AsyncReturnErrorHandler>(e => {
    console.error(e);
  });

/**
 * Translate async function to sync function and handle error automatically.
 * Can return data from the async function.
 */
export function useAsyncReturnCallback<T extends any[], R>(
  callback: (...args: T) => Promise<R>,
  deps: any[]
): (...args: T) => Promise<R | void> {
  const handleAsyncError = React.useContext(AsyncReturnCallbackContext);
  return React.useCallback(
    async (...args: any) => {
      try {
        return await callback(...args);
      } catch (e) {
        handleAsyncError(e as Error);
        return;
      }
    },
    [...deps] // eslint-disable-line react-hooks/exhaustive-deps
  );
}
