/* Test suite for boolean_truth_table_calculator_bali.html
 * Inlined into the app page by tests/run.mjs; results are emitted into a pre element (id: test-results).
 * Cases are tagged: always | desktop (innerWidth>600) | mobile (innerWidth<=600).
 */
(async () => {
  const results = [];
  try {
  const check = (name, pass, detail) => results.push({ name, pass: !!pass, detail: detail == null ? '' : String(detail).slice(0, 200) });
  const $ = s => document.querySelector(s);
  const $$ = s => Array.from(document.querySelectorAll(s));
  const sleep = ms => new Promise(r => setTimeout(r, ms));
  const setExpr = v => { const el = $('#expr'); el.value = v; el.dispatchEvent(new Event('input', { bubbles: true })); };
  const setMode = v => { const el = $('#kmap-mode'); el.value = v; el.dispatchEvent(new Event('change', { bubbles: true })); };
  const setLang = v => { const el = $('#language-mode'); el.value = v; el.dispatchEvent(new Event('change', { bubbles: true })); };
  const rows = () => $$('#table tbody tr').map(tr => Array.from(tr.children).map(td => td.textContent.trim()).join(','));
  const headers = () => $$('#table thead th').map(x => x.textContent.trim());
  const eq = (a, b) => JSON.stringify(a) === JSON.stringify(b);
  const isMobile = window.innerWidth <= 600;
  const appScriptText = () => document.querySelectorAll('script')[0].textContent;

  await sleep(80);
  setLang('en');
  await sleep(30);

  /* ---------- parsing & semantics ---------- */
  setExpr('A and (B or C)');
  check('precedence: A and (B or C) renders A * (B + C)', $('#pretty').textContent === 'A * (B + C)', $('#pretty').textContent);
  setExpr('(A or B) and C');
  check('precedence: (A or B) and C renders (A + B) * C', $('#pretty').textContent === '(A + B) * C', $('#pretty').textContent);
  setExpr('A xnor B');
  check('truth: A xnor B', eq(rows(), ['0,0,1', '0,1,0', '1,0,0', '1,1,1']), rows().join(' | '));
  setExpr('A nand B');
  check('truth: A nand B', eq(rows(), ['0,0,1', '0,1,1', '1,0,1', '1,1,0']), rows().join(' | '));
  setExpr('A nor B');
  check('truth: A nor B', eq(rows(), ['0,0,1', '0,1,0', '1,0,0', '1,1,0']), rows().join(' | '));
  setExpr("A'B");
  check("postfix prime: A'B = (not A) and B", eq(headers(), ['A', 'B', 'Output']) && eq(rows(), ['0,0,0', '0,1,1', '1,0,0', '1,1,0']), headers().join(',') + ' / ' + rows().join(' | '));
  setExpr('A B');
  check('implicit AND: A B', eq(headers(), ['A', 'B', 'Output']) && $('#pretty').textContent === 'A * B', headers().join(',') + ' / ' + $('#pretty').textContent);
  setExpr('A(B)');
  check('implicit AND: A(B)', eq(headers(), ['A', 'B', 'Output']), headers().join(','));
  setExpr('AB');
  check('AB without separator is ONE variable (documented)', eq(headers(), ['AB', 'Output']) && rows().length === 2, headers().join(','));
  setExpr('1 or 0');
  check('constants: 1 or 0 = 1, no columns', headers().length === 1 && rows().length === 1 && rows()[0] === '1', headers().join(',') + ' / ' + rows().join('|'));
  setExpr('0 and 1');
  check('constants: 0 and 1 = 0', rows().length === 1 && rows()[0] === '0', rows().join('|'));
  setExpr("0' or 1");
  check("constants: 0' or 1 = 1", rows().length === 1 && rows()[0] === '1', rows().join('|'));
  setExpr('__proto__');
  check('variable __proto__ toggles correctly (regression)', eq(rows(), ['0,0', '1,1']), rows().join(' | '));
  setExpr('__proto__ xor A');
  check('variable __proto__ xor A', eq(rows(), ['0,0,0', '0,1,1', '1,0,1', '1,1,0']), rows().join(' | '));
  setExpr('constructor');
  check('variable constructor toggles correctly', eq(rows(), ['0,0', '1,1']), rows().join(' | '));

  /* ---------- symbolic render ---------- */
  setExpr('not not A');
  const overs = $$('#pretty .over');
  let gapInfo = 'bars=' + overs.length, gapOk = false;
  if (overs.length === 2) {
    const gap = overs[1].getBoundingClientRect().top - overs[0].getBoundingClientRect().top;
    gapOk = gap >= 5;
    gapInfo = 'gap=' + gap.toFixed(1) + 'px';
  }
  check('double NOT bars are visually separated (regression)', overs.length === 2 && gapOk, gapInfo);
  setExpr('A nand (B nor C)');
  const overTitles = $$('#pretty .over').map(o => o.getAttribute('title'));
  check('complemented spans carry NOT/NAND/NOR titles', overTitles.length >= 2 && overTitles.every(Boolean), overTitles.join(','));

  /* ---------- error messages ---------- */
  setExpr('A -> B');
  check('-> is rejected with a clear implication message', /蕴含|Implication/.test($('#status').textContent), $('#status').textContent);
  setExpr('A → B');
  check('→ is rejected with a clear message', /蕴含|Implication|无法识别|Unrecognized/.test($('#status').textContent), $('#status').textContent);
  setExpr('(A');
  check('missing ) message', /右括号|closing/.test($('#status').textContent), $('#status').textContent);
  setExpr('A)');
  check('extra ) message', /多余|extra/.test($('#status').textContent), $('#status').textContent);
  setExpr('A &');
  check('incomplete expression message', /缺少操作数|missing operand/.test($('#status').textContent), $('#status').textContent);
  setExpr('A @ B');
  check('unrecognized character message', /无法识别|Unrecognized/.test($('#status').textContent), $('#status').textContent);
  setExpr('');
  check('empty input shows a prompt', $('#status').textContent.length > 0 && $('#table').textContent.length > 0, $('#status').textContent);

  /* ---------- output escaping ---------- */
  setExpr('A < B');
  check('error text is escaped, nothing injected into #table',
    $('#table').querySelector('img') === null && $('#table').querySelector('b') === null && $('#table').textContent.includes('<'),
    $('#table').textContent.slice(0, 60));

  /* ---------- Karnaugh map ---------- */
  setMode('codes');
  setExpr('A or B or C');
  check('kmap 3 vars → 2 × 4', $('#kmap-size').textContent.replace(/\s/g, '') === '2×4', $('#kmap-size').textContent);
  const codes = $$('#kmap .code-head b').map(x => x.textContent);
  check('kmap column headers use Gray code', eq(codes, ['00', '01', '11', '10']), codes.join(','));
  const minterms = $$('#kmap .kmap-minterm').map(x => x.textContent).sort();
  check('kmap shows minterms m0..m7', eq(minterms, ['m0', 'm1', 'm2', 'm3', 'm4', 'm5', 'm6', 'm7']), minterms.join(','));
  setExpr('A or B or C or D or E or F');
  check('kmap 6 vars → 64 cells', $$('#kmap .kmap-cell').length === 64, 'cells=' + $$('#kmap .kmap-cell').length);
  setExpr('1');
  check('kmap works for constant-only expression (no NaN)', !$('#kmap').textContent.includes('NaN') && $('#kmap').textContent.includes('m0'), $('#kmap').textContent.slice(0, 60).replace(/\s+/g, ' '));
  setMode('brackets');
  setExpr('A or B or C or D or E');
  const colLabels5 = $$('#kmap .col-bracket-label').map(x => x.textContent.trim());
  check('brackets 5 vars: A, B and C are all bracketed (regression)', ['A', 'B', 'C'].every(v => colLabels5.includes(v)), colLabels5.join(','));
  const rowLabels5 = $$('#kmap .row-bracket-label').map(x => x.textContent.trim());
  check('brackets 5 vars: D, E bracketed as row vars', ['D', 'E'].every(v => rowLabels5.includes(v)), rowLabels5.join(','));
  setExpr('A or B or C or D');
  const colLabels4 = $$('#kmap .col-bracket-label').map(x => x.textContent.trim());
  const rowLabels4 = $$('#kmap .row-bracket-label').map(x => x.textContent.trim());
  check('brackets 4 vars: A top, B bottom, C/D rows',
    colLabels4.includes('A') && colLabels4.includes('B') && rowLabels4.includes('C') && rowLabels4.includes('D'),
    'cols=' + colLabels4.join(',') + ' rows=' + rowLabels4.join(','));
  check('brackets: heading and explanation sit outside the bracket block',
    !!$('#kmap .bracket-explanation') && $('#kmap .bracket-explanation').parentElement === $('#kmap') &&
    !!$('#kmap .bracket-heading') && $('#kmap .bracket-heading').parentElement === $('#kmap'), '');

  /* ---------- i18n (regressions for the translation system) ---------- */
  setMode('codes');
  const scriptBefore = appScriptText();
  setExpr('Output or Clear');
  setLang('zh');
  await sleep(50);
  check('zh: static UI translated', $('h1').textContent === '布尔表达式计算器', $('h1').textContent);
  const zhHeaders = headers();
  check('zh: variable names are NOT translated (regression)',
    zhHeaders[0] === 'Output' && zhHeaders[1] === 'Clear' && zhHeaders[2] === '结果',
    zhHeaders.join(','));
  check('zh: pretty keeps user variable names', $('#pretty').textContent === 'Output + Clear', $('#pretty').textContent);
  check('zh: dynamic summary translated', /共 2 个变量/.test($('#summary').textContent), $('#summary').textContent);
  check('zh: row count translated', /行/.test($('#rowcount').textContent), $('#rowcount').textContent);
  check('script source untouched by language switch (regression)', appScriptText() === scriptBefore, 'len ' + scriptBefore.length + '→' + appScriptText().length);
  const zhSnap = { h1: $('h1').textContent, note: $('.kmap-note').textContent, footer: $('footer').textContent, summary: $('#summary').textContent, legend: $('.legend div').textContent };
  setExpr('A -> B');
  check('zh: error message follows language', /蕴含/.test($('#status').textContent), $('#status').textContent);
  setExpr('Output or Clear');
  setLang('en');
  await sleep(50);
  check('en: static UI translated', $('h1').textContent === 'Boolean Expression Calculator', $('h1').textContent);
  const dirty = $$('[data-i18n]').filter(el => /[\u4e00-\u9fff]/.test(el.textContent));
  check('en: no CJK left in any data-i18n node (regression)', dirty.length === 0, dirty.map(el => el.getAttribute('data-i18n')).join(','));
  const enSummary = $('#summary').textContent;
  check('en: summary uses ASCII list separator', enSummary === 'Variables: Output, Clear; total: 2 variables', enSummary);
  setExpr('A -> B');
  check('en: error message re-translated', /Implication/.test($('#status').textContent), $('#status').textContent);
  setExpr('Output or Clear');
  setLang('zh');
  await sleep(50);
  const zhSnap2 = { h1: $('h1').textContent, note: $('.kmap-note').textContent, footer: $('footer').textContent, summary: $('#summary').textContent, legend: $('.legend div').textContent };
  check('language round-trip zh→en→zh is idempotent (regression)', eq(zhSnap, zhSnap2), JSON.stringify(zhSnap2).slice(0, 120));
  check('script source untouched after many switches (regression)', appScriptText() === scriptBefore, 'len ' + appScriptText().length);
  setLang('en');
  await sleep(30);

  /* ---------- perf sanity: 12 variables = 4096 rows ---------- */
  const expr12 = 'A1 or A2 or A3 or A4 or A5 or A6 or A7 or A8 or A9 or A10 or A11 or A12';
  const t0 = performance.now();
  setExpr(expr12);
  const elapsed = performance.now() - t0;
  check('12 variables → 4096 rows and stays fast', rows().length === 4096 && elapsed < 3000, 'rows=' + rows().length + ' in ' + elapsed.toFixed(0) + 'ms');
  setExpr('A or B');

  /* ---------- mobile-only layout regressions ---------- */
  if (isMobile) {
    setMode('brackets');
    setExpr('A or B or C or D');
    await sleep(30);
    const bottom = $('#kmap .bottom-rail-track'), cells = $('#kmap .bracket-cells');
    const bg = bottom ? getComputedStyle(bottom).gridTemplateColumns : '';
    const cg = cells ? getComputedStyle(cells).gridTemplateColumns : '';
    check('mobile: bottom bracket track matches cell grid (regression)', bg !== '' && bg === cg, 'bottom=' + bg + ' cells=' + cg);
    const wrap = $('#kmap');
    check('mobile: explanation no longer forces 700px overflow (regression)', wrap.scrollWidth <= wrap.clientWidth + 2, 'scroll=' + wrap.scrollWidth + ' client=' + wrap.clientWidth);
  }

  } catch (e) {
    results.push({ name: 'harness error', pass: false, detail: String((e && e.stack) || e) });
  }
  const holder = document.createElement('pre');
  holder.id = 'test-results';
  holder.textContent = JSON.stringify({ viewport: window.innerWidth, results }, null, 1);
  document.body.appendChild(holder);
})();
