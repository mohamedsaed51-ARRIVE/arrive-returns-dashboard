let ROWS = OCT.prep(window.OCT_DATA);
const $ = (id) => document.getElementById(id);
const fmt = (n) => (n == null ? '—' : Number(n).toLocaleString('en-US'));
const pct = (x) => (x == null ? '—' : (x * 100).toFixed(2) + '%');
const dmy = (d) => d.slice(8, 10) + '/' + d.slice(5, 7) + '/' + d.slice(0, 4);
const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const FL = {
  'مكرر_متطابق': ['مكرر متطابق', 'صف مطابق تمامًا لصف سابق (نفس اليوم والفرع والأرقام)', true],
  'متابعة_متبقي': ['صف متابعة', 'المرسل فيه = غير المستلم في الصف السابق لنفس الفرع، واحتمال أن الشحنات محسوبة مرتين', true],
  'تكرار_غير_واضح': ['تكرار غير واضح', 'أكثر من صف لنفس الفرع واليوم بأرقام مختلفة وبدون علاقة واضحة', false],
  'مستلم_اكبر_غير_مفسر': ['مستلم أكبر من المرسل', 'المستلم أكبر من المرسل ولا تفسره «غير المدرجة»', false],
  'غير_مستلم_غير_مطابق': ['غير مستلم لا يطابق', 'عمود غير المستلم لا يطابق أي معادلة حساب', false],
  'حالة_غير_متسقة': ['حالة غير متسقة', 'حالة المطابقة لا تتسق مع الأرقام في الصف', false],
  'فرعين_مدمجين': ['فرعان في خانة واحدة', 'خانة الفرع تحتوي فرعين معًا', false],
};
const flName = (c) => (FL[c] ? FL[c][0] : c.replace(/_/g, ' '));
const ICONS = {
  box: '<path d="M21 8l-9-5-9 5 9 5 9-5z"/><path d="M3 8v8l9 5 9-5V8"/><path d="M12 13v8"/>',
  undo: '<path d="M3 7v6h6"/><path d="M21 17a9 9 0 00-15-6.7L3 13"/>',
  check: '<circle cx="12" cy="12" r="10"/><path d="M8 12l3 3 5-6"/>',
  plus: '<circle cx="12" cy="12" r="10"/><path d="M12 8v8M8 12h8"/>',
  flag: '<path d="M5 21V4"/><path d="M5 4h12l-2 4 2 4H5"/>',
  moon: '<path d="M21 13A9 9 0 1111 3a7 7 0 0010 10z"/>',
  sun: '<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/>',
  sl: '<path d="M4 6h10M18 6h2M4 12h2M10 12h10M4 18h12M20 18h0"/><circle cx="16" cy="6" r="2"/><circle cx="8" cy="12" r="2"/><circle cx="18" cy="18" r="2"/>',
  search: '<circle cx="11" cy="11" r="7"/><path d="M21 21l-4.3-4.3"/>',
  cal: '<rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/>',
  warn: '<path d="M12 3l10 18H2L12 3z"/><path d="M12 10v5M12 18h0"/>',
};
const svg = (n) => '<svg class="ic" viewBox="0 0 24 24" aria-hidden="true">' + ICONS[n] + '</svg>';
const setIc = (id, n) => { const e = $(id); if (e) e.innerHTML = svg(n); };
[['ic-k1','box'],['ic-k2','undo'],['ic-k3','check'],['ic-k4','plus'],['ic-k5','flag'],['ic-reset','undo'],['ic-reset2','undo'],['ic-sl','sl'],['ic-search','search'],['ic-cal','cal']].forEach((a) => setIc(a[0], a[1]));

// ---------- الحالة ----------
const branchList = () => [...new Set(ROWS.map((r) => r.branch))].sort((a, b) => a.localeCompare(b, 'ar'));
let BRANCHES = branchList();
const S = { branches: new Set(), from: '', to: '', flag: 'all', mode: 'written', excl: 'no', q: '', sort: { log: ['sheetRow', 1], br: ['sent', -1] }, page: 1, size: 25 };
const dayOf = (iso) => (iso ? Number(iso.slice(8, 10)) : null);

function baseRows() {
  const f = dayOf(S.from), t = dayOf(S.to), q = S.q.trim().toLowerCase();
  return ROWS.filter((r) =>
    (S.branches.size === 0 || S.branches.has(r.branch)) &&
    (f == null || r.day >= f) && (t == null || r.day <= t) &&
    (S.flag === 'all' || (S.flag === 'flag' ? r.flags.length > 0 : r.flags.length === 0)) &&
    (!q || r.branch.toLowerCase().includes(q) || String(r.sheetRow) === q));
}
const isDup = (r) => r.flags.some((x) => OCT.DUP.includes(x));
let ALL = [], CUR = [];
function compute() { ALL = baseRows(); CUR = S.excl === 'yes' ? ALL.filter((r) => !isDup(r)) : ALL; }

// ---------- فلتر متعدد الاختيار ----------
const MS = { sel: S.branches, open: false, term: '' };
function msRender() {
  const root = $('msBranch');
  const chips = [...S.branches].slice(0, 2).map((b) => '<span class="ms-chip"><span>' + esc(b) + '</span><button type="button" data-rm="' + esc(b) + '" aria-label="إزالة">×</button></span>').join('');
  const more = S.branches.size > 2 ? '<span class="ms-chip-more">+' + (S.branches.size - 2) + '</span>' : '';
  const ph = S.branches.size === 0 ? '<span class="ms-placeholder">كل الفروع</span>' : '';
  const opts = BRANCHES.filter((b) => !MS.term || b.includes(MS.term)).map((b) =>
    '<label class="ms-option"><input type="checkbox" value="' + esc(b) + '"' + (S.branches.has(b) ? ' checked' : '') + '><span>' + esc(b) + '</span></label>').join('');
  root.className = 'ms' + (MS.open ? ' open' : '');
  root.innerHTML = '<div class="ms-control" tabindex="0" role="combobox" aria-expanded="' + MS.open + '"><div class="ms-chips">' + ph + chips + more + '</div><span class="ms-caret">▼</span></div>' +
    '<div class="ms-panel"><input class="ms-search" placeholder="ابحث عن فرع…" value="' + esc(MS.term) + '"><div class="ms-actions"><button type="button" data-a="all">تحديد الكل</button><button type="button" data-a="none">مسح</button></div><div class="ms-options">' + (opts || '<div class="ms-empty">لا توجد نتائج</div>') + '</div></div>';
  const inp = root.querySelector('.ms-search');
  if (MS.open && MS.focusSearch) { inp.focus(); inp.setSelectionRange(inp.value.length, inp.value.length); }
}
$('msBranch').addEventListener('click', (e) => {
  const rm = e.target.closest('[data-rm]');
  if (rm) { S.branches.delete(rm.dataset.rm); MS.focusSearch = false; refresh(); return; }
  const a = e.target.closest('[data-a]');
  if (a) { if (a.dataset.a === 'all') BRANCHES.forEach((b) => S.branches.add(b)); else S.branches.clear(); refresh(); return; }
  const cb = e.target.closest('input[type=checkbox]');
  if (cb) { cb.checked ? S.branches.add(cb.value) : S.branches.delete(cb.value); MS.focusSearch = true; refresh(); return; }
  if (e.target.closest('.ms-control')) { MS.open = !MS.open; MS.focusSearch = MS.open; msRender(); }
});
$('msBranch').addEventListener('input', (e) => { if (e.target.classList.contains('ms-search')) { MS.term = e.target.value; MS.focusSearch = true; msRender(); } });
document.addEventListener('click', (e) => { if (MS.open && !e.composedPath().includes($('msBranch'))) { MS.open = false; msRender(); } });

// ---------- عناصر الفلترة ----------
$('fSearch').addEventListener('input', (e) => { S.q = e.target.value; S.page = 1; refresh(); });
$('fFrom').addEventListener('change', (e) => { S.from = e.target.value; S.page = 1; refresh(); });
$('fTo').addEventListener('change', (e) => { S.to = e.target.value; S.page = 1; refresh(); });
$('fFlag').addEventListener('change', (e) => { S.flag = e.target.value; S.page = 1; refresh(); });
$('fMode').addEventListener('change', (e) => { S.mode = e.target.value; refresh(); });
$('fExcl').addEventListener('change', (e) => { S.excl = e.target.value; S.page = 1; refresh(); });
function resetAll() {
  S.branches.clear(); S.from = S.to = ''; S.flag = 'all'; S.q = ''; S.page = 1;
  $('fSearch').value = ''; $('fFrom').value = ''; $('fTo').value = ''; $('fFlag').value = 'all';
  refresh();
}
$('btnReset').onclick = resetAll; $('qaReset').onclick = resetAll;

// ---------- الألوان والرسوم ----------
const css = (v) => getComputedStyle(document.documentElement).getPropertyValue(v).trim();
function palette() { return { blue: css('--arrive-blue') || '#0837C9', teal: css('--arrive-teal') || '#00C7E6', bad: css('--status-violation') || '#EF4444', ok: css('--status-success') || '#22C55E', warn: css('--status-under-action') || '#F59E0B', ink: css('--ink') || '#0F172A', faint: css('--ink-faint') || '#64748B', line: css('--line') || '#E2E8F0' }; }
function mk(id, cfg) { const old = Chart.getChart(id); if (old) old.destroy(); return new Chart($(id), cfg); }
function baseOpts(P) {
  Chart.defaults.font.family = "Cairo, Inter, system-ui, sans-serif";
  Chart.defaults.color = P.faint;
  return { responsive: true, maintainAspectRatio: false, animation: false, plugins: { legend: { labels: { color: P.ink, boxWidth: 12 } } } };
}
function drawCharts() {
  if (!window.Chart) return;
  const P = palette(), mode = S.mode;
  const days = OCT.group(CUR, 'day', mode).sort((a, b) => a.key - b.key);
  const o = baseOpts(P);
  mk('chDaily', { data: { labels: days.map((d) => d.key + '/10'), datasets: [
    { type: 'bar', label: 'مطابق', data: days.map((d) => d.matched), backgroundColor: P.blue, stack: 's', yAxisID: 'y' },
    { type: 'bar', label: 'غير مستلم', data: days.map((d) => d.unrecv), backgroundColor: P.bad, stack: 's', yAxisID: 'y' },
    { type: 'line', label: 'نسبة المطابقة %', data: days.map((d) => (d.rate == null ? null : +(d.rate * 100).toFixed(2))), borderColor: P.teal, backgroundColor: P.teal, yAxisID: 'y2', tension: .25, pointRadius: 3 }] },
    options: Object.assign({}, o, { scales: { x: { stacked: true, grid: { display: false } }, y: { stacked: true, grid: { color: P.line }, title: { display: true, text: 'شحنات' } }, y2: { position: 'right', min: 0, max: 100, grid: { display: false }, title: { display: true, text: '%' } } } }) });
  const br = OCT.group(CUR, 'branch', mode);
  const top = br.slice().sort((a, b) => b.unrecv - a.unrecv).slice(0, 12);
  const low = br.filter((b) => b.sent > 0).sort((a, b) => a.rate - b.rate).slice(0, 12);
  const pick = (ev, els, chart, list) => { if (!els.length) return; const b = list[els[0].index].key; S.branches.has(b) ? S.branches.delete(b) : S.branches.add(b); S.page = 1; refresh(); };
  const hOpts = (list, tick) => Object.assign({}, o, { indexAxis: 'y', plugins: { legend: { display: false } }, onClick: (ev, els, ch) => pick(ev, els, ch, list), scales: { x: { grid: { color: P.line }, ticks: tick }, y: { grid: { display: false } } } });
  mk('chBranchUn', { type: 'bar', data: { labels: top.map((b) => b.key), datasets: [{ data: top.map((b) => b.unrecv), backgroundColor: top.map((b) => (S.branches.has(b.key) ? P.teal : P.bad)) }] }, options: hOpts(top, {}) });
  mk('chBranchRate', { type: 'bar', data: { labels: low.map((b) => b.key), datasets: [{ data: low.map((b) => +(b.rate * 100).toFixed(2)), backgroundColor: low.map((b) => (S.branches.has(b.key) ? P.teal : P.blue)) }] }, options: hOpts(low, { callback: (v) => v + '%' }) });
}

// ---------- العرض ----------
function sortBy(list, key, dir) {
  return list.slice().sort((a, b) => {
    const x = a[key], y = b[key];
    const c = typeof x === 'string' ? x.localeCompare(y, 'ar') : (x == null ? -1 : y == null ? 1 : x - y);
    return c * dir || a.sheetRow - b.sheetRow;
  });
}
function renderKpis() {
  const T = OCT.totals(CUR, S.mode), W = OCT.totals(CUR, 'written'), C = OCT.totals(CUR, 'calc');
  $('kSent').textContent = fmt(T.sent);
  $('kSentSub').textContent = fmt(T.rows) + ' صف · ' + fmt(T.days) + ' يوم';
  $('kUn').textContent = fmt(T.unrecv);
  $('kUnSub').textContent = 'كما في الشيت: ' + fmt(W.unrecv) + ' · محسوب: ' + fmt(C.unrecv);
  $('kRate').textContent = pct(T.rate); $('kRatePct').textContent = T.sent ? fmt(T.matched) + ' مطابق من ' + fmt(T.sent) : '—';
  $('kRateSub').textContent = '(المرسل − غير المستلم) ÷ المرسل';
  $('kEx').textContent = fmt(T.extra);
  $('kExSub').textContent = 'مستلمة بدون إرسال مسجّل';
  $('kFl').textContent = fmt(T.flagged);
  const d = CUR.filter(isDup).length;
  $('kFlSub').textContent = T.rows ? pct(T.flagged / T.rows) + ' من الصفوف · ' + fmt(d) + ' مكرر/متابعة' : '—';
  $('metaRows').textContent = fmt(T.rows);
  $('metaBranches').textContent = fmt(new Set(CUR.map((r) => r.branch)).size);
  $('metaDays').textContent = fmt(T.days);
  const ds = CUR.map((r) => r.date).sort();
  $('rangeTxt').textContent = ds.length ? dmy(ds[0]) + ' – ' + dmy(ds[ds.length - 1]) : 'لا توجد بيانات';
}
function renderQuality() {
  const m = new Map();
  ALL.forEach((r) => r.flags.forEach((f) => { const o = m.get(f) || { n: 0, sent: 0 }; o.n++; o.sent += r.sent; m.set(f, o); }));
  const rows = [...m].sort((a, b) => b[1].n - a[1].n);
  $('flagTbl').innerHTML = '<thead><tr><th>الملاحظة</th><th class="num">صفوف</th><th class="num">مرسل</th></tr></thead><tbody>' +
    (rows.length ? rows.map(([f, o]) => '<tr title="' + esc(FL[f] ? FL[f][1] : '') + '"><td><span class="flag-pill' + (FL[f] && FL[f][2] ? ' dup' : '') + '">' + esc(flName(f)) + '</span><div class="hint" style="margin:2px 0 0">' + esc(FL[f] ? FL[f][1] : '') + '</div></td><td class="num">' + fmt(o.n) + '</td><td class="num">' + fmt(o.sent) + '</td></tr>').join('')
      : '<tr><td colspan="3" style="text-align:center;padding:18px;color:var(--ink-faint)">لا توجد ملاحظات ضمن التصفية الحالية</td></tr>') + '</tbody>';
  const noDup = ALL.filter((r) => !isDup(r));
  const combos = [['written', 'no', 'كما في الشيت · كل الصفوف'], ['written', 'yes', 'كما في الشيت · بدون مكرر/متابعة'], ['calc', 'no', 'محسوب · كل الصفوف'], ['calc', 'yes', 'محسوب · بدون مكرر/متابعة']];
  $('sensTbl').innerHTML = '<thead><tr><th>الحالة</th><th class="num">مرسل</th><th class="num">غير مستلم</th><th class="num">النسبة</th></tr></thead><tbody>' +
    combos.map(([md, ex, lb]) => { const T = OCT.totals(ex === 'yes' ? noDup : ALL, md); const on = md === S.mode && ex === S.excl;
      return '<tr class="' + (on ? 'on' : '') + '"><td>' + lb + '</td><td class="num">' + fmt(T.sent) + '</td><td class="num">' + fmt(T.unrecv) + '</td><td class="num">' + pct(T.rate) + '</td></tr>'; }).join('') + '</tbody>';
  const a = OCT.totals(ALL, 'written'), b = OCT.totals(noDup, 'written');
  $('sensHint').textContent = ALL.length ? 'استبعاد المكرر والمتابعة يزيل ' + fmt(a.sent - b.sent) + ' شحنة من المرسل و' + fmt(a.unrecv - b.unrecv) + ' من غير المستلم.' : '';
}
function renderBranches() {
  const g = OCT.group(CUR, 'branch', S.mode);
  const [k, d] = S.sort.br;
  const list = g.slice().sort((a, b) => {
    const x = a[k], y = b[k]; const c = typeof x === 'string' ? x.localeCompare(y, 'ar') : (x == null ? -1 : y == null ? 1 : x - y);
    return c * d || a.key.localeCompare(b.key, 'ar'); });
  $('brCount').textContent = fmt(list.length);
  $('brBody').innerHTML = list.length ? list.map((b) => '<tr data-b="' + esc(b.key) + '" style="cursor:pointer"><td>' + esc(b.key) + '</td><td class="num">' + fmt(b.rows) + '</td><td class="num">' + fmt(b.days) + '</td><td class="num">' + fmt(b.sent) + '</td><td class="num">' + fmt(b.unrecv) + '</td><td class="num">' + pct(b.rate) + '</td><td class="num">' + fmt(b.extra) + '</td><td class="num">' + fmt(b.flagged) + '</td></tr>').join('')
    : '<tr class="empty-row"><td colspan="8"><div class="empty-state"><b>لا توجد بيانات</b><span>غيّر عوامل التصفية</span></div></td></tr>';
  markArrows('brTbl', S.sort.br);
}
function renderLog() {
  const rows = CUR.map((r) => Object.assign({}, r, { un: OCT.unrecvOf(r, S.mode), nflags: r.flags.length }));
  const [k, d] = S.sort.log;
  const sorted = sortBy(rows, k, d);
  const pages = Math.max(1, Math.ceil(sorted.length / S.size));
  if (S.page > pages) S.page = pages;
  const slice = sorted.slice((S.page - 1) * S.size, S.page * S.size);
  $('logCount').textContent = fmt(sorted.length);
  $('logBody').innerHTML = slice.length ? slice.map((r) => {
    const full = r.status.indexOf('لم يتم') < 0;
    const badge = '<span class="badge ' + (full ? 'accepted' : 'pending') + '">' + svg(full ? 'check' : 'warn') + (full ? 'تم الاستلام بالكامل' : 'لم يتم الاستلام بالكامل') + '</span>';
    const fl = r.flags.map((f) => '<span class="flag-pill' + (FL[f] && FL[f][2] ? ' dup' : '') + '" title="' + esc(FL[f] ? FL[f][1] : '') + '">' + esc(flName(f)) + '</span>').join('') || '<span style="color:var(--ink-faint)">—</span>';
    const diff = S.mode === 'calc' && r.un !== r.unrecv ? ' <span class="hint" title="القيمة المكتوبة في الشيت">(الشيت: ' + fmt(r.unrecv) + ')</span>' : '';
    return '<tr><td class="id-cell num">' + r.sheetRow + '</td><td class="num">' + dmy(r.date) + '</td><td>' + esc(r.branch) + '</td><td class="num">' + fmt(r.sent) + '</td><td class="num">' + fmt(r.recv) + '</td><td class="num">' + fmt(r.un) + diff + '</td><td class="num">' + fmt(r.extra) + '</td><td>' + badge + '</td><td>' + fl + '</td></tr>';
  }).join('') : '<tr class="empty-row"><td colspan="9"><div class="empty-state"><b>لا توجد صفوف</b><span>غيّر عوامل التصفية</span></div></td></tr>';
  $('pgInfo').innerHTML = sorted.length ? 'عرض <b>' + (S.page - 1) * S.size + 1 + '</b> – <b>' + Math.min(S.page * S.size, sorted.length) + '</b> من <b>' + fmt(sorted.length) + '</b>' : 'لا توجد صفوف';
  $('pgNow').textContent = S.page; $('pgAll').textContent = pages;
  $('pgPrev').disabled = S.page <= 1; $('pgNext').disabled = S.page >= pages;
  markArrows('logTbl', S.sort.log);
}
function markArrows(id, s) {
  document.querySelectorAll('#' + id + ' thead th').forEach((th) => { const a = th.querySelector('.arrow'); if (a) a.textContent = th.dataset.k === s[0] ? (s[1] > 0 ? '▲' : '▼') : ''; });
}
function renderChips() {
  const chips = [];
  if (S.branches.size) chips.push(['الفرع: ' + [...S.branches].join('، '), () => S.branches.clear()]);
  if (S.from) chips.push(['من ' + dmy(S.from), () => { S.from = ''; $('fFrom').value = ''; }]);
  if (S.to) chips.push(['إلى ' + dmy(S.to), () => { S.to = ''; $('fTo').value = ''; }]);
  if (S.flag !== 'all') chips.push([S.flag === 'flag' ? 'عليها ملاحظة جودة' : 'بدون ملاحظات', () => { S.flag = 'all'; $('fFlag').value = 'all'; }]);
  if (S.q.trim()) chips.push(['بحث: ' + S.q, () => { S.q = ''; $('fSearch').value = ''; }]);
  const bar = $('activeBar');
  bar.className = 'active-filters-bar' + (chips.length ? ' has-filters' : '');
  bar.innerHTML = chips.length ? '<span class="active-filters-label">الفلاتر النشطة:</span>' + chips.map((c, i) => '<span class="active-filter-chip">' + esc(c[0]) + '<button type="button" data-i="' + i + '" aria-label="إزالة">×</button></span>').join('') + '<button class="active-filters-clear-all" type="button" id="clrAll">مسح الكل</button>' : '';
  bar.querySelectorAll('[data-i]').forEach((b) => (b.onclick = () => { chips[b.dataset.i][1](); S.page = 1; refresh(); }));
  const c = bar.querySelector('#clrAll'); if (c) c.onclick = resetAll;
  $('lsFilters').textContent = chips.length;
}
function refresh() {
  compute();
  msRender(); renderChips(); renderKpis(); renderQuality(); renderBranches(); renderLog();
  $('lsTotal').textContent = fmt(ROWS.length); $('lsVisible').textContent = fmt(CUR.length); $('resultCount').textContent = fmt(CUR.length);
  $('lsMode').textContent = S.mode === 'calc' ? 'محسوب' : 'كما في الشيت';
  drawCharts();
}
// ترتيب وتنقل
function bindSort(id, key) {
  $(id).querySelector('thead').addEventListener('click', (e) => { const th = e.target.closest('th'); if (!th) return;
    const cur = S.sort[key]; S.sort[key] = [th.dataset.k, cur[0] === th.dataset.k ? -cur[1] : (th.dataset.k === 'branch' || th.dataset.k === 'key' ? 1 : -1)]; S.page = 1;
    key === 'log' ? renderLog() : renderBranches(); });
}
bindSort('logTbl', 'log'); bindSort('brTbl', 'br');
$('brBody').addEventListener('click', (e) => { const tr = e.target.closest('tr[data-b]'); if (!tr) return; const b = tr.dataset.b; S.branches.has(b) ? S.branches.delete(b) : S.branches.add(b); S.page = 1; refresh(); });
$('pgPrev').onclick = () => { S.page--; renderLog(); }; $('pgNext').onclick = () => { S.page++; renderLog(); };
$('pgSize').onchange = (e) => { S.size = Number(e.target.value); S.page = 1; renderLog(); };
// الثيم
function applyTheme(t) {
  document.documentElement.setAttribute('data-theme', t);
  $('themeIc').innerHTML = svg(t === 'dark' ? 'sun' : 'moon'); $('themeToggleLabel').textContent = t === 'dark' ? 'الوضع الفاتح' : 'الوضع الداكن';
  if (window.Chart && $('chDaily') && Chart.getChart('chDaily')) drawCharts();
}
$('themeToggle').onclick = () => applyTheme(document.documentElement.getAttribute('data-theme') === 'dark' ? 'light' : 'dark');
applyTheme(window.matchMedia && matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
refresh();
// استبدال البيانات بنسخة حيّة من الشيت مع الإبقاء على الفلاتر الحالية
window.ARRIVE_setData = (raw) => {
  ROWS = OCT.prep(raw); BRANCHES = branchList();
  [...S.branches].forEach((b) => { if (!BRANCHES.includes(b)) S.branches.delete(b); });
  refresh();
};
