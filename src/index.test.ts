import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { createUnityPackage } from 'unitypackage-core';
import { extractPackage, viewPackage } from './index';

const encoder = new TextEncoder();
const decoder = new TextDecoder();
let tempDirs: string[] = [];

async function makeTempDir(): Promise<string> {
  const dir = await fs.promises.mkdtemp(path.join(os.tmpdir(), 'unitypackage-extractor-test-'));
  tempDirs.push(dir);
  return dir;
}

async function writeFixturePackage(dir: string): Promise<string> {
  const packagePath = path.join(dir, 'fixture.unitypackage');
  const data = createUnityPackage([
    {
      guid: 'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
      pathname: 'Assets/Scripts/MyScript.cs',
      asset: encoder.encode('public class MyScript {}'),
      meta: encoder.encode('guid: aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa'),
    },
  ]);

  await fs.promises.writeFile(packagePath, data);
  return packagePath;
}

afterEach(async () => {
  vi.restoreAllMocks();

  await Promise.all(
    tempDirs.map(dir => fs.promises.rm(dir, { recursive: true, force: true })),
  );
  tempDirs = [];
});

describe('extractPackage', () => {
  it('writes package assets and meta files to disk', async () => {
    const dir = await makeTempDir();
    const outputDir = path.join(dir, 'out');
    const packagePath = await writeFixturePackage(dir);

    await extractPackage(packagePath, outputDir);

    const asset = await fs.promises.readFile(path.join(outputDir, 'Assets/Scripts/MyScript.cs'));
    const meta = await fs.promises.readFile(path.join(outputDir, 'Assets/Scripts/MyScript.cs.meta'));
    expect(decoder.decode(asset)).toBe('public class MyScript {}');
    expect(decoder.decode(meta)).toBe('guid: aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa');
  });
});

describe('viewPackage', () => {
  it('prints sorted package paths without extracting', async () => {
    const dir = await makeTempDir();
    const packagePath = await writeFixturePackage(dir);
    const logSpy = vi.spyOn(console, 'log').mockImplementation(() => undefined);

    await viewPackage(packagePath);

    expect(logSpy).toHaveBeenCalledWith('Assets/Scripts/MyScript.cs');
    expect(logSpy).toHaveBeenCalledWith('Assets/Scripts/MyScript.cs.meta');
  });
});
