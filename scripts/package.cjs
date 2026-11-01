const fs = require('node:fs/promises');
const path = require('node:path');
const { promisify } = require('node:util');
const { execFile } = require('node:child_process');
(async () => {
  const root = path.resolve('.');
  const stage = path.join(root, '.build-input');
  await fs.rm(stage, { recursive: true, force: true });
  await fs.mkdir(stage, { recursive: true });
  for (const dir of ['main', 'renderer', 'shared'])
    await fs.cp(path.join(root, 'dist', dir), path.join(stage, 'dist', dir), { recursive: true });
  await fs.mkdir(path.join(stage, 'tools'), { recursive: true });
  await fs.copyFile(path.join(root, 'tools/scs_packer.exe'), path.join(stage, 'tools/scs_packer.exe'));
  for (const file of ['package.json', 'package-lock.json']) await fs.copyFile(path.join(root, file), path.join(stage, file));
  const npmCli = path.join(path.dirname(process.execPath), 'node_modules/npm/bin/npm-cli.js');
  const env = Object.fromEntries(Object.entries(process.env).filter(([key]) => !key.toLowerCase().startsWith('npm_config_')));
  await promisify(execFile)(process.execPath, [npmCli, 'ci', '--omit=dev', '--ignore-scripts'], { cwd: stage, windowsHide: true, env });
  const { packager } = await import('@electron/packager');
  const result = await packager({ dir: stage, name: 'ETS2-Mod-Manager', platform: 'win32', arch: 'x64', out: path.join(root, 'dist'), overwrite: true, prune: false, asar: false });
  console.log(result);
})().catch(e => { console.error(e); process.exitCode = 1; });
