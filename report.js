// تقرير A4 مبني على الفلاتر الحالية — بنفس نمط تقرير لوحة الشكاوى (غلاف، ملخص تنفيذي، رسوم، جداول، ختام)
// يعتمد على دوال الحساب نفسها في core.js دون أي حساب موازٍ للمؤشرات.
(function () {
  'use strict';
  const MISSING = 'غير محدد بالمصدر';
  const L = (n) => (n == null ? '—' : Number(n).toLocaleString('en-US'));
  const pp = (a, b) => (a == null || b == null ? '—' : (a - b >= 0 ? '+' : '−') + Math.abs((a - b) * 100).toFixed(2) + ' نقطة');
  const miss = () => '<span class="rp-miss">' + MISSING + '</span>';
  const chunk = (a, n) => { const o = []; for (let i = 0; i < a.length; i += n) o.push(a.slice(i, i + n)); return o; };
  let savedTheme = null;

  const page = (inner, cover) => '<section class="rp-page' + (cover ? ' cover' : '') + '">' + inner + '</section>';
  const head = (title, ctx) => '<header class="rp-head"><div class="rp-head-brand"><span class="rp-logo-tile"><img src="arrive-logo-white.png" alt="ARRIVE"></span><span class="rp-head-sys">إدارة المراجعة التشغيلية</span></div>' +
    '<div class="rp-head-title">' + ctx.title + '</div><div class="rp-head-period num">' + ctx.period + '</div></header><div class="rp-section"><h2>' + title + '</h2></div>';
  const foot = () => '<footer class="rp-foot"><span>ARRIVE · إدارة المراجعة التشغيلية</span><span class="rp-pn num"></span></footer>';
  const table = (cols, body, cls) => '<table class="rp-table ' + (cls || '') + '"><thead><tr>' + cols.map((c) => '<th' + (c.w ? ' style="width:' + c.w + '"' : '') + (c.num ? ' class="num"' : '') + '>' + c.t + '</th>').join('') + '</tr></thead><tbody>' + body + '</tbody></table>';
  const kpi = (l, v, tone) => '<div class="rp-kpi ' + (tone || '') + '"><div class="rp-kpi-l">' + l + '</div><div class="rp-kpi-v num">' + v + '</div></div>';

  // رسوم بألوان الطباعة (صورة PNG) من نفس بيانات اللوحة
  function chartImg(cfg, w, h) {
    if (!window.Chart) return '';
    try {
      const cv = document.createElement('canvas'); cv.width = w * 2; cv.height = h * 2;
      const holder = document.createElement('div'); holder.style.cssText = 'position:fixed;left:-9999px;top:0;width:' + w + 'px;height:' + h + 'px';
      holder.appendChild(cv); document.body.appendChild(holder);
      const font = { family: "'Cairo','Inter',sans-serif", size: 20 };
      const c = new Chart(cv, Object.assign({}, cfg, { options: Object.assign({ animation: false, responsive: false, devicePixelRatio: 1, layout: { padding: 8 } }, cfg.options(font)) }));
      const url = cv.toDataURL('image/png'); c.destroy(); holder.remove(); return url;
    } catch (e) { console.warn('report chart failed', e); return ''; }
  }
  const COL = { blue: '#0837C9', teal: '#00C7E6', bad: '#EF4444', grid: '#E2E8F0', ink: '#334155' };
  const axis = (font, extra) => Object.assign({ grid: { color: COL.grid }, ticks: { color: '#475569', font: font, maxRotation: 0 } }, extra || {});

  function build() {
    const mode = S.mode, T = OCT.totals(CUR, mode), W = OCT.totals(CUR, 'written'), C = OCT.totals(CUR, 'calc');
    const ds = CUR.map((r) => r.date).sort();
    const periodTxt = ds.length ? dmy(ds[0]) + ' ← ' + dmy(ds[ds.length - 1]) : MISSING;
    const ctx = { title: 'تقرير مطابقة المرتجعات', period: 'الفترة: ' + periodTxt };
    const chips = [];
    if (S.branches.size) chips.push('الفروع: ' + [...S.branches].map(esc).join('، '));
    if (S.from || S.to) chips.push('الفترة: ' + (S.from ? dmy(S.from) : 'البداية') + ' إلى ' + (S.to ? dmy(S.to) : 'النهاية'));
    if (S.flag !== 'all') chips.push(S.flag === 'flag' ? 'الصفوف الموسومة فقط' : 'الصفوف السليمة فقط');
    if (S.excl === 'yes') chips.push('استبعاد المكرر/المتابعة');
    if (S.q.trim()) chips.push('بحث: ' + esc(S.q.trim()));
    const modeTxt = mode === 'calc' ? 'محسوب: المرسل − (المستلم − غير المدرجة)' : 'كما في عمود الشيت';
    const stamp = [...document.querySelectorAll('.last-updated-chip > span:not(.lu-dot)')].map((e) => e.textContent.trim()).join(' ') || MISSING;
    const today = new Date().toLocaleDateString('en-GB');

    if (!CUR.length) return [page(head('لا توجد بيانات', ctx) + '<div class="rp-empty"><p>لا توجد بيانات وفقًا للفلاتر المحددة.</p></div>' + foot())];

    const br = OCT.group(CUR, 'branch', mode);
    const brUn = br.slice().sort((a, b) => b.unrecv - a.unrecv || a.key.localeCompare(b.key, 'ar'));
    const brRate = br.filter((b) => b.sent > 0).sort((a, b) => a.rate - b.rate || b.sent - a.sent);
    const days = OCT.group(CUR, 'day', mode).sort((a, b) => a.key - b.key);
    const pages = [];

    // 1) الغلاف
    pages.push(page('<div class="rp-cover-top"><img class="rp-cover-logo" src="arrive-logo-white.png" alt="ARRIVE"></div><div class="rp-cover-main"><div class="rp-cover-kicker">إدارة المراجعة التشغيلية</div>' +
      '<h1>تقرير مطابقة المرتجعات<br>المرسلة والمستلمة</h1><div class="rp-cover-rule"></div><dl class="rp-cover-meta">' +
      '<div><dt>الفترة المشمولة</dt><dd class="num">' + periodTxt + '</dd></div>' +
      '<div><dt>عدد الصفوف</dt><dd><span class="num">' + L(T.rows) + '</span> صف · <span class="num">' + L(br.length) + '</span> فرع</dd></div>' +
      '<div><dt>عوامل التصفية</dt><dd>' + (chips.length ? chips.join('، ') : 'لا توجد (كل الصفوف)') + '</dd></div>' +
      '<div><dt>أساس غير المستلم</dt><dd>' + esc(modeTxt) + '</dd></div>' +
      '<div><dt>آخر تحديث للبيانات</dt><dd>' + esc(stamp) + '</dd></div>' +
      '<div><dt>تاريخ إصدار التقرير</dt><dd class="num">' + today + '</dd></div></dl></div>' +
      '<div class="rp-cover-foot">المصدر: ورقة «شهر 10» في «تقرير المرتجعات» · الأرقام محسوبة من الصفوف ضمن عوامل التصفية أعلاه</div>', true));

    // 2) الملخص التنفيذي
    const topShare = brUn.slice(0, 5).reduce((s, b) => s + b.unrecv, 0);
    const bars = brUn.filter((b) => b.unrecv > 0).slice(0, 6);
    const att = [];
    if (T.flagged) att.push(['صفوف عليها ملاحظات جودة بيانات', T.flagged]);
    const dups = CUR.filter(isDup).length; if (dups) att.push(['صفوف مكررة/متابعة قد تضخّم المرسل', dups]);
    const over = CUR.filter((r) => r.flags.includes('مستلم_اكبر_غير_مفسر')).length; if (over) att.push(['مستلم أكبر من المرسل دون تفسير', over]);
    if (T.extra) att.push(['شحنات مستلمة غير مدرجة', T.extra]);
    pages.push(page(head('الملخص التنفيذي', ctx) +
      '<div class="rp-kpis">' + kpi('المرسل', L(T.sent), 'tone-brand') + kpi('غير المستلم', L(T.unrecv), 'tone-violation') +
      kpi('نسبة المطابقة', pct(T.rate), T.rate != null && T.rate < 0.8 ? 'tone-under-action' : 'tone-success') + kpi('غير مدرجة', L(T.extra), '') + '</div>' +
      '<p class="rp-note">' + L(T.rows) + ' صف · ' + L(br.length) + ' فرع · ' + L(T.days) + ' يوم. نسبة المطابقة = (المرسل − غير المستلم) ÷ المرسل = ' + L(T.matched) + ' ÷ ' + L(T.sent) + '.</p>' +
      '<div class="rp-cols"><div><h3>ما يحتاج انتباه الإدارة</h3>' +
      (att.length ? table([{ t: 'البند' }, { t: 'العدد', num: true, w: '20mm' }], att.map((a) => '<tr><td>' + a[0] + '</td><td class="num">' + L(a[1]) + '</td></tr>').join('')) : '<p class="rp-note">لا توجد ملاحظات ضمن التصفية الحالية.</p>') +
      '<h3>مقارنة داخل الفترة نفسها</h3>' + halves(days, mode) + '</div>' +
      '<div><h3>أعلى الفروع في غير المستلم</h3>' + (bars.length ? '<div class="rp-bars">' + bars.map((b) => '<div class="rp-bar-row"><span class="n">' + esc(b.key) + '</span><span class="tr"><span class="fl" style="width:' + Math.max(3, Math.round(b.unrecv / bars[0].unrecv * 100)) + '%"></span></span><span class="num">' + L(b.unrecv) + '</span></div>').join('') + '</div>' : '<p class="rp-note">لا توجد شحنات غير مستلمة.</p>') +
      '<div class="rp-facts"><div><span>أعلى 5 فروع من إجمالي غير المستلم</span><b class="num">' + pct(T.unrecv ? topShare / T.unrecv : 0) + '</b></div>' +
      '<div><span>غير المستلم «كما في الشيت»</span><b class="num">' + L(W.unrecv) + '</b></div><div><span>غير المستلم «محسوب»</span><b class="num">' + L(C.unrecv) + '</b></div></div></div></div>' + foot()));

    // 3) الرسوم
    const imgDaily = chartImg({ data: { labels: days.map((d) => d.key + '/10'), datasets: [
      { type: 'bar', label: 'مطابق', data: days.map((d) => d.matched), backgroundColor: COL.blue, stack: 's', yAxisID: 'y' },
      { type: 'bar', label: 'غير مستلم', data: days.map((d) => d.unrecv), backgroundColor: COL.bad, stack: 's', yAxisID: 'y' },
      { type: 'line', label: 'نسبة المطابقة %', data: days.map((d) => (d.rate == null ? null : +(d.rate * 100).toFixed(2))), borderColor: COL.teal, backgroundColor: COL.teal, yAxisID: 'y2', tension: .25, pointRadius: 4, borderWidth: 4 }] },
      options: (f) => ({ plugins: { legend: { position: 'bottom', labels: { color: COL.ink, font: f, boxWidth: 22 } }, tooltip: { enabled: false } },
        scales: { x: axis(f, { stacked: true, grid: { display: false } }), y: axis(f, { stacked: true, beginAtZero: true }), y2: axis(f, { position: 'right', min: 0, max: 100, grid: { display: false } }) } }) }, 1000, 360);
    const hbar = (list, val, color, tick) => chartImg({ type: 'bar', data: { labels: list.map((b) => b.key), datasets: [{ data: list.map(val), backgroundColor: color }] },
      options: (f) => ({ indexAxis: 'y', plugins: { legend: { display: false }, tooltip: { enabled: false } }, scales: { x: axis(f, { beginAtZero: true, ticks: { color: '#475569', font: f, callback: tick }}), y: axis(f, { grid: { display: false } }) } }) }, 480, 420);
    const imgUn = hbar(brUn.filter((b) => b.unrecv > 0).slice(0, 10), (b) => b.unrecv, COL.bad);
    const imgRt = hbar(brRate.slice(0, 10), (b) => +(b.rate * 100).toFixed(2), COL.blue, (v) => v + '%');
    const fig = (t, sub, src) => '<div class="rp-fig"><div class="rp-cap"><b>' + t + '</b><span>' + sub + '</span></div>' + (src ? '<img src="' + src + '" alt="' + t + '">' : '<div class="rp-note">تعذّر رسم الرسم (مكتبة الرسوم غير محمّلة)</div>') + '</div>';
    pages.push(page(head('الرسوم البيانية', ctx) + fig('الأداء اليومي', 'المطابق وغير المستلم (شحنات) مع نسبة المطابقة اليومية', imgDaily) +
      '<div class="rp-two">' + fig('أعلى 10 فروع في غير المستلم', 'عدد الشحنات', imgUn) + fig('أقل 10 فروع في نسبة المطابقة', 'نسبة المطابقة %', imgRt) + '</div>' + foot()));

    // 4) أداء الفروع
    const brCols = [{ t: 'الفرع' }, { t: 'صفوف', num: true, w: '14mm' }, { t: 'مرسل', num: true, w: '20mm' }, { t: 'غير مستلم', num: true, w: '22mm' }, { t: 'نسبة المطابقة', num: true, w: '26mm' }, { t: 'غير مدرجة', num: true, w: '20mm' }, { t: 'ملاحظات', num: true, w: '18mm' }];
    chunk(brUn, 30).forEach((grp, gi, all) => pages.push(page(head('أداء الفروع' + (all.length > 1 ? ' (' + (gi + 1) + '/' + all.length + ')' : ''), ctx) +
      table(brCols, grp.map((b) => '<tr><td>' + esc(b.key) + '</td><td class="num">' + L(b.rows) + '</td><td class="num">' + L(b.sent) + '</td><td class="num">' + L(b.unrecv) + '</td><td class="num">' + pct(b.rate) + '</td><td class="num">' + L(b.extra) + '</td><td class="num">' + L(b.flagged) + '</td></tr>').join(''), 'rp-compact') +
      (gi === all.length - 1 ? '<p class="rp-note">مرتّبة بأعلى غير مستلم. الحجم والنسبة معًا هما أساس القراءة؛ الفرع ذو الحجم الصغير قد تتأرجح نسبته بسرعة.</p>' : '') + foot())));

    // 5) الأداء اليومي
    pages.push(page(head('الأداء اليومي', ctx) + table([{ t: 'اليوم' }, { t: 'صفوف', num: true }, { t: 'مرسل', num: true }, { t: 'غير مستلم', num: true }, { t: 'نسبة المطابقة', num: true }, { t: 'غير مدرجة', num: true }],
      days.map((d) => '<tr><td class="num">' + d.key + '/10/2026</td><td class="num">' + L(d.rows) + '</td><td class="num">' + L(d.sent) + '</td><td class="num">' + L(d.unrecv) + '</td><td class="num">' + pct(d.rate) + '</td><td class="num">' + L(d.extra) + '</td></tr>').join(''), 'rp-compact') + foot()));

    // 6) النتائج والملاحظات
    const fnd = findings({ T, W, C, brUn, brRate, dups, over });
    chunk(fnd, 6).forEach((grp, gi, all) => pages.push(page(head('النتائج والملاحظات' + (all.length > 1 ? ' (' + (gi + 1) + '/' + all.length + ')' : ''), ctx) +
      table([{ t: 'م', w: '9mm', num: true }, { t: 'الملاحظة' }, { t: 'الدليل (من البيانات)' }, { t: 'الإجراء المقترح' }, { t: 'المسؤول / الاستحقاق', w: '28mm' }],
        grp.map((f, i) => '<tr><td class="num">' + (gi * 6 + i + 1) + '</td><td><b>' + f[0] + '</b></td><td>' + f[1] + '</td><td>' + f[2] + '</td><td>' + miss() + '</td></tr>').join(''), 'rp-findings') +
      '<p class="rp-note">الإجراءات «مقترحة» وليست قرارات معتمدة. السبب الجذري والمسؤول وتاريخ الاستحقاق غير متوفرة في مصدر البيانات، فلم تُستنتج.</p>' + foot())));

    // 7) جودة البيانات
    const fm = new Map(); ALL.forEach((r) => r.flags.forEach((f) => { const o = fm.get(f) || { n: 0, sent: 0 }; o.n++; o.sent += r.sent; fm.set(f, o); }));
    const noDup = ALL.filter((r) => !isDup(r)), a = OCT.totals(ALL, 'written'), b2 = OCT.totals(noDup, 'written');
    pages.push(page(head('جودة البيانات', ctx) + (fm.size ? table([{ t: 'الملاحظة' }, { t: 'صفوف', num: true, w: '18mm' }, { t: 'مرسل', num: true, w: '22mm' }],
      [...fm].sort((x, y) => y[1].n - x[1].n).map(([f, o]) => '<tr><td><b>' + esc(flName(f)) + '</b><div class="rp-note" style="margin:0">' + esc(FL[f] ? FL[f][1] : '') + '</div></td><td class="num">' + L(o.n) + '</td><td class="num">' + L(o.sent) + '</td></tr>').join('')) : '<p class="rp-note">لا توجد ملاحظات جودة ضمن التصفية الحالية.</p>') +
      '<h3>حساسية النسبة لطريقة الحساب</h3>' + table([{ t: 'الحالة' }, { t: 'مرسل', num: true }, { t: 'غير مستلم', num: true }, { t: 'النسبة', num: true }],
        [['written', 'no', 'كما في الشيت · كل الصفوف'], ['written', 'yes', 'كما في الشيت · بدون مكرر/متابعة'], ['calc', 'no', 'محسوب · كل الصفوف'], ['calc', 'yes', 'محسوب · بدون مكرر/متابعة']].map(([md, ex, lb]) => {
          const X = OCT.totals(ex === 'yes' ? noDup : ALL, md); return '<tr><td>' + lb + '</td><td class="num">' + L(X.sent) + '</td><td class="num">' + L(X.unrecv) + '</td><td class="num">' + pct(X.rate) + '</td></tr>'; }).join('')) +
      '<p class="rp-note">استبعاد المكرر والمتابعة يزيل ' + L(a.sent - b2.sent) + ' شحنة من المرسل و' + L(a.unrecv - b2.unrecv) + ' من غير المستلم.</p>' + foot()));

    // 7-ب) السجل التفصيلي — يُضاف فقط عند ضيق نطاق التصفية (فرع أو فترة محددة) حتى يبقى التقرير مقروءًا
    if (CUR.length <= 120) {
      const logCols = [{ t: 'صف الشيت', num: true, w: '16mm' }, { t: 'التاريخ', num: true, w: '22mm' }, { t: 'الفرع' }, { t: 'مرسل', num: true, w: '16mm' }, { t: 'مستلم', num: true, w: '16mm' }, { t: 'غير مستلم', num: true, w: '18mm' }, { t: 'غير مدرجة', num: true, w: '18mm' }, { t: 'الملاحظات' }];
      const logRows = CUR.slice().sort((x, y) => x.sheetRow - y.sheetRow);
      chunk(logRows, 32).forEach((grp, gi, all) => pages.push(page(head('السجل التفصيلي' + (all.length > 1 ? ' (' + (gi + 1) + '/' + all.length + ')' : ''), ctx) +
        table(logCols, grp.map((r) => '<tr><td class="num">' + r.sheetRow + '</td><td class="num">' + dmy(r.date) + '</td><td>' + esc(r.branch) + '</td><td class="num">' + L(r.sent) + '</td><td class="num">' + L(r.recv) + '</td><td class="num">' + L(OCT.unrecvOf(r, mode)) + '</td><td class="num">' + L(r.extra) + '</td><td>' + (r.flags.map(flName).map(esc).join('، ') || '—') + '</td></tr>').join(''), 'rp-compact') +
        (gi === all.length - 1 ? '<p class="rp-note">الصفوف كما في ورقة «شهر 10» ورقمها يطابق رقم الصف في الشيت. يظهر هذا القسم عندما لا يتجاوز عدد الصفوف المشمولة 120 صفًا.</p>' : '') + foot())));
    }

    // 8) الختام
    pages.push(page(head('الختام ومنهجية الإعداد', ctx) + '<div class="rp-close"><h3>أساس الإعداد</h3><ul>' +
      '<li>عدد الصفوف المشمولة: <b class="num">' + L(T.rows) + '</b> للفترة <b class="num">' + periodTxt + '</b>.</li>' +
      '<li>عوامل التصفية: ' + (chips.length ? chips.join('، ') : 'لا توجد (كل الصفوف).') + '</li>' +
      '<li>نسبة المطابقة = (المرسل − غير المستلم) ÷ المرسل. أساس غير المستلم: ' + esc(modeTxt) + '.</li>' +
      '<li>المصدر: ورقة «شهر 10» في «تقرير المرتجعات»؛ آخر تحديث: ' + esc(stamp) + '. الأرقام تتغير بتغير الشيت.</li>' +
      '<li>تواريخ الشيت مختلطة (يوم/شهر وشهر/يوم) وقد وُحّدت كتواريخ أكتوبر.</li></ul><h3>حدود التقرير</h3><ul>' +
      '<li>الصفوف لم تُعدَّل؛ وسوم الجودة للتنبيه فقط ولا تثبت سببًا لأي فرق.</li>' +
      '<li>لا توجد بيانات لفترة سابقة في المصدر، لذا المقارنة الواردة هي بين نصفي الفترة المختارة وليست مع شهر سابق.</li>' +
      '<li>الإجراءات الواردة مقترحة وتحتاج اعتماد الإدارة قبل اعتبارها قرارًا.</li></ul>' +
      '<div class="rp-sign"><div><span>إعداد</span><i></i></div><div><span>مراجعة</span><i></i></div><div><span>اعتماد</span><i></i></div></div><div class="rp-end">نهاية التقرير</div></div>' + foot()));
    return pages;
  }

  // مقارنة نصف الفترة الأول بالأخير (أيام الفترة المختارة فقط)
  function halves(days, mode) {
    if (days.length < 2) return '<p class="rp-note">تتطلب المقارنة يومين على الأقل.</p>';
    const k = Math.ceil(days.length / 2), f = new Set(days.slice(0, k).map((d) => d.key));
    const A = OCT.totals(CUR.filter((r) => f.has(r.day)), mode), B = OCT.totals(CUR.filter((r) => !f.has(r.day)), mode);
    const lab = (s, e) => s + '–' + e + '/10';
    return table([{ t: 'المؤشر' }, { t: lab(days[0].key, days[k - 1].key), num: true }, { t: lab(days[k].key, days[days.length - 1].key), num: true }, { t: 'التغيّر', num: true }],
      '<tr><td>المرسل</td><td class="num">' + L(A.sent) + '</td><td class="num">' + L(B.sent) + '</td><td class="num">' + (A.sent ? (B.sent - A.sent >= 0 ? '+' : '−') + Math.abs((B.sent - A.sent) / A.sent * 100).toFixed(1) + '%' : '—') + '</td></tr>' +
      '<tr><td>غير المستلم</td><td class="num">' + L(A.unrecv) + '</td><td class="num">' + L(B.unrecv) + '</td><td class="num">' + (A.unrecv ? (B.unrecv - A.unrecv >= 0 ? '+' : '−') + Math.abs((B.unrecv - A.unrecv) / A.unrecv * 100).toFixed(1) + '%' : '—') + '</td></tr>' +
      '<tr><td>نسبة المطابقة</td><td class="num">' + pct(A.rate) + '</td><td class="num">' + pct(B.rate) + '</td><td class="num">' + pp(B.rate, A.rate) + '</td></tr>', 'rp-compact') +
      '<p class="rp-note">النصف الأول مقابل الأخير من أيام التصفية الحالية، وليست مقارنة بشهر سابق.</p>';
  }

  // ملاحظات مشتقة من الأرقام فقط (لا أسباب مفترضة)
  function findings(x) {
    const out = [], T = x.T;
    const top = x.brUn.filter((b) => b.unrecv > 0).slice(0, 5);
    if (top.length >= 2 && x.brUn.length > 5) {
      const s = top.reduce((t, b) => t + b.unrecv, 0);
      out.push(['تركّز غير المستلم في عدد محدود من الفروع', top.map((b) => esc(b.key) + ' (' + L(b.unrecv) + ')').join('، ') + ' = ' + L(s) + ' شحنة، أي ' + pct(T.unrecv ? s / T.unrecv : 0) + ' من غير المستلم.', 'مراجعة مرتجعات هذه الفروع ومتابعة استلام الشحنات المتبقية.']);
    }
    const lowR = x.brRate.filter((b) => b.sent >= 50).slice(0, 3);
    if (lowR.length && lowR[0].rate < 1) out.push(['فروع بنسبة مطابقة منخفضة مع حجم إرسال معتبر (50 شحنة فأكثر)', lowR.map((b) => esc(b.key) + ' ' + pct(b.rate) + ' من ' + L(b.sent)).join('، ') + '.', 'مقارنة سجلات الإرسال بسجلات الاستلام لهذه الفروع.']);
    if (x.W.unrecv !== x.C.unrecv) out.push(['اختلاف بين غير المستلم المسجّل والمحسوب', 'المسجّل ' + L(x.W.unrecv) + ' مقابل المحسوب ' + L(x.C.unrecv) + ' (فرق ' + L(Math.abs(x.W.unrecv - x.C.unrecv)) + ').', 'مراجعة الصفوف الموسومة «غير مستلم لا يطابق» وتصحيح الشيت إن لزم.']);
    if (x.dups) out.push(['صفوف مكررة أو متابعة', L(x.dups) + ' صف قد يضخّم المرسل؛ لاحظ أثر استبعادها في قسم جودة البيانات.', 'تأكيد هل هي إدخالات مكررة أم دفعات متابعة فعلية.']);
    if (x.over) out.push(['مستلم أكبر من المرسل دون تفسير', L(x.over) + ' صف المستلم فيه أكبر من المرسل ولا تفسره «غير المدرجة».', 'مراجعة قيد الإرسال لهذه الصفوف.']);
    if (T.extra) out.push(['شحنات مستلمة بلا إرسال مسجّل', L(T.extra) + ' شحنة «غير مدرجة».', 'تسجيل إرسالها في الفرع المرسل.']);
    if (!out.length) out.push(['لا توجد ملاحظات بارزة ضمن التصفية الحالية', 'نسبة المطابقة ' + pct(T.rate) + '.', 'متابعة دورية.']);
    return out;
  }

  // يعرض صفحات جاهزة في المعاينة؛ build اختياري لتقارير التبويبات الأخرى (مثل SLA)
  function show(pages) {
    const ov = document.getElementById('reportOverlay'); if (!ov) return;
    savedTheme = document.documentElement.getAttribute('data-theme');
    document.documentElement.removeAttribute('data-theme');
    ov.innerHTML = '<div class="rp-toolbar"><div class="rp-tb-title">معاينة التقرير</div><div class="rp-tb-actions"><button type="button" class="icon-btn" id="rpPrint">طباعة / حفظ PDF</button><button type="button" class="icon-btn" id="rpClose">إغلاق</button></div></div><div class="rp-stage">' + pages.join('') + '</div>';
    const sheets = ov.querySelectorAll('.rp-page');
    sheets.forEach((p, i) => { const pn = p.querySelector('.rp-pn'); if (pn) pn.textContent = 'صفحة ' + (i + 1) + ' من ' + sheets.length; });
    ov.hidden = false; ov.setAttribute('aria-hidden', 'false'); document.body.classList.add('report-open');
    if (!document.getElementById('rpPageStyle')) { const st = document.createElement('style'); st.id = 'rpPageStyle'; st.textContent = '@page{size:A4 portrait;margin:0}'; document.head.appendChild(st); }
    ov.scrollTop = 0;
    document.getElementById('rpClose').onclick = close;
    document.getElementById('rpPrint').onclick = () => window.print();
    document.addEventListener('keydown', onKey);
  }
  function open(builder) {
    let pages;
    try { pages = (typeof builder === 'function' ? builder : build)(); } catch (e) { console.error(e); pages = [page('<div class="rp-empty"><p>تعذّر إعداد التقرير.</p></div>')]; }
    show(pages);
  }
  const onKey = (e) => { if (e.key === 'Escape') close(); };
  function close() {
    const ov = document.getElementById('reportOverlay'); if (!ov) return;
    ov.hidden = true; ov.setAttribute('aria-hidden', 'true'); ov.innerHTML = '';
    document.body.classList.remove('report-open');
    const ps = document.getElementById('rpPageStyle'); if (ps) ps.remove();
    if (savedTheme) document.documentElement.setAttribute('data-theme', savedTheme);
    document.removeEventListener('keydown', onKey);
  }
  const btn = document.getElementById('qaReport'); if (btn) btn.onclick = () => open();
  window.ArriveReport = { open, close, build, kit: { page, head, foot, table, kpi, chartImg, axis, COL, chunk, L, miss, MISSING } };
})();
