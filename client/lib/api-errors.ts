export function getApiErrorStatus(error: unknown, fallbackStatus = 400) {
  if (
    error instanceof Error &&
    /mongodb|mongo|persist|storage|connect/i.test(error.message)
  ) {
    return 503;
  }

  return fallbackStatus;
}

export function getApiErrorMessage(error: unknown, fallbackMessage: string) {
  return error instanceof Error ? error.message : fallbackMessage;
}
