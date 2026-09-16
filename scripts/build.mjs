// Bundle everything — the Feishu SDK included — into one self-contained file,
// so `npx skills add` gives a copy that runs with no `npm install` and no
// build step on the user's machine. That is the whole point: a skill someone
// has to build before trying is a skill most people never try.
import { build } from 'esbuild';
import { chmodSync, mkdirSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

// Every path esbuild writes into the bundle — the `// …` line above each
// hoisted module, and the key of its `__commonJS` wrapper — is relative to its
// working directory. Pin that directory to the repository root, where this
// script and node_modules both live, rather than inherit the caller's cwd:
// dependencies then read `node_modules/…` and the skill's own sources read
// `skills/agent-lark/src/…`. Node module resolution is unaffected — esbuild
// walks up from each source file, so the skill's sources still find the
// repository-root node_modules.
const rootDir = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const skillDir = join(rootDir, 'skills', 'agent-lark');

// Dependencies of the Feishu SDK are CommonJS and reach for `__dirname` /
// `require`, which do not exist in an ES module. Reconstruct them at the top
// of the bundle.
const banner = [
  '// GENERATED FILE — do not edit. Built from src/ by scripts/build.mjs.',
  '// A bundle of this project plus its dependencies (@larksuite/channel and',
  '// the Feishu Node SDK), shipped in the repo so the skill runs with no',
  '// `npm install` and no build step. Deliberately NOT minified: this file',
  '// reads your OS keychain and spawns processes, so it has to stay auditable.',
  '// Rebuild with `npm run build`; review the real source under src/.',
  "import{createRequire as __cr}from'node:module';",
  "import{fileURLToPath as __f2p}from'node:url';",
  "import{dirname as __dn}from'node:path';",
  'const require=__cr(import.meta.url);',
  'const __filename=__f2p(import.meta.url);',
  'const __dirname=__dn(__filename);',
].join('\n');

mkdirSync(join(skillDir, 'dist'), { recursive: true });

const result = await build({
  absWorkingDir: rootDir,
  entryPoints: ['skills/agent-lark/src/cli.ts'],
  bundle: true,
  platform: 'node',
  target: 'node20',
  format: 'esm',
  // Not minified on purpose — see the banner. A 2 MB wall of mangled code is
  // not something anyone can review before granting it full agent permissions.
  minify: false,
  // `.mjs`, not `.js`: the file must be read as an ES module even when it is
  // copied somewhere without a `"type": "module"` package.json beside it.
  // esbuild hoists the entry's own shebang, so the banner must not add one.
  outfile: 'skills/agent-lark/dist/cli.mjs',
  banner: { js: banner },
  metafile: true,
  logLevel: 'warning',
});

chmodSync(join(skillDir, 'dist', 'cli.mjs'), 0o755);
const bytes = Object.values(result.metafile.outputs)[0].bytes;
console.log(`skills/agent-lark/dist/cli.mjs  ${(bytes / 1024 / 1024).toFixed(1)} MB  (self-contained, no node_modules needed)`);
