/** Turns any thrown value (Error, Supabase error object, string) into a message safe to show a student. */
export function toMessage(error: unknown): string {
  const raw =
    error instanceof Error
      ? error.message
      : typeof error === 'object' && error !== null && 'message' in error
        ? String((error as { message: unknown }).message)
        : typeof error === 'string'
          ? error
          : '';

  if (/network request failed|failed to fetch|network error/i.test(raw)) {
    return 'No internet connection. Check your network and try again.';
  }
  return raw || 'Something went wrong. Please try again.';
}