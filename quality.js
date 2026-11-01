// تبويب «جودة البيانات» — يجمع مشاكل البيانات من مصدرين (ورقة «شهر 10» + شيت Sla RTO)،
// ويكتب لكل مشكلة وصفًا بقيم الصف نفسه وموضعه في الشيت. قراءة فقط: لا يعدّل أي قيمة ولا يغيّر أي حساب في التبويبين الآخرين.
(function () {
  const $ = (id) => document.getElementById(id);
  const esc = (s) => String(s == null ? '' : s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const fmt = (n) => (n == null || Number.isNaN(n) ? '—' : Number(n).toLocaleString('en-US'));
  const pct = (x) => (x == null ? '—' : x > 0 && x < 0.001 ? 'أقل من 0.1%' : (x * 100).toFixed(1) + '%');
  const dmy = (d) => (d ? d.slice(8, 10) + '/' + d.slice(5, 7) + '/' + d.slice(0, 4) : '—');
  const SRC = { m: 'مطابقة المرتجعات', s: 'SLA المرتجعات' };

  // نوع المشكلة ← [الاسم، أثرها على الأرقام]
  const META = {
    'm:مكرر_متطابق': ['مكرر متطابق', 'قد يضخّم المرسل؛ يمكن استبعاده من فلتر «الصفوف المكررة / المتابعة» في تاب المطابقة'],
    'm:متابعة_متبقي': ['صف متابعة', 'احتمال أن الشحنات محسوبة مرتين؛ يمكن استبعاده من نفس الفلتر'],
    'm:تكرار_غير_واضح': ['تكرار غير واضح', 'يحتاج مراجعة يدوية لمعرفة هل الصفوف دفعات مختلفة أم تكرار'],
    'm:مستلم_اكبر_غير_مفسر': ['مستلم أكبر من المرسل', 'يرفع المستلم دون إرسال مسجّل يقابله'],
    'm:غير_مستلم_غير_مطابق': ['غير مستلم لا يطابق', 'قيمة العمود لا تطابق أي معادلة؛ يظهر أثرها في جدول حساسية الأرقام'],
    'm:حالة_غير_متسقة': ['حالة غير متسقة', 'حالة المطابقة تناقض الأرقام في الصف'],
    'm:فرعين_مدمجين': ['فرعان في خانة واحدة', 'الصف يُحتسب كفرع مستقل بدل أن يُوزَّع على الفرعين'],
    's:تاريخ_ناقص': ['تاريخ ناقص', 'يُستبعد الصف من حساب العمر'],
    's:عمر_شاذ': ['عمر لا يطابق التواريخ', 'يختلف العمر بين أساس «الشيت» وأساس «المحسوب»'],
    's:فرع_غير_محدد': ['فرع غير محدد', 'يتجمع الصف تحت «غير محدد بالمصدر» ولا يُنسب لفرع'],
    's:بيك_اب_فارغ': ['بيك أب فارغ', 'لا يؤثر على العمر (البيك أب ليس داخلًا في تعريفه)، وهو نقص في التسجيل'],
    's:مكرر_في_تابات': ['بوليصة متكررة', 'قد يضخّم عدد المرتجعات؛ يمكن مقارنته بفلتر «البوليصات المتكررة» في تاب SLA'],
  };

  const Q = { src: 'all', type: 'all', q: '', page: 1, size: 25, sort: ['src', 1] };
  let ISSUES = [], STATS = null;

  // ---------- بناء المشاكل ----------
  function matchIssues() {
    const M = window.ArriveMatch;
    if (!M) return { list: [], rows: 0, flagged: 0 };
    const rows = M.rows(), list = [];
    const sigOf = (r) => r.date + '|' + r.branch + '|' + r.sent + '|' + r.recv + '|' + r.unrecv + '|' + r.extra;
    const firstBySig = new Map(), prevOf = [], prev = new Map(), byDayBranch = new Map();
    rows.forEach((r, i) => {
      const sg = sigOf(r); if (!firstBySig.has(sg)) firstBySig.set(sg, r);
      prevOf[i] = prev.get(r.branch); prev.set(r.branch, r);
      const k = r.date + '|' + r.branch; if (!byDayBranch.has(k)) byDayBranch.set(k, []); byDayBranch.get(k).push(r.sheetRow);
    });
    let flagged = 0;
    rows.forEach((r, i) => {
      if (r.flags.length) flagged++;
      r.flags.forEach((f) => {
        let d = '';
        if (f === 'مكرر_متطابق') { const o = firstBySig.get(sigOf(r)); d = 'الصف مطابق تمامًا للصف ' + (o && o !== r ? o.sheetRow : '—') + ' (نفس اليوم والفرع: مرسل ' + fmt(r.sent) + '، مستلم ' + fmt(r.recv) + '، غير مستلم ' + fmt(r.unrecv) + '، غير مدرجة ' + fmt(r.extra) + ')'; }
        else if (f === 'متابعة_متبقي') { const p = prevOf[i]; d = 'المرسل ' + fmt(r.sent) + ' يساوي (±1) غير المستلم ' + (p ? fmt(p.unrecv) : '—') + ' في الصف ' + (p ? p.sheetRow : '—') + ' لنفس الفرع واليوم، فقد تكون الشحنات محسوبة مرتين'; }
        else if (f === 'تكرار_غير_واضح') { const g = byDayBranch.get(r.date + '|' + r.branch) || []; d = g.length + ' صفوف لنفس الفرع واليوم (الصفوف: ' + g.join('، ') + ') بأرقام مختلفة وبدون علاقة واضحة'; }
        else if (f === 'مستلم_اكبر_غير_مفسر') d = 'المستلم ' + fmt(r.recv) + ' أكبر من المرسل ' + fmt(r.sent) + ' بفارق ' + fmt(r.recv - r.sent) + '، و«غير المدرجة» ' + fmt(r.extra) + ' لا تفسر الفرق';
        else if (f === 'غير_مستلم_غير_مطابق') { const a = Math.min(r.sent, Math.max(0, r.sent - (r.recv - r.extra))), b = Math.max(0, r.sent - r.recv); d = 'غير المستلم في الشيت ' + fmt(r.unrecv) + '، بينما المعادلة تعطي ' + fmt(a) + ' (المرسل − (المستلم − غير المدرجة)) أو ' + fmt(b) + ' (المرسل − المستلم)'; }
        else if (f === 'حالة_غير_متسقة') d = 'الحالة «' + r.status + '» لكن غير المستلم = ' + fmt(r.unrecv);
        else if (f === 'فرعين_مدمجين') d = 'خانة الفرع «' + r.branch + '» تحتوي أكثر من فرع';
        const meta = META['m:' + f] || [f.replace(/_/g, ' '), ''];
        list.push({ src: 'm', code: 'm:' + f, label: meta[0], impact: meta[1], where: 'ورقة «شهر 10» — صف ' + r.sheetRow, rowNo: r.sheetRow, wb: '—', branch: r.branch, date: r.date, detail: d });
      });
    });
    return { list, rows: rows.length, flagged };
  }

  function slaIssues() {
    const A = window.ArriveSla;
    if (!A) return { list: [], rows: 0, flagged: 0 };
    const X = A.state(), rows = X.ROWS, list = [];
    const byWb = new Map(); rows.forEach((r) => { if (!byWb.has(r.wb)) byWb.set(r.wb, []); byWb.get(r.wb).push(r); });
    let flagged = 0;
    rows.forEach((r) => {
      if (r.flags.length) flagged++;
      const rowTxt = r.srow != null ? String(r.srow) : '≈' + (r.pos + 1);
      const where = 'تاب ' + r.tab + ' — صف ' + rowTxt + (r.srow != null ? '' : ' (تقديري)');
      r.flags.forEach((f) => {
        let d = '';
        if (f === 'تاريخ_ناقص') d = [!r.close ? 'تاريخ التقفيل فاضي أو غير مقروء' : '', !r.ret ? 'تاريخ تقفيل المرتجع فاضي أو غير مقروء' : ''].filter(Boolean).join(' و');
        else if (f === 'عمر_شاذ') d = 'عمر الشيت ' + fmt(r.ageS) + ' يوم بينما المحسوب ' + fmt(r.ageC) + ' يوم (من ' + dmy(r.close) + ' إلى ' + dmy(r.ret) + ')';
        else if (f === 'فرع_غير_محدد') d = 'خانة فرع المرتجع: «' + (r.branchRaw || 'فاضية') + '»';
        else if (f === 'بيك_اب_فارغ') d = 'تاريخ استلام البيك أب غير مسجل';
        else if (f === 'مكرر_في_تابات') { const g = byWb.get(r.wb) || []; d = 'نفس البوليصة ظاهرة في ' + g.length + ' صفوف: ' + g.slice(0, 6).map((x) => 'تاب ' + x.tab + ' (صف ' + (x.srow != null ? x.srow : '≈' + (x.pos + 1)) + ')').join('، ') + (g.length > 6 ? '…' : ''); }
        const meta = META['s:' + f] || [f.replace(/_/g, ' '), ''];
        list.push({ src: 's', code: 's:' + f, label: meta[0], impact: meta[1], where, rowNo: r.srow != null ? r.srow : r.pos + 1, tk: r.tk, wb: r.wb, branch: r.branch, date: r.ret || r.close || '', detail: d });
      });
    });
    return { list, rows: rows.length, flagged };
  }

  function build() {
    const m = matchIssues(), s = slaIssues();
    ISSUES = m.list.concat(s.list);
    STATS = { m, s };
  }

  // ---------- الفلترة ----------
  function filtered() {
    const q = Q.q.trim().toLowerCase();
    const list = ISSUES.filter((x) => (Q.src === 'all' || x.src === Q.src) && (Q.type === 'all' || x.code === Q.type) &&
      (!q || String(x.rowNo) === q || x.wb.toLowerCase().includes(q) || x.branch.toLowerCase().includes(q) || x.detail.toLowerCase().includes(q) || x.label.includes(q)));
    const [k, d] = Q.sort;
    return list.sort((a, b) => {
      let c;
      if (k === 'src') c = (a.src === b.src ? 0 : a.src < b.src ? -1 : 1) || (a.tk || 0) - (b.tk || 0) || a.rowNo - b.rowNo;
      else if (k === 'row') c = a.rowNo - b.rowNo;
      else c = String(a[k] || '').localeCompare(String(b[k] || ''), 'ar');
      return c * d;
    });
  }

  // ---------- الواجهة ----------
  const VIEW = `
  <div class="control-bar" style="position:static"><div class="live-stats">
    <div class="ls-item"><span class="ls-l">إجمالي المشاكل</span><span class="ls-v" id="qTotal">0</span></div>
    <div class="ls-item"><span class="ls-l">المعروضة</span><span class="ls-v" id="qVisible">0</span></div>
    <div class="ls-item"><span class="ls-l">حالة تحميل SLA</span><span class="ls-v" id="qLoad" style="direction:rtl">—</span></div></div>
    <div class="qa-spacer"></div><div class="quick-actions"><button class="qa-btn" id="qCsv" type="button">تصدير المشاكل (CSV)</button><button class="qa-btn" id="qReset" type="button">إعادة التصفية</button></div></div>
  <div class="filter-bar"><div class="filter-wrap">
    <div class="filter-head"><div class="filter-title">عوامل التصفية</div><div class="filter-head-actions"><span class="result-count"><b id="qCount">0</b> مشكلة</span></div></div>
    <div class="filter-grid">
      <div class="fgroup filter-search"><label for="qQ">بحث (رقم الصف أو البوليصة أو الفرع أو نص المشكلة)</label><input type="text" id="qQ" placeholder="اكتب للبحث…"></div>
      <div class="fgroup"><label for="qSrc">المصدر</label><select id="qSrc"><option value="all">كل المصادر</option><option value="m">مطابقة المرتجعات (ورقة شهر 10)</option><option value="s">SLA المرتجعات (شيت Sla RTO)</option></select></div>
      <div class="fgroup"><label for="qType">نوع المشكلة</label><select id="qType"></select></div>
    </div></div></div>
  <main>
    <div class="section-heading"><h2><span class="tag">ملخص</span> ملخص المشاكل</h2><span class="section-sub">الصفوف الأصلية لم تُعدّل، والمشاكل وسم فقط. اضغط على أي نوع لعرض صفوفه</span></div>
    <section class="kpi-row" id="qKpis"></section>
    <section class="table-panel"><div class="table-head-bar"><h3>المشاكل حسب النوع</h3></div>
      <div class="table-scroll"><table id="qSumTbl"></table></div></section>
    <div class="section-heading"><h2><span class="tag">صفوف</span> المشاكل وموضعها في الشيت</h2><span class="section-sub">كل سطر مشكلة واحدة. الصف الواحد قد يظهر أكثر من مرة إن كان فيه أكثر من مشكلة</span></div>
    <section class="table-panel"><div class="table-head-bar"><h3>تفاصيل المشاكل</h3><span class="result-count"><b id="qLogCount">0</b> سطر</span></div>
      <div class="table-scroll"><table id="qTbl"><thead><tr><th data-k="src">المصدر <span class="arrow"></span></th><th data-k="row">الموضع في الشيت <span class="arrow"></span></th><th data-k="wb">البوليصة <span class="arrow"></span></th><th data-k="branch">الفرع <span class="arrow"></span></th><th data-k="date">التاريخ <span class="arrow"></span></th><th data-k="label">نوع المشكلة <span class="arrow"></span></th><th>المشكلة بالتفصيل</th><th>أثرها على الأرقام</th></tr></thead><tbody id="qBody"></tbody></table></div>
      <div class="pager"><div class="pager-info" id="qPgInfo"></div><div class="pager-ctl"><button class="pg-btn" id="qPrev" type="button">السابق</button><span class="pager-info"><b id="qNow">1</b> / <b id="qAll">1</b></span><button class="pg-btn" id="qNext" type="button">التالي</button><select id="qSize"><option>25</option><option>50</option><option>100</option></select></div></div></section>
    <div class="note-box" style="margin-top:20px"><b>ملاحظات:</b> موضع صف تاب المطابقة هو رقم الصف في ورقة «شهر 10» نفسه. في SLA الموضع = اسم التاب اليومي + رقم الصف فيه؛ عند اتصال السكربت المحدّث بالشيت يظهر رقم الصف الفعلي، وقبل ذلك يظهر رقم تقديري مع علامة «≈» (ترتيب الصف داخل التاب + صف الترويسة) فاعتمد على رقم البوليصة للبحث. أسباب المشاكل ومسؤولية تصحيحها غير متوفرة في المصدر ولا تُستنتج هنا.</div>
  </main>`;

  function typeOptions() {
    const sel = $('qType'), cur = Q.type;
    const groups = ['m', 's'].filter((g) => Q.src === 'all' || Q.src === g).map((g) => '<optgroup label="' + SRC[g] + '">' + Object.keys(META).filter((k) => k[0] === g).map((k) => '<option value="' + k + '">' + esc(META[k][0]) + '</option>').join('') + '</optgroup>').join('');
    sel.innerHTML = '<option value="all">كل الأنواع</option>' + groups;
    sel.value = [...sel.options].some((o) => o.value === cur) ? cur : (Q.type = 'all');
  }

  function renderSummary() {
    const { m, s } = STATS;
    const cnt = {}; ISSUES.forEach((x) => { cnt[x.code] = (cnt[x.code] || 0) + 1; });
    $('qKpis').innerHTML =
      '<div class="stub tone-brand"><div class="stub-top"><div class="stub-main"><div class="stub-label">إجمالي المشاكل</div><div class="stub-value num">' + fmt(ISSUES.length) + '</div></div></div><div class="stub-sub">في المصدرين معًا</div></div>' +
      '<div class="stub tone-under-action"><div class="stub-top"><div class="stub-main"><div class="stub-label">مطابقة المرتجعات</div><div class="stub-value num">' + fmt(m.list.length) + '</div></div></div><div class="stub-sub">' + fmt(m.flagged) + ' صف من ' + fmt(m.rows) + ' · ' + pct(m.rows ? m.flagged / m.rows : null) + '</div></div>' +
      '<div class="stub tone-violation"><div class="stub-top"><div class="stub-main"><div class="stub-label">SLA المرتجعات</div><div class="stub-value num">' + (s.rows ? fmt(s.list.length) : '—') + '</div></div></div><div class="stub-sub">' + (s.rows ? fmt(s.flagged) + ' صف من ' + fmt(s.rows) + ' · ' + pct(s.flagged / s.rows) : 'جارٍ تحميل بيانات SLA…') + '</div></div>';
    const rowsOf = (c) => (c[0] === 'm' ? m.rows : s.rows);
    $('qSumTbl').innerHTML = '<thead><tr><th>المصدر</th><th>نوع المشكلة</th><th class="num">عدد الصفوف</th><th class="num">من إجمالي الصفوف</th><th>أثرها على الأرقام</th></tr></thead><tbody>' +
      Object.keys(META).filter((k) => cnt[k]).map((k) => '<tr data-t="' + k + '" style="cursor:pointer" class="' + (Q.type === k ? 'on' : '') + '"><td>' + SRC[k[0]] + '</td><td><b>' + esc(META[k][0]) + '</b></td><td class="num">' + fmt(cnt[k]) + '</td><td class="num">' + pct(rowsOf(k) ? cnt[k] / rowsOf(k) : null) + '</td><td>' + esc(META[k][1]) + '</td></tr>').join('') +
      (ISSUES.length ? '' : '<tr><td colspan="5" style="text-align:center;padding:18px;color:var(--ink-faint)">لا توجد مشاكل</td></tr>') + '</tbody>';
  }

  function render() {
    if (!$('qBody')) return;
    const list = filtered();
    const pages = Math.max(1, Math.ceil(list.length / Q.size)); if (Q.page > pages) Q.page = pages;
    const slice = list.slice((Q.page - 1) * Q.size, Q.page * Q.size);
    $('qTotal').textContent = fmt(ISSUES.length); $('qVisible').textContent = fmt(list.length); $('qCount').textContent = fmt(list.length); $('qLogCount').textContent = fmt(list.length);
    $('qBody').innerHTML = slice.length ? slice.map((x) => '<tr><td>' + SRC[x.src] + '</td><td class="num"><b>' + esc(x.where) + '</b></td><td class="id-cell num">' + esc(x.wb) + '</td><td>' + esc(x.branch) + '</td><td class="num">' + dmy(x.date) + '</td><td><span class="flag-pill' + (/متطابق|متابعة|مكرر/.test(x.label) ? '' : ' dup') + '">' + esc(x.label) + '</span></td><td style="min-width:320px;white-space:normal">' + esc(x.detail) + '</td><td style="min-width:220px;white-space:normal;color:var(--ink-soft)">' + esc(x.impact) + '</td></tr>').join('')
      : '<tr class="empty-row"><td colspan="8"><div class="empty-state"><b>لا توجد مشاكل</b><span>غيّر عوامل التصفية</span></div></td></tr>';
    $('qPgInfo').innerHTML = list.length ? 'عرض <b>' + ((Q.page - 1) * Q.size + 1) + '</b> – <b>' + Math.min(Q.page * Q.size, list.length) + '</b> من <b>' + fmt(list.length) + '</b>' : 'لا توجد مشاكل';
    $('qNow').textContent = Q.page; $('qAll').textContent = pages; $('qPrev').disabled = Q.page <= 1; $('qNext').disabled = Q.page >= pages;
    document.querySelectorAll('#qTbl thead th').forEach((th) => { const a = th.querySelector('.arrow'); if (a) a.textContent = th.dataset.k === Q.sort[0] ? (Q.sort[1] > 0 ? '▲' : '▼') : ''; });
    const sla = window.ArriveSla && window.ArriveSla.state();
    $('qLoad').textContent = sla && sla.ROWS.length ? 'محمّلة (' + fmt(sla.ROWS.length) + ' صف)' : 'جارٍ التحميل…';
  }
  function refreshAll() { if (!$('qBody')) return; build(); typeOptions(); renderSummary(); render(); }

  function csv() {
    const list = filtered(), q = (v) => '"' + String(v == null ? '' : v).replace(/"/g, '""') + '"';
    const head = ['المصدر', 'الموضع في الشيت', 'البوليصة', 'الفرع', 'التاريخ', 'نوع المشكلة', 'المشكلة بالتفصيل', 'أثرها على الأرقام'];
    const body = list.map((x) => [SRC[x.src], x.where, x.wb, x.branch, dmy(x.date), x.label, x.detail, x.impact].map(q).join(','));
    const blob = new Blob(['﻿' + [head.map(q).join(',')].concat(body).join('\r\n')], { type: 'text/csv;charset=utf-8' });
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = 'مشاكل-جودة-البيانات.csv'; document.body.appendChild(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(a.href), 1000);
  }

  function init() {
    const root = $('view-quality'); if (!root) return;
    root.innerHTML = VIEW;
    const on = (id, ev, fn) => $(id).addEventListener(ev, fn);
    on('qQ', 'input', (e) => { Q.q = e.target.value; Q.page = 1; render(); });
    on('qSrc', 'change', (e) => { Q.src = e.target.value; Q.page = 1; typeOptions(); renderSummary(); render(); });
    on('qType', 'change', (e) => { Q.type = e.target.value; Q.page = 1; renderSummary(); render(); });
    on('qSumTbl', 'click', (e) => { const tr = e.target.closest('tr[data-t]'); if (!tr) return; Q.type = Q.type === tr.dataset.t ? 'all' : tr.dataset.t; Q.src = Q.type === 'all' ? Q.src : Q.type[0]; $('qSrc').value = Q.src; Q.page = 1; typeOptions(); renderSummary(); render(); });
    on('qReset', 'click', () => { Q.src = 'all'; Q.type = 'all'; Q.q = ''; Q.page = 1; $('qQ').value = ''; $('qSrc').value = 'all'; typeOptions(); renderSummary(); render(); });
    on('qCsv', 'click', csv);
    $('qTbl').querySelector('thead').addEventListener('click', (e) => { const th = e.target.closest('th'); if (!th || !th.dataset.k) return; const k = th.dataset.k; Q.sort = [k, Q.sort[0] === k ? -Q.sort[1] : 1]; Q.page = 1; render(); });
    on('qPrev', 'click', () => { Q.page--; render(); }); on('qNext', 'click', () => { Q.page++; render(); });
    on('qSize', 'change', (e) => { Q.size = Number(e.target.value); Q.page = 1; render(); });
    refreshAll();
  }

  const visible = () => { const e = $('view-quality'); return e && !e.hidden; };
  window.ArriveQuality = {
    open() { refreshAll(); if (window.ArriveSla) window.ArriveSla.ensure().then(() => { if (visible()) refreshAll(); }); },
    issues: () => ISSUES,
  };
  document.addEventListener('arrive:data', () => { if (visible()) refreshAll(); });
  init();
})();
