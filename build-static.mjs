// Static production build using the Tailwind CLI + esbuild.
//
// The primary build is `npm run build` (Vite). This script is a dependency-light
// alternative that produces an equivalent static bundle in dist/ without Vite's
// Rollup pipeline. It emits a classic (IIFE) script so dist/index.html can be
// opened directly from the file system as well as served over HTTP.
//
// Usage: node build-static.mjs

import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import * as esbuild from 'esbuild';

const root = path.dirname(fileURLToPath(import.meta.url));
const dist = path.join(root, 'dist');
const assets = path.join(dist, 'assets');

fs.rmSync(dist, { recursive: true, force: true });
fs.mkdirSync(assets, { recursive: true });

// 1. CSS — Tailwind CLI (purges classes + expands @tailwind/@apply directives)
execFileSync(
  path.join(root, 'node_modules/.bin/tailwindcss'),
  ['-i', path.join(root, 'src/index.css'), '-o', path.join(assets, 'index.css'), '--minify', '-c', path.join(root, 'tailwind.config.js')],
  { cwd: root, stdio: 'inherit' }
);

// 2. JS — bundle the React app. CSS is handled above, so stub out `.css`
//    imports (esbuild would otherwise re-emit a raw, un-Tailwind'd stylesheet
//    over the one we just built).
const stubCss = {
  name: 'stub-css',
  setup(build) {
    build.onResolve({ filter: /\.css$/ }, (args) => ({ path: args.path, namespace: 'stub-css' }));
    build.onLoad({ filter: /.*/, namespace: 'stub-css' }, () => ({ contents: '', loader: 'js' }));
  },
};

await esbuild.build({
  entryPoints: [path.join(root, 'src/main.tsx')],
  bundle: true,
  minify: true,
  format: 'iife',
  target: ['es2020'],
  jsx: 'automatic',
  loader: { '.json': 'json', '.svg': 'dataurl' },
  define: { 'process.env.NODE_ENV': '"production"' },
  plugins: [stubCss],
  outfile: path.join(assets, 'index.js'),
  logLevel: 'info',
});

// 3. HTML — point the shell at the built assets
const html = fs
  .readFileSync(path.join(root, 'index.html'), 'utf8')
  .replace(
    '<script type="module" src="/src/main.tsx"></script>',
    '<link rel="stylesheet" href="./assets/index.css" />\n    <script defer src="./assets/index.js"></script>'
  );
fs.writeFileSync(path.join(dist, 'index.html'), html);

// 4. Static assets
const favicon = path.join(root, 'public/favicon.svg');
if (fs.existsSync(favicon)) fs.copyFileSync(favicon, path.join(dist, 'favicon.svg'));

console.log('\nStatic build written to dist/ (open dist/index.html or serve it).');
