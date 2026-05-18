import * as fs from 'fs';
import * as path from 'path';
import sanitize from 'sanitize-filename';
import { parseUnityPackage } from 'unitypackage-core';

function sanitizePathname(pathname: string): string {
  const trimmed = pathname.trimEnd();
  const segments = trimmed.split(/[\\/]+/);
  const safe = segments.map(seg => sanitize(seg) || '_');
  return safe.join(path.sep);
}

function isPathInside(parent: string, child: string): boolean {
  const resolvedParent = path.resolve(parent) + path.sep;
  const resolvedChild = path.resolve(child);
  return resolvedChild.startsWith(resolvedParent);
}

export async function extractPackage(packagePath: string, outputPath?: string, _encoding: BufferEncoding = 'utf-8'): Promise<void> {
  void _encoding;
  outputPath = path.resolve(outputPath || process.cwd());
  const raw = await fs.promises.readFile(packagePath);
  const files = parseUnityPackage(new Uint8Array(raw));

  for (const [rawPath, content] of Object.entries(files)) {
    const pathname = sanitizePathname(rawPath);
    const assetOutPath = path.join(outputPath, pathname);

    if (!isPathInside(outputPath, assetOutPath)) {
      console.warn(`WARNING: Skipping '${rawPath}' as '${assetOutPath}' is outside of '${outputPath}'.`);
      continue;
    }

    console.log(`Extracting '${rawPath}'`);
    await fs.promises.mkdir(path.dirname(assetOutPath), { recursive: true });
    await fs.promises.writeFile(assetOutPath, Buffer.from(content));
  }
}

export async function viewPackage(packagePath: string, _encoding: BufferEncoding = 'utf-8'): Promise<void> {
  void _encoding;
  const raw = await fs.promises.readFile(packagePath);
  const files = parseUnityPackage(new Uint8Array(raw));
  const pathnames = Object.keys(files).sort();

  for (const pathname of pathnames) {
    console.log(pathname);
  }
}
