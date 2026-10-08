import { readFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const manifest = JSON.parse(await readFile(join(here, 'candidate/manifest.json'), 'utf8'));
for (const entry of manifest.files) {
  if (typeof entry.path !== 'string' || entry.path.startsWith('/') || entry.path.split('/').includes('..')) {
    throw new Error('Invalid candidate path');
  }
  const file = await readFile(join(here, 'candidate', `${entry.path}.txt`));
  if (file.length !== entry.bytes || createHash('sha256').update(file).digest('hex') !== entry.sha256) {
    throw new Error(`Candidate checksum mismatch: ${entry.path}`);
  }
}
console.log(`Verified ${manifest.files.length} Prospect release source files.`);
