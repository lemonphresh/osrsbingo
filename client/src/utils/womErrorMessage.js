export const WOM_ERROR_TOAST_DURATION = 8000;

export function getWomErrorMessage(error) {
  const graphMessages = error?.graphQLErrors?.map((entry) => entry.message).join(' ') ?? '';
  const networkStatus =
    error?.networkError?.statusCode ??
    error?.networkError?.response?.status ??
    error?.statusCode ??
    null;
  const message = [error?.message, graphMessages, error?.networkError?.message]
    .filter(Boolean)
    .join(' ');

  if (
    networkStatus === 504 ||
    /\b504\b|timed? out|timeout|abort(?:ed)?|H12/i.test(message)
  ) {
    return 'The player-stat request timed out before the server finished. Nothing was changed. The list is now loaded in smaller batches, so retrying should preserve progress and avoid another timeout.';
  }

  if (
    [502, 503].includes(networkStatus) ||
    /received status code 50[23]|HTTP 50[23]|bad gateway|service unavailable/i.test(message)
  ) {
    return 'The OSRS Bingo server or Wise Old Man is temporarily unavailable. Nothing was changed. Wait a moment, then retry.';
  }

  if (/cannot query field|unknown argument|validation error/i.test(message)) {
    return 'The app and server versions are temporarily out of sync. Refresh the page, then try again.';
  }

  if (/yearly gains.*unavailable|yearly.*temporarily unavailable/i.test(message)) {
    return 'Wise Old Man could not provide yearly EHP/EHB right now. Because those stats affect this balance, nothing was changed. Try again shortly.';
  }

  if (/\b429\b|rate[ -]?limit/i.test(message)) {
    return 'Wise Old Man is rate-limiting requests right now. No players were marked missing and nothing was changed. Wait about a minute, then try again.';
  }

  if (/WOM|Wise Old Man|network|fetch/i.test(message)) {
    return 'Wise Old Man is temporarily unavailable. Your player data was not changed. Try again shortly.';
  }

  return 'The player-stat request failed before any results came back. Nothing was changed. Try again shortly.';
}
