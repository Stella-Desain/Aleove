import { createHash } from 'node:crypto';
import { cpSync, existsSync, mkdirSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const output = path.join(root, 'work', 'pages');
const folders = ['assets', 'css', 'fonts', 'js', 'vendor'];
mkdirSync(output, { recursive: true });
for (const folder of folders) cpSync(path.join(root, folder), path.join(output, folder), { recursive: true });
cpSync(path.join(root, '.nojekyll'), path.join(output, '.nojekyll'));

// Fingerprint the original bytes so CSS, config, and HTML use the same asset URL.
function versionUrl(url, fromFile) {
  if (/^(?:[a-z][a-z\d+.-]*:|\/\/|#|%23)/i.test(url)) return url;
  const [pathname, fragment] = url.split('#');
  const localPath = pathname.split('?')[0];
  const target = path.resolve(path.dirname(fromFile), localPath);
  if (!target.startsWith(root + path.sep) || !existsSync(target)) {
    throw new Error(`Missing local asset ${url} in ${path.relative(root, fromFile)}`);
  }
  const hash = createHash('sha256').update(readFileSync(target)).digest('hex').slice(0, 12);
  return `${localPath}?v=${hash}${fragment ? '#' + fragment : ''}`;
}

// Match data URIs as a whole; internal SVG filter URLs are not standalone files.
function versionCss(css, file) {
  return css.replace(/url\(\s*(?:"([^"]*)"|'([^']*)'|([^\s)]*))\s*\)/g,
    (match, doubleQuoted, singleQuoted, bare) => {
      const url = doubleQuoted ?? singleQuoted ?? bare;
      return `url("${versionUrl(url, file)}")`;
    });
}

for (const name of readdirSync(path.join(root, 'css'))) {
  if (!name.endsWith('.css')) continue;
  const file = path.join(root, 'css', name);
  const css = readFileSync(file, 'utf8').replace(/\/\*[\s\S]*?\*\//g, '');
  writeFileSync(path.join(output, 'css', name), versionCss(css, file));
}

const configFile = path.join(root, 'js', 'config.js');
const configContext = { window: {} };
vm.runInNewContext(readFileSync(configFile, 'utf8'), configContext, { timeout: 1000 });
function versionConfig(value) {
  if (typeof value === 'string' && value.startsWith('assets/')) {
    return versionUrl(value, path.join(root, 'index.html'));
  }
  if (Array.isArray(value)) return value.map(versionConfig);
  if (value && typeof value === 'object') {
    return Object.fromEntries(Object.entries(value).map(([key, item]) => [key, versionConfig(item)]));
  }
  return value;
}
const config = versionConfig(configContext.window.ALEOVE_CONFIG);
writeFileSync(path.join(output, 'js', 'config.js'), `window.ALEOVE_CONFIG = ${JSON.stringify(config, null, 2)};\n`);

// Hash the generated CSS/config, because they contain fingerprinted dependencies.
let html = readFileSync(path.join(root, 'index.html'), 'utf8');
html = html.replace(/\b(src|href)="((?:css|js|fonts|vendor)\/[^"?]+)"/g,
  (match, attr, url) => {
    const hash = createHash('sha256').update(readFileSync(path.join(output, url))).digest('hex').slice(0, 12);
    return `${attr}="${url}?v=${hash}"`;
  });
const release = process.env.GITHUB_SHA || createHash('sha256').update(html).digest('hex').slice(0, 12);
html = html.replace('</head>', `  <meta name="aleove-version" content="${release}" />\n</head>`);
writeFileSync(path.join(output, 'index.html'), html);
console.log(`GitHub Pages files ready: work/pages (release ${release})`);
