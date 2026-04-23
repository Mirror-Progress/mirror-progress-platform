import { mkdir, readFile, rename, writeFile } from 'fs/promises';
import path from 'path';
import { isDemoReadOnlyMode } from './app-runtime';

const writeQueues = new Map<string, Promise<void>>();

export class StorageUnavailableError extends Error {
  constructor(message = 'Persistent JSON storage is unavailable in this deployment.') {
    super(message);
    this.name = 'StorageUnavailableError';
  }
}

export class DemoReadOnlyError extends Error {
  constructor(message = 'This deployment is running in read-only demo mode.') {
    super(message);
    this.name = 'DemoReadOnlyError';
  }
}

export const dataDir = path.join(process.cwd(), 'data');

function isMissingFileError(error: unknown) {
  return (
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    (error as NodeJS.ErrnoException).code === 'ENOENT'
  );
}

function isWritePermissionError(error: unknown) {
  return (
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    ['EROFS', 'EACCES', 'EPERM'].includes((error as NodeJS.ErrnoException).code ?? '')
  );
}

function withQueuedWrite(filePath: string, task: () => Promise<void>) {
  const previous = writeQueues.get(filePath) ?? Promise.resolve();
  const next = previous.catch(() => undefined).then(task);
  writeQueues.set(filePath, next);
  return next.finally(() => {
    if (writeQueues.get(filePath) === next) {
      writeQueues.delete(filePath);
    }
  });
}

export async function ensureJsonFile<T>(filePath: string, createInitialValue: () => T) {
  await mkdir(path.dirname(filePath), { recursive: true });

  try {
    await readFile(filePath, 'utf8');
  } catch (error) {
    if (!isMissingFileError(error)) {
      throw new StorageUnavailableError(
        'The JSON storage directory could not be prepared in this deployment.'
      );
    }

    await writeJsonFile(filePath, createInitialValue());
  }
}

export async function readJsonText(filePath: string) {
  try {
    return await readFile(filePath, 'utf8');
  } catch (error) {
    if (isMissingFileError(error)) {
      throw new StorageUnavailableError('The expected JSON storage file does not exist.');
    }

    throw new StorageUnavailableError(
      'The JSON storage file could not be read in this deployment.'
    );
  }
}

export async function writeJsonFile(filePath: string, data: unknown) {
  if (isDemoReadOnlyMode()) {
    throw new DemoReadOnlyError();
  }

  await mkdir(path.dirname(filePath), { recursive: true });

  const payload = `${JSON.stringify(data, null, 2)}\n`;

  return withQueuedWrite(filePath, async () => {
    const tempPath = `${filePath}.${Date.now()}.tmp`;

    try {
      await writeFile(tempPath, payload, 'utf8');
      await rename(tempPath, filePath);
    } catch (error) {
      if (isWritePermissionError(error)) {
        throw new StorageUnavailableError(
          'This deployment cannot persist JSON writes. Enable read-only mode or move to durable storage.'
        );
      }

      throw new StorageUnavailableError(
        'A JSON storage write failed. This deployment cannot safely confirm the change.'
      );
    }
  });
}
