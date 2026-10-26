// تبويب «SLA المرتجعات» — يعمل بجانب لوحة المطابقة دون أي تعديل في منطقها.
// المصدر: شيت «Sla RTO» (تابات يومية). ضع رابط /exec لسكربت apps-script/Code-SLA.gs هنا؛ إن بقي فارغًا تُستخدم اللقطة في sla-data.js.
const SLA_LIVE_URL = 'https://script.google.com/macros/s/AKfycbxa6AXkilUhoIpoUs_kcGVHIqcHL91t4oHBQ6gVz9qTPuB3vdaFdCYicpZMJEO4ePCn/exec';
const SLA_REFRESH_SEC = 600;

(function () {
  const $ = (id) => document.getElementById(id);
  const fmt = (n) => (n == null || Number.isNaN(n) ? '—' : Number(n).toLocaleString('en-US'));
  const f1 = (n) => (n == null || Number.isNaN(n) ? '—' : Number(n).toLocaleString('en-US', { maximumFractionDigits: 1 }));
  const pct = (x) => (x == null ? '—' : (x * 100).toFixed(1) + '%');
  const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const dmy = (d) => (d ? d.slice(8, 10) + '/' + d.slice(5, 7) + '/' + d.slice(0, 4) : '—');
  const UNKNOWN = 'غير محدد بالمصدر';
  const FINAL_OK = 'تم الارتجاع للراسل';

  // ---------- توحيد الأسماء (لا يغيّر الأصل؛ الاسم الأصلي يظهر في الجدول التفصيلي) ----------
  const BR_NAMES = { 'رئيسي': 'الرئيسي', 'اسكندريه': 'الإسكندرية', 'طنطا': 'طنطا', 'حدائق': 'الحدائق', 'حدائققبه': 'حدائق القبة', 'عجوزه': 'العجوزة', 'موسسه': 'المؤسسة', 'منصوره': 'المنصورة', 'امنصوره': 'المنصورة', 'هرم': 'الهرم', 'شروق': 'الشروق', 'معادي': 'المعادي', 'زقازيق': 'الزقازيق', 'مدينهنصر': 'مدينة نصر', 'مصرالجديده': 'مصر الجديدة', 'اكتوبر': 'أكتوبر' };
  function normBranch(raw) {
    const s = String(raw || '').replace(/\s+/g, ' ').trim();
    if (!s || s === FINAL_OK) return UNKNOWN;
    const k = s.replace(/^فرع\s+/, '').replace(/[ىي]/g, 'ي').replace(/[ةه]/g, 'ه').replace(/^ال/, '').replace(/\s/g, '');
    return BR_NAMES[k] || s.replace(/^فرع\s+/, '');
  }
  const normStatus = (s) => String(s || '').replace(/^فى /, 'في ').trim() || UNKNOWN;

  const FL = {
    'تاريخ_ناقص': ['تاريخ ناقص', 'تاريخ التقفيل أو تاريخ تقفيل المرتجع فاضي أو غير مقروء، فلا يُحسب له عمر'],
    'عمر_شاذ': ['عمر لا يطابق التواريخ', 'عمر الشيت يختلف عن (تاريخ تقفيل المرتجع − تاريخ التقفيل)، ولا يُعد فرق اليوم الواحد لنفس اليوم ملاحظة'],
    'فرع_غير_محدد': ['فرع غير محدد', 'خانة فرع المرتجع فاضية أو فيها حالة بدل الفرع'],
    'بيك_اب_فارغ': ['بيك أب فارغ', 'تاريخ استلام البيك أب غير مسجل'],
    'مكرر_في_تابات': ['بوليصة متكررة', 'نفس رقم البوليصة ظاهر في أكثر من صف (غالبًا في أكثر من تاب)'],
  };

  // ---------- الحالة ----------
  let ROWS = [], META = { updatedAt: null, source: 'snap' };
  const S = { q: '', branches: new Set(), statuses: new Set(), senders: new Set(), final: 'all', from: '', to: '', flag: 'all', mode: 'written', dup: 'all', thr: '', sort: { log: ['ret', -1], br: ['rows', -1], sd: ['rows', -1] }, page: 1, size: 25 };
  let CUR = [], ALL = [];

  const days = (a, b) => (a && b ? Math.round((Date.UTC(+b.slice(0, 4), +b.slice(5, 7) - 1, +b.slice(8, 10)) - Date.UTC(+a.slice(0, 4), +a.slice(5, 7) - 1, +a.slice(8, 10))) / 864e5) : null);
  const tabKey = (t) => { const m = String(t).match(/(\d+)-(\d+)/); return m ? +m[2] * 100 + +m[1] : 0; };

  function decode(j) {
    const d = j.dict;
    const rows = j.rows.map((a, i) => {
      const r = { id: i, wb: a[0], sender: d.senders[a[1]] || UNKNOWN, pickup: a[2], statusRaw: d.statuses[a[3]], status: normStatus(d.statuses[a[3]]), close: a[4], branchRaw: d.branches[a[5]], branch: normBranch(d.branches[a[5]]), final: d.finals[a[6]] || UNKNOWN, ret: a[7], ageS: a[8], tab: d.tabs[a[9]] };
      r.ageC = days(r.close, r.ret);
      r.noDate = r.ageC == null;
      r.tk = tabKey(r.tab);
      return r;
    });
    const by = new Map();
    rows.forEach((r) => { if (!by.has(r.wb)) by.set(r.wb, []); by.get(r.wb).push(r); });
    by.forEach((list) => {
      list.sort((x, y) => (x.close || '').localeCompare(y.close || '') || x.tk - y.tk);
      list.forEach((r) => { r.isFirst = r === list[0]; r.isLast = r === list[list.length - 1]; r.nDup = list.length; });
    });
    rows.forEach((r) => {
      const f = [];
      if (r.noDate) f.push('تاريخ_ناقص');
      else if (r.ageS != null && r.ageS !== r.ageC && !(r.ageC === 0 && r.ageS === 1)) f.push('عمر_شاذ');
      if (r.branch === UNKNOWN) f.push('فرع_غير_محدد');
      if (!r.pickup) f.push('بيك_اب_فارغ');
      if (r.nDup > 1) f.push('مكرر_في_تابات');
      r.flags = f;
    });
    return rows;
  }

  const ageOf = (r) => (r.noDate ? null : S.mode === 'calc' ? r.ageC : (r.ageS != null ? r.ageS : null));
  const thr = () => (S.thr === '' || Number.isNaN(Number(S.thr)) ? null : Number(S.thr));
  const median = (a) => { if (!a.length) return null; const s = a.slice().sort((x, y) => x - y), m = s.length >> 1; return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2; };
  function stats(rows, ageFn) {
    const ages = []; rows.forEach((r) => { const a = ageFn(r); if (a != null) ages.push(a); });
    const t = thr();
    const within = t == null ? null : ages.filter((a) => a <= t).length;
    return { rows: rows.length, n: ages.length, avg: ages.length ? ages.reduce((s, x) => s + x, 0) / ages.length : null, med: median(ages), max: ages.length ? Math.max.apply(null, ages) : null,
      within, late: t == null ? null : ages.length - within, rate: t == null || !ages.length ? null : within / ages.length, ages };
  }

  // ---------- الواجهة ----------
  const VIEW = `
  <div class="control-bar" style="position:static">
    <div class="live-stats">
      <div class="ls-item"><span class="ls-l">إجمالي السجلات</span><span class="ls-v" id="sLsTotal">0</span></div>
      <div class="ls-item"><span class="ls-l">عوامل التصفية النشطة</span><span class="ls-v" id="sLsFilters">0</span></div>
      <div class="ls-item"><span class="ls-l">السجلات المعروضة</span><span class="ls-v" id="sLsVisible">0</span></div>
      <div class="ls-item"><span class="ls-l">أساس حساب العمر</span><span class="ls-v" id="sLsMode" style="direction:rtl">—</span></div>
      <div class="ls-item"><span class="ls-l">الاتصال</span><span class="ls-v" id="sConn" style="direction:rtl">—</span></div>
    </div>
    <div class="qa-spacer"></div>
    <div class="quick-actions"><button class="qa-btn" id="sReset" type="button">إعادة التصفية</button></div>
  </div>
  <div class="filter-bar"><div class="filter-wrap">
    <div class="filter-head"><div class="filter-title">عوامل التصفية وطريقة الحساب</div><div class="filter-head-actions"><span class="result-count"><b id="sResultCount">0</b> نتيجة</span><button class="btn-reset" id="sReset2" type="button">مسح الفلاتر</button></div></div>
    <div class="filter-grid">
      <div class="fgroup filter-search"><label for="sQ">بحث (رقم البوليصة أو الراسل)</label><input type="text" id="sQ" placeholder="اكتب للبحث…"></div>
      <div class="fgroup"><label>فرع المرتجع</label><div class="ms" id="sMsBranch"></div></div>
      <div class="fgroup"><label>حالة الشحنة</label><div class="ms" id="sMsStatus"></div></div>
      <div class="fgroup"><label>الراسل</label><div class="ms" id="sMsSender"></div></div>
      <div class="fgroup"><label for="sFinal">الحالة النهائية</label><select id="sFinal"></select></div>
      <div class="fgroup"><label for="sFrom">تقفيل المرتجع من</label><input type="date" id="sFrom"></div>
      <div class="fgroup"><label for="sTo">تقفيل المرتجع إلى</label><input type="date" id="sTo"></div>
      <div class="fgroup"><label for="sFlag">ملاحظات الجودة</label><select id="sFlag"><option value="all">كل الصفوف</option><option value="flag">عليها ملاحظة فقط</option><option value="clean">بدون ملاحظات فقط</option></select></div>
      <div class="fgroup"><label for="sMode">أساس حساب العمر</label><select id="sMode"><option value="written">كما هو في عمود الشيت</option><option value="calc">محسوب: تاريخ تقفيل المرتجع − تاريخ التقفيل</option></select></div>
      <div class="fgroup"><label for="sDup">البوليصات المتكررة</label><select id="sDup"><option value="all">كل الصفوف (كما في الشيت)</option><option value="last">آخر ظهور لكل بوليصة</option><option value="first">أول ظهور لكل بوليصة</option></select></div>
      <div class="fgroup"><label for="sThr">حد الـ SLA (أيام)</label><input type="number" id="sThr" min="0" step="1" placeholder="غير محدد"></div>
    </div></div></div>
  <div class="active-filters-bar" id="sActive"></div>
  <main>
    <div class="section-heading"><h2><span class="tag">مؤشرات</span> المؤشرات الرئيسية</h2><span class="section-sub" id="sKpiSub"></span></div>
    <section class="kpi-row">
      <div class="stub tone-brand"><div class="stub-top"><div class="stub-main"><div class="stub-label">عدد المرتجعات</div><div class="stub-value num" id="sK1">0</div></div></div><div class="stub-sub" id="sK1s">—</div></div>
      <div class="stub tone-in-progress"><div class="stub-top"><div class="stub-main"><div class="stub-label">متوسط عمر المرتجع (يوم)</div><div class="stub-value num" id="sK2">0</div></div></div><div class="stub-sub" id="sK2s">—</div></div>
      <div class="stub tone-success"><div class="stub-top"><div class="stub-main"><div class="stub-label">داخل حد الـ SLA</div><div class="stub-value num" id="sK3">—</div></div></div><div class="stub-sub" id="sK3s">—</div></div>
      <div class="stub tone-violation"><div class="stub-top"><div class="stub-main"><div class="stub-label">خارج حد الـ SLA</div><div class="stub-value num" id="sK4">—</div></div></div><div class="stub-sub" id="sK4s">—</div></div>
      <div class="stub tone-under-action"><div class="stub-top"><div class="stub-main"><div class="stub-label">صفوف عليها ملاحظة جودة</div><div class="stub-value num" id="sK5">0</div></div></div><div class="stub-sub" id="sK5s">—</div></div>
    </section>
    <div class="section-heading"><h2><span class="tag">اتجاهات</span> الاتجاهات والتوزيعات</h2><span class="section-sub">اضغط على أي فرع داخل الرسم لتصفية اللوحة عليه</span></div>
    <section class="panel-grid single"><div class="panel"><h3>المرتجعات المقفلة يوميًا ومتوسط عمرها</h3><div class="panel-sub">أعمدة: عدد المرتجعات حسب تاريخ تقفيل المرتجع — الخط: متوسط العمر (يوم)</div><div class="chart-wrap tall"><canvas id="sChDaily"></canvas></div></div></section>
    <section class="panel-grid halves">
      <div class="panel"><h3>توزيع عمر المرتجع</h3><div class="panel-sub">عدد المرتجعات في كل شريحة عمر (يوم)</div><div class="chart-wrap tall"><canvas id="sChDist"></canvas></div></div>
      <div class="panel"><h3>متوسط العمر حسب الفرع</h3><div class="panel-sub">أعلى 12 فرعًا في متوسط العمر، والرقم بين القوسين عدد الصفوف</div><div class="chart-wrap tall"><canvas id="sChBranch"></canvas></div></div>
    </section>
    <div class="section-heading"><h2><span class="tag">جودة</span> جودة البيانات وحساسية الأرقام</h2><span class="section-sub">الصفوف الأصلية لم تُعدّل. الملاحظات وسم فقط ويمكن تصفيتها</span></div>
    <section class="panel-grid halves">
      <div class="panel"><h3>الملاحظات المكتشفة</h3><div class="panel-sub">ضمن التصفية الحالية</div><div class="tbl-wrap"><table class="mini-table" id="sFlagTbl"></table></div></div>
      <div class="panel"><h3>أثر أساس حساب العمر</h3><div class="panel-sub">نفس التصفية، والصف المظلل هو الاختيار الحالي</div><div class="tbl-wrap"><table class="mini-table" id="sSensTbl"></table></div><div class="hint" id="sSensHint"></div></div>
    </section>
    <div class="section-heading"><h2><span class="tag">فروع</span> أداء الفروع</h2><span class="section-sub">اضغط على عنوان العمود للترتيب، واضغط على الصف لتصفية الفرع</span></div>
    <section class="table-panel"><div class="table-head-bar"><h3>ملخص الفروع</h3><span class="result-count"><b id="sBrCount">0</b> فرع</span></div>
      <div class="table-scroll"><table id="sBrTbl"><thead><tr><th data-k="key">الفرع <span class="arrow"></span></th><th data-k="rows">عدد الصفوف <span class="arrow"></span></th><th data-k="avg">متوسط العمر <span class="arrow"></span></th><th data-k="med">الوسيط <span class="arrow"></span></th><th data-k="max">الأقصى <span class="arrow"></span></th><th data-k="late">خارج الحد <span class="arrow"></span></th><th data-k="rate">داخل الحد % <span class="arrow"></span></th></tr></thead><tbody id="sBrBody"></tbody></table></div></section>
    <div class="section-heading"><h2><span class="tag">راسلون</span> ملخص الراسلين</h2><span class="section-sub">أول 100 راسل حسب الترتيب المختار، واضغط على الصف لتصفية الراسل</span></div>
    <section class="table-panel"><div class="table-head-bar"><h3>الراسلون</h3><span class="result-count"><b id="sSdCount">0</b> راسل</span></div>
      <div class="table-scroll"><table id="sSdTbl"><thead><tr><th data-k="key">الراسل <span class="arrow"></span></th><th data-k="rows">عدد الصفوف <span class="arrow"></span></th><th data-k="avg">متوسط العمر <span class="arrow"></span></th><th data-k="max">الأقصى <span class="arrow"></span></th><th data-k="late">خارج الحد <span class="arrow"></span></th></tr></thead><tbody id="sSdBody"></tbody></table></div></section>
    <div class="section-heading"><h2><span class="tag">سجل</span> السجل التفصيلي</h2><span class="section-sub">الصفوف كما في الشيت، والتاب هو اسم التاب اليومي المصدر</span></div>
    <section class="table-panel"><div class="table-head-bar"><h3>صفوف المرتجعات</h3><span class="result-count"><b id="sLogCount">0</b> صف</span></div>
      <div class="table-scroll"><table id="sLogTbl"><thead><tr><th data-k="wb">رقم البوليصة <span class="arrow"></span></th><th data-k="sender">الراسل <span class="arrow"></span></th><th data-k="branch">الفرع <span class="arrow"></span></th><th data-k="status">حالة الشحنة <span class="arrow"></span></th><th data-k="pickup">استلام البيك أب <span class="arrow"></span></th><th data-k="close">تقفيل الشحنة <span class="arrow"></span></th><th data-k="ret">تقفيل المرتجع <span class="arrow"></span></th><th data-k="age">العمر (يوم) <span class="arrow"></span></th><th data-k="sla">الـ SLA <span class="arrow"></span></th><th data-k="nflags">الملاحظات <span class="arrow"></span></th><th data-k="tk">التاب <span class="arrow"></span></th></tr></thead><tbody id="sLogBody"></tbody></table></div>
      <div class="pager"><div class="pager-info" id="sPgInfo"></div><div class="pager-ctl"><button class="pg-btn" id="sPgPrev" type="button">السابق</button><span class="pager-info"><b id="sPgNow">1</b> / <b id="sPgAll">1</b></span><button class="pg-btn" id="sPgNext" type="button">التالي</button><select id="sPgSize"><option>25</option><option>50</option><option>100</option></select></div></div></section>
    <div class="note-box" style="margin-top:20px"><b>ملاحظات على المنهجية:</b> عمر المرتجع = تاريخ تقفيل المرتجع − تاريخ التقفيل. الافتراضي عمود «عمر المرتجع» كما هو في الشيت، والبديل المحسوب في الفلتر. «داخل الحد» = العمر ≤ الحد بالأيام، ولا يظهر أي حكم قبل إدخال حد معتمد. تواريخ الشيت يوم/شهر/سنة. أسماء الفروع موحّدة للعرض فقط (مثل «فرع رئيسى» و«فرع الرئيسى» ← الرئيسي)، والاسم الأصلي في السجل التفصيلي عند الحاجة. بوليصات كثيرة تظهر في أكثر من تاب، ولم تُستبعد افتراضيًا. الصفوف بلا تاريخ صالح لا تدخل في حساب العمر.</div>
  </main>`;

  // ---------- فلتر متعدد الاختيار ----------
  function makeMS(rootId, getOpts, set, placeholder, onChange) {
    const root = $(rootId), st = { open: false, term: '', focus: false };
    function render() {
      const chips = [...set].slice(0, 2).map((b) => '<span class="ms-chip"><span>' + esc(b) + '</span><button type="button" data-rm="' + esc(b) + '" aria-label="إزالة">×</button></span>').join('');
      const more = set.size > 2 ? '<span class="ms-chip-more">+' + (set.size - 2) + '</span>' : '';
      const ph = set.size === 0 ? '<span class="ms-placeholder">' + placeholder + '</span>' : '';
      const opts = getOpts().filter((b) => !st.term || b.includes(st.term)).slice(0, 300).map((b) => '<label class="ms-option"><input type="checkbox" value="' + esc(b) + '"' + (set.has(b) ? ' checked' : '') + '><span>' + esc(b) + '</span></label>').join('');
      root.className = 'ms' + (st.open ? ' open' : '');
      root.innerHTML = '<div class="ms-control" tabindex="0"><div class="ms-chips">' + ph + chips + more + '</div><span class="ms-caret">▼</span></div><div class="ms-panel"><input class="ms-search" placeholder="ابحث…" value="' + esc(st.term) + '"><div class="ms-actions"><button type="button" data-a="none">مسح</button></div><div class="ms-options">' + (opts || '<div class="ms-empty">لا توجد نتائج</div>') + '</div></div>';
      const inp = root.querySelector('.ms-search');
      if (st.open && st.focus) { inp.focus(); inp.setSelectionRange(inp.value.length, inp.value.length); }
    }
    root.addEventListener('click', (e) => {
      const rm = e.target.closest('[data-rm]');
      if (rm) { set.delete(rm.dataset.rm); st.focus = false; onChange(); return; }
      const a = e.target.closest('[data-a]');
      if (a) { set.clear(); onChange(); return; }
      const cb = e.target.closest('input[type=checkbox]');
      if (cb) { cb.checked ? set.add(cb.value) : set.delete(cb.value); st.focus = true; onChange(); return; }
      if (e.target.closest('.ms-control')) { st.open = !st.open; st.focus = st.open; render(); }
    });
    root.addEventListener('input', (e) => { if (e.target.classList.contains('ms-search')) { st.term = e.target.value; st.focus = true; render(); } });
    document.addEventListener('click', (e) => { if (st.open && !e.composedPath().includes(root)) { st.open = false; render(); } });
    return render;
  }

  // ---------- الحساب والعرض ----------
  const opts = { branch: () => [...new Set(ROWS.map((r) => r.branch))].sort((a, b) => a.localeCompare(b, 'ar')), status: () => [...new Set(ROWS.map((r) => r.status))].sort((a, b) => a.localeCompare(b, 'ar')), sender: () => [...new Set(ROWS.map((r) => r.sender))].sort((a, b) => a.localeCompare(b, 'ar')) };
  let msB, msT, msS;

  function compute() {
    const q = S.q.trim().toLowerCase();
    ALL = ROWS.filter((r) =>
      (S.dup === 'all' || (S.dup === 'last' ? r.isLast : r.isFirst)) &&
      (!S.branches.size || S.branches.has(r.branch)) && (!S.statuses.size || S.statuses.has(r.status)) && (!S.senders.size || S.senders.has(r.sender)) &&
      (S.final === 'all' || r.final === S.final) &&
      (!S.from || (r.ret && r.ret >= S.from)) && (!S.to || (r.ret && r.ret <= S.to)) &&
      (S.flag === 'all' || (S.flag === 'flag' ? r.flags.length > 0 : r.flags.length === 0)) &&
      (!q || r.wb.toLowerCase().includes(q) || r.sender.toLowerCase().includes(q)));
    CUR = ALL;
  }
  function group(rows, key) {
    const m = new Map(); rows.forEach((r) => { const k = r[key]; if (!m.has(k)) m.set(k, []); m.get(k).push(r); });
    return [...m].map(([k, v]) => Object.assign({ key: k }, stats(v, ageOf)));
  }
  const cmp = (a, b, k, d) => { const x = a[k], y = b[k]; if (x == null || y == null) return x == null && y == null ? 0 : x == null ? 1 : -1; return (typeof x === 'string' || typeof y === 'string' ? String(x).localeCompare(String(y), 'ar') : x - y) * d; };
  const css = (v) => getComputedStyle(document.documentElement).getPropertyValue(v).trim();
  const P = () => ({ blue: css('--arrive-blue') || '#0837C9', teal: css('--arrive-teal') || '#00C7E6', bad: css('--status-violation') || '#EF4444', warn: css('--status-under-action') || '#F59E0B', ink: css('--ink') || '#0F172A', faint: css('--ink-faint') || '#64748B', line: css('--line') || '#E2E8F0' });
  const mk = (id, cfg) => { const old = Chart.getChart(id); if (old) old.destroy(); return new Chart($(id), cfg); };
  const visible = () => !$('view-sla').hidden;

  function drawCharts() {
    if (!window.Chart || !visible()) return;
    try { drawChartsUnsafe(); } catch (e) { console.error('[sla-charts]', e); }
  }
  function drawChartsUnsafe() {
    const p = P();
    Chart.defaults.font.family = 'Cairo, Inter, system-ui, sans-serif'; Chart.defaults.color = p.faint;
    const o = { responsive: true, maintainAspectRatio: false, animation: false, plugins: { legend: { labels: { color: p.ink, boxWidth: 12 } } } };
    const byDay = group(CUR.filter((r) => r.ret), 'ret').sort((a, b) => a.key.localeCompare(b.key));
    mk('sChDaily', { data: { labels: byDay.map((d) => dmy(d.key).slice(0, 5)), datasets: [
      { type: 'bar', label: 'عدد المرتجعات', data: byDay.map((d) => d.rows), backgroundColor: p.blue, yAxisID: 'y' },
      { type: 'line', label: 'متوسط العمر (يوم)', data: byDay.map((d) => (d.avg == null ? null : +d.avg.toFixed(2))), borderColor: p.teal, backgroundColor: p.teal, yAxisID: 'y2', tension: .25, pointRadius: 3 }] },
      options: Object.assign({}, o, { scales: { x: { grid: { display: false } }, y: { grid: { color: p.line }, title: { display: true, text: 'صفوف' } }, y2: { position: 'right', beginAtZero: true, grid: { display: false }, title: { display: true, text: 'يوم' } } } }) });
    const bk = [['1', (a) => a <= 1], ['2', (a) => a === 2], ['3', (a) => a === 3], ['4-5', (a) => a >= 4 && a <= 5], ['6-7', (a) => a >= 6 && a <= 7], ['8-10', (a) => a >= 8 && a <= 10], ['11-15', (a) => a >= 11 && a <= 15], ['16+', (a) => a >= 16]];
    const ages = []; CUR.forEach((r) => { const a = ageOf(r); if (a != null) ages.push(a); });
    const t = thr();
    mk('sChDist', { type: 'bar', data: { labels: bk.map((b) => b[0]), datasets: [{ data: bk.map((b) => ages.filter(b[1]).length), backgroundColor: bk.map((b) => (t != null && !ages.filter(b[1]).every((a) => a <= t) ? p.bad : p.blue)) }] }, options: Object.assign({}, o, { plugins: { legend: { display: false } }, scales: { x: { grid: { display: false } }, y: { grid: { color: p.line } } } }) });
    const br = group(CUR, 'branch').filter((b) => b.avg != null).sort((a, b) => b.avg - a.avg).slice(0, 12);
    mk('sChBranch', { type: 'bar', data: { labels: br.map((b) => b.key + ' (' + fmt(b.rows) + ')'), datasets: [{ data: br.map((b) => +b.avg.toFixed(2)), backgroundColor: br.map((b) => (S.branches.has(b.key) ? p.teal : p.blue)) }] },
      options: Object.assign({}, o, { indexAxis: 'y', plugins: { legend: { display: false } }, onClick: (ev, els) => { if (!els.length) return; const b = br[els[0].index].key; S.branches.has(b) ? S.branches.delete(b) : S.branches.add(b); S.page = 1; refresh(); }, scales: { x: { grid: { color: p.line } }, y: { grid: { display: false } } } }) });
  }

  function renderKpis() {
    const T = stats(CUR, ageOf), t = thr();
    const uniq = new Set(CUR.map((r) => r.wb)).size;
    $('sK1').textContent = fmt(T.rows); $('sK1s').textContent = fmt(uniq) + ' بوليصة مميزة';
    $('sK2').textContent = f1(T.avg); $('sK2s').textContent = 'الوسيط ' + f1(T.med) + ' · الأقصى ' + fmt(T.max) + ' · مستبعد بلا عمر: ' + fmt(T.rows - T.n);
    $('sK3').textContent = t == null ? '—' : pct(T.rate); $('sK3s').textContent = t == null ? 'أدخل حد الـ SLA بالأيام لحسابها' : fmt(T.within) + ' من ' + fmt(T.n) + ' (العمر ≤ ' + t + ')';
    $('sK4').textContent = t == null ? '—' : fmt(T.late); $('sK4s').textContent = t == null ? 'لا يُحكم قبل تحديد الحد' : 'العمر > ' + t + ' يوم';
    const fl = CUR.filter((r) => r.flags.length).length;
    $('sK5').textContent = fmt(fl); $('sK5s').textContent = CUR.length ? pct(fl / CUR.length) + ' من الصفوف المعروضة' : '—';
    $('sKpiSub').textContent = 'محسوبة ضمن عوامل التصفية وأساس الحساب المختار';
  }
  function renderQuality() {
    const cnt = {}; CUR.forEach((r) => r.flags.forEach((f) => { cnt[f] = (cnt[f] || 0) + 1; }));
    $('sFlagTbl').innerHTML = '<thead><tr><th>الملاحظة</th><th class="num">عدد الصفوف</th><th>المعنى</th></tr></thead><tbody>' +
      (Object.keys(FL).filter((f) => cnt[f]).map((f) => '<tr><td>' + esc(FL[f][0]) + '</td><td class="num">' + fmt(cnt[f]) + '</td><td>' + esc(FL[f][1]) + '</td></tr>').join('') || '<tr><td colspan="3">لا توجد ملاحظات ضمن التصفية الحالية</td></tr>') + '</tbody>';
    const W = stats(CUR, (r) => (r.noDate ? null : r.ageS)), C = stats(CUR, (r) => (r.noDate ? null : r.ageC));
    const row = (lb, T, on) => '<tr class="' + (on ? 'on' : '') + '"><td>' + lb + '</td><td class="num">' + f1(T.avg) + '</td><td class="num">' + f1(T.med) + '</td><td class="num">' + fmt(T.max) + '</td><td class="num">' + (T.rate == null ? '—' : pct(T.rate)) + '</td></tr>';
    $('sSensTbl').innerHTML = '<thead><tr><th>أساس الحساب</th><th class="num">المتوسط</th><th class="num">الوسيط</th><th class="num">الأقصى</th><th class="num">داخل الحد</th></tr></thead><tbody>' + row('كما في الشيت', W, S.mode === 'written') + row('محسوب من التواريخ', C, S.mode === 'calc') + '</tbody>';
    const diff = CUR.filter((r) => !r.noDate && r.ageS != null && r.ageS !== r.ageC).length;
    $('sSensHint').textContent = CUR.length ? fmt(diff) + ' صف يختلف فيه عمر الشيت عن المحسوب (منها فرق اليوم الواحد لنفس اليوم).' : '';
  }
  function renderBranches() {
    const [k, d] = S.sort.br, list = group(CUR, 'branch').sort((a, b) => cmp(a, b, k, d) || a.key.localeCompare(b.key, 'ar'));
    $('sBrCount').textContent = fmt(list.length);
    $('sBrBody').innerHTML = list.length ? list.map((b) => '<tr data-b="' + esc(b.key) + '" style="cursor:pointer"><td>' + esc(b.key) + '</td><td class="num">' + fmt(b.rows) + '</td><td class="num">' + f1(b.avg) + '</td><td class="num">' + f1(b.med) + '</td><td class="num">' + fmt(b.max) + '</td><td class="num">' + fmt(b.late) + '</td><td class="num">' + pct(b.rate) + '</td></tr>').join('') : '<tr class="empty-row"><td colspan="7"><div class="empty-state"><b>لا توجد بيانات</b><span>غيّر عوامل التصفية</span></div></td></tr>';
    arrows('sBrTbl', S.sort.br);
  }
  function renderSenders() {
    const [k, d] = S.sort.sd, all = group(CUR, 'sender').sort((a, b) => cmp(a, b, k, d) || a.key.localeCompare(b.key, 'ar'));
    $('sSdCount').textContent = fmt(all.length);
    $('sSdBody').innerHTML = all.length ? all.slice(0, 100).map((b) => '<tr data-s="' + esc(b.key) + '" style="cursor:pointer"><td>' + esc(b.key) + '</td><td class="num">' + fmt(b.rows) + '</td><td class="num">' + f1(b.avg) + '</td><td class="num">' + fmt(b.max) + '</td><td class="num">' + fmt(b.late) + '</td></tr>').join('') : '<tr class="empty-row"><td colspan="5"><div class="empty-state"><b>لا توجد بيانات</b></div></td></tr>';
    arrows('sSdTbl', S.sort.sd);
  }
  function renderLog() {
    const t = thr();
    const rows = CUR.map((r) => Object.assign({}, r, { age: ageOf(r), nflags: r.flags.length, sla: t == null || ageOf(r) == null ? null : (ageOf(r) <= t ? 1 : 0) }));
    const [k, d] = S.sort.log;
    const sorted = rows.sort((a, b) => cmp(a, b, k, d) || a.id - b.id);
    const pages = Math.max(1, Math.ceil(sorted.length / S.size)); if (S.page > pages) S.page = pages;
    const slice = sorted.slice((S.page - 1) * S.size, S.page * S.size);
    $('sLogCount').textContent = fmt(sorted.length);
    $('sLogBody').innerHTML = slice.length ? slice.map((r) => {
      const badge = r.sla == null ? '<span style="color:var(--ink-faint)">—</span>' : '<span class="badge ' + (r.sla ? 'sla-in' : 'sla-out') + '">' + (r.sla ? 'داخل الحد' : 'خارج الحد') + '</span>';
      const fl = r.flags.map((f) => '<span class="flag-pill' + (f === 'مكرر_في_تابات' ? '' : ' dup') + '" title="' + esc(FL[f][1]) + '">' + esc(FL[f][0]) + '</span>').join('') || '<span style="color:var(--ink-faint)">—</span>';
      const alt = r.branchRaw !== r.branch && r.branch !== UNKNOWN ? ' <span class="hint" title="الاسم في الشيت">(' + esc(r.branchRaw) + ')</span>' : '';
      return '<tr><td class="id-cell num">' + esc(r.wb) + '</td><td>' + esc(r.sender) + '</td><td>' + esc(r.branch) + alt + '</td><td>' + esc(r.status) + '</td><td class="num">' + dmy(r.pickup) + '</td><td class="num">' + dmy(r.close) + '</td><td class="num">' + dmy(r.ret) + '</td><td class="num">' + (r.age == null ? '—' : fmt(r.age)) + '</td><td>' + badge + '</td><td>' + fl + '</td><td class="num">' + esc(r.tab) + '</td></tr>';
    }).join('') : '<tr class="empty-row"><td colspan="11"><div class="empty-state"><b>لا توجد صفوف</b><span>غيّر عوامل التصفية</span></div></td></tr>';
    $('sPgInfo').innerHTML = sorted.length ? 'عرض <b>' + ((S.page - 1) * S.size + 1) + '</b> – <b>' + Math.min(S.page * S.size, sorted.length) + '</b> من <b>' + fmt(sorted.length) + '</b>' : 'لا توجد صفوف';
    $('sPgNow').textContent = S.page; $('sPgAll').textContent = pages; $('sPgPrev').disabled = S.page <= 1; $('sPgNext').disabled = S.page >= pages;
    arrows('sLogTbl', S.sort.log);
  }
  function arrows(id, s) { document.querySelectorAll('#' + id + ' thead th').forEach((th) => { const a = th.querySelector('.arrow'); if (a) a.textContent = th.dataset.k === s[0] ? (s[1] > 0 ? '▲' : '▼') : ''; }); }
  function renderChips() {
    const c = [];
    if (S.branches.size) c.push(['الفرع: ' + [...S.branches].join('، '), () => S.branches.clear()]);
    if (S.statuses.size) c.push(['الحالة: ' + [...S.statuses].join('، '), () => S.statuses.clear()]);
    if (S.senders.size) c.push(['الراسل: ' + [...S.senders].slice(0, 3).join('، ') + (S.senders.size > 3 ? '…' : ''), () => S.senders.clear()]);
    if (S.final !== 'all') c.push(['الحالة النهائية: ' + S.final, () => { S.final = 'all'; $('sFinal').value = 'all'; }]);
    if (S.from) c.push(['من ' + dmy(S.from), () => { S.from = ''; $('sFrom').value = ''; }]);
    if (S.to) c.push(['إلى ' + dmy(S.to), () => { S.to = ''; $('sTo').value = ''; }]);
    if (S.flag !== 'all') c.push([S.flag === 'flag' ? 'عليها ملاحظة' : 'بدون ملاحظات', () => { S.flag = 'all'; $('sFlag').value = 'all'; }]);
    if (S.dup !== 'all') c.push([S.dup === 'last' ? 'آخر ظهور لكل بوليصة' : 'أول ظهور لكل بوليصة', () => { S.dup = 'all'; $('sDup').value = 'all'; }]);
    if (S.q.trim()) c.push(['بحث: ' + S.q, () => { S.q = ''; $('sQ').value = ''; }]);
    const bar = $('sActive');
    bar.className = 'active-filters-bar' + (c.length ? ' has-filters' : '');
    bar.innerHTML = c.length ? '<span class="active-filters-label">الفلاتر النشطة:</span>' + c.map((x, i) => '<span class="active-filter-chip">' + esc(x[0]) + '<button type="button" data-i="' + i + '" aria-label="إزالة">×</button></span>').join('') + '<button class="active-filters-clear-all" type="button" id="sClrAll">مسح الكل</button>' : '';
    bar.querySelectorAll('[data-i]').forEach((b) => (b.onclick = () => { c[b.dataset.i][1](); S.page = 1; refresh(); }));
    const x = bar.querySelector('#sClrAll'); if (x) x.onclick = resetAll;
    $('sLsFilters').textContent = c.length;
  }
  function refresh() {
    compute(); msB(); msT(); msS(); renderChips(); renderKpis(); renderQuality(); renderBranches(); renderSenders(); renderLog();
    $('sLsTotal').textContent = fmt(ROWS.length); $('sLsVisible').textContent = fmt(CUR.length); $('sResultCount').textContent = fmt(CUR.length);
    $('sLsMode').textContent = S.mode === 'calc' ? 'محسوب' : 'كما في الشيت';
    drawCharts();
  }
  function resetAll() {
    S.branches.clear(); S.statuses.clear(); S.senders.clear(); S.final = 'all'; S.from = S.to = ''; S.flag = 'all'; S.dup = 'all'; S.q = ''; S.page = 1;
    ['sQ', 'sFrom', 'sTo'].forEach((i) => ($(i).value = '')); $('sFinal').value = 'all'; $('sFlag').value = 'all'; $('sDup').value = 'all';
    refresh();
  }

  // ---------- تحميل البيانات ----------
  function setData(j, source) {
    ROWS = decode(j); META = { updatedAt: j.updatedAt, source };
    const finals = [...new Set(ROWS.map((r) => r.final))].sort((a, b) => a.localeCompare(b, 'ar'));
    $('sFinal').innerHTML = '<option value="all">كل الحالات</option>' + finals.map((f) => '<option value="' + esc(f) + '">' + esc(f) + '</option>').join('');
    $('sFinal').value = finals.includes(S.final) ? S.final : (S.final = 'all');
    [S.branches, S.statuses, S.senders].forEach((set, i) => { const ok = new Set([opts.branch, opts.status, opts.sender][i]()); [...set].forEach((v) => { if (!ok.has(v)) set.delete(v); }); });
    const rets = ROWS.map((r) => r.ret).filter(Boolean).sort();
    META.period = rets.length ? dmy(rets[0]) + ' — ' + dmy(rets[rets.length - 1]) : '';
    $('sConn').textContent = (source === 'live' ? 'مباشر من الشيت — ' : 'لقطة ثابتة — ') + (j.updatedAt ? new Date(j.updatedAt).toLocaleDateString('ar-EG') : '');
    if (visible()) { applyHeader(); refresh(); }
  }
  function loadSnap() {
    return new Promise((res) => {
      if (window.RTO_SNAP) return res(window.RTO_SNAP);
      const s = document.createElement('script'); s.src = 'sla-data.js';
      s.onload = () => res(window.RTO_SNAP || null); s.onerror = () => res(null); document.head.appendChild(s);
    });
  }
  async function pull() {
    if (!SLA_LIVE_URL) { $('sConn').textContent += ' (بدون رابط مباشر في sla.js)'; return; }
    $('sConn').textContent = 'جارٍ الاتصال بالشيت…';
    try {
      const res = await fetch(SLA_LIVE_URL, { cache: 'no-store' });
      const txt = await res.text();
      let j; try { j = JSON.parse(txt); } catch (e) { throw new Error('الرد ليس JSON (HTTP ' + res.status + ') — غالبًا النشر ليس «Anyone» أو الرابط ليس رابط Web app'); }
      if (!j.ok) throw new Error(j.error || 'رد غير صالح');
      setData(j, 'live');
    } catch (e) { $('sConn').textContent = 'تعذّر الاتصال: ' + e.message + ' — يُعرض آخر بيانات محمّلة'; console.error('[sla-live]', e); }
  }

  // ---------- التبويبات ----------
  const orig = {};
  function applyHeader() {
    const h1 = document.querySelector('h1.title'), sub = document.querySelector('.subtitle');
    const bs = document.querySelector('.brand-sys span');
    if (!orig.h1) { orig.h1 = h1.textContent; orig.sub = sub.textContent; orig.bs = bs.textContent; orig.foot = [...document.querySelectorAll('.footer-version-pill,.f-item')].map((e) => e.textContent); }
    const on = visible();
    h1.textContent = on ? 'لوحة SLA المرتجعات' : orig.h1;
    sub.textContent = on ? 'عمر المرتجع من تاريخ تقفيل الشحنة إلى تاريخ تقفيل المرتجع' + (META.period ? ' — تقفيل المرتجع: ' + META.period : '') : orig.sub;
    bs.textContent = on ? 'نظام متابعة SLA المرتجعات' : orig.bs;
    document.querySelectorAll('.top-meta,.header-meta-row').forEach((e) => (e.hidden = on));
    const foot = [...document.querySelectorAll('.footer-version-pill,.f-item')];
    foot.forEach((e, i) => { e.textContent = on ? ['SLA Returns', 'المصدر: شيت Sla RTO (تابات يومية)', META.updatedAt ? 'بيانات بتاريخ ' + dmy(String(META.updatedAt).slice(0, 10)) : ''][i] || '' : orig.foot[i]; });
  }
  async function show(which) {
    const sla = which === 'sla';
    $('view-match').hidden = sla; $('view-sla').hidden = !sla;
    document.querySelectorAll('.view-tab').forEach((b) => b.setAttribute('aria-selected', String(b.dataset.view === which)));
    try { history.replaceState(null, '', sla ? '#sla' : location.pathname + location.search); } catch (e) { /* ignore */ }
    if (sla && !ROWS.length) {
      $('sConn').textContent = 'جارٍ التحميل…';
      const snap = await loadSnap();
      if (snap) setData(snap, 'snap'); else $('sConn').textContent = 'تعذّر تحميل البيانات';
      pull();
    }
    applyHeader();
    if (sla && ROWS.length) refresh();
  }

  function init() {
    $('view-sla').innerHTML = VIEW;
    msB = makeMS('sMsBranch', opts.branch, S.branches, 'كل الفروع', () => { S.page = 1; refresh(); });
    msT = makeMS('sMsStatus', opts.status, S.statuses, 'كل الحالات', () => { S.page = 1; refresh(); });
    msS = makeMS('sMsSender', opts.sender, S.senders, 'كل الراسلين', () => { S.page = 1; refresh(); });
    const on = (id, ev, fn) => $(id).addEventListener(ev, fn);
    on('sQ', 'input', (e) => { S.q = e.target.value; S.page = 1; refresh(); });
    on('sFrom', 'change', (e) => { S.from = e.target.value; S.page = 1; refresh(); });
    on('sTo', 'change', (e) => { S.to = e.target.value; S.page = 1; refresh(); });
    on('sFinal', 'change', (e) => { S.final = e.target.value; S.page = 1; refresh(); });
    on('sFlag', 'change', (e) => { S.flag = e.target.value; S.page = 1; refresh(); });
    on('sMode', 'change', (e) => { S.mode = e.target.value; refresh(); });
    on('sDup', 'change', (e) => { S.dup = e.target.value; S.page = 1; refresh(); });
    on('sThr', 'input', (e) => { S.thr = e.target.value.trim(); refresh(); });
    $('sReset').onclick = resetAll; $('sReset2').onclick = resetAll;
    const bind = (id, key, render) => $(id).querySelector('thead').addEventListener('click', (e) => { const th = e.target.closest('th'); if (!th) return; const cur = S.sort[key]; S.sort[key] = [th.dataset.k, cur[0] === th.dataset.k ? -cur[1] : (['key', 'wb', 'sender', 'branch', 'status'].includes(th.dataset.k) ? 1 : -1)]; S.page = 1; render(); });
    bind('sLogTbl', 'log', renderLog); bind('sBrTbl', 'br', renderBranches); bind('sSdTbl', 'sd', renderSenders);
    on('sBrBody', 'click', (e) => { const tr = e.target.closest('tr[data-b]'); if (!tr) return; const b = tr.dataset.b; S.branches.has(b) ? S.branches.delete(b) : S.branches.add(b); S.page = 1; refresh(); });
    on('sSdBody', 'click', (e) => { const tr = e.target.closest('tr[data-s]'); if (!tr) return; const b = tr.dataset.s; S.senders.has(b) ? S.senders.delete(b) : S.senders.add(b); S.page = 1; refresh(); });
    $('sPgPrev').onclick = () => { S.page--; renderLog(); }; $('sPgNext').onclick = () => { S.page++; renderLog(); };
    on('sPgSize', 'change', (e) => { S.size = Number(e.target.value); S.page = 1; renderLog(); });
    document.querySelectorAll('.view-tab').forEach((b) => b.addEventListener('click', () => show(b.dataset.view)));
    new MutationObserver(() => { if (visible() && ROWS.length) drawCharts(); }).observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
    setInterval(() => { if (visible() && !document.hidden) pull(); }, SLA_REFRESH_SEC * 1000);
    if (location.hash === '#sla') show('sla');
  }
  init();
})();
