import { DemoReadOnlyError, StorageUnavailableError } from './storage';

export function getApiErrorStatus(error: unknown, fallbackStatus = 400) {
  if (error instanceof DemoReadOnlyError) {
    return 503;
  }

  if (error instanceof StorageUnavailableError) {
    return 503;
  }

  return fallbackStatus;
}

export function getApiErrorMessage(error: unknown, fallbackMessage: string) {
  return error instanceof Error ? error.message : fallbackMessage;
}
