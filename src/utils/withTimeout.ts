const DEFAULT_TIMEOUT_MS = 15000;

/** Rejects if a request hangs, so a dead connection surfaces as a retryable error instead of a frozen spinner. */
export function withTimeout<T>(request: PromiseLike<T>, ms = DEFAULT_TIMEOUT_MS): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const timer = setTimeout(
      () => reject(new Error('The request timed out. Check your connection and try again.')),
      ms,
    );
    request.then(
      (value) => {
        clearTimeout(timer);
        resolve(value);
      },
      (error) => {
        clearTimeout(timer);
        reject(error);
      },
    );
  });
}