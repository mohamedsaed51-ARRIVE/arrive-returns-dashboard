# الفروق بين ملفات i18n/ وأصولها (دليل أن التعديل محدود)

## app.js
```diff
> const TR = (s) => ArriveI18n.tr(s);  // ترجمة عند العرض فقط (الرسوم)
<     { type: 'bar', label: 'مطابق', data: days.map((d) => d.matched), backgroundColor: P.blue, stack: 's', yAxisID: 'y' },
<     { type: 'bar', label: 'غير مستلم', data: days.map((d) => d.unrecv), backgroundColor: P.bad, stack: 's', yAxisID: 'y' },
<     { type: 'line', label: 'نسبة المطابقة %', data: days.map((d) => (d.rate == null ? null : +(d.rate * 100).toFixed(2))), borderColor: P.teal, backgroundColor: P.teal, yAxisID: 'y2', tension: .25, pointRad
<     options: Object.assign({}, o, { scales: { x: { stacked: true, grid: { display: false } }, y: { stacked: true, grid: { color: P.line }, title: { display: true, text: 'شحنات' } }, y2: { position: 'right', min: 0
>     { type: 'bar', label: TR('مطابق'), data: days.map((d) => d.matched), backgroundColor: P.blue, stack: 's', yAxisID: 'y' },
>     { type: 'bar', label: TR('غير مستلم'), data: days.map((d) => d.unrecv), backgroundColor: P.bad, stack: 's', yAxisID: 'y' },
>     { type: 'line', label: TR('نسبة المطابقة %'), data: days.map((d) => (d.rate == null ? null : +(d.rate * 100).toFixed(2))), borderColor: P.teal, backgroundColor: P.teal, yAxisID: 'y2', tension: .25, poin
>     options: Object.assign({}, o, { scales: { x: { stacked: true, grid: { display: false } }, y: { stacked: true, grid: { color: P.line }, title: { display: true, text: TR('شحنات') } }, y2: { position: 'right', mi
<   mk('chBranchUn', { type: 'bar', data: { labels: top.map((b) => b.key), datasets: [{ data: top.map((b) => b.unrecv), backgroundColor: top.map((b) => (S.branches.has(b.key) ? P.teal : P.bad)) }] }, options: hOpts(top, 
<   mk('chBranchRate', { type: 'bar', data: { labels: low.map((b) => b.key), datasets: [{ data: low.map((b) => +(b.rate * 100).toFixed(2)), backgroundColor: low.map((b) => (S.branches.has(b.key) ? P.teal : P.blue)) }] },
>   mk('chBranchUn', { type: 'bar', data: { labels: top.map((b) => TR(b.key)), datasets: [{ data: top.map((b) => b.unrecv), backgroundColor: top.map((b) => (S.branches.has(b.key) ? P.teal : P.bad)) }] }, options: hOpts(t
>   mk('chBranchRate', { type: 'bar', data: { labels: low.map((b) => TR(b.key)), datasets: [{ data: low.map((b) => +(b.rate * 100).toFixed(2)), backgroundColor: low.map((b) => (S.branches.has(b.key) ? P.teal : P.blue)) }
> // (i18n) إعادة الرسم والعرض عند تبديل اللغة
> ArriveI18n.onChange(() => { refresh(); });
```
## sla.js
```diff
>   const TR = (s) => ArriveI18n.tr(s);  // ترجمة عند العرض فقط (الرسوم)
<       { type: 'bar', label: 'عدد المرتجعات', data: byDay.map((d) => d.rows), backgroundColor: p.blue, yAxisID: 'y' },
<       { type: 'line', label: 'متوسط العمر (يوم)', data: byDay.map((d) => (d.avg == null ? null : +d.avg.toFixed(2))), borderColor: p.teal, backgroundColor: p.teal, yAxisID: 'y2', tension: .25, pointRadius:
<       options: Object.assign({}, o, { scales: { x: { grid: { display: false } }, y: { grid: { color: p.line }, title: { display: true, text: 'صفوف' } }, y2: { position: 'right', beginAtZero: true, grid: { display: 
>       { type: 'bar', label: TR('عدد المرتجعات'), data: byDay.map((d) => d.rows), backgroundColor: p.blue, yAxisID: 'y' },
>       { type: 'line', label: TR('متوسط العمر (يوم)'), data: byDay.map((d) => (d.avg == null ? null : +d.avg.toFixed(2))), borderColor: p.teal, backgroundColor: p.teal, yAxisID: 'y2', tension: .25, pointRad
>       options: Object.assign({}, o, { scales: { x: { grid: { display: false } }, y: { grid: { color: p.line }, title: { display: true, text: TR('صفوف') } }, y2: { position: 'right', beginAtZero: true, grid: { displ
<     mk('sChDist', { type: 'bar', data: { labels: bk.map((b) => b[0]), datasets: [{ data: bk.map((b) => ages.filter(b[1]).length), backgroundColor: bk.map((b) => (t != null && !ages.filter(b[1]).every((a) => a <= t) ? p
>     mk('sChDist', { type: 'bar', data: { labels: bk.map((b) => TR(b[0])), datasets: [{ data: bk.map((b) => ages.filter(b[1]).length), backgroundColor: bk.map((b) => (t != null && !ages.filter(b[1]).every((a) => a <= t)
<     mk('sChBranch', { type: 'bar', data: { labels: br.map((b) => b.key + ' (' + fmt(b.rows) + ')'), datasets: [{ data: br.map((b) => +b.avg.toFixed(2)), backgroundColor: br.map((b) => (S.branches.has(b.key) ? p.teal : 
>     mk('sChBranch', { type: 'bar', data: { labels: br.map((b) => TR(b.key) + ' (' + fmt(b.rows) + ')'), datasets: [{ data: br.map((b) => +b.avg.toFixed(2)), backgroundColor: br.map((b) => (S.branches.has(b.key) ? p.tea
<     $('sConn').textContent = (source === 'live' ? 'مباشر من الشيت — ' : 'لقطة ثابتة — ') + (j.updatedAt ? new Date(j.updatedAt).toLocaleDateString('ar-EG') : '');
>     $('sConn').textContent = (source === 'live' ? 'مباشر من الشيت — ' : 'لقطة ثابتة — ') + (j.updatedAt ? new Date(j.updatedAt).toLocaleDateString(ArriveI18n.getLang() === 'en' ? 'en-GB' : 'ar-
<       const s = document.createElement('script'); s.src = 'sla-data.js';
>       const s = document.createElement('script'); s.src = '../sla-data.js';
<     if (!orig.h1) { orig.h1 = h1.textContent; orig.sub = sub.textContent; orig.bs = bs.textContent; orig.foot = [...document.querySelectorAll('.footer-version-pill,.f-item')].map((e) => e.textContent); }
>     if (!orig.h1) { orig.h1 = ArriveI18n.srcText(h1); orig.sub = ArriveI18n.srcText(sub); orig.bs = ArriveI18n.srcText(bs); orig.foot = [...document.querySelectorAll('.footer-version-pill,.f-item')].map((e) => ArriveI1
>   // (i18n) إعادة الرسم عند تبديل اللغة
>   ArriveI18n.onChange(() => { if (ROWS.length) { applyHeader(); if (visible()) refresh(); } });
```
## report.js
```diff
>   const TR = (s) => ArriveI18n.tr(s);  // ترجمة عند العرض فقط (صور الرسوم)
<   const head = (title, ctx) => '<header class="rp-head"><div class="rp-head-brand"><span class="rp-logo-tile"><img src="arrive-logo-white.png" alt="ARRIVE"></span><span class="rp-head-sys">إدارة المراجعة �
>   const head = (title, ctx) => '<header class="rp-head"><div class="rp-head-brand"><span class="rp-logo-tile"><img src="../arrive-logo-white.png" alt="ARRIVE"></span><span class="rp-head-sys">إدارة المراجع�
<     pages.push(page('<div class="rp-cover-top"><img class="rp-cover-logo" src="arrive-logo-white.png" alt="ARRIVE"></div><div class="rp-cover-main"><div class="rp-cover-kicker">إدارة المراجعة التشغي�
>     pages.push(page('<div class="rp-cover-top"><img class="rp-cover-logo" src="../arrive-logo-white.png" alt="ARRIVE"></div><div class="rp-cover-main"><div class="rp-cover-kicker">إدارة المراجعة التشغ
<       { type: 'bar', label: 'مطابق', data: days.map((d) => d.matched), backgroundColor: COL.blue, stack: 's', yAxisID: 'y' },
<       { type: 'bar', label: 'غير مستلم', data: days.map((d) => d.unrecv), backgroundColor: COL.bad, stack: 's', yAxisID: 'y' },
<       { type: 'line', label: 'نسبة المطابقة %', data: days.map((d) => (d.rate == null ? null : +(d.rate * 100).toFixed(2))), borderColor: COL.teal, backgroundColor: COL.teal, yAxisID: 'y2', tension: .25, po
>       { type: 'bar', label: TR('مطابق'), data: days.map((d) => d.matched), backgroundColor: COL.blue, stack: 's', yAxisID: 'y' },
>       { type: 'bar', label: TR('غير مستلم'), data: days.map((d) => d.unrecv), backgroundColor: COL.bad, stack: 's', yAxisID: 'y' },
>       { type: 'line', label: TR('نسبة المطابقة %'), data: days.map((d) => (d.rate == null ? null : +(d.rate * 100).toFixed(2))), borderColor: COL.teal, backgroundColor: COL.teal, yAxisID: 'y2', tension: .25
<     const hbar = (list, val, color, tick) => chartImg({ type: 'bar', data: { labels: list.map((b) => b.key), datasets: [{ data: list.map(val), backgroundColor: color }] },
>     const hbar = (list, val, color, tick) => chartImg({ type: 'bar', data: { labels: list.map((b) => TR(b.key)), datasets: [{ data: list.map(val), backgroundColor: color }] },
>   ArriveI18n.onChange(() => { const o = document.getElementById('reportOverlay'); if (o && !o.hidden) close(); }); // (i18n) صور الرسوم لا تُترجم بأثر رجعي ⇒ يُغلق التقرير الم�
```
## report-sla.js
```diff
>   const TR = (s) => ArriveI18n.tr(s);  // ترجمة عند العرض فقط (صور الرسوم)
<     pages.push(page('<div class="rp-cover-top"><img class="rp-cover-logo" src="arrive-logo-white.png" alt="ARRIVE"></div><div class="rp-cover-main"><div class="rp-cover-kicker">إدارة المراجعة التشغي�
>     pages.push(page('<div class="rp-cover-top"><img class="rp-cover-logo" src="../arrive-logo-white.png" alt="ARRIVE"></div><div class="rp-cover-main"><div class="rp-cover-kicker">إدارة المراجعة التشغ
<       { type: 'bar', label: 'عدد المرتجعات', data: daysG.map((d) => d.rows), backgroundColor: COL.blue, yAxisID: 'y' },
<       { type: 'line', label: 'متوسط العمر (يوم)', data: daysG.map((d) => (d.avg == null ? null : +d.avg.toFixed(2))), borderColor: COL.teal, backgroundColor: COL.teal, yAxisID: 'y2', tension: .25, pointRad
>       { type: 'bar', label: TR('عدد المرتجعات'), data: daysG.map((d) => d.rows), backgroundColor: COL.blue, yAxisID: 'y' },
>       { type: 'line', label: TR('متوسط العمر (يوم)'), data: daysG.map((d) => (d.avg == null ? null : +d.avg.toFixed(2))), borderColor: COL.teal, backgroundColor: COL.teal, yAxisID: 'y2', tension: .25, poin
<     const imgDist = chartImg({ type: 'bar', data: { labels: BUCKETS.map((b) => b[0]), datasets: [{ data: bcnt, backgroundColor: BUCKETS.map((b) => (t != null && !ages.filter(b[1]).every((a) => a <= t) ? COL.bad : COL.b
>     const imgDist = chartImg({ type: 'bar', data: { labels: BUCKETS.map((b) => TR(b[0])), datasets: [{ data: bcnt, backgroundColor: BUCKETS.map((b) => (t != null && !ages.filter(b[1]).every((a) => a <= t) ? COL.bad : C
<     const imgBr = chartImg({ type: 'bar', data: { labels: top10.map((b) => b.key + ' (' + L(b.rows) + ')'), datasets: [{ data: top10.map((b) => +b.avg.toFixed(2)), backgroundColor: COL.blue }] },
>     const imgBr = chartImg({ type: 'bar', data: { labels: top10.map((b) => TR(b.key) + ' (' + L(b.rows) + ')'), datasets: [{ data: top10.map((b) => +b.avg.toFixed(2)), backgroundColor: COL.blue }] },
```
## live.js
```diff
<         t.toLocaleString('ar-EG', { dateStyle: 'short', timeStyle: 'short' }) + '</span>';
>         t.toLocaleString(ArriveI18n.getLang() === 'en' ? 'en-GB' : 'ar-EG', { dateStyle: 'short', timeStyle: 'short' }) + '</span>';
```
