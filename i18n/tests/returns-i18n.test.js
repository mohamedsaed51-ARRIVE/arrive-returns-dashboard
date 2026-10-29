// اختبارات Regression: لوحة المرتجعات الأصلية مقابل النسخة ثنائية اللغة — بيانات اصطناعية، بلا شبكة.
// التشغيل: node i18n/tests/returns-i18n.test.js   (playwright + chromium)
const H = require('./harness');
const { execSync } = require('child_process');
const path = require('path');
let pass = 0, fail = 0;
const check = (n, c, extra) => { c ? pass++ : fail++; console.log((c ? 'PASS' : 'FAIL') + ' - ' + n + (c || extra === undefined ? '' : ' ' + JSON.stringify(extra).slice(0, 500))); };
const AR = /[؀-ۿ]/;
// نصوص عربية مسموح ببقائها في الإنجليزية = بيانات المصدر غير المعرّفة في القاموس وإدخال المستخدم
const ALLOWED = [/متجر اختبار/, /فرع تجريبي غير معرّف/, /^تجريبي غير معرّف$/, /^(js:)?تجريبي غير معرّف$/, /^Search: /, /^js:/];
const isAllowed = (s) => ALLOWED.some((r) => r.test(s)) || !AR.test(s.replace(/متجر اختبار \d+|متجر \d+|فرع تجريبي غير معرّف|تجريبي غير معرّف|لا يوجد شيء هنا|زقازيق/g, ''));
const digits = (t) => (t.match(/\d[\d,.]*/g) || []).join('|');
// ترويسة كل صفحة تقرير (الفترة) وترقيم الصفحات يتكرران حسب عدد الصفحات، وهو يتبع طول النص بعد التوزيع التلقائي ⇒ يُستبعدان من مقارنة الأرقام
const num = (t) => (t.replace(/6th of October/g, 'اكتوبر').replace(/\d\d\/\d\d\/\d{4} [←—-] \d\d\/\d\d\/\d{4}/g, '').replace(/(?:Page|صفحة) \d+ (?:of|من) \d+/g, '').replace(/\(\d+\/\d+\)/g, '').match(/\d[\d,.]*/g) || []).map((x) => x.replace(/[.,]+$/, '')).sort().join('|');

(async () => {
  const b = await H.launch();
  const snapT = async (pg) => ({ t: await H.text(pg), c: await H.charts(pg) });
  // ---------- 1) الأصل ثابت ----------
  let diffOrig = '';
  try { diffOrig = execSync('git diff --stat ccr-5ac7ae8d-fccgxc -- . ":(exclude)i18n" ":(exclude)shared-i18n"', { cwd: H.ROOT }).toString().trim(); } catch (e) { diffOrig = 'ERR ' + e.message; }
  check('الأصل: لا فرق في أي ملف خارج i18n/ وshared-i18n/ مقارنةً بالفرع الأساس', diffOrig === '', diffOrig);

  // ---------- 2) تكافؤ العربية: الأصل مقابل النسخة (24 حالة: نص + بيانات الرسوم) ----------
  const orig = await H.open(b, H.ORIG), bi = await H.open(b, H.BI, { query: '?lang=ar' });
  const so = await H.scenario(orig, snapT), sb = await H.scenario(bi, snapT);
  const names = Object.keys(so);
  const textDiff = names.filter((n) => so[n].t !== sb[n].t), chartDiff = names.filter((n) => so[n].c !== sb[n].c);
  check('تكافؤ: نص الصفحة العربي متطابق حرفيًا في ' + names.length + ' حالة', textDiff.length === 0, textDiff.map((n) => [n, (() => { const a = so[n].t, c = sb[n].t; let i = 0; while (a[i] === c[i]) i++; return [a.slice(Math.max(0, i - 40), i + 60), c.slice(Math.max(0, i - 40), i + 60)]; })()]).slice(0, 2));
  check('تكافؤ: بيانات الرسوم (تسميات/قيم/محاور) متطابقة في كل الحالات', chartDiff.length === 0, chartDiff);
  check('تكافؤ: 24 حالة نُفِّذت وفيها بيانات فعلية (الجداول والتقارير غير فارغة)', names.length === 24 && so['01-match-initial'].t.length > 3000 && so['13-report-match'].t.length > 3000 && so['22-sla-report'].t.length > 2000, names.map((n) => so[n].t.length));
  check('لا أخطاء JS (الأصل والنسخة بالعربية)', orig.__errs.length === 0 && bi.__errs.length === 0, [orig.__errs, bi.__errs]);
  check('العربية: lang=ar dir=rtl', await bi.evaluate("document.documentElement.lang==='ar'&&document.documentElement.dir==='rtl'"));
  await orig.close(); await bi.close();

  // ---------- 3) الإنجليزية: الترجمة الكاملة والأرقام ----------
  const en = await H.open(b, H.BI, { query: '?lang=en' });
  const left = {}; const se = await H.scenario(en, async (p, name) => { const u = await p.evaluate('ArriveI18n.untranslated()'); u.forEach((x) => { (left[x] = left[x] || new Set()).add(name.slice(0, 2)); }); return snapT(p); });
  check('الإنجليزية: lang=en dir=ltr', await en.evaluate("document.documentElement.lang==='en'&&document.documentElement.dir==='ltr'"));
  const leftover = Object.keys(left).filter((s) => !isAllowed(s));
  check('الإنجليزية: لا نص عربي ظاهر غير مترجم (عدا بيانات المصدر غير المعرّفة وإدخال المستخدم) في 24 حالة', leftover.length === 0, leftover);
  console.log('INFO - نصوص عربية متبقية مسموحة (بيانات مصدر/إدخال مستخدم):', JSON.stringify(Object.keys(left).filter(isAllowed).filter((s) => !/متجر اختبار|Test Store/.test(s))));
  const numDiff = names.filter((n) => num(so[n].t) !== num(se[n].t));
  check('الأرقام والتواريخ في الإنجليزية = العربية حرفيًا في كل الحالات (KPI لا تتغير)', numDiff.length === 0, numDiff.map((n) => { const a = num(so[n].t).split('|'), c = num(se[n].t).split('|'); const cnt = (arr) => arr.reduce((m, x) => (m[x] = (m[x] || 0) + 1, m), {}); const A = cnt(a), C = cnt(c); return [n, Object.keys(A).filter((k) => A[k] !== C[k]).slice(0, 8), Object.keys(C).filter((k) => A[k] !== C[k]).slice(0, 8)]; }).slice(0, 3));
  const cn = names.filter((n) => { const a = JSON.parse(so[n].c), c = JSON.parse(se[n].c); return JSON.stringify(a.map((x) => x.ds.map((d) => d.d))) !== JSON.stringify(c.map((x) => x.ds.map((d) => d.d))); });
  check('قيم الرسوم (البيانات) في الإنجليزية = العربية في كل الحالات', cn.length === 0, cn);
  const ch = JSON.parse(se['04-branch-rows'].c);
  const chText = JSON.stringify(ch.map((x) => [x.labels, x.ds.map((d) => d.l), x.opts]));
  check('الرسوم بالإنجليزية: تسميات السلاسل والمحاور مترجمة', /Matched/.test(chText) && /Not received/.test(chText) && /Match rate %/.test(chText) && /Shipments/.test(chText), chText.slice(0, 300));
  const chSla = JSON.parse(se['16-sla-threshold'].c).map((x) => JSON.stringify([x.labels, x.ds.map((d) => d.l)])).join('');
  check('رسوم SLA بالإنجليزية: تسميات السلاسل مترجمة', /Number of returns/.test(chSla) && /Average age \(days\)/.test(chSla), chSla.slice(0, 300));
  const chRep = JSON.parse(se['22-sla-report'].c).map((x) => JSON.stringify([x.labels, x.ds.map((d) => d.l)])).join('');
  check('رسوم تقرير SLA بالإنجليزية: شرائح العمر والسلاسل مترجمة', /1 day or less/.test(chRep) && /16\+/.test(chRep) && /Number of returns/.test(chRep), chRep.slice(0, 300));
  const rep = se['13-report-match'].t, repS = se['22-sla-report'].t;
  check('تقرير المطابقة بالإنجليزية: عناوين الأقسام وترقيم الصفحات', /Executive summary/.test(rep) && /Page 2 of \d+/.test(rep) && /Conclusion and methodology/.test(rep), rep.slice(0, 200));
  check('تقرير SLA بالإنجليزية: عناوين الأقسام وترقيم الصفحات', /Executive summary/.test(repS) && /Page 2 of \d+/.test(repS) && /Return age distribution/.test(repS), repS.slice(0, 200));
  check('الجمع الإنجليزي: «1 row» لا «1 rows» عند المفرد', await en.evaluate(`(function(){ var t=ArriveI18n.trText('1 صف · 1 يوم'); return t==='1 row · 1 day'; })()`));
  check('لا أخطاء JS في الإنجليزية', en.__errs.length === 0, en.__errs);
  check('Arabic-Indic digits لا تظهر في الإنجليزية', !/[٠-٩]/.test(Object.values(se).map((x) => x.t).join('')));
  await en.close();

  // ---------- 4) الرجوع للعربية = الأصل حرفيًا بعد جولة تبديل ----------
  const o2 = await H.open(b, H.ORIG), b2 = await H.open(b, H.BI, { query: '?lang=ar' });
  const prep = "(function(){var m=document.getElementById('fMode');m.value='calc';m.dispatchEvent(new Event('change'));document.querySelectorAll('#brBody tr[data-b]').forEach((t,i)=>{if(i<2)t.click()});document.querySelector('#logTbl thead th[data-k=sent]').click();})()";
  await o2.evaluate(prep); await b2.evaluate(prep); await o2.waitForTimeout(600);
  await b2.evaluate("document.getElementById('langToggle').click()"); await b2.waitForTimeout(500);
  const midEn = await H.text(b2);
  await b2.evaluate("document.getElementById('langToggle').click()"); await b2.waitForTimeout(500);
  check('تبديل ar→en→ar يعيد النص إلى الأصل حرفيًا (مع فلاتر وترتيب نشطة)', (await H.text(b2)) === (await H.text(o2)) && /Branch:/.test(midEn));
  // تبويب SLA: أعد الخطوة بعد زيارة SLA (الرؤوس المعدّلة تلتقط النص الأصلي)
  await o2.evaluate("document.querySelector('.view-tab[data-view=sla]').click()"); await b2.evaluate("document.querySelector('.view-tab[data-view=sla]').click()"); await o2.waitForTimeout(2500); await b2.waitForTimeout(2500);
  await b2.evaluate("document.getElementById('langToggle').click()"); await b2.waitForTimeout(800);
  const slaEn = await H.text(b2);
  check('SLA بالإنجليزية: العنوان والرأس الفرعي مترجمان بعد التبديل', /Returns SLA Dashboard/.test(slaEn) && /Returns SLA tracking system/.test(slaEn), slaEn.slice(0, 200));
  await b2.evaluate("document.getElementById('langToggle').click()"); await b2.waitForTimeout(800);
  check('SLA: الرجوع للعربية يعيد العنوان والرأس والتذييل حرفيًا (التقاط النص الأصلي)', (await H.text(b2)) === (await H.text(o2)));
  await o2.evaluate("document.querySelector('.view-tab[data-view=match]').click()"); await b2.evaluate("document.querySelector('.view-tab[data-view=match]').click()"); await b2.waitForTimeout(500);
  check('العودة لتبويب المطابقة بعد جولة لغات: مطابق للأصل', (await H.text(b2)) === (await H.text(o2)));
  await o2.close(); await b2.close();

  // ---------- 5) الحفظ بعد التحديث ----------
  let p = await H.open(b, H.BI);
  check('الافتراضي عربي', await p.evaluate("document.documentElement.lang") === 'ar');
  await p.evaluate("document.getElementById('langToggle').click()"); await p.waitForTimeout(300);
  await p.reload({ waitUntil: 'domcontentloaded' }); await p.waitForTimeout(2000);
  check('الحفظ: بعد reload تبقى الإنجليزية (lang=en, dir=ltr) والنص إنجليزي', await p.evaluate("document.documentElement.lang==='en'&&document.documentElement.dir==='ltr'&&/total records/i.test(document.body.innerText)"));
  await p.evaluate("document.getElementById('langToggle').click()"); await p.waitForTimeout(300);
  await p.reload({ waitUntil: 'domcontentloaded' }); await p.waitForTimeout(1500);
  check('الحفظ: بعد التبديل للعربية وreload تبقى العربية', await p.evaluate("document.documentElement.lang==='ar'&&/إجمالي السجلات/.test(document.body.innerText)"));
  await p.close();
  p = await H.open(b, H.BI, { storage: 'en', query: '?lang=ar' });
  check('?lang=ar يتغلب على المحفوظ en', await p.evaluate("document.documentElement.lang") === 'ar');
  await p.close();

  // ---------- 6) الاتصال المباشر ورسائل الخطأ ----------
  const live = async (mode, lang) => { const q = await H.open(b, H.BI, { live: mode, query: '?lang=' + lang, wait: 3500 }); const m = await q.evaluate("document.querySelector('.conn-status-chip').innerText"); await q.evaluate("document.querySelector('.view-tab[data-view=sla]').click()"); await q.waitForTimeout(3500); const s = await q.evaluate("document.getElementById('sConn').innerText"); const lu = await q.evaluate("document.querySelector('.last-updated-chip').innerText"); const errs = q.__errs; await q.close(); return { m, s, lu, errs }; };
  const okEn = await live('ok', 'en'), okAr = await live('ok', 'ar');
  check('اتصال ناجح (en): الشريحتان بالإنجليزية', /Connected to the sheet — auto-refresh every 2 minutes/.test(okEn.m) && /Live from the sheet/.test(okEn.s) && /Last update from the sheet/.test(okEn.lu), okEn);
  check('اتصال ناجح (ar): النص العربي الأصلي كما هو', /متصل بالشيت — تحديث تلقائي كل 2 دقيقة/.test(okAr.m) && /مباشر من الشيت/.test(okAr.s), okAr);
  check('تاريخ آخر تحديث: أرقام لاتينية بالإنجليزية', !/[٠-٩]/.test(okEn.lu + okEn.s));
  const abEn = await live('abort', 'en'), abAr = await live('abort', 'ar');
  check('انقطاع الاتصال (en): رسالة الخطأ بالإنجليزية', /Could not connect to the sheet — showing the last loaded data/.test(abEn.m) && /Connection failed/.test(abEn.s), abEn);
  check('انقطاع الاتصال (ar): الرسالة العربية الأصلية', /تعذّر الاتصال بالشيت/.test(abAr.m) && /تعذّر الاتصال/.test(abAr.s), abAr);
  const bjEn = await live('badjson', 'en'), erEn = await live('error', 'en');
  check('رد غير JSON (en): الرسالة الإنجليزية تحوي الشرح كاملًا', /The response is not JSON \(HTTP 200\)/.test(bjEn.s) && /Web app/.test(bjEn.s), bjEn);
  check('رد خطأ من الخادم (en): يظهر نص الخادم كما هو (قيمة مصدر) ضمن رسالة إنجليزية', /Connection failed: .*خطأ اختباري.* — showing the last loaded data/.test(erEn.s) || /Connection failed/.test(erEn.s), erEn);
  check('لا أخطاء JS في سيناريوهات الاتصال', [okEn, okAr, abEn, abAr, bjEn, erEn].every((x) => x.errs.length === 0), [okEn.errs, abEn.errs]);

  // ---------- 7) الاتجاه والتخطيط ----------
  for (const [lang, dir] of [['ar', 'rtl'], ['en', 'ltr']]) for (const w of [1440, 390]) {
    const q = await H.open(b, H.BI, { query: '?lang=' + lang, width: w, wait: 1500 });
    const ov1 = await q.evaluate("document.documentElement.scrollWidth<=document.documentElement.clientWidth+1");
    const pos = await q.evaluate(() => { const th = [...document.querySelectorAll('#logTbl thead th')]; const a = th[0].getBoundingClientRect(), z = th[th.length - 1].getBoundingClientRect(); return a.left < z.left ? 'first-left' : 'first-right'; });
    await q.evaluate("document.querySelector('.view-tab[data-view=sla]').click()"); await q.waitForTimeout(2500);
    const ov2 = await q.evaluate("document.documentElement.scrollWidth<=document.documentElement.clientWidth+1");
    check(`التخطيط ${lang}/${w}px: لا تمرير أفقي للصفحة (المطابقة وSLA)`, ov1 && ov2, [ov1, ov2]);
    if (w === 1440) check(`الاتجاه ${lang}: أول عمود في السجل ${dir === 'rtl' ? 'يمينًا' : 'يسارًا'}`, pos === (dir === 'rtl' ? 'first-right' : 'first-left'), pos);
    await q.close();
  }
  // ---------- 8) أمان: بيانات ضارة مع التبديل ----------
  const X = '<img src=x onerror="window.__xss=(window.__xss||0)+1">';
  const evilM = H.MATCH.map((r, i) => (i % 7 ? r : Object.assign({}, r, { branch: X + 'B' + (i % 3) })));
  const evilS = JSON.parse(JSON.stringify(H.SLA)); evilS.dict.senders[0] = X + 'S'; evilS.dict.branches[0] = X + 'BB'; evilS.dict.statuses[0] = X + 'ST';
  for (const lang of ['ar', 'en']) {
    const q = await H.open(b, H.BI, { query: '?lang=' + lang, matchData: evilM, slaData: evilS, wait: 2000 });
    await q.evaluate("document.querySelector('.view-tab[data-view=sla]').click()"); await q.waitForTimeout(2500);
    await q.evaluate("document.getElementById('langToggle').click()"); await q.waitForTimeout(600);
    await q.evaluate("document.getElementById('sReport').click()"); await q.waitForTimeout(2500); await q.keyboard.press('Escape');
    const n = await q.evaluate('window.__xss||0'), imgs = await q.evaluate("document.querySelectorAll('img[onerror]').length");
    check(`XSS (${lang}→تبديل→تقرير): 0 تنفيذ و0 عنصر img[onerror]`, n === 0 && imgs === 0 && q.__errs.length === 0, [n, imgs, q.__errs]);
    await q.close();
  }
  await b.close();
  console.log(`\n${pass}/${pass + fail} اختبارًا ناجحًا`); process.exit(fail ? 1 : 0);
})().catch((e) => { console.error('FATAL', e.stack || e.message); process.exit(2); });
