// تقرير A4 لتبويب «SLA المرتجعات» — مبني على فلاتر التبويب الحالية (نفس نمط تقرير المطابقة).
// يقرأ الحالة من ArriveSla.state() ويستخدم دوال sla.js نفسها (العمر، الحد، المجموعات) دون أي حساب موازٍ.
(function () {
  'use strict';
  const TR = (s) => ArriveI18n.tr(s);  // ترجمة عند العرض فقط (صور الرسوم)
  const R = window.ArriveReport, K = R && R.kit, A = window.ArriveSla;
  if (!K || !A) return;
  const { page, head, foot, table, kpi, chartImg, axis, COL, chunk, L, miss, MISSING } = K;
  const dmy = (d) => (d ? d.slice(8, 10) + '/' + d.slice(5, 7) + '/' + d.slice(0, 4) : '—');
  const f1 = (n) => (n == null || Number.isNaN(n) ? '—' : Number(n).toLocaleString('en-US', { maximumFractionDigits: 1 }));
  const p1 = (x) => (x == null ? '—' : (x * 100).toFixed(1) + '%');
  const sgn = (b, a, d) => (a == null || b == null ? '—' : (b - a >= 0 ? '+' : '−') + Math.abs(b - a).toFixed(d == null ? 1 : d));
  const BUCKETS = [['1 يوم أو أقل', (a) => a <= 1], ['2', (a) => a === 2], ['3', (a) => a === 3], ['4-5', (a) => a >= 4 && a <= 5], ['6-7', (a) => a >= 6 && a <= 7], ['8-10', (a) => a >= 8 && a <= 10], ['11-15', (a) => a >= 11 && a <= 15], ['16 فأكثر', (a) => a >= 16]];
  const MIN_BR = 30; // أقل عدد صفوف لإدراج الفرع في ترتيب «أعلى متوسط عمر» حتى لا تضلل العينات الصغيرة

  function build() {
    const X = A.state(), S = X.S, CUR = X.CUR, ALL = X.ALL, FL = X.FL, UNKNOWN = X.UNKNOWN;
    const T = X.stats(CUR, X.ageOf), t = X.thr();
    const rets = CUR.map((r) => r.ret).filter(Boolean).sort();
    const periodTxt = rets.length ? dmy(rets[0]) + ' ← ' + dmy(rets[rets.length - 1]) : MISSING;
    const ctx = { title: 'تقرير SLA المرتجعات', period: 'تقفيل المرتجع: ' + periodTxt };
    const modeTxt = S.mode === 'calc' ? 'محسوب: تاريخ تقفيل المرتجع − تاريخ التقفيل' : 'كما في عمود «عمر المرتجع» بالشيت';
    const thrTxt = t == null ? 'غير محدد بالمصدر (لم يُدخل حد معتمد، فلا يُصدر حكم داخل/خارج الحد)' : t + ' يوم (داخل الحد = العمر ≤ ' + t + ')';

    const chips = [];
    if (S.branches.size) chips.push('الفرع: ' + [...S.branches].map(esc).join('، '));
    if (S.statuses.size) chips.push('الحالة: ' + [...S.statuses].map(esc).join('، '));
    if (S.senders.size) chips.push('الراسل: ' + [...S.senders].slice(0, 4).map(esc).join('، ') + (S.senders.size > 4 ? ' و' + (S.senders.size - 4) + ' آخرين' : ''));
    if (S.final !== 'all') chips.push('الحالة النهائية: ' + esc(S.final));
    if (S.from || S.to) chips.push('تقفيل المرتجع: ' + (S.from ? dmy(S.from) : 'البداية') + ' إلى ' + (S.to ? dmy(S.to) : 'النهاية'));
    if (S.flag !== 'all') chips.push(S.flag === 'flag' ? 'الصفوف الموسومة فقط' : 'الصفوف السليمة فقط');
    if (S.dup !== 'all') chips.push(S.dup === 'last' ? 'آخر ظهور لكل بوليصة' : 'أول ظهور لكل بوليصة');
    if (S.q.trim()) chips.push('بحث: ' + esc(S.q.trim()));
    const filt = chips.length ? chips.join('، ') : 'لا توجد (كل الصفوف)';
    const upd = X.META.updatedAt ? dmy(String(X.META.updatedAt).slice(0, 10)) + (X.META.source === 'live' ? ' (مباشر)' : ' (لقطة)') : MISSING;
    const today = new Date().toLocaleDateString('en-GB');

    if (!CUR.length) return [page(head('لا توجد بيانات', ctx) + '<div class="rp-empty"><p>لا توجد بيانات وفقًا للفلاتر المحددة.</p></div>' + foot())];

    const br = X.group(CUR, 'branch'), sd = X.group(CUR, 'sender');
    const uniq = new Set(CUR.map((r) => r.wb)).size;
    const byAge = br.filter((b) => b.avg != null).sort((a, b) => b.avg - a.avg || b.rows - a.rows);
    const brRank = byAge.filter((b) => b.rows >= MIN_BR);
    const daysG = X.group(CUR.filter((r) => r.ret), 'ret').sort((a, b) => a.key.localeCompare(b.key));
    const ages = []; CUR.forEach((r) => { const a = X.ageOf(r); if (a != null) ages.push(a); });
    const pages = [];

    // 1) الغلاف
    pages.push(page('<div class="rp-cover-top"><img class="rp-cover-logo" src="../arrive-logo-white.png" alt="ARRIVE"></div><div class="rp-cover-main"><div class="rp-cover-kicker">إدارة المراجعة التشغيلية</div>' +
      '<h1>تقرير SLA المرتجعات<br>عمر المرتجع حتى التقفيل</h1><div class="rp-cover-rule"></div><dl class="rp-cover-meta">' +
      '<div><dt>الفترة المشمولة</dt><dd class="num">' + periodTxt + '</dd></div>' +
      '<div><dt>عدد الصفوف</dt><dd><span class="num">' + L(T.rows) + '</span> صف · <span class="num">' + L(uniq) + '</span> بوليصة · <span class="num">' + L(br.length) + '</span> فرع</dd></div>' +
      '<div><dt>عوامل التصفية</dt><dd>' + filt + '</dd></div>' +
      '<div><dt>أساس حساب العمر</dt><dd>' + esc(modeTxt) + '</dd></div>' +
      '<div><dt>حد الـ SLA</dt><dd>' + esc(thrTxt) + '</dd></div>' +
      '<div><dt>آخر تحديث للبيانات</dt><dd class="num">' + esc(upd) + '</dd></div>' +
      '<div><dt>تاريخ إصدار التقرير</dt><dd class="num">' + today + '</dd></div></dl></div>' +
      '<div class="rp-cover-foot">المصدر: شيت «Sla RTO» (تابات يومية) · الأرقام محسوبة من الصفوف ضمن عوامل التصفية أعلاه</div>', true));

    // 2) الملخص التنفيذي
    const dupRows = CUR.filter((r) => r.nDup > 1).length, noAge = T.rows - T.n;
    const att = [];
    const cnt = {}; CUR.forEach((r) => r.flags.forEach((f) => { cnt[f] = (cnt[f] || 0) + 1; }));
    Object.keys(FL).filter((f) => cnt[f]).forEach((f) => att.push([FL[f][0] + ' — ' + FL[f][1], cnt[f]]));
    const bars = brRank.slice(0, 6);
    pages.push(page(head('الملخص التنفيذي', ctx) +
      '<div class="rp-kpis">' + kpi('عدد المرتجعات', L(T.rows), 'tone-brand') + kpi('متوسط العمر (يوم)', f1(T.avg), '') +
      kpi('داخل حد الـ SLA', t == null ? '—' : p1(T.rate), t == null ? '' : (T.rate >= 0.9 ? 'tone-success' : 'tone-under-action')) + kpi('خارج الحد', t == null ? '—' : L(T.late), t == null ? '' : 'tone-violation') + '</div>' +
      '<p class="rp-note">الوسيط ' + f1(T.med) + ' يوم · الأقصى ' + L(T.max) + ' يوم · ' + L(T.n) + ' صفًا لها عمر مقروء' + (noAge ? ' و' + L(noAge) + ' صفًا بلا عمر (مستبعدة من المتوسط)' : '') + '. ' +
      (t == null ? 'لم يُحدد حد SLA معتمد، لذلك لا يُحكم على الالتزام.' : 'داخل الحد = ' + L(T.within) + ' من ' + L(T.n) + '.') + '</p>' +
      '<div class="rp-cols"><div><h3>ما يحتاج انتباه الإدارة</h3>' +
      (att.length ? table([{ t: 'البند' }, { t: 'الصفوف', num: true, w: '20mm' }], att.map((a) => '<tr><td>' + esc(a[0]) + '</td><td class="num">' + L(a[1]) + '</td></tr>').join(''), 'rp-compact') : '<p class="rp-note">لا توجد ملاحظات جودة ضمن التصفية الحالية.</p>') +
      '<h3>مقارنة داخل الفترة نفسها</h3>' + halves(X, daysG, t) + '</div>' +
      '<div><h3>أعلى الفروع في متوسط العمر</h3>' + (bars.length ? '<div class="rp-bars">' + bars.map((b) => '<div class="rp-bar-row"><span class="n">' + esc(b.key) + '</span><span class="tr"><span class="fl" style="width:' + Math.max(3, Math.round(b.avg / bars[0].avg * 100)) + '%"></span></span><span class="num">' + f1(b.avg) + '</span></div>').join('') + '</div><p class="rp-note">فروع بـ ' + MIN_BR + ' صفًا فأكثر.</p>' : '<p class="rp-note">لا يوجد فرع بـ ' + MIN_BR + ' صفًا فأكثر ضمن التصفية.</p>') +
      '<div class="rp-facts"><div><span>صفوف بوليصاتها متكررة بين التابات</span><b class="num">' + L(dupRows) + '</b></div>' +
      '<div><span>بوليصات مميزة</span><b class="num">' + L(uniq) + '</b></div>' +
      '<div><span>متوسط العمر «كما في الشيت»</span><b class="num">' + f1(X.stats(CUR, (r) => (r.noDate ? null : r.ageS)).avg) + '</b></div>' +
      '<div><span>متوسط العمر «محسوب»</span><b class="num">' + f1(X.stats(CUR, (r) => (r.noDate ? null : r.ageC)).avg) + '</b></div></div></div></div>' + foot()));

    // 3) الرسوم
    const imgDaily = chartImg({ data: { labels: daysG.map((d) => dmy(d.key).slice(0, 5)), datasets: [
      { type: 'bar', label: TR('عدد المرتجعات'), data: daysG.map((d) => d.rows), backgroundColor: COL.blue, yAxisID: 'y' },
      { type: 'line', label: TR('متوسط العمر (يوم)'), data: daysG.map((d) => (d.avg == null ? null : +d.avg.toFixed(2))), borderColor: COL.teal, backgroundColor: COL.teal, yAxisID: 'y2', tension: .25, pointRadius: 4, borderWidth: 4 }] },
      options: (f) => ({ plugins: { legend: { position: 'bottom', labels: { color: COL.ink, font: f, boxWidth: 22 } }, tooltip: { enabled: false } },
        scales: { x: axis(f, { grid: { display: false } }), y: axis(f, { beginAtZero: true }), y2: axis(f, { position: 'right', beginAtZero: true, grid: { display: false } }) } }) }, 1000, 360);
    const bcnt = BUCKETS.map((b) => ages.filter(b[1]).length);
    const imgDist = chartImg({ type: 'bar', data: { labels: BUCKETS.map((b) => TR(b[0])), datasets: [{ data: bcnt, backgroundColor: BUCKETS.map((b) => (t != null && !ages.filter(b[1]).every((a) => a <= t) ? COL.bad : COL.blue)) }] },
      options: (f) => ({ plugins: { legend: { display: false }, tooltip: { enabled: false } }, scales: { x: axis(f, { grid: { display: false } }), y: axis(f, { beginAtZero: true }) } }) }, 480, 420);
    const top10 = brRank.slice(0, 10);
    const imgBr = chartImg({ type: 'bar', data: { labels: top10.map((b) => TR(b.key) + ' (' + L(b.rows) + ')'), datasets: [{ data: top10.map((b) => +b.avg.toFixed(2)), backgroundColor: COL.blue }] },
      options: (f) => ({ indexAxis: 'y', plugins: { legend: { display: false }, tooltip: { enabled: false } }, scales: { x: axis(f, { beginAtZero: true }), y: axis(f, { grid: { display: false } }) } }) }, 480, 420);
    const fig = (ti, sub, src) => '<div class="rp-fig"><div class="rp-cap"><b>' + ti + '</b><span>' + sub + '</span></div>' + (src ? '<img src="' + src + '" alt="' + ti + '">' : '<div class="rp-note">تعذّر رسم الرسم (مكتبة الرسوم غير محمّلة)</div>') + '</div>';
    pages.push(page(head('الرسوم البيانية', ctx) + fig('المرتجعات اليومية ومتوسط عمرها', 'عدد المرتجعات حسب تاريخ تقفيل المرتجع، والخط متوسط العمر (يوم)', imgDaily) +
      '<div class="rp-two">' + fig('توزيع عمر المرتجع', 'عدد المرتجعات في كل شريحة عمر (يوم)' + (t != null ? ' — الأحمر يتجاوز الحد' : ''), imgDist) +
      fig('أعلى 10 فروع في متوسط العمر', 'فروع بـ ' + MIN_BR + ' صفًا فأكثر، والرقم بين القوسين عدد الصفوف', imgBr) + '</div>' + foot()));

    // 4) توزيع العمر
    const tot = ages.length || 1;
    let cum = 0;
    pages.push(page(head('توزيع عمر المرتجع', ctx) + table([{ t: 'شريحة العمر (يوم)' }, { t: 'العدد', num: true }, { t: 'النسبة', num: true }, { t: 'التراكمي', num: true }, { t: 'الحكم', w: '28mm' }],
      BUCKETS.map((b, i) => { cum += bcnt[i]; const ok = t == null ? null : ages.filter(b[1]).every((a) => a <= t);
        return '<tr><td class="num">' + b[0] + '</td><td class="num">' + L(bcnt[i]) + '</td><td class="num">' + p1(bcnt[i] / tot) + '</td><td class="num">' + p1(cum / tot) + '</td><td>' + (ok == null ? miss() : (bcnt[i] === 0 ? '—' : ok ? 'داخل الحد' : 'يتجاوز الحد (كليًا أو جزئيًا)')) + '</td></tr>'; }).join(''), 'rp-compact') +
      '<p class="rp-note">الأساس: ' + L(ages.length) + ' صفًا لها عمر. ' + (t == null ? 'عمود «الحكم» غير محدد بالمصدر لأن حد الـ SLA غير مُدخل.' : 'الشريحة التي تحتوي أعمارًا على جانبي الحد (' + t + ') تُعلَّم «يتجاوز الحد» ولو جزئيًا؛ استخدم عدد «خارج الحد» الدقيق في الملخص.') + '</p>' + foot()));

    // 5) أداء الفروع
    const brSorted = br.slice().sort((a, b) => (b.avg == null) - (a.avg == null) || (a.avg == null ? 0 : b.avg - a.avg) || b.rows - a.rows);
    const brCols = [{ t: 'الفرع' }, { t: 'صفوف', num: true, w: '16mm' }, { t: 'متوسط العمر', num: true, w: '22mm' }, { t: 'الوسيط', num: true, w: '16mm' }, { t: 'الأقصى', num: true, w: '16mm' }, { t: 'خارج الحد', num: true, w: '20mm' }, { t: 'داخل الحد %', num: true, w: '22mm' }];
    chunk(brSorted, 30).forEach((grp, gi, all) => pages.push(page(head('أداء الفروع' + (all.length > 1 ? ' (' + (gi + 1) + '/' + all.length + ')' : ''), ctx) +
      table(brCols, grp.map((b) => '<tr><td>' + esc(b.key) + '</td><td class="num">' + L(b.rows) + '</td><td class="num">' + f1(b.avg) + '</td><td class="num">' + f1(b.med) + '</td><td class="num">' + L(b.max) + '</td><td class="num">' + (t == null ? '—' : L(b.late)) + '</td><td class="num">' + p1(b.rate) + '</td></tr>').join(''), 'rp-compact') +
      (gi === all.length - 1 ? '<p class="rp-note">مرتّبة بأعلى متوسط عمر. الفرع ذو الصفوف القليلة قد يتأرجح متوسطه بسرعة، فاقرأ المتوسط مع عدد الصفوف.' + (br.some((b) => b.key === UNKNOWN) ? ' «' + UNKNOWN + '» صفوف لم يحدد المصدر فرعها.' : '') + '</p>' : '') + foot())));

    // 6) الراسلون
    const sdTop = sd.slice().sort((a, b) => b.rows - a.rows || a.key.localeCompare(b.key, 'ar')).slice(0, 25);
    pages.push(page(head('أكثر الراسلين مرتجعات', ctx) + table([{ t: 'الراسل' }, { t: 'صفوف', num: true, w: '16mm' }, { t: 'متوسط العمر', num: true, w: '22mm' }, { t: 'الأقصى', num: true, w: '16mm' }, { t: 'خارج الحد', num: true, w: '20mm' }],
      sdTop.map((b) => '<tr><td>' + esc(b.key) + '</td><td class="num">' + L(b.rows) + '</td><td class="num">' + f1(b.avg) + '</td><td class="num">' + L(b.max) + '</td><td class="num">' + (t == null ? '—' : L(b.late)) + '</td></tr>').join(''), 'rp-compact') +
      '<p class="rp-note">أعلى 25 راسلًا بعدد الصفوف من أصل ' + L(sd.length) + ' راسلًا ضمن التصفية الحالية.</p>' + foot()));

    // 7) الأداء اليومي
    chunk(daysG, 26).forEach((grp, gi, all) => pages.push(page(head('الأداء اليومي حسب تقفيل المرتجع' + (all.length > 1 ? ' (' + (gi + 1) + '/' + all.length + ')' : ''), ctx) +
      table([{ t: 'تاريخ التقفيل' }, { t: 'صفوف', num: true }, { t: 'متوسط العمر', num: true }, { t: 'الأقصى', num: true }, { t: 'خارج الحد', num: true }, { t: 'داخل الحد %', num: true }],
        grp.map((d) => '<tr><td class="num">' + dmy(d.key) + '</td><td class="num">' + L(d.rows) + '</td><td class="num">' + f1(d.avg) + '</td><td class="num">' + L(d.max) + '</td><td class="num">' + (t == null ? '—' : L(d.late)) + '</td><td class="num">' + p1(d.rate) + '</td></tr>').join(''), 'rp-compact') + foot())));

    // 8) النتائج والملاحظات
    const fnd = findings({ X, T, t, brRank, dupRows, noAge, cnt, uniq });
    chunk(fnd, 6).forEach((grp, gi, all) => pages.push(page(head('النتائج والملاحظات' + (all.length > 1 ? ' (' + (gi + 1) + '/' + all.length + ')' : ''), ctx) +
      table([{ t: 'م', w: '9mm', num: true }, { t: 'الملاحظة' }, { t: 'الدليل (من البيانات)' }, { t: 'الإجراء المقترح' }, { t: 'المسؤول / الاستحقاق', w: '28mm' }],
        grp.map((f, i) => '<tr><td class="num">' + (gi * 6 + i + 1) + '</td><td><b>' + f[0] + '</b></td><td>' + f[1] + '</td><td>' + f[2] + '</td><td>' + miss() + '</td></tr>').join(''), 'rp-findings') +
      '<p class="rp-note">الإجراءات «مقترحة» وليست قرارات معتمدة. السبب الجذري والمسؤول وتاريخ الاستحقاق غير متوفرة في مصدر البيانات، فلم تُستنتج.</p>' + foot())));

    // 9) جودة البيانات وحساسية أساس الحساب
    const W = X.stats(CUR, (r) => (r.noDate ? null : r.ageS)), C = X.stats(CUR, (r) => (r.noDate ? null : r.ageC));
    const diff = CUR.filter((r) => !r.noDate && r.ageS != null && r.ageS !== r.ageC).length;
    const srow = (lb, Z) => '<tr><td>' + lb + '</td><td class="num">' + f1(Z.avg) + '</td><td class="num">' + f1(Z.med) + '</td><td class="num">' + L(Z.max) + '</td><td class="num">' + p1(Z.rate) + '</td></tr>';
    pages.push(page(head('جودة البيانات', ctx) + (Object.keys(cnt).length ? table([{ t: 'الملاحظة' }, { t: 'الصفوف', num: true, w: '20mm' }, { t: 'النسبة', num: true, w: '20mm' }],
      Object.keys(FL).filter((f) => cnt[f]).map((f) => '<tr><td><b>' + esc(FL[f][0]) + '</b><div class="rp-note" style="margin:0">' + esc(FL[f][1]) + '</div></td><td class="num">' + L(cnt[f]) + '</td><td class="num">' + p1(cnt[f] / T.rows) + '</td></tr>').join('')) : '<p class="rp-note">لا توجد ملاحظات جودة ضمن التصفية الحالية.</p>') +
      '<h3>حساسية العمر لأساس الحساب</h3>' + table([{ t: 'أساس الحساب' }, { t: 'المتوسط', num: true }, { t: 'الوسيط', num: true }, { t: 'الأقصى', num: true }, { t: 'داخل الحد', num: true }], srow('كما في الشيت', W) + srow('محسوب من التواريخ', C), 'rp-compact') +
      '<p class="rp-note">' + L(diff) + ' صفًا يختلف فيه عمر الشيت عن المحسوب (لا يُحتسب فرق اليوم الواحد لنفس اليوم). الأساس المعتمد في هذا التقرير: ' + esc(modeTxt) + '.</p>' + foot()));

    // 10) أقدم المرتجعات (دائمًا — تحتاج متابعة مباشرة)
    const oldest = CUR.map((r) => ({ r, a: X.ageOf(r) })).filter((x) => x.a != null).sort((x, y) => y.a - x.a || x.r.id - y.r.id).slice(0, 18);
    pages.push(page(head('أقدم 18 مرتجعًا ضمن التصفية', ctx) + table([{ t: 'البوليصة', w: '28mm' }, { t: 'الراسل' }, { t: 'الفرع', w: '22mm' }, { t: 'الحالة', w: '38mm' }, { t: 'تقفيل الشحنة', num: true, w: '22mm' }, { t: 'تقفيل المرتجع', num: true, w: '22mm' }, { t: 'العمر', num: true, w: '12mm' }],
      oldest.map((x) => '<tr><td class="num">' + esc(x.r.wb) + '</td><td>' + esc(x.r.sender) + '</td><td>' + esc(x.r.branch) + '</td><td>' + esc(x.r.status) + '</td><td class="num">' + dmy(x.r.close) + '</td><td class="num">' + dmy(x.r.ret) + '</td><td class="num">' + L(x.a) + '</td></tr>').join(''), 'rp-compact') +
      '<p class="rp-note">الأعلى عمرًا حسب أساس الحساب المختار، للمتابعة المباشرة. السجل الكامل متاح في اللوحة.</p>' + foot()));

    // 11) الختام
    pages.push(page(head('الختام ومنهجية الإعداد', ctx) + '<div class="rp-close"><h3>أساس الإعداد</h3><ul>' +
      '<li>عدد الصفوف المشمولة: <b class="num">' + L(T.rows) + '</b> (<b class="num">' + L(uniq) + '</b> بوليصة) لتقفيل مرتجع في الفترة <b class="num">' + periodTxt + '</b>.</li>' +
      '<li>عوامل التصفية: ' + filt + '.</li>' +
      '<li>عمر المرتجع = تاريخ تقفيل المرتجع − تاريخ التقفيل. أساس الحساب: ' + esc(modeTxt) + '.</li>' +
      '<li>حد الـ SLA: ' + esc(thrTxt) + '.</li>' +
      '<li>المصدر: شيت «Sla RTO» (تابات يومية)؛ آخر تحديث: ' + esc(upd) + '. الأرقام تتغير بتغير الشيت.</li>' +
      '<li>الصفوف بلا تاريخ صالح لا تدخل في حساب العمر (' + L(noAge) + ' في هذا التقرير).</li></ul><h3>حدود التقرير</h3><ul>' +
      '<li>الصفوف لم تُعدَّل؛ وسوم الجودة للتنبيه فقط، وأسماء الفروع موحّدة للعرض فقط.</li>' +
      '<li>البوليصات المتكررة بين التابات ' + (S.dup === 'all' ? 'مُدرجة كلها (كما في الشيت)' : 'مفلترة حسب الخيار المحدد') + '، وقد تضخّم العدد إن كانت إدخالًا مكررًا.</li>' +
      '<li>لا توجد بيانات لفترة سابقة في المصدر، والمقارنة الواردة بين نصفي الفترة المختارة وليست مع شهر سابق.</li>' +
      '<li>الإجراءات الواردة مقترحة وتحتاج اعتماد الإدارة قبل اعتبارها قرارًا.</li></ul>' +
      '<div class="rp-sign"><div><span>إعداد</span><i></i></div><div><span>مراجعة</span><i></i></div><div><span>اعتماد</span><i></i></div></div><div class="rp-end">نهاية التقرير</div></div>' + foot()));
    return pages;
  }

  // نصف الفترة الأول مقابل الأخير حسب أيام تقفيل المرتجع المعروضة
  function halves(X, daysG, t) {
    if (daysG.length < 2) return '<p class="rp-note">تتطلب المقارنة يومين على الأقل.</p>';
    const k = Math.ceil(daysG.length / 2), first = new Set(daysG.slice(0, k).map((d) => d.key));
    const A1 = X.stats(X.CUR.filter((r) => r.ret && first.has(r.ret)), X.ageOf), B1 = X.stats(X.CUR.filter((r) => r.ret && !first.has(r.ret)), X.ageOf);
    const lab = (a, b) => dmy(a).slice(0, 5) + '–' + dmy(b).slice(0, 5);
    const chg = (a, b) => (a ? (b - a >= 0 ? '+' : '−') + Math.abs((b - a) / a * 100).toFixed(1) + '%' : '—');
    return table([{ t: 'المؤشر' }, { t: lab(daysG[0].key, daysG[k - 1].key), num: true }, { t: lab(daysG[k].key, daysG[daysG.length - 1].key), num: true }, { t: 'التغيّر', num: true }],
      '<tr><td>عدد المرتجعات</td><td class="num">' + L(A1.rows) + '</td><td class="num">' + L(B1.rows) + '</td><td class="num">' + chg(A1.rows, B1.rows) + '</td></tr>' +
      '<tr><td>متوسط العمر (يوم)</td><td class="num">' + f1(A1.avg) + '</td><td class="num">' + f1(B1.avg) + '</td><td class="num">' + sgn(B1.avg, A1.avg, 1) + ' يوم</td></tr>' +
      (t == null ? '' : '<tr><td>داخل الحد %</td><td class="num">' + p1(A1.rate) + '</td><td class="num">' + p1(B1.rate) + '</td><td class="num">' + (A1.rate == null || B1.rate == null ? '—' : (B1.rate - A1.rate >= 0 ? '+' : '−') + Math.abs((B1.rate - A1.rate) * 100).toFixed(1) + ' نقطة') + '</td></tr>'), 'rp-compact') +
      '<p class="rp-note">النصف الأول مقابل الأخير من أيام التصفية الحالية، وليست مقارنة بشهر سابق.</p>';
  }

  // ملاحظات مشتقة من الأرقام فقط (لا أسباب مفترضة)
  function findings(x) {
    const out = [], T = x.T, t = x.t;
    if (t == null) out.push(['حد الـ SLA غير معتمد في المصدر', 'لا يمكن الحكم على الالتزام (داخل/خارج الحد). متوسط العمر ' + f1(T.avg) + ' يوم، الوسيط ' + f1(T.med) + '، الأقصى ' + L(T.max) + '.', 'اعتماد حد SLA للمرتجعات ثم إدخاله في فلتر «حد الـ SLA» لإعادة إصدار التقرير.']);
    else out.push(['الالتزام بحد الـ SLA (' + t + ' يوم)', L(T.within) + ' من ' + L(T.n) + ' (' + p1(T.rate) + ') داخل الحد، و' + L(T.late) + ' خارجه.', T.late ? 'مراجعة المرتجعات خارج الحد بدءًا من الأقدم (قسم أقدم المرتجعات).' : 'متابعة دورية.']);
    const hi = x.brRank.filter((b) => T.avg != null && b.avg >= T.avg + 1).slice(0, 4);
    if (hi.length) out.push(['فروع متوسط عمرها أعلى من المتوسط العام بيوم فأكثر (30 صفًا فأكثر)', hi.map((b) => esc(b.key) + ' ' + f1(b.avg) + ' يوم من ' + L(b.rows)).join('، ') + ' مقابل المتوسط العام ' + f1(T.avg) + '.', 'مقارنة مراحل المرتجع في هذه الفروع (الاستلام ← التقفيل).']);
    if (x.t != null) {
      const lateBr = x.X.group(x.X.CUR, 'branch').filter((b) => b.late > 0).sort((a, b) => b.late - a.late).slice(0, 3);
      if (lateBr.length && T.late) { const s = lateBr.reduce((a, b) => a + b.late, 0); out.push(['تركّز المرتجعات خارج الحد في فروع محددة', lateBr.map((b) => esc(b.key) + ' (' + L(b.late) + ')').join('، ') + ' = ' + L(s) + ' مرتجعًا، أي ' + p1(s / T.late) + ' مما خارج الحد.', 'متابعة هذه الفروع أولًا.']); }
    }
    const dupShare = x.dupRows ? x.dupRows / T.rows : 0;
    if (x.dupRows) out.push(['بوليصات متكررة بين التابات', L(x.dupRows) + ' صفًا (' + p1(dupShare) + ') بوليصتها ظاهرة في أكثر من تاب، والبوليصات المميزة ' + L(x.uniq) + ' من ' + L(T.rows) + ' صفًا.', 'تأكيد هل هي إعادة محاولة فعلية أم إدخال مكرر، واستخدم فلتر «البوليصات المتكررة» لمقارنة الأثر.']);
    if (x.cnt['فرع_غير_محدد']) out.push(['صفوف بلا فرع محدد بالمصدر', L(x.cnt['فرع_غير_محدد']) + ' صفًا (' + p1(x.cnt['فرع_غير_محدد'] / T.rows) + ') تظهر تحت «' + x.X.UNKNOWN + '».', 'استكمال خانة فرع المرتجع في الشيت حتى تُنسب النتائج للفروع.']);
    if (x.noAge || x.cnt['عمر_شاذ']) out.push(['صفوف لا يمكن الاعتماد على عمرها', L(x.noAge) + ' صفًا بلا تاريخ صالح، و' + L(x.cnt['عمر_شاذ'] || 0) + ' صفًا عمر الشيت فيها لا يطابق التواريخ.', 'مراجعة التواريخ في الصفوف الموسومة وتصحيحها في الشيت.']);
    return out;
  }

  const btn = document.getElementById('sReport'); if (btn) btn.onclick = () => R.open(build);
  window.ArriveSlaReport = { build };
})();
