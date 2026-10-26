// تقرير قابل للطباعة/الحفظ PDF مبني على الفلاتر الحالية في اللوحة
(function () {
  const modeTxt = () => (S.mode === 'calc' ? 'محسوب: المرسل − (المستلم − غير المدرجة)' : 'كما في عمود الشيت');
  const tbl = (head, rows, numFrom) => '<table><thead><tr>' + head.map((h, i) => '<th' + (i >= numFrom ? ' class="n"' : '') + '>' + h + '</th>').join('') + '</tr></thead><tbody>' +
    rows.map((r) => '<tr>' + r.map((c, i) => '<td' + (i >= numFrom ? ' class="n"' : '') + '>' + c + '</td>').join('') + '</tr>').join('') + '</tbody></table>';

  function build() {
    const T = OCT.totals(CUR, S.mode), W = OCT.totals(CUR, 'written'), C = OCT.totals(CUR, 'calc');
    const ds = CUR.map((r) => r.date).sort();
    const period = ds.length ? dmy(ds[0]) + ' – ' + dmy(ds[ds.length - 1]) : 'لا توجد بيانات';
    const filters = [];
    filters.push('الفروع: ' + (S.branches.size ? [...S.branches].map(esc).join('، ') : 'كل الفروع'));
    filters.push('الفترة: ' + (S.from || S.to ? (S.from ? dmy(S.from) : 'البداية') + ' إلى ' + (S.to ? dmy(S.to) : 'النهاية') : 'كل الأيام'));
    filters.push('الملاحظات: ' + ({ all: 'كل الصفوف', flag: 'الصفوف الموسومة فقط', clean: 'الصفوف السليمة فقط' }[S.flag]));
    filters.push('استبعاد المكرر/المتابعة: ' + (S.excl === 'yes' ? 'نعم' : 'لا'));
    filters.push('طريقة غير المستلم: ' + modeTxt());
    if (S.q.trim()) filters.push('بحث: ' + esc(S.q.trim()));

    const br = OCT.group(CUR, 'branch', S.mode).sort((a, b) => b.unrecv - a.unrecv || a.key.localeCompare(b.key, 'ar'));
    const days = OCT.group(CUR, 'day', S.mode).sort((a, b) => a.key - b.key);
    const topN = br.filter((b) => b.unrecv > 0).slice(0, 5);
    const low = br.filter((b) => b.sent > 0).sort((a, b) => a.rate - b.rate).slice(0, 5);
    const full = br.filter((b) => b.sent > 0 && b.unrecv === 0).length;

    const fm = new Map();
    ALL.forEach((r) => r.flags.forEach((f) => { const o = fm.get(f) || { n: 0, sent: 0 }; o.n++; o.sent += r.sent; fm.set(f, o); }));
    const noDup = ALL.filter((r) => !isDup(r)), a = OCT.totals(ALL, 'written'), b2 = OCT.totals(noDup, 'written');

    const obs = [];
    if (T.sent) {
      obs.push('بلغت نسبة المطابقة <b>' + pct(T.rate) + '</b>: ' + fmt(T.matched) + ' شحنة مطابقة من ' + fmt(T.sent) + ' مرسلة، وغير المستلم ' + fmt(T.unrecv) + ' شحنة.');
      if (topN.length && br.length > 5) {
        const s = topN.reduce((x, y) => x + y.unrecv, 0);
        obs.push('أعلى ' + topN.length + ' فروع في غير المستلم (' + topN.map((x) => esc(x.key)).join('، ') + ') تمثل ' + fmt(s) + ' شحنة، أي ' + pct(T.unrecv ? s / T.unrecv : 0) + ' من إجمالي غير المستلم.');
      }
      obs.push(fmt(full) + ' من ' + fmt(br.filter((x) => x.sent > 0).length) + ' فرعًا بلا أي شحنات غير مستلمة ضمن هذه التصفية.');
    }
    if (W.unrecv !== C.unrecv) obs.push('يختلف غير المستلم بين «كما في الشيت» (' + fmt(W.unrecv) + ') و«المحسوب» (' + fmt(C.unrecv) + ')؛ الفرق ' + fmt(Math.abs(W.unrecv - C.unrecv)) + ' شحنة ويستدعي مراجعة أرقام الشيت.');
    if (T.flagged) obs.push(fmt(T.flagged) + ' صفًا (' + pct(T.flagged / T.rows) + ') عليها ملاحظات جودة بيانات، منها ' + fmt(CUR.filter(isDup).length) + ' مكرر/متابعة قد تضخّم المرسل.');

    const now = new Date().toLocaleString('ar-EG', { dateStyle: 'long', timeStyle: 'short' });
    const src = (document.querySelector('.last-updated-chip') || {}).textContent || '';
    return '<!doctype html><html lang="ar" dir="rtl"><head><meta charset="utf-8"><title>تقرير مطابقة المرتجعات — أكتوبر 2026</title><style>' +
      '@page{size:A4;margin:14mm}body{font-family:Cairo,Tahoma,Arial,sans-serif;color:#0f172a;font-size:12px;line-height:1.7;margin:0}' +
      'h1{font-size:20px;margin:0 0 2px;color:#0837c9}h2{font-size:14px;margin:18px 0 6px;border-right:4px solid #0837c9;padding-right:8px}' +
      '.meta{color:#475569;font-size:11px}.box{background:#f1f5f9;border-radius:6px;padding:8px 12px;margin:8px 0}.box li{margin:0}' +
      '.kpis{display:grid;grid-template-columns:repeat(5,1fr);gap:8px;margin:10px 0}.k{border:1px solid #cbd5e1;border-radius:6px;padding:8px;text-align:center}' +
      '.k b{display:block;font-size:17px;color:#0837c9}.k span{font-size:10px;color:#475569}' +
      'table{width:100%;border-collapse:collapse;margin:4px 0;font-size:11px;page-break-inside:auto}tr{page-break-inside:avoid}' +
      'th{background:#0837c9;color:#fff;padding:5px 6px;text-align:right}td{border-bottom:1px solid #e2e8f0;padding:4px 6px}' +
      '.n{text-align:left;font-variant-numeric:tabular-nums}ul{margin:4px 0;padding-right:18px}.note{font-size:10.5px;color:#475569}' +
      '.bar{position:sticky;top:0;background:#fff;padding:8px 0;border-bottom:1px solid #e2e8f0;margin-bottom:10px}@media print{.bar{display:none}}' +
      'button{font:inherit;padding:6px 16px;border:0;border-radius:6px;background:#0837c9;color:#fff;cursor:pointer}</style></head><body>' +
      '<div class="bar"><button onclick="print()">طباعة / حفظ PDF</button></div>' +
      '<h1>تقرير مطابقة المرتجعات — أكتوبر 2026</h1>' +
      '<div class="meta">الفترة المشمولة: ' + period + ' · أُعدّ في ' + now + ' · ' + esc(src.trim()) + '</div>' +
      '<h2>التصفية المطبّقة</h2><div class="box"><ul>' + filters.map((f) => '<li>' + f + '</li>').join('') + '</ul></div>' +
      '<h2>المؤشرات الرئيسية</h2><div class="kpis">' +
      [['المرسل', fmt(T.sent)], ['غير المستلم', fmt(T.unrecv)], ['نسبة المطابقة', pct(T.rate)], ['غير مدرجة', fmt(T.extra)], ['صفوف بملاحظات', fmt(T.flagged)]].map((k) => '<div class="k"><b>' + k[1] + '</b><span>' + k[0] + '</span></div>').join('') + '</div>' +
      '<div class="note">' + fmt(T.rows) + ' صف · ' + fmt(new Set(CUR.map((r) => r.branch)).size) + ' فرع · ' + fmt(T.days) + ' يوم. نسبة المطابقة = (المرسل − غير المستلم) ÷ المرسل.</div>' +
      '<h2>أهم النتائج (محسوبة من البيانات)</h2>' + (obs.length ? '<ul>' + obs.map((o) => '<li>' + o + '</li>').join('') + '</ul>' : '<div class="note">لا توجد بيانات ضمن التصفية الحالية.</div>') +
      '<h2>أداء الفروع</h2>' + tbl(['الفرع', 'صفوف', 'مرسل', 'غير مستلم', 'نسبة المطابقة', 'غير مدرجة', 'ملاحظات'], br.map((x) => [esc(x.key), fmt(x.rows), fmt(x.sent), fmt(x.unrecv), pct(x.rate), fmt(x.extra), fmt(x.flagged)]), 1) +
      (low.length ? '<h2>الفروع الأقل مطابقة</h2>' + tbl(['الفرع', 'مرسل', 'غير مستلم', 'نسبة المطابقة'], low.map((x) => [esc(x.key), fmt(x.sent), fmt(x.unrecv), pct(x.rate)]), 1) : '') +
      '<h2>الأداء اليومي</h2>' + tbl(['اليوم', 'مرسل', 'غير مستلم', 'نسبة المطابقة'], days.map((d) => [d.key + '/10', fmt(d.sent), fmt(d.unrecv), pct(d.rate)]), 1) +
      '<h2>جودة البيانات</h2>' + (fm.size ? tbl(['الملاحظة', 'صفوف', 'مرسل'], [...fm].sort((x, y) => y[1].n - x[1].n).map(([f, o]) => [esc(flName(f)) + ' — <span class="note">' + esc(FL[f] ? FL[f][1] : '') + '</span>', fmt(o.n), fmt(o.sent)]), 1) : '<div class="note">لا ملاحظات ضمن التصفية الحالية.</div>') +
      (ALL.length ? '<div class="note">استبعاد المكرر والمتابعة يزيل ' + fmt(a.sent - b2.sent) + ' شحنة من المرسل و' + fmt(a.unrecv - b2.unrecv) + ' من غير المستلم.</div>' : '') +
      '<h2>ملاحظات منهجية</h2><ul class="note"><li>المصدر: ورقة «شهر 10» في «تقرير المرتجعات»، والأرقام تتغير بتغير الشيت.</li><li>الصفوف لم تُعدَّل؛ وسوم الجودة للتنبيه فقط، ولا يثبت التقرير سببًا لأي فرق.</li><li>تواريخ الشيت مختلطة (يوم/شهر وشهر/يوم) وقد وُحّدت كتواريخ أكتوبر.</li></ul>' +
      '</body></html>';
  }

  const btn = document.getElementById('qaReport');
  if (btn) btn.onclick = () => {
    const w = window.open('', '_blank');
    if (!w) { alert('اسمح بالنوافذ المنبثقة لعرض التقرير'); return; }
    w.document.open(); w.document.write(build()); w.document.close();
  };
})();
