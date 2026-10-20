#!/usr/bin/env node
/* Headless test runner for boolean_truth_table_calculator_bali.html
 *
 * Usage:  node tests/run.mjs
 * Needs Google Chrome / Chromium installed (override path with CHROME_PATH).
 * Builds a temporary copy of the app with tests/cases.js inlined, runs it in
 * headless Chrome at desktop and mobile widths, then reports pass/fail per case.
 * Exit code 0 = all green, 1 = failures.
 */
import { readFileSync, writeFileSync, mkdtempSync, rmSync, mkdirSync, existsSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const APP = path.join(HERE, '..', 'boolean_truth_table_calculator_bali.html');
const CASES = path.join(HERE, 'cases.js');
const BUILD_DIR = path.join(HERE, '.build');

function findChrome() {
  const candidates = [
    process.env.CHROME_PATH,
    '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
    '/Applications/Chromium.app/Contents/MacOS/Chromium',
    '/usr/bin/google-chrome',
    '/usr/bin/chromium',
    '/usr/bin/chromium-browser',
  ].filter(Boolean);
  for (const c of candidates) if (existsSync(c)) return c;
  console.error('Chrome/Chromium not found. Set CHROME_PATH to its executable.');
  process.exit(2);
}

function build() {
  const app = readFileSync(APP, 'utf8');
  const cases = readFileSync(CASES, 'utf8');
  if (app.split('<script>').length !== 2) throw new Error('expected exactly one <script> block in the app');
  // Replacer function: a plain string replacement would mangle $$ in the test code.
  const html = app.replace('</body></html>', () => '<script>\n' + cases + '\n</script>\n</body></html>');
  mkdirSync(BUILD_DIR, { recursive: true });
  const out = path.join(BUILD_DIR, 'app-under-test.html');
  writeFileSync(out, html);
  return out;
}

function decodeEntities(s) {
  return s.replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&amp;/g, '&');
}

function extractResults(dom, width) {
  const marker = '<pre id="test-results">';
  const at = dom.lastIndexOf(marker); // last occurrence = the element, not the source comment
  if (at < 0) throw new Error('no results for viewport ' + width + 'px');
  const end = dom.indexOf('</pre>', at);
  if (end < 0) throw new Error('unterminated results for viewport ' + width + 'px');
  return JSON.parse(decodeEntities(dom.slice(at + marker.length, end)));
}

function runView(chrome, page, width, height, query) {
  const profile = mkdtempSync(path.join(tmpdir(), 'bool-test-chrome-'));
  try {
    const res = spawnSync(chrome, [
      '--headless=new', '--disable-gpu', '--no-sandbox', '--hide-scrollbars',
      '--user-data-dir=' + profile,
      '--virtual-time-budget=15000',
      '--window-size=' + width + ',' + height,
      '--force-device-scale-factor=1',
      '--dump-dom', 'file://' + page + (query || ''),
    ], { encoding: 'utf8', maxBuffer: 256 * 1024 * 1024, timeout: 90000 });
    const dom = res.stdout || '';
    return extractResults(dom, width + (query ? ' ' + query : ''));
  } finally {
    rmSync(profile, { recursive: true, force: true });
  }
}

const chrome = findChrome();
const page = build();
const reports = [];
for (const [w, h, q] of [[1280, 1000, ''], [500, 1000, ''], [1280, 1000, '?lang=ZH&probe=langcase']]) {
  reports.push(runView(chrome, page, w, h, q));
}

let pass = 0, fail = 0;
for (const rep of reports) {
  console.log(`\n=== viewport ${rep.viewport}px ===`);
  for (const r of rep.results) {
    const tag = r.pass ? 'PASS' : 'FAIL';
    if (r.pass) pass++; else fail++;
    console.log(` ${tag}  ${r.name}${r.detail ? '   [' + r.detail + ']' : ''}`);
  }
}
console.log(`\nSummary: ${pass} passed, ${fail} failed`);
process.exit(fail > 0 ? 1 : 0);
