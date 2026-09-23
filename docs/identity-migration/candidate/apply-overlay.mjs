import { readFile, writeFile, mkdir, realpath, lstat } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { dirname, resolve, join } from 'node:path';
import { fileURLToPath } from 'node:url';
const here = dirname(fileURLToPath(import.meta.url));
const repository = resolve(here, '../../..');
// Never writes to the obsolete root client or another live checkout.
const target = join(repository, 'identity-release/client');
if (await realpath(target) !== target) throw new Error('isolated_release_directory_required');
const manifest = JSON.parse(await readFile(join(here, 'manifest.json'), 'utf8'));
const hash = data => createHash('sha256').update(data).digest('hex');
const prepared = [];
for (const entry of manifest.files) {
  if (typeof entry.path !== 'string' || entry.path.startsWith('/') || entry.path.split('/').includes('..')) throw new Error('invalid_overlay_path');
  const output = join(target, entry.path), source = await readFile(join(here, 'client', entry.path + '.txt'));
  if (hash(source) !== entry.sha256) throw new Error('overlay_integrity_failed');
  let cursor = dirname(output);
  while (cursor !== target) {
    try { if ((await lstat(cursor)).isSymbolicLink()) throw new Error('overlay_symlink_rejected'); }
    catch (error) { if (error.code !== 'ENOENT') throw error; }
    cursor = dirname(cursor);
  }
  let current = null;
  try { if ((await lstat(output)).isSymbolicLink()) throw new Error('overlay_symlink_rejected'); current = hash(await readFile(output)); }
  catch (error) { if (error.code !== 'ENOENT') throw error; }
  if (current !== entry.baselineSha256 && current !== entry.sha256) throw new Error(`baseline_mismatch:${entry.path}`);
  prepared.push({ output, source });
}
if (process.argv.slice(2).length > 1 || (process.argv[2] !== undefined && process.argv[2] !== '--apply')) throw new Error('unsupported_argument');
if (process.argv.includes('--apply')) {
  for (const { output, source } of prepared) { await mkdir(dirname(output), { recursive: true }); await writeFile(output, source); }
}
console.info(`Verified ${prepared.length} baseline-bound overlay files. ${process.argv.includes('--apply') ? 'Applied to isolated release only.' : 'No files changed; use --apply to materialize.'}`);
